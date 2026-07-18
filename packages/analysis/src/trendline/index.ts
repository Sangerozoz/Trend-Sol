import type { KLine } from "@trend-iq/data";
import { ATR } from "@trend-iq/indicators";
import { getAllPivots, type Pivot } from "../utils/extrema";
import { lineFromTwoPoints, lineValueAt } from "../utils/linear-regression";

/**
 * 趋势线类型
 */
export type TrendLineType = "ascending" | "descending";

/**
 * 检测到的趋势线
 */
export interface TrendLine {
  /** 起点索引 */
  startIndex: number;
  /** 起点价格 */
  startPrice: number;
  /** 终点索引 */
  endIndex: number;
  /** 终点价格 */
  endPrice: number;
  /** 延伸到的索引（当前K线） */
  extendTo: number;
  /** 趋势线类型 */
  type: TrendLineType;
  /** 触碰次数（含起始两点） */
  touches: number;
  /** 评分 */
  score: number;
  /** 斜率 */
  slope: number;
  /** 截距 */
  intercept: number;
  /** 是否已被突破 */
  broken: boolean;
}

/**
 * 趋势线检测参数
 */
export interface TrendLineOptions {
  /** 取最近 N 根K线 */
  lookback?: number;
  /** 极值点检测窗口 */
  pivotOrder?: number;
  /** 触碰容差系数（×ATR） */
  toleranceK?: number;
  /** 最大趋势线数量 */
  topK?: number;
}

const DEFAULTS: Required<TrendLineOptions> = {
  lookback: 200,
  pivotOrder: 5,
  toleranceK: 0.5,
  topK: 6,
};

/**
 * 趋势线自动检测
 *
 * 算法流程：
 * 1. 取最近 N 根K线
 * 2. 极值点检测：找高点(maxPivots)和低点(minPivots)
 * 3. 候选生成：同类型极值点两两配对
 * 4. 验证：区间内不实质性突破 + 延伸段触碰计数
 * 5. 评分排序，取 Top K
 */
export function detectTrendLines(
  klines: KLine[],
  options: TrendLineOptions = {}
): TrendLine[] {
  const opts = { ...DEFAULTS, ...options };

  if (klines.length < 30) return [];

  // 取最近 N 根
  const startIdx = Math.max(0, klines.length - opts.lookback);
  const data = klines.slice(startIdx);
  const offset = startIdx;

  // 计算 ATR 作为触碰容差基准
  const highs = data.map((k) => k.high);
  const lows = data.map((k) => k.low);
  const closes = data.map((k) => k.close);
  const atrValues = ATR(highs, lows, closes, 14);
  const lastValidAtr =
    atrValues.filter((v) => v !== null).pop() ?? avgTrueRange(data);
  const tolerance = lastValidAtr * opts.toleranceK;

  // 极值点检测
  const { highs: maxPivots, lows: minPivots } = getAllPivots(data, opts.pivotOrder);

  const candidates: TrendLine[] = [];

  // 下降趋势线：连接两个高点（前者更高）
  generateCandidates(maxPivots, "descending", data, tolerance, offset, candidates);
  // 上升趋势线：连接两个低点（前者更低）
  generateCandidates(minPivots, "ascending", data, tolerance, offset, candidates);

  // 评分排序
  candidates.sort((a, b) => b.score - a.score);

  // 去重：斜率与截距相近的线合并
  const result: TrendLine[] = [];
  for (const line of candidates) {
    const isDuplicate = result.some(
      (existing) =>
        Math.abs(existing.slope - line.slope) < Math.abs(line.slope) * 0.1 &&
        Math.abs(existing.intercept - line.intercept) <
          tolerance * 2
    );
    if (!isDuplicate) {
      result.push(line);
      if (result.length >= opts.topK) break;
    }
  }

  return result;
}

/**
 * 生成候选趋势线
 */
function generateCandidates(
  pivots: Pivot[],
  type: TrendLineType,
  data: KLine[],
  tolerance: number,
  offset: number,
  result: TrendLine[]
): void {
  if (pivots.length < 2) return;

  const maxDist = Math.floor(data.length / 2);

  for (let i = 0; i < pivots.length - 1; i++) {
    for (let j = i + 1; j < pivots.length; j++) {
      const p1 = pivots[i];
      const p2 = pivots[j];
      const dist = p2.index - p1.index;

      // 间距限制
      if (dist < 3 || dist > maxDist) continue;

      // 下降趋势线：前者应更高
      if (type === "descending" && p1.price < p2.price) continue;
      // 上升趋势线：前者应更低
      if (type === "ascending" && p1.price > p2.price) continue;

      const { slope, intercept } = lineFromTwoPoints(
        p1.index,
        p1.price,
        p2.index,
        p2.price
      );

      // 验证区间内不实质性突破
      let valid = true;
      let touches = 2; // 起始两点算触碰

      for (let k = p1.index + 1; k < p2.index; k++) {
        const linePrice = lineValueAt(k, slope, intercept);
        if (type === "descending") {
          // 下降趋势线用 high 比较
          if (data[k].high > linePrice + tolerance) {
            // 实质突破，失效
            valid = false;
            break;
          }
          if (Math.abs(data[k].high - linePrice) <= tolerance) {
            touches++;
          }
        } else {
          // 上升趋势线用 low 比较
          if (data[k].low < linePrice - tolerance) {
            valid = false;
            break;
          }
          if (Math.abs(data[k].low - linePrice) <= tolerance) {
            touches++;
          }
        }
      }

      if (!valid) continue;

      // 延伸验证：检查延伸段触碰和突破
      let broken = false;
      const extendTo = data.length - 1;

      for (let k = p2.index + 1; k <= extendTo; k++) {
        const linePrice = lineValueAt(k, slope, intercept);
        if (type === "descending") {
          if (data[k].close > linePrice + tolerance) {
            broken = true;
            break;
          }
          if (Math.abs(data[k].high - linePrice) <= tolerance) {
            touches++;
          }
        } else {
          if (data[k].close < linePrice - tolerance) {
            broken = true;
            break;
          }
          if (Math.abs(data[k].low - linePrice) <= tolerance) {
            touches++;
          }
        }
      }

      // 至少 3 点确认（touches >= 3）才算强趋势线
      if (touches < 3) continue;

      // 评分
      const timeSpan = p2.index - p1.index;
      const extendLen = extendTo - p2.index;
      const score =
        touches * 3 +
        timeSpan * 0.5 +
        extendLen * 0.3 +
        (broken ? -5 : 2);

      result.push({
        startIndex: p1.index + offset,
        startPrice: p1.price,
        endIndex: p2.index + offset,
        endPrice: p2.price,
        extendTo: extendTo + offset,
        type,
        touches,
        score,
        slope,
        intercept,
        broken,
      });
    }
  }
}

/**
 * 计算平均真实波幅（ATR 不可用时的回退）
 */
function avgTrueRange(data: KLine[]): number {
  if (data.length === 0) return 1;
  const recent = data.slice(-20);
  const sum = recent.reduce((s, k) => s + (k.high - k.low), 0);
  return sum / recent.length;
}
