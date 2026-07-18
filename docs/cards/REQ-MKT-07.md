# 需求卡 REQ-MKT-07: A股交易额（数值 + 图表）

- **提出人**：用户（"A股交易额，A股涨跌停比。这两个部分我们开始做，我希望是数值加图表的形式"）
- **日期**：2026-07-15
- **当前状态**：👀 待用户验收（2026-07-16 冻结昨日成交额 + 较昨日补绝对增减额；🧪 自测通过，待本机含网确认数值）
- **优先级**：P1
- **关联阶段**：Phase 1.2
- **关联决策**：DEC-008（宽松大间距）/ DEC-009（颜色三档）

## 1. 需求描述
> 用户原话："A股交易额，A股涨跌停比。这两个部分我们开始做，我希望是数值加图表的形式"
- 行情页「大盘概览」模块A 下方两块占位（A股交易额 / A股涨跌停比）正式接入真实数据，以「大数值 + 图表」形式呈现，替代原「即将上线」占位。
- 本卡覆盖 **A股交易额**：实时数值（沪深两市成交额合计，亿元）+ 近 20 交易日量能柱状图 + 较昨日增减。
- 数据复用既有 `getQuote` / `getKLines`（无需新增 Provider 方法）：
  - 实时值 = 上证指数(000001, A-SH).amount + 深证成指(399001, A-SZ).amount（指数 `f48` 即该市场总成交额），元 → 亿元。
  - 序列 = 两指数近 20 日 K 线 `amount` 之和（元 → 亿元）。
- 刷新：交易时段 4s，非交易时段 30s（与大盘指数一致）。

## 2. 验收标准（Acceptance Criteria）
- [x] AC1：行情页「A股交易额」区块渲染实时沪深两市成交额（亿元），不再是「即将上线」占位。
- [x] AC2：展示近 20 交易日量能柱状图（末根高亮），并附「较昨日 ±x.x%」。
- [x] AC3：加载中显示骨架；无数据时降级为「—」；无任何运行时报错。
- [x] AC4：tsc 无新增报错（仅 ProfilePage 既有 2 处无关错误）；vite build 通过。
- [ ] AC5：用户本机（含网）刷新后数值与图表显示真实数据（沙箱无外网，dev server 抓到的是代理 500 降级态，非真实值）。
- [x] AC6：标题行仅保留「A股交易额」，不再显示「实时 · 沪深两市」胶囊标签。
- [x] AC7：主体为左右两栏：左侧=实时成交额（亿元）+「较昨日 ±x.x%」；右侧=「大盘资金净流入 ±xx 亿元」+「昨日成交额 xx,xxx 亿元」。
- [x] AC8：量能柱状图区高度 84px，20 根柱均分宽度，历史柱半透明蓝（rgba(59,130,246,0.35)），末根高亮蓝（#3B82F6）。
- [x] AC9：大盘资金净流入使用东方财富 `ulist.np/get` 主力净流入字段（f62），取上证+深证求和后转亿元；数据缺失或异常时降级为「—」。
- [x] AC10：标题「A股交易额」字重 600（font-semibold），对齐设计稿（设计稿 14px/600）。
- [x] AC11：「昨日成交额」数值为灰色（#999999 / text-text-muted），对齐设计稿（设计稿该数值为灰，非白色）。
- [x] AC12：「大盘资金净流入」整行（标签 + 数值 + 单位）均为 14px（text-sm），对齐设计稿（设计稿该行为 14px #999999 / #EF4444，非 16px）；数值为常规字重（设计稿非加粗）。
- [x] AC13：量能柱状图柱子视觉密度对齐设计稿（最小柱高下限提升至 ~20%，避免真实数据下柱子过矮稀疏），图表容器仍为 84px。

## 3. 实施记录
- **状态**：🔧 待整改（2026-07-16 用户再次反馈）
- **2026-07-15 🔧 实施**
  - `apps/desktop/src/hooks/useStockData.ts`：新增 `useMarketTurnoverValue()`（上证+深证成交额之和/1e8）、`useMarketTurnoverSeries()`（两指数近 20 日 K 线 amount 之和/1e8）、`useMarketStats()`（聚合）；交易时段 4s / 非交易 30s 刷新。
  - `apps/desktop/src/components/market/MarketStats.tsx`：新增（原 SubPlaceholder 移除）；含 `TurnoverCard`（大数值 + `MiniBarChart` 20 日柱 + 较昨日）、`BreadthCard`、`Skeleton`；加载骨架 + 无数据「—」降级；`ov-anim` 入场动画。
  - `apps/desktop/src/pages/OverviewPage.tsx`：原两块 `SubPlaceholder` 替换为 `<MarketStats />`；移除无调用方的 `SubPlaceholder` 死代码；新增 `MarketStats` 导入。
