# REQ-NAV-12 · 导航采用 trendsol-icon 官方图标资产

- **提出**：2026-07-18（用户给出桌面 `trendsol-icon` 文件夹的权威图标映射）
- **状态**：✅ 已闭环（⬜→🔧→🧪→👀→✅；2026-07-18 用户验收通过）
- **优先级**：P1
- **关联**：REQ-NAV-11（AI诊股 重命名+图标）、REQ-NAV-10（订阅 图标）、DEC-008/009

## 1. 背景
此前 REQ-NAV-11 为「AI诊股」导航自建了机器人头占位图标（AiIcon），REQ-NAV-10 为「订阅」自建了 Arco 衍生图标。用户给出桌面 `trendsol-icon` 文件夹的权威图标映射，要求导航采用官方 SVG 资源：

| 文件位置 | 图标名称 | 使用场景 | 说明 |
|---------|---------|---------|------|
| trendsol-icon | 皇冠帽_crown-three | 订阅（未选中态） | 不带 fill 后缀 |
| trendsol-icon | 皇冠帽_crown-three_fill | 订阅（选中填充态） | 带 fill 后缀 |
| 六个点_six-points | AI诊股（未选中态） | 不带 fill 后缀 |
| 六个点_six-points_fill | AI诊股（选中填充态） | 带 fill 后缀 |

**命名规则**：后缀 `_fill` = 选中填充态；无 `_fill` = 默认未选中态；所有资源位于桌面 `trendsol-icon` 文件夹。

## 2. 验收标准（AC）
- **AC1**：导航「AI诊股」的未选中图标为 `六个点_six-points`（六点辐射线稿），选中填充态为 `六个点_six-points_fill`（六点实心）。
- **AC2**：导航「订阅」的未选中图标为 `皇冠帽_crown-three`（皇冠线稿），选中填充态为 `皇冠帽_crown-three_fill`（皇冠实心）。
- **AC3**：图标以 `currentColor` 内联渲染（1em 跟随父级 `text-lg` 18px；颜色跟随 `text-white`/`text-text-muted`），与「行情/自选股」等相邻导航项尺寸、颜色一致，不做任何尺寸/位移变化。
- **AC4**：`tsc --noEmit` 0 新增；运行期零 `pageerror`。
- **AC5**：原自建占位图标（AiIcon 机器人头、NavIcons.SubscribeFill）已移除，无残留引用。

## 3. 实施方案
- 桌面源：`/Users/sanger/Desktop/trendsol-icon/{六个点_six-points .svg, 六个点_six-points_fill.svg, 皇冠帽_crown-three.svg, 皇冠帽_crown-three_fill.svg}`（viewBox `0 0 48 48`，原 `stroke/fill="#333"`）。
- 新建 `components/TrendSolIcon.tsx`：导出 `SixPointsLine / SixPointsFill / CrownLine / CrownFill`，把 `#333` 统一替换为 `currentColor`、`viewBox="0 0 48 48"`、`width/height="1em"`、透传 `SVGProps`，与现有 `NavIcons` 风格一致。
- `AppShell.tsx`：`/chat` 项改用 `SixPointsLine/SixPointsFill`；`/subscription` 项改用 `CrownLine/CrownFill`（替换 Arco `IconSubscribe` 与 `NavIcons.SubscribeFill`）。
- 删除 `AiIcon.tsx`；`NavIcons.tsx` 移除已不用的 `SubscribeFill`（保留 `UserFill`）。
- 本需求只覆盖映射表中列出的「AI诊股」「订阅」两项；「行情/自选股/我的」不在此次范围内（行情对应的 `股市_stock-market` 官方资源已存在，留待后续按需替换）。

## 4. 实施记录
- 桌面源：`/Users/sanger/Desktop/trendsol-icon/{六个点_six-points .svg, 六个点_six-points_fill.svg, 皇冠帽_crown-three.svg, 皇冠帽_crown-three_fill.svg}`（viewBox `0 0 48 48`，原 `stroke/fill="#333"`）。
- 新建 `components/TrendSolIcon.tsx`：导出 `SixPointsLine / SixPointsFill / CrownLine / CrownFill`，把 `#333` 统一替换为 `currentColor`、`viewBox="0 0 48 48"`、`width/height="1em"`、透传 `SVGProps`，与 `NavIcons` 风格一致；六个点圆点沿用原 path 圆描边、皇冠圆点为 `<circle>`。
- `AppShell.tsx`：`/chat` 项改用 `SixPointsLine/SixPointsFill`；`/subscription` 项改用 `CrownLine/CrownFill`（替换 Arco `IconSubscribe` + `NavIcons.SubscribeFill`）。
- 删除 `AiIcon.tsx`（原机器人头占位）；`NavIcons.tsx` 移除已不用的 `SubscribeFill`（保留 `UserFill`）。
- 本需求仅覆盖映射表列出的「AI诊股」「订阅」两项。

## 5. 🧪 自测（我来做）
- **方法**：dev server + 无头 Chrome（puppeteer-core），检查 `SideNav` 渲染的图标 SVG 结构与样式。
- **结果**：全部 PASS ——
  - AC1 标签 `[行情,AI诊股,自选股,订阅,我的]`，无「对话」；AI诊股 svg `viewBox=0 0 48 48` 且含 7 个 path（1 中心连线 + 6 点）；订阅 svg 含皇冠 path + 3 圆点。
  - AC2 切到 `/subscription`：订阅选中 active=true，应用 `CrownFill` 填充变体（`fill=currentColor`、3 圆点实心）。
  - AC3 AI诊股 在 `/chat` 选中 active=true，应用 `SixPointsFill`（`fill=currentColor`、computed color=`rgb(255,255,255)`）；图标尺寸 AI=订阅=行情=18px 完全一致。
  - AC4 `tsc --noEmit` 仅 `ProfilePage.tsx` 既有 2 错（与本改动无关），REQ-NAV-12 改动 **0 新增**；运行期 **零 pageerror**。
  - AC5 原 `AiIcon`(机器人头)、`NavIcons.SubscribeFill` 已删除，无残留引用（grep 确认）。
- **证据**：预览 URL `http://localhost:1420/#/chat`；截图 `.workbuddy/memory/nav_trendsol.png`。

## 6. 用户验收通过
- **2026-07-18**：用户拍板验收通过（与 REQ-UI-10 / REQ-UI-12 / REQ-NAV-11 一并通过），状态 ✅ 已闭环。
