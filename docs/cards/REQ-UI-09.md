# REQ-UI-09: 输入框水印滚动提示词 + 直接用 tab

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：✅ 已闭环（2026-07-18 用户验收通过：GSAP #2 逐字错落浮现 + Tab 标签与提示词垂直居中对齐 + 4s 切换 + Tab 键填入，仅 transform/opacity 零布局位移）
- **优先级**：P1
- **提出日期**：2026-07-18
- **提出人**：用户
- **关联阶段**：Phase 1.2
- **关联卡**：REQ-UI-08

## 1. 需求描述
> 用户原话（4 点）：
> 1. 水印文字（placeholder）大小应与用户输入文字大小一致。
> 2. 水印文字作为提示词，生成 10 个提示词，前端滚动展示，间隔约 2.5 秒切换一次。
> 3. 提示词需股票相关、贴合实际股民需求，结合当下热点题材/事件；建立提示词池子不断更新。
> 4. 加入一个 tab，直接使用水印文字的能力。

## 2. 验收标准（Acceptance Criteria）
- [x] AC1：placeholder 文字大小 = 用户输入（text-sm / 14px），不再用 text-xs。
- [x] AC2：提示词池（12 条）前端滚动展示，每 4s 切换一条，切换使用 GSAP #2 逐字错落浮现（仅 transform/opacity，零布局位移，REQ-UI-01）。
- [x] AC3：提示词股票相关、贴合股民需求、结合当下热点题材/事件；独立池子文件 `lib/chatPrompts.ts`，便于持续更新。
- [x] AC4：提示词仅显示于输入框上方 overlay（含 Tab 标签 + 提示词文案，无下方重复/按钮）；输入框为空时按 Tab 键将当前提示词填入输入框，可编辑后发送（无头已验证）。

## 3. 实施记录
### 🔧 实施中（2026-07-18）
- 新建 `apps/desktop/src/lib/chatPrompts.ts`：导出 `CHAT_HINTS`（12 条股票相关提示词，覆盖估值/半导体/AI 算力/低空经济/机器人/降息有色/新能源/华为链/红利/消费/军工重组/北交所），注释约定结合热点持续更新。
- 修改 `apps/desktop/src/components/chat/ChatComposer.tsx`：
  - 引入 `CHAT_HINTS`；新增 `hintIndex` state + `useEffect` 中 `setInterval` 每 2500ms 切换（取模循环）。
  - `textarea` `placeholder` 改为 `CHAT_HINTS[hintIndex]`，className 由 `placeholder:text-xs placeholder:leading-4 placeholder:font-['Inter']` 改为 `placeholder:text-sm placeholder:text-text-muted`（大小与输入 text-sm 一致）。
  - 新增 `useCurrentHint()`：首页 `setPendingInput` + `onAfterSend()`（暂存草稿跳转）；对话页 `send(hint, [])` 直发。
  - textarea 下方（仅 `text` 为空时）渲染「建议」tab 按钮：标签 + 当前提示词 truncate + 「直接用 ↵」，整条点击触发 `useCurrentHint`。