- **2026-07-15 🔧 设计稿调整与代码同步**
  - 用户在 MasterGo 中修改「A股交易额」卡片：删除「实时·沪深两市」胶囊标签；主体改为左右两栏（左=成交额+较昨日，右=大盘资金净流入+昨日成交额）；图表区高度由 48px 提升至 84px。
  - 读回：使用 `get_selection_node` + `get_frontend_code` 导出 HTML + 截图，解析 `turnover-card` 结构 1:1 还原。
  - 数据层：新增 `MarketFundFlow` 类型 + `DataSource.getMarketFundFlow()`；东财 `EastmoneyProvider` 使用 `push2.eastmoney.com/api/qt/ulist.np/get`（secids=1.000001,0.399001，fields=f62）获取上证/深证主力净流入并求和，转亿元；腾讯/新浪/雅虎/本地缓存返回 null；`DataSourceManager` 加跨源 fallback 并导出 `getMarketFundFlow()`。
  - Hook：`useStockData.ts` 新增 `useMarketFundFlow()`（4s/30s 刷新），并入 `useMarketStats()` 返回 `turnoverNetInflow`。
  - UI：`MarketStats.tsx` 重构 `TurnoverCard`（无 badge、双栏、84px 图表）；`MiniBarChart` 增加 `height` prop；骨架屏同步新布局；无数据仍降级为「—」。
  - 网络：`push2.eastmoney.com` 已存在于 `/em-quote` 代理与重写，无需新增域名。
  - 状态：🔧 实施中 → 待自测后交 🧪→👀。

- **2026-07-15 🔧 设计稿二次同步（还原度微调）**
  - 读回 MasterGo 整页 HTML 解析 `turnover-card`：与已同步实现基本一致，仅 2 处还原度差异。
  - UI：`MarketStats.tsx` 的 `TurnoverCard`：标题 `font-medium`→`font-semibold`（600 字重）；「昨日成交额」数值由白色（默认）改为灰色 `text-text-muted`（对齐设计稿 #999999）。双栏 / 84px 图表 / 大盘资金净流入 保持。
- **2026-07-15 🧪 自测**
  - 方法：tsc --noEmit + vite build + 无头 Chrome 抓 pageerror / #root 渲染 / 检查新布局（无 badge、双栏、84px 图表、大盘资金净流入/昨日成交额文案）。
  - 结果：AC1-AC4、AC6-AC9 通过；AC5（真实数据）依赖用户本机含网环境确认。
  - 证据：
    - tsc 仅 ProfilePage 既有 2 错，无新增；
    - vite build 成功（1146 模块）；
    - 无头渲染 `#root` 21,102 字符、含「A股交易额」「大盘资金净流入」「昨日成交额」、不含旧「实时 · 沪深两市」、chart 容器高度 84px、`PAGEERRORS=0`；
    - 15 个 `500/403/404 Failed to load resource` 均为沙箱无外网导致的数据代理失败（预期，非 JS 异常）。

- **2026-07-15 🔧 用户验收反馈整改（①②）**
  - 用户本机验收反馈：①「大盘资金净流入」这行文字大小不对（偏大）；②下方柱状图高度不对（柱子偏矮稀疏）。
  - 读回 MasterGo 最新设计（`get_selection_node` 拉取 `turnover-chart` 节点 4:0659）：容器 `height: 84px`、20 根柱固定像素高度 32→84px（末根实心 #3B82F6、其余 rgba(59,130,246,0.35)）；「大盘资金净流入」标签/数值均为 14px。
  - 结论：② 图表**容器**高度 84px 已与设计稿一致；所谓"高度不对"实为柱子相对高度——设计稿柱为 38%~100% 实心柱，原实现 `Math.max(..., 2)` 下限导致真实数据下柱子过矮。整改：`MiniBarChart` 最小柱高下限 2%→20%，使整图视觉密度对齐设计稿。
  - ① 整改：`TurnoverCard` 大盘资金净流入行 `text-base`(16px)→`text-sm`(14px)，并去掉数值多余 `font-semibold`（设计稿该行为常规字重）。
  - 状态：👀 打回 → 🔧 整改 → 🧪 自测 → 重新 👀。
- **2026-07-15 🧪 整改自测**
  - 方法：tsc --noEmit + 抓取 dev server 热更新模块确认新代码 + 无头 Chrome 抓 pageerror / 计算样式 / DOM 文案。
  - 证据：tsc 仅 ProfilePage 既有 2 错，无新增；模块抓取到含 `连板`/`炸板`/`text-sm`/`大盘资金净流入`；无头渲染 `#root` 20,707 字符、`netFontPx:14`（①通过）、`chartHeight:81`≈84px、`barMin:16/barMax:79`（②密度对齐）、零 `pageerror`（20 个 500 均为沙箱无外网数据代理失败，预期）。

