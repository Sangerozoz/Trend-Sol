import { useMarketStats } from "../../hooks/useStockData";

/**
 * 行情页「大盘概览」模块A 子区块：
 *  - A股交易额（实时数值 + 大盘资金净流入 + 昨日成交额 + 近 20 交易日量能柱状图）
 * 设计稿对齐：MasterGo turnover-card（#161616 卡片 / 32px 大数值 / 14px 涨跌 / 全蓝柱图）
 * 布局严格按设计稿容器层级：
 *   - 容器5(justify-between/flex-end) → 左 容器6(容器3 值+亿元, 容器18271 较昨日) + 右 容器18273(净流入/昨日)
 *   - 值/亿元/较昨日 三者底部对齐（容器6 align-items flex-end）
 * A股涨跌比模块已按设计稿移除（2026-07-17）。
 */

const UP = "#ef4444"; // 红涨（中国惯例）
const DOWN = "#22c55e"; // 绿跌
const ACCENT = "#3b82f6"; // 交易额柱（中性蓝，对齐设计稿 #3B82F6）

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-white/10 animate-pulse ${className}`} />;
}

/** 近 N 日量能柱状图（纯 div，高度按最大值归一；全蓝，对齐设计稿 #3B82F6 实色） */
function MiniBarChart({
  values,
  color = ACCENT,
  height = 72,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[2px] w-full" style={{ height }}>
      {values.map((v, i) => {
        const pct = Math.max((v / max) * 100, 18);
        return (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{ height: `${pct}%`, background: color }}
            title={`${v.toFixed(0)} 亿`}
          />
        );
      })}
    </div>
  );
}

function TurnoverCard({
  value,
  series,
  netInflow,
  yesterday,
  loading,
}: {
  value: number | null;
  series: number[];
  netInflow: number | null;
  yesterday: number | null;
  loading: boolean;
}) {
  // 昨日成交额为「当日历史定值」，由 useMarketTurnoverYesterday 按日冻结传入，不随实时刷新变动
  const prev = yesterday;
  const delta =
    value != null && prev != null && prev > 0
      ? ((value - prev) / prev) * 100
      : null;
  const deltaUp = (delta ?? 0) >= 0;
  const inflowUp = (netInflow ?? 0) >= 0;

  return (
    <div className="rounded-2xl bg-bg-tertiary p-4 space-y-3 ov-anim">
      {/* turnover-header：与设计稿一致（justify-between，标题 14px/600） */}
      <div className="flex justify-between items-center">
        <div className="text-sm font-semibold text-text-primary">A股交易额</div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="flex items-end gap-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-[72px] w-full" />
        </div>
      ) : value == null ? (
        <div className="text-[32px] font-semibold text-text-muted tabular-nums leading-8">
          —
        </div>
      ) : (
        <>
          {/* 容器 5：左=大数值+涨跌，右=大盘资金净流入/昨日成交额；两端对齐、底部齐平 */}
          <div className="flex justify-between items-end">
            {/* 左 容器 6（gap 16 / flex-end / justify-center）：值+亿元 + 较昨日 */}
            <div className="flex items-end gap-4">
              {/* 容器 3（gap 8 / flex-end）：大数值(32px) + 亿元(14px)，底部对齐 */}
              <div className="flex items-end gap-2">
                <span className="text-[32px] font-semibold text-text-primary tabular-nums leading-8">
                  {Math.round(value).toLocaleString("zh-CN")}
                </span>
                <span className="text-sm text-text-secondary leading-5">亿元</span>
              </div>
              {/* 容器 18271（gap 8 / center）：较昨日 X% */}
              <span
                className={`text-sm leading-4 ${
                  delta == null
                    ? "text-text-muted"
                    : deltaUp
                    ? "text-up-red"
                    : "text-down-green"
                }`}
              >
                {delta == null ? "较昨日 —" : `较昨日 ${deltaUp ? "+" : ""}${delta.toFixed(1)}%`}
              </span>
            </div>

            {/* 右 容器 18273（column / flex-start）：净流入 + 昨日成交额 */}
            <div className="flex flex-col items-start gap-1">
              {/* 大盘资金净流入 + 值 */}
              <div className="flex items-end gap-2 text-sm">
                <span className="text-text-secondary">大盘资金净流入</span>
                {netInflow == null ? (
                  <span className="text-text-muted tabular-nums">—</span>
                ) : (
                  <span className={`tabular-nums ${inflowUp ? "text-up-red" : "text-down-green"}`}>
                    {inflowUp ? "+" : ""}
                    {Math.round(netInflow).toLocaleString("zh-CN")}亿元
                  </span>
                )}
              </div>
              {/* 昨日成交额 + 值 + 亿元 */}
              <div className="flex items-end gap-2 text-sm text-text-secondary">
                <span>昨日成交额</span>
                {prev == null ? (
                  <span className="text-text-muted tabular-nums">—</span>
                ) : (
                  <>
                    <span className="text-text-secondary tabular-nums">
                      {Math.round(prev).toLocaleString("zh-CN")}
                    </span>
                    <span>亿元</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="h-[72px]">
            <MiniBarChart values={series} height={72} />
          </div>
        </>
      )}
    </div>
  );
}

export function MarketStats() {
  const {
    turnoverValue,
    turnoverSeries,
    turnoverYesterday,
    turnoverNetInflow,
  } = useMarketStats();
  return (
    // 与 MasterGo stat-cards 对齐：上方分隔线 + 24px 内边距，内部单一全宽交易额卡片
    <div className="pt-6 border-t border-border-default">
      <TurnoverCard
        value={turnoverValue.data ?? null}
        series={turnoverSeries.data ?? []}
        netInflow={turnoverNetInflow.data ?? null}
        yesterday={turnoverYesterday.data ?? null}
        loading={
          turnoverValue.isLoading ||
          turnoverSeries.isLoading ||
          turnoverYesterday.isLoading ||
          turnoverNetInflow.isLoading
        }
      />
    </div>
  );
}
