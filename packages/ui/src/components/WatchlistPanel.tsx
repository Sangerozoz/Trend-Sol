import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDataSource, type SymbolInfo, type Quote } from "@trend-iq/data";
import { MARKET_LABELS, CURRENCY_SYMBOLS } from "@trend-iq/shared";
import { useChartStore } from "@trend-iq/store";

interface WatchlistPanelProps {
  onSelect: (symbol: SymbolInfo) => void;
}

/**
 * 自选股列表面板
 * 类似同花顺自选股：侧边栏展示已收藏股票 + 实时行情
 */
export function WatchlistPanel({ onSelect }: WatchlistPanelProps) {
  const { watchlist, currentSymbol, removeFromWatchlist } = useChartStore();

  if (watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <svg
          className="w-10 h-10 mb-3 text-text-muted opacity-40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
        <p className="text-xs text-text-muted">暂无自选股</p>
        <p className="text-xs text-text-muted mt-1">
          搜索股票后点击 ☆ 收藏
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 text-xs text-text-muted border-b border-border-default">
        自选股 ({watchlist.length})
      </div>
      <div className="flex-1 overflow-y-auto">
        {watchlist.map((symbol) => (
          <WatchlistItem
            key={`${symbol.market}-${symbol.code}`}
            symbol={symbol}
            isActive={
              currentSymbol?.code === symbol.code &&
              currentSymbol?.market === symbol.market
            }
            onSelect={() => onSelect(symbol)}
            onRemove={() => removeFromWatchlist(symbol.code, symbol.market)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 单个自选股项
 */
function WatchlistItem({
  symbol,
  isActive,
  onSelect,
  onRemove,
}: {
  symbol: SymbolInfo;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  // 获取该股票的实时行情
  const { data: quote } = useQuery({
    queryKey: ["quote", symbol.code, symbol.market],
    queryFn: async () => {
      const ds = getDataSource();
      return ds.getQuote(symbol.code, symbol.market);
    },
    refetchInterval: 5000,
    staleTime: 0,
  });

  const isUp = quote ? quote.changeAmount >= 0 : true;
  const colorClass = isUp ? "text-up-red" : "text-down-green";
  const currencySymbol = CURRENCY_SYMBOLS[symbol.market];

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex items-center justify-between px-3 py-2 cursor-pointer border-b border-border-default/30 transition-colors group ${
        isActive
          ? "bg-accent/20 border-l-2 border-l-accent"
          : "hover:bg-bg-tertiary border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-primary truncate">
            {symbol.name}
          </span>
          {hovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-text-muted hover:text-down-green transition-colors"
              title="移除自选"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-text-muted">{symbol.code}</span>
          <span className="text-xs text-text-muted">
            {MARLET_LABELS_SHORT[symbol.market]}
          </span>
        </div>
      </div>

      {quote ? (
        <div className="text-right ml-2">
          <div className={`text-sm font-mono ${colorClass}`}>
            {currencySymbol}{quote.price.toFixed(2)}
          </div>
          <div className={`text-xs font-mono ${colorClass}`}>
            {isUp ? "+" : ""}
            {quote.changePercent.toFixed(2)}%
          </div>
        </div>
      ) : (
        <div className="text-xs text-text-muted ml-2">--</div>
      )}
    </div>
  );
}

const MARLET_LABELS_SHORT: Record<string, string> = {
  "A-SH": "沪",
  "A-SZ": "深",
  HK: "港",
  "US-NASDAQ": "美",
  "US-NYSE": "美",
};

export default WatchlistPanel;
