import type { Period, Adjust } from "@trend-iq/shared";
import { PERIOD_LABELS, ADJUST_LABELS } from "@trend-iq/shared";
import type { LineVisibility } from "@trend-iq/store";

interface ToolbarProps {
  period: Period;
  adjust: Adjust;
  showVolume: boolean;
  visibility: LineVisibility;
  onPeriodChange: (period: Period) => void;
  onAdjustChange: (adjust: Adjust) => void;
  onVolumeToggle: () => void;
  onToggleVisibility: (key: keyof LineVisibility) => void;
}

const PERIOD_OPTIONS: Period[] = ["daily", "weekly", "monthly"];
const ADJUST_OPTIONS: Adjust[] = ["qfq", "hfq", "none"];

/**
 * 图表工具栏：周期切换、复权切换、成交量开关、快捷画线开关
 */
export function Toolbar({
  period,
  adjust,
  showVolume,
  visibility,
  onPeriodChange,
  onAdjustChange,
  onVolumeToggle,
  onToggleVisibility,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-bg-secondary border-b border-border-default flex-wrap">
      {/* 周期选择 */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-text-muted mr-1">周期</span>
        {PERIOD_OPTIONS.map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              period === p
                ? "bg-accent text-white"
                : "text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* 复权选择 */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-text-muted mr-1">复权</span>
        {ADJUST_OPTIONS.map((a) => (
          <button
            key={a}
            onClick={() => onAdjustChange(a)}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              adjust === a
                ? "bg-accent text-white"
                : "text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            {ADJUST_LABELS[a]}
          </button>
        ))}
      </div>

      {/* 成交量开关 */}
      <button
        onClick={onVolumeToggle}
        className={`px-2 py-0.5 text-xs rounded transition-colors ${
          showVolume
            ? "bg-accent text-white"
            : "text-text-secondary hover:bg-bg-tertiary"
        }`}
      >
        成交量
      </button>

      {/* 分隔线 */}
      <div className="h-5 w-px bg-border-default" />

      {/* 快捷画线开关 */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-text-muted mr-1 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          画线
        </span>
        <button
          onClick={() => onToggleVisibility("trendline")}
          className={`px-2 py-0.5 text-xs rounded transition-colors ${
            visibility.trendline
              ? "bg-accent/20 text-accent border border-accent/40"
              : "text-text-secondary hover:bg-bg-tertiary border border-transparent"
          }`}
        >
          趋势
        </button>
        <button
          onClick={() => onToggleVisibility("support")}
          className={`px-2 py-0.5 text-xs rounded transition-colors ${
            visibility.support || visibility.resistance
              ? "bg-accent/20 text-accent border border-accent/40"
              : "text-text-secondary hover:bg-bg-tertiary border border-transparent"
          }`}
        >
          支撑压力
        </button>
        <button
          onClick={() => onToggleVisibility("fibonacci")}
          className={`px-2 py-0.5 text-xs rounded transition-colors ${
            visibility.fibonacci
              ? "bg-accent/20 text-accent border border-accent/40"
              : "text-text-secondary hover:bg-bg-tertiary border border-transparent"
          }`}
        >
          斐波那契
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
