import type { Market, Period } from "@trend-iq/shared";
import type {
  DataSource,
  KLine,
  KLineQueryOptions,
  MarketAdvanceDecline,
  MarketBreadth,
  MarketFundFlow,
  MarketIndex,
  MarketTurnover,
  MarketIndexDef,
  Quote,
  SymbolInfo,
  Tick,
} from "../types";
import { httpGet, httpGetJson } from "../http-client";
import { toSecid, toKlt, toFqt, formatDate, getPeriodFetchConfig } from "../market-code";
import { MARKET_INDEX_DEFS } from "../market-index-defs";

/**
 * 东方财富 API 响应类型
 */
interface EmKLineResponse {
  rc: number;
  rt: number;
  mt: null;
  data?: {
    code: string;
    name: string;
    klines: string[];
  };
}

interface EmQuoteResponse {
  rc: number;
  data?: {
    f43: number; // 最新价
    f44: number; // 最高
    f45: number; // 最低
    f46: number; // 开盘
    f47: number; // 成交量
    f48: number; // 成交额
    f50: number; // 量比
    f51: number; // 涨停价
    f52: number; // 跌停价
    f55: number; // 换手率
    f57: string; // 代码
    f58: string; // 名称
    f60: number; // 昨收
    f116: number; // 总市值
    f117: number; // 流通市值
    f162: number; // 市盈率（个股）；指数口径为「上涨家数」
    f163: number; // 指数口径为「下跌家数」
    f164: number; // 指数口径为「平盘家数」
    f167: number; // 涨跌幅
    f168: number; // 涨跌额
    f169: number; // 涨跌额
    f170: number; // 涨跌幅
  };
}

interface EmSearchItem {
  Code: string;
  Name: string;
  PinYin: string;
  Classify: string; // "AStock" | "Index" | "HKStock" | "USStock" | "OTCFUND" | ...
  MarketType: string; // "1"=沪, "2"=深, 其他=港/美
  SecurityTypeName: string;
  QuoteID: string; // "1.600519" 直接可用作 secid
  MktNum: string;
}

interface EmSearchResponse {
  QuotationCodeTable?: {
    Data?: EmSearchItem[];
    Status: number;
    Message: string;
    TotalCount: number;
  };
}

interface EmTrendsResponse {
  data?: {
    trends: string[];
    preClose: number;
  };
}

/** 东方财富涨停/跌停股票池单项 */
interface EmZTPoolItem {
  /** 名称 */
  n?: string;
  /** 代码 */
  c?: string;
  /** 连板数 */
  lbc?: number | string;
  /** 炸板次数 */
  zbc?: number | string;
  [key: string]: unknown;
}

/** 东方财富涨停/跌停股票池响应 */
interface EmZTPoolResponse {
  rc?: number;
  data?: {
    pool?: EmZTPoolItem[];
  } | null;
}

/** 东方财富资金流向列表响应（ulist.np/get） */
interface EmFundFlowResponse {
  rc?: number;
  data?: {
    diff?: Array<{ f62?: number; f184?: number }>;
  };
}

/**
 * 解析东方财富 K线字符串
 * 格式: "date,open,close,high,low,volume,amount,amplitude,changePercent,changeAmount,turnoverRate"
 */
function parseKLineString(line: string, market: Market): KLine {
  const parts = line.split(",");
  // 东方财富返回的日期格式 "2024-01-02" 或 "2024-01-02 09:30"
  const dateStr = parts[0];
  let time: number;

  if (dateStr.includes(" ")) {
    // 分钟线: "2024-01-02 09:30"
    time = new Date(dateStr.replace(" ", "T") + ":00").getTime();
  } else {
    // 日线: "2024-01-02"
    time = new Date(dateStr + "T00:00:00").getTime();
  }

  // 美股时间需要转换为美股当地时间（东财返回的是北京时间或UTC）
  // 暂时保持原样，后续可做时区处理

  return {
    time,
    open: parseFloat(parts[1]) || 0,
    close: parseFloat(parts[2]) || 0,
    high: parseFloat(parts[3]) || 0,
    low: parseFloat(parts[4]) || 0,
    volume: parseFloat(parts[5]) || 0,
    amount: parseFloat(parts[6]) || 0,
    amplitude: parseFloat(parts[7]) || undefined,
    changePercent: parseFloat(parts[8]) || undefined,
    changeAmount: parseFloat(parts[9]) || undefined,
    turnoverRate: parseFloat(parts[10]) || undefined,
  };
}

