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
} from "./types";
import { EastmoneyProvider } from "./providers/eastmoney";
import { TencentProvider } from "./providers/tencent";
import { SinaProvider } from "./providers/sina";
import { YahooProvider } from "./providers/yahoo";
import { LocalCacheProvider } from "./providers/local-cache";
import { THSProvider } from "./providers/ths";
import { MARKET_INDEX_DEFS } from "./market-index-defs";

/**
 * 检测是否在 Tauri 环境中运行
 */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * 数据源管理器
 *
 * 按「方法维度」独立 fallback（部分拼接）：
 * - getKLines / getQuote / getTrends / search 各自独立尝试 providers
 * - 某方法从 A 源拿到数据就不再试 B 源；A 失败才试 B
 * - 同一个方法内不拼接（不混合两源的数据行）
 *
 * 默认优先级：
 *   THS(同花顺) → 本地缓存(Tauri) → 东方财富 → 新浪 → 腾讯 → Yahoo Finance
 * THS 提供最准确的K线/成交额数据（含真实成交额），作为第一优先级。
 * 东财在 sandbox 环境不可用（ERR_EMPTY_RESPONSE），腾讯作为兜底。
 */
export class DataSourceManager implements DataSource {
  private providers: DataSource[];

  constructor(providers?: DataSource[]) {
    if (providers && providers.length > 0) {
      this.providers = providers;
    } else {
      const thsProvider = new THSProvider();
      const onlineProviders = [
        new EastmoneyProvider(),
        new SinaProvider(),
        new TencentProvider(),
        new YahooProvider(),
      ];
      // Tauri 环境优先读本地缓存
      if (isTauri()) {
        this.providers = [thsProvider, new LocalCacheProvider(), ...onlineProviders];
      } else {
        this.providers = [thsProvider, ...onlineProviders];
      }
    }
  }

  async getKLines(
    code: string,
    market: Market,
    period: Period,
    opts?: KLineQueryOptions
  ): Promise<KLine[]> {
    return this.withFallback((p) => p.getKLines(code, market, period, opts), "getKLines");
  }

  async getQuote(code: string, market: Market): Promise<Quote> {
    return this.withFallback((p) => p.getQuote(code, market), "getQuote");
  }

  async getTrends(code: string, market: Market): Promise<Tick[]> {
    return this.withFallback((p) => p.getTrends(code, market), "getTrends");
  }

  async search(keyword: string): Promise<SymbolInfo[]> {
    return this.withFallback((p) => p.search(keyword), "search");
  }

  /**
   * 获取单支大盘指数：逐源兜底（本地缓存 → 东财 → 新浪 → 腾讯 → Yahoo）
   * 某源失败/返回 null 自动试下一个，保证单支指数尽量有数据
   */
  async getMarketIndex(def: MarketIndexDef): Promise<MarketIndex | null> {
    for (const p of this.providers) {
      try {
        const idx = await p.getMarketIndex(def);
        if (idx) return idx;
      } catch (err) {
        console.warn(`[getMarketIndex] ${p.constructor.name} 失败: ${String(err)}`);
      }
    }
    return null;
  }

  /**
   * 获取全部大盘指数：逐支跨源兜底
   * 每支指数独立尝试所有源，某支在所有源都失败时才缺失（不拖累其它支）
   */
  async getMarketIndices(): Promise<MarketIndex[]> {
    const results = await Promise.all(
      MARKET_INDEX_DEFS.map((def) => this.getMarketIndex(def))
    );
    return results.filter((r): r is MarketIndex => r !== null);
  }

  /**
   * 获取 A股涨跌停统计：逐源兜底
   * 仅东方财富实现，其它源返回 null；某源返回非 null 即采用
   */
  async getMarketBreadth(): Promise<MarketBreadth | null> {
    for (const p of this.providers) {
      try {
        const b = await p.getMarketBreadth();
        if (b) return b;
      } catch (err) {
        console.warn(`[getMarketBreadth] ${p.constructor.name} 失败: ${String(err)}`);
      }
    }
    return null;
  }

