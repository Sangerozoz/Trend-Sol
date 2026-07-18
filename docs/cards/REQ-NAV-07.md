# 需求卡 REQ-NAV-07: 导航选中效果（面形白图标＋白文字，无背景；未选中保持 #666）

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：✅ 已闭环（2026-07-13 用户拍板）
  - 状态机走完 ⬜→🔧→🧪→👀→✅，无跳跃。
- **优先级**：P1
- **提出日期**：2026-07-13
- **提出人**：用户
- **关联阶段**：Phase 1.1（设计语言收口）
- **关联需求/决策**：REQ-NAV-05（图标换 Arco）；DEC-008（宽松/大留白/偏欧美）；DEC-009（文本颜色等级）

---

## 1. 需求描述
> 用户原话（两部分）：
> 1. "导航图标选中效果，为面形图标，颜色为白色，文字也是要改为白色，不要选中的背景颜色，只需要图标文字变为白色即可"
> 2. "未选中的图标文字颜色现在是什么等级，目前看偏暗，我们有简历颜色等级吗？"

- **选中态**：图标变白、文字变白；**不要选中背景色**（移除原 `bg-accent/20` 高亮块）；图标呈现"面形 / 实心"观感。
- **未选中态**：保持 `text-text-muted`（`#666666`，最暗档）。用户确认该暗度无问题（另一屏幕显示偏暗属个别显示差异，非设计问题），**不做提亮**；hover 时轻微提亮到 `text-text-secondary`（`#999999`）作交互反馈。
- **已知约束（Arco 图标库）**：4 个导航图标中**仅「自选股 IconStar」有 Fill（实心）变体 `IconStarFill`**；总览 / 订阅 / 我的 均无 Fill 变体。因此"面形"在星标上为真实心，其余三项用线形图标＋纯白＋加粗描边（`strokeWidth` 5，常态 4）近似实心观感。
  - 若用户要求 4 个统一"真·面形"，需另寻图标源（如 Lucide 实心集）或自定义 SVG —— 见验收/遗留，不在本卡默认范围。

## 2. 验收标准（Acceptance Criteria）
- [x] AC1：选中态图标与文字均为纯白 `#fff`（className 含 `text-white`），且无选中背景色（移除 `bg-accent/20` 类）。
- [x] AC2：未选中态保持 `text-text-muted`(`#666`，最暗档)，用户确认该暗度无问题、不提亮；hover 提亮到 `text-text-secondary`(`#999`)。
- [x] AC3：选中态「自选股」使用 `IconStarFill` 实心图标；其余三项选中用线形图标＋纯白（描边加粗 5 近似实心）。
- [x] AC4：dev server 编译无报错、浏览器无 `pageerror`、`#root` 正常渲染（无头浏览器验证）。
- [x] AC5：`requirements.md` 新增 REQ-NAV-07 一行且状态随流程回写；本卡状态最终闭环。

## 3. 实施记录
### 🔧 实施中
- 2026-07-13：编辑 `apps/desktop/src/components/AppShell.tsx` 的 `SideNav` 与 `NAV_ITEMS`：
  - 导入新增 `IconStarFill`；`NAV_ITEMS` 自选股项加 `iconFill: IconStarFill`。
  - 选中态：`text-accent bg-accent/20` → `text-white`（无背景）。
  - 未选中态：保持 `text-text-muted`（`#666`）；hover 由 `text-text-muted` → `text-text-secondary`（`#999`，轻微提亮反馈）。
  - 图标渲染：选中且有 `iconFill` 时用实心变体；统一加 `strokeWidth={active ? 5 : 4}` 近似面形。

### 🧪 自测（我来做）
- **方法**：vite dev server（localhost:1420）运行下，用系统 Chrome 无头（puppeteer-core）按 **哈希路由**（`/#/`、`/#/watchlist`、`/#/subscription`、`/#/profile`）逐页加载，抓 `pageerror`/`console.error`，并 `page.evaluate` 读每个导航按钮的计算色、背景、svg 描边宽度与内部实心路径。
- **结果**：通过。
- **证据**：
  - 选中态（当前路由对应项）：`btnColor = rgb(255,255,255)`（纯白）、`hasBg = false`（无选中背景色）→ AC1 ✅
  - 未选中态（其余三项）：`btnColor = rgb(102,102,102)`（= `#666` = text-muted，保持最暗档；用户确认无问题不提亮）→ AC2 ✅
  - 激活项 `strokeWidth = 5`（常态 4，加粗近似面形）；其中「自选股」激活时 `innerHasFill = true`（svg 内部含 `fill="currentColor"` 实心路径 = `IconStarFill`）→ AC3 ✅；总览/订阅/我的 无 Fill 变体，按预期用线形＋纯白＋加粗。
  - 四路由切换时选中项正确跟随（总览/自选股/订阅/我的 各自高亮），无错乱。
  - 控制台错误仅 1 条 `404`（favicon.ico，已知无害），**无 pageerror** → AC4 ✅
  - 逐项 AC：AC1✅ AC2✅ AC3✅ AC4✅

### 👀 用户验收
- 2026-07-13：用户拍板。确认未选中导航保持 `text-text-muted`(`#666`) 无问题（另一屏幕显示偏暗为个别显示差异），维持最暗档；选中态纯白无背景符合预期。本卡闭环。

### 👀 用户验收
- 待用户验收（预览地址：http://localhost:1420/ ，点击左侧导航切换四项观察选中效果）

## 4. 闭环
- **状态**：✅ 已闭环（2026-07-13）
- **最终决策**：
  - 选中态：图标＋文字纯白 `text-white`，无选中背景（`bg-transparent`）；「自选股」用 `IconStarFill` 实心，其余线形＋描边加粗(5) 近似面形。
  - 未选中态：保持 `text-text-muted`(`#666666`，最暗档)，用户确认无问题、不提亮；hover 轻微提亮到 `text-text-secondary`(`#999`)。
  - 4 项统一"真·实心"图标未要求（Arco 仅星标有 Fill），采用当前线形＋加粗近似方案，已接受。
- **回写**：`requirements.md` 状态 → ✅；`roadmap.md` Phase 1.1 标记完成。
