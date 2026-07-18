import { useNavigate, useLocation } from "react-router-dom";
import { SearchBar } from "@trend-iq/ui";
import type { MarketIndex } from "@trend-iq/data";
import { useSearch, useMarketIndices } from "../hooks/useStockData";
import { IconStar, IconStarFill, IconUser } from "@arco-design/web-react/icon";
import { StockMarketLine, StockMarketFill } from "./StockMarketIcon";
import { UserFill } from "./NavIcons";
import { SixPointsLine, SixPointsFill, CrownLine, CrownFill } from "./TrendSolIcon";

const NAV_ITEMS = [
  { key: "/", icon: StockMarketLine, iconFill: StockMarketFill, label: "行情" },
  { key: "/chat", icon: SixPointsLine, iconFill: SixPointsFill, label: "AI诊股" },
  { key: "/watchlist", icon: IconStar, iconFill: IconStarFill, label: "自选股" },
  { key: "/subscription", icon: CrownLine, iconFill: CrownFill, label: "订阅" },
  { key: "/profile", icon: IconUser, iconFill: UserFill, label: "我的" },
];

// 顶栏展示的 A股 三大指数（稳定 id，对应 MARKET_INDEX_DEFS）+ 简称映射
const TOP_INDEX_CODES = ["sh000001", "sz399001", "sz399006"];
const TOP_INDEX_LABEL: Record<string, string> = {
  sh000001: "上证",
  sz399001: "深证",
  sz399006: "创业板",
};

// 安全数字格式化：数据异常（undefined / NaN）时回退 "--"，避免渲染期崩溃
function fmtNum(n: number | undefined | null): string {
  return typeof n === "number" && !Number.isNaN(n) ? n.toFixed(2) : "--";
}

// 骨架占位条：固定宽度，加载中闪烁（pulse），失败态静态（不闪），布局零位移
function Sk({ className = "", pulse }: { className?: string; pulse?: boolean }) {
  return (
    <span
      className={`inline-block rounded bg-white/10 align-middle ${
        pulse ? "animate-pulse" : ""
      } ${className}`}
    />
  );
}

/** 顶栏单个指数：价格变化时做轻微脉冲（股票跳动感），仅 transform/opacity，不影响布局 */
function TopIndex({
  code,
  label,
  idx,
  loading,
}: {
  code: string;
  label: string;
  idx?: MarketIndex;
  loading: boolean;
}) {
  const up = (idx?.changePercent ?? 0) >= 0;
  const colorClass = up ? "text-up-red" : "text-down-green";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-text-muted">{label}</span>
      <span
        className="font-mono text-text-secondary min-w-[4.25rem] text-right tabular-nums"
      >
        {idx ? (
          fmtNum(idx.price)
        ) : (
          <Sk className="h-3 w-full" pulse={loading} />
        )}
      </span>
      <span className={`font-mono min-w-[3rem] text-right tabular-nums ${colorClass}`}>
        {idx ? (
          `${up ? "+" : ""}${fmtNum(idx.changePercent)}%`
        ) : (
          <Sk className="h-3 w-full" pulse={loading} />
        )}
      </span>
    </div>
  );
}

/**
 * 左侧导航栏（56px Icon栏）
 */
export function SideNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // 当前激活的导航项（先精确匹配，再前缀匹配；避免 "/" 误匹配 "/chat" 等）
  const currentPath = (() => {
    if (location.pathname.startsWith("/symbol")) return "/watchlist";
    const exact = NAV_ITEMS.find(
      (item) => item.key !== "/" && location.pathname === item.key
    );
    if (exact) return exact.key;
    const prefix = NAV_ITEMS.find(
      (item) => item.key !== "/" && location.pathname.startsWith(item.key)
    );
    return prefix?.key ?? "/";
  })();

  return (
    <nav className="w-14 flex-shrink-0 bg-bg-secondary border-r border-border-default flex flex-col items-center py-6 gap-4">
      {NAV_ITEMS.map((item) => {
        const active = currentPath === item.key;
        // 选中态优先用 Fill（实心）变体；四项均已配 iconFill（行情/自选股用既有 Fill，订阅/我的用 NavIcons 自定义实心）
        const IconCmp = active && item.iconFill ? item.iconFill : item.icon;
        return (
          <button
            key={item.key}
            onClick={() => navigate(item.key)}
            className={`w-11 h-12 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors ${
              active
                ? "text-white"
                : "text-text-muted hover:bg-bg-tertiary hover:text-text-secondary"
            }`}
            title={item.label}
          >
            {/* 两态尺寸完全一致：图标固定 text-lg(18px) + strokeWidth 4；
                选中态仅切换 Fill 变体 + 父级 text-white 改色，不改变任何尺寸 */}
            {IconCmp && (
              <IconCmp className="text-lg" strokeWidth={4} />
            )}
            <span className="text-[10px] leading-3">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/**
 * 顶部全局栏（固定，所有页面都有）
 * 大盘指数 + 搜索框 + 设置入口
 */
export function TopGlobalBar() {
  const navigate = useNavigate();
  const search = useSearch();
  const { data: allIndices, isLoading } = useMarketIndices();

  // 按顶栏固定顺序取 A股 三大指数（数据未就绪时留空槽，保持布局稳定）
  const byCode = new Map<string, MarketIndex>((allIndices ?? []).map((i) => [i.code, i]));
  const topIndices = TOP_INDEX_CODES.map((code) => ({
    code,
    label: TOP_INDEX_LABEL[code],
    idx: byCode.get(code),
  }));

  return (
    <header className="flex items-center gap-4 px-4 h-12 bg-bg-secondary border-b border-border-default flex-shrink-0">
      {/* 大盘指数（真实数据：东财→新浪→腾讯→雅虎 fallback） */}
      <div className="flex items-center gap-4">
        {topIndices.map(({ code, label, idx }) => (
          <TopIndex key={code} code={code} label={label} idx={idx} loading={isLoading} />
        ))}
      </div>

      <div className="flex-1" />

      {/* 右侧：搜索框 + 订阅入口（设计稿 容器18270：gap 16px） */}
      <div className="flex items-center gap-4">
        <SearchBar
          onSearch={search}
          onSelect={(symbol) => navigate(`/symbol/${symbol.market}/${symbol.code}`)}
        />

        {/* 订阅入口：设计稿 按钮Button（黄字 #FFBB00，圆角胶囊，带 24x24 icon） */}
        <button
          onClick={() => navigate("/subscription")}
          className="flex items-center gap-2 h-8 px-3 py-0.5 rounded-full bg-white/10 transition-colors hover:bg-white/15"
          title="订阅"
        >
          <img
            src="/assets/e5861f2faa89f9f6d5708f1c31e4493c.png"
            alt=""
            className="w-6 h-6 shrink-0 object-cover"
          />
          <span
            className="text-sm font-bold leading-[17px] text-[#FFBB00]"
            style={{ fontFamily: "'Douyin Sans', 'PingFang SC', sans-serif" }}
          >
            订阅
          </span>
        </button>
      </div>
    </header>
  );
}

/**
 * 应用外壳：左侧导航 + 顶部全局栏 + 路由出口
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen bg-bg-primary overflow-hidden">
      <SideNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopGlobalBar />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
