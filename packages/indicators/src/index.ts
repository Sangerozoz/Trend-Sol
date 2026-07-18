/**
 * 技术指标库
 * 所有指标函数接收价格数组，返回与输入等长的结果数组
 * 无效位置（数据不足的起始部分）用 null 填充
 */

/**
 * 计算结果类型：每个位置可能有值或为 null
 */
export type IndicatorValue = number | null;

/**
 * SMA（简单移动平均）
 * @param values 价格数组（通常是收盘价）
 * @param period 周期
 * @returns 与 values 等长的数组，前 period-1 个为 null
 */
export function SMA(values: number[], period: number): IndicatorValue[] {
  const result: IndicatorValue[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return result;

  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i >= period - 1) {
      result[i] = sum / period;
    }
  }
  return result;
}

/**
 * EMA（指数移动平均）
 * 递推公式: EMA(t) = α * price(t) + (1-α) * EMA(t-1), α = 2/(period+1)
 * 首个 EMA 值用前 period 个价格的 SMA 初始化
 * @param values 价格数组
 * @param period 周期
 * @returns 与 values 等长的数组
 */
export function EMA(values: number[], period: number): IndicatorValue[] {
  const result: IndicatorValue[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return result;

  const alpha = 2 / (period + 1);

  // 用前 period 个值的 SMA 作为 EMA 的初始值
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  result[period - 1] = sum / period;

  // 递推计算后续 EMA
  for (let i = period; i < values.length; i++) {
    const prev = result[i - 1] as number;
    result[i] = alpha * values[i] + (1 - alpha) * prev;
  }

  return result;
}

/**
 * 双 EMA 交叉判断
 * @param fastPeriod 快线周期（如 5）
 * @param slowPeriod 慢线周期（如 20）
 * @returns 交叉信号数组：1=金叉, -1=死叉, 0=无交叉
 */
export function emaCross(
  values: number[],
  fastPeriod: number,
  slowPeriod: number
): number[] {
  const fast = EMA(values, fastPeriod);
  const slow = EMA(values, slowPeriod);
  const signals = new Array(values.length).fill(0);

  for (let i = 1; i < values.length; i++) {
    if (fast[i] === null || slow[i] === null || fast[i - 1] === null || slow[i - 1] === null) {
      continue;
    }

    const prevDiff = (fast[i - 1] as number) - (slow[i - 1] as number);
    const currDiff = (fast[i] as number) - (slow[i] as number);

    // 金叉：快线从下方穿越到上方
    if (prevDiff <= 0 && currDiff > 0) {
      signals[i] = 1;
    }
    // 死叉：快线从上方穿越到下方
    else if (prevDiff >= 0 && currDiff < 0) {
      signals[i] = -1;
    }
  }

  return signals;
}

/**
 * 计算真实波动幅度（TR, True Range）
 * TR = max(high-low, |high-prevClose|, |low-prevClose|)
 */
export function TR(
  highs: number[],
  lows: number[],
  closes: number[]
): number[] {
  const result = new Array(highs.length).fill(0);
  result[0] = highs[0] - lows[0];

  for (let i = 1; i < highs.length; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    result[i] = Math.max(hl, hc, lc);
  }

  return result;
}

/**
 * ATR（平均真实波动幅度）
 * 用于衡量市场波动性，也作为趋势线触碰容差的基准
 * @param highs 最高价数组
 * @param lows 最低价数组
 * @param closes 收盘价数组
 * @param period 周期（通常 14）
 * @returns ATR 值数组
 */
export function ATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): IndicatorValue[] {
  const tr = TR(highs, lows, closes);
  const result: IndicatorValue[] = new Array(highs.length).fill(null);

  if (highs.length < period) return result;

  // 第一个 ATR 是前 period 个 TR 的简单平均
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += tr[i];
  }
  result[period - 1] = sum / period;

  // 后续 ATR 用递推: ATR(t) = (ATR(t-1)*(period-1) + TR(t)) / period
  for (let i = period; i < highs.length; i++) {
    const prev = result[i - 1] as number;
    result[i] = (prev * (period - 1) + tr[i]) / period;
  }

  return result;
}
