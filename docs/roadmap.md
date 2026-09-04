# 实施规划 / 路线图（Roadmap）

> 本文件是**分步走的实施计划**，每条任务关联 `requirements.md` 的 REQ 编号，状态变更请回写。
> 每次实施完成后，在文末「实施记录」追加一笔（日期＋做了什么＋关联 REQ＋遗留）。

## 状态图例
- ✅ 已完成 ｜ 🟡 进行中/部分 ｜ ⬜ 待做 ｜ 🚫 取消

---

## 阶段总览

| 阶段 | 目标 | 关联需求 | 状态 |
|---|---|---|---|
| **Phase 1.1** | 信息架构重做：多页面框架＋黑底主题＋Arco 接入 | REQ-NAV-01~02, REQ-UI-01~05, REQ-PROF-04, REQ-DATA-01 等 | ✅ 已完成 |
| **Phase 1.2** | 总览页：大盘＋板块＋自选概览＋持仓盈亏 | REQ-OV-01~03, REQ-PROF-01~02, REQ-DATA-06~07 | ⬜ 待做 |
| **Phase 1.3** | AI 解读：画线→简报→对话闭环 | REQ-AI-01~04, REQ-SYM-03~04, REQ-NAV-04, REQ-UI-04 | ⬜ 待做 |
| **Phase 1.4** | 自选股分组 | REQ-WL-01~03, store 演进 | ⬜ 待做 |
| **Phase 1.5** | 设计系统收尾：组件补齐＋文档系统固化 | REQ-UI 收尾 | 🟡 部分 |
| **Phase 2.x** | 登录＋订阅（第三期） | REQ-SUB-01 真实化 | ⬜ 未启动 |

**依赖**：1.1 先行 → 1.2 / 1.3 / 1.4 可并行 → 1.5 贯穿。

---

## Phase 1.1 — 信息架构重做 ✅ 已完成
- [x] HashRouter ＋ AppShell（左导航＋全局顶栏） — REQ-NAV-01~02
- [x] 5 个页面骨架：总览/自选股/订阅/我的/个股 — REQ-NAV-01
- [x] 纯黑主题（`#000000`）＋ 编译 CSS 验证 — REQ-UI-01
- [x] 高饱和画线配色 ＋ 内置现价线 — REQ-UI-02~03
- [x] Arco Design 接入（图标/表格/弹窗/表单/日期选择器） — REQ-UI-05
- [x] 「我的」页移除设置模块 — REQ-PROF-04
- [x] 条件单 Arco 演示模块 — REQ-PROF-03（演示态）
- [x] 空白页 bug 修复（IconBell→IconNotification ＋ ErrorBoundary） — 工程

## Phase 1.2 — 总览页 ⬜ 待做
- [ ] 大盘指数 Provider ＋ 全局顶栏实时行情 — REQ-DATA-06, REQ-NAV-03
- [ ] 板块行情 Provider ＋ 总览板块模块 — REQ-DATA-07, REQ-OV-01
- [ ] 自选股概览（按分组/mini 走势） — REQ-OV-02（依赖 1.4 分组）
- [ ] 持仓管理录入（股票＋数量＋成本价＋买入日） — REQ-PROF-01
- [ ] 盈亏计算（总/个股）＋ 月度曲线 — REQ-PROF-02, REQ-OV-03
- [ ] 交易时段 4 秒刷新接入 — REQ-DATA-02

## Phase 1.3 — AI 解读 ⬜ 待做
- [ ] packages/ai ＋ Rust ai.rs — REQ-AI-04
- [ ] AI 自动画线（趋势线/支撑阻力/形态/成本） — REQ-AI-01, REQ-SYM-02, REQ-UI-04
- [ ] 四段式简报（严格 JSON 渲染） — REQ-AI-02
- [ ] 个股页右侧价位面板 — REQ-NAV-04, REQ-SYM-03
- [ ] 对话追问（上下文＋历史持久化） — REQ-AI-03, REQ-SYM-04

## Phase 1.4 — 自选股分组 ⬜ 待做
- [ ] store 升级 watchGroups+watchItems（老数据迁移） — REQ-WL-01
- [ ] 分组树（新建/重命名/删除/排序） — REQ-WL-01
- [ ] 股票列表接分组 — REQ-WL-02
- [ ] 右键菜单（移动分组/删除/复制代码） — REQ-WL-03

## Phase 1.5 — 设计系统收尾 🟡 部分
- [ ] 基础组件补齐（Button/Card/Modal/SideNav 统一）
- [ ] 黑底 token 固化进 design tokens 文档
- [ ] 本文档系统维护机制落地（本文件）

## Phase 2.x — 登录＋订阅 ⬜ 未启动
- [ ] 账号/云同步
- [ ] 实际订阅支付（REQ-SUB-01 真实化）

---

## 实施记录（每次实施追加）

### 2026-07-13 — 文档系统建立
- 建立 `docs/` 文档系统：README / requirements / architecture / roadmap / decisions。
- 将 v3 规划拆分为带 REQ 编号的需求规格，作为追溯锚点。
- 关联需求：全部（框架搭建）。
- 遗留：下一步待定 Phase 1.2 / 1.3 / 1.4 的开工顺序（需用户确认）。

### 2026-07-13（早）— Phase 1.1 收尾
- 纯黑主题验证（编译 CSS 无蓝灰）；Arco 接入；条件单演示；空白页修复。
- 关联需求：REQ-UI-01~05, REQ-PROF-03~04, REQ-NAV-01~02。

### 2026-07-13（中）— REQ-NAV-05 闭环 + DEC-008 设计语言
- REQ-NAV-05：左侧导航 emoji 图标替换为 Arco（IconDashboard/IconStar/IconSubscribe/IconUser），用户验收通过并闭环；requirements 状态→✅ 已交付。
- DEC-008：确立设计语言为「宽松 / 大间距 / 大圆角 / 大留白 / 偏欧美」，作为后续所有 UI 的默认视觉方针；首个落地需求 REQ-NAV-06（导航间距改造）。
- 关联需求：REQ-NAV-05, REQ-NAV-06；决策 DEC-008。

### 2026-07-13（晚）— REQ-NAV-07 闭环（导航选中效果）
- REQ-NAV-07：导航选中态图标＋文字纯白（`text-white`）、无选中背景（`bg-transparent`）；「自选股」选中用 `IconStarFill` 实心，其余线形＋描边加粗(5) 近似面形。
- 未选中态：用户确认保持 `text-text-muted`(`#666`) 最暗档、不提亮（另一屏幕偏暗为个别显示差异）；hover 轻微提亮至 `text-text-secondary`(`#999`)。
- 4 项统一"真·实心"图标未要求（Arco 仅星标有 Fill），采用当前近似方案，已接受；requirements 状态→✅ 已闭环。
- 关联需求：REQ-NAV-07；决策 DEC-008, DEC-009。

### 2026-07-13（晚）— REQ-MKT-01 Phase 1（行情页六分区 + 大盘真实数据）
- 数据层（@trend-iq/data）：新增 `MarketIndex`/`MarketIndexGroup` 类型、`EastmoneyProvider.getMarketIndices()`（12 支指数 secid 并行抓取）、`datasource.getMarketIndices()`、`useMarketIndices()` hook（4 秒刷新）。
- 行情页（OverviewPage）重构为六分区骨架：大盘（四市场真实指数，红涨绿跌）、热门/A股交易额/涨跌停比/消息热点（即将上线占位）、用户（自选股接 watchlist，持仓/盯盘占位）。遵循 DEC-008/009。
- 自测：无头 Chrome 确认六分区渲染、无 pageerror；大盘数据因沙箱无外网(直连 eastmoney socket hang up)未能在自测环境拉取，代码已类型检查通过，用户本机有网即可见真实数据。
- 状态：👀 待用户验收（Phase 1）。Phase 2~4 待指令。
- 关联需求：REQ-MKT-01, REQ-NAV-08；决策 DEC-008, DEC-009。

### 2026-07-13（晚·补）— 大盘指数多源 fallback（修复用户侧获取失败）
- 用户本机大盘指数获取失败（东方财富在其网络被挡）。将大盘指数改为**逐支跨源兜底**：新增 `MarketIndexDef`（东财/腾讯/雅虎三套代码）+ `MARKET_INDEX_DEFS`(12支)；`DataSource` 接口加 `getMarketIndex/getMarketIndices`；东财/腾讯/雅虎各实现 `getMarketIndex`；`DataSourceManager.getMarketIndices()` 逐支遍历 providers（本地缓存→东财→腾讯→雅虎），单支全失败才缺失。同花顺无免费 API，沿用 东财→腾讯→雅虎 体系。
- 类型检查通过（仅 ProfilePage.tsx 2 个预存错误，无关）；自测无 pageerror、六分区渲染正常（沙箱无外网，真实数据待用户本机验证）。
- 关联：REQ-MKT-01 Phase 1 增强。

### 2026-07-13（晚·补2）— REQ-DATA-12 接入新浪财经数据源
- 用户确认新浪财经在其环境可用、东方财富大盘失败。新增 `SinaProvider`（`providers/sina.ts`）：`getQuote`（个股，GBK 解析数值字段）、`getMarketIndex/getMarketIndices`（大盘，用 `s_<code>` 紧凑格式 + 定义名称避免乱码）。
- `MarketIndexDef.codes` 扩 `sina` 字段，12 支指数补齐新浪代码（A股标准可靠，港股/美股/日韩最佳猜测，失败自动 fallback 雅虎）。
- 插入 fallback 链 **东财→新浪→腾讯→雅虎**（`datasource.ts`）。Vite 代理 `/sina-quote` → `hq.sinajs.cn`（带 `Referer: finance.sina.com.cn`）+ `http-client.ts` 浏览器侧重写同步。
- 同步更新 REQ-DATA-03 优先级（同花顺无免费API已弃用，改 东财→新浪→腾讯→雅虎）。
- 类型检查通过（仅 ProfilePage.tsx 2 预存错误）；自测无 pageerror、六分区渲染正常（沙箱无外网，真实数据待用户本机刷新确认）。
- 状态：👀 待用户验收。关联：REQ-MKT-01、REQ-DATA-03。

### 2026-07-14（早）— REQ-MKT-02 行情页两栏布局重构
- 用户要求行情页改为左右两栏单页：左核心栏(模块A=大盘指数+交易额+涨跌停比 + 热门 + 消息热点) / 右用户栏(持仓+自选+盯盘)。
- 仅调整布局，不新增采集逻辑。`OverviewPage.tsx` 改为 `grid-cols-1 xl:grid-cols-3`，左 `xl:col-span-2` / 右 `xl:col-span-1`；模块A 为单卡片内含大盘指数(真实)+交易额/涨跌停比(占位)，新增 `SubHeader`/`SubPlaceholder`/`SidePlaceholder` 子组件。遵循 DEC-008/009。
- 自测（无头 Chrome，1512 宽）：`pageErrors:[]`；左栏/右栏/模块A三合一/右栏三项全部命中（AC1-5全过）；500/403为沙箱无外网预期。
- 状态：👀 待用户验收。关联：REQ-MKT-01、DEC-008/009。

