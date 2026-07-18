import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChartStore } from "@trend-iq/store";
import { useMarketIndices } from "../hooks/useStockData";
import type { MarketIndex, MarketIndexDef } from "@trend-iq/data";
import { MARKET_INDEX_DEFS } from "@trend-iq/data";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/gsap";
import { MarketStats } from "../components/market/MarketStats";
import { AiChatEntry } from "../components/market/AiChatEntry";

/**
 * 行情页 `/`
 * 严格对齐 MasterGo 设计稿（app-window 4:3898）：
 *   - 顶栏与大盘概览之间的 AI 对话入口（容器18268：Trend Sol 标题 + 768px 输入框）
 *   - 左栏核心区：大盘概览(指数 + 其他市场 + A股交易额) + 热门 + 消息热点
 *   - 右栏用户区：持仓 + 自选 + 盯盘
 * 间距/圆角/色值均按设计稿：page-content padding 32px + gap 24px、overview-card 24px/圆角24、卡片16px/圆角16。
 */

// 其他市场展示顺序严格按设计稿：第一行 道琼斯/纳斯达克/恒生，第二行 日经225/韩国KOSPI/标普500
const OTHER_ORDER = ["usDJIA", "usIXIC", "hkHSI", "jpN225", "krKS11", "usSPX"];

