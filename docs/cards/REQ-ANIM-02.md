# 需求卡 REQ-ANIM-02: 顶栏三大指数数值变动去除脉冲动画

## 1. 背景与描述
- **来源**：用户反馈（2026-07-15）。
- **问题**：顶栏「上证 / 深证 / 创业板」三大指数接入真实数据（REQ-NAV-09）后，价格/涨跌数值每次变化都会触发 `useValuePulse` 的"跳动"脉冲（scale 1.12→1），用户觉得顶栏数值变动不该有动画。
- **目标**：去掉顶栏三大指数数值变化的脉冲动画；仅保留行情页 A股 卡片（REQ-ANIM-01）的脉冲，顶栏保持静态数值（其余 GSAP 入场级联动画保留）。

## 2. 验收标准（Acceptance Criteria）
- [ ] AC1：顶栏三大指数（上证/深证/创业板）的 price 数值变化时**不再**有 scale 脉冲动画。
- [ ] AC2：顶栏涨跌百分比数值随数据更新正常变化（仅去动画、不去数值更新），红涨绿跌着色保留。
- [ ] AC3：布局零位移——去掉动画后价格列宽度、对齐、骨架占位不受影响（不违反 REQ-UI-01）。
- [ ] AC4：行情页 A股 卡片的 `useValuePulse` 脉冲不受影响（仅顶栏去掉）。
- [ ] AC5：移除 `AppShell.tsx` 中 `TopIndex` 的 `useValuePulse` 调用与 `priceRef`/`useRef` 引用、以及不再使用的 `useValuePulse` import；tsc 无新增报错，无 `pageerror`。

## 3. 实施记录
- **状态**：✅ 已闭环（2026-07-15 用户验收通过）
- **日期**：2026-07-15
- **改动点**：
  - `apps/desktop/src/components/AppShell.tsx`：
    - 删除 `import { useValuePulse } from "../lib/gsap";`
    - 删除 `import { useRef } from "react";`（仅 TopIndex 的 priceRef 用到，移除后该 import 不再需要）
    - `TopIndex`：删除 `const priceRef = useRef<HTMLSpanElement>(null);` 与 `useValuePulse(priceRef, idx?.price);`
    - 价格 `<span ref={priceRef}>` 去掉 `ref={priceRef}`
  - `OverviewPage.tsx` 的 A股 `IndexCard` 脉冲保持不动（仅顶栏去动画）

## 4. 自测（我来做）
- **方法**：tsc 类型检查 + 无头 Chrome 加载 localhost:1420 抓 pageerror / 检查顶栏价格 span 无 gsap 绑定（DOM 无 transform 动画残留）。
- **结果**：✅ 通过。无头 Chrome：顶栏三大指数（上证3961.69/深证14880.11/创业板3845.90）价格 span `transform: none`、`gsapClean: true`（无脉冲内联样式）；`PAGEERRORS=0`；数值仍随数据更新（去动画不去数值）。tsc 对 AppShell 无 `useRef`/`useValuePulse` 报错（已移除 import 与调用）。
- **证据**：预览 URL + 上述 DOM transform 测量。

## 5. 用户验收
- **结果**：✅ 通过（2026-07-15）
- **日期**：2026-07-15
- **意见**：顶栏三大指数数值变动不再有脉冲动画，符合预期。

## 6. 闭环
- **结论**：已交付 → 同步更新 `requirements.md`、`roadmap.md`。
- **遗留 / follow-up**：
