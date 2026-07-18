import { Quote } from "@trend-iq/data";
import type { SymbolInfo } from "@trend-iq/data";
import { MARKET_LABELS, CURRENCY_SYMBOLS } from "@trend-iq/shared";
import type { Market } from "@trend-iq/shared";
import { useChartStore } from "@trend-iq/store";

interface QuotePanelProps {
  quote: Quote | null;
  symbol: SymbolInfo | null;
}

/**
 * 格式化数字
 */
function formatNumber(num: number, decimals = 2): string {
  if (Math.abs(num) >= 1e8) return (num / 1e8).toFixed(decimals) + "亿";
  if (Math.abs(num) >= 1e4) return (num / 1e4).toFixed(decimals) + "万";
  return num.toFixed(decimals);
}

/**
 * 实时行情面板（含收藏按钮）
 */
export function QuotePanel({ quote, symbol }: QuotePanelProps) {
  const { watchlist, addToWatchlist, removeFromWatchlist, toggleWatchlistVisible, watchlistVisible } = useChartStore();

  const isWatched = symbol
    ? watchlist.some((s) => s.code === symbol.code && s.market === symbol.market)
    : false;

  const handleToggleWatch = () => {
    if (!symbol) return;
    if (isWatched) {
      removeFromWatchlist(symbol.code, symbol.market);
    } else {
      addToWatchlist(symbol);
    }
  };

  if (!quote || !symbol) {
    return (
      <div className="flex items-center px-4 py-2 bg-bg-secondary border-b border-border-default">
        <span className="text-text-muted text-sm">选择股票查看行情</span>
      </div>
    );
  }

  const isUp = quote.changeAmount >= 0;
  const colorClass = isUp ? "text-up-red" : "text-down-green";
  const market = symbol.market;
  const currencySymbol = CURRENCY_SYMBOLS[market];

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-bg-secondary border-b border-border-default">
      {/* 收藏按钮 */}
      <button
        onClick={handleToggleWatch}
        className={`flex-shrink-0 transition-colors ${
          isWatched ? "text-yellow-400" : "text-text-muted hover:text-yellow-400"
        }`}
        title={isWatched ? "移除自选" : "加入自选"}
      >
        <svg
          className="w-5 h-5"
          fill={isWatched ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      </button>

      {/* 股票名称和代码 */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-text-primary">{quote.name}</span>
        <span className="text-sm text-text-muted">{quote.code}</span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary">
          {MARKET_LABELS[market]}
        </span>
      </div>

      {/* 价格 */}
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${colorClass}`}>
          {currencySymbol}{quote.price.toFixed(2)}
        </span>
        <span className={`text-sm ${colorClass}`}>
          {isUp ? "+" : ""}{quote.changeAmount.toFixed(2)}
        </span>
        <span className={`text-sm ${colorClass}`}>
          {isUp ? "+" : ""}{quote.changePercent.toFixed(2)}%
        </span>
      </div>

      {/* 其他数据 */}
      <div className="flex items-center gap-4 text-xs flex-1">
        <div className="flex gap-1">
          <span className="text-text-muted">开</span>
          <span className="text-text-primary">{quote.open.toFixed(2)}</span>
        </div>
        <div className="flex gap-1">
          <span className="text-text-muted">高</span>
          <span className="text-up-red">{quote.high.toFixed(2)}</span>
        </div>
        <div className="flex gap-1">
          <span className="text-text-muted">低</span>
          <span className="text-down-green">{quote.low.toFixed(2)}</span>
        </div>
        <div className="flex gap-1">
          <span className="text-text-muted">量</span>
          <span className="text-text-primary">{formatNumber(quote.volume, 0)}</span>
        </div>
        <div className="flex gap-1">
          <span className="text-text-muted">额</span>
          <span className="text-text-primary">{currencySymbol}{formatNumber(quote.amount, 0)}</span>
        </div>
        <div className="flex gap-1">
          <span className="text-text-muted">换手</span>
          <span className="text-text-primary">{quote.turnoverRate.toFixed(2)}%</span>
        </div>
        <div className="flex gap-1">
          <span className="text-text-muted">PE</span>
          <span className="text-text-primary">{quote.peRatio.toFixed(1)}</span>
        </div>
        <div className="flex gap-1">
          <span className="text-text-muted">市值</span>
          <span className="text-text-primary">{currencySymbol}{formatNumber(quote.totalMarketCap, 0)}</span>
        </div>
      </div>

      {/* 自选股面板开关 */}
      <button
        onClick={toggleWatchlistVisible}
        className={`flex-shrink-0 px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
          watchlistVisible
            ? "bg-accent/20 text-accent"
            : "text-text-muted hover:bg-bg-tertiary"
        }`}
        title="自选股列表"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        自选({watchlist.length})
      </button>
    </div>
  );
}

export default QuotePanel;