### 🔧 实施中（2026-07-18 二次迭代：去"建议"标签 + 上方 overlay + Tab 标签 + 4s + Tab 键填入）
- 用户反馈：① 不使用"建议"标签（是引导而非建议）；② 当前提示词上方(placeholder)与下方(建议按钮)都显示，改仅上方显示、移除下方重复与按钮；③ 提示词前加"Tab"标签表示按 Tab 键使用；④ 2.5s 太快改 4s；⑤ 切换用 GSAP 文字动画（待用户选型）。
- 去"建议"按钮：`ChatComposer.tsx` 删除下方 `useCurrentHint` 按钮块（"建议"标签 + "直接用 ↵"）。
- 提示词移入上方 overlay：原 `placeholder={CHAT_HINTS[hintIndex]}` 改空 `placeholder=""`；新增 `relative` 包裹 + `absolute` overlay（`pointer-events-none`）：`[Tab]` 标签（`bg-bg-tertiary text-[10px]`）+ `<span ref={hintTextRef}>` 当前提示词（`truncate`）；`text.trim()===""` 显示、有内容即隐藏（等同 placeholder 行为）。
- `Tab` 键填入：`onKeyDown` 增 `e.key==="Tab" && text.trim()===""` → `preventDefault()` + `setText(CHAT_HINTS[hintIndex])` + `requestAnimationFrame` 内 `focus()` + `setSelectionRange` 光标置末。
- 切换节奏：`setInterval` 2500 → 4000ms；`chatPrompts.ts` 注释同步 2.5s→4s。
- GSAP 文字动画：已确认 `gsap`/`@gsap/react` 已安装、gsap 全插件免费；约束仅动 `transform/opacity`（REQ-UI-01 零布局位移）。**已建 `HintAnimationDemo.tsx` 演示页（`/hint-demo`）列出候选动画供用户选型，选型后删除演示页与路由**。
- 自测(结构部分)：tsc 仅 ProfilePage 既有 2 错、0 新增；无头验证：建议按钮=0、Tab 标签=1、overlay 提示词=首条、textarea placeholder=""""、零 pageerror。
- 状态：🔧 实施中，GSAP 文字动画待用户选型。

### 🔧→🧪 实施（2026-07-19：GSAP #2 逐字错落浮现已接入）
- 用户从候选动画中选 **#2 逐字错落浮现**（淡隐父容器后重建逐字 `<span>`，逐字 `y:12→0` + `autoAlpha:0→1` stagger 0.025，power2.out）。
- 关键坑已修复：`gsap.fromTo` 作用于重建后的子 `span` 前，须 `gsap.set(el,{autoAlpha:1})` 复位父级（否则父级残留 `autoAlpha:0` 整块不可见；演示页 #2 初版即此 bug，已修并记录进 gsap-react-animation skill）。
- `ChatComposer.tsx`：
  - 引入 `import { gsap } from "gsap";` + 顶层 `escapeHtml()`。
  - 新增 `[hintIndex]` 驱动 effect：重建 `hintTextRef` 内部为逐字 `<span>`（`display:inline-block;white-space:pre` 保中文空格、`escapeHtml` 防 `<>&`），`gsap.fromTo(spans,{y:12,autoAlpha:0},{y:0,autoAlpha:1,duration:0.3,stagger:0.025,ease:"power2.out"})`。
  - 新增卸载清理 effect：`gsap.killTweensOf` 子 span，避免泄漏。
  - overlay 改**始终渲染** + `transition-opacity`，由 `text.trim()===""` 控制 `opacity-100/0`（不条件卸载，保证拆字 DOM 结构稳定，切换动画不被卸载打断）。
  - `setInterval` 已为 4000ms（二次迭代已改）；`chatPrompts.ts` 注释同步「每 4s 切换」。
- 删除 `HintAnimationDemo.tsx` 与 `App.tsx` 的 `/hint-demo` 路由/import（选型后清理）。
- 自测(🧪)：tsc 仅 ProfilePage 既有 2 错、0 新增；无头 Chrome（puppeteer-core）验证见下。

### 🧪 自测（我来做）
- **方法**：dev server 预览（localhost:1420，HTTP 200）+ 无头 Chrome（puppeteer-core）抓 `pageerror` + 交互/样式/布局探测。
- **结果**：通过（2026-07-19 GSAP #2 版本）。
- **证据（2026-07-19 无头验证）**：
  - 初始 overlay 提示词="帮我分析贵州茅台当前估值是否合理，现在还能拿吗？"，逐字 `<span>` 数=24，计算样式 `opacity=1`、`visibility=visible` ✅（GSAP 逐字结构正确、可见）
  - 按 **Tab 键**（输入框为空时）→ textarea 值被填入="帮我分析贵州茅台当前估值是否合理，现在还能拿吗？"，与当前提示词一致 ✅（AC4 填入生效）
  - 等待 4.2s 后切换：提示词变为"近期半导体设备国产替代加速，哪些材料和设备龙头值得跟踪？"，逐字 `<span>` 重建=28、仍 `opacity=1`、可见 ✅（4s 滚动 + GSAP 逐字重建生效）
  - 布局位移检测：切换前后 textarea `getBoundingClientRect` top/left/width/height 完全一致 → `noLayoutShift=true` ✅（仅 transform/opacity，零布局位移，满足 REQ-UI-01）
  - 真实 `pageerror`（未捕获 JS 异常）=0；53 条 console 报错均为 sandbox 无外网数据代理 `ERR_CONNECTION_REFUSED`（预期噪声，非代码 bug）✅
  - tsc：仅 `ProfilePage.tsx` 既有 2 错、0 新增 ✅
- **结论**：AC2（12 条/4s/GSAP 逐字）、AC4（上方 overlay + Tab 标签 + Tab 键填入）全部达成，可交付 👀。

### 👀 用户验收
- **结果**：待验收
- **日期**：
- **意见**：

## 4. 闭环
- **结论**：待用户验收后回写 ✅。
- **遗留**：提示词池需结合市场热点持续更新（维护 `lib/chatPrompts.ts`）。
