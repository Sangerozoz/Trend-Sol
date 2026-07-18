import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@trend-iq/data": path.resolve(__dirname, "../../packages/data/src/index.ts"),
      "@trend-iq/chart": path.resolve(__dirname, "../../packages/chart/src/index.ts"),
      "@trend-iq/indicators": path.resolve(__dirname, "../../packages/indicators/src/index.ts"),
      "@trend-iq/analysis": path.resolve(__dirname, "../../packages/analysis/src/index.ts"),
      "@trend-iq/store": path.resolve(__dirname, "../../packages/store/src/index.ts"),
      "@trend-iq/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts"),
    },
  },
  // Tauri 要求 fixed port
  clearScreen: false,
  // 固化 Arco 预打包，避免首次浏览器加载时按需优化失败导致运行时崩溃
  optimizeDeps: {
    include: ["@arco-design/web-react", "@arco-design/web-react/icon"],
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    // 开发环境代理：浏览器预览时绕过 CORS
    // Tauri 环境下不经过此代理（使用 Tauri HTTP 插件）
    proxy: {
      // 东方财富
      "/em-kline": {
        target: "https://push2his.eastmoney.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/em-kline/, ""),
        headers: {
          Referer: "https://quote.eastmoney.com/",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      },
      "/em-quote": {
        target: "https://push2.eastmoney.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/em-quote/, ""),
        headers: {
          Referer: "https://quote.eastmoney.com/",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      },
      "/em-search": {
        target: "https://searchapi.eastmoney.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/em-search/, ""),
        headers: {
          Referer: "https://quote.eastmoney.com/",
        },
      },
      // 东方财富涨停/跌停统计（涨跌停比）
      "/em-zdt": {
        target: "https://push2ex.eastmoney.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/em-zdt/, ""),
        headers: {
          Referer: "https://quote.eastmoney.com/",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      },
      // 腾讯财经（备用数据源）
      "/tx-kline": {
        target: "https://web.ifzq.gtimg.cn",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/tx-kline/, ""),
      },
      "/tx-quote": {
        target: "https://qt.gtimg.cn",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/tx-quote/, ""),
      },
      "/tx-search": {
        target: "https://smartbox.gtimg.cn",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/tx-search/, ""),
      },
      // Yahoo Finance（备用数据源）
      "/yh-api": {
        target: "https://query1.finance.yahoo.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/yh-api/, ""),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      },
      // 新浪财经（用户环境可用，兜底大盘指数 / 个股）
      "/sina-quote": {
        target: "https://hq.sinajs.cn",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/sina-quote/, ""),
        headers: {
          Referer: "https://finance.sina.com.cn/",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      },
    },
  },
}));
