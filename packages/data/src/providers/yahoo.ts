import type { Market, Period, Adjust } from "@trend-iq/shared";
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
import { httpGet, httpGetJson } from "../http-client";
import { MARKET_INDEX_DEFS } from "../market-index-defs";

/**
 * Yahoo Finance 市场编码
 * A股沪市: .SS  深市: .SZ
 * 港股: .HK
 * 美股: 无后缀（直接用ticker）
 */
function toYahooSymbol(code: string, market: Market): string {
  switch (market) {
    case "A-SH":
      return `${code}.SS`;
    case "A-SZ":
      return `${code}.SZ`;
    case "HK":
      return `${code}.HK`;
    case "US-NASDAQ":
    case "US-NYSE":
      return code;
    default:
      return code;
  }
}

/**
 * Yahoo Finance K线 interval 映射
 */
function toYahooInterval(period: Period): string {
  switch (period) {
    case "daily":
      return "1d";
    case "weekly":
      return "1wk";
    case "monthly":
      return "1mo";
    default:
      return "1d";
  }
}

/**
 * Yahoo Finance range 映射
 */
function toYahooRange(period: Period): string {
  switch (period) {
    case "daily":
      return "2y";
    case "weekly":
      return "5y";
    case "monthly":
      return "10y";
    default:
      return "2y";
  }
}

/**
 * 从 Yahoo 市场编码反向解析出 Market
 */
function fromYahooSymbol(yahooSymbol: string): { code: string; market: Market } | null {
  if (yahooSymbol.endsWith(".SS")) {
    return { code: yahooSymbol.replace(".SS", ""), market: "A-SH" };
  }
  if (yahooSymbol.endsWith(".SZ")) {
    return { code: yahooSymbol.replace(".SZ", ""), market: "A-SZ" };
  }
  if (yahooSymbol.endsWith(".HK")) {
    return { code: yahooSymbol.replace(".HK", ""), market: "HK" };
  }
  // 美股：无法区分 NASDAQ/NYSE，默认 NASDAQ
  return { code: yahooSymbol, market: "US-NASDAQ" };
}

/**
 * Yahoo Finance 数据 Provider
 * 免费无需认证，需 User-Agent 头
 * 适合作为 A股/港股/美股 的备用数据源
 */
export class YahooProvider implements DataSource {
  private readonly chartUrl = "https://query1.finance.yahoo.com/v8/finance/chart";
  private readonly searchUrl = "https://query1.finance.yahoo.com/v1/finance/search";

  /**
   * 获取历史K线
   */
  async getKLines(
    code: string,
    market: Market,
    period: Period,
    opts: KLineQueryOptions = {}
  ): Promise<KLine[]> {
    const symbol = toYahooSymbol(code, market);
    const interval = toYahooInterval(period);
    const range = toYahooRange(period);

    const url = `${this.chartUrl}/${symbol}?range=${range}&interval=${interval}&events=div,splits`;

    const resp = await httpGetJson<any>(url);

    if (!resp.chart?.result?.[0]) {
      throw new Error(`Yahoo K线数据为空: ${code}`);
    }

    const result = resp.chart.result[0];
    const timestamps: number[] = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0];
    const adjclose = result.indicators?.adjclose?.[0]?.adjclose;

    if (!quote || timestamps.length === 0) {
      throw new Error(`Yahoo K线数据解析失败: ${code}`);
    }

    // Yahoo 复权：adjclose 存在时用 adjclose 作为 close
    const adjust = opts.adjust ?? "qfq";

    const klines: KLine[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open?.[i];
      const high = quote.high?.[i];
      const low = quote.low?.[i];
      const close = quote.close?.[i];
      const volume = quote.volume?.[i];

      // 跳过空值（节假日等）
      if (open == null || high == null || low == null || close == null) continue;

      // 前复权/后复权：Yahoo 默认返回的是 adjusted 数据（含split调整），
      // adjclose 是完全复权价（含dividend），用于 qfq
      const finalClose = adjust === "qfq" && adjclose?.[i] != null ? adjclose[i] : close;

      klines.push({
        time: timestamps[i] * 1000, // Yahoo 返回秒级，转毫秒
        open,
        high,
        low,
        close: finalClose,
        volume: volume ?? 0,
        amount: 0, // Yahoo 不返回成交额
      });
    }

