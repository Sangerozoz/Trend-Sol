/**
 * 市场类型
 */
export type Market = "A-SH" | "A-SZ" | "HK" | "US-NASDAQ" | "US-NYSE";

/**
 * K线周期（仅日/周/月，不再支持分钟线）
 */
export type Period = "daily" | "weekly" | "monthly";

/**
 * 复权类型
 */
export type Adjust = "none" | "qfq" | "hfq";

/**
 * 市场中文名称
 */
export const MARKET_LABELS: Record<Market, string> = {
  "A-SH": "沪A",
  "A-SZ": "深A",
  HK: "港股",
  "US-NASDAQ": "美股(NASDAQ)",
  "US-NYSE": "美股(NYSE)",
};

/**
 * 周期中文名称
 */
export const PERIOD_LABELS: Record<Period, string> = {
  daily: "日线",
  weekly: "周线",
  monthly: "月线",
};

/**
 * 复权中文名称
 */
export const ADJUST_LABELS: Record<Adjust, string> = {
  none: "不复权",
  qfq: "前复权",
  hfq: "后复权",
};

/**
 * 货币符号
 */
export const CURRENCY_SYMBOLS: Record<Market, string> = {
  "A-SH": "¥",
  "A-SZ": "¥",
  HK: "HK$",
  "US-NASDAQ": "$",
  "US-NYSE": "$",
};

/**
 * 判断是否为 A 股市场
 */
export function isAShare(market: Market): boolean {
  return market === "A-SH" || market === "A-SZ";
}

/**
 * 判断是否为美股市场
 */
export function isUSMarket(market: Market): boolean {
  return market === "US-NASDAQ" || market === "US-NYSE";
}
