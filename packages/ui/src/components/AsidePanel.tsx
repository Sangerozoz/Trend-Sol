import { useState } from "react";
import type { Quote } from "@trend-iq/data";
import type { Market } from "@trend-iq/shared";
import { CURRENCY_SYMBOLS } from "@trend-iq/shared";
import type { LineVisibility } from "@trend-iq/store";

// 本地定义类型，避免 ui 包依赖 analysis/chart 包
interface SRInfo {
  price: number;
  type: "support" | "resistance";
  touches: number;
  strength: number;
  rank: number;
}

interface PatternInfo {
  name: string;
  direction: "bullish" | "bearish" | "neutral";
  confidence: number;
  neckline?: number;
  targetPrice?: number;
  description: string;
}

interface PullbackInfo {
  maPeriod: number;
  price: number;
  name: string;
  deviation: number;
}

interface CostConfigInfo {
  costPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3?: number;
  pullback?: number;
}

// 高饱和度配色（与 chart/colors.ts 保持一致）
const COLORS = {
  support: { 1: "#00d4ff", 2: "#0099cc", 3: "#006699" },
  resistance: { 1: "#ff00ff", 2: "#cc00cc", 3: "#9900cc" },
  cost: "#ffd700",
  takeProfit: { 1: "#ff9500", 2: "#ff6b00", 3: "#cc5500" },
  stopLoss: "#f43f5e",
  pullback: "#14b8a6",
  neckline: "#a855f7",
  targetPrice: "#10b981",
  entry: "#3b82f6",
  patternStop: "#f43f5e",
  contour: "#fbbf24",
} as const;

interface AsidePanelProps {
  market: Market;
  quote: Quote | null;
  supportResistance: SRInfo[];
  costConfig: CostConfigInfo | null;
  pattern: PatternInfo | null;
  patterns: readonly PatternInfo[];
  pullbacks: PullbackInfo[];
  visibility: LineVisibility;
  costPriceInput: string;
  onCostPriceInput: (val: string) => void;
  onCostPriceSubmit: () => void;
  onCostPriceClear: () => void;
  onToggleVisibility: (key: keyof LineVisibility) => void;
  onSetVisibility: (state: Partial<LineVisibility>) => void;
  onSelectPattern: (p: PatternInfo | null) => void;
  onClearPattern: () => void;
}

function fmtPrice(price: number, market: Market): string {
  const symbol = CURRENCY_SYMBOLS[market];
  return `${symbol}${price.toFixed(2)}`;
}

function pct(current: number, base: number): string {
  const p = ((current - base) / base) * 100;
  return `${p >= 0 ? "+" : ""}${p.toFixed(2)}%`;
}

/**
 * 右侧信息面板
 * 分4组：参考位、交易计划、形态分析、显示设置
 */