  /**
   * 获取 A股大盘资金净流入：逐源兜底
   * 仅东方财富实现，其它源返回 null；某源返回非 null 即采用
   */
  async getMarketFundFlow(): Promise<MarketFundFlow | null> {
    for (const p of this.providers) {
      try {
        const f = await p.getMarketFundFlow();
        if (f != null) return f;
      } catch (err) {
        console.warn(`[getMarketFundFlow] ${p.constructor.name} 失败: ${String(err)}`);
      }
    }
    return null;
  }

  /** 获取 A股总成交额（钉死东方财富真实源；其它源不支持返回 null） */
  async getMarketTurnover(): Promise<MarketTurnover | null> {
    for (const p of this.providers) {
      try {
        const t = await p.getMarketTurnover();
        if (t != null) return t;
      } catch (err) {
        console.warn(`[getMarketTurnover] ${p.constructor.name} 失败: ${String(err)}`);
      }
    }
    return null;
  }

  /**
   * 获取 A股涨跌家数：逐源兜底
   * 仅东方财富实现，其它源返回 null；某源返回非 null 即采用
   */
  async getMarketAdvanceDecline(): Promise<MarketAdvanceDecline | null> {
    for (const p of this.providers) {
      try {
        const a = await p.getMarketAdvanceDecline();
        if (a != null) return a;
      } catch (err) {
        console.warn(`[getMarketAdvanceDecline] ${p.constructor.name} 失败: ${String(err)}`);
      }
    }
    return null;
  }

  /**
   * 带容错的数据源调用：按 providers 顺序依次尝试
   * 某个 provider 成功就返回，失败才试下一个
   */
  private async withFallback<T>(
    fn: (p: DataSource) => Promise<T>,
    methodName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const providerName = provider.constructor.name;
      try {
        const result = await fn(provider);
        // 空结果也视为失败，继续尝试下一个
        if (result == null || (Array.isArray(result) && result.length === 0)) {
          console.warn(`[${methodName}] ${providerName} 返回空数据，尝试下一个数据源`);
          continue;
        }
        return result;
      } catch (err) {
        lastError = err as Error;
        console.warn(`[${methodName}] ${providerName} 失败: ${lastError.message}，尝试下一个数据源`);
      }
    }

    throw lastError ?? new Error(`所有数据源均不可用 (${methodName})`);
  }
}

/**
 * 全局数据源管理器单例
 */
let globalManager: DataSourceManager | null = null;

/**
 * 获取全局数据源管理器
 */
export function getDataSource(): DataSource {
  if (!globalManager) {
    globalManager = new DataSourceManager();
  }
  return globalManager;
}

/**
 * 设置全局数据源管理器（用于自定义配置）
 */
export function setDataSource(manager: DataSourceManager): void {
  globalManager = manager;
}

/**
 * 获取大盘指数行情（A股 / 港股 / 美股 / 日韩股）
 * 逐支跨源 fallback：东方财富 → 新浪 → 腾讯 → 雅虎（含本地缓存优先）
 */
export async function getMarketIndices(): Promise<MarketIndex[]> {
  return getDataSource().getMarketIndices();
}

/**
 * 获取 A股涨跌停统计（涨停/跌停家数、连板、炸板、封板率）
 * 逐源 fallback：东方财富（push2ex）→ 其它源（null）
 */
export async function getMarketBreadth(): Promise<MarketBreadth | null> {
  return getDataSource().getMarketBreadth();
}

/**
 * 获取 A股大盘资金净流入（亿元）
 * 逐源 fallback：东方财富（push2）→ 其它源（null）
 */
export async function getMarketFundFlow(): Promise<MarketFundFlow | null> {
  return getDataSource().getMarketFundFlow();
}

/**
 * 获取 A股涨跌家数（上涨/下跌/平盘家数，市场宽度）
 * 逐源 fallback：东方财富（指数行情 f162/f163/f164）→ 其它源（null）
 */
export async function getMarketAdvanceDecline(): Promise<MarketAdvanceDecline | null> {
  return getDataSource().getMarketAdvanceDecline();
}

/**
 * 获取 A股总成交额（今日/昨日/近 N 日序列，亿元）
 * 钉死东方财富真实源：仅东财实现，其它源返回 null；东财可用即采用真实值
 */
export async function getMarketTurnover(): Promise<MarketTurnover | null> {
  return getDataSource().getMarketTurnover();
}
