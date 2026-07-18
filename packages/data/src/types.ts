import type { Market, Period, Adjust } from "@trend-iq/shared";

/**
 * K线数据
 */
export interface KLine {
  /** 毫秒时间戳 */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  /** 成交量（股） */
  volume: number;
  /** 成交额（元/港元/美元） */
  amount: number;
  /** 振幅（%） */
  amplitude?: number;
  /** 涨跌幅（%） */
  changePercent?: number;
  /** 涨跌额 */
  changeAmount?: number;
  /** 换手率（%） */
  turnoverRate?: number;
}

/**
 * 实时行情
 */
export interface Quote {
  /** 股票代码 */
  code: string;
  /** 股票名称 */
  name: string;
  /** 当前价 */
  price: number;
  /** 昨收 */
  preClose: number;
  /** 开盘价 */
  open: number;
  /** 最高价 */
  high: number;
  /** 最低价 */
  low: number;
  /** 涨跌额 */
  changeAmount: number;
  /** 涨跌幅（%） */
  changePercent: number;
  /** 成交量（股） */
  volume: number;
  /** 成交额 */
  amount: number;
  /** 换手率（%） */
  turnoverRate: number;
  /** 市盈率 */
  peRatio: number;
  /** 总市值 */
  totalMarketCap: number;
  /** 流通市值 */
  circulatingMarketCap: number;
}

/**
 * 大盘指数分组
 */
export type MarketIndexGroup = "A股" | "港股" | "美股" | "日韩股";

/**
 * 大盘指数行情
 */
export interface MarketIndex {
  /** 市场分组 */
  group: MarketIndexGroup;
  /** 代码（稳定 id，如 sh000001） */
  code: string;
  /** 名称 */
  name: string;
  /** 当前点位 */
  price: number;
  /** 涨跌额 */
  changeAmount: number;
  /** 涨跌幅（%） */
  changePercent: number;
}

/**
 * A股涨跌停统计（市场宽度）
 * - 来源：东方财富 push2ex 涨停池 / 跌停池计数（不含 ST / 科创板，与东财「涨停板行情」口径一致）
 * - 涨停/跌停家数 = 对应股票池长度；连板高度 = 涨停池中最大连板天数
 */
export interface MarketBreadth {
  /** 涨停家数 */
  limitUp: number;
  /** 跌停家数 */
  limitDown: number;
  /** 连板家数（非首板，连板天数 ≥ 2） */
  consecutive: number;
  /** 炸板家数（涨停池中曾开板的股票数，估算） */
  broken: number;
  /** 涨停封板率（0-1）：涨停 / (涨停 + 炸板) */
  sealRate: number;
  /** 连板高度（最高连板天数） */
  maxBoard: number;
  /** 数据更新时间（毫秒时间戳） */
  updateTime: number;
}

/**
 * A股涨跌家数（市场宽度）
 * - 来源：东方财富 指数行情（上证指数 + 深证成指）的 `f162`(上涨) / `f163`(下跌) / `f164`(平盘) 求和
 * - 口径：沪深A股（不含北交所 / 港股）；与东财「沪深股市」涨跌家数一致
 */
export interface MarketAdvanceDecline {
  /** 上涨家数 */
  up: number;
  /** 下跌家数 */
  down: number;
  /** 平盘家数 */
  flat: number;
  /** 数据更新时间（毫秒时间戳） */
  updateTime: number;
}

/**
 * 大盘资金净流入（单位：亿元）
 * 用于 A股交易额卡片右侧「大盘资金净流入」字段
 */
export type MarketFundFlow = number;

/**
 * 大盘指数定义（含各数据源代码，用于跨源 fallback）
 */
