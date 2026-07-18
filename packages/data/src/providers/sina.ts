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
import { httpGet } from "../http-client";

/**
 * 新浪财经数据源
 *
 * - 实时行情：`https://hq.sinajs.cn/list=<symbol>`（GBK 编码，需 Referer: finance.sina.com.cn）
 *   - 个股：`sh600000` / `sz000001` / `hk00700` / `gb_aapl`
 *   - 指数：用 `s_<code>` 紧凑格式（名称,现价,涨跌额,涨跌幅,成交量,成交额）
 * - 大盘指数用定义中的名称（避免 GBK 中文乱码），仅取数值字段
 * - 新浪不提供 K线 / 分时 / 搜索，这些方法返回空，交给其它源兜底
 */
function toSinaSymbol(code: string, market: Market): string {
  switch (market) {
    case "A-SH":
      return `sh${code}`;
    case "A-SZ":
      return `sz${code}`;
    case "HK":
      return `hk${code}`;
    case "US-NASDAQ":
    case "US-NYSE":
      return `gb_${code.toLowerCase()}`;
    default:
      return `sh${code}`;
  }
}

export class SinaProvider implements DataSource {
  private readonly baseUrl = "https://hq.sinajs.cn/list=";

  /** 解析新浪返回的文本，提取引号内字段数组 */
  private parseFields(text: string): string[] | null {
    const m = text.match(/="([^"]*)"/);
    if (!m) return null;
    return m[1].split(",");
  }

  async getQuote(code: string, market: Market): Promise<Quote> {
    const symbol = toSinaSymbol(code, market);
    const text = await httpGet(`${this.baseUrl}${symbol}`);
    const f = this.parseFields(text);
    if (!f || f.length < 6) throw new Error("新浪行情格式错误");
    // 格式：名称,今开,昨收,现价,最高,最低,竞买,竞卖,成交量(股),成交额,...
    const price = parseFloat(f[3]);
    const preClose = parseFloat(f[2]);
    const open = parseFloat(f[1]);
    const high = parseFloat(f[4]);
    const low = parseFloat(f[5]);
    const volume = parseFloat(f[8]) || 0;
    const amount = parseFloat(f[9]) || 0;
    const changeAmount = price - preClose;
    const changePercent = preClose > 0 ? (changeAmount / preClose) * 100 : 0;
    if (!isFinite(price) || price <= 0) throw new Error("新浪行情数值异常");
    return {
      code,
      name: f[0] || code,
      price,
      preClose,
      open,
      high,
      low,
      changeAmount,
      changePercent,
      volume,
      amount,
      turnoverRate: 0,
      peRatio: 0,
      totalMarketCap: 0,
      circulatingMarketCap: 0,
    };
  }

  async getMarketIndex(def: MarketIndexDef): Promise<MarketIndex | null> {
    const sinaCode = def.codes.sina;
    if (!sinaCode) return null;
    try {
      const text = await httpGet(`${this.baseUrl}s_${sinaCode}`);
      const f = this.parseFields(text);
      // s_ 紧凑格式：名称,现价,涨跌额,涨跌幅,成交量(手),成交额
      if (!f || f.length < 4) return null;
      const price = parseFloat(f[1]);
      const changeAmount = parseFloat(f[2]);
      const changePercent = parseFloat(f[3]);
      if (!isFinite(price) || price <= 0) return null;
      return {
        group: def.group,
        code: def.id,
        name: def.name, // 用定义名称，避免 GBK 乱码
        price,
        changeAmount: isFinite(changeAmount) ? changeAmount : 0,
        changePercent: isFinite(changePercent) ? changePercent : 0,
      };
    } catch {
      return null;
    }
  }

  async getMarketIndices(): Promise<MarketIndex[]> {
    const { MARKET_INDEX_DEFS } = await import("../market-index-defs");
    const results = await Promise.all(
      MARKET_INDEX_DEFS.map((def) => this.getMarketIndex(def))
    );
    return results.filter((r): r is MarketIndex => r !== null);
  }

  /**
   * 获取 A股涨跌停统计（新浪源不支持，返回 null 继续 fallback）
   */
  async getMarketBreadth(): Promise<MarketBreadth | null> {
    return null;
  }

  /**
   * 获取 A股大盘资金净流入（新浪源不支持，返回 null 继续 fallback）
   */
  async getMarketFundFlow(): Promise<MarketFundFlow | null> {
    return null;
  }

  /** 获取 A股总成交额（新浪源不支持，返回 null 继续 fallback） */
  async getMarketTurnover(): Promise<MarketTurnover | null> {
    return null;
  }

  /**
   * 获取 A股涨跌家数（新浪源不支持，返回 null 继续 fallback）
   */
  async getMarketAdvanceDecline(): Promise<MarketAdvanceDecline | null> {
    return null;
  }

  async getKLines(
    _code: string,
    _market: Market,
    _period: Period,
    _opts?: KLineQueryOptions
  ): Promise<KLine[]> {
    return [];
  }

  async getTrends(_code: string, _market: Market): Promise<Tick[]> {
    return [];
  }

  async search(_keyword: string): Promise<SymbolInfo[]> {
    return [];
  }
}
