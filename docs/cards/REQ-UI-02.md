# 需求卡 REQ-UI-02: 行情页去掉冗余标题/副标题（大盘指数 / A股 / 大盘概览副标题）

## 1. 背景与描述
- **来源**：用户反馈（2026-07-15）。
- **问题**：行情页「大盘概览」模块内文字层级冗余——
  1. 卡片内「大盘指数」小标题不必要；
  2. A股 卡片行上方的「A股」小标题不必要；
  3. 顶部「大盘概览」标题后的副标题「指数 · 成交额 · 涨跌停」不必要。
- **目标**：去掉这三类冗余文字，让信息密度更干净，靠卡片本身与留白分组，而非靠小标题堆砌。

## 2. 验收标准（Acceptance Criteria）
- [ ] AC1：「大盘概览」卡片内 `<SubHeader title="大盘指数">` 已移除，A股 卡片行直接呈现。
- [ ] AC2：A股 卡片行上方「A股」文字标签已移除（保留 A股 卡片本身与横向滑动）。
- [ ] AC3：「大盘概览」`SectionHeader` 的 `subtitle="指数 · 成交额 · 涨跌停"` 已移除，「大盘概览」主标题保留。
- [ ] AC4：布局零位移——删标题后的留白/间距由相邻容器既有 `space-y` 控制，不引入新跳动；A股交易额/涨跌停比占位子模块标题保留不动。
- [ ] AC5：tsc 无新增报错，无 `pageerror`；`SubHeader` 组件若无其他调用可保留（不强制删除）。

## 3. 实施记录
- **状态**：✅ 已闭环（2026-07-16 用户拍板验收通过）
- **日期**：2026-07-15
- **改动点**：`apps/desktop/src/pages/OverviewPage.tsx`
  - 删除 `<SubHeader title="大盘指数" />`（卡片内小标题）
  - 删除 A股 卡片行上方 `<div className="text-xs text-text-muted mb-3 tracking-wide">A股</div>`
  - `SectionHeader title="大盘概览"` 去掉 `subtitle` 传参

## 4. 自测（我来做）
- **方法**：tsc 类型检查 + 无头 Chrome 加载 localhost:1420 抓 pageerror / 确认三类文字已从 DOM 移除、A股 卡片与其他市场网格仍正常渲染。
- **结果**：✅ 通过。无头 Chrome：DOM 中无独立 `h2`「大盘指数」/「A股」节点（`standaloneHeader=false`）；正文不含「指数 · 成交额 · 涨跌停」副标题（`subtitle=false`）；A股 滑动容器仍在（1 个）、其他市场 6 槽正常；`PAGEERRORS=0`。tsc 对 OverviewPage 无新增报错；顺手删除已无调用方的 `SubHeader` 死代码（AC5 允许保留，但为干净移除）。
- **证据**：预览 URL + 上述 DOM 探测。

## 5. 用户验收
- **结果**：通过 / 打回（附意见）
- **日期**：
- **意见**：

## 6. 闭环
- **结论**：已交付 → 同步更新 `requirements.md`、`roadmap.md`。
- **遗留 / follow-up**：
