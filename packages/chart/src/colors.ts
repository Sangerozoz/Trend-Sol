/**
 * Trend IQ 高饱和度配色方案
 *
 * 设计原则：
 * - K线保留中国红绿惯例（#ef4444 / #22c55e）
 * - 所有功能线用高饱和度颜色，在K线红绿背景下清晰可辨
 * - 每条线颜色独特，色相拉开差距，不重复
 * - 同类线用同色系深浅区分 rank
 * - 线型作为辅助区分：实线(确认位) / 虚线(目标位)
 *
 * 色相分配（避开纯红纯绿区间）：
 * - 支撑 = 青色系 (180°-200°)
 * - 压力 = 品红/紫色系 (280°-320°)
 * - 成本 = 金黄 (45°-50°)
 * - 止盈 = 橙色系 (20°-35°)
 * - 止损 = 玫瑰红 (345°-350°，与K线纯红15°有色相差)
 * - 回踩 = 青绿 (170°，与支撑青色相关但偏绿)
 * - 形态 = 琥珀/紫/翠绿（按方向）
 */

export const COLORS = {
  /** K线涨跌色（保留中国惯例） */
  kline: {
    up: "#ef4444",   // 红 0°
    down: "#22c55e", // 绿 120°
    noChange: "#666666",
  },

  /** 参考层 - 支撑（青色系，实线，高饱和） */
  support: {
    1: "#00d4ff", // 亮青 190°
    2: "#0099cc", // 中青 195°
    3: "#006699", // 深青 200°
  },

  /** 参考层 - 压力（品红/紫色系，虚线，高饱和） */
  resistance: {
    1: "#ff00ff", // 亮品红 300°
    2: "#cc00cc", // 中品红 300°
    3: "#9900cc", // 深紫 280°
  },

  /** 交易层（金棕/橙系，高饱和） */
  trade: {
    cost: "#ffd700",       // 金黄 51°，最粗，核心位
    takeProfit1: "#ff9500", // 亮橙 30°
    takeProfit2: "#ff6b00", // 中橙 22°
    takeProfit3: "#cc5500", // 深橙 18°
    stopLoss: "#f43f5e",    // 玫瑰红 348°，与K线红(0°)有色相差，高饱和
    pullback: "#14b8a6",    // 青绿 172°，与支撑青色相关但偏绿
  },

  /** 分析层（高饱和，按方向分色） */
  analysis: {
    contour: "#fbbf24",     // 琥珀 45°，形态轮廓主色
    zone: {
      bullish: "rgba(251,191,36,0.12)",  // 琥珀半透明
      bearish: "rgba(244,63,94,0.12)",   // 玫瑰半透明
      neutral: "rgba(148,163,184,0.12)", // 灰半透明
    },
    neckline: "#a855f7",    // 紫 270°
    targetPrice: "#10b981", // 翠绿 160°，与K线绿(120°)有色相差
    entry: "#3b82f6",       // 蓝 220°
    patternStop: "#f43f5e", // 玫瑰红（与交易层止损同色，但分属不同分组）
  },

  /** 趋势线 */
  trendline: {
    ascending: "#3b82f6",  // 蓝
    descending: "#f59e0b", // 琥珀
    broken: "#444444",     // 灰（已突破）
  },

  /** 斐波那契 */
  fibonacci: "#8b5cf6",
} as const;

/**
 * 标签优先级（数字越小优先级越高）
 * 用于标签避让算法：价格接近时只保留优先级最高的标签
 */
export const LABEL_PRIORITY: Record<string, number> = {
  cost: 1,        // 成本
  stopLoss: 2,    // 止损
  takeProfit1: 3, // 止盈1
  support1: 4,    // 支撑1
  resistance1: 4, // 压力1
  neckline: 5,    // 颈线
  targetPrice: 6, // 目标价
  support2: 7,    // 支撑2
  resistance2: 7, // 压力2
  entry: 8,       // 入场
  patternStop: 9, // 形态止损
  pullback: 10,   // 回踩
  support3: 11,   // 支撑3
  resistance3: 11,// 压力3
  takeProfit2: 12,// 止盈2
  takeProfit3: 13,// 止盈3
};

/**
 * 标签避让的最小像素间距
 */
export const LABEL_MIN_GAP = 16;

/**
 * 根据背景色判断文字颜色（黑/白），确保对比度
 */
export function getContrastTextColor(hexColor: string): string {
  if (hexColor.startsWith("rgba") || hexColor.startsWith("rgb")) {
    const match = hexColor.match(/\d+/g);
    if (!match || match.length < 3) return "#ffffff";
    const [r, g, b] = match.map(Number);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? "#000000" : "#ffffff";
  }

  const hex = hexColor.replace("#", "");
  if (hex.length < 6) return "#ffffff";
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "#ffffff";
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#000000" : "#ffffff";
}

/**
 * 获取支撑位颜色
 */
export function getSupportColor(rank: number): string {
  const key = Math.min(Math.max(rank, 1), 3) as 1 | 2 | 3;
  return COLORS.support[key];
}

/**
 * 获取压力位颜色
 */
export function getResistanceColor(rank: number): string {
  const key = Math.min(Math.max(rank, 1), 3) as 1 | 2 | 3;
  return COLORS.resistance[key];
}

/**
 * 获取形态方向对应的半透明面色
 */
export function getPatternZoneColor(direction: "bullish" | "bearish" | "neutral"): string {
  return COLORS.analysis.zone[direction];
}

// 兼容旧引用（MORANDI → COLORS）
export const MORANDI = COLORS;
