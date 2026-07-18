import type { Quote } from "@trend-iq/data";
import { CURRENCY_SYMBOLS } from "@trend-iq/shared";
import type { Market } from "@trend-iq/shared";

// 本地定义类型，避免 ui 包依赖 analysis/chart 包
interface SupportResistanceInfo {
  price: number;
  type: "support" | "resistance";
  touches: number;
  strength: number;
  rank: number;
}

interface TrendLineInfo {
  startIndex: number;
  startPrice: number;
  endIndex: number;
  endPrice: number;
  extendTo: number;
  type: "ascending" | "descending";
  touches: number;
  score: number;
  slope: number;
  intercept: number;
  broken: boolean;
}

interface CostLineConfigInfo {
  costPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
}

interface InfoPanelProps {
  market: Market;
  supportResistance: SupportResistanceInfo[];
  trendLines: TrendLineInfo[];
  costConfig: CostLineConfigInfo | null;
  quote: Quote | null;
}

/**
 * 格式化价格
 */
function fmtPrice(price: number, market: Market): string {
  const symbol = CURRENCY_SYMBOLS[market];
  return `${symbol}${price.toFixed(2)}`;
}

/**
 * 计算盈亏百分比
 */
function pct(current: number, base: number): string {
  const p = ((current - base) / base) * 100;
  return `${p >= 0 ? "+" : ""}${p.toFixed(2)}%`;
}

/**
 * 信息面板
 * 右侧显示 AI 画线的详细信息：支撑/阻力位名称+价格、成本价/止损/止盈
 */
export function InfoPanel({
  market,
  supportResistance,
  trendLines,
  costConfig,
  quote,
}: InfoPanelProps) {
  const supports = supportResistance
    .filter((sr) => sr.type === "support")
    .sort((a, b) => a.rank - b.rank);
  const resistances = supportResistance
    .filter((sr) => sr.type === "resistance")
    .sort((a, b) => a.rank - b.rank);

  // 支撑阻力配色
  const srColors: Record<string, string> = {
    "support-1": "#22c55e", // 绿
    "support-2": "#8b5cf6", // 紫
    "resistance-1": "#f59e0b", // 橙
    "resistance-2": "#ef4444", // 红
  };

  const currentPrice = quote?.price ?? 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* 支撑阻力位 */}
      <div className="px-3 py-2 border-b border-border-default">
        <div className="text-xs text-text-muted mb-2">支撑 / 阻力</div>
        <div className="space-y-1.5">
          {/* 阻力2（红色） */}
          {resistances.find((r) => r.rank === 2) && (
            <LineRow
              label="压力位2"
              price={fmtPrice(resistances.find((r) => r.rank === 2)!.price, market)}
              color={srColors["resistance-2"]}
              pctStr={currentPrice > 0 ? pct(resistances.find((r) => r.rank === 2)!.price, currentPrice) : ""}
            />
          )}
          {/* 阻力1（橙色） */}
          {resistances.find((r) => r.rank === 1) && (
            <LineRow
              label="压力位1"
              price={fmtPrice(resistances.find((r) => r.rank === 1)!.price, market)}
              color={srColors["resistance-1"]}
              pctStr={currentPrice > 0 ? pct(resistances.find((r) => r.rank === 1)!.price, currentPrice) : ""}
            />
          )}
          {/* 当前价 */}
          {currentPrice > 0 && (
            <LineRow
              label="当前价"
              price={fmtPrice(currentPrice, market)}
              color="#f1f5f9"
              pctStr=""
              bold
            />
          )}
          {/* 支撑1（绿色） */}
          {supports.find((s) => s.rank === 1) && (
            <LineRow
              label="支撑位1"
              price={fmtPrice(supports.find((s) => s.rank === 1)!.price, market)}
              color={srColors["support-1"]}
              pctStr={currentPrice > 0 ? pct(supports.find((s) => s.rank === 1)!.price, currentPrice) : ""}
            />
          )}
          {/* 支撑2（紫色） */}
          {supports.find((s) => s.rank === 2) && (
            <LineRow
              label="支撑位2"
              price={fmtPrice(supports.find((s) => s.rank === 2)!.price, market)}
              color={srColors["support-2"]}
              pctStr={currentPrice > 0 ? pct(supports.find((s) => s.rank === 2)!.price, currentPrice) : ""}
            />
          )}
        </div>
      </div>

      {/* 趋势线统计 */}
      {trendLines.length > 0 && (
        <div className="px-3 py-2 border-b border-border-default">
          <div className="text-xs text-text-muted mb-2">趋势线</div>
          <div className="space-y-1">
            {trendLines.slice(0, 4).map((line, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-0.5 inline-block"
                    style={{
                      backgroundColor: line.broken
                        ? "#64748b"
                        : line.type === "ascending"
                          ? "#3b82f6"
                          : "#f59e0b",
                    }}
                  />
                  <span className="text-text-secondary">
                    {line.type === "ascending" ? "上升" : "下降"}
                    {line.broken ? " (已突破)" : ""}
                  </span>
                </div>
                <span className="text-text-muted font-mono">
                  {fmtPrice(line.startPrice + line.slope * (line.extendTo - line.startIndex), market)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 成本价 / 止损 / 止盈 */}
      {costConfig && (
        <div className="px-3 py-2 border-b border-border-default">
          <div className="text-xs text-text-muted mb-2">交易计划</div>
          <div className="space-y-1.5">
            <LineRow
              label="止盈2"
              price={fmtPrice(costConfig.takeProfit2, market)}
              color="#06b6d4"
              pctStr={pct(costConfig.takeProfit2, costConfig.costPrice)}
            />
            <LineRow
              label="止盈1"
              price={fmtPrice(costConfig.takeProfit1, market)}
              color="#22c55e"
              pctStr={pct(costConfig.takeProfit1, costConfig.costPrice)}
            />
            <LineRow
              label="成本价"
              price={fmtPrice(costConfig.costPrice, market)}
              color="#eab308"
              pctStr=""
              bold
            />
            <LineRow
              label="止损"
              price={fmtPrice(costConfig.stopLoss, market)}
              color="#ef4444"
              pctStr={pct(costConfig.stopLoss, costConfig.costPrice)}
            />
          </div>
          {/* 盈亏概览 */}
          {currentPrice > 0 && (
            <div className="mt-2 pt-2 border-t border-border-default/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">当前盈亏</span>
                <span
                  className={`font-mono font-bold ${
                    currentPrice >= costConfig.costPrice ? "text-up-red" : "text-down-green"
                  }`}
                >
                  {pct(currentPrice, costConfig.costPrice)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 单行显示组件
 */
function LineRow({
  label,
  price,
  color,
  pctStr,
  bold = false,
}: {
  label: string;
  price: string;
  color: string;
  pctStr: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 inline-block rounded-sm flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className={`text-text-secondary ${bold ? "font-bold text-text-primary" : ""}`}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-text-primary font-mono ${bold ? "font-bold" : ""}`}>
          {price}
        </span>
        {pctStr && (
          <span
            className={`font-mono text-xs ${
              pctStr.startsWith("+") ? "text-up-red" : "text-down-green"
            }`}
          >
            {pctStr}
          </span>
        )}
      </div>
    </div>
  );
}

export default InfoPanel;
