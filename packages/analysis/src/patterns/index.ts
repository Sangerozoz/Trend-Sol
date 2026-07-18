import type { KLine } from "@trend-iq/data";
import type { Period } from "@trend-iq/shared";
import { getAllPivots, type Pivot } from "../utils/extrema";

/**
 * 图表形态类型
 */
export type PatternType =
  | "double_top"
  | "double_bottom"
  | "head_shoulders_top"
  | "head_shoulders_bottom"
  | "triple_top"
  | "triple_bottom"
  | "v_reversal_top"
  | "v_reversal_bottom"
  | "rising_channel"
  | "falling_channel"
  | "ascending_triangle"
  | "descending_triangle"
  | "symmetric_triangle"
  | "rectangle";

/**
 * 形态方向
 */
export type PatternDirection = "bullish" | "bearish" | "neutral";

/**
 * 检测到的图表形态
 */
export interface ChartPattern {
  /** 形态类型 */
  type: PatternType;
  /** 中文名称 */
  name: string;
  /** 方向 */
  direction: PatternDirection;
  /** 置信度 0-100 */
  confidence: number;
  /** 起始索引 */
  startIndex: number;
  /** 结束索引 */
  endIndex: number;
  /** 关键极值点 */
  pivots: Pivot[];
  /** 颈线价格（如有） */
  neckline?: number;
  /** 测量目标价 */
  targetPrice?: number;
  /** 形态描述 */
  description: string;
}

/**
 * 形态检测参数
 */
export interface PatternOptions {
  lookback?: number;
  pivotOrder?: number;
  /** 价格近似容差比例 */
  priceTolerance?: number;
  /** 双顶/双底等两顶之间最小K线间距 */
  minPairGap?: number;
  /** 头肩顶等三段结构最小K线跨度 */
  minTripleGap?: number;
  /** 最小数据量门槛 */
  minDataLength?: number;
}

const DEFAULTS: Required<PatternOptions> = {
  lookback: 200,
  pivotOrder: 5,
  priceTolerance: 0.03,
  minPairGap: 10,
  minTripleGap: 15,
  minDataLength: 30,
};

/**
 * 根据周期返回推荐的形态检测参数
 *
 * 设计原则：
 * - 极值点窗口 pivotOrder：周期越短，K线噪声越大，需要更大的窗口来过滤
 * - 间距阈值：分钟线的"10根K线"只是几十分钟，不构成有效形态；
 *   周线/月线的"10根K线"又跨度太长。这里折算成"等价交易日"来调整。
 * - 最小数据量门槛：月线一年只有12根，30根门槛会让很多月线被跳过。
 */
export function getPatternDefaultsForPeriod(period: Period): Required<PatternOptions> {
  switch (period) {
    case "daily":
      // 日线：原参数（基准）
      return { ...DEFAULTS };
    case "weekly":
      // 周线：1年52周
      // 间距 10周 = 2个月，对周线形态偏短，调到 8/12
      return {
        lookback: 150,
        pivotOrder: 4,
        priceTolerance: 0.035,
        minPairGap: 8,
        minTripleGap: 12,
        minDataLength: 25,
      };
    case "monthly":
      // 月线：1年12个月
      // 数据量天然少，门槛降到 20，间距降到 6/9（=半年/9个月）
      return {
        lookback: 120,
        pivotOrder: 3,
        priceTolerance: 0.04,
        minPairGap: 6,
        minTripleGap: 9,
        minDataLength: 20,
      };
    default:
      return { ...DEFAULTS };
  }
}

/**
 * 形态中文名映射
 */
const PATTERN_NAMES: Record<PatternType, string> = {
  double_top: "双顶(M顶)",
  double_bottom: "双底(W底)",
  head_shoulders_top: "头肩顶",
  head_shoulders_bottom: "头肩底",
  triple_top: "三重顶",
  triple_bottom: "三重底",
  v_reversal_top: "V形反转顶",
  v_reversal_bottom: "V形反转底",
  rising_channel: "上升通道",
  falling_channel: "下降通道",
  ascending_triangle: "上升三角形",
  descending_triangle: "下降三角形",
  symmetric_triangle: "对称三角形",
  rectangle: "矩形箱体",
};