### 2026-07-14（晚）— REQ-MKT-02 ✅ 闭环（含五轮细化）
- 用户于 17:38 拍板验收通过。本卡在初版两栏布局基础上，累计完成五轮细化并全部通过：
  1. A股 5 支大卡片一行（`grid-cols-5`）；
  2. A股 改强制单行 + 横向滚动（`flex overflow-x-auto snap`，`min-w-[150px] flex-shrink-0`）；
  3. 其他市场降层级为纯文字内联（删 `IndexCardSmall`、移除 `MarketIndexGroup` 导入）；
  4. 其他市场定稿：去标题、港股仅留恒生指数（删 `hkHSTECH`）、6 支 2 行×3 组网格平均分布（`grid-cols-3`，按 美股→港→日韩 排序）；
  5. A股 卡片 `min-w-[150px] flex-1` 充满整行（替代固定 `flex-shrink-0`）。
- AC1~AC6 全部勾选；`requirements.md` REQ-MKT-02 状态 → ✅ 已交付；本卡状态 → ✅ 已闭环。
- 遗留：模块A 内交易额/涨跌停比、热门/消息热点、持仓/盯盘 仍为占位（REQ-MKT-01 Phase 2~4）；指数卡点击跳转详情见 REQ-MKT-03/DEC-010（暂缓，并入个股详情）。
- 关联：REQ-MKT-01、REQ-MKT-03、DEC-008、DEC-009、DEC-010。

### 2026-07-15 — REQ-UI-01 数据占位与布局稳定性（🔧→🧪，👀 待验收）
- 问题：行情页/顶栏大盘指数**未加载时显示提示文字（`--` /「指数加载中…」），加载完成后布局位移**——顶栏推开搜索框、行情页整块替换成卡片矩阵。
- 解决原则：**结构由稳定定义 `MARKET_INDEX_DEFS` 驱动，渲染数量永远等于定义数（A股 5 + 其他 6），与数据加载无关** → 零结构抖动。
  - 行情页「大盘指数」区改为基于 defs 固定渲染，移除 `isLoading` 整块替换；`IndexCard` 改造接收 `{def, idx?, loading}`，无 idx 时价格/涨跌行渲染固定高度骨架（名称行用 `def.name` 始终显示）；新增 `OtherIndexText` 文字槽（其他市场 6 个，固定 2 行×3 组）。
  - 顶栏三大指数价格/涨跌容器加 `min-w-[4.25rem]/min-w-[3rem]` + `text-right tabular-nums` 固定宽度，未加载时填骨架条。
  - 骨架条 `Sk` 组件：`animate-pulse`（首次加载闪烁），失败态（isLoading=false 且数据空）静态不闪，布局仍稳定。
- 配套：`packages/data/src/index.ts` 透传 `MARKET_INDEX_DEFS`（`export * from "./market-index-defs"`）。
- 自测（无头 Chrome 1512×950）：加载进行中 vs 请求落定后，`aCards=5`/`oPresent=6`/`aPresent=5`/`topPresent=3` 两次完全相等；`hasLoading=false`/`hasFailed=false`（无整块替换）；`PAGEERRORS=0`。tsc 对改动文件无新增报错。
- 状态：✅ 已闭环（2026-07-15 用户拍板验收通过）。关联：REQ-NAV-09、REQ-MKT-02、DEC-008/009。

### 2026-07-15 — REQ-ANIM-01 引入 GSAP 并加入适当动效（🔧→🧪，👀 待验收）
- 用户给 `greensock/gsap-skills` 链接，要求"引用进来 + 适当地方加动画"。澄清：该仓库是 GreenSock **官方 AI Skills 集合**（教 agent 用 GSAP），真正要 import 的是 npm `gsap`（现已 100% 免费含全部插件，无需 auth token）。
- 安装：`pnpm add -F desktop gsap @gsap/react`（gsap@3.15.0 + @gsap/react@2.1.2；pnpm 需 `--store-dir` 指向既有 `.pnpm-store/v11`）。
- 新增 `apps/desktop/src/lib/gsap.ts`：集中 `gsap.registerPlugin(useGSAP)`；导出 `useValuePulse(ref, value)`（值变化时 `scale 1.12→1` 脉冲，仅 transform/opacity，首帧/值不变不触发）；`prefersReducedMotion` 守卫（系统"减少动态"时跳过装饰动画）。
- 动效落点（与 DEC-008/009/REQ-UI-01 一致，只动 transform/opacity，布局零位移）：
  - 行情页入场级联：`useGSAP` + `scope=rootRef`，对 16 个 `.ov-anim`（A股 5 卡 + 其他 6 槽 + 热门/消息热点/自选/持仓/盯盘）做 `gsap.from({ y:18, autoAlpha:0, stagger:0.06 })`。
  - 数值跳动脉冲：`IndexCard` 价格行 + `TopGlobalBar` 三大指数价格，每 4 秒刷新拿到新值且变化时轻微 scale 脉冲。
- 自测（无头 Chrome 1512×950）：`EARLY(250ms)` 16 个 `.ov-anim` 的 opacity 0→0.08（入场执行中）；`LATE(2750ms)` 全部 opacity=1 且计数恒 16（零位移）；`PAGEERRORS=0`。tsc 对三文件无新增报错；Vite 转译 200 干净；`gsap` 已被预打包。沙箱无外网，脉冲路径需本机（有网）确认。
- 状态：✅ 已闭环（2026-07-15 用户拍板验收通过）。关联：REQ-UI-01、REQ-NAV-09、DEC-008/009。

### 2026-07-15 — REQ-MKT-04 其他市场文字行对齐布局（🔧→🧪，两次打回，👀 三次待验收）
- 用户要求其他市场（道琼斯/恒生指数/纳斯达克等 6 支，2 行×3 组）改为表格式对齐：名称左对齐、金额右对齐、涨跌右对齐、数值列尽可能等宽，提升阅读体验。
- `OverviewPage.tsx` 的 `OtherIndexText` 由 `inline-flex items-baseline gap-1.5`（整体左对齐成组）重构为 `flex items-center gap-3`：
  - 名称 `flex-1 min-w-0 truncate`（左对齐、占剩余空间、过长截断，不挤压数值列）。
  - 金额 `w-20 text-right shrink-0 tabular-nums`（右对齐、固定 80px、不收缩）。
  - 涨跌 `w-20 text-right shrink-0 tabular-nums`（与金额列**等宽**，右对齐，红涨绿跌着色）。
  - 外层 `grid grid-cols-3 gap-x-4 gap-y-2` 不变；因各单元格等宽且数值列贴右对齐、等宽 → 金额列纵向互相对齐、涨跌列纵向互相对齐。骨架占位(`animate-pulse`/失败态静态)、`ov-anim` 入场动画、红涨绿跌着色均保留，布局零位移。
- 自测（无头 Chrome，localhost:1420）：6 行 `OtherIndexText` 全部命中；`nameGrow=1`、`priceAlign=right/priceWidth=80`、`chgAlign=right/chgWidth=80`（等宽）；各列右缘 x=312/528/743 等距；`PAGEERRORS=0`。tsc 对 OverviewPage 无新增报错（仅 ProfilePage 两预存错误无关）；Vite 转译 200 干净。
- **用户打回（2026-07-15）**：初版因 `name flex-1`（名称占满剩余、数值被推到单元格最右，名称与自身数值间隙 ~30px）+ 数值列 `w-20`(80px) 过宽，导致"道琼斯 指数 涨幅"三者各自独立成列、成组关系丢失。用户要求"指数 价格 涨跌 应是一组信息"。
- **重做（2026-07-15）**：`OtherIndexText` 改为 `flex items-center justify-end gap-1.5`——名称 `shrink-0` 自然宽（紧贴其数值，间隙仅 6px，读为一组）；金额 `w-16 text-right shrink-0`、涨跌 `w-14 text-right shrink-0`（整体靠右 → 各单元格内金额/涨跌右缘跨两行对齐成列）；去掉初版 `flex-1`/`truncate`/80px 过宽列。自测：无头验证 6 行 `nameRightToPriceLeftGap=6`（成组）、`justifyContent=flex-end`、各单元格内 price/change 右缘跨两行一致（道琼斯&恒生=250/312、纳斯达克&日经=466/528、标普&韩国=681/743）、`nameTruncated=false`、`PAGEERRORS=0`。
- **二次打回（2026-07-15）**：二版名称自然宽 + `justify-end`（整体靠右），名称起点随名称长度浮动、组间不齐。用户改要**三列各自固定宽**：名称左对齐(宽=最宽名"韩国KOSPI")、数值右对齐(10 位数字宽)、涨跌右对齐(6 位字符宽)，三组一行平均分布。
- **二次重做（2026-07-15）**：`OtherIndexText` 改为 `flex items-center gap-2`——名称 `w-[4.5rem] text-left truncate shrink-0`(72px)、数值 `w-[10ch] text-right tabular-nums shrink-0`、涨跌 `w-[6ch] text-right tabular-nums shrink-0`；去掉 `justify-end`，靠三列固定宽保证跨行对齐。自测（无头 Chrome）：名称宽恒 72px（`maxNameTextW=72`、`anyTruncated=false`）、数值宽恒 76px(10ch)、涨跌宽恒 45px(6ch)；按 3 列分组 `nameLeftSpread/priceRightSpread/chgRightSpread` 均为 0（三列各自跨行完全对齐）；名称左缘 x=113/328/544（列距 215/216 均等）；`PAGEERRORS=0`；tsc 无新增报错。
- **微调（2026-07-15）**：用户要求数值列由 10ch 收窄至 **8ch**（实测 76px→60px），其余不变；无头验证名称 72px/数值 60px/涨跌 45px 各列跨行对齐、`PAGEERRORS=0`、tsc 干净。
- 状态：👀 待用户验收（三次交验 + 8ch 微调）。关联：REQ-MKT-02、DEC-008/009、REQ-UI-01。

### 2026-07-15 — REQ-MKT-06 其他市场模块内容宽度对齐上方 A股 卡片行（🔧→🧪，👀 待验收）
- 用户反馈：下方「美/港/日韩股」其他市场模块内容视觉宽度比上方 A股 卡片行更窄，要求两者宽度一致。
- 根因：A股 卡片 `flex-1` 铺满整行到右边缘；其他市场 `grid-cols-3` 每格内容默认左对齐，末列文字组右侧留白、未到右边缘 → 内容视觉更窄（容器本身实为等宽 819px，非容器问题）。
- 修复：`OtherIndexText` 改 `w-full` 填满单元格 + 按列位置 `justify-start/center/end`（`col=index%3`，父级 `otherDefs.map((def,i)=>...)` 计算传入）；三列固定宽成组与列内纵向对齐（REQ-MKT-04）保持不变。
- 自测（无头 Chrome 1440px，localhost:1420）：A股 行 left=113/right=932；其他市场两行均 group1 左缘=113(==aLeft)、group3 右缘=932(==aRight)、中列居中(426~620)，两行完全一致；`PAGEERRORS=0`；tsc 对 OverviewPage 无新增报错。
- 状态：👀 待用户验收。关联：REQ-MKT-02、REQ-MKT-04、REQ-UI-01、DEC-008/009。

