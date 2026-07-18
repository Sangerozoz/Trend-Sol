import { registerOverlay, type Chart } from "klinecharts";
import type { KLine } from "@trend-iq/data";
import type { TrendLine, SupportResistance, FibonacciResult, ChartPattern, PatternDirection, PullbackLevel } from "@trend-iq/analysis";
import type { Pivot } from "@trend-iq/analysis";
import {
  COLORS,
  LABEL_PRIORITY,
  LABEL_MIN_GAP,
  getContrastTextColor,
  getSupportColor,
  getResistanceColor,
  getPatternZoneColor,
} from "./colors";

// 兼容：renderer 内部统一用 COLORS
const MORANDI = COLORS;
import type { LineVisibility } from "@trend-iq/store";

/**
 * 自动画线图层组 ID
 */
export const AUTO_GROUP = {
  trendline: "auto-trendline",
  sr: "auto-sr",
  fibonacci: "auto-fibonacci",
  cost: "auto-cost",
  pattern: "auto-pattern",
  priceLine: "auto-price",
  pullback: "auto-pullback",
} as const;

let priceLineRegistered = false;

/**
 * 注册自定义 overlay：带右侧标签的水平价格线
 *
 * 支持标签避让：通过 extendData.showLabel 控制
 * - showLabel=true: 画完整彩色标签
 * - showLabel=false: 只画小圆点（避免遮挡）
 */
export function registerPriceLineOverlay(): void {
  if (priceLineRegistered) return;
  priceLineRegistered = true;

  registerOverlay({
    name: "priceLineWithLabel",
    totalStep: 2,
    needDefaultPointFigure: false,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    createPointFigures: (params: any) => {
      const { coordinates, bounding } = params;
      if (!coordinates || !coordinates[0]) return [];

      const co = coordinates[0];
      if (co.y === undefined || co.y === null || isNaN(co.y)) return [];

      const width = bounding.width || 800;
      const overlay = params.overlay;
      const color = overlay?.styles?.line?.color ?? COLORS.kline.up;
      const lineStyle = overlay?.styles?.line?.style ?? "dashed";
      const lineSize = overlay?.styles?.line?.size ?? 1;

      const figures: any[] = [
        {
          type: "line",
          attrs: {
            coordinates: [
              { x: 0, y: co.y },
              { x: width, y: co.y },
            ],
          },
          styles: { color, style: lineStyle, size: lineSize },
        },
      ];

      return figures;
    },
    createYAxisFigures: (params: any) => {
      const { coordinates, bounding, overlay } = params;
      if (!coordinates || !coordinates[0]) return [];

      const co = coordinates[0];
      if (co.y === undefined || co.y === null || isNaN(co.y)) return [];

      const extData = overlay?.extendData || {};
      const label = extData.label ?? "";
      const lineColor = overlay?.styles?.line?.color ?? COLORS.kline.up;
      const bgColor = extData.bgColor ?? lineColor;
      const showLabel = extData.showLabel !== false; // 默认 true

      const axisWidth = bounding.width || 60;

      if (!label || !showLabel) {
        // 无标签或被避让折叠：只显示小圆点
        return [
          {
            type: "circle",
            attrs: { x: 2, y: co.y, r: 3 },
            styles: { style: "fill", color: bgColor, borderColor: bgColor, borderSize: 1 },
          },
        ];
      }

      return [
        {
          type: "text",
          attrs: {
            x: axisWidth - 2,
            y: co.y,
            text: label,
            align: "right",
            baseline: "middle",
          },
          styles: {
            color: getContrastTextColor(bgColor),
            size: 11,
            family: "monospace",
            weight: "normal",
            backgroundColor: bgColor,
            paddingLeft: 4,
            paddingRight: 4,
            paddingTop: 2,
            paddingBottom: 2,
            borderRadius: 3,
            borderSize: 0,
            borderColor: bgColor,
          },
        },
      ];
    },
  } as any);
}

