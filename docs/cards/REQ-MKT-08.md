# 需求卡 REQ-MKT-08: A股涨跌停比（数值 + 图表）

- **提出人**：用户（"A股交易额，A股涨跌停比。这两个部分我们开始做，我希望是数值加图表的形式"）
- **日期**：2026-07-15
- **当前状态**：👀 待用户验收（2026-07-15 用户验收反馈整改：涨跌停比内容垂直居中；🧪 自测通过）
- **优先级**：P1
- **关联阶段**：Phase 1.2
- **关联决策**：DEC-008 / DEC-009
- **关联卡**：REQ-MKT-07（同批次两块子模块）

## 1. 需求描述
> 用户原话："A股交易额，A股涨跌停比。这两个部分我们开始做，我希望是数值加图表的形式"
- 本卡覆盖 **A股涨跌停比**：涨停家数 / 跌停家数（红涨绿跌）+ 涨跌停比，配「涨停(红) vs 跌停(绿)」单根横向占比条（按 limitUp/(limitUp+limitDown) 动态比例）；保留「连板 N 家 · 炸板 M 家」次级行（设计稿 breadth-meta 含此行，与涨跌停比同行右侧，14px）；**不含**「连板高度」(lbc) 单列；**不显示**「不含 ST/科创板」胶囊标签。
- 数据来源：东方财富 `push2ex.eastmoney.com` 涨停池(`getTopicZTPool`) / 跌停池(`getTopicDTPool`)，计数即家数（口径同东财「涨停板行情」，不含 ST / 科创板，UI 已标注）。
  - 涨停家数 = 涨停池长度；跌停家数 = 跌停池长度。
  - 连板高度 = 涨停池最大连板天数(`lbc`)；连板家数 = 连板天数 ≥ 2 的数量；炸板家数 = 涨停池曾开板(`zbc>0`)数量（估算）；封板率 = 涨停/(涨停+炸板)。
- 新增 `getMarketBreadth()` 数据层方法（DataSource 接口）；并补 `push2ex` 的 Vite 代理与 http-client 重写，使浏览器预览可绕过 CORS。
- 刷新：交易时段 4s，非交易时段 30s。

## 2. 验收标准（Acceptance Criteria）
- [x] AC1：新增 `MarketBreadth` 类型与 `DataSource.getMarketBreadth()`；Eastmoney 实现（push2ex 涨停/跌停池计数），tencent/yahoo/sina/local-cache 返回 null；DataSourceManager 增加 fallback 方法并导出 `getMarketBreadth()`。
- [x] AC2：`push2ex.eastmoney.com` 加入 http-client URL 重写（`/em-zdt`）与 `apps/desktop/vite.config.ts` 代理（含 Referer/UA），浏览器预览绕过 CORS。
- [x] AC3：行情页「A股涨跌停比」渲染 涨停/跌停家数（红/绿）+ 横向占比条 + 涨跌停比（无胶囊、无连板高度/连板炸板行）。
- [x] AC4：加载骨架 / 无数据降级「—」，无运行时报错。
- [x] AC5：tsc 无新增报错；vite build 通过。
- [ ] AC6：用户本机（含网）刷新后显示真实涨跌停数据（沙箱无外网，dev server 抓到代理 500 降级态）。
- [x] AC7：不显示「不含 ST/科创板」胶囊标签（设计稿无）。
- [x] AC8：图表为单根横向占比条（红涨停左 + 绿跌停右），宽度按 limitUp/(limitUp+limitDown) 动态比例；高 16px、圆角 2px、overflow-hidden。
- [x] AC9：保留「涨跌停比 X : 1」（左）+「连板 N 家 · 炸板 M 家」（右，14px）同行（设计稿 breadth-meta）；不含「连板高度」(lbc) 单列。
- [x] AC10：卡片下方信息（涨停/跌停大数值 + 横向占比条 + 涨跌停比/连板行）整体在卡片下半区垂直居中（设计稿观感；原实现顶部贴顶）。实现：卡片 `h-full flex flex-col`，内容块 `flex-1 flex flex-col justify-center`。

## 3. 实施记录
- **状态**：✅ 已闭环（2026-07-16 用户拍板验收通过）
- **2026-07-15 🔧 实施**
  - `packages/data/src/types.ts`：新增 `MarketBreadth` 接口（limitUp/limitDown/consecutive/broken/sealRate/maxBoard/updateTime）+ `DataSource.getMarketBreadth()`。
  - `packages/data/src/providers/eastmoney.ts`：实现 `getMarketBreadth()`（push2ex 双池并行请求计数；date=今日 YYYYMMDD；空池返回 null）；新增 `EmZTPoolItem`/`EmZTPoolResponse` 类型；import `MarketBreadth`。
  - `packages/data/src/providers/{tencent,yahoo,sina,local-cache}.ts`：分别实现 `getMarketBreadth()` 返回 `null`（不支持，继续 fallback）；import `MarketBreadth`。
  - `packages/data/src/datasource.ts`：`DataSourceManager.getMarketBreadth()`（逐源 fallback）+ 导出 `getMarketBreadth()`；import `MarketBreadth`。
  - `packages/data/src/http-client.ts`：URL 重写新增 `push2ex.eastmoney.com → /em-zdt`。
  - `apps/desktop/vite.config.ts`：新增 `/em-zdt` 代理（target push2ex.eastmoney.com，Referer/UA 头）。
  - `apps/desktop/src/hooks/useStockData.ts`：新增 `useMarketBreadth()` + 纳入 `useMarketStats()`；交易时段 4s / 非交易 30s 刷新；import `MarketBreadth`。
  - `apps/desktop/src/components/market/MarketStats.tsx`：`BreadthCard`（涨停/跌停大数值 + `CompareBars` 对比柱 + 涨跌停比 + 连板高度 + 连板/炸板）+ 骨架/「—」降级。
  - `apps/desktop/src/pages/OverviewPage.tsx`：接入 `<MarketStats />`（见 REQ-MKT-07）。
