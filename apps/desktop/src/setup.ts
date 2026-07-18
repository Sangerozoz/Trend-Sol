import { setHttpFetch } from "@trend-iq/data";
import type { HttpFetchFn } from "@trend-iq/data";
import { useChartStore } from "@trend-iq/store";

/**
 * 检测是否在 Tauri 环境中运行
 */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * 初始化桌面端数据层
 * - Tauri 环境：使用 Tauri HTTP 插件绕过 CORS，推送 watchlist 给后端采集器
 * - 浏览器开发环境：使用默认 fetch + Vite 代理绕过 CORS
 */
export async function initDesktopDataLayer(): Promise<void> {
  if (!isTauri()) {
    console.log("[Trend IQ] 浏览器开发模式：使用 Vite 代理");
    return;
  }

  // Tauri 环境：动态导入 HTTP 插件
  const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");
  const { invoke } = await import("@tauri-apps/api/core");

  const tauriHttpFetch: HttpFetchFn = async (url, init) => {
    const response = await tauriFetch(url, init);
    const data = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  };

  setHttpFetch(tauriHttpFetch);
  console.log("[Trend IQ] 数据层已初始化 (Tauri HTTP)");

  // 推送 watchlist 给后端采集器
  try {
    const { watchlist } = useChartStore.getState();
    const symbols = watchlist.map((s) => ({
      code: s.code,
      market: s.market,
    }));
    await invoke("set_watchlist", { symbols });
    console.log(`[Trend IQ] 已推送 ${symbols.length} 只自选股给后端采集器`);
  } catch (err) {
    console.warn("[Trend IQ] 推送 watchlist 失败:", err);
  }
}

/**
 * 触发按需采集（切换股票时调用）
 */
export async function triggerFetch(
  code: string,
  market: string,
  period: string,
  adjust: string = "qfq"
): Promise<void> {
  if (!isTauri()) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("trigger_fetch", { code, market, period, adjust });
  } catch (err) {
    console.warn("[Trend IQ] 按需采集失败:", err);
  }
}