export function AsidePanel({
  market,
  quote,
  supportResistance,
  costConfig,
  pattern,
  patterns,
  pullbacks,
  visibility,
  costPriceInput,
  onCostPriceInput,
  onCostPriceSubmit,
  onCostPriceClear,
  onToggleVisibility,
  onSetVisibility,
  onSelectPattern,
  onClearPattern,
}: AsidePanelProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (key: string) =>
    setCollapsedGroups((s) => ({ ...s, [key]: !s[key] }));

  const currentPrice = quote?.price ?? 0;
  const supports = supportResistance
    .filter((sr) => sr.type === "support")
    .sort((a, b) => a.rank - b.rank);
  const resistances = supportResistance
    .filter((sr) => sr.type === "resistance")
    .sort((a, b) => a.rank - b.rank);

  const hasCost = costConfig !== null && costConfig.costPrice > 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-bg-secondary">
      {/* 顶部行情 */}
      {currentPrice > 0 && (
        <div className="px-3 py-2 border-b border-border-default">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-text-primary font-mono">
              {fmtPrice(currentPrice, market)}
            </span>
            {quote && (
              <span className={`text-xs font-mono ${quote.changePercent >= 0 ? "text-up-red" : "text-down-green"}`}>
                {pct(currentPrice, quote.preClose)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 分组1：参考位 */}
      <Group title="参考位" collapsed={collapsedGroups.ref} onToggle={() => toggleGroup("ref")}>
        <div className="flex items-center gap-2 mb-2">
          <CountSelector
            label="支撑"
            value={visibility.supportCount}
            max={3}
            onChange={(v) => onSetVisibility({ supportCount: v })}
          />
          <CountSelector
            label="压力"
            value={visibility.resistanceCount}
            max={3}
            onChange={(v) => onSetVisibility({ resistanceCount: v })}
          />
        </div>
        <div className="space-y-1">
          {/* 压力位从高到低显示 */}
          {resistances.slice(0, 3).map((r) => (
            <ToggleLineRow
              key={`r${r.rank}`}
              label={`压力${r.rank}`}
              price={fmtPrice(r.price, market)}
              color={COLORS.resistance[r.rank as 1 | 2 | 3]}
              pctStr={currentPrice > 0 ? pct(r.price, currentPrice) : ""}
              active={visibility.resistance && r.rank <= visibility.resistanceCount}
              onToggle={() => onToggleVisibility("resistance")}
            />
          ))}
          {/* 现价 */}
          {currentPrice > 0 && (
            <LineRow
              label="现价"
              price={fmtPrice(currentPrice, market)}
              color="#666666"
              pctStr=""
              bold
            />
          )}
          {/* 支撑位从高到低显示 */}
          {supports.slice(0, 3).map((s) => (
            <ToggleLineRow
              key={`s${s.rank}`}
              label={`支撑${s.rank}`}
              price={fmtPrice(s.price, market)}
              color={COLORS.support[s.rank as 1 | 2 | 3]}
              pctStr={currentPrice > 0 ? pct(s.price, currentPrice) : ""}
              active={visibility.support && s.rank <= visibility.supportCount}
              onToggle={() => onToggleVisibility("support")}
            />
          ))}
        </div>
      </Group>

      {/* 分组2：交易计划 */}
      <Group title="交易计划" collapsed={collapsedGroups.trade} onToggle={() => toggleGroup("trade")}>
        <div className="flex items-center gap-1.5 mb-2">
          <input
            type="number"
            value={costPriceInput}
            onChange={(e) => onCostPriceInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onCostPriceSubmit()}
            placeholder="成本价"
            className="w-20 px-2 py-0.5 text-xs bg-bg-tertiary text-text-primary rounded border border-border-default focus:border-accent focus:outline-none"
          />
          <button
            onClick={onCostPriceSubmit}
            className="px-2 py-0.5 text-xs bg-accent text-white rounded hover:bg-accent/80 transition-colors"
          >
            计算
          </button>
          {hasCost && (
            <button
              onClick={onCostPriceClear}
              className="px-1.5 py-0.5 text-xs text-text-muted hover:text-down-green transition-colors"
            >
              清除
            </button>
          )}
        </div>
        {hasCost && costConfig ? (
          <>
            <div className="space-y-1">
              {costConfig.takeProfit3 && visibility.takeProfit3 && (
                <LineRow
                  label="止盈3"
                  price={fmtPrice(costConfig.takeProfit3, market)}
                  color={COLORS.takeProfit[3]}
                  pctStr={pct(costConfig.takeProfit3, costConfig.costPrice)}
                />
              )}
              {visibility.takeProfit3 !== false && costConfig.takeProfit2 > 0 && (
                <LineRow
                  label="止盈2"
                  price={fmtPrice(costConfig.takeProfit2, market)}
                  color={COLORS.takeProfit[2]}
                  pctStr={pct(costConfig.takeProfit2, costConfig.costPrice)}
                />
              )}
              {costConfig.takeProfit1 > 0 && (
                <LineRow
                  label="止盈1"
                  price={fmtPrice(costConfig.takeProfit1, market)}
                  color={COLORS.takeProfit[1]}
                  pctStr={pct(costConfig.takeProfit1, costConfig.costPrice)}
                />
              )}
              <LineRow
                label="成本价"
                price={fmtPrice(costConfig.costPrice, market)}
                color={COLORS.cost}
                pctStr=""
                bold
              />
              <LineRow
                label="止损"
                price={fmtPrice(costConfig.stopLoss, market)}
                color={COLORS.stopLoss}
                pctStr={pct(costConfig.stopLoss, costConfig.costPrice)}
              />
            </div>
            {/* 回踩线 */}
            <div className="mt-2 pt-2 border-t border-border-default/50">
              <ToggleLineRow
                label="回踩线"
                price={pullbacks.length > 0 ? fmtPrice(pullbacks[0].price, market) : "—"}
                color={COLORS.pullback}
                pctStr={pullbacks.length > 0 ? pullbacks[0].name : ""}
                active={visibility.pullback}
                onToggle={() => onToggleVisibility("pullback")}
              />
            </div>
            {/* 盈亏 */}
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
          </>
        ) : (
          <div className="text-xs text-text-muted py-1">输入成本价后显示止盈止损</div>
        )}
      </Group>

      {/* 分组3：形态分析（含形态选择列表） */}
      <Group title="形态分析" collapsed={collapsedGroups.pattern} onToggle={() => toggleGroup("pattern")}>
        {patterns.length > 0 ? (
          <>
            {/* 形态选择列表 */}
            <div className="flex flex-wrap gap-1 mb-2">
              {patterns.map((p, i) => (
                <button
                  key={i}
                  onClick={() => onSelectPattern(pattern === p ? null : p)}
                  className={`flex-shrink-0 px-1.5 py-0.5 text-xs rounded transition-colors flex items-center gap-1 ${
                    pattern === p
                      ? "bg-accent text-white"
                      : p.direction === "bullish"
                        ? "text-up-red hover:bg-bg-tertiary border border-up-red/30"
                        : p.direction === "bearish"
                          ? "text-down-green hover:bg-bg-tertiary border border-down-green/30"
                          : "text-text-secondary hover:bg-bg-tertiary border border-border-default"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    p.direction === "bullish" ? "bg-up-red" : p.direction === "bearish" ? "bg-down-green" : "bg-text-muted"
                  }`} />
                  {p.name}
                  <span className="text-text-muted ml-0.5">{p.confidence}%</span>
                </button>
              ))}
            </div>
            {/* 当前选中形态的详情 */}
            {pattern && (
              <>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-text-primary font-medium">{pattern.name}</span>
                  <span className="text-xs text-text-muted">{pattern.confidence}%</span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    pattern.direction === "bullish"
                      ? "text-up-red bg-up-red/10"
                      : pattern.direction === "bearish"
                        ? "text-down-green bg-down-green/10"
                        : "text-text-muted bg-bg-tertiary"
                  }`}>
                    {pattern.direction === "bullish" ? "看涨" : pattern.direction === "bearish" ? "看跌" : "中性"}
                  </span>
                  <button
                    onClick={onClearPattern}
                    className="text-xs text-text-muted hover:text-down-green transition-colors"
                  >
                    ✕ 取消选择
                  </button>
                </div>
                <div className="space-y-1">
                  {pattern.neckline && (
                    <LineRow
                      label="颈线"
                      price={fmtPrice(pattern.neckline, market)}
                      color={COLORS.neckline}
                      pctStr={currentPrice > 0 ? pct(pattern.neckline, currentPrice) : ""}
                    />
                  )}
                  {pattern.targetPrice && (
                    <LineRow
                      label="目标价"
                      price={fmtPrice(pattern.targetPrice, market)}
                      color={COLORS.targetPrice}
                      pctStr={currentPrice > 0 ? pct(pattern.targetPrice, currentPrice) : ""}
                    />
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-border-default/50">
                  <ToggleLineRow
                    label="轮廓面"
                    price=""
                    color={COLORS.contour}
                    pctStr=""
                    active={visibility.patternZone}
                    onToggle={() => onToggleVisibility("patternZone")}
                  />
                </div>
                <div className="mt-1 text-xs text-text-muted leading-relaxed">
                  {pattern.description}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-xs text-text-muted py-1">暂无识别形态</div>
        )}
      </Group>

      {/* 分组4：显示设置 */}
      <Group title="显示设置" collapsed={collapsedGroups.settings} onToggle={() => toggleGroup("settings")}>
        <div className="grid grid-cols-2 gap-1.5">
          <ToggleChip label="趋势线" active={visibility.trendline} onToggle={() => onToggleVisibility("trendline")} color="#3b82f6" />
          <ToggleChip label="支撑" active={visibility.support} onToggle={() => onToggleVisibility("support")} color={COLORS.support[1]} />
          <ToggleChip label="压力" active={visibility.resistance} onToggle={() => onToggleVisibility("resistance")} color={COLORS.resistance[1]} />
          <ToggleChip label="止盈3" active={visibility.takeProfit3} onToggle={() => onToggleVisibility("takeProfit3")} color={COLORS.takeProfit[3]} />
          <ToggleChip label="回踩线" active={visibility.pullback} onToggle={() => onToggleVisibility("pullback")} color={COLORS.pullback} />
          <ToggleChip label="斐波那契" active={visibility.fibonacci} onToggle={() => onToggleVisibility("fibonacci")} color="#8b5cf6" />
          <ToggleChip label="形态面" active={visibility.patternZone} onToggle={() => onToggleVisibility("patternZone")} color={COLORS.contour} />
        </div>
      </Group>
    </div>
  );
}

/**
 * 可折叠分组
 */
function Group({ title, collapsed, onToggle, children }: { title: string; collapsed: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-border-default">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
      >
        <span className="font-medium">{title}</span>
        <svg className={`w-3 h-3 transition-transform ${collapsed ? "" : "rotate-90"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {!collapsed && <div className="px-3 pb-2">{children}</div>}
    </div>
  );
}

/**
 * 单行显示
 */
function LineRow({ label, price, color, pctStr, bold = false }: { label: string; price: string; color: string; pctStr: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 inline-block rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
        <span className={`text-text-secondary ${bold ? "font-bold text-text-primary" : ""}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {price && <span className={`text-text-primary font-mono ${bold ? "font-bold" : ""}`}>{price}</span>}
        {pctStr && (
          <span className={`font-mono text-xs ${pctStr.startsWith("+") ? "text-up-red" : "text-down-green"}`}>{pctStr}</span>
        )}
      </div>
    </div>
  );
}

/**
 * 可开关的单行
 */
function ToggleLineRow({ label, price, color, pctStr, active, onToggle }: { label: string; price: string; color: string; pctStr: string; active: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 inline-block rounded-sm flex-shrink-0" style={{ backgroundColor: active ? color : "#333333", opacity: active ? 1 : 0.4 }} />
        <span className={active ? "text-text-secondary" : "text-text-muted"}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {price && <span className={`font-mono ${active ? "text-text-primary" : "text-text-muted"}`}>{price}</span>}
        {pctStr && <span className="font-mono text-xs text-text-muted">{pctStr}</span>}
        <button onClick={onToggle} className={`w-7 h-3.5 rounded-full transition-colors ${active ? "bg-accent" : "bg-bg-tertiary"}`}>
          <span className={`block w-2.5 h-2.5 bg-white rounded-full transition-transform ${active ? "translate-x-3.5" : "translate-x-0.5"}`} />
        </button>
      </div>
    </div>
  );
}

/**
 * 数量选择器
 */
function CountSelector({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-1 py-0.5 text-xs bg-bg-tertiary text-text-primary rounded border border-border-default focus:border-accent focus:outline-none"
      >
        {Array.from({ length: max + 1 }, (_, i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * 开关芯片
 */
function ToggleChip({ label, active, onToggle, color }: { label: string; active: boolean; onToggle: () => void; color: string }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
        active ? "bg-bg-tertiary text-text-primary" : "text-text-muted hover:bg-bg-tertiary"
      }`}
    >
      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: active ? color : "#333333" }} />
      {label}
    </button>
  );
}

export default AsidePanel;
