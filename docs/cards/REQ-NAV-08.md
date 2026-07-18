# 需求卡 REQ-NAV-08: 导航第1项「总览」→「行情」，图标换 IconUp（上涨箭头）

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：✅ 已闭环（2026-07-16 用户拍板验收通过）
  - ⚠️ 状态机**不可跳跃**：必须先到 🧪 自测中并留证据，才能进 👀 待用户验收；✅ 必须由用户拍板。
- **优先级**：P1
- **提出日期**：2026-07-13
- **提出人**：用户
- **关联阶段**：Phase 1.1（设计语言收口 / 导航收尾）
- **关联需求/决策**：REQ-NAV-05（Arco 图标）；REQ-NAV-07（选中纯白无背景）；DEC-008（设计语言）；DEC-009（文本颜色等级 + SideNav 未选中 #666 例外）

---

## 1. 需求描述
> 用户原话："总览 改为行情，图标改为股票交易的图标"

- **文案**：左侧导航第 1 项 label 由「总览」改为「行情」。
- **图标（初版）**：由 `IconDashboard`（仪表盘）改为 `IconUp`（上涨箭头）。用户在候选（IconFire 热门 / IconThunderbolt 异动 / IconSwap 交易 / IconUp 上涨）中明确选择 **IconUp**。
- **图标（终版，用户验收期修订）**：用户另行提供自定义 SVG 图标（桌面 `股市_stock-market.svg` 线形版 + `股市_stock-market fill.svg` 填充版），要求改用此图标。已落地为 `src/components/StockMarketIcon.tsx` 组件：原硬编码 `#333` 改为 `currentColor`，跟随父级文字色（选中 `text-white` / 未选中 `text-text-muted` #666）；线形版 rect `fill="none"`、填充版 rect `fill="currentColor"`；尺寸 `1em` 跟随 `text-lg`。`IconUp` 已移除。
- **路由**：`key` 保持 `"/"`（行情页仍挂在根路由，不新建页面，仅改导航文案与图标）。
- **调研结论**：Arco 图标库（`@arco-design/web-react/icon`）**无** Stock / K线 / 交易 / 行情 专门命名（`icons.json` 与类型定义均无匹配）；`IconUp` 存在，`IconUpFill` **不存在**（仅 `IconUpCircle`），故无 Fill 变体。
- **选中态约定（沿用 NAV-07）**：选中图标＋文字纯白 `text-white`、无选中背景 `bg-transparent`；本项无 Fill 变体 → 选中用线形图标＋纯白＋描边加粗(`strokeWidth` 5，常态 4) 近似面形，与总览/订阅/我的 一致。
- **未选中态约定（沿用 DEC-009 例外）**：保持 `text-text-muted`(`#666`)，hover 提亮至 `text-text-secondary`(`#999`)。

## 2. 验收标准（Acceptance Criteria）
- [ ] AC1：第1项文案由「总览」变为「行情」。
- [ ] AC2：图标由 `IconDashboard` 变为 `IconUp`，渲染出 `svg.arco-icon`；无 `IconDashboard`（仪表盘）残留。
- [ ] AC3：选中态纯白 `text-white` 无背景；未选中 `text-text-muted`(`#666`)，与 NAV-07/DEC-009 一致。
- [ ] AC4：dev server 编译无报错、浏览器无 `pageerror`、`#root` 正常渲染（无头浏览器验证）。
- [ ] AC5：`requirements.md` 新增 REQ-NAV-08 一行且状态随流程回写；本卡状态最终闭环。

## 3. 实施记录
### 🔧 实施中
- 2026-07-13（初版）：编辑 `AppShell.tsx`，`IconDashboard` → `IconUp`，`label: "总览"→"行情"`，`key: "/"` 不变。
- 2026-07-13（修订，验收期用户改用自定义 SVG）：
  - 新增 `src/components/StockMarketIcon.tsx` 组件：将用户桌面 `股市_stock-market.svg`（线形）与 `股市_stock-market fill.svg`（填充）合并为一个组件，`stroke`/`fill` 硬编码 `#333` 改为 `currentColor`；线形版 rect `fill="none"`、填充版 rect `fill="currentColor"`；`width/height="1em"` 跟随 `text-lg`。导出 `StockMarketIcon` / `StockMarketLine`（线形）/ `StockMarketFill`（填充）。
  - `AppShell.tsx`：移除 `IconUp` import，改 import `StockMarketLine, StockMarketFill`；`NAV_ITEMS` 第1项 `icon: StockMarketLine, iconFill: StockMarketFill`；`label: "行情"`、`key: "/"` 不变。

### 🧪 自测（我来做）
- **方法**：vite dev server（localhost:1420）下，系统 Chrome 无头（puppeteer-core）按 **哈希路由** 加载，抓 `pageerror`/`console.error`，`page.evaluate` 读导航文案、svg 存在性、`rect` 的 `fill` 属性与计算色/背景。
- **结果**：通过（两轮：选中态 `#/`、未选中态 `#/watchlist`）。
- **证据**：
  - 导航四项文案 = `["行情","自选股","订阅","我的"]`，第1项=`行情`；导航内无「总览」残留（IconDashboard 已替换） → AC1 ✅ / AC2 ✅
  - **选中态（#/）**：行情项 `color = rgb(255,255,255)` 纯白、`backgroundColor = rgba(0,0,0,0)` 无背景；svg `class="text-lg"`；rect 存在 `fill="currentColor"` ⇒ 使用**填充版**（实心柱） → 图标随选中白色 ✓ / AC3 ✅
  - **未选中态（#/watchlist）**：行情项 `color = rgb(102,102,102)`（= `#666` = text-muted，DEC-009 例外）；`backgroundColor = rgba(0,0,0,0)`；rect 全部 `fill="none"` ⇒ 使用**线形版**（描边柱） → 图标随未选中 #666 ✓ / AC3 ✅
  - 控制台仅 1 条 `404`（favicon.ico，已知无害），**两轮均无 pageerror**；`#root` 正常渲染（6345 字符） → AC4 ✅
  - 逐项 AC：AC1✅ AC2✅ AC3✅ AC4✅

### 👀 用户验收
- 待用户验收（预览地址：http://localhost:1420/ ，观察左侧第1项文案与图标）

## 4. 闭环
- 待闭环