/**
 * 清除所有自动画线
 */
export function clearAutoOverlays(chart: Chart | null): void {
  if (!chart) return;
  Object.values(AUTO_GROUP).forEach((groupId) => {
    chart.removeOverlay({ groupId });
  });
}

// ============================================================
// 标签避让算法
// ============================================================

interface LabelItem {
  priority: number;
  y: number;
  showLabel: boolean;
}

/**
 * 计算标签避让
 * 收集所有标签的价格→y像素，按优先级决定哪些显示、哪些折叠为圆点
 */
function resolveLabelCollisions(
  chart: Chart | null,
  items: Array<{ price: number; priority: number }>
): Map<number, boolean> {
  if (!chart || items.length === 0) return new Map();

  // 将价格转为 y 像素坐标
  const withY = items
    .map((item) => {
      const result = chart.convertToPixel({ value: item.price }, { paneId: "candle_pane" });
      const y = typeof result === "object" && result !== null && "y" in result ? (result as any).y : NaN;
      return { ...item, y: typeof y === "number" ? y : NaN };
    })
    .filter((item) => !isNaN(item.y));

  // 按优先级排序（优先级数字越小越优先）
  withY.sort((a, b) => a.priority - b.priority);

  const result = new Map<number, boolean>();
  const placedYs: number[] = [];

  for (const item of withY) {
    // 检查是否与已放置的标签碰撞
    const collides = placedYs.some((py) => Math.abs(py - item.y) < LABEL_MIN_GAP);
    if (collides) {
      result.set(item.price, false); // 折叠
    } else {
      result.set(item.price, true); // 显示
      placedYs.push(item.y);
    }
  }

  return result;
}

// ============================================================
// 趋势线
// ============================================================

/**
 * 渲染趋势线（锁定）
 */
export function renderTrendLines(
  chart: Chart | null,
  klines: KLine[],
  trendLines: TrendLine[]
): void {
  if (!chart || trendLines.length === 0) return;
  chart.removeOverlay({ groupId: AUTO_GROUP.trendline });

  trendLines.forEach((line) => {
    const startKline = klines[line.startIndex];
    const endKline = klines[line.extendTo];
    if (!startKline || !endKline) return;

    const color = line.broken
      ? MORANDI.trendline.broken
      : line.type === "ascending"
        ? MORANDI.trendline.ascending
        : MORANDI.trendline.descending;
    const endPrice = line.startPrice + line.slope * (line.extendTo - line.startIndex);

    chart.createOverlay({
      name: "segment",
      groupId: AUTO_GROUP.trendline,
      points: [
        { timestamp: startKline.time, value: line.startPrice },
        { timestamp: endKline.time, value: endPrice },
      ],
      lock: true,
      styles: {
        line: { color, style: line.broken ? "dashed" : "solid", size: 1.5 },
      },
    } as any);
  });
}

// ============================================================
// 支撑阻力
// ============================================================

function getSRLabel(level: SupportResistance): string {
  const name = level.type === "resistance" ? "压力" : "支撑";
  return `${name}${level.rank} ${level.price.toFixed(2)}`;
}

/**
 * 渲染支撑阻力位（带右侧标签，锁定）
 * 支持按 supportCount/resistanceCount 切片
 */
export function renderSupportResistance(
  chart: Chart | null,
  klines: KLine[],
  levels: SupportResistance[],
  srConfig: { supportCount: number; resistanceCount: number },
  labelVisibility: Map<number, boolean>
): void {
  if (!chart || levels.length === 0 || klines.length === 0) return;
  chart.removeOverlay({ groupId: AUTO_GROUP.sr });

  const lastTime = klines[klines.length - 1].time;

  // 按类型和 rank 过滤
  const visible = levels.filter((level) => {
    if (level.type === "support") return level.rank <= srConfig.supportCount;
    return level.rank <= srConfig.resistanceCount;
  });

  visible.forEach((level) => {
    const color =
      level.type === "support"
        ? getSupportColor(level.rank)
        : getResistanceColor(level.rank);
    const label = getSRLabel(level);
    const showLabel = labelVisibility.get(level.price) ?? true;
    const lineStyle = level.type === "support" ? "solid" : "dashed";

    chart.createOverlay({
      name: "priceLineWithLabel",
      groupId: AUTO_GROUP.sr,
      points: [{ timestamp: lastTime, value: level.price }],
      lock: true,
      extendData: { label, bgColor: color, showLabel },
      styles: {
        line: { color, style: lineStyle, size: Math.min(1.6, 0.8 + level.touches * 0.2) },
      },
    } as any);
  });
}

