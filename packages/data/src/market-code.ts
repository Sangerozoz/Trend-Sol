import type { Market, Period, Adjust } from "@trend-iq/shared";

/**
 * 东方财富 secid 编码规则
 * 格式: {市场前缀}.{代码}
 */
export function toSecid(code: string, market: Market): string {
  switch (market) {
    case "A-SH":
      return `1.${code}`;
    case "A-SZ":
      return `0.${code}`;
    case "HK":
      return `116.${code}`;
    case "US-NASDAQ":
      return `105.${code}`;
    case "US-NYSE":
      return `106.${code}`;
    default:
      throw new Error(`未知市场类型: ${market}`);
  }
}

/**
 * 东方财富 klt（K线类型）编码（仅日/周/月）
 */
export function toKlt(period: Period): string {
  switch (period) {
    case "daily":
      return "101";
    case "weekly":
      return "102";
    case "monthly":
      return "103";
    default:
      throw new Error(`未知周期: ${period}`);
  }
}

/**
 * 东方财富 fqt（复权类型）编码
 */
export function toFqt(adjust: Adjust): string {
  switch (adjust) {
    case "none":
      return "0";
    case "qfq":
      return "1";
    case "hfq":
      return "2";
    default:
      return "0";
  }
}

/**
 * 自动识别 A 股市场（根据代码规则）
 * 6 开头 → 沪市；0/3 开头 → 深市；8/4 开头 → 北交所（暂归深市处理）
 */
export function detectAShareMarket(code: string): Market {
  const c = code.charAt(0);
  if (c === "6") return "A-SH";
  if (c === "0" || c === "3") return "A-SZ";
  if (c === "8" || c === "4") return "A-SZ"; // 北交所，暂归深市
  throw new Error(`无法识别的A股代码: ${code}`);
}

/**
 * 按周期自适应的数据拉取配置
 *
 * 默认 lmt=1000 对日线合适，但对月线（2年只有24根）不够，
 * 对1分钟线（1000根仅约4个交易日）也太少。
 * 这里给每个周期设置合适的「时间范围（天）」和「最大根数」。
 *
 * 约定：
 * - rangeDays：从今天往回拉取的天数（自然日）
 * - limit：API 返回的最大 K 线根数
 */
export interface PeriodFetchConfig {
  /** 往回拉取的自然日天数 */
  rangeDays: number;
  /** API 最大返回根数 */
  limit: number;
}

export function getPeriodFetchConfig(period: Period): PeriodFetchConfig {
  switch (period) {
    case "daily":
      // 日线：2年约480根
      return { rangeDays: 730, limit: 1000 };
    case "weekly":
      // 周线：5年约260周
      return { rangeDays: 1825, limit: 600 };
    case "monthly":
      // 月线：10年约120个月
      return { rangeDays: 3650, limit: 200 };
    default:
      return { rangeDays: 730, limit: 1000 };
  }
}

/**
 * 格式化日期为 YYYYMMDD（东方财富接口需要）
 */
export function formatDate(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}