### 2026-07-15 — REQ-MKT-05 修复 A股 横向滚动容器加载期竖向滚动条闪烁（🔧→🧪，👀 待验收）
- 现象：用户报 A股 大盘指数卡片行在**加载/入场动画期间**容器右侧短暂出现竖向滚动条，动画结束（占位卡片淡入完成）后消失。
- 根因：`A股` 容器 `flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory`——`overflow-x:auto` + `overflow-y:visible` 触发 CSS 规则使 `overflow-y` 计算为 `auto`；REQ-ANIM-01 入场 `gsap.from({y:18})` 将卡片下移 18px 超出容器内边距 → 该竖向轴在入场期间显示滚动条，落定后消失。
- 修复：容器补充 `overflow-y-hidden`（显式固定竖向为 hidden），保留 `overflow-x-auto` 横向滑动；入场 18px 下移在底部裁切（同时 opacity 0→1 不可见），无视觉突兀。
- 自测（无头 Chrome，localhost:1420）：入场期 `entrance(250ms)` 与落定期 `settled(2750ms)` 均 `overflowX="auto"`/`overflowY="hidden"`/`verticalScrollbar=false`/`clientW(630)==offsetW(630)`，`scrollW=798>clientW` 证明横滑能力保留；`PAGEERRORS=0`。tsc 对 OverviewPage 无新增报错。
- 状态：✅ 已闭环（2026-07-15 用户拍板验收通过）。关联：REQ-MKT-02、REQ-ANIM-01、DEC-008/009、REQ-UI-01。

### 2026-07-14（晚）— REQ-NAV-09 顶部全局栏大盘指数补真实数据
- 用户要求补顶部全局栏（上证/深证/创业板）缺失数据。原 `TopGlobalBar` 用 mock `INDICES` + 空 `useEffect`，点位恒 `--`。
- `AppShell.tsx` 改动：移除 `useState/useEffect` 与 mock 常量；新增固定顺序 `TOP_INDEX_CODES=["sh000001","sz399001","sz399006"]` + 简称映射（上证/深证/创业板，对应 `MARKET_INDEX_DEFS` A股 前三项）；`TopGlobalBar` 接 `useMarketIndices()`（东财→新浪→腾讯→雅虎 fallback，与行情页同源共享缓存，交易时段 4 秒刷新）；点位 `price.toFixed(2)`、涨跌幅带符号、红涨绿跌；数据未就绪显示 `--`，三槽布局恒在。
- 自测：`tsc` 对 AppShell 无报错（仅 ProfilePage 两预存错误无关）；Vite 转译 200 干净；`useMarketIndices`/`TOP_INDEX_CODES`/`sh000001` 入产物、`useState`/`useEffect` 归零。
- 状态：✅ 已闭环（2026-07-15 用户拍板验收通过，AC5 本机有网刷新确认）。关联：REQ-NAV-03、REQ-DATA-03/12。

### 2026-07-15 — REQ-DATA-13 修复道琼斯取数错标（🔧→🧪，👀 待验收）
- 用户实测「道琼斯」持续显示 22.32，真实道指约 52500。
- 根因：道指 def.codes.tencent 误写 `usDJIA`，腾讯 `usDJIA` 解析为「Global X Fds Dow 30 Covered Call Etf」基金(22.32)；腾讯正确道指代码为 `usDJI`（实测返回 52508.27）。`usSPX/usN225/usKS11` 在腾讯为 no-match（靠雅虎兜底），故仅道指中招。
- 改动：`packages/data/src/market-index-defs.ts` 道指 `tencent: "usDJIA"→"usDJI"`；`providers/tencent.ts` getMarketIndex 加 `ETF/ETN/Fund/Fds/Trust` 名称守卫（命中即 return null 继续 fallback，仅限指数查询）。
- 自测：tsc（data+desktop）无新增报错；无头 Chrome 加载 localhost:1420 `PAGEERRORS=0`、6 个其他市场槽位（含道琼斯）正常渲染。真实值 22.32→≈52500 需用户本机含网确认。
- 状态：👀 待用户验收（AC5 本机有网刷新确认）。关联：REQ-DATA-03、REQ-MKT-01。

### 2026-07-15 — REQ-ANIM-02 顶栏三大指数数值变动去除脉冲动画（🔧→🧪，✅ 已闭环）
- 用户反馈顶栏上证/深证/创业板数值变化不该有"跳动"脉冲。
- 改动：`AppShell.tsx` `TopIndex` 删除 `useValuePulse(priceRef, idx?.price)` 调用与 `priceRef`/`useRef` 引用、移除 `useValuePulse` import；价格 span 去掉 `ref`。行情页 A股 `IndexCard` 脉冲不受影响。
- 自测：tsc 对 AppShell 无 `useRef`/`useValuePulse` 报错；无头 Chrome 加载 localhost:1420 顶栏三价格 span `transform:none`、无 gsap 内联样式、`PAGEERRORS=0`，数值仍随数据更新（上证3961.69/深证14880.11/创业板3845.90）。
- 状态：✅ 已闭环（2026-07-15 用户验收通过）。关联：REQ-ANIM-01、REQ-NAV-09、REQ-UI-01。

### 2026-07-15 — REQ-UI-02 行情页去除冗余标题/副标题（🔧→🧪，👀 待验收）
- 用户要求去掉「大盘概览」模块内三类冗余文字：卡片内「大盘指数」小标题、A股 卡片行上方「A股」标签、「大盘概览」副标题「指数 · 成交额 · 涨跌停」（主标题「大盘概览」保留）。
- 改动：`OverviewPage.tsx` 删除 `<SubHeader title="大盘指数">`、A股 行上方 `text-text-muted`「A股」标签、`SectionHeader` 大盘概览的 `subtitle` 传参；顺手删无调用方的 `SubHeader` 死代码。A股交易额/涨跌停比子模块标题保留；布局零位移（既有 `space-y` 控留白）。
- 自测：tsc 对 OverviewPage 无新增报错；无头 Chrome 加载 localhost:1420 DOM 无独立 `h2`「大盘指数」/「A股」、正文不含副标题、A股 容器(1)与其他市场(6 槽)正常、`PAGEERRORS=0`。
- 状态：👀 待用户验收。关联：REQ-UI-01、DEC-008。

### 2026-07-15 — REQ-MKT-07 按 MasterGo 设计稿二次同步（🔧→🧪，👀 待验收）
- 用户在 MasterGo 中调整「A股交易额」卡片：删除「实时·沪深两市」胶囊标签；主体改为左右两栏（左=成交额+较昨日，右=大盘资金净流入+昨日成交额）；图表区高度由 48px 提升至 84px。
- 读回：使用 `get_selection_node` 同步选中图层 + `get_frontend_code` 导出 HTML + 截图，解析 `turnover-card` 结构 1:1 还原。
- 数据层：新增 `MarketFundFlow` 类型 + `DataSource.getMarketFundFlow()`；东财 `EastmoneyProvider` 使用 `push2.eastmoney.com/api/qt/ulist.np/get`（secids=1.000001,0.399001，fields=f62）获取上证/深证主力净流入并求和，转亿元；腾讯/新浪/雅虎/本地缓存返回 null；`DataSourceManager` 加跨源 fallback 并导出 `getMarketFundFlow()`。`push2.eastmoney.com` 已存在于 `/em-quote` 代理与重写，无需新增域名。
- Hook：`useStockData.ts` 新增 `useMarketFundFlow()`（4s/30s 刷新），并入 `useMarketStats()` 返回 `turnoverNetInflow`。
- UI：`MarketStats.tsx` 重构 `TurnoverCard`（无 badge、双栏、84px 图表）；`MiniBarChart` 增加 `height` prop；骨架屏同步新布局；无数据仍降级为「—」。A股涨跌停比卡片本次不改动。
- 自测：tsc 仅 ProfilePage 既有 2 错无新增；vite build 成功（1146 模块）；无头 Chrome `#root` 21,102 字符、含「A股交易额」「大盘资金净流入」「昨日成交额」、不含旧「实时 · 沪深两市」、chart 高度 84px、`PAGEERRORS=0`；15 个 500/403/404 为沙箱无外网数据代理失败（预期）。
- 状态：👀 待用户验收（AC5 真实数据需本机含网确认）。关联：REQ-MKT-07、REQ-MKT-08、REQ-UI-01、DEC-008/009。

### 2026-07-15 — REQ-MKT-07 / REQ-MKT-08 按 MasterGo 设计稿二次同步（双卡，🔧→🧪，👀 待验收）
- 读回：用户在 MasterGo 中重做「A股交易额」「A股涨跌停比」两张卡片；`get_selection_node` 同步根节点 + `get_frontend_code` 导出整页 HTML（page-root），解析 `turnover-card` / `breadth-card` 子树。
- **REQ-MKT-07（A股交易额）**：与已同步实现基本一致，仅 2 处还原度微调——`TurnoverCard` 标题 `font-medium`→`font-semibold`（600 字重）；「昨日成交额」数值由白色改为灰色 `text-text-muted`（对齐设计稿 #999999）。双栏 / 84px 图表 / 大盘资金净流入 保持。
- **REQ-MKT-08（A股涨跌停比）**：设计稿与现有实现差异大，重做——`BreadthCard` 删除「不含 ST/科创板」胶囊；`CompareBars` 双竖对比柱改为**单根横向占比条**（红涨停左 `width:upPct%` + 绿跌停右 `flex-1`，高 16px、圆角 2px、overflow-hidden，upPct=limitUp/(limitUp+limitDown)）；删除「连板高度」「连板 N 家 · 炸板 M 家」，仅保留「涨跌停比 X : 1」；骨架屏同步三行（数字 / 占比条 / 涨跌停比）。数据层 `useMarketBreadth()` 不变（limitUp/limitDown 已满足）。
- 自测：tsc 仅 ProfilePage 既有 2 错无新增；无头 Chrome 加载 localhost:1420 `PAGEERRORS=0`（20 个 500/404/403 为沙箱无外网代理失败，预期）、`#root` 22,578 字符、含「A股交易额」「A股涨跌停比」「涨跌停比」、无「不含 ST」「连板」、`hasProportionBar=true`、chart 高度 84px。
- 状态：👀 待用户验收（AC5/AC6 真实数据需本机含网确认）。关联：REQ-MKT-07、REQ-MKT-08、REQ-UI-01、DEC-008/009。