export function OverviewPage() {
  const navigate = useNavigate();
  const { watchlist } = useChartStore();
  const { data: indices = [], isLoading } = useMarketIndices();
  const rootRef = useRef<HTMLDivElement>(null);

  // 入场动画：左/右栏区块 + A股 卡片 + 其他市场槽，按顺序 stagger 淡入上浮（仅 transform/opacity，布局零位移）
  useGSAP(
    () => {
      if (prefersReducedMotion) return;
      gsap.from(".ov-anim", {
        y: 18,
        autoAlpha: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.06,
      });
    },
    { scope: rootRef }
  );

  // 结构由稳定定义驱动：渲染数量永远等于 MARKET_INDEX_DEFS，与数据加载无关 → 布局零位移
  const byCode = new Map<string, MarketIndex>((indices ?? []).map((i) => [i.code, i]));
  const aShareDefs = MARKET_INDEX_DEFS.filter((d) => d.group === "A股");
  const otherDefs = OTHER_ORDER.map((id) =>
    MARKET_INDEX_DEFS.find((d) => d.id === id)
  ).filter((d): d is MarketIndexDef => Boolean(d));
  const pulse = isLoading && indices.length === 0; // 仅首次加载中闪烁；失败态静态

  return (
    // page-content：padding 32px、gap 24px、顶部渐变背景（设计稿 linear-gradient 180deg #0B1627→#000）
    <div
      ref={rootRef}
      className="h-full overflow-y-auto px-8 py-8 bg-bg-primary"
      style={{
        background:
          "linear-gradient(180deg, #0B1627 0%, #000000 21%, #000000 100%)",
      }}
    >
      {/* AI 对话入口：设计稿 容器18268（Trend Sol 标题 + 768px AI 输入框），位于顶栏与大盘概览之间 */}
      <div className="ov-anim flex flex-col items-center gap-6 py-6">
        <h1
          className="text-[30px] leading-[38px] text-text-primary"
          style={{ fontFamily: "'DingTalk JinBuTi', 'PingFang SC', sans-serif" }}
        >
          Trend Sol
        </h1>
        <AiChatEntry />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* ============ 左栏：核心区 ============ */}
        <div className="xl:col-span-2 space-y-6">
          {/* 模块A：大盘概览（指数 + 其他市场 + A股交易额，合并为一整块） */}
          <section>
            <SectionHeader title="大盘概览" />
            <div className="bg-bg-secondary rounded-3xl border border-border-default p-6 space-y-6">
              {/* 大盘指数：结构由 MARKET_INDEX_DEFS 固定驱动，加载前后数量/位置不变 */}
              {/* A股一行排列（固定 5 张骨架，flex-1 均分，与设计稿 ashare-row 一致） */}
              <div className="flex gap-3">
                {aShareDefs.map((def) => (
                  <div key={def.id} className="flex-1 min-w-0 ov-anim">
                    <IndexCard def={def} idx={byCode.get(def.id)} loading={pulse} />
                  </div>
                ))}
              </div>

              {/* 其他市场：纯文字低调展示（固定 6 个槽，2 行 × 3 组，每行 space-between 边到边分布） */}
              <div className="space-y-2">
                {[0, 1].map((row) => (
                  <div
                    key={row}
                    className="flex justify-between items-center"
                  >
                    {otherDefs
                      .slice(row * 3, row * 3 + 3)
                      .map((def) => (
                        <OtherIndexCell
                          key={def.id}
                          def={def}
                          idx={byCode.get(def.id)}
                          loading={pulse}
                        />
                      ))}
                  </div>
                ))}
              </div>

              {/* A股交易额（数值 + 柱状图，真实数据） */}
              <MarketStats />
            </div>
          </section>

          {/* 热门（占位） */}
          <PlaceholderSection
            title="热门"
            subtitle="A股热门板块题材 · A股热门个股"
            items={["热门板块题材（行业/概念人气榜）", "热门个股（人气榜 / 涨幅榜）"]}
            className="ov-anim"
          />

          {/* 消息热点（占位，Phase 3 接财联社电报） */}
          <PlaceholderSection
            title="消息热点"
            subtitle="财联社电报（备用：东方财富快讯）"
            items={["盘中快讯 / 电报流", "按类型筛选（宏观 / 行业 / 公司）", "关键词标红"]}
            className="ov-anim"
          />
        </div>

        {/* ============ 右栏：用户区 ============ */}
        <div className="xl:col-span-1 space-y-6">
          {/* 持仓（占位，依赖 REQ-PROF-01/02） */}
          <SidePlaceholder
            title="持仓"
            desc="手动录入持仓后显示盈亏"
            onClick={() => navigate("/profile")}
            className="ov-anim"
          />

          {/* 自选（真实数据） */}
          <section className="ov-anim">
            <SectionHeader title="自选" />
            <div className="bg-bg-secondary rounded-3xl border border-border-default p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-text-muted">共 {watchlist.length} 只</div>
                <button
                  onClick={() => navigate("/watchlist")}
                  className="text-xs text-accent hover:underline"
                >
                  查看全部 →
                </button>
              </div>
              {watchlist.length === 0 ? (
                <div className="text-xs text-text-muted py-6 text-center">
                  暂无自选股，去搜索添加吧
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {watchlist.slice(0, 8).map((symbol) => (
                    <button
                      key={`${symbol.market}-${symbol.code}`}
                      onClick={() => navigate(`/symbol/${symbol.market}/${symbol.code}`)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-bg-tertiary hover:bg-bg-elevated transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-text-primary truncate">{symbol.name}</div>
                        <div className="text-[10px] text-text-muted">{symbol.code}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 盯盘（占位） */}
          <SidePlaceholder
            title="盯盘"
            desc="添加盯盘标的，异动提醒"
            onClick={() => navigate("/profile")}
            className="ov-anim"
          />
        </div>
      </div>
    </div>
  );
}

/** 骨架占位条：固定宽度，加载中闪烁（pulse），失败态静态（不闪），布局零位移 */
function Sk({ className = "", pulse }: { className?: string; pulse?: boolean }) {
  return (
    <span
      className={`inline-block rounded bg-white/10 align-middle ${
        pulse ? "animate-pulse" : ""
      } ${className}`}
    />
  );
}

/** 大盘指数大卡片（A股一行排列）：红涨绿跌；基于稳定 def 渲染，未加载时显示固定尺寸骨架 */
function IndexCard({
  def,
  idx,
  loading,
}: {
  def: MarketIndexDef;
  idx?: MarketIndex;
  loading: boolean;
}) {
  const name = def.name;
  const up = (idx?.changePercent ?? 0) > 0;
  const down = (idx?.changePercent ?? 0) < 0;
  const colorClass = up ? "text-up-red" : down ? "text-down-green" : "text-text-secondary";
  const sign = up ? "+" : "";
  const priceRef = useRef<HTMLDivElement>(null);
  return (
    <div className="bg-bg-tertiary rounded-2xl p-4 flex flex-col gap-2 hover:bg-bg-elevated transition-colors">
      {/* 名称来自稳定 def，始终显示，不占位跳动 */}
      <div className="text-sm text-text-primary truncate">{name}</div>
      {/* 价格行：固定高度容器，未加载时骨架占满，加载后原地替换 → 零行高跳动 */}
      <div
        ref={priceRef}
        className={`text-xl font-semibold tabular-nums h-7 flex items-center ${colorClass}`}
      >
        {idx ? (
          idx.price.toFixed(2)
        ) : (
          <Sk className="h-5 w-20" pulse={loading} />
        )}
      </div>
      {/* 涨跌幅行：同上 */}
      <div className={`text-xs tabular-nums h-4 flex items-center ${colorClass}`}>
        {idx ? (
          `${sign}${idx.changePercent.toFixed(2)}%`
        ) : (
          <Sk className="h-3 w-12" pulse={loading} />
        )}
      </div>
    </div>
  );
}

/** 其他市场文字槽（港股/美股/日韩）：固定结构（名称72 / 数值64 / 涨跌48），未加载时骨架占位 */
function OtherIndexCell({
  def,
  idx,
  loading,
}: {
  def: MarketIndexDef;
  idx?: MarketIndex;
  loading: boolean;
}) {
  const up = (idx?.changePercent ?? 0) > 0;
  const down = (idx?.changePercent ?? 0) < 0;
  const colorClass = up ? "text-up-red" : down ? "text-down-green" : "text-text-secondary";
  const sign = up ? "+" : "";
  return (
    /* 三列固定宽：名称(左对齐,72px) + 数值(右对齐,64px) + 涨跌(右对齐,48px)。
       gap 8px 与行内各市场成组；justify-between 使每行 3 组边到边分布，内容左右缘对齐上方 A股 卡片行 */
    <span className="flex items-center gap-2 text-xs ov-anim">
      <span className="text-text-secondary w-[72px] text-left shrink-0 truncate">
        {def.name}
      </span>
      <span className="text-text-primary tabular-nums w-[64px] text-right shrink-0">
        {idx ? (
          idx.price.toFixed(2)
        ) : (
          <Sk className="h-3 w-full" pulse={loading} />
        )}
      </span>
      <span className={`tabular-nums w-[48px] text-right shrink-0 ${colorClass}`}>
        {idx ? (
          `${sign}${idx.changePercent.toFixed(2)}%`
        ) : (
          <Sk className="h-3 w-full" pulse={loading} />
        )}
      </span>
    </span>
  );
}

/** 区块标题 */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {subtitle && <span className="text-xs text-text-muted">{subtitle}</span>}
    </div>
  );
}

/** 占位区块（整段 section，含标题，用于左栏热门/消息） */
function PlaceholderSection({
  title,
  subtitle,
  items,
  className = "",
}: {
  title: string;
  subtitle?: string;
  items: string[];
  className?: string;
}) {
  return (
    <section className={className}>
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="bg-bg-secondary rounded-3xl border border-border-default p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-muted border border-border-default">
            即将上线
          </span>
        </div>
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it}
              className="text-sm text-text-secondary flex items-center gap-2"
            >
              <span className="w-1 h-1 rounded-full bg-text-muted" />
              {it}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** 右栏占位块（持仓 / 盯盘） */
function SidePlaceholder({
  title,
  desc,
  onClick,
  className = "",
}: {
  title: string;
  desc: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <section className={className}>
      <SectionHeader title={title} />
      <button
        onClick={onClick}
        className="w-full text-left rounded-3xl bg-bg-secondary border border-border-default p-6 hover:bg-bg-tertiary transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-text-primary">{title}</div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-muted border border-border-default">
            即将上线
          </span>
        </div>
        <div className="text-xs text-text-muted">{desc}</div>
      </button>
    </section>
  );
}