/**
 * 成交额量级校正（亿元）：与桌面端 useStockData.normalizeTurnoverYi 同源逻辑。
 * 不同数据源 amount 单位可能漂移（元 / 千元 / 万元），已知出现过 1000× 放大。
 * 以 A股 沪深两市单日成交额合理量级为锚做确定性校正：<800 亿判缩小、>60000 亿判放大。
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
 * 东方财富数据 Provider
 */
export class EastmoneyProvider implements DataSource {
  private readonly klineUrl = "https://push2his.eastmoney.com/api/qt/stock/kline/get";
  private readonly quoteUrl = "https://push2.eastmoney.com/api/qt/stock/get";
  private readonly trendsUrl = "https://push2his.eastmoney.com/api/qt/stock/trends2/get";
  private readonly searchUrl = "https://searchapi.eastmoney.com/api/suggest/get";
  private readonly fundFlowUrl = "https://push2.eastmoney.com/api/qt/ulist.np/get";

  /**
   * 获取历史K线
   */
  async getKLines(
    code: string,
    market: Market,
    period: Period,
    opts: KLineQueryOptions = {}
  ): Promise<KLine[]> {
    const secid = toSecid(code, market);
    const klt = toKlt(period);
    const fqt = toFqt(opts.adjust ?? "qfq");

    // 按周期自适应拉取时间范围与最大根数
    // 月线默认拉10年、周线5年、日线2年，分钟线按交易天数放大 limit
    const cfg = getPeriodFetchConfig(period);

    const endDate = opts.to ? new Date(opts.to) : new Date();
    const startDate = opts.from
      ? new Date(opts.from)
      : new Date(endDate.getTime() - cfg.rangeDays * 24 * 60 * 60 * 1000);

    const beg = formatDate(startDate);
    const end = formatDate(endDate);
    const limit = opts.limit ?? cfg.limit;

    const url = `${this.klineUrl}?secid=${secid}&klt=${klt}&fqt=${fqt}&beg=${beg}&end=${end}&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&lmt=${limit}`;

    // K线数据缓存60秒，降低请求频率
    const resp = await httpGetJson<EmKLineResponse>(url, { cacheTtl: 60000 });

    if (!resp.data?.klines) {
      return [];
    }

    return resp.data.klines.map((line) => parseKLineString(line, market));
  }

  /**
   * 获取实时行情
   */
  async getQuote(code: string, market: Market): Promise<Quote> {
    const secid = toSecid(code, market);
    const fields = "f43,f44,f45,f46,f47,f48,f55,f57,f58,f60,f116,f117,f162,f167,f168,f169,f170";
    const url = `${this.quoteUrl}?secid=${secid}&fields=${fields}`;

    // 实时行情缓存5秒，降低请求频率但保持实时性
    const resp = await httpGetJson<EmQuoteResponse>(url, { cacheTtl: 5000 });

    if (!resp.data) {
      throw new Error(`未找到行情数据: ${code}`);
    }

    const d = resp.data;
    const price = d.f43 / 100;
    const preClose = d.f60 / 100;

    // 涨跌额和涨跌幅：优先用 API 返回值，异常时手动计算
    const apiChangeAmount = d.f168 / 100;
    const apiChangePercent = d.f170 / 100;
    const manualChangeAmount = price - preClose;
    const manualChangePercent = preClose > 0 ? (manualChangeAmount / preClose) * 100 : 0;

    // 如果 API 返回值异常（为0或符号不一致），用手动计算
    const useManual = apiChangeAmount === 0 || Math.sign(apiChangeAmount) !== Math.sign(manualChangeAmount);

    return {
      code: d.f57,
      name: d.f58,
      price,
      preClose,
      open: d.f46 / 100,
      high: d.f44 / 100,
      low: d.f45 / 100,
      changeAmount: useManual ? manualChangeAmount : apiChangeAmount,
      changePercent: useManual ? manualChangePercent : apiChangePercent,
      volume: d.f47,
      amount: d.f48,
      turnoverRate: d.f55,
      peRatio: d.f162,
      totalMarketCap: d.f116,
      circulatingMarketCap: d.f117,
    };
  }