// ============================================================
// 斐波那契
// ============================================================

export function renderFibonacci(
  chart: Chart | null,
  klines: KLine[],
  fib: FibonacciResult | null
): void {
  if (!chart || !fib) return;
  chart.removeOverlay({ groupId: AUTO_GROUP.fibonacci });

  const highKline = klines[fib.swingHighIndex];
  const lowKline = klines[fib.swingLowIndex];
  if (!highKline || !lowKline) return;

  chart.createOverlay({
    name: "fibonacciLine",
    groupId: AUTO_GROUP.fibonacci,
    points: [
      { timestamp: highKline.time, value: fib.swingHigh },
      { timestamp: lowKline.time, value: fib.swingLow },
    ],
    lock: true,
    styles: { line: { color: MORANDI.fibonacci, style: "solid", size: 1 } },
  } as any);
}

// ============================================================
// 成本价/止损/止盈/回踩
// ============================================================

export interface CostLineConfig {
  costPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3?: number;
  pullback?: number;
}

/**
 * 渲染成本价/止损/止盈/回踩线（带右侧标签）
 */
export function renderCostLines(
  chart: Chart | null,
  klines: KLine[],
  config: CostLineConfig | null,
  options: { showTakeProfit3: boolean; showPullback: boolean },
  labelVisibility: Map<number, boolean>
): void {
  if (!chart || !config || klines.length === 0) return;
  chart.removeOverlay({ groupId: AUTO_GROUP.cost });

  const lastTime = klines[klines.length - 1].time;

  const lines: Array<{
    price: number;
    color: string;
    label: string;
    style: "solid" | "dashed";
    size: number;
    priorityKey: string;
  }> = [
    {
      price: config.costPrice,
      color: MORANDI.trade.cost,
      label: `成本 ${config.costPrice.toFixed(2)}`,
      style: "solid",
      size: 1.8,
      priorityKey: "cost",
    },
    {
      price: config.stopLoss,
      color: MORANDI.trade.stopLoss,
      label: `止损 ${config.stopLoss.toFixed(2)}`,
      style: "dashed",
      size: 1.4,
      priorityKey: "stopLoss",
    },
    {
      price: config.takeProfit1,
      color: MORANDI.trade.takeProfit1,
      label: `止盈1 ${config.takeProfit1.toFixed(2)}`,
      style: "dashed",
      size: 1.3,
      priorityKey: "takeProfit1",
    },
    {
      price: config.takeProfit2,
      color: MORANDI.trade.takeProfit2,
      label: `止盈2 ${config.takeProfit2.toFixed(2)}`,
      style: "dashed",
      size: 1.2,
      priorityKey: "takeProfit2",
    },
  ];

  if (options.showTakeProfit3 && config.takeProfit3 && config.takeProfit3 > 0) {
    lines.push({
      price: config.takeProfit3,
      color: MORANDI.trade.takeProfit3,
      label: `止盈3 ${config.takeProfit3.toFixed(2)}`,
      style: "dashed",
      size: 1.0,
      priorityKey: "takeProfit3",
    });
  }

  if (options.showPullback && config.pullback && config.pullback > 0) {
    lines.push({
      price: config.pullback,
      color: MORANDI.trade.pullback,
      label: `回踩 ${config.pullback.toFixed(2)}`,
      style: "dashed",
      size: 1.2,
      priorityKey: "pullback",
    });
  }

  lines.forEach((line) => {
    if (line.price <= 0) return;
    const showLabel = labelVisibility.get(line.price) ?? true;
    chart.createOverlay({
      name: "priceLineWithLabel",
      groupId: AUTO_GROUP.cost,
      points: [{ timestamp: lastTime, value: line.price }],
      lock: true,
      extendData: { label: line.label, bgColor: line.color, showLabel },
      styles: { line: { color: line.color, style: line.style, size: line.size } },
    } as any);
  });
}