/**
 * 检测图表形态
 * 基于《股市趋势技术分析》经典形态的极值点拓扑匹配
 *
 * @param klines K线数据
 * @param period K线周期，用于自动选择合适的检测参数（可选，默认按日线）
 * @param options 自定义参数，会覆盖周期默认参数
 */
export function detectPatterns(
  klines: KLine[],
  period: Period = "daily",
  options: PatternOptions = {}
): ChartPattern[] {
  const opts = { ...getPatternDefaultsForPeriod(period), ...options };
  if (klines.length < opts.minDataLength) return [];

  const startIdx = Math.max(0, klines.length - opts.lookback);
  const data = klines.slice(startIdx);
  const offset = startIdx;

  const { highs, lows } = getAllPivots(data, opts.pivotOrder);
  const currentPrice = data[data.length - 1].close;

  const patterns: ChartPattern[] = [];

  // 检测各类形态
  detectDoubleTop(highs, lows, data, offset, opts, currentPrice, patterns);
  detectDoubleBottom(highs, lows, data, offset, opts, currentPrice, patterns);
  detectHeadShoulders(highs, lows, data, offset, opts, currentPrice, patterns);
  detectTripleTop(highs, lows, data, offset, opts, currentPrice, patterns);
  detectTripleBottom(highs, lows, data, offset, opts, currentPrice, patterns);
  detectVReversal(highs, lows, data, offset, opts, currentPrice, patterns);
  detectChannels(highs, lows, data, offset, opts, patterns);
  detectTriangles(highs, lows, data, offset, opts, patterns);

  // 按置信度排序
  patterns.sort((a, b) => b.confidence - a.confidence);

  return patterns;
}

/**
 * 双顶检测
 * 拓扑: H1 > L1 < H2≈H1 > L2(破颈线)
 */
function detectDoubleTop(
  highs: Pivot[],
  lows: Pivot[],
  data: KLine[],
  offset: number,
  opts: Required<PatternOptions>,
  currentPrice: number,
  result: ChartPattern[]
): void {
  if (highs.length < 2) return;

  // 从最近的两个高点开始检查
  for (let i = highs.length - 1; i >= 1; i--) {
    const h2 = highs[i];
    const h1 = highs[i - 1];

    // h1 必须在 h2 之前且更高
    if (h1.index >= h2.index || h1.price < h2.price) continue;

    // 两顶价格近似（容差范围内）
    const priceDiff = Math.abs(h1.price - h2.price) / h1.price;
    if (priceDiff > opts.priceTolerance) continue;

    // 找两顶之间的最低点（颈线）
    const betweenLows = lows.filter((l) => l.index > h1.index && l.index < h2.index);
    if (betweenLows.length === 0) continue;
    const neckline = Math.min(...betweenLows.map((l) => l.price));

    // 两顶间距合理
    if (h2.index - h1.index < opts.minPairGap) continue;

    // 当前价是否已跌破颈线（确认形态）
    const broken = currentPrice < neckline;
    // 或者当前价接近颈线
    const nearNeckline = Math.abs(currentPrice - neckline) / neckline < 0.02;

    if (!broken && !nearNeckline) continue;

    // 测量目标：颈线 - (顶高 - 颈线)
    const targetPrice = neckline - (h1.price - neckline);

    // 置信度计算
    let confidence = 60;
    if (broken) confidence += 20; // 已突破确认
    if (priceDiff < 0.01) confidence += 10; // 两顶非常接近
    if (h2.index - h1.index > 20) confidence += 5; // 形态跨度大
    confidence = Math.min(95, confidence);

    result.push({
      type: "double_top",
      name: PATTERN_NAMES.double_top,
      direction: "bearish",
      confidence,
      startIndex: h1.index + offset,
      endIndex: h2.index + offset,
      pivots: [h1, h2, ...betweenLows].map((p) => ({ ...p, index: p.index + offset })),
      neckline,
      targetPrice,
      description: `两个高点 ${h1.price.toFixed(2)} / ${h2.price.toFixed(2)} 接近，颈线 ${neckline.toFixed(2)}${broken ? "，已跌破确认" : "，接近颈线"}`,
    });
    break; // 只取最近的一个
  }
}

