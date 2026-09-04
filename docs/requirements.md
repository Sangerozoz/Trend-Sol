# 需求规格（Requirements）

> 本文档是 Trend IQ 的**需求唯一来源（source of truth）**。
> 每条需求有稳定编号 `REQ-<域>-<序号>`，供 `roadmap.md` 关联追踪、`decisions.md` 引用。
> 状态变更请同步回写本表，并在 `roadmap.md` 实施记录中留痕。

## 状态图例
- ✅ 已交付：代码已实现并验证
- 🟡 已决策/部分：方向已定或部分落地
- ⬜ 待做：尚未实施
- 🚫 明确不做：本期范围外

---

## R1 数据层（DATA）

| 编号 | 需求 | 优先级 | 状态 | 关联阶段 | 说明 |
|---|---|---|---|---|---|
| REQ-DATA-01 | K 线仅支持日 K / 周 K / 月 K 三种周期 | P0 | ✅ 已交付 | 1.1 | Period 类型已收敛为 3 种，不支持分钟线 |
| REQ-DATA-02 | 交易时段行情与 K 线 4 秒刷新 | P0 | 🟡 已决策 | 1.2 | 刷新频率已定，待接入总览/个股页 |
| REQ-DATA-03 | 数据源按 东方财富→新浪→腾讯→Yahoo 方法级 fallback（同花顺无免费API已弃用） | P0 | 🟡 已决策 | 1.1 | 按方法独立 fallback，可拼接；框架已定；新浪于 REQ-DATA-12 接入 |
| REQ-DATA-04 | Rust 后端原生采集（启动即采＋定时＋按需），本地缓存 JSON 优先 | P0 | 🟡 已决策 | 1.1 | collector.rs 已实现，缓存机制待完善 |
| REQ-DATA-05 | 前端只读取采集结果，不直接调数据接口 | P0 | 🟡 已决策 | 1.1 | 前端经 LocalCacheProvider 读缓存 |
| REQ-DATA-06 | 大盘指数 Provider（上证/深证/创业板实时） | P1 | ⬜ 待做 | 1.2 | 全局顶栏＋总览页需要 |
| REQ-DATA-07 | 板块行情 Provider（申万一级涨跌排行） | P1 | ⬜ 待做 | 1.2 | 总览页板块模块需要 |
| REQ-DATA-12 | 接入新浪财经数据源（大盘指数 + 个股兜底），插入 fallback 链 东财→新浪→腾讯→雅虎 | P0 | ✅ 已闭环 | 1.2 | 用户环境新浪可用、东财大盘失败；已实施并自测，待本机刷新确认；关联 REQ-MKT-01、REQ-DATA-03 |
| REQ-DATA-13 | 修复道琼斯指数取数错标：腾讯代码 `usDJIA` 误解析为「Dow 30 Covered Call ETF」(22.32)，改为 `usDJI`（道琼斯指数≈52500）；并加腾讯指数查询 ETF/Fund 名称守卫防止同类错标短路 | P1 | ✅ 已闭环 | 0.5 | 根因：道指 def.codes.tencent 误写 `usDJIA`→ETF；实测腾讯 `usDJI` 返回正确指数、`usSPX/usN225/usKS11` 为 no-match（靠雅虎兜底）；`packages/data/src/market-index-defs.ts` 改 `usDJIA`→`usDJI`，`providers/tencent.ts` getMarketIndex 加 `ETF/ETN/Fund/Fds/Trust` 名称守卫；关联 REQ-DATA-03、REQ-MKT-01 |

## R2 UI / 设计（UI）

