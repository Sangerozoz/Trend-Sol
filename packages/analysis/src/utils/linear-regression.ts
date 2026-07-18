/**
 * 线性回归工具
 */

/**
 * 线性回归结果
 */
export interface RegressionResult {
  /** 斜率 */
  slope: number;
  /** 截距 */
  intercept: number;
  /** R² 决定系数 */
  r2: number;
}

/**
 * 最小二乘法线性回归
 * y = slope * x + intercept
 *
 * @param points 数据点数组 [x, y][]
 * @returns 回归结果
 */
export function linearRegression(points: [number, number][]): RegressionResult {
  const n = points.length;
  if (n < 2) {
    return { slope: 0, intercept: 0, r2: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const [x, y] of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;

  const denominator = sumX2 - n * meanX * meanX;
  if (Math.abs(denominator) < 1e-10) {
    return { slope: 0, intercept: meanY, r2: 0 };
  }

  const slope = (sumXY - n * meanX * meanY) / denominator;
  const intercept = meanY - slope * meanX;

  // R² 计算
  const ssTotal = sumY2 - n * meanY * meanY;
  const ssResidual =
    points.reduce((sum, [x, y]) => {
      const predicted = slope * x + intercept;
      return sum + (y - predicted) ** 2;
    }, 0);

  const r2 = ssTotal > 1e-10 ? 1 - ssResidual / ssTotal : 0;

  return { slope, intercept, r2: Math.max(0, Math.min(1, r2)) };
}

/**
 * 给定两点，计算直线参数
 * y = slope * x + intercept
 */
export function lineFromTwoPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { slope: number; intercept: number } {
  if (Math.abs(x2 - x1) < 1e-10) {
    return { slope: 0, intercept: y1 };
  }
  const slope = (y2 - y1) / (x2 - x1);
  const intercept = y1 - slope * x1;
  return { slope, intercept };
}

/**
 * 计算直线上某 x 对应的 y 值
 */
export function lineValueAt(
  x: number,
  slope: number,
  intercept: number
): number {
  return slope * x + intercept;
}