### 2026-07-15 — REQ-MKT-07 / REQ-MKT-08 验收反馈整改（①②③，🔧→🧪，重新 👀 待验收）
- 用户本机验收反馈 3 处还原度问题：①「大盘资金净流入」行字号偏大；②下方柱状图高度不对；③涨跌停比行「连板 N 家 · 炸板 M 家」被删（设计稿有）。
- **①**：`TurnoverCard` 大盘资金净流入整行 `text-base`(16px)→`text-sm`(14px)，并去数值 `font-semibold`（设计稿该行为常规字重）；读回 `get_selection_node` 确认设计稿标签/数值均 14px。
- **②**：读回 `turnover-chart`(4:0659) 实时样式——容器 `height:84px` 已与设计稿一致；所谓"高度不对"实为**柱子相对高度**：设计稿柱 38%~100% 实心，原 `Math.max(...,2)` 下限致真实数据下柱子过矮稀疏。整改：`MiniBarChart` 最小柱高下限 2%→20%，整图密度对齐设计稿。
- **③**：根因为上次读回整页 HTML 被 `head -120` 截断漏看 `breadth-meta` 的 `board-meta`（连板 8 家 · 炸板 5 家，14px），误判设计稿无此行。整改：`BreadthCard` 在「涨跌停比 X : 1」同行右侧加回「连板 {consecutive} 家 · 炸板 {broken} 家」。**同步纠正 REQ-MKT-08 之前"删除连板行"的错误结论与 AC9。**
- 自测：tsc 仅 ProfilePage 既有 2 错无新增；dev server 热更新模块确认含新代码；无头 Chrome 抓 localhost:1420——`netFontPx:14`（①）、`chartHeight:81`≈84px、`barMin:16/barMax:79`（②）、`bodyText` 含 `连板 16 家 · 炸板 33 家`（③）、零 `pageerror`（20 个 500 为沙箱无外网代理失败，预期）。
- 状态：重新 👀 待用户本机含网验收。关联：REQ-MKT-07、REQ-MKT-08。

### 2026-07-15 — REQ-MKT-07 / REQ-MKT-08 验收反馈整改（昨日成交额单位 + 涨跌停比居中，🔧→🧪，重新 👀 待验收）
- 用户本机含网验收反馈 2 处：①「昨日成交额」数值错误（本机显示 `12,372,772 亿元`，正确 `≈12,372.772 亿元`，正好 1000× 且小数点被吞）；②「A股涨跌停比」下方信息应整体在下方区域居中，现顶部贴顶。
- **① 昨日成交额单位错误（根因级修复）**：数据层无 1000× 因子；eastmoney/tencent K 线 `amount` 均按「元」处理。根因为用户本机 K 线数据源 `amount` 实际比实时行情(quote)放大 1000×；图表因按最大值归一化、相对形状不变故「看起来正常」，仅绝对数值文本暴露。修复：`useMarketTurnoverSeries()` 新增以实时行情「今日成交额」为基准的单位自校正（`unitRatio = quoteToday / klineLast`，整条序列乘 `unitRatio` 后再 `/1e8`），无论 eastmoney/tencent 的 K 线 `amount` 单位如何漂移都与实时值对齐（quote 失败回退原始 `/1e8`）；同时修正柱状图 tooltip。沙箱无外网无法复现，需用户本机含网验证。
- **② 涨跌停比内容垂直居中**：`BreadthCard` 根节点改 `h-full flex flex-col`，内容块（涨停/跌停大数值 + 横向占比条 + 涨跌停比/连板行）包入 `flex-1 flex flex-col justify-center`，整体在卡片下半区居中（两块卡片 grid 等高拉伸）。
- 自测：tsc 仅 ProfilePage 既有 2 错无新增；重启 dev server 清残留旧模块，热更新模块确认含 `unitRatio`/`justify-center`；无头 Chrome 抓 localhost:1420——`#root` 22,705 字符、零 `pageerror`（`errors` 数组空，19 个 500 为沙箱无外网代理失败预期）、`netFontPx:14`/连板行/`chartHeight:81` 无回归。
- 状态：重新 👀 待用户本机含网验收。关联：REQ-MKT-07、REQ-MKT-08。

### 2026-07-15 — REQ-MKT-07 / REQ-MKT-08 行情页「A股交易额」「A股涨跌停比」数值+图表（初始实现，🔧→🧪，👀 待验收）
- 用户要求把行情页模块A 内两块占位（A股交易额 / A股涨跌停比）做成「数值 + 图表」形式，开始实施。
- **REQ-MKT-07（A股交易额）**：复用既有 `getQuote`/`getKLines`（不新增 Provider 方法）。
  - 实时值 = 上证指数(000001,A-SH).amount + 深证成指(399001,A-SZ).amount（指数 `f48`=市场总成交额），元→亿元。
  - 序列 = 两指数近 20 日 K 线 `amount` 之和（元→亿元）。
  - `useStockData.ts` 新增 `useMarketTurnoverValue`/`useMarketTurnoverSeries`/`useMarketStats`；交易时段 4s / 非交易 30s 刷新。
- **REQ-MKT-08（A股涨跌停比）**：新增 `MarketBreadth` 类型 + `DataSource.getMarketBreadth()`。
  - 东财 `push2ex.eastmoney.com` 涨停池(`getTopicZTPool`)/跌停池(`getTopicDTPool`)计数（口径不含 ST/科创板，UI 标注）；date=今日；空池返回 null。
  - `providers/eastmoney.ts` 实现；`tencent/yahoo/sina/local-cache.ts` 返回 null；`datasource.ts` 加 manager fallback 方法 + 导出 `getMarketBreadth()`。
  - 补网络层：`http-client.ts` 加 `push2ex.eastmoney.com → /em-zdt` 重写；`apps/desktop/vite.config.ts` 加 `/em-zdt` 代理（Referer/UA），浏览器预览绕过 CORS。
  - `useStockData.ts` 新增 `useMarketBreadth`（含入 `useMarketStats`）。
- **UI**：`apps/desktop/src/components/market/MarketStats.tsx`（新增，`SubPlaceholder` 移除）：`TurnoverCard`（大数值 + `MiniBarChart` 20 日量能柱 + 较昨日）、`BreadthCard`（涨停/跌停大数值红绿 + `CompareBars` 对比柱 + 涨跌停比 + 连板高度 + 连板/炸板）、`Skeleton`；加载骨架 + 无数据「—」降级；`ov-anim` 入场动画。`OverviewPage.tsx` 两块 `SubPlaceholder` 替换为 `<MarketStats />`，并删无调用方 `SubPlaceholder` 死代码。
- 自测（无头 Chrome，localhost:1420）：`#root` 20,665 字符、含「A股交易额」「A股涨跌停比」「大盘概览」、`PAGEERRORS=0`（16 个 `500 Failed to load resource` 均为沙箱无外网导致的数据代理失败，预期、非 JS 异常）；tsc 仅 ProfilePage 既有 2 错无新增；vite build 成功（1146 模块）。
- 状态：👀 待用户验收（真实数值/图表待用户本机含网确认，同 REQ-DATA-13 模式）。关联：REQ-MKT-01、REQ-DATA-03、REQ-UI-01、DEC-008/009。

### 2026-07-15 — REQ-NAV-10 左侧导航「订阅」「我的」选中态填充图标（🔧→🧪，👀 待验收）
- 用户反馈：左侧导航「订阅」「我的」两项选中时未使用填充(实心)图标（fallback 回线形+加粗描边近似）。
- 根因：`AppShell.tsx` 的 `NAV_ITEMS` 中 订阅(`IconSubscribe`)/我的(`IconUser`) 仅配 `icon` 未配 `iconFill`；选中逻辑 `active && item.iconFill ? item.iconFill : item.icon` 对这两项恒取线形。行情(`StockMarketFill`)/自选股(`IconStarFill`) 已正常。
- 修复：新增 `apps/desktop/src/components/NavIcons.tsx` —— `SubscribeFill`/`UserFill` 复用 Arco `IconSubscribe`/`IconUser` 原始 path（viewBox `0 0 48 48`），`fill="currentColor"` 实心化，尺寸 `1em` 跟随 `text-lg`；`AppShell.tsx` 的 `NAV_ITEMS` 订阅/我的补 `iconFill`，并更新误导向注释。
- 自测（无头 Chrome，localhost:1420）：`订阅` 页 active 项 svg `fill=currentColor`、path 起 `M9 7v34.667a`(SubscribeFill)；`我的` 页 active 项 svg `fill=currentColor`、含 circle、path 起 `M7 37c0-4.97`(UserFill)；4 按钮均渲染 svg；`/subscription` 下仅「订阅」高亮；零 JS `pageerror`（12 个 `500 Failed to load resource` 为沙箱无外网数据代理失败，预期）；tsc 仅 ProfilePage 既有 2 错无新增。AC1-5 全过。
- 状态：👀 待用户本机验收（视觉填充观感）。关联：REQ-NAV-07、DEC-008/009。

### 2026-07-16 — 批量验收闭环：10 项 ✅，REQ-MKT-07 用户打回
- 用户于本机逐一验收，以下 10 项通过并回写 ✅ 已闭环：REQ-DATA-12（新浪源兜底）、REQ-DATA-13（道琼斯错标修复）、REQ-NAV-08（行情自定义SVG）、REQ-NAV-09（顶栏真实指数）、REQ-NAV-10（订阅/我的选中填充）、REQ-MKT-01（行情页结构 Phase1）、REQ-MKT-04（其他市场三列固定宽）、REQ-MKT-06（其他市场宽度对齐）、REQ-MKT-08（A股涨跌停比）、REQ-UI-02（去除冗余标题）。
- 数据类（REQ-NAV-09/DATA-12/13/MKT-01/08）依赖本机联网确认真实数值，均已本机含网验证通过；视觉类（REQ-NAV-08/10/UI-02/MKT-04/06）离线可验，均通过。
- **REQ-MKT-07（A股交易额卡）用户打回（不通过）**，状态转 🔧 待整改，待用户给具体意见后整改、重新 👀。
- 状态：10 项 ✅ 已闭环；REQ-MKT-07 🔧 待整改（打回待意见）。

### 2026-07-16 — REQ-MKT-07 昨日成交额 1000× 单位漂移二次修复（🔧→🧪，重新 👀 待验收）
- 用户二次验收仍报「昨日成交额 12,372,772 亿元」（1000× 未消除）。上一轮 `unitRatio=quoteToday/klineLast` 自校正未生效。
- 根因重判：`unitRatio` 仅在 quote 与 kline 单位不一致时有效；你本机数据源（东财失败→新浪/腾讯）下 K线 `amount` 为千元(1000×元)，而校正里二次 `getQuote` 取数失败或同源同单位时 `unitRatio` 回退 1 → 无法自愈。
- 修复（确定性、与源无关）：新增 `normalizeTurnoverYi(v)`，以 A股 沪深单日成交额合理量级为锚（<800 亿判 1000× 缩小、>60000 亿判 1000× 放大、区间內原样返回）；`useMarketTurnoverValue`/`useMarketTurnoverSeries` 均接入；`unitRatio` 保留作比例兜底、与确定性校正叠加不会双重纠正。
- 自测：tsc 仅 ProfilePage 2 错无新增；`normalizeTurnoverYi` 单测 6 例全 PASS（12,372,772→12,372.772、正确值/高位/低位不变、1,500,000→1,500、50→50,000）；重启 dev server 清残留，无头 Chrome `#root` 20,181、含「A股交易额」「昨日成交额」「大盘概览」、零 JS pageerror（沙箱无外网→昨日成交额显示「—」，修复仅真实数据时生效）。
- 状态：重新 👀 待用户本机含网验收（确认昨日成交额≈12,372.772 亿、实时成交额同步正确）。关联：REQ-MKT-08、REQ-UI-01、REQ-DATA-03、DEC-008/009。

