import type { KLine } from "@trend-iq/data";

/**
 * 极值点类型
 */
export interface Pivot {
  index: number;
  price: number;
  type: "high" | "low";
}

/**
 * 极值点检测
 * 替代 scipy.signal.argrelextrema，纯 TS 实现
 *
 * @param klines K线数据
 * @param order 窗口大小（前后各 order 根K线内是否为极值）
 * @param type "high" 找高点 | "low" 找低点
 * @returns 极值点数组
 */
export function findPivots(
  klines: KLine[],
  order: number = 5,
  type: "high" | "low"
): Pivot[] {
  const pivots: Pivot[] = [];
  const prices = type === "high" ? klines.map((k) => k.high) : klines.map((k) => k.low);

  for (let i = order; i < prices.length - order; i++) {
    const current = prices[i];
    let isExtreme = true;

    for (let j = i - order; j <= i + order; j++) {
      if (j === i) continue;
      if (type === "high" && prices[j] >= current) {
        isExtreme = false;
        break;
      }
      if (type === "low" && prices[j] <= current) {
        isExtreme = false;
        break;
      }
    }

    if (isExtreme) {
      pivots.push({ index: i, price: current, type });
    }
  }

  return pivots;
}

/**
 * 显著度过滤
 * 过滤掉幅度太小的噪声极值点
 *
 * @param pivots 极值点数组
 * @param klines K线数据
 * @param thresholdRatio 显著度阈值比例（相对于近期波幅）
 */
export function filterByProminence(
  pivots: Pivot[],
  klines: KLine[],
  thresholdRatio: number = 0.3
): Pivot[] {
  if (pivots.length < 2) return pivots;

  // 计算近期平均波幅作为基准
  const recentCandles = klines.slice(-60);
  const avgRange =
    recentCandles.reduce((sum, k) => sum + (k.high - k.low), 0) /
    recentCandles.length;
  const threshold = avgRange * thresholdRatio;

  return pivots.filter((pivot, idx) => {
    // 第一个和最后一个保留
    if (idx === 0 || idx === pivots.length - 1) return true;

    const prev = pivots[idx - 1];
    const next = pivots[idx + 1];

    // 显著度 = 与相邻极值点的高度差
    const prominence =
      pivot.type === "high"
        ? Math.min(pivot.price - prev.price, pivot.price - next.price)
        : Math.min(prev.price - pivot.price, next.price - pivot.price);

    return prominence >= threshold;
  });
}

/**
 * 获取所有极值点（高点+低点），已过滤显著度
 */
export function getAllPivots(klines: KLine[], order: number = 5): {
  highs: Pivot[];
  lows: Pivot[];
} {
  const rawHighs = findPivots(klines, order, "high");
  const rawLows = findPivots(klines, order, "low");

  return {
    highs: filterByProminence(rawHighs, klines),
    lows: filterByProminence(rawLows, klines),
  };
}
