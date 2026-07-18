import type { Market, Period } from "@trend-iq/shared";
import type {
  DataSource,
  KLine,
  KLineQueryOptions,
  MarketAdvanceDecline,
  MarketBreadth,
  MarketFundFlow,
  MarketTurnover,
  MarketIndex,
  MarketIndexDef,
  Quote,
  SymbolInfo,
  Tick,
} from "../types";

/**
 * 检测是否在 Tauri 环境中运行
 */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Tauri invoke 封装
 */
async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) {
    throw new Error(`invoke 只能在 Tauri 环境调用: ${cmd}`);
  }
  // 动态导入避免浏览器环境报错
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke<T>(cmd, args);
}

/**
 * Rust 后端返回的缓存数据结构
 */
interface CacheData {
  meta: {
    code: string;
    market: string;
    period: string;
    collectedAt: string;
    klineSource: string;
    quoteSource: string;
    expiredAt: string;
  };
  quote: {
    code: string;
    name: string;
    price: number;
    pre_close: number;
    open: number;
    high: number;
    low: number;
    change_amount: number;
    change_percent: number;
    volume: number;
    amount: number;
    turnover_rate?: number;
    pe_ratio?: number;
    total_market_cap?: number;
    circulating_market_cap?: number;
  };
  klines: Array<{
    time: number;
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
    amount?: number;
  }>;
}

interface CachedResult {
  data: CacheData | null;
  expired: boolean;
  exists: boolean;
}

/**
 * 本地缓存 Provider
 *
 * 作为最高优先级数据源：
 * - 命中且未过期 → 返回本地缓存数据
 * - 未命中或过期 → 抛错，让 DataSourceManager fallback 到在线 API（东财→腾讯→Yahoo）
 *
 * 仅在 Tauri 环境可用，浏览器环境直接抛错
 */
export class LocalCacheProvider implements DataSource {
  async getKLines(
    code: string,
    market: Market,
    period: Period,
    opts: KLineQueryOptions = {}
  ): Promise<KLine[]> {
    if (!isTauri()) {
      throw new Error("LocalCacheProvider 仅 Tauri 环境可用");
    }

    const result = await invoke<CachedResult>("get_cached_data", {
      code,
      market,
      period,
    });

    if (!result.data || result.expired) {
      throw new Error(result.exists ? "缓存已过期" : "无本地缓存");
    }

    // 转换字段名（Rust snake_case → TS camelCase）
    return result.data.klines.map((k) => ({
      time: k.time,
      open: k.open,
      close: k.close,
      high: k.high,
      low: k.low,
      volume: k.volume,
      amount: k.amount ?? 0,
    }));
  }

  async getQuote(code: string, market: Market): Promise<Quote> {
    if (!isTauri()) {
      throw new Error("LocalCacheProvider 仅 Tauri 环境可用");
    }

    // 行情缓存跟日线同一份文件，用 daily 周期读取
    const result = await invoke<CachedResult>("get_cached_data", {
      code,
      market,
      period: "daily",
    });

    if (!result.data || result.expired) {
      throw new Error(result.exists ? "行情缓存已过期" : "无行情缓存");
    }

    const q = result.data.quote;
    return {
      code: q.code,
      name: q.name,
      price: q.price,
      preClose: q.pre_close,
      open: q.open,
      high: q.high,
      low: q.low,
      changeAmount: q.change_amount,
      changePercent: q.change_percent,
      volume: q.volume,
      amount: q.amount,
      turnoverRate: q.turnover_rate ?? 0,
      peRatio: q.pe_ratio ?? 0,
      totalMarketCap: q.total_market_cap ?? 0,
      circulatingMarketCap: q.circulating_market_cap ?? 0,
    };
  }

  async getTrends(code: string, market: Market): Promise<Tick[]> {
    // 本地缓存不存储分时数据
    throw new Error("本地缓存不支持分时数据");
  }

  async search(keyword: string): Promise<SymbolInfo[]> {
    // 搜索不走缓存
    throw new Error("本地缓存不支持搜索");
  }

  async getMarketIndex(_def: MarketIndexDef): Promise<MarketIndex | null> {
    // 本地缓存不存储大盘指数
    return null;
  }

  async getMarketIndices(): Promise<MarketIndex[]> {
    return [];
  }

  /**
   * 获取 A股涨跌停统计（本地缓存不存储，返回 null 继续 fallback）
   */
  async getMarketBreadth(): Promise<MarketBreadth | null> {
    return null;
  }

  /**
   * 获取 A股大盘资金净流入（本地缓存不存储，返回 null 继续 fallback）
   */
  async getMarketFundFlow(): Promise<MarketFundFlow | null> {
    return null;
  }

  /**
   * 获取 A股涨跌家数（本地缓存不存储，返回 null 继续 fallback）
   */
  async getMarketAdvanceDecline(): Promise<MarketAdvanceDecline | null> {
    return null;
  }

  /** 获取 A股总成交额（本地缓存不存储，返回 null 继续 fallback） */
  async getMarketTurnover(): Promise<MarketTurnover | null> {
    return null;
  }
}