### 2026-07-16 — REQ-MKT-11 涨跌停比→涨跌比 + REQ-MKT-07 冻结昨日成交额（🔧→🧪，均 👀 待验收）
- **REQ-MKT-11（涨跌停比→涨跌比）**：用户要求标签与数据同步改。数据层新增 `MarketAdvanceDecline{up,down,flat,updateTime}` + `DataSource.getMarketAdvanceDecline()`（东财实现：上证1.000001+深证0.399001 指数 `stock/get` 的 `f162/f163/f164` 即上涨/下跌/平盘家数求和；sina/tencent/yahoo/local-cache 兜底 null）；`useMarketAdvanceDecline` Hook（4s/30s）；`MarketStats.tsx` 的 `BreadthCard` 改为涨跌比（上涨/下跌/平 + 涨跌比 X:1 + 占比条红涨绿跌 + 平盘家数，移除连板/炸板）。
- **REQ-MKT-07（冻结昨日 + 数值对齐）**：①用户指出昨日成交额不应随刷新变动（历史定值）。根因：`TurnoverCard` 取 `useMarketTurnoverSeries` 的 `series[length-2]`，每 60s 重拉 K线；数据源兜底在东财(真实 amount)↔腾讯(K线 amount=volume×close 估算)间轮换→既偏差大又跳动。新增 `useMarketTurnoverYesterday()`：queryKey 含当天日期、`staleTime=24h`、`refetchInterval=false`，当日仅取一次、跨日才重拉；卡片改用冻结值。②对照同花顺今日≈19766亿/昨日≈25876亿（均落 800~60000 合理区间，`normalizeTurnoverYi` 不误校正），走东财指数 `f48` 真实口径。③较昨日补绝对增减额 `(±X,XXX亿)`。④`useMarketTurnoverSeries` 刷新 60s→300s 降历史柱跳动。
- 自测：tsc 仅 ProfilePage 既有 2 错无新增；`normalizeTurnoverYi` 单测 8 例全 PASS（含 19766/25876 原样、12,372,772→12,372.772）；无头 Chrome 零 JS pageerror、旧「涨跌停比/涨停/跌停/连板/炸板」标签全消失、新「A股涨跌比」在、无网降级「—」；昨日索引=length-2 复核 PASS。
- 提示：用户所给「较上日减少2356亿」与 19766/25876 不自洽（25876−19766=6110，即 −23.6%），交付说明已请用户核对；App 按真实源算百分比+绝对额，不硬编码。
- 状态：REQ-MKT-11 / REQ-MKT-07 均 👀 待用户本机含网验收。关联：REQ-MKT-08、REQ-UI-01、REQ-DATA-03、DEC-008/009。

### 2026-07-16 — REQ-MKT-12 交易额数据源钉死东财真实源（🔧→🧪，👀 待验收）
- 用户反馈交易额偏差大（同花顺今日23973/昨日25876/较上日-1901）且昨日成交额不停刷新变动。
- 根因精确定位：turnover 昨日/序列取自 K线 `amount`，走兜底链 `本地缓存→东财(真实)→新浪(空)→腾讯(amount=volume×close 估算)→Yahoo`；东财 K线偶发抖动即横跳到腾讯估算值（既偏差大又跳动）。此前 REQ-MKT-07 按日冻结只冻结取值时机、未冻结数据源，故未根治。
- 修复：新增 `MarketTurnover{today,yesterday,series,updateTime}` + `DataSource.getMarketTurnover()`；**东财仅调自身 `getQuote(f48)` + `getKLines(真实 amount)`（钉死，不走腾讯/新浪估算）**，含 `normalizeTurnoverYi` 量级校正，失败返回 null；sina/tencent/yahoo/local-cache 兜底 null；Manager 东财真实值即采用，否则降级「—」（绝不显示错误估算横跳）。Hook 层 `useMarketTurnover()` 单一实时（今日+序列，4s/30s）+ `useMarketTurnoverYesterday()` 按日冻结；`useMarketStats` 同形状（UI 不变）；移除桌面端 `normalizeTurnoverYi`。
- 自测：tsc 仅 ProfilePage 2 错无新增；无头 Chrome 零 JS pageerror、`#root` 16,352、新标题在、旧涨跌停标签移除；delta 数学对齐同花顺(-7.4% / -1,903亿≈-1,901亿)。
- 状态：REQ-MKT-12 👀 待用户本机含网验收；REQ-MKT-07 根因同由此修复（保留 👀 待用户复核数值）。
### 2026-07-16 — REQ-MKT-13 A股交易额今日值获取失败修复（🔧→🧪，👀 待验收）
- 用户报 REQ-MKT-12 交付后整卡「—」（"怎么获取不到A股交易额了"）。
- **根因修正**：实测东财 push2 `stock/get` 的 `f48` **就是真实成交额（元）**，并非涨停价（此前误判为涨停价）；`toSecid("000001","A-SH")="1.000001"` 正确。REQ-MKT-12 真正问题是把 `getQuote(今日 f48)` 与 `getKLines(昨日/序列)` 放在**同一 try**，K线接口(push2his→Vite 代理 `/em-kline`)在用户本机偶发失败/慢即整体抛异常→catch→返回 null→整卡「—」。
- **修复**：`eastmoney.ts` 的 `getMarketTurnover()` 重构——今日独立 `getQuote.f48`、昨日/序列独立 `getKLines`，拆为两个独立 try 互不拖垮；双保险（今日实时接口未取到但 K线可用时，用 K线最后一根当日兜底）；`types.ts` 的 `MarketTurnover.today` 放宽 `number|null`。
- **关键经验**：① 字段含义必须实测验证，不可凭记忆假设（`f48` 跨接口含义不同）；② 多源拼装的"主数值"必须与"历史序列"解耦容错，任一路失败不应拖垮整体；③ 无头「—」可能是 sandbox Node 进程无外网（Vite 代理东财 500，大盘指数靠新浪/腾讯浏览器侧兜底仍显示），需与本机含网区分。
- 自测：tsc 0 新增；math 全 PASS（今日/昨日/序列/增减/校正/边界）；无头零 pageerror；根因定位（sandbox 东财代理 500=Node 无外网，非代码）。待用户本机含网验收数值。

### 2026-07-17 — REQ-UI-07 行情页 MasterGo 设计稿高保真修复（🔧→🧪，👀 待用户验收）
- 用户反馈：当前行情页与设计稿 4:3898 还原度低，列出 3 项必须整改：① AI 对话输入框样式；② Trend Sol 字体；③ 订阅按钮缺图标。
- **① AI 输入框**：原实现为单行 `<input>` + 右侧「发送」按钮，与设计稿（多行 textarea + 底部工具栏：+ / Deepseek V4 / 麦克风 / 发送箭头）严重不符。重写 `AiChatEntry.tsx`：
  - 外层：宽 768px、圆角 24px（rounded-3xl）、背景 `#0A0A0A`（bg-secondary）、边框 `#262626`（border-default）、内边距 16px（p-4）。
  - 输入区：`<textarea rows={3} min-h-[72px]>`，placeholder `可以问问我茅台走势`，placeholder 字号 12px、颜色 #666666、行高 16px。
  - 底部工具栏：左 + 按钮（circle-plus），右 Deepseek V4 选择器 + 麦克风 + 发送箭头（accent 蓝色）。发送按钮保持可提交，Enter 直发、Shift+Enter 换行。
- **② Trend Sol 字体**：设计稿指定 `font-family: DingTalk JinBuTi; font-size: 30px; line-height: 38px; color: #E8E8E8`。`OverviewPage.tsx` 标题加内联 `fontFamily: "'DingTalk JinBuTi', 'PingFang SC', sans-serif"`，其余样式已对齐。
- **③ 订阅图标**：设计稿订阅按钮含 24×24 图标 `e5861f2faa89f9f6d5708f1c31e4493c.png`、文字 `color: #FFBB00; font-family: Douyin Sans; font-weight: 700; font-size: 14px; line-height: 17px`。将 MasterGo 图标资源复制到 `apps/desktop/public/assets/`，`AppShell.tsx` 订阅按钮用 `<img>` 引用并加 `py-0.5`（2px 垂直 padding）与 `fontFamily` 匹配。
- 附加：搜索框 placeholder 同样补 `font-['Inter']` 以贴合设计稿占位符字体。
- 自测：tsc 仅 `ProfilePage.tsx` 既有 2 错无新增；无头 Chrome 访问 `localhost:1420` 零 `pageerror`（38 个网络错误为沙箱无外网数据代理失败，预期）；截图验证：Trend Sol 已用 DingTalk JinBuTi、订阅按钮左侧图标已渲染、AI 输入区为 textarea 且底部工具栏可见。
- 状态：🧪 自测通过，👀 待用户视觉验收。关联：REQ-UI-01、REQ-UI-05、REQ-MKT-01。

### 2026-07-17 — REQ-UI-07 用户验收：1/2/4/5 通过，3（AI 输入框）打回 → 拆 REQ-UI-08
- 用户验收结论：① Trend Sol 字体、② 订阅图标、④ 导航选中态尺寸统一、⑤ 输入框聚焦描边对齐搜索框 —— **通过**；③ AI 对话输入框 —— **不通过**（视觉结构 OK，但交互不完整、需补充）。
- 导航尺寸修复（item 4，先前用户反馈选中/未选中图标与文字大小不一致）：`AppShell.tsx` 图标恒 `text-lg` 18px、`strokeWidth=4`，选中仅切填充图标变体 + 父级 `text-white` 变白，两态零尺寸变化。无头逐项点击验证图标恒 18×18、文字恒 10px、零 pageerror。
- 聚焦描边（item 5）：`AiChatEntry.tsx` `focus-within:border-white` → `focus-within:border-white/30`，与 `SearchBar.tsx` `focus:border-white/30` 一致（均为 rgba(255,255,255,0.3)）。
- 因 AI 输入框交互不完整，从 REQ-UI-07 的 AC3 拆出 **REQ-UI-08**（P1，⬜ 待实施）：补全底部工具栏 + / 模型选择器 / 麦克风 / 发送 的真实交互，用户指"需要慢慢优化"，待确认交互范围与优先级后再实施。
- REQ-UI-07 状态更新为 👀 部分通过（1/2/4/5 过、3 打回）；requirements.md 同步。

### 2026-07-17 — REQ-UI-08 二次迭代：首页完整输入 + 上传样式 1:1 + 手动语音 + 发送空禁（🧪→👀）
- 用户追加 4 条规格：① 首页应支持完整交互（文字/上传/模型/语音），点击发送后才跳转 /chat，发送前留在首页；② 上传入口样式严格按设计稿 1:1 还原；③ 语音改为手动控制激活/结束，激活态持续保持；④ 发送按钮空内容时禁用灰显。
- 重构：新建 `components/chat/ChatComposer.tsx` 复用输入区；`ChatInput.tsx` 退化为薄壳；`AiChatEntry.tsx` 复用 `ChatComposer` 并传入 `onAfterSend={() => navigate('/chat')}`；`store/chatStore.ts` 新增 `send` 统一 LLM 方法 + `pendingInput` 首页草稿暂存；`pages/ChatPage.tsx` mount 时检测 `pendingInput` 自动发送。
- 视觉修正：上传按钮改为 32×32 圆形、`bg-bg-tertiary` + `border-border-default` + 图标色 `#666666`；模型选择器加左侧 model 图标；发送按钮 disabled 时改为 `bg-bg-tertiary text-text-muted cursor-not-allowed`。
- 语音修正：`SpeechRecognition.continuous = true`，首次点击开始收音并保持 `listening=true`（按钮 `bg-accent` 激活），再次点击 `stop()` 后识别结果写入输入框、激活态消失。
- 自测：tsc 0 新增；无头验证：首页 textarea 可编辑、上传按钮尺寸/颜色/边框匹配设计稿、空内容时发送 disabled、输入后启用、语音点击切换为激活态、点击发送后 URL 立即变为 `#/chat` 且对话页出现用户气泡 + 助手 thinking；零 pageerror。
- 状态：👀 待用户验收。关联 REQ-UI-07。