| 编号 | 需求 | 优先级 | 状态 | 关联阶段 | 说明 |
|---|---|---|---|---|---|
| REQ-UI-01 | 背景纯黑 `#000000`，面板深黑灰 token | P0 | ✅ 已交付 | 1.1 | bg-secondary #0a0a0a / tertiary #161616 / elevated #1f1f1f；编译 CSS 已验证无蓝灰 |
| REQ-UI-02 | 画线高饱和度配色，色相拉开；K 线红涨绿跌（A 股惯例） | P0 | ✅ 已闭环 | 1.1 | colors.ts 高饱和线色 |
| REQ-UI-03 | 现价线用 KLineCharts 内置 `priceMark.last` 常驻，不自定义不开关 | P0 | ✅ 已交付 | 1.1 | 移除重复自定义现价线 |
| REQ-UI-04 | 形态识别用 overlay 线＋半透明面（rect 叠加） | P1 | 🟡 已决策 | 1.3 | 不堆标签，避免重叠 |
| REQ-UI-05 | Arco 仅用于图标/表格/弹窗/表单/日期选择器；主框架自写 Tailwind | P1 | ✅ 已交付 | 1.1 | `@arco-design/web-react` 已接入，条件单演示落地 |
| REQ-UI-06 | 纯黑主题（亮色是否做待确认） | P1 | 🚫 明确不做(待确认) | — | 用户定纯黑；亮色主题默认取消，见 DEC-001 |
| REQ-UI-07 | 行情页 MasterGo 设计稿高保真修复：Trend Sol 字体（DingTalk JinBuTi）、订阅按钮图标（24×24 + Douyin Sans）、导航选中态尺寸统一、输入框聚焦描边对齐搜索框 | P0 | ✅ 已闭环 | 1.2 | 设计稿 4:3898；AI 输入框视觉结构过、交互不完整转 REQ-UI-08；2026-07-18 用户验收通过（AC3 随 REQ-UI-08 闭环整体闭环）；关联 REQ-UI-01、REQ-UI-05、REQ-UI-08 |
| REQ-UI-08 | AI 对话输入框交互补全 + 对话导航入口（首页完整输入 / 上传样式1:1设计稿 / 手动语音 / 发送空禁 / 发送后跳转 /chat） | P1 | ✅ 已闭环 | 1.2 | 由 REQ-UI-07 的 AC3 拆出；多轮迭代（首页完整输入/上传1:1/语音状态机/语音隐藏）后 2026-07-18 用户验收通过；语音按钮 SHOW_VOICE=false 暂隐藏、识别逻辑保留；关联 REQ-UI-07 |
| REQ-UI-09 | 输入框水印提示词（提示词仅显示于输入框上方 overlay + Tab 标签 / 按 Tab 键填入 / 提示词池12条滚动 4s / 股票热点提示词 / 切换用 GSAP #2 逐字错落浮现） | P1 | ✅ 已闭环 | 1.2 | ChatComposer：去"建议"按钮、提示词移入上方 overlay+Tab 标签、interval 4s、Tab 键填值；GSAP #2 逐字错落浮现已接入（仅 transform/opacity，零布局位移）；Tab 标签与提示词垂直居中对齐；2026-07-18 用户验收通过；tsc 0 新增、无头零 JS 报错(53 条为沙箱无外网噪声)；AC2/AC4 达成；关联 REQ-UI-08、REQ-UI-01 |
| REQ-UI-10 | AI 对话发送后暂停/终止交互（发送中按钮变停止蓝色可点终止 / 完成恢复默认样式 / 发送后立即清空输入框 / 默认样式按内容激活或禁用） | P1 | ✅ 已闭环 | 1.2 | ChatComposer.thinking 态发送按钮→停止按钮(■,bg-accent 蓝)可点终止、发送前清空输入框回到默认态；chatStore 加 stopGeneration(AbortController.abort) + send 内传 signal + abort 区分(已停止"⏹ 已停止生成" vs 调用失败)；2026-07-18 与 REQ-UI-13 收口(演进:恢复单蓝暂停→单按钮随内容切换): 生成中单按钮随输入框内容切换——空内容=蓝色暂停方块(终止)、有内容=蓝色发送箭头(入队不终止)、发送后清空自动回暂停, 无次级「入队」按钮; 无头验证 AC1-5 全过、零 pageerror、tsc 0 新增；关联 REQ-UI-08、REQ-UI-09、REQ-UI-01 |
| REQ-UI-11 | 对话页输入框常驻提示词集（对话页输入框上方常驻可点击提示词、点击填入；首页保留 GSAP 水印） | P1 | ❌ 已撤销(不做) | 1.2 | **用户推翻原需求**：对话页不展示任何固定提示词集（用户专注自身任务；除非随任务进度动态更新的智能引导，当前不做）。代码已回滚（删对话页常驻行+fillHint，保留 isHome 仅用于首页 GSAP 水印）；关联 REQ-UI-09、REQ-UI-10、REQ-UI-12 |
| REQ-UI-12 | AI 回复 Markdown 渲染（assistant 消息按 Markdown 渲染文字样式/标题/列表/表格/代码块/引用/链接，不再裸显 MD 标签） | P1 | ✅ 已闭环 | 1.2 | 安装 react-markdown@^10.1.0 + remark-gfm@^4.0.1；新建 `components/chat/MarkdownMessage.tsx`（ChatPage assistant 非 error 改用其渲染，user/error 维持纯文本与红绿边框）；`index.css` 加 `.markdown-body` 深色 token 样式；2026-07-18 tsc 0 新增、无头验证 AC1-8 全过；2026-07-18 用户验收通过；关联 REQ-UI-11 |
| REQ-UI-13 | 任务进行中跨页发送 → 发送队列（生成中从行情/对话页发送不终止，进入队列；完成后自动续发；队列支持撤回编辑/删除/置顶排序；**队列面板仅 AI 诊股页渲染、首页不渲染**） | P1 | ✅ 已闭环 | 1.2 | `chatStore` 新增 `queue`/`draftText`/`draftAttachments` + enqueue/remove/recall/togglePin/clearQueue；`send` finally 自动 dequeue；`ChatComposer` 输入框上方队列面板 + 与 REQ-UI-10 收口(单按钮随内容切换): 生成中单按钮——空内容=蓝色暂停方块(终止) / 有内容=蓝色发送箭头(入队不终止), 发送后清空自动回暂停, 无次级「入队」按钮; 2026-07-18 无头验证 AC1-8 全过；关联 REQ-UI-10/01/12 |
| REQ-UI-14 | 发送队列条目样式与置顶交互微调（表头去"任务完成后自动发送"文案；条目内容单行省略；置顶改为"移动到队首"可多次调序；三图标横向同排、间距宽松；**置顶图标换官方去顶部_to-top**） | P1 | ✅ 已闭环 | 1.2 | `chatStore` 移除 `pinned`/`sortQueue`，`enqueue` 追加队尾，`togglePinQueue` 改为移动到队首；`ChatComposer` 表头去冗余文案、内容单行省略、`item.pinned` 高亮移除、三图标横排 p-1 宽松；2026-07-18 tsc 0 新增、无头验证 AC1-6 全过；关联 REQ-UI-13 |

