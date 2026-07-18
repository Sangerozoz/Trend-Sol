# 需求卡 REQ-NAV-10: 左侧导航「订阅」「我的」选中态使用填充(实心)图标

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：✅ 已闭环（2026-07-16 用户拍板验收通过）
- **优先级**：P2
- **提出日期**：2026-07-15
- **提出人**：用户
- **关联阶段**：Phase 1.2
- **关联决策**：DEC-008/009（设计 token / 图标规范）

---

## 1. 需求描述
> 用户原话：「左侧导航 订阅和我的 两个图标在选中时没有使用填充效果的图标，需要修复」

**理解**：
- 左侧 56px 图标导航（`SideNav`）的 `NAV_ITEMS` 中，「订阅」(`/subscription`) 与「我的」(`/profile`) 两项只配了线形 `icon`（Arco `IconSubscribe` / `IconUser`），未配 `iconFill`。
- 当前选中逻辑：`active && item.iconFill ? item.iconFill : item.icon` —— 因这两项无 `iconFill`，选中时 fallback 回线形图标并以 `text-white` + 加粗描边(strokeWidth 5) 近似，没有真正的填充(实心)效果。
- 对比已正常的两项：行情(`StockMarketFill` 自定义实心) / 自选股(`IconStarFill` 实心) 选中态均为填充图标。
- 修复目标：为「订阅」「我的」补上 `iconFill`（复用各自 Arco 线形图标的 path，`fill="currentColor"` 实心化），使选中态与其它两项一致使用填充图标。

## 2. 验收标准（Acceptance Criteria）
- [ ] AC1：导航到「订阅」页时，订阅图标渲染为填充(实心)版本（非线形 + 加粗描边近似）。
- [ ] AC2：导航到「我的」页时，我的图标渲染为填充(实心)版本。
- [ ] AC3：未选中时，「订阅」「我的」仍显示原有线形图标（外观不回退）。
- [ ] AC4：填充图标沿用 currentColor，跟随选中态 `text-white`，无多余描边；与行情/自选股的填充观感一致。
- [ ] AC5：tsc 无新增类型错误；无头浏览器加载 localhost:1420 零 `pageerror`；布局零位移（仅图标填充态变化，不改 nav 结构/尺寸）。

## 3. 实施记录
### 🔧 实施中
- 日期：2026-07-15
- 新增 `apps/desktop/src/components/NavIcons.tsx`：`SubscribeFill` / `UserFill`（复用 Arco `IconSubscribe` / `IconUser` 的原始 path，viewBox `0 0 48 48`，`fill="currentColor"` 实心化；尺寸 `1em` 跟随 `text-lg`）。
- `AppShell.tsx` 的 `NAV_ITEMS`：`订阅` 项补 `iconFill: SubscribeFill`、`我的` 项补 `iconFill: UserFill`；更新"Arco 仅 IconStar 有 Fill"误导向注释。

### 🧪 自测（我来做）
- **方法**：tsc 类型检查 + 无头 Chrome（系统 Chrome + 托管 workspace puppeteer-core）加载 localhost:1420，分别路由到 `/subscription` 与 `/profile`，断言对应 nav `<button[title]>` 内的 `<svg>` 为填充版本（`fill="currentColor"` 实心、path 与自定义填充组件一致），并校验 4 个 nav 按钮均渲染 svg、仅当前路由项高亮。
- **结果**：通过（PASS）
- **证据**：
  - tsc：`pnpm --filter desktop typecheck` 仅 `ProfilePage.tsx` 既有 2 错（与历史一致），本次改动无新增类型错误。
  - 无头 Chrome：`订阅` 页 active 项 svg `fill=currentColor`、path 起 `M9 7v34.667a`（SubscribeFill）、无 circle；`我的` 页 active 项 svg `fill=currentColor`、`hasCircle=true`、path 起 `M7 37c0-4.97`（UserFill）；4 按钮均含 svg；`/subscription` 下仅「订阅」高亮（行情/自选股/我的 均 inactive）→ AC1/AC2/AC3/AC4/AC5 全过。
  - JS 运行时零 `pageerror`（仅 12 个 `Failed to load resource` 500/404，为沙箱无外网数据代理失败，预期、非 JS 异常）。
  - 测试脚本：`/tmp/test_nav_fill.cjs`。

### 👀 用户验收
- **结果**：通过 / 打回（附意见）
- **日期**：
- **意见**：

## 4. 闭环
- **结论**：待用户拍板后回写 requirements.md / roadmap.md。
- **遗留/ follow-up**：
