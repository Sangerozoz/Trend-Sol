# REQ-UI-08: AI 对话输入框交互补全 + 对话导航入口

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：✅ 已闭环（2026-07-18 用户验收通过；语音按钮 SHOW_VOICE=false 暂隐藏，识别逻辑保留待原生/云端 ASR 接入后恢复）
- **优先级**：P1
- **提出日期**：2026-07-17
- **提出人**：用户
- **关联阶段**：Phase 1.2
- **关联卡**：REQ-UI-07

---

## 1. 需求描述
> 用户原话（REQ-UI-07 的 AC3 打回，逐项交互规格）：
> 1. 「+」= 上传附件：图片 / 文档，常见格式即可，文档大小限制 10MB。
> 2. 模型选择器：默认用用户自己接入的模型（我们不提供模型服务）；当前可接入 mimo 供用户使用，用户可点击切换模型。
> 3. 麦克风：语音输入，讲完后识别为文字显示在输入框。
> 4. 发送按钮：点击发送出去。
> 5. 导航新增「对话」入口（行情与自选股之间）；首页输入框点击后跳转对话页并进行对话。
>
> 2026-07-17 第二次迭代补充（用户直接追加）：
> - 1'：首页应支持完整交互功能（文字输入 / 文件上传 / 模型切换 / 语音输入），只有用户点击发送后才从首页跳转 /chat，发送前停留在首页准备。
> - 2'：上传入口样式必须严格按设计稿 1:1 还原（圆形 32px、深色填充、细边框、灰色 plus 图标；布局/颜色/图标/间距不得自行调整）。
> - 3'：语音交互改为手动控制：点击→激活并开始收音，按钮持续保持激活态；再次点击→结束收音并开始识别。修正原“激活态短暂自动消失”问题。
> - 4'：发送按钮状态逻辑：输入区无内容（文字/文件/语音结果等）时禁用（灰显且不可点）；有有效内容时才可发送。

> 2026-07-17 第三次迭代补充（用户直接追加）：
> - 2''：上传入口样式必须按 MasterGo 设计稿 1:1 还原：图标为纯 plus、18×18、#666666，按钮 hover / active / disabled 状态完整；不得自行调整。
> - 3''：语音输入选中后自动关闭问题须修复：排查 sandbox 是否中断语音连接或阻止权限，并增加兜底处理。