## R3 信息架构 / 导航（NAV）

| 编号 | 需求 | 优先级 | 状态 | 关联阶段 | 说明 |
|---|---|---|---|---|---|
| REQ-NAV-01 | 多页面 HashRouter，AppShell 左导航＋全局顶栏 | P0 | ✅ 已交付 | 1.1 | 规避 Tauri file:// 刷新白屏 |
| REQ-NAV-02 | 左 56px 导航：总览/自选股/订阅/我的 | P0 | ✅ 已交付 | 1.1 | |
| REQ-NAV-03 | 顶部全局栏固定所有页面：大盘指数＋搜索框＋设置入口 | P0 | 🟡 部分 | 1.1 | 栏已固定；大盘指数已接真实数据(见 REQ-NAV-09)；"设置"入口去留待确认（见 DEC-006） |
| REQ-NAV-09 | 顶部全局栏大盘指数补真实数据（上证/深证/创业板，复用 useMarketIndices 多源 fallback） | P1 | ✅ 已闭环 | 1.2 | 顶栏原 mock 占位，2026-07-14 接 `useMarketIndices()`（东财→新浪→腾讯→雅虎），红涨绿跌，交易时段4秒刷新；AC1-4 自测通过、AC5 待本机确认；关联 REQ-NAV-03、REQ-DATA-03/12 |
| REQ-NAV-10 | 左侧导航「订阅」「我的」选中态使用填充(实心)图标：补 `iconFill`（SubscribeFill/UserFill，复用 Arco IconSubscribe/IconUser path 实心化，`fill="currentColor"`），与行情/自选股填充观感一致 | P2 | ✅ 已闭环 | 1.2 | `NAV_ITEMS` 此前订阅/我的仅配线形 icon 无 iconFill，选中 fallback 线形+加粗描边近似；新增 `NavIcons.tsx`(SubscribeFill/UserFill) 并接入；tsc 无新增报错、无头 Chrome 零 JS 异常(12×500 为沙箱无外网数据代理失败)、4 按钮均渲染 svg、仅当前路由项高亮、AC1-5 全过；2026-07-18 末「订阅」图标按 REQ-NAV-12 升级为桌面 trendsol-icon 官方 `皇冠帽_crown-three`（原 SubscribeFill 已移除）；关联 REQ-NAV-07/12、DEC-008/009 |
| REQ-NAV-11 | 左侧导航「对话」标签页重命名为「AI诊股」并替换 AI 图标（线稿+实心两态，风格与现有导航一致） | P1 | ✅ 已闭环 | 1.2 | 标签改名「AI诊股」已落地；图标初用自建 `AiIcon`(机器人头)，2026-07-18 末按 REQ-NAV-12 改为采用桌面 trendsol-icon 官方 `六个点_six-points` 资源；`ChatPage` 页头 h1 同步改 "AI诊股"；关联 REQ-NAV-05/10/12、REQ-UI-10/13 |
| REQ-NAV-12 | 导航采用桌面 `trendsol-icon` 官方图标资产：AI诊股→`六个点_six-points`(线/填充)、订阅→`皇冠帽_crown-three`(线/填充)；`#333`→`currentColor` 内联、viewBox 0 0 48 48、跟随父级 text-lg+text-white/text-muted | P1 | ✅ 已闭环 | 1.2 | `components/TrendSolIcon.tsx` 新建 SixPointsLine/Fill + CrownLine/Fill(原 #333→currentColor)；`AppShell` 接入、`AiIcon.tsx` 删除、`NavIcons.SubscribeFill` 移除；2026-07-18 tsc 0 新增、无头验证 AC1-5 全过；关联 REQ-NAV-11/10、DEC-008/009 |
| REQ-NAV-04 | 个股分析页右侧可展开价位面板（可折叠） | P0 | ⬜ 待做 | 1.3 | 个股页右侧面板 |
| REQ-NAV-05 | 左侧导航图标由 emoji 替换为 Arco 图标库（总览→IconDashboard / 自选股→IconStar / 订阅→IconSubscribe / 我的→IconUser） | P1 | ✅ 已交付 | 1.1 | 收口 UI 一致性，关联 REQ-UI-05 |
| REQ-NAV-06 | 左侧导航间距改造：宽松大间距＋大圆角＋大留白（DEC-008 设计语言首个落地） | P1 | ✅ 已交付 | 1.1 | 项间距 gap-4 / 圆角 rounded-2xl / 容器留白增大；关联 DEC-008 |
| REQ-NAV-07 | 导航选中效果：选中图标＋文字纯白、无选中背景色；未选中保持 text-muted(#666) 最暗档（用户确认不提亮）；星标选中用 IconStarFill 实心 | P1 | ✅ 已闭环 | 1.1 | 2026-07-13 用户拍板闭环；关联 REQ-NAV-05、DEC-008、DEC-009 |
| REQ-NAV-08 | 左侧导航第1项「总览」→「行情」；图标改为用户自定义 SVG（股市_stock-market 线形/填充两版，currentColor 跟随文字色，落地为 StockMarketIcon 组件）；key 保持 "/" | P1 | ✅ 已闭环 | 1.1 | 已实施并自测（选中填充版白色/未选中线形版#666，AC1-4 全过），待用户验收；关联 REQ-NAV-05、REQ-NAV-07、DEC-008/009 |

## R4 总览页（OV）

| 编号 | 需求 | 优先级 | 状态 | 关联阶段 | 说明 |
|---|---|---|---|---|---|
| REQ-OV-01 | 板块行情（申万一级涨跌排行，点进板块看成份股） | P0 | ⬜ 待做 | 1.2 | 依赖 REQ-DATA-07 |
| REQ-OV-02 | 自选股概览（按分组/现价/涨跌幅/mini 走势） | P0 | ⬜ 待做 | 1.2 | 依赖分组 REQ-WL-01 |
| REQ-OV-03 | 持仓盈亏概览（总盈亏＋月度曲线） | P0 | ⬜ 待做 | 1.2 | 依赖 REQ-PROF-01/02 |

## R5 自选股（WL）

| 编号 | 需求 | 优先级 | 状态 | 关联阶段 | 说明 |
|---|---|---|---|---|---|
| REQ-WL-01 | 分组树（新建/重命名/删除/排序） | P0 | ⬜ 待做 | 1.4 | store 升级 watchGroups+watchItems |
| REQ-WL-02 | 股票列表（现价/涨跌幅/标签），点击进个股页 | P0 | 🟡 部分 | 1.1 | 当前扁平列表，待接分组 |
| REQ-WL-03 | 右键菜单（移动分组/删除/复制代码） | P1 | ⬜ 待做 | 1.4 | |

## R6 个股分析页（SYM）

| 编号 | 需求 | 优先级 | 状态 | 关联阶段 | 说明 |
|---|---|---|---|---|---|
| REQ-SYM-01 | 标的名/周期/复权/收藏 | P0 | 🟡 部分 | 1.1 | 基础已实现，待接收藏持久化 |
| REQ-SYM-02 | K 线＋自动画线 overlay | P0 | 🟡 部分 | 1.1 | 画线能力已有，待接 AI 自动画 |
| REQ-SYM-03 | 右侧价位面板（参考位/交易计划/形态/显示设置） | P0 | ⬜ 待做 | 1.3 | 依赖 REQ-NAV-04 |
| REQ-SYM-04 | AI 简报＋对话追问 | P0 | ⬜ 待做 | 1.3 | 依赖 REQ-AI 系列 |

## R7 AI 解读（AI）

| 编号 | 需求 | 优先级 | 状态 | 关联阶段 | 说明 |
|---|---|---|---|---|---|
| REQ-AI-01 | AI 画线（趋势线/支撑阻力/形态/成本价位） | P0 | ⬜ 待做 | 1.3 | |
| REQ-AI-02 | AI 解读四段式简报（严格 JSON 渲染） | P0 | ⬜ 待做 | 1.3 | 趋势/支撑压力/形态/操作建议 |
| REQ-AI-03 | 对话追问（绑定股票＋周期，上下文注入，历史持久化 localStorage） | P1 | ⬜ 待做 | 1.3 | |
| REQ-AI-04 | 大模型调用 Rust ai.rs，Key 存 Rust 端，流式输出 | P0 | ⬜ 待做 | 1.3 | 待定模型（DeepSeek?）见 DEC-007 |

## R8 我的页（PROF）

| 编号 | 需求 | 优先级 | 状态 | 关联阶段 | 说明 |
|---|---|---|---|---|---|
| REQ-PROF-01 | 持仓管理（手动录入/编辑/删除：股票＋数量＋成本价＋买入日） | P0 | ⬜ 待做 | 1.2 | 纯本地，不接券商 API |
| REQ-PROF-02 | 盈亏统计（总盈亏/个股盈亏/月度曲线） | P0 | ⬜ 待做 | 1.2 | |
| REQ-PROF-03 | 条件单（价格提醒列表；Arco Table+Modal+Form+DatePicker） | P1 | 🟡 演示 | 1.1 | 当前本地 state 演示，待持久化 |
| REQ-PROF-04 | 我的页不含设置模块 | P0 | ✅ 已交付 | 1.1 | 用户明确；仅持仓/盈亏/条件单 |

## R9 订阅（SUB）

| 编号 | 需求 | 优先级 | 状态 | 关联阶段 | 说明 |
|---|---|---|---|---|---|
| REQ-SUB-01 | 订阅页占位（套餐介绍＋"即将开放"＋邮箱预约） | P2 | 🟡 部分 | 1.1 | 占位页已有，待真实订阅（2.x） |

## R10 行情页（MKT）

| 编号 | 需求 | 优先级 | 状态 | 关联阶段 | 说明 |
|---|---|---|---|---|---|
| REQ-MKT-01 | 行情页内容结构：大盘(A股/港股/美股/日韩)、热门(板块题材+个股)、A股交易额、涨跌停比、用户(自选/持仓/盯盘)、消息热点(财联社电报)；数据源矩阵见卡 | P0 | ✅ 已闭环 | 1.2 | 升级原总览页；吸收 REQ-OV-01/02/03 与 REQ-DATA-06/07；Phase 1(六分区骨架+大盘真实数据)已实施自测待验收；Phase 2~4 待指令；关联 REQ-NAV-08、REQ-DATA 系列、REQ-PROF 系列 |
| REQ-MKT-02 | 行情页两栏布局：左核心栏(模块A=大盘+交易额+涨跌停比 + 热门 + 消息热点) / 右用户栏(持仓+自选+盯盘)；一页内展示 | P1 | ✅ 已交付 | 1.2 | 在 REQ-MKT-01 Phase 1 基础上仅调整布局，不新增采集逻辑；已实施自测(AC1-6全过)并于 2026-07-14 用户拍板验收闭环（含 A股 横滑 / 其他市场文字化 / 6 组 2×3 / 卡片 min-w 充满 五轮细化）；关联 DEC-008/009 |
| REQ-MKT-03 | 大盘指数卡点击跳转详情页（分时/日/周/月/5日 K线）；与个股详情页共用框架 | P1 | ⬜ 待做(暂缓) | 1.2/1.3 | A股 大卡片可点击→指数详情页；周期 分时/日/周/月/5日；详情页框架与个股详情共享。**暂不实施**，并入个股详情页(REQ-SYM)一并落地；逻辑已固化 DEC-010；关联 REQ-DATA-01、REQ-SYM |
| REQ-UI-01 | 数据占位与布局稳定性：顶栏/行情页大盘指数加载前后结构固定（骨架占位，零位移） | P1 | ✅ 已交付 | 1.2 | 基于 MARKET_INDEX_DEFS 固定渲染骨架结构（A股 5 卡 + 其他 6 槽数量恒等于定义数）；未加载时固定尺寸骨架（`animate-pulse`，失败态静态），加载后原地替换；顶栏价格/涨跌容器 `min-w`+`text-right tabular-nums` 固定宽度；关联 REQ-NAV-09、REQ-MKT-02、DEC-008/009 |
| REQ-ANIM-01 | 引入 GSAP 动画库并加入适当动效：行情页入场级联（stagger 淡入上浮）+ A股/顶栏指数价格"跳动"脉冲；仅 transform/opacity，尊重 reduced-motion | P2 | ✅ 已交付 | 1.2 | 安装 `gsap@3.15.0`+`@gsap/react@2.1.2`；新增 `lib/gsap.ts`（`useGSAP` 注册 + `useValuePulse` 钩子 + `prefersReducedMotion` 守卫）；入场 `useGSAP`+`scope` 自动清理；脉冲只在值变化触发；布局零位移（不违反 REQ-UI-01）；关联 DEC-008/009 |
| REQ-ANIM-02 | 顶栏三大指数（上证/深证/创业板）数值变动去除脉冲动画：仅保留行情页 A股 卡片脉冲，顶栏价格静态更新 | P2 | ✅ 已交付 | 0.3 | `AppShell.tsx` 的 `TopIndex` 删除 `useValuePulse(priceRef, idx?.price)` 调用与 `priceRef`/`useRef` 引用、移除 `useValuePulse` import；价格 span 去 `ref`；去动画不去数值更新，红涨绿跌/骨架/布局零位移保留；行情页 A股 `IndexCard` 脉冲不受影响；关联 REQ-ANIM-01、REQ-NAV-09、REQ-UI-01 |
| REQ-UI-02 | 行情页去除冗余标题/副标题：卡片内「大盘指数」小标题 + A股 卡片行上方「A股」标签 + 「大盘概览」副标题「指数 · 成交额 · 涨跌停」全部移除，仅保留「大盘概览」主标题 | P2 | ✅ 已闭环 | 0.3 | `OverviewPage.tsx` 删除 `<SubHeader title="大盘指数">`、A股 行上方 `text-text-muted`「A股」标签、`SectionHeader` 对大盘概览的 `subtitle` 传参；顺手删无调用方的 `SubHeader` 死代码；A股交易额/涨跌停比子模块标题保留；布局零位移（既有 `space-y` 控制留白）；关联 REQ-UI-01、DEC-008 |
| REQ-MKT-04 | 其他市场文字行三列固定宽成组：名称左对齐(宽=最宽名"韩国KOSPI") + 数值右对齐(10ch) + 涨跌右对齐(6ch)，三列固定宽紧贴成组且跨行各列对齐；grid-cols-3 三组一行平均分布 | P2 | ✅ 已闭环 | 1.2 | 重做 `OtherIndexText` 为 `flex items-center gap-2`：名称 `w-[4.5rem] text-left truncate shrink-0`(72px=韩国KOSPI 文字宽)、数值 `w-[10ch] text-right tabular-nums shrink-0`、涨跌 `w-[6ch] text-right tabular-nums shrink-0`；去掉二版 justify-end/自然宽(名称起点浮动、组间不齐被打回)；三列固定宽保证跨行对齐；骨架/动画/红涨绿跌保留，布局零位移；关联 REQ-MKT-02、DEC-008/009 |
| REQ-MKT-05 | 修复 A股 横向滚动容器加载期右侧竖向滚动条闪烁：显式 `overflow-y-hidden` 解耦 `overflow-x-auto`，消除 CSS "visible+auto⇒另一轴 auto" 副作用 | P2 | ✅ 已交付 | 1.2 | `OverviewPage` A股 容器 `flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory` 补 `overflow-y-hidden`（保留横滑）；根因：REQ-ANIM-01 入场 `gsap.from({y:18})` 下移 18px 触发计算为 auto 的竖向轴显示滚动条，动画结束即消失；关联 REQ-MKT-02、REQ-ANIM-01、DEC-008/009 |
| REQ-MKT-06 | 其他市场模块内容宽度对齐上方 A股 卡片行：每行 3 组文字边到边分布（列 0 左 / 1 中 / 2 右），内容左右缘对齐 A股 首末卡 | P2 | ✅ 已闭环 | 1.2 | 根因：A股 卡片 `flex-1` 铺满右边缘，其他市场 `grid-cols-3` 每格内容默认左对齐、末列右侧留白 → 视觉更窄（容器实为等宽）；`OtherIndexText` 改 `w-full`+按列 `justify-start/center/end`（col=index%3）；三列固定宽成组与列内对齐不变；关联 REQ-MKT-02、REQ-MKT-04、REQ-UI-01、DEC-008/009 |
| REQ-MKT-07 | A股交易额（数值 + 图表）：实时沪深两市成交额（亿元，上证+深证指数 `f48` 之和）+ 近 20 交易日量能柱状图 + 较昨日增减 + 大盘资金净流入 + 昨日成交额；加载骨架/无数据「—」 | P1 | 👀 待验收 | 1.2 | 2026-07-16 冻结昨日成交额（`useMarketTurnoverYesterday` 按日缓存、refetchInterval=false、当日仅取一次）；较昨日补绝对增减额(亿元)；`useMarketTurnoverSeries` 刷新 60s→300s 降跳动；走东财 `f48` 真实口径 + `normalizeTurnoverYi` 校正；tsc 仅 ProfilePage 2 错无新增、math 8 例全 PASS、无头零 JS 异常、旧涨跌停标签移除；关联 REQ-MKT-08/11、REQ-UI-01、REQ-DATA-03、DEC-008/009；**2026-07-16 根因实为数据源兜底链横跳（东财真实 amount ↔ 腾讯 K线 amount=volume×close 估算 ↔ 新浪空），已由 REQ-MKT-12 钉死东财真实源彻底修复** |
| REQ-MKT-08 | A股涨跌停比（数值 + 图表）：涨停/跌停家数(红绿) + 对比柱 + 涨跌停比 + 连板高度 + 连板/炸板；数据来自东财 push2ex 涨停/跌停池计数 | P1 | ✅ 已闭环 | 1.2 | 新增 `MarketBreadth` 类型 + `DataSource.getMarketBreadth()`（Eastmoney 实现 push2ex 双池计数，其余源 null）+ manager fallback + 导出；补 `push2ex` Vite 代理(`/em-zdt`) 与 http-client 重写；`MarketStats.tsx` 的 `BreadthCard`；口径不含 ST/科创板(UI 标注)；关联 REQ-MKT-07、REQ-DATA-03 |
| REQ-MKT-11 | A股涨跌停比 → A股涨跌比（标签 + 数据同步修改）：标题改「A股涨跌比」；数据由涨停/跌停家数改为上涨/下跌/平盘家数（市场宽度）；涨跌比=上涨:下跌，占比条红涨绿跌；移除连板/炸板 | P1 | 👀 待验收 | 1.2 | 新增 `MarketAdvanceDecline{up,down,flat,updateTime}` 类型 + `DataSource.getMarketAdvanceDecline()`（Eastmoney 实现：上证1.000001+深证0.399001 指数 `f162/f163/f164` 求和，其余源 null）+ manager fallback + 导出；`useMarketAdvanceDecline` Hook；`MarketStats.tsx` 的 `BreadthCard` 改涨跌比；tsc 仅 ProfilePage 2 错无新增、无头零 JS 异常、旧涨跌停标签移除；关联 REQ-MKT-07、REQ-MKT-08、DEC-008/009 |
| REQ-MKT-12 | 交易额数据源钉死东方财富真实源（消除腾讯估算兜底导致的偏差与跳动）：新增 `MarketTurnover{today,yesterday,series,updateTime}` 类型 + `DataSource.getMarketTurnover()`（Eastmoney 仅调自身 `getQuote(f48)` + `getKLines(真实 amount)`，含 `normalizeTurnoverYi` 量级校正，失败返回 null）；其余源(sina/tencent/yahoo/local-cache) 兜底 null；`useMarketTurnover()` 单一实时（今日+20日序列）+ `useMarketTurnoverYesterday()` 按日冻结；`useMarketStats` 返回同形状（UI 不变） | P1 | ✅ 已闭环 | 1.2 | 用户反馈交易额偏差大且昨日成交额不停刷新变动；根因：turnover 的昨日/序列取自 K线 `amount`，走 `本地缓存→东财→新浪(空)→腾讯(amount=volume×close 估算)→Yahoo` 兜底链，东财偶发抖动即横跳到腾讯估算值（既偏差大又跳动），此前按日冻结只冻结取值时机未冻结数据源；本修复把 turnover 钉死东财真实源（今日 f48 + 昨日/序列 K线真实 amount），不走腾讯/新浪估算；东财挂则降级「—」而非错误数字；关联 REQ-MKT-07、REQ-MKT-11、REQ-DATA-03、DEC-008/009 |
| REQ-MKT-13 | A股交易额今日值获取失败修复（today 与昨日/序列独立容错）：重构 `getMarketTurnover`，今日独立 `getQuote.f48`（实测即真实成交额元）与昨日/序列独立 `getKLines`（真实 amount），拆为两个独立 try 互不拖垮；双保险（今日接口失败用 K线当日兜底）；`MarketTurnover.today` 放宽 `number|null` | P0 | 👀 待验收 | 1.2 | REQ-MKT-12 把今日与昨日放同一 try，K线接口(/em-kline)偶发失败即整体 null→「—」；实测 `f48` 即真实成交额(元)非涨停价、`toSecid` 正确；今日/昨日/序列同口径(东财真实源)；tsc 0 新增、math 全 PASS、无头零 pageerror；sandbox Node 无外网致东财代理 500 降级「—」非代码 bug，真网需用户本机验收；关联 REQ-MKT-07/11/12、DEC-008/009 |
| REQ-MKT-14 | 行情页大盘概览最小宽度 + 横向滚动：A股 指数行恢复横滑（卡片 `min-w-[132px]` 兜底、空间不足行内横滑，修复 `min-w-0` 回归）+ 其他市场（美/港/日/韩）每行 `overflow-x-auto`、`min-w-max` 行 + 单元格 `min-w-[200px]`；窗口缩窄不再无限挤压、超出底部横滑 | P1 | ✅ 已闭环 | 1.2 | 用户反馈 A股 横滑丢失（回归自 `min-w-0`）+ 其他市场需最小宽度；A股 横滑原属 REQ-MKT-02(已验收)/REQ-MKT-05(竖滚解耦)；值量化：A股 卡内 p-4(32)+价格 text-xl≈90→132px、其他单元格 72+64+48+2×8=200px；tsc 0 新增错误、vite build 成功且 CSS 全命中、dev HMR 已生效；无头截图被 sandbox 杀(137)待本机验收；关联 REQ-MKT-02/05、DEC-008/009 |
| REQ-MKT-15 | 整页最小宽度 + 横向滚动（以美港日韩自然宽为基准）：根容器 `overflow-y-auto`→`overflow-auto`、新增内层 `min-w-[760px] px-8 py-8` 包裹；美港日韩 行去 `overflow-x-auto`/`min-w-max`、单元格加 `shrink-0`（自然宽 648px 固定不压缩、始终完整显示）；视口<760px 整页底部横滑、内容不再无限缩小 | P1 | ✅ 已闭环 | 1.2 | 用户三点诉求：①美港日韩 不隐藏始终完整；②以其未缩放自然宽(648)为页面 min-width 基准（非单元格数值相加）；③禁止无限缩放、视口<min-width 出整页横滑。值依据：美港日韩行 3×200+2×24=648 + 卡片 p-6(48) + 页面 px-8(64) = 760px；A股 行 708<760 仍走自身内部横滑(REQ-MKT-14)；tsc 0 新增、vite build 成功 CSS 全命中；无头截图 sandbox(137)待本机验收；关联 REQ-MKT-02/05/14、DEC-008/009 |

---

## 范围外（明确不做）
- 登录 / 账号 / 云同步（后续阶段）
- 实际订阅支付（第三期 2.x）
- 接券商 API 同步持仓
- 策略回测、多周期联合分析、分钟线
- 亮色主题（默认取消，待确认）
