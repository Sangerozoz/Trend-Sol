import { useQuery } from "@tanstack/react-query";
import { getDataSource, getMarketIndices, getMarketFundFlow, getMarketAdvanceDecline, getMarketTurnover } from "@trend-iq/data";
import type { SymbolInfo, KLine, MarketIndex, MarketBreadth, MarketFundFlow, MarketAdvanceDecline, MarketTurnover } from "@trend-iq/data";
import type { Period, Adjust } from "@trend-iq/shared";
import { triggerFetch } from "../setup";

/**
 * 判断当前是否为交易时段（A股 9:30-11:30 / 13:00-15:00）
 * 周末不刷新
 */
function isTradingHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  const time = hour * 60 + minute;
  return (time >= 570 && time <= 690) || (time >= 780 && time <= 900);
}

/** 数据刷新间隔（毫秒）：4秒 */
const REFRESH_INTERVAL = 4000;

/**
 * 获取 K 线数据
 * - Tauri环境：先读本地缓存（LocalCacheProvider），未命中/过期走在线API并触发后台采集
 * - 交易时段每4秒自动刷新
 */
export function useKLines(
  symbol: SymbolInfo | null,
  period: Period,
  adjust: Adjust
) {
  return useQuery({
    queryKey: ["klines", symbol?.code, symbol?.market, period, adjust],
    queryFn: async () => {
      if (!symbol) return [];
      const ds = getDataSource();
      try {
        return await ds.getKLines(symbol.code, symbol.market, period, { adjust });
      } catch (err) {
        // 在线API也失败时，尝试触发后台采集（可能下次刷新时缓存就准备好了）
        triggerFetch(symbol.code, symbol.market, period, adjust).catch(() => {});
        throw err;
      }
    },
    enabled: !!symbol,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: () => {
      if (!symbol) return false;
      if (!isTradingHours()) return false;
      return REFRESH_INTERVAL;
    },
  });
}

/**
 * 获取实时行情
 * - Tauri环境：优先读本地缓存
 * - 交易时段每4秒刷新，非交易时段30秒
 */
export function useQuote(symbol: SymbolInfo | null) {
  return useQuery({
    queryKey: ["quote", symbol?.code, symbol?.market],
    queryFn: async () => {
      if (!symbol) return null;
      const ds = getDataSource();
      return ds.getQuote(symbol.code, symbol.market);
    },
    enabled: !!symbol,
    staleTime: 0,
    refetchInterval: () => {
      if (!symbol) return false;
      const now = new Date();
      const day = now.getDay();
      if (day === 0 || day === 6) return 60000;
      if (isTradingHours()) return REFRESH_INTERVAL;
      return 30000;
    },
  });
}

/**
 * 将实时行情价格合并到K线数据最后一根
 */
export function mergeQuoteToKLines(
  klines: KLine[],
  quote: { price: number; open: number; high: number; low: number; volume: number; amount: number } | null
): KLine[] {
  if (!quote || klines.length === 0) return klines;
  const lastKline = klines[klines.length - 1];
  const updated = { ...lastKline };
  updated.close = quote.price;
  updated.high = Math.max(lastKline.high, quote.price);
  updated.low = Math.min(lastKline.low, quote.price);
  if (quote.volume > 0) updated.volume = quote.volume;
  if (quote.amount > 0) updated.amount = quote.amount;
  return [...klines.slice(0, -1), updated];
}

/**
 * 搜索股票
 */
export function useSearch() {
  return async (keyword: string) => {
    const ds = getDataSource();
    return ds.search(keyword);
  };
}

/**
 * 获取大盘指数行情（A股 / 港股 / 美股 / 日韩股）
 * - 交易时段每 4 秒刷新；非交易时段每 30 秒
 */
export function useMarketIndices(): ReturnType<typeof useQuery<MarketIndex[]>> {
  return useQuery<MarketIndex[]>({
    queryKey: ["marketIndices"],
    queryFn: () => getMarketIndices(),
    staleTime: 0,
    refetchInterval: () => {
      const now = new Date();
      const day = now.getDay();
      if (day === 0 || day === 6) return 30000;
      if (isTradingHours()) return REFRESH_INTERVAL;
      return 30000;
    },
  });
}