- **2026-07-15 🔧 设计稿同步（MasterGo）**
  - 用户于 MasterGo 重做「A股涨跌停比」卡片设计稿；读回 `get_frontend_code` 导出整页 HTML 并解析 `breadth-card` 子树。
  - UI：`MarketStats.tsx` 的 `BreadthCard` 重构：删除「不含 ST/科创板」胶囊；`CompareBars` 双竖柱改为单根横向占比条（红涨停左 `width:upPct%` + 绿跌停右 `flex-1`，高 16px、圆角 2px、overflow-hidden）；仅保留「涨跌停比 X : 1」。
  - ⚠️ 纠正：上方"删除连板 N 家 · 炸板 M 家"系当时解析整页 HTML 被 `head -120` 截断漏看 `breadth-meta` 所致——设计稿实际**含**「连板 8 家 · 炸板 5 家」行。详见下方整改记录（2026-07-15 🔧）。
  - 数据层 `useMarketBreadth()` 不变（limitUp/limitDown 已满足新设计）。状态：🔧→🧪→👀。
- **2026-07-15 🧪 自测**
  - 方法：tsc --noEmit + vite build + 无头 Chrome 抓 pageerror / #root 渲染。
  - 结果：AC1-AC5 通过；AC6 依赖用户本机含网环境确认。
  - 证据：tsc 仅 ProfilePage 既有 2 错，无新增；vite build 成功；无头渲染 `#root` 20,665 字符、含「A股涨跌停比」、零 `pageerror`；16 个 `500` 均为沙箱无外网代理失败（预期）。

- **2026-07-15 🔧 用户验收反馈整改（③）**
  - 用户本机验收反馈：③ 涨跌停比这一行，「连板 N 家 · 炸板 M 家」被删除是不对的，设计稿有。
  - 根因：上次读回设计稿时整页 HTML 被 `head -120` 截断，漏看 `breadth-card` 的 `breadth-meta → board-meta`（连板 8 家 · 炸板 5 家，14px）；误判设计稿无此行并删除。
  - 读回确认：用完整 HTML 提取 + `get_selection_node` 复核——设计稿 `breadth-meta` 行含 `ratio-wrap`(涨跌停比 3.9:1) + `board-meta`(连板 8 家 · 炸板 5 家，14px #E8E8E8)。
  - 整改：`BreadthCard` 在「涨跌停比 X : 1」同行右侧加回 `连板 {data.consecutive} 家 · 炸板 {data.broken} 家`（`MarketBreadth` 已有 consecutive/broken 字段；设计稿该行为 14px #E8E8E8）。
  - 状态：👀 打回 → 🔧 整改 → 🧪 自测 → 重新 👀。
- **2026-07-15 🧪 整改自测**
  - 方法：tsc --noEmit + 无头 Chrome 抓 DOM 文案。
  - 证据：tsc 无新增；无头渲染 `bodyText` 含 `连板 16 家 · 炸板 33 家`（③通过，数值来自本地缓存兜底）、零 `pageerror`（沙箱无外网数据代理 500 为预期）。

- **2026-07-15 🔧 用户本机验收反馈整改（内容垂直居中）**
  - 用户本机验收反馈：「A股涨跌停比下方的信息应该整体在下方区域居中，现在是顶部对齐的」。
  - 整改：`MarketStats.tsx` 的 `BreadthCard` 根节点改为 `h-full flex flex-col`；标题保持顶部（`mb-3`），下方内容块（涨停/跌停大数值 + 横向占比条 + 涨跌停比/连板行）包入 `flex-1 flex flex-col justify-center`，整体在卡片下半区垂直居中。因两块卡片同处 grid 且等高拉伸（交易额卡更高），涨跌停比卡内容不再贴顶。加载态/无数据态同步加 `flex-1` 居中。
  - 状态：👀 打回 → 🔧 整改 → 🧪 自测 → 重新 👀。
- **2026-07-15 🧪 本轮整改自测**
  - 方法：tsc --noEmit + 重启 dev server + 抓取热更新模块确认新代码 + 无头 Chrome 抓渲染。
  - 证据：tsc 仅 ProfilePage 既有 2 错、无新增；dev server 已热更新含 `justify-center`/`flex-1 flex flex-col`；无头渲染 `#root` 22,705 字符、零 `pageerror`；连板行/`chartHeight:81` 无回归。

## 4. 闭环
- 待用户本机验收 AC6 通过后，状态 → ✅，回写 `requirements.md`（REQ-MKT-08 → 已交付）与 `roadmap.md` 实施记录。
- **遗留 / follow-up**：东财「涨停板行情」口径不含 ST / 科创板，已在 UI 标注；若需全口径另议。封板率为估算值（基于涨停池开板计数）。
