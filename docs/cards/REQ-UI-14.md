# REQ-UI-14: 发送队列条目样式与置顶交互调整

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：✅ 已闭环（👀 用户验收通过；2026-07-18 打回整改后再交付，用户确认"都通过了"）
- **优先级**：P1
- **提出日期**：2026-07-18
- **提出人**：用户
- **关联阶段**：Phase 1.2
- **关联卡**：REQ-UI-13（发送队列基础能力）

---

## 1. 需求描述

> 用户原话：「1. 发送队列（1）保持不变，但移除"任务完成后自动发送"的文字说明。2. 队列中每一条目的样式调整：文字内容限制为单行显示，超出部分使用省略号截断；置顶功能修正：置顶并非固定在顶部，而是点击后将该条目移动到队列的第一个位置，支持多次点击，可对多个条目反复置顶以调整排序；编辑和删除图标样式与功能均无问题保持不变；三个功能图标（置顶、编辑、删除）应横向并排排列在同一行，左右分布，而非纵向上下排列；图标尺寸和间距需要合理控制，保持与整体页面宽松风格一致。」

含义澄清：在 REQ-UI-13 已交付的发送队列基础上做样式与交互微调：
- 表头去掉「· 任务完成后自动发送」冗余说明，仅保留「发送队列（N）」。
- 每条目内容从「最多 2 行」改为**单行**，超出省略号截断。
- 「置顶」语义修正：原实现是 `pinned` 布尔 + `pinned` 优先排序（固定顶部 + 高亮）；改为**点击后把该条目移动到队列第一个位置**（真正重排），支持对多个条目反复点击置顶以手动调整发送顺序（后点击的排更前）。
- 编辑 / 删除图标样式功能不变。
- 三个图标从纵向堆叠改为**横向同一行排列**，尺寸与间距控制得当、与页面宽松风格一致。

---

## 2. 验收标准（AC）

- **AC1**：队列表头仅显示「发送队列（N）」，不再出现「任务完成后自动发送」字样。
- **AC2**：条目内容单行显示，文本超出容器宽度时以省略号（…）截断，不换行、不出现 2 行高度。
- **AC3**：点击某条目的「置顶」→ 该条目移动到队列**第一个位置**（队首）；已在队首时点击无变化（no-op）。
- **AC4**：可对**多个**条目反复点击「置顶」调整顺序——后点击的条目排在更前面（顺序为点击的逆序），队列顺序与显示顺序一致（队首 = 下一个自动发送的条目）。
- **AC5**：置顶 / 编辑 / 删除三个图标在**同一行横向排列**（非纵向堆叠），尺寸合理、间距宽松，与整体风格一致；编辑、删除功能与样式不变。
- **AC6**：移除 `pinned` 高亮样式后，所有条目外观统一（无 pinned 专属边框/底色）；`tsc` 0 新增、零 `pageerror`。

---

## 3. 实施记录

### 🔧 实施中
- `store/chatStore.ts`：
  - `QueuedMessage` 接口移除 `pinned: boolean`；删除 `sortQueue`（pinned 优先排序）辅助函数。
  - `enqueue`：改为追加到队尾（`set((s) => ({ queue: [...s.queue, item] }))`），不再按 pinned/createdAt 排序；新建条目不再带 `pinned`。
  - `togglePinQueue(id)`：语义从「切换 pinned 布尔」改为「**移动到队首**」——`findIndex` 取出该条目 `unshift` 到数组头部；`idx <= 0`（已在队首/不存在）直接返回 no-op；支持多次点击调序。
- `components/chat/ChatComposer.tsx` 队列面板：
  - 表头文案 `"发送队列（{queue.length}）· 任务完成后自动发送"` → `"发送队列（{queue.length}）"`。
  - 条目容器去掉 `item.pinned` 条件高亮，统一 `border-border-default bg-bg-tertiary`。
  - 内容 `div`：`text-xs text-text-primary leading-4 max-h-8 overflow-hidden break-words whitespace-pre-wrap` → `text-xs text-text-primary truncate`（单行省略）。
  - 三图标容器：`flex flex-col gap-1.5` → `flex items-center gap-2.5`，横向同排；各图标按钮加 `p-1` 宽松点击区。
  - 置顶按钮：去掉 `item.pinned` 条件样式，`title`/`aria-label` 固定「置顶」。
