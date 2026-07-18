# 需求卡 REQ-MKT-11: A股涨跌停比 → A股涨跌比（标签 + 数据同步修改）

- **提出人**：用户（"A股涨跌停比修改为 A股涨跌比，数据同步修改"）
- **日期**：2026-07-16
- **当前状态**：👀 待用户验收（2026-07-16 实施完成 + 🧪 自测通过，待本机含网确认涨跌家数）
- **优先级**：P1
- **关联阶段**：Phase 1.2
- **关联决策**：DEC-008（宽松大间距）/ DEC-009（颜色三档，红涨绿跌）
- **关联需求**：REQ-MKT-07（同处行情页「大盘概览」模块A）、REQ-MKT-08（原涨跌停比，本次改为涨跌比，原涨停/跌停口径不再使用）

## 1. 需求描述
> 用户原话："A股涨跌停比修改为 A股涨跌比，数据同步修改"
- 行情页「大盘概览」模块A 第二块：标题由「A股涨跌停比」改为「A股涨跌比」。
- 数据由「涨停家数 / 跌停家数」（及连板/炸板，限涨停用）改为「上涨家数 / 下跌家数 / 平盘家数」（市场宽度，advance/decline）。
- 涨跌比 = 上涨家数 : 下跌家数（如 1.8:1）；对比条按 上涨/(上涨+下跌) 占比着色（红涨绿跌）。
- 移除原「连板 X 家 · 炸板 Y 家」（限涨停用，与涨跌比无关）。

## 2. 验收标准（Acceptance Criteria）
- [ ] AC1：卡片标题为「A股涨跌比」（非「涨跌停比」）。
- [ ] AC2：展示上涨家数（红）、下跌家数（绿），数值来自真实数据源（东财指数 `f162`/`f163`/`f164` 上证+深证求和）。
- [ ] AC3：展示涨跌比（如 `1.8 : 1`；仅涨为 `∞`；无数据 `—`）。
- [ ] AC4：对比条按 上涨/(上涨+下跌) 占比着色（红涨绿跌），与 DEC-009 一致。
- [ ] AC5：移除「连板/炸板」行；可保留「平盘 X 家」小字。
- [ ] AC6：加载骨架 / 无数据降级「—」；零运行时报错；tsc 无新增报错。
- [ ] AC7：用户本机（含网）刷新后显示真实涨跌家数（东财可用时；东财不可用时降级「—」，与其余源一致）。

## 3. 实施记录
- **状态**：🔧 实施中
- **2026-07-16 🔧 实施**
  - `packages/data/src/types.ts`：新增 `MarketAdvanceDecline { up, down, flat, updateTime }` 接口；`DataSource` 接口新增 `getMarketAdvanceDecline(): Promise<MarketAdvanceDecline | null>`。
  - `packages/data/src/providers/eastmoney.ts`：实现 `getMarketAdvanceDecline()`——分别请求上证指数(1.000001)、深证成指(0.399001) 的 `stock/get`（`fields=f162,f163,f164`，指数口径即上涨/下跌/平盘家数），求和返回；异常返回 null。
  - `packages/data/src/providers/{sina,tencent,yahoo}.ts`：新增 `getMarketAdvanceDecline()` 返回 null（兜底，与其余源一致）。
  - `packages/data/src/datasource.ts`：`DataSourceManager` 加跨源 fallback 方法 + 导出 `getMarketAdvanceDecline()`。
  - `apps/desktop/src/hooks/useStockData.ts`：新增 `useMarketAdvanceDecline()`（交易时段 4s / 非交易 30s）；并入 `useMarketStats()` 返回 `advanceDecline`。
  - `apps/desktop/src/components/market/MarketStats.tsx`：`BreadthCard` 改涨跌比（标题、上涨/下跌/平、涨跌比、占比条、移除连板/炸板）；`MarketStats` 透传 `advanceDecline`。
  - 状态：🔧 实施中 → 待自测后 🧪 → 👀。

- **2026-07-16 🧪 自测**
  - 方法：tsc --noEmit + 重启 dev server(清残留) + 无头 Chrome 抓 pageerror / DOM 文案 / 标签替换。
  - 证据：tsc 仅 ProfilePage 既有 2 错、无新增；无头渲染 `#root` 含「A股涨跌比」、不含旧「涨跌停比/涨停/跌停/连板/炸板」、`PAGEERRORS=0`（29 个 500 均为沙箱无外网数据代理失败、预期，卡片降级「—」）；`MarketAdvanceDecline` 类型与四 Provider(`eastmoney` 实现 / `sina`/`tencent`/`yahoo`/`local-cache` 兜底 null) + `DataSourceManager` fallback + 导出函数 全部接好。
  - 状态：🔧 实施 → 🧪 自测 → 👀 待用户本机含网验收（确认上涨/下跌/平盘家数与涨跌比正确；东财不可用时降级「—」）。

## 4. 闭环
- 用户本机含网验收 AC2/AC7 通过后，状态 → ✅，回写 `requirements.md` 与 `roadmap.md`。
- **遗留 / follow-up**：涨跌比口径为沪深A股（上证+深证，不含北交所/港股），与东财指数 `f162/f163/f164` 口径一致；如需含北交所另议。
