import type { KLine } from "@trend-iq/data";

/**
 * 斐波那契回撤位
 */
export interface FibonacciLevel {
  /** 比例 */
  ratio: number;
  /** 价格 */
  price: number;
  /** 标签 */
  label: string;
}

/**
 * 斐波那契检测结果
 */
export interface FibonacciResult {
  /** 波段高点索引 */
  swingHighIndex: number;
  /** 波段高点价格 */
  swingHigh: number;
  /** 波段低点索引 */
  swingLowIndex: number;
  /** 波段低点价格 */
  swingLow: number;
  /** 回撤位 */
  levels: FibonacciLevel[];
  /** 趋势方向 */
  direction: "up" | "down";
}

const RETRACEMENT_RATIOS = [
  { ratio: 0, label: "0%" },
  { ratio: 0.236, label: "23.6%" },
  { ratio: 0.382, label: "38.2%" },
  { ratio: 0.5, label: "50%" },
  { ratio: 0.618, label: "61.8%" },
  { ratio: 0.786, label: "78.6%" },
  { ratio: 1, label: "100%" },
];

const EXTENSION_RATIOS = [
  { ratio: 1.618, label: "161.8%" },
  { ratio: 2.618, label: "261.8%" },
];

/**
 * 斐波那契回撤自动定位
 *
 * 算法流程：
 * 1. 在最近 N 根内找最大涨幅或最大跌幅波段
 * 2. 确定端点 swingHigh, swingLow
 * 3. 计算关键比例位
 */
export function detectFibonacci(
  klines: KLine[],
  lookback: number = 200
): FibonacciResult | null {
  if (klines.length < 30) return null;

  const startIdx = Math.max(0, klines.length - lookback);
  const data = klines.slice(startIdx);
  const offset = startIdx;

  // 找最大极差波段
  let maxRange = 0;
  let swingHighIdx = 0;
  let swingLowIdx = 0;
  let swingHigh = data[0].high;
  let swingLow = data[0].low;

  // 扫描所有组合，找极差最大的波段（跨度 >= 20）
  const minSpan = Math.min(20, Math.floor(data.length / 3));

  for (let i = 0; i < data.length - minSpan; i++) {
    for (let j = i + minSpan; j < data.length; j++) {
      const high = Math.max(data[i].high, data[j].high);
      const low = Math.min(data[i].low, data[j].low);
      const range = high - low;

      if (range > maxRange) {
        maxRange = range;
        if (data[i].low <= data[j].low) {
          swingLowIdx = i;
          swingHighIdx = j;
        } else {
          swingLowIdx = j;
          swingHighIdx = i;
        }
        swingHigh = high;
        swingLow = low;
      }
    }
  }

  if (maxRange <= 0) return null;

  // 判断趋势方向
  const direction = swingLowIdx < swingHighIdx ? "up" : "down";

  // 计算回撤位
  const diff = swingHigh - swingLow;
  const levels: FibonacciLevel[] = RETRACEMENT_RATIOS.map(({ ratio, label }) => ({
    ratio,
    price: swingHigh - diff * ratio,
    label,
  }));

  // 添加扩展位
  EXTENSION_RATIOS.forEach(({ ratio, label }) => {
    levels.push({
      ratio,
      price: swingHigh + diff * (ratio - 1),
      label,
    });
  });

  return {
    swingHighIndex: swingHighIdx + offset,
    swingHigh,
    swingLowIndex: swingLowIdx + offset,
    swingLow,
    levels,
    direction,
  };
}