    return klines;
  }

  /**
   * 获取实时行情
   * Yahoo v8 chart 接口的 meta 字段包含实时价格
   */
  async getQuote(code: string, market: Market): Promise<Quote> {
    const symbol = toYahooSymbol(code, market);
    const url = `${this.chartUrl}/${symbol}?range=1d&interval=1d`;

    const resp = await httpGetJson<any>(url);

    if (!resp.chart?.result?.[0]) {
      throw new Error(`Yahoo 行情数据为空: ${code}`);
    }

    const meta = resp.chart.result[0].meta;
    const price = meta.regularMarketPrice ?? 0;
    const preClose = meta.chartPreviousClose ?? meta.previousClose ?? 0;
    const changeAmount = price - preClose;
    const changePercent = preClose > 0 ? (changeAmount / preClose) * 100 : 0;

    return {
      code,
      name: meta.symbol ?? code,
      price,
      preClose,
      open: meta.regularMarketPrice ?? price,
      high: meta.regularMarketPrice ?? price,
      low: meta.regularMarketPrice ?? price,
      changeAmount,
      changePercent,
      volume: meta.regularMarketVolume ?? 0,
      amount: 0,
      turnoverRate: 0,
      peRatio: 0,
      totalMarketCap: 0,
      circulatingMarketCap: 0,
    };
  }

  /**
   * 获取单支大盘指数（Yahoo 源）
   * 使用 def.codes.yahoo（如 ^IXIC / 000001.SS）调 chart 接口
   */
  async getMarketIndex(def: MarketIndexDef): Promise<MarketIndex | null> {
    const symbol = def.codes.yahoo;
    if (!symbol) return null;
    const url = `${this.chartUrl}/${symbol}?range=1d&interval=1d`;
    try {
      const resp = await httpGetJson<any>(url);
      const result = resp?.chart?.result?.[0];
      if (!result) return null;
      const meta = result.meta;
      const price = meta?.regularMarketPrice ?? 0;
      const preClose = meta?.chartPreviousClose ?? meta?.previousClose ?? 0;
      const changeAmount = price - preClose;
      const changePercent = preClose > 0 ? (changeAmount / preClose) * 100 : 0;
      return {
        group: def.group,
        code: def.id,
        name: def.name,
        price,
        changeAmount,
        changePercent,
      };
    } catch (e) {
      console.warn(`[YH getMarketIndex] ${def.name} 获取失败:`, e);
      return null;
    }
  }

  /**
   * 获取全部大盘指数（Yahoo 源）
   */
  async getMarketIndices(): Promise<MarketIndex[]> {
    const results = await Promise.all(
      MARKET_INDEX_DEFS.map((def) => this.getMarketIndex(def))
    );
    return results.filter((r): r is MarketIndex => r !== null);
  }

  /**
   * 获取 A股涨跌停统计（Yahoo 源不支持，返回 null 继续 fallback）
   */
  async getMarketBreadth(): Promise<MarketBreadth | null> {
    return null;
  }

  /**
   * 获取 A股大盘资金净流入（Yahoo 源不支持，返回 null 继续 fallback）
   */
  async getMarketFundFlow(): Promise<MarketFundFlow | null> {
    return null;
  }

  /** 获取 A股总成交额（Yahoo 源不支持，返回 null 继续 fallback） */
  async getMarketTurnover(): Promise<MarketTurnover | null> {
    return null;
  }

  /**
   * 获取 A股涨跌家数（Yahoo 源不支持，返回 null 继续 fallback）
   */
  async getMarketAdvanceDecline(): Promise<MarketAdvanceDecline | null> {
    return null;
  }

  /**
   * 获取分时数据（Yahoo 暂不支持，返回空）
   */
  async getTrends(code: string, market: Market): Promise<Tick[]> {
    return [];
  }

  /**
   * 搜索标的
   * Yahoo search API: /v1/finance/search?q={keyword}
   */
  async search(keyword: string): Promise<SymbolInfo[]> {
    if (!keyword.trim()) return [];

    const url = `${this.searchUrl}?q=${encodeURIComponent(keyword)}&quotesCount=15&newsCount=0`;

    const resp = await httpGetJson<any>(url);

    if (!resp.quotes) return [];

    return resp.quotes
      .filter((q: any) => q.symbol && q.quoteType === "EQUITY")
      .map((q: any) => {
        const parsed = fromYahooSymbol(q.symbol);
        return {
          code: parsed?.code ?? q.symbol,
          name: q.shortname ?? q.longname ?? q.symbol,
          market: parsed?.market ?? "US-NASDAQ",
        } as SymbolInfo;
      })
      .filter((s: SymbolInfo, i: number, arr: SymbolInfo[]) =>
        arr.findIndex((x) => x.code === s.code && x.market === s.market) === i
      );
  }
}
