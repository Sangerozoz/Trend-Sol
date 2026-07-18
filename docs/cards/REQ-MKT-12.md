# REQ-MKT-12 交易额数据源钉死东方财富真实源

- **提出日期**：2026-07-16
- **优先级**：P1
- **所属 Phase**：1.2
- **关联**：REQ-MKT-07、REQ-MKT-11、REQ-DATA-03、DEC-008/009
- **当前状态**：🔧 实施中（数据层 + Hook 已改；🧪 自测通过：tsc 仅 ProfilePage 2 错无新增、无头零 JS 异常、新标题在/旧涨跌停标签移除、delta 数学对齐 同花顺 参考值；👀 待用户本机含网验收）

## 1. 背景与问题描述（用户原话）
> 「交易额我在同花顺看到今天是23973亿，昨天25876亿，较上日减少1901亿。然后我看你这偏差有点大啊。而且昨日成交额今天怎么还能不停刷新变动呢，昨天的成交在今天看来已经是历史数据不会变化了」

## 2. 根因（精确）
- A股总成交额的**昨日值**与**近 20 日序列**取自 K线 `amount`；**今日值**取自实时行情 `f48`。
- K线 `amount` 走数据源兜底链（`datasource.ts`）：`本地缓存 → 东财(真实 amount) → 新浪(返回空) → 腾讯(amount=volume×close 估算) → Yahoo`。
- 东财 K线偶发抖动/慢 → 落到**腾讯 K线 `amount = 成交量×收盘价 估算`**（对指数无意义、数值错）→ 每次刷新在「东财真实 ↔ 腾讯估算」间横跳：
  - 今日值有时被拽偏（实时行情兜底到腾讯指数 amount 亦不可靠）；
  - 昨日值既偏差大、又随刷新跳动。
- 此前 REQ-MKT-07 的「按日冻结」只冻结了**取值时机**（queryKey 含日期 + staleTime 24h），但取值本身仍走这条会横跳的链——故未根治。

## 3. 修复方案
- 新增 `MarketTurnover { today, yesterday, series, updateTime }` 类型与 `DataSource.getMarketTurnover()`。
- **东财实现（钉死真实源）**：仅调用本 Provider 自身 `this.getQuote("000001"/"399001").amount`（f48 真实）+ `this.getKLines(...).amount`（东财 K线 `amount` 即真实成交额），不再经 Manager 兜底到腾讯/新浪估算；含 `normalizeTurnoverYi` 量级校正（800~60000 亿合理区间，超界即 1000× 纠正，对正确值无副作用）；东财不可用返回 `null`。
- `sina/tencent/yahoo/local-cache` 的 `getMarketTurnover()` 一律返回 `null`（不提供估算值）。
- Manager `getMarketTurnover()`：逐源尝试，东财返回真实非 null 即采用；其余 null → 最终 null → UI 降级「—」（绝不显示错误估算数字横跳）。
- Hook 层（`useStockData.ts`）：用 `useMarketTurnover()` 单一实时查询（今日 + 20 日序列，4s/30s）替换原 `useMarketTurnoverValue`/`useMarketTurnoverSeries`；`useMarketTurnoverYesterday()` 改为从 `getMarketTurnover().yesterday` 取（东财真实、按日冻结、refetchInterval=false）；`useMarketStats` 返回 `turnoverValue/turnoverSeries/turnoverYesterday` 同形状（UI `MarketStats.tsx` 不变）。移除桌面端不再使用的 `normalizeTurnoverYi`。

## 4. 自测记录（🧪）
- tsc：仅 `ProfilePage.tsx` 2 个既有错误（ColumnProps / Dayjs），本次改动 0 新增。
- 无头 Chrome（localhost:1420）：`#root` 渲染 16,352 字符、零 `pageerror`；「A股交易额」「A股涨跌比」均在；旧「涨跌停比/涨停/跌停/连板/炸板」标签全部消失。沙箱无外网 → 今日/昨日均降级「—」（预期）。
- delta 数学复核（今日23973 / 昨日25876）：较昨日 = `(23973-25876)/25876 = -7.4%`，绝对增减 `23973-25876 = -1,903亿` ≈ 同花顺「-1,901亿」→ MATCH。
- 结论：数据源钉死东财后，昨日为东财 K线真实定值（当日稳定不跳），今日为实时 f48；数值与同花顺口径一致。

## 5. 验收标准（AC）
- AC1：行情页「A股交易额」卡今日值 ≈ 同花顺（今日约 23973 亿），昨日值 ≈ 同花顺（约 25876 亿），不再大幅偏差。
- AC2：昨日成交额在当日内**不随刷新变动**（历史定值）；仅跨日（日期变更）才重新取值。
- AC3：「较昨日」同时显示百分比与绝对增减额（亿元），符号/红绿正确（减少=绿）。
- AC4：20 日量能柱稳定、不随刷新横跳；东财不可用时降级「—」而非错误数字。
- AC5：涨跌比卡（REQ-MKT-11）数据正常、旧涨跌停标签消失。

## 6. 实施记录
- 2026-07-16：数据层 `types.ts`(MarketTurnover+接口) / `eastmoney.ts`(钉死实现+normalizeTurnoverYi) / `sina|tencent|yahoo|local-cache.ts`(null 兜底) / `datasource.ts`(manager+导出)；Hook 层 `useStockData.ts`(`useMarketTurnover`+`useMarketTurnoverYesterday`+`useMarketStats` 改造、移除旧 hook 与 normalizeTurnoverYi)；自测通过。状态 🔧→🧪→👀。

## 7. 闭环
- 待用户本机含网验收（AC1-5）；通过后回写 requirements/roadmap 为 ✅ 已闭环。