  /**
   * 获取分时数据
   */
  async getTrends(code: string, market: Market): Promise<Tick[]> {    const secid = toSecid(code, market);
    const url = `${this.trendsUrl}?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f52,f53,f54,f55,f56,f57,f58&ndays=1`;

    const resp = await httpGetJson<EmTrendsResponse>(url);

    if (!resp.data?.trends) {
      return [];
    }

    return resp.data.trends.map((line) => {
      const parts = line.split(",");
      // 格式: "2024-01-02 09:30,price,avgPrice,volume,amount"
      const timeStr = parts[0];
      return {
        time: new Date(timeStr.replace(" ", "T") + ":00").getTime(),
        price: parseFloat(parts[1]) || 0,
        avgPrice: parseFloat(parts[2]) || 0,
        volume: parseFloat(parts[3]) || 0,
        amount: parseFloat(parts[4]) || 0,
      };
    });
  }

  /**
   * 获取单支大盘指数（东方财富源）
   * 使用 def.codes.eastmoney（secid）调 stock/get；涨跌额/幅做接口值与手动算双校验
   */
  async getMarketIndex(def: MarketIndexDef): Promise<MarketIndex | null> {
    const secid = def.codes.eastmoney;
    if (!secid) return null;
    const fields = "f43,f57,f58,f60,f168,f170";
    try {
      const url = `${this.quoteUrl}?secid=${secid}&fields=${fields}`;
      // 指数数据缓存30秒，降低请求频率
      const resp = await httpGetJson<EmQuoteResponse>(url, { cacheTtl: 30000 });
      if (!resp.data) return null;
      const d = resp.data;
      const price = d.f43 / 100;
      const preClose = d.f60 / 100;
      const apiChangeAmount = d.f168 / 100;
      const apiChangePercent = d.f170 / 100;
      const manualChangeAmount = price - preClose;
      const manualChangePercent =
        preClose > 0 ? (manualChangeAmount / preClose) * 100 : 0;
      const useManual =
        apiChangeAmount === 0 ||
        Math.sign(apiChangeAmount) !== Math.sign(manualChangeAmount);

      return {
        group: def.group,
        code: def.id,
        name: def.name,
        price,
        changeAmount: useManual ? manualChangeAmount : apiChangeAmount,
        changePercent: useManual ? manualChangePercent : apiChangePercent,
      };
    } catch (e) {
      console.warn(`[EM getMarketIndex] ${def.name} 获取失败:`, e);
      return null;
    }
  }

  /**
   * 获取全部大盘指数（东方财富源，provider 级批次实现，单支失败返回 null 不影响其余）
   */
  async getMarketIndices(): Promise<MarketIndex[]> {
    const results = await Promise.all(
      MARKET_INDEX_DEFS.map((def) => this.getMarketIndex(def))
    );
    return results.filter((r): r is MarketIndex => r !== null);
  }

  /**
   * 获取 A股涨跌停统计（东方财富 push2ex 涨停/跌停股票池计数）
   * - 涨停家数 = 涨停池长度；跌停家数 = 跌停池长度
   * - 连板高度 = 涨停池最大连板天数；连板家数 = 连板天数 ≥ 2 的数量
   * - 炸板家数 = 涨停池中曾开板（zbc > 0）的数量（估算）
   * - 封板率 = 涨停 / (涨停 + 炸板)
   * 注意：东财「涨停板行情」口径不含 ST / 科创板；未开市或暂无数据返回 null
   */
  async getMarketBreadth(): Promise<MarketBreadth | null> {
    try {
      const date = formatDate(new Date()); // YYYYMMDD
      const ut = "7eea3edcaed734bea9cbfc24409ed989";
      const dpt = "wz.ztzt";
      const base = "https://push2ex.eastmoney.com";
      const ztUrl = `${base}/getTopicZTPool?ut=${ut}&dpt=${dpt}&Pageindex=0&pagesize=10000&sort=fbt:asc&date=${date}`;
      const dtUrl = `${base}/getTopicDTPool?ut=${ut}&dpt=${dpt}&Pageindex=0&pagesize=10000&sort=fund:asc&date=${date}`;
      const [ztResp, dtResp] = await Promise.all([
        httpGetJson<EmZTPoolResponse>(ztUrl),
        httpGetJson<EmZTPoolResponse>(dtUrl),
      ]);
      const ztPool = ztResp.data?.pool ?? [];
      const dtPool = dtResp.data?.pool ?? [];
      const limitUp = ztPool.length;
      const limitDown = dtPool.length;
      if (limitUp === 0 && limitDown === 0) return null;

      const boards = ztPool.map((p) => Number(p.lbc) || 1);
      const maxBoard = boards.length ? Math.max(...boards) : 0;
      const consecutive = boards.filter((b) => b >= 2).length;
      const broken = ztPool.filter((p) => Number(p.zbc) > 0).length;
      const sealRate = limitUp + broken > 0 ? limitUp / (limitUp + broken) : 0;

      return {
        limitUp,
        limitDown,
        consecutive,
        broken,
        sealRate,
        maxBoard,
        updateTime: Date.now(),
      };
    } catch (e) {
      console.warn("[EM getMarketBreadth] 获取失败:", e);
      return null;
    }
  }