/**
 * 根据成本价和支撑阻力计算止损止盈
 */
export function calculateStopLossTakeProfit(
  costPrice: number,
  currentPrice: number,
  supportResistance: SupportResistance[]
): CostLineConfig | null {
  if (costPrice <= 0) return null;

  const supports = supportResistance
    .filter((sr) => sr.type === "support" && sr.price < costPrice)
    .sort((a, b) => b.price - a.price);

  const resistances = supportResistance
    .filter((sr) => sr.type === "resistance" && sr.price > currentPrice)
    .sort((a, b) => a.price - b.price);

  const stopLoss = supports.length > 0 ? supports[0].price : costPrice * 0.93;
  const takeProfit1 = resistances.length > 0 ? resistances[0].price : costPrice * 1.05;
  const takeProfit2 = resistances.length > 1 ? resistances[1].price : costPrice * 1.10;
  const takeProfit3 = resistances.length > 2 ? resistances[2].price : costPrice * 1.15;

  return { costPrice, stopLoss, takeProfit1, takeProfit2, takeProfit3 };
}

// ============================================================
// ============================================================
// 回踩线（独立渲染，不依赖成本价）
// ============================================================

/**
 * 渲染均线回踩位
 */
export function renderPullbackLines(
  chart: Chart | null,
  klines: KLine[],
  pullbacks: PullbackLevel[],
  labelVisibility: Map<number, boolean>
): void {
  if (!chart || pullbacks.length === 0 || klines.length === 0) return;
  chart.removeOverlay({ groupId: AUTO_GROUP.pullback });

  const lastTime = klines[klines.length - 1].time;

  pullbacks.forEach((pb) => {
    const showLabel = labelVisibility.get(pb.price) ?? true;
    chart.createOverlay({
      name: "priceLineWithLabel",
      groupId: AUTO_GROUP.pullback,
      points: [{ timestamp: lastTime, value: pb.price }],
      lock: true,
      extendData: {
        label: `回踩${pb.name} ${pb.price.toFixed(2)}`,
        bgColor: MORANDI.trade.pullback,
        showLabel,
      },
      styles: {
        line: { color: MORANDI.trade.pullback, style: "dashed", size: 1.2 },
      },
    } as any);
  });
}

// ============================================================
// 形态可视化渲染
// ============================================================

function getPatternColor(direction: PatternDirection): string {
  return MORANDI.analysis.contour;
}

function pivotToTimestamp(pivot: Pivot, klines: KLine[]): number | null {
  const k = klines[pivot.index];
  return k ? k.time : null;
}

/**
 * 渲染形态半透明面（覆盖整个形态区间）
 */
function renderPatternZone(
  chart: Chart | null,
  klines: KLine[],
  pattern: ChartPattern,
  groupId: string
): void {
  if (!chart || !pattern.pivots || pattern.pivots.length === 0) return;

  const startIdx = Math.max(0, Math.min(pattern.startIndex, klines.length - 1));
  const endIdx = Math.max(0, Math.min(pattern.endIndex, klines.length - 1));
  const startKline = klines[startIdx];
  const endKline = klines[endIdx];
  if (!startKline || !endKline) return;

  // 计算形态价格上下界
  const allPrices = pattern.pivots.map((p) => p.price);
  const zoneHigh = Math.max(...allPrices);
  const zoneLow = Math.min(...allPrices);

  const zoneColor = getPatternZoneColor(pattern.direction);

  // 用 rect overlay 画半透明矩形
  // KLineCharts 的 rect overlay 需要两个对角点
  chart.createOverlay({
    name: "rect",
    groupId,
    points: [
      { timestamp: startKline.time, value: zoneHigh },
      { timestamp: endKline.time, value: zoneLow },
    ],
    lock: true,
    styles: {
      style: "fill",
      color: zoneColor,
      borderSize: 0,
      borderColor: "transparent",
    },
  } as any);
}