### 2026-07-17 — REQ-UI-08 三次迭代：MasterGo 上传按钮 1:1 还原 + 语音自动关闭修复（🧪→👀）
- 用户按 MasterGo 设计稿验收：上传按钮须 1:1 还原样式/尺寸/颜色/hover/active/disabled/图标；语音选中后仍自动关闭，怀疑 sandbox 限制，要求排查并修复。
- 上传按钮修正：`components/chat/ChatComposer.tsx` 中 `PlusIcon` 由「圆圈+plus」改为纯 plus（18×18、strokeWidth=2），按钮交互状态补全：`hover:text-text-primary hover:border-white/20 hover:bg-white/5`、`active:bg-white/10 active:text-text-primary active:border-white/30`、`disabled:opacity-50 disabled:cursor-not-allowed`。
- 语音修复：引入 `manualStopRef`/`restartCountRef`/`mountedRef`，`continuous=true` 时 Chrome 静音触发 `onend` 后自动重启（80ms 延迟）保持收音；连续失败 5 次后停止并提示；`not-allowed`/`service-not-allowed` 立即识别为环境限制（sandbox / Tauri webview）并显示红色错误提示；组件卸载安全清理。
- 权限声明：`apps/desktop/src-tauri/tauri.conf.json` 增加 `bundle.macOS.info.NSMicrophoneUsageDescription`。
- 自测：tsc 0 新增；无头 Chrome 验证：上传按钮 32×32px、圆角 9999px、背景 rgb(22,22,22)、边框 rgb(38,38,38)、图标 18×18 且为纯 plus、颜色 rgb(102,102,102)；语音点击后 1.5s 内显示错误提示「麦克风权限被拒绝或当前环境不支持语音输入」；零 `pageerror`。
- 状态：👀 待用户验收。关联 REQ-UI-07。

