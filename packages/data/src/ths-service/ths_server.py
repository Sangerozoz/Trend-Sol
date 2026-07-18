#!/usr/bin/env python3
"""
THS 数据服务 - 提供 K线/行情数据的 HTTP 接口
供 Trend IQ TypeScript 代码通过 fetch 调用

注意事项：
- 游客账户在部分专业数据/实时数据上可能有权限限制
- 批量拉取时加 time.sleep(0.5) 避免限流（已内置限流逻辑）
- THS 为同步阻塞，本服务使用单线程 HTTPServer
"""
import json
import sys
import time
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime
from zoneinfo import ZoneInfo

from thsdk import THS

# 常量
THSCODE_MAP = {
    "000001_A-SH": "USHI1A0001",
    "399001_A-SZ": "USZI399001",
    "399006_A-SZ": "USZI399006",
    "000688_A-SH": "USHI000688",
    "000300_A-SH": "USHI000300",
    "000905_A-SH": "USHI000905",
    "000016_A-SH": "USHI000016",
}

PORT = 1422
tz = ZoneInfo('Asia/Shanghai')

# 限流锁：THS SDK 批量拉取时建议加 time.sleep(0.5) 避免限流
_ths_lock = threading.Lock()
_last_query_time = 0

def ths_query_with_rate_limit(ths, method, *args, **kwargs):
    """带限流的 THS 查询"""
    global _last_query_time
    with _ths_lock:
        # 确保距离上次查询至少 500ms（避免限流）
        elapsed = time.time() - _last_query_time
        if elapsed < 0.5:
            time.sleep(0.5 - elapsed)
        
        result = getattr(ths, method)(*args, **kwargs)
        _last_query_time = time.time()
        return result


class THSHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        try:
            if path == "/health":
                self.send_json({"status": "ok", "service": "ths-data"})
            elif path == "/klines":
                self.handle_klines(params)
            elif path == "/market_turnover":
                self.handle_market_turnover(params)
            elif path == "/market_index":
                self.handle_market_index(params)
            else:
                self.send_error(404, "Not Found")
        except Exception as e:
            self.send_error(500, str(e))

    def handle_klines(self, params):
        code = params.get("code", [""])[0]
        market = params.get("market", [""])[0]
        period = params.get("period", ["daily"])[0]
        limit = int(params.get("limit", ["20"])[0])

        thscode = THSCODE_MAP.get(f"{code}_{market}", code)
        interval_map = {"daily": "day", "weekly": "week", "monthly": "month"}
        interval = interval_map.get(period, "day")

        with THS() as ths:
            resp = ths_query_with_rate_limit(ths, "klines", thscode, interval=interval, count=limit)
            if resp.success:
                df = resp.df
                klines = []
                for _, row in df.iterrows():
                    ts = int(row["时间"].timestamp()) if hasattr(row["时间"], 'timestamp') else 0
                    klines.append({
                        "timestamp": ts,
                        "date": str(row["时间"]),
                        "open": float(row["开盘价"]),
                        "high": float(row["最高价"]),
                        "low": float(row["最低价"]),
                        "close": float(row["收盘价"]),
                        "volume": float(row["成交量"]),
                        "amount": float(row["总金额"]),
                    })
                self.send_json({"ok": True, "data": klines})
            else:
                self.send_json({"ok": False, "error": resp.error})

    def handle_market_turnover(self, params):
        limit = int(params.get("limit", ["20"])[0])

        with THS() as ths:
            # 上证K线
            sh_resp = ths_query_with_rate_limit(ths, "klines", "USHI1A0001", interval="day", count=limit)
            # 深证K线（间隔 100ms 避免限流）
            sz_resp = ths_query_with_rate_limit(ths, "klines", "USZI399001", interval="day", count=limit)

            if sh_resp.success and sz_resp.success:
                sh_df = sh_resp.df
                sz_df = sz_resp.df
                n = min(len(sh_df), len(sz_df), limit)

                series = []
                for i in range(n):
                    sh_amt = float(sh_df.iloc[-(n-i)]['总金额'])
                    sz_amt = float(sz_df.iloc[-(n-i)]['总金额'])
                    series.append({
                        "date": str(sh_df.iloc[-(n-i)]['时间']),
                        "value": round((sh_amt + sz_amt) / 1e8, 2)
                    })

                today = series[-1]["value"] if series else None
                yesterday = series[-2]["value"] if len(series) >= 2 else None

                self.send_json({
                    "ok": True,
                    "data": {
                        "today": today,
                        "yesterday": yesterday,
                        "series": series,
                        "updateTime": int(datetime.now(tz).timestamp() * 1000)
                    }
                })
            else:
                error = sh_resp.error if not sh_resp.success else sz_resp.error
                self.send_json({"ok": False, "error": error})

    def handle_market_index(self, params):
        code = params.get("code", [""])[0]
        market = params.get("market", [""])[0]
        thscode = THSCODE_MAP.get(f"{code}_{market}")
        if not thscode:
            self.send_json({"ok": False, "error": f"未知指数: {code}_{market}"})
            return

        with THS() as ths:
            resp = ths_query_with_rate_limit(ths, "klines", thscode, interval="day", count=2)
            if resp.success and len(resp.df) >= 1:
                df = resp.df
                last = df.iloc[-1]
                prev = df.iloc[-2] if len(df) >= 2 else last

                price = float(last['收盘价'])
                prev_close = float(prev['收盘价'])
                change = price - prev_close
                change_pct = (change / prev_close * 100) if prev_close else 0

                self.send_json({
                    "ok": True,
                    "data": {
                        "price": price,
                        "prevClose": prev_close,
                        "change": round(change, 2),
                        "changePercent": round(change_pct, 2),
                        "open": float(last['开盘价']),
                        "high": float(last['最高价']),
                        "low": float(last['最低价']),
                        "volume": float(last['成交量']),
                        "amount": float(last['总金额']),
                    }
                })
            else:
                self.send_json({"ok": False, "error": resp.error or "数据不足"})

    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def log_message(self, format, *args):
        pass  # 静默日志


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    server = HTTPServer(('127.0.0.1', port), THSHandler)
    print(f"THS 数据服务启动: http://127.0.0.1:{port}")
    print(f"端点: /health, /klines, /market_turnover, /market_index")
    print(f"限流策略: 每次查询间隔 >= 500ms")
    server.serve_forever()


if __name__ == "__main__":
    main()
