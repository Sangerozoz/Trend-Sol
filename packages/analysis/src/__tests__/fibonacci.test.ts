import { describe, it, expect } from "vitest";
import type { KLine } from "@trend-iq/data";
import { detectFibonacci } from "../fibonacci";

/** 构造单调趋势 K 线：p 从 start 线性变到 end（每根 high=p+1, low=p-1） */
function trend(n: number, start: number, end: number): KLine[] {
  const out: KLine[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const p = start + (end - start) * t;
    out.push({
      time: i,
      open: p,
      high: p + 1,
      low: p - 1,
      close: p,
      volume: 0,
      amount: 0,
    });
  }
  return out as KLine[];
}

describe("detectFibonacci", () => {
  it("K 线不足 30 根返回 null（边界）", () => {
    expect(detectFibonacci(trend(10, 10, 50))).toBeNull();
  });

  it("上升波段：direction=up，且 swingLowIndex < swingHighIndex", () => {
    const r = detectFibonacci(trend(40, 10, 50));
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.direction).toBe("up");
    expect(r.swingLowIndex).toBeLessThan(r.swingHighIndex);
  });

  it("回撤位数量与标签正确（7 回撤 + 2 扩展 = 9）", () => {
    const r = detectFibonacci(trend(40, 10, 50));
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.levels).toHaveLength(9);
    expect(r.levels[0].ratio).toBe(0);
    expect(r.levels[0].label).toBe("0%");
    const ext = r.levels[r.levels.length - 1];
    expect(ext.ratio).toBe(2.618);
    expect(ext.label).toBe("261.8%");
  });

  it("100% 回撤位价格≈波段低点（price = swingHigh - diff*1 = swingLow）", () => {
    const r = detectFibonacci(trend(40, 10, 50));
    expect(r).not.toBeNull();
    if (!r) return;
    const full = r.levels.find((l) => l.label === "100%");
    expect(full).toBeDefined();
    expect(full!.price).toBeCloseTo(r.swingLow, 5);
  });

  it("下降波段：direction=down", () => {
    const r = detectFibonacci(trend(40, 50, 10));
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.direction).toBe("down");
  });
});
