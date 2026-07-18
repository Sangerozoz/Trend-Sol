# 需求卡 REQ-ANIM-01: 引入 GSAP 动画库并加入适当动效

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：✅ 已闭环（2026-07-15 用户拍板验收通过）
- **优先级**：P2
- **提出日期**：2026-07-15
- **提出人**：用户
- **关联阶段**：Phase 1.x（体验层，不新增数据采集逻辑）
- **关联决策**：DEC-008（宽松·大间距·大圆角·大留白）、DEC-009（颜色三档）、REQ-UI-01（布局稳定性）

---

## 1. 需求描述
> 用户原话：「https://github.com/greensock/gsap-skills 这是gsap的动画库，我们引用进来。然后再适当的地方加入动画」

- 用户给的链接 `greensock/gsap-skills` **不是 GSAP 库本身**，而是 GreenSock 官方出的 **AI Skills 集合**（SKILL.md + 示例，教 agent 正确使用 GSAP）。真正要 import 进项目的是 npm 包 `gsap`（已 100% 免费、含全部插件，无需 auth token）。本卡按"引入 GSAP 库 + 在合适的页面加动画"落地。
- 已安装：`gsap@3.15.0` + `@gsap/react@2.1.2`（pnpm，desktop 包）。
- "适当的地方"我的判断（与 DEC-008/009/REQ-UI-01 一致）：
  1. **行情页入场动画**：左栏三大区块 + 右栏三区块按顺序 stagger 淡入上浮；A股 5 张大卡片 + 其他市场 6 个文字槽依次浮现（顶部→底部级联）。
  2. **数值跳动脉冲（股票"活"的感觉）**：A股 大卡片价格、顶栏三大指数价格，在每 4 秒刷新拿到新值且值变化时，做一次**轻微 scale 脉冲**（仅 transform/opacity，不影响布局）。
  3. **约束**：只动 transform/opacity（性能最优，符合 gsap-performance）；入场动画用 `useGSAP` + `scope` 自动清理；动画前后**布局零位移**（不违反 REQ-UI-01）；尊重系统 `prefers-reduced-motion`。

## 2. 验收标准（Acceptance Criteria）
- [ ] AC1：项目已引入 `gsap` 与 `@gsap/react`（package.json 依赖 + 可 import，无构建错误）。
- [ ] AC2：行情页首屏入场时，左栏/右栏区块与 A股 卡片呈现**有序的淡入上浮（stagger）**，非全部瞬间出现；动画结束后布局与无动画时**完全一致（零位移）**。
- [ ] AC3：A股 大卡片价格、顶栏三大指数价格，在刷新拿到**新数值（且值变化）**时呈现一次轻微脉冲（缩放/透明度），加载首帧与值不变时不脉冲；脉冲不引起布局跳动。
- [ ] AC4：仅使用 transform/opacity 做动画；无 `pageerror`；遵循 DEC-008/009 视觉基调（克制、不花哨）。
- [ ] AC5：系统开启"减少动态效果"时动画自动跳过，内容直接可见。
- [ ] AC6：本卡最终闭环，回写 `requirements.md` 与 `roadmap.md`。

## 3. 实施记录
### 🔧 实施中
- 安装：`pnpm add -F desktop gsap @gsap/react`（gsap@3.15.0 + @gsap/react@2.1.2）。注意 pnpm store 目录与现有 node_modules 不一致，需 `--store-dir /Users/sanger/WorkBuddy/2026-07-01-11-51-31/.pnpm-store/v11`。
- 新增 `apps/desktop/src/lib/gsap.ts`：集中 `gsap.registerPlugin(useGSAP)`；导出 `useValuePulse(ref, value)` 钩子（数值变化时 `scale 1.12→1` 轻微脉冲，仅 transform/opacity，首帧与值不变不触发）；导出 `prefersReducedMotion` 守卫（系统开启"减少动态"时跳过装饰动画）。
- `OverviewPage.tsx`：
  - 页面根加 `ref={rootRef}`，`useGSAP(() => gsap.from(".ov-anim", { y:18, autoAlpha:0, duration:0.5, ease:"power2.out", stagger:0.06 }), { scope: rootRef })` 做入场级联。
  - 标记 `ov-anim`（结构稳定，渲染数量=定义数，不引起布局位移）：A股 5 张大卡片 + 其他市场 6 个文字槽 + 热门/消息热点/自选/持仓/盯盘 共 16 个。
  - `IndexCard` 价格行加 `ref` + `useValuePulse`（每 4 秒刷新拿到新值且变化时脉冲）。
  - `PlaceholderSection` / `SidePlaceholder` 增加可选 `className` 以挂 `ov-anim`。
- `AppShell.tsx`：`TopGlobalBar` 抽出 `TopIndex` 子组件（价格 `ref` + `useValuePulse`），顶栏三大指数价格变化时脉冲。

### 🧪 自测（我来做）
- **类型检查**：`tsc --noEmit` 对 `OverviewPage.tsx` / `AppShell.tsx` / `lib/gsap.ts` 无新增报错（仅 `ProfilePage.tsx` 两个历史预存错误无关）。
- **Vite 转译**：`lib/gsap.ts`、`AppShell.tsx`、`OverviewPage.tsx` 均返回 `HTTP 200` 无 transform 错误；标记确认进入产物（`ov-anim` / `useGSAP` / `TopIndex` / `useValuePulse` / `prefers-reduced-motion`）；`gsap` 已被 Vite 预打包（`.vite/deps/gsap.js`）。
- **真实无头 Chrome 渲染（关键证据）**：加载 `localhost:1420` 后采样 ——
  - `EARLY(250ms)`：`.ov-anim` 计数 = 16，opacity `0 → 0.08`（GSAP `from` 入场正在执行）。
  - `LATE(2750ms)`：`.ov-anim` 计数 = 16（结构数量恒定，零位移），opacity 全部 = 1（已稳定落定）。
  - `pageErrors = 0`，控制台无非网络类报错；body 正常渲染。
  - 结论：入场动画生效、布局零位移、无运行时崩溃。
- **未能在沙箱验证的部分**：数值脉冲依赖真实数据（每 4 秒刷新拿到新值），沙箱无外网 → 走骨架兜底，脉冲不触发；该路径在本机（有网）刷新即可见。

### 👀 用户验收
- **结果**：✅ 通过
- **日期**：2026-07-15
- **意见**：用户拍板验收通过（行情页入场级联 + 价格脉冲动效保留，尊重 reduced-motion）。

## 4. 闭环
- **结论**：✅ 已闭环（2026-07-15 用户拍板）。已回写 `requirements.md` 状态为 ✅ 已交付、`roadmap.md` 实施记录标记闭环。
- **遗留 / follow-up**：
