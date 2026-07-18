import { useEffect, useRef, useCallback } from "react";
import { init, dispose, type Chart, type KLineData as KCKLineData } from "klinecharts";
import type { KLine } from "@trend-iq/data";
import type { TrendLine, SupportResistance, FibonacciResult, ChartPattern, PullbackLevel } from "@trend-iq/analysis";
import { renderAllAutoOverlays, registerPriceLineOverlay, type CostLineConfig } from "./renderer";
import { MORANDI } from "./colors";
import type { LineVisibility } from "@trend-iq/store";

/**
 * KLineCharts 暗色主题配置
 * 中国股市惯例：红涨绿跌
 * 功能线使用莫兰迪色系
 */
const darkStyles = {
  grid: {
    horizontal: { color: "#161616" },
    vertical: { color: "#161616" },
  },
  candle: {
    type: "candle_solid",
    bar: {
      upColor: MORANDI.kline.up,
      downColor: MORANDI.kline.down,
      noChangeColor: MORANDI.kline.noChange,
      upBorderColor: MORANDI.kline.up,
      downBorderColor: MORANDI.kline.down,
      noChangeBorderColor: MORANDI.kline.noChange,
      upWickColor: MORANDI.kline.up,
      downWickColor: MORANDI.kline.down,
      noChangeWickColor: MORANDI.kline.noChange,
    },
    priceMark: {
      high: { color: "#f87171" },
      low: { color: "#4ade80" },
      last: {
        upColor: MORANDI.kline.up,
        downColor: MORANDI.kline.down,
        noChangeColor: MORANDI.kline.noChange,
      },
    },
    tooltip: {
      text: { color: "#e8e8e8" },
    },
  },
  crosshair: {
    horizontal: {
      line: { color: "#444444" },
      text: { backgroundColor: "#1f1f1f" },
    },
    vertical: {
      line: { color: "#444444" },
      text: { backgroundColor: "#1f1f1f" },
    },
  },
  yAxis: {
    size: 76,
    axisLine: { color: "#1f1f1f" },
    tickText: { color: "#999999", marginStart: 4, marginEnd: 4 },
    tickLine: { color: "#1f1f1f" },
  },
  xAxis: {
    axisLine: { color: "#1f1f1f" },
    tickText: { color: "#999999" },
    tickLine: { color: "#1f1f1f" },
  },
  indicator: {
    tooltip: {
      text: { color: "#e8e8e8" },
    },
  },
  separator: { color: "#1f1f1f" },
} as any;

/**
 * 将 KLine 转换为 KLineCharts 数据格式
 */
function toKCData(klines: KLine[]): KCKLineData[] {
  return klines.map((k) => ({
    timestamp: k.time,
    open: k.open,
    high: k.high,
    low: k.low,
    close: k.close,
    volume: k.volume,
    turnover: k.amount,
  }));
}

/**
 * ChartContainer 属性
 */
interface ChartContainerProps {
  data: KLine[];
  loading?: boolean;
  showVolume?: boolean;
  visibility?: LineVisibility;
  trendLines?: TrendLine[];
  supportResistance?: SupportResistance[];
  fibonacci?: FibonacciResult | null;
  costConfig?: CostLineConfig | null;
  selectedPattern?: ChartPattern | null;
  pullbacks?: PullbackLevel[];
  className?: string;
}

/**
 * K线图表容器组件
 * 封装 KLineCharts，提供暗色主题 + 红涨绿跌 + 成交量副图 + 自动画线
 */
export function ChartContainer({
  data,
  loading = false,
  showVolume = true,
  visibility,
  trendLines,
  supportResistance,
  fibonacci,
  costConfig,
  selectedPattern,
  pullbacks,
  className = "",
}: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const prevDataInfoRef = useRef<{ length: number; lastTs: number } | null>(null);

  // 初始化图表
  useEffect(() => {
    if (!containerRef.current) return;
    registerPriceLineOverlay();
    const chart = init(containerRef.current);
    if (!chart) return;
    chartRef.current = chart;
    chart.setStyles(darkStyles);

    if (showVolume) {
      chart.createIndicator("VOL", false, { id: "pane_volume" });
    }
    chart.createIndicator("MA", true, { id: "candle_pane" });

    return () => {
      if (containerRef.current) {
        dispose(containerRef.current);
      }
      chartRef.current = null;
      prevDataInfoRef.current = null;
    };
  }, []);

  // 数据更新
  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;
    const chart = chartRef.current;
    const kcData = toKCData(data);
    const lastTs = kcData[kcData.length - 1].timestamp;
    const prevInfo = prevDataInfoRef.current;
    prevDataInfoRef.current = { length: kcData.length, lastTs };

    const isPriceOnlyUpdate =
      prevInfo !== null &&
      prevInfo.length === kcData.length &&
      prevInfo.lastTs === lastTs;

    if (isPriceOnlyUpdate) {
      const offsetRight = chart.getOffsetRightDistance();
      chart.applyNewData(kcData);
      chart.setOffsetRightDistance(offsetRight);
    } else {
      chart.applyNewData(kcData);
    }
  }, [data]);

  // 自动画线渲染（只在分析结果或可见性变化时重渲染）
  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;
    const timer = setTimeout(() => {
      if (!chartRef.current) return;
      renderAllAutoOverlays(chartRef.current, data, {
        trendLines,
        supportResistance,
        fibonacci,
        costConfig,
        pattern: selectedPattern,
        pullbacks,
        visibility,
      });
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendLines, supportResistance, fibonacci, costConfig, selectedPattern, pullbacks, visibility]);

  // 成交量副图切换
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    if (showVolume) {
      chart.createIndicator("VOL", false, { id: "pane_volume" });
    } else {
      chart.removeIndicator("pane_volume");
    }
  }, [showVolume]);

  const getChart = useCallback(() => chartRef.current, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/50 backdrop-blur-sm">
          <div className="text-text-secondary text-sm">加载中...</div>
        </div>
      )}
    </div>
  );
}

export default ChartContainer;