/**
 * A股总成交额（钉死东方财富真实源）：今日实时 + 昨日 + 近 20 日序列（亿元）
 * - 统一走 `getMarketTurnover()`：仅东方财富真实源（上证/深证指数 f48 + K线真实 amount），
 *   不走 Manager 兜底到腾讯 K线(amount=volume×close 估算)/新浪(空)。东财挂则降级「—」，不再横跳。
 * - 交易时段每 4 秒刷新；非交易时段 30 秒（今日实时更新；昨日/序列为当日历史定值，源值本就稳定）
 */
export function useMarketTurnover() {
  return useQuery<MarketTurnover | null>({
    queryKey: ["marketTurnover"],
    queryFn: () => getMarketTurnover(),
    staleTime: 0,
    refetchInterval: () => {
      const now = new Date();
      const day = now.getDay();
      if (day === 0 || day === 6) return 30000;
      if (isTradingHours()) return REFRESH_INTERVAL;
      return 30000;
    },
  });
}

/**
 * A股昨日成交额（亿元）：沪深两市上一交易日成交额合计
 * - 取自 `getMarketTurnover().yesterday`（东财 K线真实 amount，当日历史定值）
 * - **按当天日期冻结**：queryKey 含日期、staleTime 到次日、refetchInterval=false。
 *   昨日成交是历史定值，不应随实时刷新重算；钉死东财后源值本就稳定，此处再按日冻结双重保险。
 */
export function useMarketTurnoverYesterday() {
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return useQuery<number | null>({
    queryKey: ["marketTurnoverYesterday", todayKey],
    queryFn: async () => {
      const t = await getMarketTurnover();
      return t?.yesterday ?? null;
    },
    staleTime: 24 * 60 * 60 * 1000,
    refetchInterval: false,
  });
}

/**
 * A股涨跌停统计（涨停/跌停家数、连板、炸板、封板率）
 * - 交易时段每 4 秒刷新；非交易时段 30 秒
 */
export function useMarketBreadth() {
  return useQuery<MarketBreadth | null>({
    queryKey: ["marketBreadth"],
    queryFn: async () => {
      const ds = getDataSource();
      return ds.getMarketBreadth();
    },
    staleTime: 0,
    refetchInterval: () => {
      const now = new Date();
      const day = now.getDay();
      if (day === 0 || day === 6) return 30000;
      if (isTradingHours()) return REFRESH_INTERVAL;
      return 30000;
    },
  });
}

/**
 * A股大盘资金净流入（亿元）
 * - 东方财富 ulist.np/get 查询上证+深证主力净流入之和
 * - 交易时段每 4 秒刷新；非交易时段 30 秒
 */
export function useMarketFundFlow() {
  return useQuery<MarketFundFlow | null>({
    queryKey: ["marketFundFlow"],
    queryFn: async () => {
      return getMarketFundFlow();
    },
    staleTime: 0,
    refetchInterval: () => {
      const now = new Date();
      const day = now.getDay();
      if (day === 0 || day === 6) return 30000;
      if (isTradingHours()) return REFRESH_INTERVAL;
      return 30000;
    },
  });
}

/**
 * A股涨跌家数（上涨/下跌/平盘家数，市场宽度）
 * - 东方财富指数行情（上证+深证 f162/f163/f164 求和）
 * - 交易时段每 4 秒刷新；非交易时段 30 秒
 */
export function useMarketAdvanceDecline() {
  return useQuery<MarketAdvanceDecline | null>({
    queryKey: ["marketAdvanceDecline"],
    queryFn: async () => {
      return getMarketAdvanceDecline();
    },
    staleTime: 0,
    refetchInterval: () => {
      const now = new Date();
      const day = now.getDay();
      if (day === 0 || day === 6) return 30000;
      if (isTradingHours()) return REFRESH_INTERVAL;
      return 30000;
    },
  });
}

/**
 * 行情页模块A 子区块（A股交易额 + A股涨跌比）聚合 hook
 */
export function useMarketStats() {
  const turnover = useMarketTurnover();
  const turnoverYesterday = useMarketTurnoverYesterday();
  const turnoverNetInflow = useMarketFundFlow();
  const breadth = useMarketBreadth();
  const advanceDecline = useMarketAdvanceDecline();
  return {
    turnoverValue: { data: turnover.data?.today ?? null, isLoading: turnover.isLoading },
    turnoverSeries: { data: turnover.data?.series ?? [], isLoading: turnover.isLoading },
    turnoverYesterday,
    turnoverNetInflow,
    breadth,
    advanceDecline,
  };
}