/**
 * 双底检测
 * 拓扑: L1 < H1 > L2≈L1 < H2(破颈线)
 */
function detectDoubleBottom(
  highs: Pivot[],
  lows: Pivot[],
  data: KLine[],
  offset: number,
  opts: Required<PatternOptions>,
  currentPrice: number,
  result: ChartPattern[]
): void {
  if (lows.length < 2) return;

  for (let i = lows.length - 1; i >= 1; i--) {
    const l2 = lows[i];
    const l1 = lows[i - 1];

    if (l1.index >= l2.index || l1.price > l2.price) continue;

    const priceDiff = Math.abs(l1.price - l2.price) / l1.price;
    if (priceDiff > opts.priceTolerance) continue;

    const betweenHighs = highs.filter((h) => h.index > l1.index && h.index < l2.index);
    if (betweenHighs.length === 0) continue;
    const neckline = Math.max(...betweenHighs.map((h) => h.price));

    if (l2.index - l1.index < opts.minPairGap) continue;

    const broken = currentPrice > neckline;
    const nearNeckline = Math.abs(currentPrice - neckline) / neckline < 0.02;

    if (!broken && !nearNeckline) continue;

    const targetPrice = neckline + (neckline - l1.price);

    let confidence = 60;
    if (broken) confidence += 20;
    if (priceDiff < 0.01) confidence += 10;
    if (l2.index - l1.index > 20) confidence += 5;
    confidence = Math.min(95, confidence);

    result.push({
      type: "double_bottom",
      name: PATTERN_NAMES.double_bottom,
      direction: "bullish",
      confidence,
      startIndex: l1.index + offset,
      endIndex: l2.index + offset,
      pivots: [l1, l2, ...betweenHighs].map((p) => ({ ...p, index: p.index + offset })),
      neckline,
      targetPrice,
      description: `两个低点 ${l1.price.toFixed(2)} / ${l2.price.toFixed(2)} 接近，颈线 ${neckline.toFixed(2)}${broken ? "，已突破确认" : "，接近颈线"}`,
    });
    break;
  }
}

/**
 * 头肩顶检测
 * 拓扑: LS < H(最高) > RS, LS ≈ RS
 */
function detectHeadShoulders(
  highs: Pivot[],
  lows: Pivot[],
  data: KLine[],
  offset: number,
  opts: Required<PatternOptions>,
  currentPrice: number,
  result: ChartPattern[]
): void {
  if (highs.length < 3) return;

  // 找最近三个高点
  for (let i = highs.length - 1; i >= 2; i--) {
    const rightShoulder = highs[i];
    const head = highs[i - 1];
    const leftShoulder = highs[i - 2];

    // 顺序检查
    if (leftShoulder.index >= head.index || head.index >= rightShoulder.index) continue;

    // 头部必须最高
    if (head.price <= leftShoulder.price || head.price <= rightShoulder.price) continue;

    // 左右肩近似
    const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price) / Math.max(leftShoulder.price, rightShoulder.price);
    if (shoulderDiff > opts.priceTolerance * 1.5) continue;

    // 颈线：两肩之间的低点连线
    const betweenLows = lows.filter((l) => l.index > leftShoulder.index && l.index < rightShoulder.index);
    if (betweenLows.length < 1) continue;
    const neckline = Math.min(...betweenLows.map((l) => l.price));

    // 间距合理
    if (rightShoulder.index - leftShoulder.index < opts.minTripleGap) continue;

    const broken = currentPrice < neckline;
    const nearNeckline = Math.abs(currentPrice - neckline) / neckline < 0.02;

    if (!broken && !nearNeckline) continue;

    const targetPrice = neckline - (head.price - neckline);

    let confidence = 65;
    if (broken) confidence += 20;
    if (shoulderDiff < 0.02) confidence += 8;
    confidence = Math.min(95, confidence);

    result.push({
      type: "head_shoulders_top",
      name: PATTERN_NAMES.head_shoulders_top,
      direction: "bearish",
      confidence,
      startIndex: leftShoulder.index + offset,
      endIndex: rightShoulder.index + offset,
      pivots: [leftShoulder, head, rightShoulder].map((p) => ({ ...p, index: p.index + offset })),
      neckline,
      targetPrice,
      description: `左肩 ${leftShoulder.price.toFixed(2)} / 头部 ${head.price.toFixed(2)} / 右肩 ${rightShoulder.price.toFixed(2)}，颈线 ${neckline.toFixed(2)}`,
    });
    break;
  }
}