## 2. 验收标准（Acceptance Criteria）
- [x] AC1：首页输入区为真实可编辑组件，支持文字输入、文件上传、模型切换、语音输入；发送前用户始终停留在首页。
- [x] AC2：只有点击发送后，才从首页跳转 `/chat` 并继续展示/发送对话（草稿通过 `pendingInput` 暂存，对话页自动完成真实发送）。
- [x] AC3：上传入口样式严格按设计稿：圆形 32px、`bg-bg-tertiary`(#161616)、`border-border-default`(#262626) 细边框；图标为纯 plus（18×18、#666666），无额外圆圈；hover/active/disabled 状态按设计稿 token 实现。
- [x] AC4：模型选择器可展开、列出可选模型、点击切换并持久显示；首页与对话页均使用同一真实模型。
- [x] AC5：麦克风手动控制：首次点击 → `listening=true`，按钮保持 `bg-accent` 激活态并持续收音；Chrome 在静音后自动结束识别时通过自动重启保持收音态；再次点击 → `recognition.stop()`，识别结果进输入框，激活态消失；无权限/不支持时显示红色错误提示。
- [x] AC6：发送按钮禁用逻辑：当文字为空、且无附件、且无语音结果时，`disabled=true`，视觉灰显（`bg-bg-tertiary` + `text-text-muted` + `cursor-not-allowed`）；有任一有效内容时启用。
- [x] AC7：「+」支持图片/文档、≤10MB 校验、附件 chips 预览；Enter 发送 / Shift+Enter 换行。
- [x] AC8：导航新增「对话」入口（行情与自选股之间），且首页发送后跳转 `#/chat` 可直接对话。
- [x] AC9：`tsc --noEmit` 无新增错误，无头浏览器无 `pageerror`。
- [x] AC10：Tauri bundle 增加 `NSMicrophoneUsageDescription`，`tauri.conf.json` 已声明麦克风用途；对 sandbox/无权限/不支持环境提供语音错误提示与优雅降级。

## 3. 实施记录
### 🔧 实施中（2026-07-17 第二次迭代）
- 日期：2026-07-17
- 重构：
  - 新建 `apps/desktop/src/components/chat/ChatComposer.tsx`：将原 `ChatInput` 抽为可复用组件，集中管理文字/附件/模型/语音/发送 UI 与本地状态。
  - 修改 `apps/desktop/src/components/chat/ChatInput.tsx`：退化为薄壳，直接复用 `ChatComposer`。
  - 修改 `apps/desktop/src/components/market/AiChatEntry.tsx`：复用 `ChatComposer` 并传入 `onAfterSend={() => navigate('/chat')}`，首页即可完整输入，发送后跳转。
  - 修改 `apps/desktop/src/store/chatStore.ts`：新增 `send` 异步方法（统一 LLM 调用逻辑）、`pendingInput` 与 `setPendingInput`（首页草稿暂存）。
  - 修改 `apps/desktop/src/pages/ChatPage.tsx`：mount 时检测 `pendingInput`，自动完成发送。
- 交互/视觉修正：
  - 上传按钮：圆形 32px、`bg-bg-tertiary`、`border-border-default`、图标色 `#666666`，严格对齐设计稿。
  - 语音按钮：改为手动 toggle，`SpeechRecognition.continuous = true`，激活态由用户点击结束控制，不再自动消失。
  - 发送按钮：空内容时 `disabled=true`，样式改为 `bg-bg-tertiary text-text-muted cursor-not-allowed`，视觉上明显灰显。
- 新增文件：
  - `apps/desktop/src/components/chat/ChatComposer.tsx`

### 🔧 实施中（2026-07-17 第三次迭代）
- 日期：2026-07-17
- 按 MasterGo 设计稿 1:1 还原上传按钮：
  - 图标改为纯 plus（18×18、strokeWidth=2、无额外圆圈），颜色 `#666666`（`text-text-muted`）。
  - 按钮尺寸保持 32×32px、圆角 9999px、背景 `#161616`（`bg-bg-tertiary`）、边框 `#262626`（`border-border-default`）。
  - 交互状态：`hover:text-text-primary hover:border-white/20 hover:bg-white/5`；`active:bg-white/10 active:text-text-primary active:border-white/30`；`disabled:opacity-50 disabled:cursor-not-allowed`（与发送按钮统一在 `thinking` 时禁用）。
- 修复语音自动关闭：
  - 引入 `manualStopRef` 区分用户手动停止与浏览器自动结束；`continuous=true` 模式下，Chrome 在静音后触发 `onend` 时自动重启（80ms 延迟），保持收音态。
  - 增加 `restartCountRef` 限制连续重启 5 次，超过后停止并提示错误。
  - `onerror` 分类处理：`not-allowed` / `service-not-allowed` 为环境限制（sandbox / Tauri webview 无权限），立即停止并显示红色提示；`no-speech` / `network` 等临时错误由 `onend` 自动重启兜底。
  - 组件卸载时设置 `manualStopRef=true` 并停止识别，避免内存泄漏。
- 权限声明：
  - `apps/desktop/src-tauri/tauri.conf.json` 增加 `bundle.macOS.info.NSMicrophoneUsageDescription`，声明麦克风用途。

### 🔧 实施中（2026-07-18 第四次迭代：修复"反复启动关闭"）
- **根因**：第三次迭代为对抗 Chrome `continuous=true` 静音自动 `onend`，在 `onend` 中加了 80ms 循环 `start()` 重启；每次 `start()` 重新初始化音频捕获导致麦克风指示闪烁/握手抖动；若叠加 `network`/`audio-capture` 错误会放大成快速循环，用户感知为"反复启动关闭"。
- **重构 `ChatComposer.tsx` 语音部分**：
  - 引入显式状态机 `voicePhase: idle | listening | paused | error`（替代原 `listening` 布尔），UI 与实际 recognizer 状态严格一致。
  - **去除 80ms 循环重启**：静音超时（`onend` 且无 error / `no-speech`）不再强制重启，改为进入 `paused` 态并提示"语音已暂停（静音超时），点击麦克风继续"；用户再次点击 = 续接当前会话（保留已识别文本）。
  - **错误分类处理**：
    - `not-allowed` / `service-not-allowed`（权限）→ 立即停 + 红色提示"麦克风权限被拒绝…"
    - `audio-capture`（设备被占用：会议/录音软件/其他标签页占用麦克风）→ 立即停 + 提示"无法访问麦克风，可能被其他程序占用…"
    - `network` → 退避重连，最多 2 次（1s / 2s），而非抖动循环；超限转 `paused`
    - `aborted` → 用户主动 stop，由 `onend` 收尾
  - 新增结构化日志（前缀 `[voice]`）：`onerror` / `onend(manualStop, lastError)` / `network retry` / `paused`，便于用户在本机 DevTools Console 抓事件流定位。
  - 卸载时清理 `retryTimer` 定时器，避免内存泄漏。

### 🔧 实施中（2026-07-18 第五次迭代：语音按钮暂时隐藏）
- 用户反馈语音功能在本机/预览环境仍无法使用（Web Speech API 在 Tauri webview 不可用、预览环境无麦克风权限），要求暂时隐藏。
- 在 `ChatComposer.tsx` 加 `const SHOW_VOICE = false;`，用 `{SHOW_VOICE && (<麦克风按钮/>)}` 包裹；识别逻辑（toggleMic/startRecognition/stopVoice/[voice] 日志）全部保留，待接入原生/云端 ASR 后改 `true` 即可恢复，无需重写。

### 🧪 自测（我来做）
- **方法**：dev server 预览 + 无头 Chrome（puppeteer-core 1440×900）抓 `pageerror` + 交互探测。
- **结果**：通过（沙箱无外网/无麦克风，真实语音与模型回复需用户本机含网+授权确认；错误场景已优雅处理）。
- **证据**：
  - `tsc --noEmit`：仅 `ProfilePage.tsx` 既有 2 错无新增。
  - 无头验证（2026-07-17 第三次迭代）：
    - 上传按钮尺寸/样式：32×32px、圆角 9999px、边框 rgb(38,38,38)、背景 rgb(22,22,22)、图标 18×18、图标色 rgb(102,102,102) ✅
    - 上传按钮图标：纯 plus（无额外圆圈），与设计稿一致 ✅
    - 语音按钮：点击后切换为 `bg-accent` 激活态；sandbox/无权限环境下 1.5s 内显示红色错误提示「麦克风权限被拒绝或当前环境不支持语音输入」✅
    - 输入并发送 → URL 立即变为 `http://localhost:1420/#/chat`；对话页出现用户气泡 + 助手 thinking 占位 ✅
    - 零 `pageerror`；网络资源失败为沙箱预期，未导致 JS 崩溃。
  - 沙箱无网：sendChat 会失败，已在 catch 中以 ⚠️ 错误气泡展示，不崩溃（用户本机含网时正常出回复）。
  - **第四次迭代无头验证（2026-07-18）**：
    - 无 fake 设备环境点击麦克风 → Console 输出 `[voice] onerror: not-allowed` 与 `[voice] onend | manualStop= true lastError= not-allowed` ✅（证明日志链路 + 错误分类生效）
    - 权限拒绝路径：**不再循环重启**，直接 `stopVoice` → 按钮回到默认态 `bg-bg-tertiary`（非激活）✅
    - DOM 正确显示红色提示"麦克风权限被拒绝，请在浏览器/系统设置中允许麦克风" ✅
    - 零 `pageerror` ✅
    - 有 fake 设备时点击 → 正常进入 `listening` 激活态（`bg-accent`），无崩溃 ✅
  - **第五次迭代无头验证（2026-07-18）**：麦克风按钮 `[aria-label="语音输入"]` 数量 = 0（已隐藏）；上传/发送按钮正常；零 `pageerror` ✅

### 👀 用户验收
- **结果**：待验收（语音按钮已暂时隐藏；其余交互待用户本机确认）
- **日期**：2026-07-17
- **意见**：

## 4. 闭环
- **结论**：待用户本机含网验收真实对话后回写 ✅；REQ-UI-07 的 AC3 同步标记通过。
- **遗留 / follow-up**：
  - mimo 文本模型 `supportsImages=false`，图片当前仅作附件展示、不发给模型（多模态后续迭代）。
  - 用户自接模型：在 `chatModels.ts` 的 `USER_CHAT_MODELS` 填入即出现在切换列表并作为默认；后续可接设置页 UI。
  - 语音输入依赖 Chromium 内核（Chrome / Edge），且需用户授予麦克风权限；Tauri macOS 桌面端 WKWebView 不支持 Web Speech API，当前通过浏览器 dev 预览使用，后续若需在桌面端启用需接入原生语音识别或云端 ASR。