export interface MarketIndexDef {
  /** 稳定 id */
  id: string;
  /** 市场分组 */
  group: MarketIndexGroup;
  /** 显示名称 */
  name: string;
  /** 各数据源对应的代码 */
  codes: {
    /** 东方财富 secid，如 1.000001 */
    eastmoney: string;
    /** 腾讯代码，如 sh000001 */
    tencent: string;
    /** 雅虎代码，如 000001.SS */
    yahoo: string;
    /** 新浪财经代码（指数用 s_ 前缀代码，如 sh000001；个股由 market 推导） */
    sina: string;
  };
}

/**
 * 分时数据
 */
export interface Tick {
  /** 毫秒时间戳 */
  time: number;
  /** 当前价 */
  price: number;
  /** 均价 */
  avgPrice: number;
  /** 成交量（股） */
  volume: number;
  /** 成交额 */
  amount: number;
}

/**
 * 标的信息
 */
export interface SymbolInfo {
  /** 股票代码 */
  code: string;
  /** 股票名称 */
  name: string;
  /** 市场 */
  market: Market;
  /** 交易所代码 */
  exchange?: string;
}

/**
 * K线查询选项
 */
export interface KLineQueryOptions {
  /** 起始时间（毫秒时间戳） */
  from?: number;
  /** 结束时间（毫秒时间戳） */
  to?: number;
  /** 复权类型 */
  adjust?: Adjust;
  /** 返回数量上限 */
  limit?: number;
}

/**
 * A股总成交额（沪深两市合计，亿元）：今日实时 + 昨日 + 近 N 日序列
 * - 仅由东方财富真实源提供（上证/深证指数 f48 + K线真实 amount），不兜底到估算源
 * - 其它源（腾讯 K线 amount 为 volume×close 估算、新浪 K线为空）返回 null
 */
export interface MarketTurnover {
  /** 今日实时成交额（亿元）；取不到为 null */
  today: number | null;
  /** 昨日成交额（亿元）；取不到为 null */
  yesterday: number | null;
  /** 近 N 交易日每日成交额（亿元），末位为今日 */
  series: number[];
  /** 数据更新时间（毫秒时间戳） */
  updateTime: number;
}

/**
 * 数据源接口
 */
export interface DataSource {
  /** 获取历史K线 */
  getKLines(
    code: string,
    market: Market,
    period: Period,
    opts?: KLineQueryOptions
  ): Promise<KLine[]>;

  /** 获取实时行情 */
  getQuote(code: string, market: Market): Promise<Quote>;

  /** 获取分时数据 */
  getTrends(code: string, market: Market): Promise<Tick[]>;

  /** 搜索标的 */
  search(keyword: string): Promise<SymbolInfo[]>;

  /** 获取单支大盘指数（指定定义），失败返回 null */
  getMarketIndex(def: MarketIndexDef): Promise<MarketIndex | null>;

  /** 获取全部大盘指数（各源可分批实现，manager 会逐支跨源兜底） */
  getMarketIndices(): Promise<MarketIndex[]>;

  /** 获取 A股涨跌停统计（涨停/跌停家数、连板、炸板、封板率）；不支持的源返回 null */
  getMarketBreadth(): Promise<MarketBreadth | null>;

  /** 获取 A股涨跌家数（上涨/下跌/平盘家数，市场宽度）；不支持的源返回 null */
  getMarketAdvanceDecline(): Promise<MarketAdvanceDecline | null>;

  /** 获取 A股大盘资金净流入（亿元）；不支持的源返回 null */
  getMarketFundFlow(): Promise<MarketFundFlow | null>;

  /** 获取 A股总成交额（今日/昨日/近 N 日序列，亿元）；钉死东方财富真实源，其它源返回 null */
  getMarketTurnover(): Promise<MarketTurnover | null>;
}

/**
 * HTTP 响应封装
 */
export interface HttpResponse {
  ok: boolean;
  status: number;
  data: string;
}

/**
 * HTTP 客户端接口（可注入，支持 Tauri HTTP 插件或浏览器 fetch）
 */
export type HttpFetchFn = (url: string, init?: RequestInit) => Promise<HttpResponse>;