/**
 * 三重顶检测
 */
function detectTripleTop(
  highs: Pivot[],
  lows: Pivot[],
  data: KLine[],
  offset: number,
  opts: Required<PatternOptions>,
  currentPrice: number,
  result: ChartPattern[]
): void {
  if (highs.length < 3) return;

  for (let i = highs.length - 1; i >= 2; i--) {
    const h3 = highs[i];
    const h2 = highs[i - 1];
    const h1 = highs[i - 2];

    if (h1.index >= h2.index || h2.index >= h3.index) continue;

    // 三个高点近似
    const avg = (h1.price + h2.price + h3.price) / 3;
    const maxDiff = Math.max(
      Math.abs(h1.price - avg),
      Math.abs(h2.price - avg),
      Math.abs(h3.price - avg)
    ) / avg;

    if (maxDiff > opts.priceTolerance) continue;

    // 颈线
    const betweenLows = lows.filter((l) => l.index > h1.index && l.index < h3.index);
    if (betweenLows.length < 1) continue;
    const neckline = Math.min(...betweenLows.map((l) => l.price));

    if (h3.index - h1.index < opts.minTripleGap) continue;

    const broken = currentPrice < neckline;

    if (!broken) continue;

    const targetPrice = neckline - (avg - neckline);

    let confidence = 70;
    if (maxDiff < 0.015) confidence += 15;
    confidence = Math.min(95, confidence);

    result.push({
      type: "triple_top",
      name: PATTERN_NAMES.triple_top,
      direction: "bearish",
      confidence,
      startIndex: h1.index + offset,
      endIndex: h3.index + offset,
      pivots: [h1, h2, h3].map((p) => ({ ...p, index: p.index + offset })),
      neckline,
      targetPrice,
      description: `三个高点 ${h1.price.toFixed(2)}/${h2.price.toFixed(2)}/${h3.price.toFixed(2)} 近似，已破颈线 ${neckline.toFixed(2)}`,
    });
    break;
  }
}

/**
 * 三重底检测
 */
function detectTripleBottom(
  highs: Pivot[],
  lows: Pivot[],
  data: KLine[],
  offset: number,
  opts: Required<PatternOptions>,
  currentPrice: number,
  result: ChartPattern[]
): void {
  if (lows.length < 3) return;

  for (let i = lows.length - 1; i >= 2; i--) {
    const l3 = lows[i];
    const l2 = lows[i - 1];
    const l1 = lows[i - 2];

    if (l1.index >= l2.index || l2.index >= l3.index) continue;

    const avg = (l1.price + l2.price + l3.price) / 3;
    const maxDiff = Math.max(
      Math.abs(l1.price - avg),
      Math.abs(l2.price - avg),
      Math.abs(l3.price - avg)
    ) / avg;

    if (maxDiff > opts.priceTolerance) continue;

    const betweenHighs = highs.filter((h) => h.index > l1.index && h.index < l3.index);
    if (betweenHighs.length < 1) continue;
    const neckline = Math.max(...betweenHighs.map((h) => h.price));

    if (l3.index - l1.index < opts.minTripleGap) continue;

    const broken = currentPrice > neckline;
    if (!broken) continue;

    const targetPrice = neckline + (neckline - avg);

    let confidence = 70;
    if (maxDiff < 0.015) confidence += 15;
    confidence = Math.min(95, confidence);

    result.push({
      type: "triple_bottom",
      name: PATTERN_NAMES.triple_bottom,
      direction: "bullish",
      confidence,
      startIndex: l1.index + offset,
      endIndex: l3.index + offset,
      pivots: [l1, l2, l3].map((p) => ({ ...p, index: p.index + offset })),
      neckline,
      targetPrice,
      description: `三个低点 ${l1.price.toFixed(2)}/${l2.price.toFixed(2)}/${l3.price.toFixed(2)} 近似，已破颈线 ${neckline.toFixed(2)}`,
    });
    break;
  }
}