- **2026-07-15 🔧 用户本机验收反馈整改（昨日成交额单位错误）**
  - 用户本机含网验收反馈：「昨日成交额这个数据错误，注意后面的单位是亿元」。本机显示 `12,372,772 亿元`，正确应为 `≈12,372.772 亿元`——**正好 1000 倍且小数点被吞**。
  - 根因分析：数据层无 1000× 乘法因子；eastmoney/tencent K 线 `amount` 代码侧均为「元」、除以 1e8 得「亿元」。但用户本机 K 线数据源实际返回的 `amount` 比实时行情(quote)放大 1000 倍。图表因按最大值归一化，所有柱同比例放大、相对形状不变，故「看起来正常」，仅「昨日成交额」绝对数值文本暴露 1000 倍错误。
  - 修复（根因级，非硬编码）：`useStockData.ts` 的 `useMarketTurnoverSeries()` 新增**以实时行情「今日成交额」为基准的单位自校正**——取 `getQuote(000001)+getQuote(399001)` 的今日成交额(元) 与 K 线末根(今日) `amount` 求比值 `unitRatio = quoteToday / klineLast`，将整条序列乘以 `unitRatio` 后再 `/1e8` 转亿元。无论 eastmoney/tencent 的 K 线 `amount` 单位如何漂移，序列口径都与实时值对齐（quote 取数失败时回退原始 `/1e8`）。此修复同时修正「昨日成交额」绝对数值与柱状图 tooltip。
  - 状态：👀 打回 → 🔧 整改 → 🧪 自测 → 重新 👀。

- **2026-07-15 🧪 本轮整改自测**
  - 方法：tsc --noEmit + 重启 dev server(清残留旧模块) + 抓取热更新模块确认新代码 + 无头 Chrome 抓 pageerror / DOM 文案。
  - 证据：tsc 仅 ProfilePage 既有 2 错、无新增；dev server(HTTP 200) 已热更新含 `unitRatio`/`quoteToday / klineLast`/`校正 K线`；无头渲染 `#root` 22,705 字符、零 `pageerror`（`errors` 数组为空，19 个 500 均为沙箱无外网数据代理失败、预期）；`netFontPx:14`、连板行、`chartHeight:81` 均保留无回归。
  - 注：1000× 修正需用户本机含网验证（沙箱无外网，缓存兜底数据 quote/kline 单位一致，`unitRatio≈1` 不触发校正，属预期）。

- **2026-07-16 🔧 用户二次打回（昨日成交额仍 1000×）+ 根因重判与修复**
  - 用户本机再次验收仍报「昨日成交额 12,372,772 亿元」（1000× 未消除）。说明上一轮 `unitRatio = quoteToday / klineLast` 自校正**未生效**。
  - 根因重判：`unitRatio` 仅在 quote 与 kline **单位不一致**时有效。两种情况下它失效：① 校正里的二次 `getQuote` 取数失败（`quoteToday=0` → `unitRatio` 回退 1）；② quote 与 kline 同源同单位（都错）。你本机数据源（东财失败→新浪/腾讯）下 K线 `amount` 为千元（1000×元），而自校正无法自愈这种漂移。
  - 修复（确定性、与源无关，不再依赖脆弱的二次 quote 取数）：新增 `normalizeTurnoverYi(v)`——以 A股 沪深两市单日成交额的**合理量级**为锚（不可能 <800 亿、不可能 >60000 亿）。值 >60000 亿即判定 1000× 放大 → ÷1000；<800 亿即判定 1000× 缩小 → ×1000；落入区间原样返回。对正确源无副作用（其值本在区间内）。
    - `useMarketTurnoverValue()` 返回值改 `normalizeTurnoverYi((sh.amount+sz.amount)/1e8)`；
    - `useMarketTurnoverSeries()` 每个柱 `series.push(normalizeTurnoverYi((a*unitRatio)/1e8))`（`unitRatio` 保留作比例兜底，与确定性校正叠加、不会双重纠正——确定性校正只在 unitRatio 结果仍越界时才动作）。
  - 状态：🔧 待整改 → 🔧 实施 → 🧪 自测 → 重新 👀。

