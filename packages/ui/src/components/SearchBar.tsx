import { useState, useRef, useEffect } from "react";
import type { SymbolInfo } from "@trend-iq/data";
import { MARKET_LABELS } from "@trend-iq/shared";

interface SearchBarProps {
  onSearch: (keyword: string) => Promise<SymbolInfo[]>;
  onSelect: (symbol: SymbolInfo) => void;
}

/**
 * 股票搜索框
 */
export function SearchBar({ onSearch, onSelect }: SearchBarProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SymbolInfo[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 防抖搜索
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!keyword.trim()) {
      setResults([]);
      setShowResults(false);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await onSearch(keyword.trim());
        setResults(res);
        setShowResults(true);
      } catch (err) {
        console.error("搜索失败:", err);
        setError("搜索失败，请重试");
        setResults([]);
        setShowResults(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword, onSearch]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (symbol: SymbolInfo) => {
    onSelect(symbol);
    setKeyword(`${symbol.name} (${symbol.code})`);
    setShowResults(false);
  };

  return (
    <div ref={containerRef} className="relative w-60">
      <div className="relative">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="搜索股票"
          className="w-full h-8 px-3 pl-9 text-xs bg-white/5 text-text-primary placeholder:text-text-muted placeholder:font-['Inter'] rounded-xl border border-white/15 focus:border-white/30 focus:outline-none transition-colors"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
          />
        </svg>
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border border-text-muted border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showResults && error && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-default rounded shadow-xl z-50 px-3 py-2 text-sm text-down-green">
          {error}
        </div>
      )}

      {showResults && !error && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-default rounded shadow-xl z-50 px-3 py-2 text-sm text-text-muted">
          无匹配结果
        </div>
      )}

      {showResults && !error && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-default rounded shadow-xl z-50 max-h-80 overflow-y-auto">
          {results.map((item) => (
            <button
              key={`${item.market}-${item.code}`}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-bg-tertiary transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-primary">{item.name}</span>
                <span className="text-xs text-text-muted">{item.code}</span>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary">
                {MARKET_LABELS[item.market]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
