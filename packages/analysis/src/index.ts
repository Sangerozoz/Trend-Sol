// 分析算法包
export { detectTrendLines, type TrendLine, type TrendLineType, type TrendLineOptions } from "./trendline";
export { detectSupportResistance, type SupportResistance, type SROptions } from "./support-resistance";
export { detectFibonacci, type FibonacciResult, type FibonacciLevel } from "./fibonacci";
export { detectPatterns, getPatternDefaultsForPeriod, type ChartPattern, type PatternType, type PatternDirection, type PatternOptions } from "./patterns";
export { detectPullback, type PullbackLevel } from "./pullback";
export { findPivots, filterByProminence, getAllPivots, type Pivot } from "./utils/extrema";
export { linearRegression, lineFromTwoPoints, lineValueAt, type RegressionResult } from "./utils/linear-regression";
