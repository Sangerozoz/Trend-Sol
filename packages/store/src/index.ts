import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Market, Period, Adjust } from "@trend-iq/shared";
import type { SymbolInfo } from "@trend-iq/data";

/**
 * 线条可见性配置
 * 替代旧的 AutoAnalysisState，支持更细粒度的开关
 */
export interface LineVisibility {
  /** 支撑位总开关 */
  support: boolean;
  /** 压力位总开关 */
  resistance: boolean;
  /** 支撑位显示数量 (0-3) */
  supportCount: number;
  /** 压力位显示数量 (0-3) */
  resistanceCount: number;
  /** 成本/止盈/止损组（costPrice>0 时自动显示） */
  cost: boolean;
  /** 止盈3（默认关） */
  takeProfit3: boolean;
  /** 回踩线（均线回踩位，默认关） */
  pullback: boolean;
  /** 形态组（selectedPattern 非空时自动显示） */
  pattern: boolean;
  /** 形态轮廓半透明面 */
  patternZone: boolean;
  /** 趋势线 */
  trendline: boolean;
  /** 斐波那契 */
  fibonacci: boolean;
}

/**
 * 图表状态
 */
interface ChartState {
  // 当前标的
  currentSymbol: SymbolInfo | null;

  // 当前周期
  period: Period;

  // 复权类型
  adjust: Adjust;

  // K线数据加载状态
  loading: boolean;

  // 错误信息
  error: string | null;

  // 自选股列表
  watchlist: SymbolInfo[];

  // 左侧自选股侧边栏是否展开
  watchlistVisible: boolean;

  // 右侧信息面板是否展开
  rightPanelVisible: boolean;

  // 线条可见性配置
  lineVisibility: LineVisibility;

  // Actions
  setSymbol: (symbol: SymbolInfo) => void;
  setPeriod: (period: Period) => void;
  setAdjust: (adjust: Adjust) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addToWatchlist: (symbol: SymbolInfo) => void;
  removeFromWatchlist: (code: string, market: Market) => void;
  isInWatchlist: (code: string, market: Market) => boolean;
  toggleWatchlistVisible: () => void;
  toggleRightPanelVisible: () => void;
  toggleLineVisibility: (key: keyof LineVisibility) => void;
  setLineVisibility: (state: Partial<LineVisibility>) => void;
}

/**
 * 默认线条可见性
 */
const DEFAULT_LINE_VISIBILITY: LineVisibility = {
  support: true,
  resistance: true,
  supportCount: 2,
  resistanceCount: 2,
  cost: true,
  takeProfit3: false,
  pullback: false,
  pattern: true,
  patternZone: true,
  trendline: true,
  fibonacci: false,
};

/**
 * 全局图表状态 store
 * watchlist 和 lineVisibility 持久化到 localStorage
 */
export const useChartStore = create<ChartState>()(
  persist(
    (set, get) => ({
      currentSymbol: null,
      period: "daily",
      adjust: "qfq",
      loading: false,
      error: null,
      watchlist: [],
      watchlistVisible: true,
      rightPanelVisible: true,
      lineVisibility: { ...DEFAULT_LINE_VISIBILITY },

      setSymbol: (symbol) => set({ currentSymbol: symbol, error: null }),

      setPeriod: (period) => set({ period }),

      setAdjust: (adjust) => set({ adjust }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      addToWatchlist: (symbol) =>
        set((state) => {
          if (
            state.watchlist.some(
              (s) => s.code === symbol.code && s.market === symbol.market
            )
          ) {
            return state;
          }
          return { watchlist: [...state.watchlist, symbol] };
        }),

      removeFromWatchlist: (code, market) =>
        set((state) => ({
          watchlist: state.watchlist.filter(
            (s) => !(s.code === code && s.market === market)
          ),
        })),

      isInWatchlist: (code, market) => {
        const state = get();
        return state.watchlist.some(
          (s) => s.code === code && s.market === market
        );
      },

      toggleWatchlistVisible: () =>
        set((state) => ({ watchlistVisible: !state.watchlistVisible })),

      toggleRightPanelVisible: () =>
        set((state) => ({ rightPanelVisible: !state.rightPanelVisible })),

      toggleLineVisibility: (key) =>
        set((state) => ({
          lineVisibility: {
            ...state.lineVisibility,
            [key]: !state.lineVisibility[key],
          },
        })),

      setLineVisibility: (partial) =>
        set((state) => ({
          lineVisibility: { ...state.lineVisibility, ...partial },
        })),
    }),
    {
      name: "trend-iq-store",
      // 只持久化 watchlist 和 lineVisibility
      partialize: (state) => ({
        watchlist: state.watchlist,
        lineVisibility: state.lineVisibility,
        rightPanelVisible: state.rightPanelVisible,
      }),
    }
  )
);
