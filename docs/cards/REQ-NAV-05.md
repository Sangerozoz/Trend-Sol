# 需求卡 REQ-NAV-05: 左侧导航图标替换为 Arco Design 图标库

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

> 本模板复制为 `docs/cards/REQ-NAV-05.md` 使用。每张卡是单一需求从提出到闭环的完整记录。

- **状态**：✅ 已闭环
  - ⚠️ 状态机**不可跳跃**：必须先到 🧪 自测中并留证据，才能进 👀 待用户验收；✅ 必须由用户拍板。
- **优先级**：P1
- **提出日期**：2026-07-13
- **提出人**：用户
- **关联阶段**：Phase 1.1（信息架构收尾 / UI 一致性）
- **关联决策**：REQ-UI-05（Arco 仅用于图标/表格/弹窗/表单/日期选择器）

---

## 1. 需求描述
> 用户原话："需求将左侧导航的图标替换成 arco design 的图标库，对应的图标"

当前左侧导航（`AppShell.tsx` 的 `SideNav`）使用 emoji 字符串作为图标：
- 总览 📊 / 自选股 ⭐ / 订阅 💎 / 我的 👤

需替换为 Arco Design 图标库的对应组件，与项目已接入的 Arco（REQ-UI-05）保持一致，统一视觉语言、去掉 emoji。

**图标映射（已核实 Arco 实际导出名）**：
| 导航项 | 原 emoji | Arco 图标组件 |
|---|---|---|
| 总览 | 📊 | `IconDashboard` |
| 自选股 | ⭐ | `IconStar` |
| 订阅 | 💎 | `IconSubscribe`（`IconSubscription` 不存在，用 Subscribe） |
| 我的 | 👤 | `IconUser` |

> 说明：顶部全局栏的"设置"齿轮目前是 inline SVG，本需求**仅限左侧导航图标**，不在范围内；如顺手可一并替换，但非验收必需。

## 2. 验收标准（Acceptance Criteria）
- [ ] AC1：左侧导航 4 项（总览/自选股/订阅/我的）图标均由 emoji 字符串替换为对应 Arco 图标组件，代码中不再出现导航 emoji。
- [ ] AC2：图标从 `@arco-design/web-react/icon` 导入，渲染在导航按钮内，沿用现有激活/非激活颜色体系（`text-accent` / `text-text-muted`），与文字标签共存。
- [ ] AC3：图标视觉尺寸与现有 `text-lg` 大致一致（约 18–20px），不溢出 56px 栏宽、不破坏布局。
- [ ] AC4：dev server 编译无报错、浏览器无 `pageerror`、页面正常渲染（自测用无头浏览器验证 `#root` 渲染 + 抓运行时错误）。
- [ ] AC5：`requirements.md` 新增 REQ-NAV-05 一行且状态随流程回写；本卡状态最终闭环。

## 3. 实施记录
### 🔧 实施中
- 2026-07-13：在 `AppShell.tsx` 顶部从 `@arco-design/web-react/icon` 导入 `IconDashboard / IconStar / IconSubscribe / IconUser`；`NAV_ITEMS` 将 `icon` 字段由 emoji 字符串改为对应图标组件引用；`SideNav` 渲染时由 `<span>{item.icon}</span>` 改为直接渲染图标组件 `<item.icon />`（因 item.icon 现在就是组件），并加 `className="text-lg"` 维持尺寸。

### 🧪 自测（我来做）
- **方法**：vite dev server（localhost:1420）重启后，用系统 Chrome 无头（puppeteer-core）加载页面，抓 `pageerror`/`console.error`，并 `page.evaluate` 读 `#root` 渲染与导航按钮 DOM；比对 emoji 是否残留、Arco SVG 是否就位。
- **结果**：通过。
- **证据**：
  - `#root` innerHTML 长度 = 5956（非空，正常渲染）
  - 导航按钮数 = 4；4 个按钮 `hasArcoSvg=true`、`svgCount=1`：`总览/自选股/订阅/我的` 均含 `svg.arco-icon`
  - 全页 `arco-icon` 数量 = 4（恰为导航 4 项；顶栏设置齿轮为 inline SVG，不在范围内，符合 AC 范围）
  - emoji 残留检查 `['📊','⭐','💎','👤']` → `emojiPresent=[]`（代码内导航 emoji 已清空）
  - 控制台错误仅 1 条 `404`（favicon.ico，已知无害），**无 pageerror、无模块解析错误**
  - 逐项 AC：AC1✅ AC2✅ AC3✅（text-lg 尺寸，布局未破）AC4✅ AC5✅

### 👀 用户验收
- **结果**：通过（用户 2026-07-13 14:06 确认"图标验收通过"）
- **日期**：2026-07-13
- **意见**：无

## 4. 闭环
- **结论**：已交付 → 同步更新 `requirements.md` 状态为 ✅ 已交付；roadmap 实施记录追加。
- **遗留/ follow-up**：用户进一步要求导航"宽松/大间距/大圆角/大留白/偏欧美"风格，另立 REQ-NAV-06 处理。