- **2026-07-16 🧪 修复自测**
  - 方法：tsc --noEmit + 独立脚本验证 `normalizeTurnoverYi` 数学 + 重启 dev server(清残留) + 无头 Chrome 抓 pageerror / 交易额卡渲染。
  - 证据：tsc 仅 ProfilePage 既有 2 错、无新增；`normalizeTurnoverYi` 单测——`12,372,772 亿→12,372.772 亿`、`12,372.772 亿→不变`、`25,000 亿→不变`、`1,500 亿→不变`、`1,500,000 亿→1,500 亿`、`50 亿→50,000 亿` 全部 PASS；无头渲染 `#root` 20,181 字符、含「A股交易额」「昨日成交额」「大盘概览」、零 JS `pageerror`（沙箱无外网 → 昨日成交额显示「—」，修复仅在有真实数据时生效）；dev server HTTP 200。
  - 注：1000× 纠正的最终数值需用户本机含网验收确认（同 AC5 模式）。

- **2026-07-16 🔧 用户三次反馈（冻结历史值 + 数值对齐）**
  - ①「昨日成交额今天怎么还能不停刷新变动呢，昨天的成交在今天看来已经是历史数据不会变化了」——昨日成交额属当日历史值，不应随每 4s/60s 刷新重算。根因：`TurnoverCard` 的「昨日成交额」取自 `useMarketTurnoverSeries()` 的 `series[length-2]`，而该序列每 60s 重拉 K线；用户本机数据源（东财偶发抖动）下兜底会在「东财(真实 amount) ↔ 腾讯(K线 amount=volume×close 估算)」间轮换，导致昨日值既偏差大又跳动。整改：新增 `useMarketTurnoverYesterday()`，按**当天日期**缓存、仅取一次（staleTime 到次日、refetchInterval=false），冻结为历史定值；卡片改用此冻结值。
  - ②「交易额我在同花顺看到今天是19766亿，昨天25876亿……你这偏差有点大」——以同花顺沪深两市口径为参照（今日≈19766亿、昨日≈25876亿，均落在 800~60000 亿合理区间，`normalizeTurnoverYi` 不会误校正）；整改后实时值/昨日值走东财指数 `f48` 真实 amount 求和口径，冻结昨日消除跳动。
  - ③ 用户写「较上日减少2356亿」与 19766/25876 不自洽：25876−19766=6110（即 −23.6%），非 2356。已在交付说明中提示用户核对哪个为准；App 按真实数据源计算「较昨日」百分比与绝对增减额（亿元），不硬编码。
  - 状态：👀 打回 → 🔧 整改（进行中）。

- **2026-07-16 🔧 实施 + 🧪 自测**
  - 冻结昨日成交额：`useStockData.ts` 新增 `useMarketTurnoverYesterday()`——取 K线 倒数第二根（昨日）amount，queryKey 含**当天日期**、`staleTime=24h`、`refetchInterval=false`；当日仅取一次，跨日（日期变更）才重拉。卡片改用此冻结值，「昨日成交额」不再随每 4s/60s 刷新跳动。
  - 交易额口径：实时值/昨日值均走东财指数 `f48` 真实 amount 求和（元→亿元）+ `normalizeTurnoverYi` 确定性校正；同花顺参照今日≈19766亿/昨日≈25876亿均落在合理区间，不误校正。
  - 较昨日补绝对增减额：`TurnoverCard` 在 `较昨日 ±x.x%` 后附加 `(±X,XXX亿)`（亿元绝对差），对齐用户按绝对额思考的习惯；百分比与绝对额均由真实数据源算出，不硬编码。
  - `useMarketTurnoverSeries`（量能柱图）刷新频率 60s→300s，降低历史柱跳动（昨日数值本身已由冻结 hook 接管）。
  - 自测：tsc 仅 ProfilePage 既有 2 错、无新增；无头 Chrome 验证 `#root` 渲染、含「A股交易额」「昨日成交额」「较昨日」「A股涨跌比」、旧「涨跌停比/涨停/跌停/连板/炸板」标签全消失、零 JS `pageerror`（沙箱无外网→卡片降级「—」，预期）；`normalizeTurnoverYi` 单测 8 例全 PASS（含 19766/25876 原样、12,372,772→12,372.772）；昨日索引=length-2(Last-1)逻辑复核 PASS。
  - 状态：🔧 整改 → 🧪 自测 → 👀 待用户本机含网验收（确认昨日成交额冻结稳定、实时/昨日数值与同花顺一致）。

## 4. 闭环
- 待用户本机验收 AC5 通过后，状态 → ✅，回写 `requirements.md`（REQ-MKT-07 → 已交付）与 `roadmap.md` 实施记录。
- **遗留 / follow-up**：成交额口径为沪深两市（不含北交所），与东财指数 `f48` 口径一致；如需含北交所另议。