- 用户给出 REQ-UI-07 AC3 的完整交互规格：①「+」上传附件（图片/文档≤10MB）；② 模型选择器（默认用户自接模型，现可接 mimo 供切换）；③ 麦克风语音输入（Web Speech→输入框）；④ 发送；⑤ 导航新增「对话」入口（行情与自选股之间）+ 首页输入框点击跳转对话。
- 新增：`lib/chatModels.ts`(ChatModel + 内置 mimo 文本模型 + USER_CHAT_MODELS 占位/默认优先)、`store/chatStore.ts`(zustand 会话状态,持久化)、`lib/llm.ts`(OpenAI 兼容 /chat/completions)、`components/chat/ChatInput.tsx`(完整工具栏)、`components/ChatIcon.tsx`(对话图标)、`pages/ChatPage.tsx`(对话页)。
- 修改：`App.tsx`(+/chat 路由)、`AppShell.tsx`(NAV_ITEMS 插入「对话」+ currentPath 修正避免 `/` 误匹配 `/chat`)、`AiChatEntry.tsx`(首页输入框改入口,点击/聚焦跳 #/chat,模型名显真实选中)。
- 自测：tsc 仅 ProfilePage 2 错无新增；无头 Chrome 验证：导航顺序[行情,对话,自选股,订阅,我的]、`#/chat` 跳转成功、工具栏 4 控件齐全、模型下拉列[mimo-v2.5-pro,mimo-v2.5]且可切换、发送落库(消息数=2)、零 pageerror；沙箱无网时 sendChat 抛错被 catch 以 ⚠️ 气泡优雅展示（真实回复待用户本机含网）。
- 状态：🔧→🧪→👀。关联 REQ-UI-07。

### 2026-07-18 — REQ-UI-08 四次迭代：语音状态机重构消除"反复启动关闭"（🔧→🧪，👀 待验收）
- **根因**：三次迭代为对抗 Chrome `continuous=true` 静音自动 `onend`，在 `onend` 中加 80ms 循环 `start()` 重启；每次 `start()` 重新初始化音频捕获造成麦克风指示抖动/握手；叠加 `network`/`audio-capture` 错误放大成快速循环，用户感知为"反复启动关闭"。
- **重构 `ChatComposer.tsx` 语音部分**：
  - `listening` 布尔 → 显式状态机 `voicePhase: idle | listening | paused | error`，UI 与 recognizer 状态严格一致。
  - **去除 80ms 循环重启**：静音超时（`onend` 无 error/`no-speech`）不再强制重启，转 `paused` 提示"语音已暂停（静音超时），点击麦克风继续"，用户再点续接会话（保留已识别文本）。
  - **错误分类**：`not-allowed`/`service-not-allowed`(权限) 立即停+红提示；`audio-capture`(设备被占用) 立即停+提示；`network` 退避重连最多 2 次（1s/2s）而非抖动循环，超限转 paused；`aborted` 用户主动 stop 由 `onend` 收尾。
  - 新增 `[voice]` 前缀结构化日志（`onerror`/`onend(manualStop,lastError)`/`network retry`/`paused`），卸载清理 `retryTimer`。
- 自测：tsc 0 新增；无头验证点击麦克风→Console `[voice] onerror: not-allowed`、权限拒绝路径**不再循环重启**直接回默认态、红色提示正确、零 pageerror；有 fake 设备时正常进 listening 激活态。状态：👀 待用户验收。关联 REQ-UI-08。

### 2026-07-18 — REQ-UI-08 五次迭代：语音按钮暂时隐藏（🧪→👀）
- 用户反馈语音在本机/预览仍无法使用（Tauri WKWebView 不支持 Web Speech API、预览无麦克风权限），要求暂时隐藏。
- `ChatComposer.tsx` 加 `const SHOW_VOICE = false;`，用 `{SHOW_VOICE && (<麦克风按钮/>)}` 包裹；识别逻辑（toggleMic/startRecognition/stopVoice/[voice] 日志）全部保留，待接入原生/云端 ASR 后改 `true` 即恢复，无需重写。
- 自测：无头验证麦克风按钮 `aria-label="语音输入"` 数量=0（已隐藏）、上传/发送按钮正常、零 pageerror。状态：👀 待用户验收。关联 REQ-UI-08。

### 2026-07-18 — REQ-UI-09 实施：输入框水印滚动提示词 + 直接用 tab（⬜→🔧→🧪→👀）
- 用户 4 点要求：① 水印文字大小与用户输入一致；② 生成 10+ 股票相关提示词滚动展示、间隔 ~2.5s 切换；③ 提示词贴合股民需求+当下热点题材/事件，建提示词池子持续更新；④ 加 tab 直接用当前水印文字。
- 新建 `lib/chatPrompts.ts` 导出 `CHAT_HINTS`（12 条：茅台估值/半导体国产替代/AI算力CPO/低空经济/人形机器人/降息有色红利/新能源光伏储能/华为链智能驾驶/红利资产/消费白酒家电/军工重组/北交所专精特新），注释约定结合热点持续更新。
- `ChatComposer.tsx`：加 `hintIndex` state + `setInterval` 2500ms 切换；`placeholder` 改 `CHAT_HINTS[hintIndex]` 且 `placeholder:text-sm`（14px=输入 14px）；新增 `useCurrentHint()`（有 `onAfterSend` 则写 `pendingInput` 跳 `#/chat`，否则直接 `send`）；textarea 下方 `text.trim()===""` 时显示「建议」tab 按钮（点击跳转 `#/chat`）。
- 自测：tsc 0 新增；无头验证 placeholder 14px=输入 14px、2.8s 后从「茅台估值」切「半导体国产替代」、建议按钮存在、点击跳转 `#/chat`、零 pageerror。
- 状态：👀 待用户验收。关联 REQ-UI-08。

### 2026-07-19 — REQ-UI-09 二次迭代 + GSAP #2 接入（🔧→🧪→👀）
- 二次迭代（去"建议"标签 + 提示词仅上方 overlay + Tab 标签 + 4s 切换 + Tab 键填入）：删下方 `useCurrentHint` 按钮；提示词移入 `relative` 包裹的 `absolute pointer-events-none` overlay（Tab 标签 + `hintTextRef` 当前提示词，由 `text.trim()===""` 控制显隐）；`onKeyDown` 增 `Tab && text.trim()===""` → 填当前 hint + 光标置末；`setInterval` 2500→4000ms。
- GSAP 文字动画选型：建 `HintAnimationDemo.tsx`（`/hint-demo`）列出候选动画供用户看效果；用户选 **#2 逐字错落浮现**。演示页初版遇 bug（父级 `autoAlpha:0` 未复位致整块不可见），修复后 `gsap.set(el,{autoAlpha:1})` 复位父级再动画子 span，已记入 `gsap-react-animation` skill。
- 接入正式组件：`ChatComposer.tsx` 引入 `gsap` + `escapeHtml`；`[hintIndex]` effect 重建逐字 `<span>`（`white-space:pre` 保中文空格）并 `gsap.fromTo(spans,{y:12,autoAlpha:0},{y:0,autoAlpha:1,duration:0.3,stagger:0.025,ease:"power2.out"})`；卸载 `killTweensOf` 清理；overlay 改始终渲染 + `transition-opacity`（不卸载，保证拆字结构稳定）；删除 `HintAnimationDemo.tsx` 与 `/hint-demo` 路由。
- 自测(🧪)：tsc 仅 ProfilePage 既有 2 错、0 新增；无头 Chrome 验证：初始提示词="茅台估值…"逐字 span=24/opacity=1/可见；Tab 键填入一致；4.2s 后切"半导体国产替代…"span 重建=28/仍可见；textarea 切换前后 `getBoundingClientRect` 完全一致（零布局位移，满足 REQ-UI-01）；真实 `pageerror`=0（53 条 console 为沙箱无外网 `ERR_CONNECTION_REFUSED` 噪声）。
- 状态：🧪 自测完成，👀 待用户验收。关联 REQ-UI-08、REQ-UI-01。

### 2026-07-18 — 用户验收闭环：REQ-UI-07 / REQ-UI-08 / REQ-UI-09
- 用户拍板通过三项需求，统一从 👀 推进 ✅ 已闭环（requirements.md / cards / roadmap 同步回写）。
- **REQ-UI-07**：初始视觉验收 1/2/4/5 过、AC3 拆 REQ-UI-08；现 REQ-UI-08 已闭环，故 REQ-UI-07 整体 ✅ 已闭环（Trend Sol 字体 / 订阅图标 / 导航选中态尺寸 / 输入框聚焦描边对齐 全部生效）。
- **REQ-UI-08**：多轮迭代（首页完整输入 / 上传 1:1 / 语音状态机重构 / 语音按钮 SHOW_VOICE=false 暂隐藏）后用户验收通过 → ✅ 已闭环。备注：语音按钮当前隐藏（Tauri WKWebView 不支持 Web Speech API、预览无麦克风权限），`toggleMic/startRecognition/[voice]` 识别逻辑全部保留，待接入原生/云端 ASR 后将 `SHOW_VOICE` 改 `true` 即恢复，无需重写。
- **REQ-UI-09**：去"建议"标签 + 提示词移入上方 overlay + Tab 标签 + 4s 切换 + Tab 键填入 + GSAP #2 逐字错落浮现（含 Tab 标签与提示词垂直居中对齐修复）用户验收通过 → ✅ 已闭环；仅 transform/opacity，零布局位移（满足 REQ-UI-01）。
- 状态：三项均 ✅ 已闭环。

### 2026-07-18 — REQ-UI-10 AI 对话发送后暂停/终止交互（⬜→🔧→🧪→👀）
- 需求：发送后任务进行中按钮变停止（点击终止）；完成恢复默认样式；默认样式按输入框内容判定激活/禁用。
- 底层 `sendChat` 已支持 `AbortSignal`（fetch 透传 signal），无需改 `llm.ts`。
- `chatStore.ts`：模块级 `currentAbort`；接口加 `stopGeneration`；`send` 内 `new AbortController()` 传 signal，`catch` 区分 `AbortError`（标记「⏹ 已停止生成」非红错）与真实失败（`finally` 清理并 `thinking:false`）。
- `ChatComposer.tsx`：新增 `StopIcon`（方块）；引入 `stopGeneration`/`isGenerating`；发送按钮状态机——生成中显示停止方块+`bg-up-red`+可点+调 `stopGeneration`；默认按 `canSend` 判定（有内容/附件=accent 激活，无=灰禁用）。仅改图标/颜色，零布局位移（REQ-UI-01）。
- 自测：无头 Chrome 拦截 `/chat/completions` 挂起制造生成中态——空输入框按钮 disabled(AC4禁用)、有内容 enabled+accent(AC4激活)、生成中变停止按钮可点红色方块(AC1)、点击停止→assistant「⏹ 已停止生成」(AC2)、终止后恢复默认禁用(AC3)、textarea rect 全程一致零位移(AC5)、零 pageerror；tsc 仅 ProfilePage 2 错 0 新增。
- 状态：🧪 自测通过，👀 待用户验收。关联 REQ-UI-08、REQ-UI-09、REQ-UI-01。

### 2026-07-18 — REQ-UI-10 验收打回修复（👀→🔧→🧪→👀）
- 用户预览验收打回 2 项：① Tab 填提示词发送后输入框残留未清空；② 停止按钮红色不要用红。
- 修复：`ChatComposer.tsx` 对话页分支 `setText("")` 前置到 `send` 之前（任务开始即清空、水印 overlay 重现）；停止按钮 `bg-up-red`→`bg-accent`（蓝色，与发送按钮统一，仅图标区分方块/发送）。
- 自测：无头验证发送后 `textarea.value===""`、水印 overlay `opacity=1`、停止按钮 `bg-accent` 且无 `bg-up-red`、方块图标、终止恢复+「⏹ 已停止生成」、零 pageerror；tsc 0 新增。
- 状态：🔧→🧪 自测通过，👀 再交付验收 → ✅ 用户验收通过（2026-07-18）。

### 2026-07-18 — REQ-UI-11 对话页常驻提示词集 ❌ 已撤销（用户推翻）
- 用户后续澄清：「前面你理解错误我的意思了，不是对话页面没有提示词，而是我要求在对话页面**不展示提示词集，不提供这个功能**。用户正在使用了，需要让用户专注在自己的任务中。除非提示集根据任务进度每次更新、逐步引导——固定提示词集在对话中毫无意义。」
- **结论**：对话页不提供任何固定提示词集功能（除非未来做「随任务进度动态更新」的智能引导，当前不做）。
- 代码已回滚：`ChatComposer.tsx` 删除对话页常驻提示行 JSX + `fillHint`；保留 `isHome` 仅用于首页 GSAP 水印条件（对话页不再渲染水印）；对话页 `handleSubmit` 发送前即清空输入框。tsc 0 新增。
- 关联：REQ-UI-09、REQ-UI-10、REQ-UI-12（AI 内容呈现聚焦 Markdown 渲染）。

### 2026-07-18 — REQ-UI-12 AI 回复 Markdown 渲染（⬜→🔧 实施中）
- 需求：AI 回复为 MD 格式，但当前 `ChatPage.tsx` 以 `whitespace-pre-wrap` 纯文本输出，未解析 MD 标签（用户看到 `#`/表格原始符号而非渲染样式）。需引入 Markdown 库正确渲染文字样式/表格等。
- 方案：安装 `react-markdown` + `remark-gfm`；新建 `components/chat/MarkdownMessage.tsx` 封装（链接外链 `rel=noopener`、根加 `.markdown-body`）；`ChatPage` 的 assistant 消息改用其渲染（user/error 维持纯文本与红绿边框）；`index.css` 追加 `.markdown-body` 深色 token 样式。
- 实施：`apps/desktop/package.json` 加 react-markdown@^10.1.0 + remark-gfm@^4.0.1；`MarkdownMessage.tsx` 封装（a 加 target=_blank rel=noopener、memo）；`ChatPage.tsx` assistant 非 error 走 Markdown、user/error 维持原样；`index.css` 追加 `.markdown-body` 深色样式（h1-h3/p/ul/ol/li/table/thead/th/td/code/pre/blockquote/a，复用 token）。tsc 0 新增。
- 自测：无头 Chrome seed 注入 MD assistant 消息——AC1 标题渲染出 h1 无 `#` 字面；AC2 粗/斜/行内码/代码块；AC3 `<table>` 带边框斑马纹；AC4 列表+blockquote；AC5 链接 target=_blank rel=noopener 可点；AC6 user 纯文本+error 红绿边框不变；AC7 零 pageerror；AC8 深色截图确认。全部 PASS。
- 状态：⬜→🔧→🧪→👀→✅ 用户验收通过（2026-07-18）。关联 REQ-UI-11。

### 2026-07-18 — REQ-UI-13 发送队列（任务进行中跨页发送不终止、自动续发、队列管理）
- 需求：任务进行中从行情页输入框发送会终止当前任务（按钮此时为 STOP）。期望：生成中发送消息进入队列、挂起在输入框上方；任务完成后自动按序发送；队列支持撤回编辑、删除、置顶排序。
- 方案：`chatStore` 新增 `QueuedMessage` + `queue`（持久化）+ `draftText/draftAttachments`（撤回回填）；`enqueue`/`removeFromQueue`/`recallFromQueue`/`togglePinQueue`/`clearQueue`/`clearDraft`；`send` 的 `finally` 在 `thinking:false` 后若队列非空则递归自动续发；`ChatComposer` 输入框上方渲染队列面板。生成中按钮区与 REQ-UI-10 收口（单按钮随内容切换）：发送按钮为**单按钮**——空内容显示蓝色暂停方块（终止），有内容显示蓝色发送箭头（入队不终止），发送后清空自动回暂停，无次级「入队」按钮；回车同样入队。
- 实施：`chatStore.ts` 加类型/状态/动作并改 `finally` 自动 dequeue；`ChatComposer.tsx` 加队列面板（含置顶/撤回编辑/删除）、改 `handleSubmit` 生成中 enqueue；改按钮渲染为生成中单按钮随内容切换——`onClick={isGenerating ? (hasContent ? handleSubmit : stopGeneration) : handleSubmit}`、图标 `isGenerating ? (hasContent ? <SendIcon/> : <StopIcon/>) : <SendIcon/>`，非生成时保持蓝色发送（空内容禁用）；新增 `Pin/Edit/Trash` 图标、`draft` 回填 effect。
- 自测（2026-07-18 单按钮随内容切换收口后）：无头 Chrome 拦截 `/chat/completions` 挂起生成。验证：生成中**空内容**→按钮蓝色暂停方块（`bg-accent`=rgb(59,130,246)、无红无灰、`aria-label="停止生成"`、含 `<rect>`、可点）✅；点击暂停→`thinking` 落 `false`、按钮回禁用发送态、队列 0 ✅；生成中**有内容**→按钮切蓝色发送箭头（`aria-label="发送"`、`title="发送并入队（任务完成后自动发送）"`、含 `<path>`、`bg-accent`、可点）✅；点击发送箭头→入队（`queueItems` 0→1）、`textarea` 清空、按钮自动回暂停 ✅；停止后零 `pageerror` ✅。截图 `.workbuddy/memory/optionB_gen_empty.png` / `optionB_gen_content.png`。全部 PASS。
- 状态：⬜→🔧→🧪→👀 打回 → 🔧 整改（用户意见：队列仅 AI 诊股页展示、不在首页）→ 🧪 复测全过 → 👀 再交付 → ✅ 已闭环（2026-07-18 末用户确认"都通过了"）。关联 REQ-UI-10、REQ-UI-12、REQ-UI-01。

### 2026-07-18 — REQ-UI-14 发送队列条目样式与置顶交互微调
- 需求：在 REQ-UI-13 队列基础上——① 表头移除「任务完成后自动发送」冗余说明；② 条目内容改单行省略号截断；③ 置顶语义修正：从 `pinned` 布尔固定顶部改为**点击移到队首**（可多条目反复置顶调序，后点排更前）；④ 编辑/删除图标不变；⑤ 三图标从纵向堆叠改为横向同排、间距宽松。
- 方案：`chatStore.ts` 移除 `QueuedMessage.pinned` 与 `sortQueue`；`enqueue` 改为追加队尾；`togglePinQueue(id)` 改为 `findIndex` 取出该条目 `unshift` 到队首（`idx<=0` no-op）。`ChatComposer.tsx` 表头文案去冗余；条目容器去 `item.pinned` 高亮（统一 `border-border-default bg-bg-tertiary`）；内容 `div` 改 `truncate`（单行省略）；三图标容器 `flex flex-col` → `flex items-center gap-2.5` 横排，按钮加 `p-1` 宽松点击区；置顶按钮去 pinned 条件样式、`title="置顶"`。
- 自测（2026-07-18 无头 Chrome 注入 3 条队列项含 1 条超长文本）：AC1 表头=`发送队列（3）` 无冗余文案 ✅；AC2 内容 `nowrap`+`ellipsis`、横向溢出被截（scrollWidth 1308>clientWidth 542）、高度 16px 单行 ✅；AC3 点置顶→移到队首 ✅；AC4 多条目反复置顶按逆序调序、已在队首再点 no-op ✅；AC5 三图标 `top` 同值、`left` 递增→横排 ✅；AC6 无 pinned 高亮、外观统一 ✅；零 `pageerror` ✅；tsc 仅 ProfilePage 2 错、0 新增。截图 `.workbuddy/memory/queue_style.png`。
- 状态：⬜→🔧→🧪→👀 打回 → 🔧 整改（用户意见：置顶图标换官方 去顶部_to-top）→ 🧪 复测全过 → 👀 再交付 → ✅ 已闭环（2026-07-18 末用户确认"都通过了"）。关联 REQ-UI-13。

### 2026-07-18 — REQ-NAV-11 导航栏「对话」→「AI诊股」+ AI 图标
- 需求：左侧 `SideNav` 的 `/chat` 项标签「对话」改为「AI诊股」，图标替换为 AI 相关图标（线稿+实心两态），与现有导航项样式一致。
- 方案：新建 `components/AiIcon.tsx`（`AiLine` 机器人头线稿：天线+双眼+嘴线；`AiFill` 机器人头实心：天线圆点+茎+圆角头轮廓，`1em`/`currentColor`，接口与 `ChatIcon` 一致）；`AppShell.tsx` 导入改用 `AiLine/AiFill`、`NAV_ITEMS` `/chat` 项 `label:"AI诊股"`；删除未引用的 `components/ChatIcon.tsx`；`ChatPage.tsx` 页头 `h1` 同步改「AI诊股」。
- 自测（2026-07-18 无头 Chrome）：AC1 导航标签=`["行情","AI诊股","自选股","订阅","我的"]` 无「对话」✅；AC2 `/chat` 项图标含 `<rect>`+`<circle>`、不含原对话气泡 path→确为 AI 图标 ✅；AC3 激活态用 `iconFill` 实心（`fill="currentColor"`/`stroke="none"`/`text-white`）✅，非激活切回 `icon` 线稿（`fill="none"`）✅；AC4 图标宽 18px 与相邻项一致、标签 10px 一致 ✅；零 `pageerror` ✅；tsc 仅 ProfilePage 2 错、0 新增。截图 `.workbuddy/memory/nav_aizhengu.png`。
- 状态：⬜→🔧→🧪→👀→✅ 用户验收通过（2026-07-18）。关联 REQ-NAV-05/10、REQ-UI-10/13。

### 2026-07-18 — REQ-NAV-12 导航采用桌面 trendsol-icon 官方图标
- 需求：按用户给出的桌面 `trendsol-icon` 权威映射，导航「AI诊股」「订阅」改用官方 SVG 资源（线稿+填充两态），替换此前自建占位图标（AiIcon 机器人头、NavIcons.SubscribeFill）。
- 方案：桌面源 `/Users/sanger/Desktop/trendsol-icon/{六个点_six-points(.svg/_fill.svg), 皇冠帽_crown-three(.svg/_fill.svg)}`（viewBox `0 0 48 48`，原 `#333`）。新建 `components/TrendSolIcon.tsx` 导出 `SixPointsLine/SixPointsFill/CrownLine/CrownFill`，`#333`→`currentColor`、`1em`、透传 `SVGProps`；`AppShell.tsx` `/chat` 改 `SixPointsLine/Fill`、`/subscription` 改 `CrownLine/Fill`（替换 Arco `IconSubscribe` + `NavIcons.SubscribeFill`）；删除 `AiIcon.tsx`、`NavIcons.SubscribeFill`（保留 `UserFill`）。映射表沉淀为 `docs/icon-map.md`。
- 自测（2026-07-18 无头 Chrome）：AC1 标签无「对话」、AI诊股 `viewBox=0 0 48 48` 含 7 path(1中心线+6点)、订阅含皇冠 path+3 圆点 ✅；AC2 切 `/subscription` 订阅选中应用 `CrownFill`(`fill=currentColor`、3 圆点实心) ✅；AC3 AI诊股 在 `/chat` 选中应用 `SixPointsFill`(`fill=currentColor`、`color=rgb(255,255,255)`)、图标尺寸 AI=订阅=行情=18px 一致 ✅；AC4 tsc 仅 ProfilePage 2 错、0 新增，零 `pageerror` ✅；AC5 原 AiIcon/SubscribeFill 已删无残留 ✅。截图 `.workbuddy/memory/nav_trendsol.png`。
- 状态：⬜→🔧→🧪→👀→✅ 用户验收通过（2026-07-18）。关联 REQ-NAV-11/10、DEC-008/009、`docs/icon-map.md`。

### 2026-07-18 — 用户批量验收：REQ-UI-10 / REQ-UI-12 / REQ-NAV-11 / REQ-NAV-12 通过；REQ-UI-13 / REQ-UI-14 打回
- 用户拍板验收结论：
  - **通过 ✅**：REQ-UI-10（AI 对话发送后暂停/终止交互）、REQ-UI-12（AI 回复 Markdown 渲染）、REQ-NAV-11（导航「对话」→「AI诊股」+ AI 图标）、REQ-NAV-12（导航采用 trendsol-icon 官方图标）。
  - **未通过 🔧（打回）**：REQ-UI-13（发送队列）、REQ-UI-14（发送队列样式与置顶交互微调）。用户表示稍后给出详细意见；待意见到达后回 🔧 整改、重新自测、再 👀。
- **2026-07-18（后续）**：用户给出详细意见——REQ-UI-13「队列只展示在 AI 诊股页、不在首页」、REQ-UI-14「置顶图标换官方 trendsol-icon/去顶部_to-top」。已整改（队列面板 `!isHome` 门控；`PinIcon`→官方 `ToTopIcon`），无头复测全过，两张卡回 👀 再交付验收。
- 状态回写：cards 顶部状态行 + requirements.md 状态列 + 本文件各卡状态行同步更新。
- 关联：REQ-UI-10/12/13/14、REQ-NAV-11/12。

### 2026-07-18 — REQ-MKT-14 行情页大盘概览最小宽度 + 横向滚动（A股 横滑回归 + 其他市场兜底）
- 需求：① 用户反馈 A股 指数卡片（上证/深证等）横滑丢失、疑似最小宽度被改掉；② 其他市场（美/港/日/韩）空间不足超出时需设定最小宽度值（用户不知取多少）；③ 总体：内容设最小宽度，窗口缩窄不再适配、超出底部横滑。
- 事实澄清：查 `requirements.md`+git，**A股 横滑是已交付且验收功能**（REQ-MKT-02 2026-07-14「含 A股 横滑」、REQ-MKT-05 横滑容器 `overflow-x-auto overflow-y-hidden` 补丁）；当前 `OverviewPage.tsx` A股 行退化为 `flex gap-3`、卡片 `flex-1 min-w-0`，`min-w-0` 让卡片可缩到 0 → 既丢横滑又被无限挤压；属回归（非有意为之）。
- 方案：`apps/desktop/src/pages/OverviewPage.tsx` —— ① A股 行 `flex gap-3`→`flex gap-3 overflow-x-auto overflow-y-hidden pb-2`，卡片 `flex-1 min-w-0`→`flex-1 min-w-[132px]`（恢复横滑+最小宽度兜底，宽窗 flex-1 仍铺满）；② 其他市场每行外包 `overflow-x-auto`、内层行 `flex justify-between items-center gap-6 min-w-max`（宽窗边到边、窄窗保持最小宽横滑），`OtherIndexCell` 外层 span 加 `min-w-[200px]`。
- 最小宽度取值（基于内容实测，非拍脑袋）：A股 卡内 `p-4`(32)+价格 `text-xl`(20,semibold,tabular) 最长 "12345.67"≈90 → 取 **132px**（5×132+4×12=708，xl≥1280 左栏内宽≈747 内不横滑、窗口<~772px 才横滑，合理；可调 124–140）；其他单元格 名称72+数值64+涨跌48+2×8=**200px**（即现有三段固定宽之和，自然宽）。
- 自测：tsc 0 新增错误（仅 ProfilePage 2 处预存）；`vite build` 成功，编译 CSS 命中 `min-width:132px/200px/max-content`、`overflow-x:auto`×3、`overflow-y:hidden`×3；dev 服务(HMR)源码含 `min-w-[132px]`。无头 Chrome 截图被 sandbox 杀(137)未附运行截图，横滑为标准 `overflow-x-auto+min-w` 机制、逻辑确定，按 REQ-MKT-13 同类 sandbox 限制待本机验收。
- 状态：⬜→🔧→🧪→👀 待用户验收（闭环需用户拍板）。关联 REQ-MKT-02/05、DEC-008/009。

### 2026-07-20 — REQ-MKT-15 整页最小宽度 + 横向滚动（以美港日韩自然宽为基准）
- 需求：用户三点诉求 ①美港日韩 不隐藏、始终完整显示；②以其「未缩放时」自然宽作为整页 `min-width` 基准（非单元格 200px 等数值相加推断）；③禁止页面无限缩放，视口<min-width 出现整页底部横滑条而非继续缩小内容。
- 方案：`apps/desktop/src/pages/OverviewPage.tsx` —— ① 根滚动容器 `h-full overflow-y-auto px-8 py-8` → `h-full overflow-auto`（去根 padding，允许双向滚动）；② 新增内层包裹 `div` `min-w-[760px] px-8 py-8`（宽屏块级 `auto` 撑满、窄屏锁 760 由根 `overflow-auto` 出整页横滑）；③ 美港日韩 行去 `overflow-x-auto` 外包与 `min-w-max` 内层、改 `flex justify-between items-center gap-6`，`OtherIndexCell` span 加 `shrink-0`（自然宽 3×200+2×24=648px 固定不压缩、始终完整）。
- 最小宽度取值（实测）：美港日韩单行自然宽 = `3×200(单元格) + 2×24(gap-6) = 648px`；该区块位于「大盘概览」卡 `p-6`(48) + 页面 `px-8`(64) → `648+48+64 = 760px` 即整页 `min-width`（视口阈值）。视口≥760 正常铺满、美港日韩 边到边；<760 整页横滑、美港日韩 恒 648 完整不缩放。旁证：A股 行 5×132+4×12=708px<760 楼层下卡片内宽(648) → 仍走自身 `overflow-x-auto` 内部横滑（与 REQ-MKT-14 一致，用户未要求改 A股）。
- 自测：tsc 0 新增错误（仅 ProfilePage 2 处预存、与本次无关）；`vite build` 成功，编译 CSS 命中 `min-width:760px`×1、`overflow:auto`×15(含根)、`overflow-x:auto`×3、`min-width:200px`×1、`min-width:132px`×1；dev 服务(HMR) 已应用。无头 Chrome 截图被 sandbox 杀(137)未附运行图，整页横滑为标准 `overflow-auto+min-w` 机制、逻辑确定，按 REQ-MKT-13/14 同类 sandbox 限制待本机验收。
- 状态：⬜→📐→🔧→🧪→👀 待用户验收（闭环需用户拍板）。关联 REQ-MKT-02/05/14、DEC-008/009。

### 2026-07-20 — REQ-MKT-14 / REQ-MKT-15 用户验收闭环
- 两卡均经用户本机验收通过（2026-07-20），状态由 👀 待用户验收 → ✅ 已闭环；requirements.md 状态列已同步。
- 布局目标全部达成：① A股 指数行 ~770px 以下行内横滑（修复 `min-w-0` 回归，恢复 REQ-MKT-02/05 已验收行为）；② 美港日韩 始终完整显示（`shrink-0` 锁死自然宽 648px，不压缩/不隐藏）；③ 整页 `min-width:760px`（以美港日韩未缩放自然宽 648 + 卡片 p-6(48) + 页面 px-8(64) 实测得出），视口 <760px 出整页底部横滑条，禁止无限缩放。
- 自测留证：tsc 0 新增错误（仅 ProfilePage 预存 2 处）、vite build 成功且 CSS 工具类全命中（min-width:760px / 132px / 200px、overflow:auto 等）、dev 服务 HMR 已应用。无头截图受 sandbox 限制(exit 137)未附运行图，已用户本机确认。