  /**
   * 获取 A股大盘资金净流入（亿元）
   * - 来源：东方财富 ulist.np/get，查询上证指数 + 深证成指的主力净流入（f62）并求和
   * - f62 单位为「元」，返回前转为亿元
   * 注意：与东财「大盘资金流向」口径一致，数据缺失或异常时返回 null
   */
  async getMarketFundFlow(): Promise<MarketFundFlow | null> {
    try {
      const fields = "f62,f184";
      const secids = "1.000001,0.399001";
      const ut = "7eea3edcaed734bea9cbfc24409ed989";
      const url = `${this.fundFlowUrl}?fltt=2&invt=2&fields=${fields}&secids=${secids}&ut=${ut}`;

      const resp = await httpGetJson<EmFundFlowResponse>(url);
      const diff = resp.data?.diff;
      if (!diff || diff.length === 0) return null;

      const totalYuan = diff.reduce((sum, item) => sum + (Number(item.f62) || 0), 0);
      if (totalYuan === 0) return null;

      return totalYuan / 100_000_000; // 元 -> 亿元
    } catch (e) {
      console.warn("[EM getMarketFundFlow] 获取失败:", e);
      return null;
    }
  }

  /**
   * 获取 A股总成交额（钉死东方财富真实源，亿元）
   * - 今日：上证(1.000001)+深证(0.399001) 指数实时成交额（push2 stock/get 的 `f48`，单位元，真实值）
   * - 昨日 / 近 20 日序列：上证+深证指数 K线真实 amount（元）之和（东财 K线 amount 为真实成交额）
   * - 今日与昨日/序列**拆成两个独立 try**：REQ-MKT-12 旧实现把两者放在同一 try，K线接口(push2his)
   *   偶发失败/被限流时会连带把今日也拖垮成整体 null → 整卡「—」。拆开后任一方失败都不影响另一方，
   *   最大化可用性（今日实时值独立于 K线）。
   * - 实证：f48 对指数就是真实成交额（元），并非涨停价；push2 stock/get 在浏览器/无头环境可达（200）。
   * - 仅调用本 Provider 自身方法，不走 Manager 兜底（避免落到腾讯 K线 amount=volume×close 估算、或新浪空）
   * - 今日与序列皆空才降级「—」（UI），而非一方失败即全空
   */
  async getMarketTurnover(): Promise<MarketTurnover | null> {
    // 今日成交额：独立获取，失败不影响昨日/序列
    let today: number | null = null;
    try {
      const [shQ, szQ] = await Promise.all([
        this.getQuote("000001", "A-SH"),
        this.getQuote("399001", "A-SZ"),
      ]);
      today = normalizeTurnoverYi((shQ.amount + szQ.amount) / 1e8); // 元 -> 亿元
    } catch (e) {
      console.warn("[EM getMarketTurnover] getQuote(今日)失败:", e);
    }

    // 昨日 / 近 20 日序列：独立获取，失败不影响今日
    let yesterday: number | null = null;
    let series: number[] = [];
    try {
      const [shK, szK] = await Promise.all([
        this.getKLines("000001", "A-SH", "daily", { limit: 20 }),
        this.getKLines("399001", "A-SZ", "daily", { limit: 20 }),
      ]);
      const n = Math.min(shK.length, szK.length, 20);
      if (n > 0) {
        for (let i = 0; i < n; i++) {
          const a =
            (shK[shK.length - n + i]?.amount ?? 0) +
            (szK[szK.length - n + i]?.amount ?? 0);
          series.push(normalizeTurnoverYi(a / 1e8)); // 元 -> 亿元
        }
        yesterday = n >= 2 ? series[n - 2] : null; // 倒数第二根 = 昨日（历史定值）
      }
    } catch (e) {
      console.warn("[EM getMarketTurnover] getKLines(昨日/序列)失败:", e);
    }

    // 双保险：今日实时接口未取到，但 K线可用，则用 K线最后一根（当日）兜底，避免单边失败即全空
    if (today == null && series.length > 0) today = series[series.length - 1];
    // 今日与序列皆空才降级「—」，否则尽量展示能拿到的部分
    if (today == null && series.length === 0) return null;
    return { today, yesterday, series, updateTime: Date.now() };
  }

