import { useNavigate } from "react-router-dom";
import { useChartStore } from "@trend-iq/store";
import { WatchlistPanel } from "@trend-iq/ui";

/**
 * 自选股页 `/watchlist`
 * 分组树 + 股票列表，点击进个股分析
 */
export function WatchlistPage() {
  const navigate = useNavigate();
  const { watchlist, watchlistVisible } = useChartStore();

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左侧分组树占位（后续实现分组功能） */}
      <aside className="w-56 flex-shrink-0 bg-bg-secondary border-r border-border-default p-3 overflow-y-auto">
        <h2 className="text-xs font-medium text-text-muted mb-2">分组</h2>
        <div className="space-y-1">
          <div className="px-2 py-1 text-xs text-text-primary bg-accent/10 rounded">
            全部 ({watchlist.length})
          </div>
          <div className="px-2 py-1 text-xs text-text-muted hover:text-text-secondary cursor-pointer rounded">
            我的自选 ({watchlist.length})
          </div>
          <button className="px-2 py-1 text-xs text-accent hover:underline">+ 新建分组</button>
        </div>
      </aside>

      {/* 右侧股票列表 */}
      <div className="flex-1 overflow-hidden">
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-sm">暂无自选股</p>
            <p className="text-xs mt-1">在顶部搜索框搜索股票后添加</p>
          </div>
        ) : (
          <WatchlistPanel
            onSelect={(symbol) => navigate(`/symbol/${symbol.market}/${symbol.code}`)}
          />
        )}
      </div>
    </div>
  );
}
