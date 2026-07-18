# 需求卡 REQ-MKT-05: 修复 A股 横向滚动容器加载时右侧竖向滚动条闪烁

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：⬜ 待实施 → 🔧 实施中 → 🧪 自测中 → 👀 待用户验收 → ✅ 已闭环（打回则回到 🔧）
- **当前状态**：✅ 已闭环（2026-07-15 用户拍板验收通过）
- **优先级**：P2
- **提出日期**：2026-07-15
- **提出人**：用户
- **关联阶段**：Phase 1.2
- **关联决策**：DEC-008、DEC-009、REQ-UI-01
- **关联需求**：REQ-ANIM-01（入场动画）、REQ-MKT-02（A股 横滑容器）

---

## 1. 需求描述
> 用户原话：*"大盘指数 A股 这个部分，在加载的时候右侧有一个上下的滚动条样式，加载完成后就消失了，只在加载时出现了，准确说是在占位卡片出现前。"*

现象：A股 大盘指数卡片行在**加载/入场动画期间**，容器右侧短暂出现一条**竖向滚动条**，动画结束（占位卡片淡入完成）后消失。

## 2. 验收标准（Acceptance Criteria）
- [ ] AC1：A股 横向滚动容器在任何状态下（加载中/入场动画/数据就绪）**不显示竖向滚动条**；横向滑动能力保留。
- [ ] AC2：根因修复——显式固定 `overflow-y`（与 `overflow-x-auto` 解耦），消除 CSS "visible+auto ⇒ 另一轴 compute 为 auto" 的副作用。
- [ ] AC3：入场动画（GSAP `gsap.from` y:18 淡入）行为不变、视觉不突兀（18px 下移在底部裁切，因同时 opacity 0→1 不可见）；无 `pageerror`。
- [ ] AC4：仅改 A股 容器 `overflow` 相关类，不影响其他模块；tsc 无新增报错。

## 3. 实施记录
### 🔧 实施中
- 2026-07-15：建卡。定位根因为 `flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory` 容器：`overflow-x:auto` + `overflow-y:visible` 触发 CSS 规则使 `overflow-y` 计算为 `auto`；REQ-ANIM-01 入场 `gsap.from({y:18})` 把卡片下移 18px 超出容器内边距 → 竖向滚动条在入场期间出现。修复：在容器补充 `overflow-y-hidden`（显式固定竖向为 hidden），保留 `overflow-x-auto` 横向滑动。

### 🧪 自测（我来做）
- **方法**：tsc 类型检查 + 无头 Chrome 加载 localhost:1420，校验 A股 容器 `overflowY` 计算值、入场期(250ms)与落定后(2750ms)均无竖向滚动条、无 `pageerror`。
- **结果**：✅ 通过
- **证据**：无头 Chrome（localhost:1420）两次探针——
  - 入场期 `entrance(250ms)`：`overflowX="auto"`、`overflowY="hidden"`、`verticalScrollbar=false`、`clientW=630 == offsetW=630`、`scrollW=798`（横向内容溢出 → 横滑能力保留）。
  - 落定期 `settled(2750ms)`：同上，`verticalScrollbar=false`。
  - `PAGEERRORS=0`。结论：竖向滚动条在加载/入场全程不再出现，横向滑动保留。
  - tsc 对 OverviewPage 无新增报错（仅 ProfilePage 两预存错误无关）。

### 👀 用户验收
- **结果**：✅ 通过
- **日期**：2026-07-15
- **意见**：用户拍板验收通过（A股 横滑容器加载期竖向滚动条已消除，横向滑动保留）。

## 4. 闭环
- **结论**：✅ 已闭环（2026-07-15 用户拍板）。已同步更新 `requirements.md` 状态为 ✅ 已交付、`roadmap.md` 状态行标记闭环。
- **遗留 / follow-up**：
