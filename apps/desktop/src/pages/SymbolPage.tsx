import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ChartContainer, calculateStopLossTakeProfit, type CostLineConfig } from "@trend-iq/chart";
import { useChartStore } from "@trend-iq/store";
import { detectTrendLines, detectSupportResistance, detectFibonacci, detectPatterns, detectPullback, type ChartPattern } from "@trend-iq/analysis";
import { useKLines, useQuote, useSearch, mergeQuoteToKLines } from "../hooks/useStockData";
import { initDesktopDataLayer, triggerFetch } from "../setup";
import type { SymbolInfo } from "@trend-iq/data";
import { AsidePanel } from "@trend-iq/ui";

/**
 * 个股分析页 `/symbol/:market/:code`
 * 保留现有全部画线能力 + 右侧价位面板 + AI简报入口
 */
export function SymbolPage() {
  const params = useParams<{ market: string; code: string }>();
  const navigate = useNavigate();

  const {
    period,
    adjust,
    lineVisibility,
    rightPanelVisible,
    setPeriod,
    setAdjust,
    toggleLineVisibility,
    setLineVisibility,
    toggleRightPanelVisible,
  } = useChartStore();

  const [showVolume, setShowVolume] = useState(true);
  const [costPriceInput, setCostPriceInput] = useState("");
  const [costPrice, setCostPrice] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState<ChartPattern | null>(null);

  // 从路由参数构建 SymbolInfo
  const symbol: SymbolInfo | null = useMemo(() => {
    if (!params.code || !params.market) return null;
    return { code: params.code, name: params.code, market: params.market as SymbolInfo["market"] };
  }, [params.code, params.market]);

  const { data: rawKlines = [], isLoading: klinesLoading } = useKLines(symbol, period, adjust);
  const { data: quote } = useQuote(symbol);

  const klines = useMemo(
    () => mergeQuoteToKLines(rawKlines, quote ?? null),
    [rawKlines, quote]
  );

  const analysis = useMemo(() => {
    if (rawKlines.length < 20) return { trendLines: [], sr: [], fibonacci: null, patterns: [], pullbacks: [] };
    return {
      trendLines: detectTrendLines(rawKlines),
      sr: detectSupportResistance(rawKlines),
      fibonacci: detectFibonacci(rawKlines),
      patterns: detectPatterns(rawKlines, period),
      pullbacks: detectPullback(rawKlines),
    };
  }, [rawKlines, period]);

  const costConfig: CostLineConfig | null = useMemo(() => {
    if (costPrice <= 0 || !quote) return null;
    return calculateStopLossTakeProfit(costPrice, quote.price, analysis.sr);
  }, [costPrice, quote, analysis.sr]);

  const handleCostPriceSubmit = () => {
    const price = parseFloat(costPriceInput);
    if (!isNaN(price) && price > 0) setCostPrice(price);
    else setCostPrice(0);
  };

  const handleCostPriceClear = () => {
    setCostPriceInput("");
    setCostPrice(0);
  };

  // 按需采集：切换到该股票时触发后台采集
  useEffect(() => {
    if (symbol) {
      triggerFetch(symbol.code, symbol.market, period, adjust).catch(() => {});
    }
  }, [symbol?.code, symbol?.market, period, adjust]);

  if (!symbol) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        <button onClick={() => navigate("/")} className="text-accent hover:underline">
          ← 返回总览
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* 图表区域 */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* 标的上下文条 */}
        <div className="flex items-center gap-3 px-4 py-1.5 bg-bg-secondary border-b border-border-default">
          <button
            onClick={() => navigate("/watchlist")}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            ← 返回
          </button>
          <span className="text-sm font-medium text-text-primary">{quote?.name ?? symbol.code}</span>
          <span className="text-xs text-text-muted">{symbol.code}</span>
          {quote && (
            <span className={`text-sm font-mono ${quote.changePercent >= 0 ? "text-up-red" : "text-down-green"}`}>
              {quote.price.toFixed(2)} {quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%
            </span>
          )}
          <div className="flex-1" />
          {/* 周期切换 */}
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                period === p ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {p === "daily" ? "日K" : p === "weekly" ? "周K" : "月K"}
            </button>
          ))}
          {/* 成交量 */}
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              showVolume ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            量
          </button>
        </div>

        {/* K线图 */}
        <div className="flex-1 overflow-hidden">
          <ChartContainer
            data={klines}
            loading={klinesLoading}
            showVolume={showVolume}
            visibility={lineVisibility}
            trendLines={analysis.trendLines}
            supportResistance={analysis.sr}
            fibonacci={analysis.fibonacci}
            costConfig={costConfig}
            selectedPattern={selectedPattern}
            pullbacks={analysis.pullbacks}
          />
        </div>
      </main>

      {/* 右侧价位面板（可折叠） */}
      {rightPanelVisible ? (
        <aside className="w-72 flex-shrink-0 bg-bg-secondary border-l border-border-default overflow-hidden">
          <AsidePanel
            market={symbol.market}
            quote={quote ?? null}
            supportResistance={analysis.sr}
            costConfig={costConfig}
            pattern={selectedPattern}
            patterns={analysis.patterns}
            pullbacks={analysis.pullbacks}
            visibility={lineVisibility}
            costPriceInput={costPriceInput}
            onCostPriceInput={setCostPriceInput}
            onCostPriceSubmit={handleCostPriceSubmit}
            onCostPriceClear={handleCostPriceClear}
            onToggleVisibility={toggleLineVisibility}
            onSetVisibility={setLineVisibility}
            onSelectPattern={(p) => setSelectedPattern(p as ChartPattern | null)}
            onClearPattern={() => setSelectedPattern(null)}
          />
        </aside>
      ) : (
        <button
          onClick={toggleRightPanelVisible}
          className="w-8 flex-shrink-0 bg-bg-secondary border-l border-border-default flex flex-col items-center justify-center gap-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <span className="text-xs" style={{ writingMode: "vertical-rl" }}>价位面板</span>
        </button>
      )}
    </div>
  );
}
