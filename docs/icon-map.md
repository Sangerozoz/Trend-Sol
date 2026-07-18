# 图标资源映射（trendsol-icon）

> 导航 / 界面图标的**权威资源清单**。所有图标资源位于桌面 `trendsol-icon` 文件夹（`/Users/sanger/Desktop/trendsol-icon/`）。

## 命名规则
- 名称后缀带 `_fill` → 选中填充（实心）态图标。
- 名称不带 `_fill` → 默认未选中（线稿）态图标。
- 源文件为 SVG，`viewBox="0 0 48 48"`，原 `stroke/fill="#333"`；接入时统一改为 `currentColor` 内联 React 组件（跟随父级 `text-lg` 18px + `text-white`/`text-text-muted`），见 `components/TrendSolIcon.tsx`。

## 映射表

| 文件位置 | 图标名称 | 使用场景 | 说明 |
|---------|---------|---------|------|
| trendsol-icon | 皇冠帽_crown-three | 订阅（未选中态） | 不带 `_fill` 后缀 |
| trendsol-icon | 皇冠帽_crown-three_fill | 订阅（选中填充态） | 带 `_fill` 后缀 |
| trendsol-icon | 六个点_six-points | AI诊股（未选中态） | 不带 `_fill` 后缀 |
| trendsol-icon | 六个点_six-points_fill | AI诊股（选中填充态） | 带 `_fill` 后缀 |
| trendsol-icon | 股市_stock-market | 行情（未选中态） | 不带 `_fill` 后缀（暂未接入导航，留待 REQ-NAV-12 后续） |
| trendsol-icon | 股市_stock-market_fill | 行情（选中填充态） | 带 `_fill` 后缀（暂未接入导航） |

## 接入约定
- 两态（线/填充）成对出现，导航 `NAV_ITEMS` 的 `icon` / `iconFill` 分别指向对应组件。
- 选中态仅切换 Fill 变体 + 父级 `text-white` 改色，**不改变任何尺寸/位移**（见 DEC-008 宽松风格）。
- 新增导航项时，优先在桌面 `trendsol-icon` 取对应官方资源；无官方资源再自建（如「自选股」用 Arco `IconStar`、「我的」用 Arco `IconUser`）。

## 关联
- REQ-NAV-12（采用官方图标：AI诊股 + 订阅已接入）
- REQ-NAV-11（AI诊股 重命名 + 图标）、REQ-NAV-10（订阅 图标）
- DEC-008（设计语言：宽松大间距 / 大圆角 / 大留白）