/**
 * 渲染形态轮廓线（连接极值点的线段）
 */
function renderPatternContour(
  chart: Chart | null,
  klines: KLine[],
  pattern: ChartPattern,
  groupId: string
): void {
  if (!chart || !pattern.pivots || pattern.pivots.length === 0) return;

  const color = getPatternColor(pattern.direction);
  const lineSize = 2.0;

  // V 形反转特殊处理
  if (pattern.type === "v_reversal_top" || pattern.type === "v_reversal_bottom") {
    const pivot = pattern.pivots[0];
    const startIdx = Math.max(0, Math.min(pattern.startIndex, klines.length - 1));
    const endIdx = Math.max(0, Math.min(pattern.endIndex, klines.length - 1));
    const startKline = klines[startIdx];
    const endKline = klines[endIdx];
    const pivotKline = klines[pivot.index];
    if (!startKline || !endKline || !pivotKline) return;

    const t1 = startKline.time;
    const t2 = pivotKline.time;
    const t3 = endKline.time;

    if (pattern.type === "v_reversal_top") {
      const leftPrice = startKline.high;
      const rightPrice = endKline.low;
      chart.createOverlay({
        name: "segment", groupId,
        points: [{ timestamp: t1, value: leftPrice }, { timestamp: t2, value: pivot.price }],
        lock: true,
        styles: { line: { color: COLORS.analysis.contour, style: "solid", size: lineSize } },
      } as any);
      chart.createOverlay({
        name: "segment", groupId,
        points: [{ timestamp: t2, value: pivot.price }, { timestamp: t3, value: rightPrice }],
        lock: true,
        styles: { line: { color: COLORS.analysis.contour, style: "solid", size: lineSize } },
      } as any);
    } else {
      const leftPrice = startKline.low;
      const rightPrice = endKline.high;
      chart.createOverlay({
        name: "segment", groupId,
        points: [{ timestamp: t1, value: leftPrice }, { timestamp: t2, value: pivot.price }],
        lock: true,
        styles: { line: { color: COLORS.analysis.contour, style: "solid", size: lineSize } },
      } as any);
      chart.createOverlay({
        name: "segment", groupId,
        points: [{ timestamp: t2, value: pivot.price }, { timestamp: t3, value: rightPrice }],
        lock: true,
        styles: { line: { color: COLORS.analysis.contour, style: "solid", size: lineSize } },
      } as any);
    }

    chart.createOverlay({
      name: "circle", groupId,
      points: [{ timestamp: t2, value: pivot.price }],
      lock: true,
      styles: { point: { color, borderColor: "#ffffff", borderSize: 2, radius: 6, activeRadius: 6 } },
    } as any);
    return;
  }

  // 其他形态：按时间排序连接所有极值点
  const sorted = [...pattern.pivots].sort((a, b) => a.index - b.index);
  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    const t1 = pivotToTimestamp(p1, klines);
    const t2 = pivotToTimestamp(p2, klines);
    if (t1 === null || t2 === null) continue;

    chart.createOverlay({
      name: "segment", groupId,
      points: [{ timestamp: t1, value: p1.price }, { timestamp: t2, value: p2.price }],
      lock: true,
      styles: { line: { color, style: "solid", size: lineSize } },
    } as any);
  }

  // 关键极值点圆点标记
  sorted.forEach((p) => {
    const t = pivotToTimestamp(p, klines);
    if (t === null) return;
    chart.createOverlay({
      name: "circle", groupId,
      points: [{ timestamp: t, value: p.price }],
      lock: true,
      styles: { point: { color, borderColor: "#ffffff", borderSize: 1.5, radius: 4, activeRadius: 4 } },
    } as any);
  });
}