/**
 * V形反转检测
 * 特征：单一极值点，两侧斜率陡峭
 *
 * 窗口宽度按周期缩放：日线20根≈1个月，分钟线用 minTripleGap*1.5 ≈ 2-4小时，
 * 周线/月线按比例缩短。
 */
function detectVReversal(
  highs: Pivot[],
  lows: Pivot[],
  data: KLine[],
  offset: number,
  opts: Required<PatternOptions>,
  currentPrice: number,
  result: ChartPattern[]
): void {
  // V形反转的左右窗口宽度（根数）
  const window = Math.max(8, Math.round(opts.minTripleGap * 1.5));

  // V形底：检查最近的低点
  if (lows.length >= 1) {
    const bottom = lows[lows.length - 1];
    const leftData = data.slice(Math.max(0, bottom.index - window), bottom.index);
    const rightData = data.slice(bottom.index, Math.min(data.length, bottom.index + window));

    if (leftData.length >= 5 && rightData.length >= 5) {
      const leftDrop = leftData[0].high - bottom.price;
      const rightRise = rightData[rightData.length - 1].high - bottom.price;
      const leftPct = leftDrop / leftData[0].high;
      const rightPct = rightRise / bottom.price;

      // 急跌急涨，幅度超过8%
      if (leftPct > 0.08 && rightPct > 0.08) {
        result.push({
          type: "v_reversal_bottom",
          name: PATTERN_NAMES.v_reversal_bottom,
          direction: "bullish",
          confidence: 75,
          startIndex: bottom.index - window + offset,
          endIndex: bottom.index + window + offset,
          pivots: [{ ...bottom, index: bottom.index + offset }],
          description: `V底 ${bottom.price.toFixed(2)}，左侧急跌 ${(leftPct * 100).toFixed(1)}%，右侧急涨 ${(rightPct * 100).toFixed(1)}%`,
        });
      }
    }
  }

  // V形顶：检查最近的高点
  if (highs.length >= 1) {
    const top = highs[highs.length - 1];
    const leftData = data.slice(Math.max(0, top.index - window), top.index);
    const rightData = data.slice(top.index, Math.min(data.length, top.index + window));

    if (leftData.length >= 5 && rightData.length >= 5) {
      const leftRise = top.price - leftData[0].low;
      const rightDrop = top.price - rightData[rightData.length - 1].low;
      const leftPct = leftRise / leftData[0].low;
      const rightPct = rightDrop / top.price;

      if (leftPct > 0.08 && rightPct > 0.08) {
        result.push({
          type: "v_reversal_top",
          name: PATTERN_NAMES.v_reversal_top,
          direction: "bearish",
          confidence: 75,
          startIndex: top.index - window + offset,
          endIndex: top.index + window + offset,
          pivots: [{ ...top, index: top.index + offset }],
          description: `V顶 ${top.price.toFixed(2)}，左侧急涨 ${(leftPct * 100).toFixed(1)}%，右侧急跌 ${(rightPct * 100).toFixed(1)}%`,
        });
      }
    }
  }
}

/**
 * 通道检测
 */
