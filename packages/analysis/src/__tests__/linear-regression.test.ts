import { describe, it, expect } from "vitest";
import {
  linearRegression,
  lineFromTwoPoints,
  lineValueAt,
} from "../utils/linear-regression";

describe("linearRegression", () => {
  it("两点精确斜率与截距", () => {
    const r = linearRegression([
      [0, 0],
      [2, 4],
    ]);
    expect(r.slope).toBeCloseTo(2);
    expect(r.intercept).toBeCloseTo(0);
    expect(r.r2).toBeCloseTo(1);
  });

  it("多点完美线性 R²≈1", () => {
    const pts: [number, number][] = [
      [0, 1],
      [1, 3],
      [2, 5],
      [3, 7],
    ]; // y = 2x + 1
    const r = linearRegression(pts);
    expect(r.slope).toBeCloseTo(2);
    expect(r.intercept).toBeCloseTo(1);
    expect(r.r2).toBeCloseTo(1);
  });

  it("n<2 返回零向量（边界）", () => {
    expect(linearRegression([])).toEqual({ slope: 0, intercept: 0, r2: 0 });
    expect(linearRegression([[1, 2]])).toEqual({ slope: 0, intercept: 0, r2: 0 });
  });

  it("竖直 x 重复（分母为 0）返回 intercept=meanY（边界）", () => {
    const r = linearRegression([
      [5, 1],
      [5, 9],
    ]);
    expect(r.slope).toBe(0);
    expect(r.intercept).toBeCloseTo(5); // meanY = (1+9)/2
    expect(r.r2).toBe(0);
  });

  it("非完美拟合 r2 落在 [0,1]", () => {
    const r = linearRegression([
      [0, 0],
      [1, 1],
      [2, 0.5],
    ]);
    expect(r.r2).toBeGreaterThanOrEqual(0);
    expect(r.r2).toBeLessThanOrEqual(1);
  });
});

describe("lineFromTwoPoints", () => {
  it("正常计算斜率与截距", () => {
    const { slope, intercept } = lineFromTwoPoints(0, 0, 2, 4);
    expect(slope).toBeCloseTo(2);
    expect(intercept).toBeCloseTo(0);
  });

  it("x1==x2 退化为 slope:0（边界）", () => {
    const { slope, intercept } = lineFromTwoPoints(3, 1, 3, 7);
    expect(slope).toBe(0);
    expect(intercept).toBeCloseTo(1);
  });
});

describe("lineValueAt", () => {
  it("按 x 代入计算 y", () => {
    expect(lineValueAt(3, 2, 1)).toBeCloseTo(7);
  });
});