  /**
   * 获取 A股涨跌家数（上涨/下跌/平盘家数，市场宽度）
   * - 来源：东方财富指数行情 `stock/get`（push2.eastmoney.com），分别取上证指数(1.000001) 与
   *   深证成指(0.399001) 的 `f162`(上涨) / `f163`(下跌) / `f164`(平盘) 家数并求和。
   *   （注：指数 secid 下 f162/f163/f164 即沪深市场涨跌家数；个股 secid 下含义不同，故仅用于指数）
   * - 口径：沪深A股（不含北交所 / 港股），与东财「沪深股市」涨跌家数一致。
   * - 异常或任一指数缺失返回 null，交由其它源兜底。
   */
  async getMarketAdvanceDecline(): Promise<MarketAdvanceDecline | null> {
    try {
      const fields = "f162,f163,f164";
      const secids = ["1.000001", "0.399001"];
      const results = await Promise.all(
        secids.map(async (secid) => {
          const url = `${this.quoteUrl}?secid=${secid}&fields=${fields}`;
          // 涨跌家数缓存60秒，降低请求频率
          const resp = await httpGetJson<EmQuoteResponse>(url, { cacheTtl: 60000 });
          const d = resp.data;
          if (!d) return null;
          return {
            up: Number(d.f162) || 0,
            down: Number(d.f163) || 0,
            flat: Number(d.f164) || 0,
          };
        })
      );
      const valid = results.filter((r): r is { up: number; down: number; flat: number } => r !== null);
      if (valid.length === 0) return null;
      const up = valid.reduce((s, r) => s + r.up, 0);
      const down = valid.reduce((s, r) => s + r.down, 0);
      const flat = valid.reduce((s, r) => s + r.flat, 0);
      if (up === 0 && down === 0 && flat === 0) return null;
      return { up, down, flat, updateTime: Date.now() };
    } catch (e) {
      console.warn("[EM getMarketAdvanceDecline] 获取失败:", e);
      return null;
    }
  }

  /**
   * 搜索标的
   */
  async search(keyword: string): Promise<SymbolInfo[]> {
    if (!keyword.trim()) return [];

    const url = `${this.searchUrl}?input=${encodeURIComponent(keyword)}&count=15&type=14&token=D43BF722C8E33BDC906FB84D85E326E8`;

    const resp = await httpGetJson<EmSearchResponse>(url);

    const items = resp.QuotationCodeTable?.Data;
    if (!items || items.length === 0) return [];

    return items
      .filter(
        (item) =>
          item.Classify === "AStock" ||
          item.Classify === "HKStock" ||
          item.Classify === "USStock"
      )
      .map((item) => {
        let market: Market;
        if (item.Classify === "AStock") {
          market = item.MarketType === "1" ? "A-SH" : "A-SZ";
        } else if (item.Classify === "HKStock") {
          market = "HK";
        } else {
          // USStock: 用 QuoteID 前缀判断 NASDAQ(105.) vs NYSE(106.)
          market = item.QuoteID.startsWith("105.") ? "US-NASDAQ" : "US-NYSE";
        }

        return {
          code: item.Code,
          name: item.Name,
          market,
        } as SymbolInfo;
      });
  }
}