- **2026-07-18 打回整改（置顶图标换官方资产）**：内联 `PinIcon` 删除，改用 `src/components/TrendSolIcon.tsx` 的官方 `ToTopIcon`（源自桌面 `trendsol-icon/去顶部_to-top.svg`，viewBox 0 0 48 48、`#333`→`currentColor`、跟随父级 1em）；队列面板置顶按钮改用 `<ToTopIcon className="w-3.5 h-3.5" />`，其余样式/功能不变。

### 🧪 自测（我来做）
- **方法**：dev server + 无头 Chrome（puppeteer-core），经 `localStorage['trend-iq-chat']` 注入 3 条队列项（含 1 条超长文本），验证表头文案、单行省略、置顶重排、图标横排、零 pageerror。
- **结果（2026-07-18 无头实测，全部 PASS）**：
  - **AC1** 表头文本 = `"发送队列（3）"`，不含「任务完成后自动发送」 ✅
  - **AC2** 条目内容 `white-space:nowrap` + `text-overflow:ellipsis`，`scrollWidth 1308 > clientWidth 542`（横向溢出被省略），高度 16px 单行（非两行） ✅
  - **AC3** 点击「队列消息二」的置顶 → 顺序变为 `[二, 一, 三]`，二移到队首 ✅
  - **AC4** 再点「队列消息三」置顶 → 顺序 `[三, 二, 一]`，多条目反复置顶按点击逆序调序 ✅；已在队首再点同一项 = no-op ✅
  - **AC5** 三图标 `top` 同为 281、left 660/692/724 递增 → 横向同一行排列 ✅
  - **AC6** 条目容器不再含 `border-accent/50` / `bg-accent/5`（无 pinned 高亮），外观统一 ✅
  - **零 `pageerror`** ✅；`tsc --noEmit` 仅 `ProfilePage.tsx` 既有 2 错、0 新增。
- **2026-07-18 打回整改后复测（无头 Chrome）**：AI 诊股页注入 1 条队列项，置顶按钮 `<svg>` 实测 `path` 数量 = 3、`viewBox="0 0 48 48"`、`stroke="currentColor"` → 已替换为官方 `去顶部_to-top` 线稿资产（原 `PinIcon` 为 2 path / viewBox 0 0 24 24）✅；零 `pageerror`（仅 sandbox 东财 CORS 网络错误）。证据：`.workbuddy/memory/queue_chat.png`。
- **证据**：预览 `http://localhost:1420/#/chat`；截图 `.workbuddy/memory/queue_style.png`、`.workbuddy/memory/queue_chat.png`。

### 👀 用户验收（打回 → 整改 → 再交付 → 通过）
- **结果**：初轮未通过（打回）；2026-07-18 用户给出详细意见——「置顶的图标需要更换，提供桌面 trendsol-icon 文件夹内 去顶部_to-top」。
- **日期**：2026-07-18
- **整改**：内联 `PinIcon` 替换为官方 `去顶部_to-top` 资产（`src/components/TrendSolIcon.tsx` 的 `ToTopIcon`），队列面板置顶按钮改用 `<ToTopIcon className="w-3.5 h-3.5" />`，移除 `PinIcon` 定义；重新自测全过，现再次 👀 待用户验收。
- **2026-07-18（末）验收通过**：用户确认「都通过了」，REQ-UI-14 闭环 ✅。

---

## 4. 闭环
- **结论**：2026-07-18 末用户确认「都通过了」，REQ-UI-14 闭环 ✅。置顶图标已从内联 `PinIcon` 替换为官方 `去顶部_to-top` 资产；其余样式/交互（表头去冗余文案、单行省略、移动到队首多次调序、三图标横排宽松）均经无头复测通过。
- **遗留 / follow-up**：
