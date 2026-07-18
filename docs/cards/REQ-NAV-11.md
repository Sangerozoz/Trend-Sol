# REQ-NAV-11: 导航栏「对话」标签页重命名为「AI诊股」并替换为 AI 图标

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：✅ 已闭环（⬜→🔧→🧪→👀→✅；2026-07-18 用户验收通过）
- **优先级**：P1
- **提出日期**：2026-07-18
- **提出人**：用户
- **关联阶段**：Phase 1.2
- **关联卡**：REQ-NAV-05（Arco 图标）、REQ-NAV-10（选中态填充图标）、REQ-UI-10/13（AI 对话能力）

---

## 1. 需求描述

> 用户原话：「在导航栏中，将"对话"这个标签页重命名为"AI诊股"，并将该标签页的图标替换为与AI相关的图标。确保新名称和图标在导航栏中正确显示，并与现有导航项的样式保持一致。」

含义澄清：左侧 `SideNav`（`AppShell.tsx` 的 `NAV_ITEMS`）中 key=`/chat` 的项当前为 `label:"对话"` + `icon:ChatLine / iconFill:ChatFill`（对话气泡图标）。需：
- 标签文案改为「AI诊股」。
- 图标改为与 AI 相关的图标（线稿 `icon` + 实心 `iconFill` 两态），替换原对话气泡。
- 新名称与图标在 56px 导航栏正确显示，尺寸/颜色/选中态逻辑与「行情/自选股/订阅/我的」完全一致（选中态切 `iconFill` + 父级 `text-white`，未选中 `text-muted`）。

---

## 2. 验收标准（AC）

- **AC1**：`NAV_ITEMS` 中 `/chat` 项 `label` 变为「AI诊股」，导航栏该标签显示「AI诊股」（非「对话」）。
- **AC2**：该标签图标为 AI 相关图标（非原对话气泡）；提供 `icon`（线稿）与 `iconFill`（实心）两态，与现有图标组件接口一致（`className`/`strokeWidth` 透传、`1em`/`currentColor`）。
- **AC3**：选中态（当前路由 `/chat`）使用 `iconFill` 实心变体，未选中使用 `icon` 线稿，与相邻导航项选中逻辑一致。
- **AC4**：图标尺寸（text-lg 18px）与相邻导航项一致，无布局位移；标签文字 `text-[10px]` 与其他项风格一致。
- **AC5**：`tsc` 0 新增、零 `pageerror`。

---

## 3. 实施记录

### 🔧 实施中
- 新建 `components/AiIcon.tsx`：`AiLine`（机器人头线稿，`fill=none stroke=currentColor strokeWidth=2`，含天线/双眼/嘴线）、`AiFill`（机器人头实心，`fill=currentColor`，含天线圆点 + 圆角头轮廓），`1em`/`currentColor`，接口与 `ChatIcon` 一致。
- `components/AppShell.tsx`：导入改为 `import { AiLine, AiFill } from "./AiIcon"`；`NAV_ITEMS` 的 `/chat` 项 `icon: AiLine, iconFill: AiFill, label: "AI诊股"`；删除已无引用的 `components/ChatIcon.tsx`。
- `pages/ChatPage.tsx`：页内标题 `<h1>对话</h1>` 同步改为「AI诊股」，保持与导航标签一致。

### 🧪 自测（我来做）
- **方法**：dev server + 无头 Chrome，检查 `SideNav` 渲染的标签与图标（激活/非激活两态）。
- **结果（2026-07-18 无头实测，全部 PASS）**：
  - **AC1** 导航标签 = `["行情","AI诊股","自选股","订阅","我的"]`，不再有「对话」 ✅
  - **AC2** `/chat` 项图标含 `<rect>`(机器人头)+`<circle>`(天线)、不含原对话气泡 path（`21 11.5a8.38`）→ 确为 AI 图标 ✅
  - **AC3** 在 `/chat` 路由（激活）：图标用 `iconFill` 实心变体（`fill="currentColor"`、`stroke="none"`、按钮 `text-white`）✅；切到 `/` 路由（非激活）：同一项图标切回 `icon` 线稿（`fill="none"`、`stroke="currentColor"`、未选中）✅
  - **AC4** 图标渲染宽 18px 与相邻导航项(18px)一致；标签 `text-[10px]`(10px) 与其他项一致 ✅
  - **零 `pageerror`** ✅；`tsc --noEmit` 仅 `ProfilePage.tsx` 既有 2 错、0 新增。
- **证据**：预览 `http://localhost:1420/#/chat`；截图 `.workbuddy/memory/nav_aizhengu.png`。

### 👀 用户验收（通过）
- **结果**：通过
- **日期**：2026-07-18
- **意见**：用户拍板验收通过（与 REQ-UI-10 / REQ-UI-12 / REQ-NAV-12 一并通过），状态 ✅ 已闭环。

---

## 4. 闭环
- **结论**：
- **遗留 / follow-up**：
