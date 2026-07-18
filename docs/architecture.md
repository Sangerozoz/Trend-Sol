# 实施方案 / 技术架构（Architecture）

> 本文件定义**怎么落地**需求（见 `requirements.md`）。架构决策的可追溯理由见 `decisions.md`。

## 1. 技术栈
- **桌面壳**：Tauri 2（Rust 后端）
- **前端**：React 18 ＋ Vite 6 ＋ TypeScript
- **路由**：react-router-dom v6 **HashRouter**（规避 Tauri `file://` 刷新白屏）
- **样式**：TailwindCSS 3.4（自定义黑底 token）＋ Arco Design（`@arco-design/web-react` ²².66，仅复杂组件）
- **图表**：KLineCharts v9（overlay figures：line/rect/text；无双 Y 轴、无阴影）
- **状态**：Zustand
- **数据请求**：TanStack Query（`refetchInterval` 实现刷新）
- **AI**：Rust `ai.rs` 调大模型（API Key 存 Rust 端，前端不接触密钥）

## 2. 目录结构（pnpm monorepo）
```
trend-iq/
├─ apps/desktop/        # Tauri + React 入口
│  ├─ src/pages/        # Overview/Watchlist/Symbol/Subscription/Profile
│  ├─ src/components/    # AppShell / 全局栏 / 侧栏
│  ├─ src/hooks/         # useStockData 等
│  ├─ src/arco-theme.css # Arco 纯黑覆写（必须最后引入）
│  └─ src-tauri/         # Rust：collector.rs / ai.rs(待建) / lib.rs
├─ packages/
│  ├─ chart/            # ChartContainer + colors.ts
│  ├─ ui/               # 自写组件：AppShell/AsidePanel/InfoPanel/QuotePanel/Toolbar/SearchBar
│  ├─ store/            # Zustand：lineVisibility / watchlist / portfolio(待拆)
│  ├─ data/             # providers：local-cache / 各数据源 fallback
│  ├─ shared/           # 跨包工具/类型
│  └─ ai/               # 待建：context-builder / prompt-templates / hooks / 渲染
└─ docs/                # 本文档系统
```

## 3. 数据层架构
```
Rust collector.rs ──采集──> 本地缓存 JSON
        │                        │
        │ Tauri invoke           │ LocalCacheProvider 读取
        ▼                        ▼
   前端 TanStack Query ──交易时段4s刷新──> 图表/行情渲染
```
- **按方法独立 fallback**：某源某方法失败，自动切下一源，不整体失败（REQ-DATA-03）。
- **本地缓存优先**：断网/限频读缓存，保证可用（REQ-DATA-04/05）。
- **新增 Provider**：大盘指数（REQ-DATA-06）、板块行情（REQ-DATA-07）未来接入。

## 4. UI 架构（分层）
- **自写层（Tailwind）**：整体布局、黑底主题、画线侧栏、图表区、全局顶栏。
- **Arco 层（局部）**：`Icon*` / Table / Modal / Form / DatePicker / Message。
- **Arco 纯黑接法（关键）**：
  1. `index.html` 的 `<body class="arco-theme-dark">`（浮层 portal 到 body，必须 body 带类）。
  2. `main.tsx` 引入顺序：`index.css` → `arco.css` → `arco-theme.css`（覆写文件**最后**引入）。
  3. `App.tsx` 用 `<ConfigProvider theme={{ primaryColor:"#3b82f6", borderRadius:4 }}>` 包裹。

## 5. 状态管理演进
- 当前：`lineVisibility` / `watchlist` 两个 store。
- 演进（REQ-WL-01）：拆分为 `chart / watchlist / portfolio / chat / settings`；自选股升级 `watchGroups + watchItems`（老数据迁移到"我的自选"默认组）。

## 6. 路由
- HashRouter；`AppShell` 包裹 `<Outlet>`；全局顶栏＋左侧导航常驻；个股页右侧面板按需展开。

## 7. 工程约定（踩坑沉淀，必读）
1. **dev server 启动**：在 `apps/desktop` 跑
   `PATH=…/node/22.22.2/bin:$PATH node node_modules/vite/bin/vite.js --port 1420 --strictPort --host`
   用 Bash `run_in_background` 直接跑 vite（**勿** `nohup … &` 再套后台，双重后台会被回收秒死）。
2. **pnpm store**：项目用 `trend-iq/.pnpm-store/v11`，managed pnpm 默认用家目录 → 装包加
   `--store-dir /Users/sanger/WorkBuddy/2026-07-01-11-51-31/.pnpm-store/v11`。
3. **Vite 重优化缓存**：重新优化会批量删 `.vite/deps` 触发沙箱删除守卫 → **用 `mv node_modules/.vite node_modules/.vite.bak`** 移走，勿 `rm`。
4. **Arco 图标名**：以实际导出为准（铃铛是 `IconNotification`，**没有 `IconBell`**）；错误 import 会因 App 静态引入所有页面导致**整站空白**。
5. **空白页诊断**：dev server 返回 200 但空白 = 浏览器端运行时崩溃（curl 测不出）。用系统 Chrome 无头 ＋ `puppeteer-core` 抓 `pageerror` 与 `#root` 的 `innerHTML.length`（脚本 `capture.mjs`）。已加 `ErrorBoundary` ＋ `window.onerror` 兜底，崩溃显示红字而非空白。
6. **打包纪律**：**等明确"打包"指令再 `tauri build`**；日常用 dev server 浏览器预览（REQ 不依赖打包）。

## 8. 与需求映射
| 架构模块 | 关联需求 |
|---|---|
| Tauri + Rust collector | REQ-DATA-01~05 |
| Tailwind 黑底 + Arco 局部 | REQ-UI-01~05 |
| HashRouter + AppShell | REQ-NAV-01~04 |
| packages/ai + Rust ai.rs | REQ-AI-01~04, REQ-SYM-04 |
| store 分组演进 | REQ-WL-01~03 |
