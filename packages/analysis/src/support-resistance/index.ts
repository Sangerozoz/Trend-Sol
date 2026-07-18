import type { KLine } from "@trend-iq/data";
import { ATR } from "@trend-iq/indicators";
import { getAllPivots } from "../utils/extrema";

/**
 * 支撑阻力位
 */
export interface SupportResistance {
  /** 价格位 */
  price: number;
  /** 类型 */
  type: "support" | "resistance";
  /** 触碰次数 */
  touches: number;
  /** 强度评分 */
  strength: number;
  /** 排名：1=最接近当前价，2=次接近 */
  rank: number;
}

/**
 * 支撑阻力检测参数
 */
export interface SROptions {
  /** 取最近 N 根K线 */
  lookback?: number;
  /** 极值点检测窗口 */
  pivotOrder?: number;
  /** 桶宽系数（×ATR） */
  bucketWidthK?: number;
  /** 最大数量 */
  topM?: number;
}

const DEFAULTS: Required<SROptions> = {
  lookback: 250,
  pivotOrder: 5,
  bucketWidthK: 0.5,
  topM: 5,
};

/**
 * 支撑阻力位检测
 *
 * 算法流程：
 * 1. 收集历史极值点价格
 * 2. 价格聚类（等宽分桶）
 * 3. 触碰计数 + 强度评分
 * 4. 区分支撑/阻力
 */
export function detectSupportResistance(
  klines: KLine[],
  options: SROptions = {}
): SupportResistance[] {
  const opts = { ...DEFAULTS, ...options };

  if (klines.length < 30) return [];

  const startIdx = Math.max(0, klines.length - opts.lookback);
  const data = klines.slice(startIdx);

  // 计算 ATR
  const highs = data.map((k) => k.high);
  const lows = data.map((k) => k.low);
  const closes = data.map((k) => k.close);
  const atrValues = ATR(highs, lows, closes, 14);
  const lastValidAtr =
    atrValues.filter((v) => v !== null).pop() ??
    data.reduce((s, k) => s + (k.high - k.low), 0) / data.length;

  const bucketWidth = lastValidAtr * opts.bucketWidthK;
  if (bucketWidth <= 0) return [];

  // 收集极值点
  const { highs: maxPivots, lows: minPivots } = getAllPivots(data, opts.pivotOrder);
  const allPivots = [...maxPivots, ...minPivots];

  if (allPivots.length === 0) return [];

  // 价格聚类（等宽分桶）
  const buckets = new Map<number, { price: number; touches: number; indices: number[] }>();

  for (const pivot of allPivots) {
    const bucketKey = Math.floor(pivot.price / bucketWidth);
    const bucket = buckets.get(bucketKey) ?? {
      price: pivot.price,
      touches: 0,
      indices: [],
    };

    bucket.touches++;
    bucket.indices.push(pivot.index);
    // 更新桶的代表价格为平均值
    bucket.price = (bucket.price * (bucket.touches - 1) + pivot.price) / bucket.touches;
    buckets.set(bucketKey, bucket);
  }

  // 合并相邻桶
  const sortedKeys = [...buckets.keys()].sort((a, b) => a - b);
  const merged: Array<{ price: number; touches: number; indices: number[] }> = [];

  for (const key of sortedKeys) {
    const bucket = buckets.get(key)!;
    const last = merged[merged.length - 1];

    if (last && Math.abs(last.price - bucket.price) < bucketWidth) {
      // 合并
      last.price = (last.price * last.touches + bucket.price * bucket.touches) /
        (last.touches + bucket.touches);
      last.touches += bucket.touches;
      last.indices.push(...bucket.indices);
    } else {
      merged.push({ ...bucket });
    }
  }

  // 当前价
  const currentPrice = data[data.length - 1].close;

  // 计算强度并区分支撑/阻力
  const results: SupportResistance[] = merged
    .filter((b) => b.touches >= 2)
    .map((b) => {
      const timeSpan = Math.max(...b.indices) - Math.min(...b.indices);
      const strength = b.touches * 2 + timeSpan * 0.1;

      return {
        price: b.price,
        type: b.price > currentPrice ? "resistance" : "support",
        touches: b.touches,
        strength,
        rank: 0, // 待排序后赋值
      };
    });

  // 支撑位：按距当前价从近到远排序（最接近的 = rank 1）
  const supports = results
    .filter((r) => r.type === "support")
    .sort((a, b) => b.price - a.price) // 支撑位从高到低（最接近当前价的在前）
    .slice(0, opts.topM)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  // 阻力位：按距当前价从近到远排序（最接近的 = rank 1）
  const resistances = results
    .filter((r) => r.type === "resistance")
    .sort((a, b) => a.price - b.price) // 阻力位从低到高（最接近当前价的在前）
    .slice(0, opts.topM)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return [...supports, ...resistances];
}
