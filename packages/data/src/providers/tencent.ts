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
import { getPeriodFetchConfig } from "../market-code";
import { MARKET_INDEX_DEFS } from "../market-index-defs";

/**
 * 成交额量级校正（亿元）：A股沪深两市单日成交额合理区间 800~60000 亿
 * 与 eastmoney.ts 同源逻辑，防止数据源单位漂移导致 1000× 放大/缩小
 */
const TURNOVER_SANE_MIN_YI = 800;
const TURNOVER_SANE_MAX_YI = 60000;
function normalizeTurnoverYi(v: number): number {
  if (v <= 0) return v;
  if (v > TURNOVER_SANE_MAX_YI) return v / 1000;
  if (v < TURNOVER_SANE_MIN_YI) return v * 1000;
  return v;
}

/**
 * 腾讯行情市场编码
 * 格式: {市场前缀}{代码}，如 sh600519, sz000001, hk00700, usAAPL
 */
function toTencentSymbol(code: string, market: Market): string {
  switch (market) {
    case "A-SH":
      return `sh${code}`;
    case "A-SZ":
      return `sz${code}`;
    case "HK":
      return `hk${code}`;
    case "US-NASDAQ":
    case "US-NYSE":
      return `us${code}`;
    default:
      throw new Error(`腾讯行情不支持的市场类型: ${market}`);
  }
}

/**
 * 腾讯 K线周期映射（仅日/周/月）
 */
function toTencentPeriod(period: Period): string {
  switch (period) {
    case "daily":
      return "day";
    case "weekly":
      return "week";
    case "monthly":
      return "month";
    default:
      return "day";
  }
}

/**
 * 腾讯复权类型映射
 */
function toTencentAdjust(adjust: Adjust): string {
  switch (adjust) {
    case "qfq":
      return "qfq";
    case "hfq":
      return "hfq";
    case "none":
      return "";
    default:
      return "qfq";
  }
}

/**
 * 腾讯 K线 API 响应类型
 */
interface TxKLineResponse {
  code: number;
  msg: string;
  data: {
    [symbol: string]: {
      qfqday?: TxKLineItem[];
      hfqday?: TxKLineItem[];
      day?: TxKLineItem[];
      qfqmin?: TxKLineItem[];
      hfqmin?: TxKLineItem[];
      min?: TxKLineItem[];
    };
  };
}

/**
 * 腾讯 K线数据项
 * 格式: [日期, 开盘, 收盘, 最高, 最低, 成交量, 除权信息]
 */
type TxKLineItem = [
  string,    // 日期 "2026-06-29" 或 "2026-06-29 14:30"
  string,    // 开盘
  string,    // 收盘
  string,    // 最高
  string,    // 最低
  string,    // 成交量
  any?       // 除权信息（可选）
];

/**
 * 将腾讯日期字符串转为毫秒时间戳
 */
function parseTencentDate(dateStr: string): number {
  if (dateStr.includes(" ")) {
    // 分钟线: "2026-06-29 14:30"
    return new Date(dateStr.replace(" ", "T") + ":00").getTime();
  }
  // 日线: "2026-06-29"
  return new Date(dateStr + "T00:00:00").getTime();
}

/**
 * 解析腾讯行情字符串
 * 腾讯行情格式（~分隔）: v_sh600519="1~名称~代码~当前价~昨收~今开~成交量(手)~...~日期时间~涨跌额~涨跌幅%~最高~最低~价格/量/额~成交量(手)~成交额(万)~换手率%~市盈率~...";
 *
 * 字段索引对照（已验证）：
 * [1]  名称
 * [2]  代码
 * [3]  当前价
 * [4]  昨收
 * [5]  今开
 * [6]  成交量（手）
 * [30] 日期时间 YYYYMMDDHHmmss
 * [31] 涨跌额
 * [32] 涨跌幅（%）
 * [33] 最高
 * [34] 最低
 * [35] 价格/成交量/成交额（格式: "1193.01/42474/5033838236"）
 * [36] 成交量（手）
 * [37] 成交额（万元）
 * [38] 换手率（%）
 * [39] 市盈率
 * [43] 振幅（%）
 * [44] 流通市值（亿元）
 * [45] 总市值（亿元）
 * [46] 市净率
 */