/**
 * 渲染形态的关键价位线（颈线、目标价、入场线、止损线）
 */
function renderPatternKeyLevels(
  chart: Chart | null,
  klines: KLine[],
  pattern: ChartPattern,
  groupId: string,
  labelVisibility: Map<number, boolean>
): void {
  if (!chart || klines.length === 0) return;
  const lastTime = klines[klines.length - 1].time;
  const currentPrice = klines[klines.length - 1].close;

  // 颈线
  if (pattern.neckline && pattern.neckline > 0) {
    const showLabel = labelVisibility.get(pattern.neckline) ?? true;
    chart.createOverlay({
      name: "priceLineWithLabel", groupId,
      points: [{ timestamp: lastTime, value: pattern.neckline }],
      lock: true,
      extendData: { label: `颈线 ${pattern.neckline.toFixed(2)}`, bgColor: MORANDI.analysis.neckline, showLabel },
      styles: { line: { color: MORANDI.analysis.neckline, style: "solid", size: 1.4 } },
    } as any);
  }

  // 目标价
  if (pattern.targetPrice && pattern.targetPrice > 0) {
    const showLabel = labelVisibility.get(pattern.targetPrice) ?? true;
    chart.createOverlay({
      name: "priceLineWithLabel", groupId,
      points: [{ timestamp: lastTime, value: pattern.targetPrice }],
      lock: true,
      extendData: { label: `目标价 ${pattern.targetPrice.toFixed(2)}`, bgColor: MORANDI.analysis.targetPrice, showLabel },
      styles: { line: { color: MORANDI.analysis.targetPrice, style: "dashed", size: 1.3 } },
    } as any);
  }

  // 入场线和止损线
  if (pattern.type === "double_top" || pattern.type === "head_shoulders_top" || pattern.type === "triple_top") {
    if (pattern.neckline) {
      const entryPrice = pattern.neckline;
      const showLabel = labelVisibility.get(entryPrice) ?? true;
      chart.createOverlay({
        name: "priceLineWithLabel", groupId,
        points: [{ timestamp: lastTime, value: entryPrice }],
        lock: true,
        extendData: { label: `入场 ${entryPrice.toFixed(2)}`, bgColor: MORANDI.analysis.entry, showLabel },
        styles: { line: { color: MORANDI.analysis.entry, style: "solid", size: 1.0 } },
      } as any);

      const highestPivot = pattern.pivots.reduce((max, p) => p.price > max.price ? p : max, pattern.pivots[0]);
      const stopPrice = highestPivot.price * 1.02;
      if (stopPrice > currentPrice) {
        const showStopLabel = labelVisibility.get(stopPrice) ?? true;
        chart.createOverlay({
          name: "priceLineWithLabel", groupId,
          points: [{ timestamp: lastTime, value: stopPrice }],
          lock: true,
          extendData: { label: `形态止损 ${stopPrice.toFixed(2)}`, bgColor: MORANDI.analysis.patternStop, showStopLabel },
          styles: { line: { color: MORANDI.analysis.patternStop, style: "dashed", size: 1.0 } },
        } as any);
      }
    }
  } else if (pattern.type === "double_bottom" || pattern.type === "head_shoulders_bottom" || pattern.type === "triple_bottom") {
    if (pattern.neckline) {
      const entryPrice = pattern.neckline;
      const showLabel = labelVisibility.get(entryPrice) ?? true;
      chart.createOverlay({
        name: "priceLineWithLabel", groupId,
        points: [{ timestamp: lastTime, value: entryPrice }],
        lock: true,
        extendData: { label: `入场 ${entryPrice.toFixed(2)}`, bgColor: MORANDI.analysis.entry, showLabel },
        styles: { line: { color: MORANDI.analysis.entry, style: "solid", size: 1.0 } },
      } as any);

      const lowestPivot = pattern.pivots.reduce((min, p) => p.price < min.price ? p : min, pattern.pivots[0]);
      const stopPrice = lowestPivot.price * 0.98;
      if (stopPrice < currentPrice) {
        const showStopLabel = labelVisibility.get(stopPrice) ?? true;
        chart.createOverlay({
          name: "priceLineWithLabel", groupId,
          points: [{ timestamp: lastTime, value: stopPrice }],
          lock: true,
          extendData: { label: `形态止损 ${stopPrice.toFixed(2)}`, bgColor: MORANDI.analysis.patternStop, showStopLabel },
          styles: { line: { color: MORANDI.analysis.patternStop, style: "dashed", size: 1.0 } },
        } as any);
      }
    }
  }
}

