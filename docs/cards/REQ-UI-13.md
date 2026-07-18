# REQ-UI-13: 任务进行中跨页发送 → 发送队列（自动续发 + 撤回编辑/删除/置顶）

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：✅ 已闭环（👀 用户验收通过；2026-07-18 打回整改后再交付，用户确认"都通过了"）
- **优先级**：P1
- **提出日期**：2026-07-18
- **提出人**：用户
- **关联阶段**：Phase 1.2
- **关联卡**：REQ-UI-10（发送/停止交互）、REQ-UI-12（Markdown 渲染）、REQ-UI-01（零布局位移）

---

## 1. 需求描述

> 用户原话：「还有一个场景兜底未做。正在任务中时，用户切换到行情页面，然后在输入框内输入，点击发送，会把正在进行的任务终止。这个我期望的时发送消息，进入队列，挂起在输入框上方，任务完成后，再自动发送出去，队列允许撤回再次编辑，允许删除，允许置顶消息进行排序」

背景：当前 `ChatComposer` 在 `thinking`（生成中）时，发送按钮变为 STOP 按钮（`stopGeneration`），点击即终止进行中的任务。用户在「行情页」输入框输入并点击"发送"，实际触发的是终止——不符合预期。期望行为：

- 生成中从**任何页面**（行情页 / 对话页）发送消息，**不终止**当前任务，而是进入「发送队列」，挂起在输入框上方；
- 当前任务完成后，队列消息**按序自动发送**出去；
- 队列支持管理：**撤回再次编辑**（回到输入框可改）、**删除**、**置顶**（pin 到顶部做排序）。

---

## 2. 验收标准（AC）

- **AC1**：生成中（`thinking=true`）时，在行情页 / 对话页输入框输入内容并点击发送，**当前任务不被终止**（`stopGeneration` 不被误触发），新消息进入发送队列。
- **AC2**：队列面板**仅渲染在 AI 诊股页（/chat，`ChatInput`）输入框上方**；在行情首页（/，复用 `ChatComposer` 的 `AiChatEntry` 入口，带 `onAfterSend`）**不渲染**队列面板（`!isHome` 门控）。显示每条消息内容（单行截断）+ 附件数。
- **AC3**：当前任务完成（`thinking` 落 `false`，无论正常结束 / 被手动停止 / 失败）后，队首消息**自动发送**，逐条清空队列直到空。
- **AC4**：队列项支持**撤回 / 再次编辑**——点击后该条从队列移除并回填到输入框（含附件），可修改后重新发送。
- **AC5**：队列项支持**删除**——从队列移除，不影响进行中的任务。
- **AC6**：队列项支持**置顶**（pin）——pin 的项排到顶部，置顶后做排序（pinned 优先、同组按时间），可取消置顶。
- **AC7**：生成中发送按钮为**单按钮随输入框内容切换**（无次级「入队」按钮）——空内容时显示蓝色暂停方块（点击 `stopGeneration` 终止，还原 REQ-UI-10）；有内容时显示蓝色发送箭头（点击 `handleSubmit` 入队，不终止当前任务），发送后输入框清空自动变回暂停方块；想暂停可删空内容或先发送入队再暂停。回车键同样入队。`tsc` 0 新增、零 `pageerror`。
- **AC8**：队列状态持久化（刷新/切页不丢）；仅动 transform/opacity 或局部面板，不引发对话区/顶栏布局位移（REQ-UI-01）。

---

## 3. 实施方案

- **数据层 `chatStore.ts`**：
  - 新增 `QueuedMessage { id, content, attachments?, createdAt, pinned }`；状态加 `queue: QueuedMessage[]`、`draftText: string|null`、`draftAttachments: Attachment[]|null`（撤回回填用，瞬态不持久化）。
  - 动作：`enqueue(text, atts)`（非空才入队、按 pinned+createdAt 排序）、`removeFromQueue(id)`、`recallFromQueue(id)`（移除+回填 draft）、`togglePinQueue(id)`（切换 pin 后重排）、`clearQueue()`、`clearDraft()`。
  - `send` 的 `finally`：落 `thinking:false` 后若 `queue` 非空，取队首 `await get().send(...)` 自动续发（递归直到队列空）。
  - `partialize` 持久化 `queue`（message 历史 + 模型已持久）。
- **UI 层 `ChatComposer.tsx`**：
  - 新增队列面板（输入框上方）：标题「发送队列（N）· 任务完成后自动发送」+ 清空；每条 `flex` 卡片含内容(2 行截断)+附件提示 + 3 个操作（pin 切换 / 撤回编辑 / 删除）。
  - `handleSubmit`：生成中 → `enqueue(text, atts)` 清输入（首页额外 `onAfterSend()` 跳对话页看队列）；非生成 → 原有逻辑（首页 pendingInput 跳转 / 对话页直接 send）。
  - 生成中按钮区（与 REQ-UI-10 收口）：**单按钮随输入框内容切换**（无次级「入队」按钮）——空内容时显示蓝色暂停方块（`bg-accent`，点击 `stopGeneration`，还原 REQ-UI-10）；有内容时显示蓝色发送箭头（点击 `handleSubmit` = 入队，不终止当前任务），发送后输入框清空自动变回暂停方块；想暂停可删空内容或先发送入队再暂停。`onClick` 统一为 `isGenerating ? (hasContent ? handleSubmit : stopGeneration) : handleSubmit`；图标 `isGenerating ? (hasContent ? <SendIcon/> : <StopIcon/>) : <SendIcon/>`。回车键同样触发入队。非生成时保持蓝色发送按钮。
  - `draft` 回填 effect：`draftText/draftAttachments` 变化时填入输入框+附件并 `clearDraft()`+聚焦。
  - 新增图标 `PinIcon / EditIcon / TrashIcon`。
