import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import "./index.css";
// Arco Design：基础样式 + 纯黑暗色覆写（顺序：arco-theme.css 必须最后，覆盖默认暗色变量）
import "@arco-design/web-react/dist/css/arco.css";
import "./arco-theme.css";

/**
 * 兜底：模块加载期/脚本级崩溃（ErrorBoundary 捕获不到的情况）也把错误显示到页面，
 * 避免「空白页」无从排查。
 */
function showFatal(msg: string, stack?: string) {
  let el = document.getElementById("fatal-error");
  if (!el) {
    el = document.createElement("div");
    el.id = "fatal-error";
    el.style.cssText =
      "position:fixed;inset:0;z-index:99999;padding:24px;color:#f87171;background:#000;font-family:monospace;white-space:pre-wrap;overflow:auto;";
    document.body.appendChild(el);
  }
  el.textContent =
    "致命错误（请发给我）：\n\n" + msg + "\n\n" + (stack ?? "");
}
window.addEventListener("error", (e) => {
  const anyErr = e as any;
  showFatal(
    `${e.message}\n${e.filename ?? ""}:${e.lineno}:${e.colno}`,
    anyErr.error?.stack
  );
});
window.addEventListener("unhandledrejection", (e) => {
  const reason = (e as any).reason;
  showFatal(
    "Unhandled Promise Rejection: " + (reason?.message ?? String(reason)),
    reason?.stack
  );
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 日线数据缓存 5 分钟，分钟线 5 秒，实时 0
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
