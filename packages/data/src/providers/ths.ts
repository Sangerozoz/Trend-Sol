/**
 * THS (同花顺) 数据 Provider
 * 通过本地 Python HTTP 服务调用 thsdk 获取数据
 * 服务地址：http://127.0.0.1:1422
 */
import type { Market, Period } from "@trend-iq/shared";
import type {
  DataSource,
  KLine,
  KLineQueryOptions,
  MarketAdvanceDecline,
  MarketBreadth,
  MarketFundFlow,
  MarketIndex,
  MarketIndexDef,
  MarketTurnover,
  Quote,
  SymbolInfo,
  Tick,
} from "../types";

const THS_SERVICE_URL = "http://127.0.0.1:1422";

// THS 指数代码映射
const THS_INDEX_MAP: Record<string, string> = {
  "1.000001": "USHI1A0001",   // 上证指数
  "0.399001": "USZI399001",   // 深证成指
  "0.399006": "USZI399006",   // 创业板指
  "1.000688": "USHI000688",   // 科创50
  "1.000300": "USHI000300",   // 沪深300
  "1.000905": "USHI000905",   // 中证500
  "1.000016": "USHI000016",   // 上证50
};

interface THSKLineResponse {
  ok: boolean;
  data?: Array<{ timestamp: number; date: string; open: number; high: number; low: number; close: number; volume: number; amount: number }>;
  error?: string;
}

interface THSTurnoverResponse {
  ok: boolean;
  data?: { today: number | null; yesterday: number | null; series: Array<{ date: string; value: number }>; updateTime: number };
  error?: string;
}

interface THSIndexResponse {
  ok: boolean;
  data?: { price: number; prevClose: number; change: number; changePercent: number; open: number; high: number; low: number; volume: number; amount: number };
  error?: string;
}

function normalizeTurnoverYi(v: number): number {
  if (v <= 0) return v;
  if (v > 60000) return v / 1000;
  if (v < 800) return v * 1000;
  return v;
}

export class THSProvider implements DataSource {
  private readonly baseUrl: string;

  constructor(baseUrl: string = THS_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      return (await resp.json()).status === "ok";
    } catch { return false; }
  }

  async getKLines(code: string, market: Market, period: Period, opts?: KLineQueryOptions): Promise<KLine[]> {
    const limit = opts?.limit ?? 20;
    const resp = await fetch(`${this.baseUrl}/klines?code=${code}&market=${market}&period=${period}&limit=${limit}`);
    const data: THSKLineResponse = await resp.json();
    if (!data.ok || !data.data) throw new Error(`THS K线获取失败: ${data.error}`);
    return data.data.map((item) => ({
      time: item.timestamp || new Date(item.date).getTime(),
      open: item.open, high: item.high, low: item.low, close: item.close,
      volume: item.volume, amount: item.amount,
    }));
  }

  async getQuote(code: string, market: Market): Promise<Quote> {
    const resp = await fetch(`${this.baseUrl}/market_index?code=${code}&market=${market}`);
    const data: THSIndexResponse = await resp.json();
    if (!data.ok || !data.data) throw new Error(`THS 行情获取失败: ${data.error}`);
    const d = data.data;
    return {
      code, name: "", price: d.price, preClose: d.prevClose,
      open: d.open, high: d.high, low: d.low,
      changeAmount: d.change, changePercent: d.changePercent,
      volume: d.volume, amount: d.amount,
      turnoverRate: 0, peRatio: 0, totalMarketCap: 0, circulatingMarketCap: 0,
    };
  }

  async getMarketTurnover(): Promise<MarketTurnover | null> {
    try {
      const resp = await fetch(`${this.baseUrl}/market_turnover?limit=20`, { signal: AbortSignal.timeout(10000) });
      const data: THSTurnoverResponse = await resp.json();
      if (!data.ok || !data.data) { console.warn("[THS] turnover失败:", data.error); return null; }
      const d = data.data;
      return {
        today: d.today != null ? normalizeTurnoverYi(d.today) : null,
        yesterday: d.yesterday != null ? normalizeTurnoverYi(d.yesterday) : null,
        series: d.series.map((s) => normalizeTurnoverYi(s.value)),
        updateTime: d.updateTime,
      };
    } catch (e) { console.warn("[THS] turnover失败:", e); return null; }
  }

  async getMarketIndex(def: MarketIndexDef): Promise<MarketIndex | null> {
    try {
      const emCode = def.codes.eastmoney; // 如 "1.000001"
      const resp = await fetch(`${this.baseUrl}/market_index?code=${emCode.split(".")[1]}&market=A-${emCode.startsWith("1.") ? "SH" : "SZ"}`, { signal: AbortSignal.timeout(5000) });
      const data: THSIndexResponse = await resp.json();
      if (!data.ok || !data.data) return null;
      const d = data.data;
      return { group: def.group, code: def.id, name: def.name, price: d.price, changePercent: d.changePercent, changeAmount: d.change };
    } catch { return null; }
  }

  async getMarketIndices(): Promise<MarketIndex[]> { return []; }
  async search(_query: string): Promise<SymbolInfo[]> { return []; }
  async getTrends(_code: string, _market: Market): Promise<Tick[]> { return []; }
  async getMarketBreadth(): Promise<MarketBreadth | null> { return null; }
  async getMarketAdvanceDecline(): Promise<MarketAdvanceDecline | null> { return null; }
  async getMarketFundFlow(): Promise<MarketFundFlow | null> { return null; }
}