- 安全/边界：`enqueue` 仅非空入队；自动续发前 `thinking` 已为 false，`send` 守卫不重入；停止后仍会续发队列（符合"完成后自动发"）。

---

## 4. 实施记录

- `chatStore.ts`：新增 `QueuedMessage` 类型；状态加 `queue`/`draftText`/`draftAttachments`；动作 `enqueue`/`removeFromQueue`/`recallFromQueue`/`togglePinQueue`/`clearQueue`/`clearDraft`；`send` 的 `finally` 在 `thinking:false` 后若 `queue` 非空则取队首 `await get().send(...)` 自动续发；`partialize` 持久化 `queue`。
- `ChatComposer.tsx`：新增输入框上方「发送队列」面板（内容 2 行截断 + 附件提示 + 置顶/撤回编辑/删除操作）；`handleSubmit` 生成中走 `enqueue`、清输入、首页跳 `#/chat`；非生成维持原有首页 `pendingInput` / 对话页 `send`；生成中发送按钮为**单按钮随内容切换**（无次级「入队」按钮）——空内容显示蓝色暂停方块（点击 `stopGeneration`，还原 REQ-UI-10），有内容显示蓝色发送箭头（点击 `handleSubmit`=入队，不终止），发送后清空自动变回暂停；回车键同样入队；非生成时保持蓝色发送按钮；新增 `PinIcon/EditIcon/TrashIcon`。
- 根因：原 `canSend` 含 `!thinking` + 生成中按钮整颗变成 STOP → 用户在行情页输入后点击的是「终止任务」而非「发送」。与 REQ-UI-10 收口后：生成中发送按钮本体恢复为蓝色暂停方块（终止，空内容时）；有内容时单按钮切换为蓝色发送箭头（入队），无次级「入队」按钮；从任何页面输入文本后点击发送箭头或按回车都不会终止当前任务。

---

## 5. 🧪 自测（我来做）

- **tsc --noEmit**：仅 `ProfilePage.tsx` 既有 2 错，REQ-UI-13 改动 **0 新增**。
- **无头 Chrome 验证（2026-07-18 单按钮随内容切换收口后）**：拦截 `/chat/completions` 挂起生成，验证：
  - 生成中**空内容** → 发送按钮为蓝色暂停方块（`bg-accent`=rgb(59,130,246) 无红无灰、`aria-label="停止生成"`、含 `<rect>` 暂停图标、按钮可点） → 还原 REQ-UI-10 ✅
  - 点击蓝色暂停按钮 → 当前任务终止（`thinking` 落 `false`、按钮回 `发送` 禁用态、队列 0） → 停止生效 ✅
  - 再次生成（空内容→暂停）后**输入内容** → 按钮切换为蓝色发送箭头（`aria-label="发送"`、`title="发送并入队（任务完成后自动发送）"`、含 `<path>` 箭头、`bg-accent`、可点） → 单按钮随内容切换 ✅
  - 生成中点击发送箭头 → 消息进入队列（`queueItems` 0→1）、`textarea` 清空、按钮自动变回暂停方块 → 入队不终止 + 清空后回暂停 ✅
  - 点击暂停按钮 → 终止，零 `pageerror` ✅
  - 截图证据：`.workbuddy/memory/optionB_gen_empty.png`（生成中空内容=暂停）、`optionB_gen_content.png`（生成中有内容=发送箭头）
- **2026-07-18 打回整改后复测（无头 Chrome）**：经 `localStorage['trend-iq-chat']` 注入队列项：
  - 首页 `/#/`（`AiChatEntry`）：`body.innerText` 不含「发送队列」→ `homeQueueVisible=false` → 首页不展示队列 ✅
  - AI 诊股页 `/#/chat`：面板可见、标题「发送队列（1）」 ✅
  - 置顶交互：注入 2 条（A/B），点击第 2 条置顶 → `localStorage.queue` 顺序变为 `[b,a]`（B 移到队首） ✅
  - 零 `pageerror`（仅 sandbox 东财 API 的 CORS 网络错误，非应用错误）✅；`tsc --noEmit` 仅 `ProfilePage.tsx` 既有 2 错、0 新增。
  - 证据：`.workbuddy/memory/home_noqueue.png`、`.workbuddy/memory/queue_chat.png`。
- 状态：🧪 复测全过 → 👀 用户验收通过 → ✅ 已闭环（2026-07-18 末用户确认"都通过了"）。

---

## 6. 用户验收（打回 → 整改 → 再交付）

- **2026-07-18（打回意见）**：用户给出详细意见——「队列只展示在 AI 诊股页面，不在首页展示队列」。已据此整改（仅 AI 诊股页渲染队列面板，首页不渲染），重新自测全过，再次 👀 待用户验收。
- **2026-07-18（末）验收通过**：用户确认「都通过了」，REQ-UI-13 闭环 ✅。
- 初轮（2026-07-18）：用户验收未通过（与 REQ-UI-14 一并打回），待详细意见。
