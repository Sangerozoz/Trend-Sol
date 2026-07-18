import { describe, it, expect } from "vitest";
import type { KLine } from "@trend-iq/data";
import {
  findPivots,
  filterByProminence,
  getAllPivots,
  type Pivot,
} from "../utils/extrema";

/** 构造 KLine 序列；highs/lows 一一对应（其余字段占位） */
function mk(highs: number[], lows: number[]): KLine[] {
  return highs.map((h, i) => ({
    time: i,
    open: h,
    high: h,
    low: lows[i] ?? h,
    close: h,
    volume: 0,
    amount: 0,
  })) as KLine[];
}

describe("findPivots", () => {
  it("窗口内识别唯一高点", () => {
    const kl = mk([1, 3, 2], [1, 1, 1]);
    const pivots = findPivots(kl, 1, "high");
    expect(pivots).toEqual([{ index: 1, price: 3, type: "high" }]);
  });

  it("端点不入选（order 边界）", () => {
    const kl = mk([5, 1, 1], [0, 0, 0]);
    // index0 处于 i<order 区被排除；index1/2 非极值
    const pivots = findPivots(kl, 1, "high");
    expect(pivots).toHaveLength(0);
  });

  it("识别低点", () => {
    const kl = mk([0, 0, 0], [3, 1, 3]);
    const pivots = findPivots(kl, 1, "low");
    expect(pivots).toEqual([{ index: 1, price: 1, type: "low" }]);
  });
});

describe("filterByProminence", () => {
  it("pivots 不足 2 个时原样返回", () => {
    const kl = mk([0, 0, 0], [0, 0, 0]);
    const single: Pivot[] = [{ index: 0, price: 100, type: "high" }];
    expect(filterByProminence(single, kl)).toEqual(single);
  });

  it("显著度低于阈值的噪声极值点被滤除，首尾保留", () => {
    // 每根 K 线 high-low=10 → avgRange=10 → threshold=3
    const kl = mk([20, 20, 20, 20, 20], [10, 10, 10, 10, 10]);
    const pivots: Pivot[] = [
      { index: 0, price: 100, type: "high" },
      { index: 1, price: 100, type: "high" }, // 与相邻差为 0 < threshold
      { index: 2, price: 100, type: "high" },
    ];
    const out = filterByProminence(pivots, kl, 0.3);
    expect(out).toEqual([pivots[0], pivots[2]]);
  });
});

describe("getAllPivots", () => {
  it("返回已过滤的 highs 与 lows", () => {
    const kl = mk([1, 3, 2], [3, 1, 3]);
    const { highs, lows } = getAllPivots(kl, 1);
    expect(Array.isArray(highs)).toBe(true);
    expect(Array.isArray(lows)).toBe(true);
    expect(highs).toEqual([{ index: 1, price: 3, type: "high" }]);
    expect(lows).toEqual([{ index: 1, price: 1, type: "low" }]);
  });
});