function detectChannels(
  highs: Pivot[],
  lows: Pivot[],
  data: KLine[],
  offset: number,
  opts: Required<PatternOptions>,
  result: ChartPattern[]
): void {
  if (highs.length < 2 || lows.length < 2) return;

  const recentHighs = highs.slice(-3);
  const recentLows = lows.slice(-3);

  // 上升通道：高点递增，低点递增
  if (recentHighs.length >= 2 && recentLows.length >= 2) {
    const highsAscending = recentHighs.every((h, i) => i === 0 || h.price > recentHighs[i - 1].price);
    const lowsAscending = recentLows.every((l, i) => i === 0 || l.price > recentLows[i - 1].price);

    if (highsAscending && lowsAscending) {
      result.push({
        type: "rising_channel",
        name: PATTERN_NAMES.rising_channel,
        direction: "bullish",
        confidence: 68,
        startIndex: Math.min(recentHighs[0].index, recentLows[0].index) + offset,
        endIndex: data.length - 1 + offset,
        pivots: [...recentHighs, ...recentLows].map((p) => ({ ...p, index: p.index + offset })),
        description: "高点低点同步递增，上升通道形成",
      });
    }
  }

  // 下降通道
  const highsDescending = recentHighs.every((h, i) => i === 0 || h.price < recentHighs[i - 1].price);
  const lowsDescending = recentLows.every((l, i) => i === 0 || l.price < recentLows[i - 1].price);

  if (highsDescending && lowsDescending) {
    result.push({
      type: "falling_channel",
      name: PATTERN_NAMES.falling_channel,
      direction: "bearish",
      confidence: 68,
      startIndex: Math.min(recentHighs[0].index, recentLows[0].index) + offset,
      endIndex: data.length - 1 + offset,
      pivots: [...recentHighs, ...recentLows].map((p) => ({ ...p, index: p.index + offset })),
      description: "高点低点同步递降，下降通道形成",
    });
  }
}

/**
 * 三角形检测
 */
function detectTriangles(
  highs: Pivot[],
  lows: Pivot[],
  data: KLine[],
  offset: number,
  opts: Required<PatternOptions>,
  result: ChartPattern[]
): void {
  if (highs.length < 2 || lows.length < 2) return;

  const recentHighs = highs.slice(-2);
  const recentLows = lows.slice(-2);

  if (recentHighs.length < 2 || recentLows.length < 2) return;

  const highsConverging = recentHighs[1].price < recentHighs[0].price; // 高点递降
  const lowsRising = recentLows[1].price > recentLows[0].price; // 低点递升
  const highsConverging2 = recentHighs[1].price < recentHighs[0].price;
  const lowsFalling = recentLows[1].price < recentLows[0].price;

  // 上升三角形：高点水平 + 低点递升
  const highsLevel = Math.abs(recentHighs[0].price - recentHighs[1].price) / recentHighs[0].price < opts.priceTolerance;
  if (highsLevel && lowsRising) {
    result.push({
      type: "ascending_triangle",
      name: PATTERN_NAMES.ascending_triangle,
      direction: "bullish",
      confidence: 65,
      startIndex: Math.min(recentHighs[0].index, recentLows[0].index) + offset,
      endIndex: data.length - 1 + offset,
      pivots: [...recentHighs, ...recentLows].map((p) => ({ ...p, index: p.index + offset })),
      description: "顶部水平 + 底部递升，上升三角形",
    });
  }

  // 下降三角形：高点递降 + 低点水平
  const lowsLevel = Math.abs(recentLows[0].price - recentLows[1].price) / recentLows[0].price < opts.priceTolerance;
  if (highsConverging && lowsLevel) {
    result.push({
      type: "descending_triangle",
      name: PATTERN_NAMES.descending_triangle,
      direction: "bearish",
      confidence: 65,
      startIndex: Math.min(recentHighs[0].index, recentLows[0].index) + offset,
      endIndex: data.length - 1 + offset,
      pivots: [...recentHighs, ...recentLows].map((p) => ({ ...p, index: p.index + offset })),
      description: "顶部递降 + 底部水平，下降三角形",
    });
  }

  // 对称三角形：高点递降 + 低点递升
  if (highsConverging && lowsRising) {
    result.push({
      type: "symmetric_triangle",
      name: PATTERN_NAMES.symmetric_triangle,
      direction: "neutral",
      confidence: 60,
      startIndex: Math.min(recentHighs[0].index, recentLows[0].index) + offset,
      endIndex: data.length - 1 + offset,
      pivots: [...recentHighs, ...recentLows].map((p) => ({ ...p, index: p.index + offset })),
      description: "高点递降 + 低点递升，对称三角形收敛",
    });
  }
}
