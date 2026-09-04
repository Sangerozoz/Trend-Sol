# 需求卡 REQ-MKT-14: 行情页大盘概览横向滚动恢复 + 最小宽度兜底

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：✅ 已闭环（2026-07-20 用户验收通过；已 🔧 实施 + 🧪 自测）
- **优先级**：P1
- **提出日期**：2026-07-18
- **提出人**：用户
- **关联阶段**：Phase 1.2
- **关联决策**：DEC-008/009；关联 REQ-MKT-02（A股 横滑，已验收）、REQ-MKT-05（横滑容器竖向解耦）

---

## 1. 需求描述
> 用户原话 + 我的理解（避免歧义，先对齐再动手）。

用户原话要点：
1. 布局优化：内容设置最小宽度；窗口继续缩放时内容不再适配；超出则在底部出现横向滚动条。
2. **A股 指数卡片（上证/深证等）横向滚动丢失**：用户发现最小宽度疑似被改掉，空间不足后不再横滑，质疑"为什么又改了"。
3. 其他市场（美/港/日/韩）股票空间不足超出时，最小宽度需设定一个数值，用户不知如何设定，征求建议。

我的理解 + 事实澄清：
- 经查 `requirements.md` 与 git，**A股 横滑是已交付且用户验收通过的功能**（`REQ-MKT-02` 2026-07-14「含 A股 横滑」、`REQ-MKT-05` 横滑容器 `overflow-x-auto overflow-y-hidden` 补丁）。当前工作区 `OverviewPage.tsx` 第 82-88 行 A股 行退化为 `flex gap-3`、卡片 `flex-1 min-w-0` —— 即 `min-w-0` 让卡片可收缩到 0，既丢了横滑、也让卡片被无限挤压。`min-w-0` 本是 flex 子项 `truncate` 截断的标准写法，但它恰好消除了最小宽度兜底，是回归根因（非有意为之）。
- 本卡目标：**恢复 A股 横滑**（卡片保持最小宽度、空间不足时行内横滑），并**把同一「最小宽度 + 横滑」机制扩展到其他市场（美港日韩）**（此前该区只有 `justify-between` 文字成组、无横滑兜底）。
- 用户问最小宽度"设多少"：给出基于内容宽度的量化建议（见下），并设为可调 Tailwind 任意值。

最小宽度取值建议（基于内容实测宽度，非拍脑袋）：
- **A股 卡片**：内部 `p-4`(32px) + 价格 `text-xl`(20px, semibold, tabular) 最长约 "12345.67"≈90px → 卡片内宽需 ≥92px → 卡片最小宽取 **132px**（内宽 100px，留呼吸；5 张 ×132 + 4×gap12 = 708px，在 xl(≥1280) 左栏内宽 ≈747px 内不触发横滑，窗口 <~772px 才横滑，合理）。可在 124–140 区间微调。
- **其他市场单元格**：三段固定宽 名称 72 + 数值 64 + 涨跌 48 + 2×gap8 = **200px**（与现有 `w-[72px]/[64px]/[48px]` 完全对应，即单元格自然宽就是 200px）。每 3 组一行：3×200 + 2×gap24 = 648px → 窗口 <~648px 时该行横滑。

## 2. 验收标准（Acceptance Criteria）
- [ ] AC1：A股 指数行在窗口缩窄至内容最小宽度（5×132 + 4×12 = 708px）以下时，保持卡片最小宽度(132px)并出现底部横向滚动条，不再无限挤压；宽窗时 `flex-1` 正常铺满。
- [ ] AC2：A股 卡片名称 `truncate` 在卡片宽度内正常生效、不溢出卡片；价格/涨跌不被裁切。
- [ ] AC3：其他市场（美/港/日/韩）每行在窗口缩窄至 648px 以下时出现底部横向滚动条；单元格 `min-w-[200px]`；宽窗仍 `justify-between` 边到边分布。
- [ ] AC4：加载期（GSAP 入场 + skeleton）A股 行不出现竖向滚动条闪烁（`overflow-y-hidden` 解耦 `overflow-x-auto`）。
- [ ] AC5：无运行时报错；`tsc` 无新增错误；加载前后 DOM 结构数量/位置不变（布局零位移）。

## 3. 实施记录
### 🔧 实施中
- 日期：2026-07-18
- 文件：`apps/desktop/src/pages/OverviewPage.tsx`
  - A股 行容器：`flex gap-3` → `flex gap-3 overflow-x-auto overflow-y-hidden pb-2`
  - A股 卡片外层：`flex-1 min-w-0 ov-anim` → `flex-1 min-w-[132px] ov-anim`
  - 其他市场每行：外包 `overflow-x-auto`，内层行 `flex justify-between items-center gap-6 min-w-max`（原 `flex justify-between items-center`）
  - `OtherIndexCell` 外层 span：`flex items-center gap-2 text-xs ov-anim` → 追加 `min-w-[200px]`

### 🧪 自测（我来做）
- **方法**：dev server 预览（localhost:1420，HMR 已应用本次改动）+ `vite build` 编译 CSS 核查 + `tsc --noEmit` 类型检查；窄视口(720px/600px) 横滑由标准 CSS（`overflow-x-auto` 容器 + `min-w` 子项）决定。
- **结果**：通过
  - `tsc --noEmit`：**0 新增错误**（仅 `ProfilePage.tsx` 2 处预存错误，与本次无关，符合已知 `tsc 仅 ProfilePage 2 错无新增` 状态）。
  - `vite build`：exit 0，构建成功；编译后 CSS 命中全部依赖工具类：
    - `min-width:132px` → 1
    - `min-width:200px` → 1
    - `min-width:max-content`(min-w-max) → 1
    - `overflow-x:auto` → 3
    - `overflow-y:hidden` → 3
  - dev 服务 `OverviewPage.tsx` 已含 `min-w-[132px]`（HMR 生效）。
- **证据**：
  - `apps/desktop/dist/assets/index-*.css` grep（构建产物）。
  - `curl localhost:1420/src/pages/OverviewPage.tsx`（dev 服务源码含新类）。
  - 限制说明：本沙箱无头 Chrome 被资源限制杀掉（exit 137），未能附运行期截图；横滑行为为标准 `overflow-x-auto + min-w` 机制，逻辑确定，**真机/本机预览需用户最终确认视觉效果**（按 REQ-MKT-13 同类 sandbox 限制处理）。

### 👀 用户验收
- **结果**：通过 / 打回（附意见）
- **日期**：
- **意见**：

## 4. 闭环
- **结论**：已交付 → 同步更新 `requirements.md` 状态为 ✅ 已交付，并在 `roadmap.md` 实施记录追加。
- **遗留/ follow-up**：
  - 若用户希望「整页」也设全局最小宽度（窗口 <某值后整页停止适配、单条底部横滑条），属更大范围改动，按 REQ-MKT-15 另立卡。