/**
 * 渲染形态标注（在形态起始位置添加文字标注）
 */
function renderPatternAnnotation(
  chart: Chart | null,
  klines: KLine[],
  pattern: ChartPattern,
  groupId: string
): void {
  if (!chart || klines.length === 0) return;
  const startKline = klines[pattern.startIndex];
  if (!startKline) return;

  const color = getPatternColor(pattern.direction);
  const firstPivot = pattern.pivots[0];
  if (!firstPivot) return;

  const annotationPrice = firstPivot.type === "high"
    ? firstPivot.price * 1.03
    : firstPivot.price * 0.97;

  chart.createOverlay({
    name: "priceLineWithLabel", groupId,
    points: [{ timestamp: startKline.time, value: annotationPrice }],
    lock: true,
    extendData: {
      label: `${pattern.name} ${pattern.confidence}%`,
      bgColor: color,
      showLabel: true, // 形态标注始终显示
    },
    styles: { line: { color: "transparent", style: "solid", size: 0 } },
  } as any);
}

/**
 * 渲染单个形态的所有视觉元素
 */
export function renderPatternOverlay(
  chart: Chart | null,
  klines: KLine[],
  pattern: ChartPattern | null,
  showZone: boolean,
  labelVisibility: Map<number, boolean>
): void {
  if (!chart || !pattern || klines.length === 0) return;
  chart.removeOverlay({ groupId: AUTO_GROUP.pattern });
  if (!pattern.pivots || pattern.pivots.length === 0) return;

  // 1. 半透明面（最先画，在最底层）
  if (showZone) {
    renderPatternZone(chart, klines, pattern, AUTO_GROUP.pattern);
  }

  // 2. 轮廓线
  renderPatternContour(chart, klines, pattern, AUTO_GROUP.pattern);

  // 3. 关键价位线
  renderPatternKeyLevels(chart, klines, pattern, AUTO_GROUP.pattern, labelVisibility);

  // 4. 形态标注
  renderPatternAnnotation(chart, klines, pattern, AUTO_GROUP.pattern);
}

// ============================================================
// 主渲染入口
// ============================================================

/**
 * 渲染所有自动画线（含标签避让）
 */
