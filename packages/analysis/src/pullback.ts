import type { KLine } from "@trend-iq/data";
import { SMA } from "@trend-iq/indicators";

/**
 * 回踩位检测结果
 */
export interface PullbackLevel {
  /** 均线周期（如 20、60） */
  maPeriod: number;
  /** 均线当前值 */
  price: number;
  /** 均线名称 */
  name: string;
  /** 当前价与均线的偏离百分比（正=在均线上方，负=在均线下方） */
  deviation: number;
}

/**
 * 检测均线回踩位
 *
 * 计算逻辑：
 * 1. 计算 MA20 和 MA60
 * 2. 检查当前价格是否接近某条均线（在 ±2% 范围内）
 * 3. 若接近，标记为回踩位
 * 4. 若同时接近多条均线，取偏离度最小的
 *
 * @param klines K线数据
 * @param tolerance 偏离容差比例（默认 0.02 = ±2%）
 * @returns 回踩位数组（可能为空、1个或2个）
 */
export function detectPullback(
  klines: KLine[],
  tolerance: number = 0.02
): PullbackLevel[] {
  if (klines.length < 60) return [];

  const closes = klines.map((k) => k.close);
  const currentPrice = closes[closes.length - 1];

  const ma20Values = SMA(closes, 20);
  const ma60Values = SMA(closes, 60);

  const ma20 = ma20Values[ma20Values.length - 1];
  const ma60 = ma60Values[ma60Values.length - 1];

  const results: PullbackLevel[] = [];

  if (ma20 !== null) {
    const deviation = (currentPrice - ma20) / ma20;
    if (Math.abs(deviation) <= tolerance) {
      results.push({
        maPeriod: 20,
        price: ma20,
        name: "MA20",
        deviation,
      });
    }
  }

  if (ma60 !== null) {
    const deviation = (currentPrice - ma60) / ma60;
    if (Math.abs(deviation) <= tolerance) {
      results.push({
        maPeriod: 60,
        price: ma60,
        name: "MA60",
        deviation,
      });
    }
  }

  // 按偏离度绝对值排序，最近的在前
  results.sort((a, b) => Math.abs(a.deviation) - Math.abs(b.deviation));

  return results;
}
