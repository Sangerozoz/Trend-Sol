import type { MarketIndexDef } from "./types";

/**
 * 大盘指数统一定义表
 * 每支指数携带东方财富 / 腾讯 / 新浪 / 雅虎 四套代码，供逐支跨源 fallback 使用。
 * 顺序即页面展示顺序（A股 → 港股 → 美股 → 日韩股）。
 *
 * 新浪财经指数代码用 `s_` 前缀紧凑格式（名称,现价,涨跌额,涨跌幅,成交量,成交额）：
 *   - A股指数：s_sh000001 / s_sz399001 / s_sz399006 / s_sh000300 / s_sh000688（标准可靠）
 *   - 港股/美股/日韩：s_ 代码为最佳猜测；若新浪无数据会自动 fallback 到雅虎（^HSI/^IXIC/^N225/^KS11）
 */
export const MARKET_INDEX_DEFS: MarketIndexDef[] = [
  // ===== A股 =====
  {
    id: "sh000001",
    group: "A股",
    name: "上证指数",
    codes: { eastmoney: "1.000001", tencent: "sh000001", sina: "sh000001", yahoo: "000001.SS" },
  },
  {
    id: "sz399001",
    group: "A股",
    name: "深证成指",
    codes: { eastmoney: "0.399001", tencent: "sz399001", sina: "sz399001", yahoo: "399001.SZ" },
  },
  {
    id: "sz399006",
    group: "A股",
    name: "创业板指",
    codes: { eastmoney: "0.399006", tencent: "sz399006", sina: "sz399006", yahoo: "399006.SZ" },
  },
  {
    id: "sh000300",
    group: "A股",
    name: "沪深300",
    codes: { eastmoney: "1.000300", tencent: "sh000300", sina: "sh000300", yahoo: "000300.SS" },
  },
  {
    id: "sh000688",
    group: "A股",
    name: "科创50",
    codes: { eastmoney: "1.000688", tencent: "sh000688", sina: "sh000688", yahoo: "000688.SS" },
  },
  // ===== 港股（仅保留恒生指数，作为辅助信息）=====
  {
    id: "hkHSI",
    group: "港股",
    name: "恒生指数",
    codes: { eastmoney: "100.HSI", tencent: "hkHSI", sina: "hkHSI", yahoo: "^HSI" },
  },
  // ===== 美股 =====
  {
    id: "usDJIA",
    group: "美股",
    name: "道琼斯",
    codes: { eastmoney: "100.DJIA", tencent: "usDJI", sina: "usDJI", yahoo: "^DJI" },
  },
  {
    id: "usIXIC",
    group: "美股",
    name: "纳斯达克",
    codes: { eastmoney: "100.IXIC", tencent: "usIXIC", sina: "usIXIC", yahoo: "^IXIC" },
  },
  {
    id: "usSPX",
    group: "美股",
    name: "标普500",
    codes: { eastmoney: "100.SPX", tencent: "usSPX", sina: "usSPX", yahoo: "^GSPC" },
  },
  // ===== 日韩股 =====
  {
    id: "jpN225",
    group: "日韩股",
    name: "日经225",
    codes: { eastmoney: "100.N225", tencent: "usN225", sina: "jpN225", yahoo: "^N225" },
  },
  {
    id: "krKS11",
    group: "日韩股",
    name: "韩国KOSPI",
    codes: { eastmoney: "100.KS11", tencent: "usKS11", sina: "krKS11", yahoo: "^KS11" },
  },
];