export function renderAllAutoOverlays(
  chart: Chart | null,
  klines: KLine[],
  options: {
    trendLines?: TrendLine[];
    supportResistance?: SupportResistance[];
    fibonacci?: FibonacciResult | null;
    costConfig?: CostLineConfig | null;
    pattern?: ChartPattern | null;
    pullbacks?: PullbackLevel[];
    visibility?: LineVisibility;
  }
): void {
  if (!chart) return;
  registerPriceLineOverlay();

  const vis = options.visibility ?? {
    support: true, resistance: true,
    supportCount: 2, resistanceCount: 2, cost: true,
    takeProfit3: false, pullback: false, pattern: true,
    patternZone: true, trendline: true, fibonacci: false,
  } as LineVisibility;

  // ============================================================
  // 第一阶段：收集所有需要标签的线，计算避让
  // ============================================================
  const labelItems: Array<{ price: number; priority: number }> = [];

  // 支撑压力
  if (vis.support || vis.resistance) {
    const visibleSR = (options.supportResistance ?? []).filter((level) => {
      if (level.type === "support") return vis.support && level.rank <= vis.supportCount;
      return vis.resistance && level.rank <= vis.resistanceCount;
    });
    visibleSR.forEach((level) => {
      const key = level.type === "support" ? `support${level.rank}` : `resistance${level.rank}`;
      labelItems.push({ price: level.price, priority: LABEL_PRIORITY[key] ?? 99 });
    });
  }

  // 成本组
  if (vis.cost && options.costConfig) {
    const cfg = options.costConfig;
    labelItems.push({ price: cfg.costPrice, priority: LABEL_PRIORITY.cost });
    labelItems.push({ price: cfg.stopLoss, priority: LABEL_PRIORITY.stopLoss });
    labelItems.push({ price: cfg.takeProfit1, priority: LABEL_PRIORITY.takeProfit1 });
    labelItems.push({ price: cfg.takeProfit2, priority: LABEL_PRIORITY.takeProfit2 });
    if (vis.takeProfit3 && cfg.takeProfit3 && cfg.takeProfit3 > 0) {
      labelItems.push({ price: cfg.takeProfit3, priority: LABEL_PRIORITY.takeProfit3 });
    }
  }

  // 回踩线
  if (vis.pullback && options.pullbacks) {
    options.pullbacks.forEach((pb) => {
      labelItems.push({ price: pb.price, priority: LABEL_PRIORITY.pullback });
    });
  }

  // 形态关键线
  if (vis.pattern && options.pattern) {
    const p = options.pattern;
    if (p.neckline) labelItems.push({ price: p.neckline, priority: LABEL_PRIORITY.neckline });
    if (p.targetPrice) labelItems.push({ price: p.targetPrice, priority: LABEL_PRIORITY.targetPrice });
  }

  // 计算避让
  const labelVisibility = resolveLabelCollisions(chart, labelItems);

  // ============================================================
  // 第二阶段：按图层顺序渲染（底层→顶层）
  // ============================================================

  // 形态面（最底层）
  if (vis.pattern && options.pattern) {
    renderPatternOverlay(chart, klines, options.pattern, vis.patternZone, labelVisibility);
  } else {
    chart.removeOverlay({ groupId: AUTO_GROUP.pattern });
  }

  // 趋势线
  if (vis.trendline && options.trendLines) {
    renderTrendLines(chart, klines, options.trendLines);
  } else {
    chart.removeOverlay({ groupId: AUTO_GROUP.trendline });
  }

  // 支撑阻力
  if (vis.support || vis.resistance) {
    renderSupportResistance(
      chart, klines,
      options.supportResistance ?? [],
      { supportCount: vis.supportCount, resistanceCount: vis.resistanceCount },
      labelVisibility
    );
  } else {
    chart.removeOverlay({ groupId: AUTO_GROUP.sr });
  }

  // 斐波那契
  if (vis.fibonacci && options.fibonacci) {
    renderFibonacci(chart, klines, options.fibonacci);
  } else {
    chart.removeOverlay({ groupId: AUTO_GROUP.fibonacci });
  }

  // 成本组
  if (vis.cost && options.costConfig) {
    renderCostLines(chart, klines, options.costConfig, {
      showTakeProfit3: vis.takeProfit3,
      showPullback: vis.pullback,
    }, labelVisibility);
  } else {
    chart.removeOverlay({ groupId: AUTO_GROUP.cost });
  }

  // 回踩线（如果成本组没包含回踩，独立渲染）
  if (vis.pullback && options.pullbacks && !(vis.cost && options.costConfig)) {
    renderPullbackLines(chart, klines, options.pullbacks, labelVisibility);
  } else if (!vis.pullback) {
    chart.removeOverlay({ groupId: AUTO_GROUP.pullback });
  }
}