function parseTencentQuote(text: string, symbol: string): Quote | null {
  // 提取引号内的内容
  const match = text.match(/"([^"]*)"/);
  if (!match || !match[1]) return null;

  const content = match[1];
  const code = symbol.replace(/^(sh|sz|hk|us)/, "");

  // 新版格式（~ 分隔）
  if (content.includes("~")) {
    const fields = content.split("~");
    if (fields.length < 40) return null;

    const name = fields[1];
    const price = parseFloat(fields[3]) || 0;
    const preClose = parseFloat(fields[4]) || 0;
    const open = parseFloat(fields[5]) || 0;
    const volumeHands = parseFloat(fields[6]) || 0; // 成交量（手）
    const changeAmount = parseFloat(fields[31]) || 0;
    const changePercent = parseFloat(fields[32]) || 0;
    const high = parseFloat(fields[33]) || 0;
    const low = parseFloat(fields[34]) || 0;
    const turnoverRate = parseFloat(fields[38]) || 0; // 换手率%
    const peRatio = parseFloat(fields[39]) || 0; // 市盈率
    const circulatingMarketCap = parseFloat(fields[44]) || 0; // 流通市值（亿）
    const totalMarketCap = parseFloat(fields[45]) || 0; // 总市值（亿）
    // 成交量：手 → 股（Quote 类型要求单位是"股"）
    const volume = volumeHands * 100;

    // 成交额：优先从 fields[35] 提取（格式 "1193.01/42474/5033838236"），兜底用 fields[37]（万元）
    let amount = 0;
    const amountParts = fields[35]?.split("/") || [];
    if (amountParts.length >= 3) {
      amount = parseFloat(amountParts[2]) || 0; // 成交额（元）
    } else if (fields[37]) {
      amount = parseFloat(fields[37]) * 10000; // 万元 → 元
    }

    return {
      code,
      name,
      price,
      preClose,
      open,
      high,
      low,
      changeAmount,
      changePercent,
      volume,
      amount,
      turnoverRate,
      peRatio,
      totalMarketCap: totalMarketCap * 100000000, // 亿元 → 元
      circulatingMarketCap: circulatingMarketCap * 100000000,
    };
  }

  // 旧版格式（逗号分隔，极少使用）
  const fields = content.split(",");
  if (fields.length < 10) return null;

  const name = fields[1];
  const preClose = parseFloat(fields[2]) || 0;
  const open = parseFloat(fields[3]) || 0;
  const price = parseFloat(fields[4]) || 0;
  const high = parseFloat(fields[5]) || 0;
  const low = parseFloat(fields[6]) || 0;
  const volume = parseFloat(fields[8]) || 0;
  const amount = parseFloat(fields[9]) || 0;

  const changeAmount = price - preClose;
  const changePercent = preClose > 0 ? (changeAmount / preClose) * 100 : 0;

  return {
    code,
    name,
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

/**
 * 腾讯财经数据 Provider
 * 作为东方财富的备用数据源
 */
export class TencentProvider implements DataSource {
  private readonly klineUrl = "https://web.ifzq.gtimg.cn/appstock/app/fqkline/get";
  private readonly quoteUrl = "https://qt.gtimg.cn/q=";
  private readonly trendsUrl = "https://web.ifzq.gtimg.cn/appstock/app/minute/query";
  private readonly searchUrl = "https://smartbox.gtimg.cn/s3/";

  /**
   * 获取历史K线
   */
  async getKLines(
    code: string,
    market: Market,
    period: Period,
    opts: KLineQueryOptions = {}
  ): Promise<KLine[]> {
    const symbol = toTencentSymbol(code, market);
    const txPeriod = toTencentPeriod(period);
    const txAdjust = toTencentAdjust(opts.adjust ?? "qfq");

    // 按周期自适应拉取根数（与东方财富保持一致）
    const cfg = getPeriodFetchConfig(period);
    const limit = opts.limit ?? cfg.limit;

    // param=sh600519,day,,,120,qfq
    const param = `${symbol},${txPeriod},,,${limit},${txAdjust}`;
    const url = `${this.klineUrl}?param=${encodeURIComponent(param)}`;

    const text = await httpGet(url);

    let resp: TxKLineResponse;
    try {
      resp = JSON.parse(text) as TxKLineResponse;
    } catch {
      throw new Error(`腾讯K线数据解析失败: ${code}`);
    }

    if (resp.code !== 0 || !resp.data || !resp.data[symbol]) {
      throw new Error(`腾讯K线数据为空: ${code}`);
    }

    const symbolData = resp.data[symbol];

    // 根据复权类型选择数据字段
    // 前复权: qfqday / qfqmin
    // 后复权: hfqday / hfqmin
    // 不复权: day / min
    const isMinute = txPeriod.endsWith("min");
    let klineData: TxKLineItem[] | undefined;

    if (txAdjust === "qfq") {
      klineData = isMinute ? symbolData.qfqmin : symbolData.qfqday;
    } else if (txAdjust === "hfq") {
      klineData = isMinute ? symbolData.hfqmin : symbolData.hfqday;
    } else {
      klineData = isMinute ? symbolData.min : symbolData.day;
    }

    // 兜底：如果指定字段为空，尝试 day/qfqday
    if (!klineData || klineData.length === 0) {
      klineData = isMinute
        ? (symbolData.min ?? symbolData.qfqmin)
        : (symbolData.day ?? symbolData.qfqday);
    }

    if (!klineData || klineData.length === 0) {
      throw new Error(`腾讯K线数据为空: ${code}`);
    }

    return klineData.map((item) => {
      const time = parseTencentDate(item[0]);
      const open = parseFloat(item[1]) || 0;
      const close = parseFloat(item[2]) || 0;
      const high = parseFloat(item[3]) || 0;
      const low = parseFloat(item[4]) || 0;
      // 腾讯K线返回的成交量单位是"手"，需 *100 转为"股"
      const volume = (parseFloat(item[5]) || 0) * 100;

      const changeAmount = close - open;
      const changePercent = open > 0 ? (changeAmount / open) * 100 : 0;

      return {
        time,
        open,
        close,
        high,
        low,
        volume,
        // 腾讯K线不直接返回成交额，用成交量(股)*收盘价估算
        amount: volume * close,
        changePercent,
        changeAmount,
      } as KLine;
    });
  }

  /**
   * 获取实时行情
   * 腾讯行情 API 返回 GBK 编码文本，需特殊处理
   */
  async getQuote(code: string, market: Market): Promise<Quote> {
    const symbol = toTencentSymbol(code, market);
    const url = `${this.quoteUrl}${symbol}`;

    // 腾讯行情返回 GBK 编码，不能用普通 httpGet（UTF-8 解码会乱码）
    // 直接用 fetch + TextDecoder 处理
    let text: string;
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      // Tauri 环境：使用注入的 HTTP 客户端
      text = await httpGet(url);
    } else {
      // 浏览器环境：直接访问腾讯接口（实测无 CORS 问题，避免 Vite 代理网络限制）
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      try {
        // 尝试 GBK 解码
        const decoder = new TextDecoder("gbk");
        text = decoder.decode(buffer);
      } catch {
        // 如果不支持 GBK，回退到 UTF-8（名称可能乱码，但数字可用）
        text = new TextDecoder("utf-8").decode(buffer);
      }
    }

    const quote = parseTencentQuote(text, symbol);

    if (!quote) {
      throw new Error(`腾讯行情数据解析失败: ${code}`);
    }

    return quote;
  }

  /**
   * 获取单支大盘指数（腾讯源）
   * 复用 qt.gtimg.cn 行情接口（GBK 解码），数字字段与个股一致
   */
  async getMarketIndex(def: MarketIndexDef): Promise<MarketIndex | null> {
    const symbol = def.codes.tencent;
    if (!symbol) return null;
    const url = `${this.quoteUrl}${symbol}`;
    try {
      let text: string;
      if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
        text = await httpGet(url);
      } else {
        // 浏览器环境：直接访问腾讯接口（实测无 CORS 问题，避免 Vite 代理网络限制）
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        try {
          text = new TextDecoder("gbk").decode(buffer);
        } catch {
          text = new TextDecoder("utf-8").decode(buffer);
        }
      }
      const quote = parseTencentQuote(text, symbol);
      if (!quote) {
        console.warn(`[TX getMarketIndex] ${def.name} 解析失败: quote is null`);
        return null;
      }
      // 防御：腾讯 usXXX 代码可能解析到同名 ETF/基金而非指数
      // （如 usDJIA → Global X Fds Dow 30 Covered Call Etf，现价 22.32，非道指指数）
      // 指数名称不应含 ETF/ETN/Fund/Fds/Trust 字样，命中则视为错标，继续 fallback
      if (/ETF|ETN|Fund|Fds|Trust/i.test(quote.name)) return null;
      const price = quote.price;
      const preClose = quote.preClose;
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
      console.warn(`[TX getMarketIndex] ${def.name} 获取失败:`, e);
      return null;
    }
  }

  /**
   * 获取全部大盘指数（腾讯源）
   */
  async getMarketIndices(): Promise<MarketIndex[]> {
    const results = await Promise.all(
      MARKET_INDEX_DEFS.map((def) => this.getMarketIndex(def))
    );
    return results.filter((r): r is MarketIndex => r !== null);
  }

  /**
   * 获取 A股涨跌停统计（腾讯源不支持，返回 null 继续 fallback）
   */
  async getMarketBreadth(): Promise<MarketBreadth | null> {
    return null;
  }

  /**
   * 获取 A股大盘资金净流入（腾讯源不支持，返回 null 继续 fallback）
   */
  async getMarketFundFlow(): Promise<MarketFundFlow | null> {
    return null;
  }

  /** 获取 A股总成交额（腾讯源不支持，返回 null 继续 fallback） */
  /**
   * 获取 A股总成交额（腾讯源，亿元）
   * - 今日：上证(000001)+深证(399001) 指数实时成交额（qt.gtimg.cn Field[35] 第三段，单位元，真实值）
   * - 昨日 / 序列：腾讯 K线无成交额字段，返回 null（由东财源提供）
   * - 腾讯实时行情在 sandbox 环境可达（已验证），东财不可用时作为兜底
   */
  async getMarketTurnover(): Promise<MarketTurnover | null> {
    try {
      const [shQuote, szQuote] = await Promise.all([
        this.getQuote("000001", "A-SH"),
        this.getQuote("399001", "A-SZ"),
      ]);
      const todayYi = normalizeTurnoverYi((shQuote.amount + szQuote.amount) / 1e8);
      if (todayYi == null || todayYi <= 0) return null;
      return { today: todayYi, yesterday: null, series: [], updateTime: Date.now() };
    } catch (e) {
      console.warn("[TX getMarketTurnover] 获取失败:", e);
      return null;
    }
  }

  /**
   * 获取 A股涨跌家数（腾讯源）
   * - 从上证(000001)+深证(399001)指数实时行情中提取涨跌家数
   * - 腾讯 qt.gtimg.cn 字段：index 49 后的复合字段 "current/volume/amount~volume~amountWan~..."
   *   实际涨跌家数需要从东财获取，腾讯行情接口不直接暴露这些字段
   * - 因此返回 null，由东财源提供涨跌家数数据
   */
  async getMarketAdvanceDecline(): Promise<MarketAdvanceDecline | null> {
    // 腾讯实时行情接口不暴露涨跌家数字段，需由东财提供
    return null;
  }

  /**
   * 获取分时数据
   */
  async getTrends(code: string, market: Market): Promise<Tick[]> {
    const symbol = toTencentSymbol(code, market);
    const url = `${this.trendsUrl}?code=${symbol}`;

    const text = await httpGet(url);

    let resp: any;
    try {
      resp = JSON.parse(text);
    } catch {
      throw new Error(`腾讯分时数据解析失败: ${code}`);
    }

    if (!resp.data || !resp.data[symbol]) {
      return [];
    }

    const trendsData = resp.data[symbol];
    const preClose = parseFloat(trendsData.preClose) || 0;
    const trends: string[] = trendsData.trends || [];

    let cumVolume = 0;
    let cumAmount = 0;

    return trends.map((line) => {
      const parts = line.split(",");
      // 格式: "2026-07-01 09:30,price,avgPrice,volume,amount"
      const timeStr = parts[0];
      const price = parseFloat(parts[1]) || 0;
      const avgPrice = parseFloat(parts[2]) || 0;
      const volume = parseFloat(parts[3]) || 0;
      const amount = parseFloat(parts[4]) || 0;

      cumVolume += volume;
      cumAmount += amount;

      return {
        time: new Date(timeStr.replace(" ", "T") + ":00").getTime(),
        price,
        avgPrice: avgPrice || preClose,
        volume: cumVolume,
        amount: cumAmount,
      } as Tick;
    });
  }

  /**
   * 搜索标的
   * 腾讯搜索 API 返回格式特殊，这里用简单的解析
   */
  async search(keyword: string): Promise<SymbolInfo[]> {
    if (!keyword.trim()) return [];

    const url = `${this.searchUrl}?q=${encodeURIComponent(keyword)}&t=all`;
    const text = await httpGet(url);

    // 腾讯搜索返回格式: v_hint="[...,["sh600519","贵州茅台"],...]";
    const match = text.match(/"(\[.*\])"/);
    if (!match || !match[1]) return [];

    let items: any[];
    try {
      items = JSON.parse(match[1]);
    } catch {
      return [];
    }

    if (!Array.isArray(items)) return [];

    return items
      .filter((item) => Array.isArray(item) && item.length >= 2)
      .map((item) => {
        const txSymbol = item[0] as string;
        const name = item[1] as string;

        let market: Market;
        let code: string;

        if (txSymbol.startsWith("sh")) {
          market = "A-SH";
          code = txSymbol.substring(2);
        } else if (txSymbol.startsWith("sz")) {
          market = "A-SZ";
          code = txSymbol.substring(2);
        } else if (txSymbol.startsWith("hk")) {
          market = "HK";
          code = txSymbol.substring(2);
        } else if (txSymbol.startsWith("us")) {
          market = "US-NASDAQ";
          code = txSymbol.substring(2);
        } else {
          // 跳过无法识别的（如指数、基金）
          return null;
        }

        return { code, name, market } as SymbolInfo;
      })
      .filter((item): item is SymbolInfo => item !== null);
  }
}
