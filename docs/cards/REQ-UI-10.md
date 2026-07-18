# REQ-UI-10: AI 对话发送后暂停/终止交互

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：✅ 已闭环（⬜→🔧→🧪→👀→✅；2026-07-18 用户最终验收通过）
- **优先级**：P1
- **提出日期**：2026-07-18
- **提出人**：用户
- **关联阶段**：Phase 1.2
- **关联卡**：REQ-UI-08、REQ-UI-09、REQ-UI-01

---

## 1. 需求描述
> 用户原话：交互优化 AI对话发送消息后，无法暂停，补充发送后暂停交互。发送按钮点击发送后，任务进行中，发送按钮变为暂停按钮（点击后任务终止）。任务完成后自动恢复为默认样式，默认样式需要判断输入框如果内容则为激活状态，无内容则为默认禁用状态。

---

## 2. 验收标准（AC）

- **AC1**：点击发送后，任务进行中（`chatStore.thinking=true`），发送按钮变为「停止」按钮（图标为停止方块 ■），且该按钮**可点击**（不被 `disabled`）。
- **AC2**：点击「停止」按钮 → 调用 `stopGeneration()` 经 `AbortController.abort()` 中止当前生成；全局 `thinking` 置回 `false`；该条 assistant 消息标记为「⏹ 已停止生成」（不显示「调用模型失败」红色错误）。
- **AC3**：任务正常完成 或 真实失败 → `thinking` 置回 `false`，发送按钮恢复默认样式（有内容激活 / 无内容禁用）。
- **AC4**：默认（非生成中）样式按输入框状态判定：输入框**有内容** 或 **有附件** → 激活态（`bg-accent text-white`、可点）；输入框**无内容且无附件** → 禁用态（`bg-bg-tertiary text-text-muted` + `border` + `cursor-not-allowed`）。
- **AC5**：按钮在「发送 / 停止」两态切换及终止过程不引起输入框布局位移（仅改图标/颜色，`REQ-UI-01` 零布局位移）。

---

## 3. 实施记录（2026-07-18）

- 底层 `sendChat` 已支持 `AbortSignal`（`opts.signal` 透传 fetch），无需改 `llm.ts`。
- `store/chatStore.ts`：
  - 模块级 `let currentAbort: AbortController | null = null;`
  - 接口新增 `stopGeneration: () => void;`，实现 `currentAbort?.abort(); currentAbort = null;`
  - `send` 内创建 `currentAbort = new AbortController()`，调 `sendChat(..., { signal: currentAbort.signal })`；`catch` 区分 `AbortError`（标记 assistant 为「⏹ 已停止生成」，非红色错误气泡）与真实失败（红色「调用模型失败」）；`finally` 清理 `currentAbort` 并 `thinking: false`。
- `components/chat/ChatComposer.tsx`：
  - 新增 `StopIcon`（14×14 停止方块 ■）。
  - 引入 `stopGeneration` 与 `const isGenerating = thinking`。
  - 发送按钮状态机：
    - 生成中（`thinking`）：显示停止方块图标、红色 `bg-up-red text-white`、可点（`disabled={!isGenerating && !canSend}` → false）、`aria-label="停止生成"`，点击调 `stopGeneration` 终止任务。
    - 默认：显示发送图标，`disabled` 按 `canSend` 判定（有内容/附件 → 激活 `bg-accent text-white`；无内容无附件 → 禁用灰 `bg-bg-tertiary text-text-muted cursor-not-allowed`）。
  - 仅改图标/颜色，无布局位移（满足 REQ-UI-01）。
- 与 REQ-UI-13 收口（2026-07-18 演进：先「恢复单颗蓝色暂停」→ 再细化为「单按钮随内容切换」）：生成中发送按钮为**单按钮随输入框内容切换**（无次级「入队」按钮）——空内容时显示蓝色暂停方块（点击 `stopGeneration` 终止，还原 REQ-UI-10）；有内容时显示蓝色发送箭头（点击 `handleSubmit` 入队，不终止进行中的任务），发送后清空自动变回暂停；想暂停可删空内容或先发送入队再暂停。回车键同样入队。REQ-UI-10 的蓝色暂停外观与 REQ-UI-13 的队列能力在同一颗按钮上共存。
- 状态：🔧→🧪 自测通过，👀 待用户验收。

---

## 4. 🧪 自测（我来做）

- **方法**：dev server + 无头 Chrome（puppeteer-core），请求拦截 `/chat/completions` 挂起以制造「生成中」态，验证按钮状态机全流程。
- **结果（2026-07-18 无头实测）**：
  - **AC4 禁用态**：空输入框 → 发送按钮 `disabled=true` ✅
  - **AC4 激活态**：输入内容 → 发送按钮 `disabled=false` 且 `bg-accent text-white` ✅
  - **AC1**：点击发送后 `thinking=true` → 按钮变停止（方块图标、`bg-up-red`、可点 `disabled=false`、`aria-label="停止生成"`）✅
  - **AC2**：点击停止 → assistant 消息出现「⏹ 已停止生成」（非「调用模型失败」红色错误）✅
  - **AC3**：终止后 `thinking=false` → 按钮恢复默认样式（输入已清空 → 禁用态）✅
  - **AC5**：生成中 / 终止前后 textarea `getBoundingClientRect` 完全一致（零布局位移）✅
  - 零 `pageerror` ✅
- **typecheck**：仅 `ProfilePage.tsx` 既有 2 错、0 新增 ✅

---

## 5. 验收打回与修复（2026-07-18）

- 用户预览验收发现 2 项问题（视为 👀 打回 → 🔧 修复）：
  1. **输入框未清空**：Tab 填入提示词后点发送，生成中输入框仍残留提示词，需手动删除。
     - 根因：对话页分支 `setText("")` 写在 `await send()` **之后**，生成期间 text state 未清空。
     - 修复：`ChatComposer.tsx` 对话页分支改为**发送前** `setText("")`（先 `const sentText = text; setText("");` 再 `await send(sentText, attachments)`），任务开始即清空、水印 overlay 重新可见。
  2. **停止按钮红色**：生成中停止按钮用了 `bg-up-red`，用户要求保持蓝色。
     - 修复：停止按钮 className `bg-up-red` → `bg-accent`，与发送按钮同蓝，仅靠图标（方块 ⏹ / 发送 ➤）区分。
- 自测（🧪，同请求拦截法）：发送后 `textarea.value === ""` ✅、水印 overlay `opacity=1` 回到默认态 ✅、停止按钮 `bg-accent` 且**不含** `bg-up-red` ✅、停止方块图标 ✅、终止后恢复 +「⏹ 已停止生成」✅、零 pageerror ✅；tsc 仅 ProfilePage 2 错、0 新增。
- 状态：🔧→🧪 自测通过，👀 再交付用户验收。

## 6. 用户验收通过
- **2026-07-18**：用户拍板验收通过（与 REQ-UI-12 / REQ-NAV-11 / REQ-NAV-12 一并通过；REQ-UI-13 / REQ-UI-14 未通过待整改），状态推进 ✅ 已闭环。
