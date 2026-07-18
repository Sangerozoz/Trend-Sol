# 需求卡 REQ-MKT-01: 行情页内容结构（大盘 / 热门 / A股交易额 / 涨跌停比 / 用户 / 消息热点）

> **门禁声明（强制）**：用户提需求 → 建卡(⬜) → 实施(🔧) → 自测(🧪) → 验收(👀) → 闭环(✅)。状态机不可跳跃，闭环须由用户拍板。
> 本卡为**大需求拆分**：先定结构与数据源（本次交付），再分期实施。详见 §3 分期与 §4 验收。

## 1. 背景
- 原「总览页」(`/`，OverviewPage) 仅为占位（板块行情/自选概览/持仓盈亏三块"即将上线"）。
- REQ-NAV-08 已将左导航第 1 项更名为「行情」，现需把该页建设为真正的行情中枢。
- 现有 Rust collector 已具备 `东方财富→腾讯→Yahoo` 三级 fallback 与指数/个股行情能力；**新增板块、热门、涨停池、财联社电报、持仓/盯盘等采集方法**。

## 2. 需求描述（六大区块）
行情页自上而下 / 分区展示：

### A. 大盘（Major Markets）— 四市场指数
- **A股**：上证指数、深证成指、创业板指、科创50、北证50
- **港股**：恒生指数、恒生科技指数
- **美股**：道琼斯、纳斯达克、标普500
- **日韩股**：日经225、韩国KOSPI
- 展示：指数名 + 点位 + 涨跌幅（红涨绿跌）+ 简要点击进对应市场

### B. 热门（Hot A-share）
- **A股热门板块题材**：行业/概念板块涨跌幅排行（可点进看成分股）
- **A股热门个股**：人气榜 / 热门个股排行（名称 + 涨跌幅 + 热度）

### C. A股交易额
- 沪深京 A 股当日总成交额（汇总展示，可带环比）

### D. A股涨跌停比
- 当日涨停家数 / 跌停家数 + 比值（直观看市场情绪）

### E. 用户（User）
- **自选股**：watchlist 实时行情概览（已有数据源，复用）
- **持仓股**：用户手动录入持仓的盈亏概览（依赖 REQ-PROF-01/02，本地存储）
- **盯盘股**：用户自选监控列表（新增本地列表，区别于 watchlist 的"分析标的"，用于重点盯市）

### F. 消息热点（News Hotspots）
- **类型：财联社电报**（Cailianpress 实时快讯/电报流）
- 展示：时间 + 内容 + 来源；滚动/分页
- 数据源决策见 §3 矩阵（需重点确认）

## 3. 数据源矩阵（已调研）
| 区块 | 数据 | 主源 | 备用 | 接口/备注 |
|---|---|---|---|---|
| A 大盘-A股 | 指数行情 | 东方财富 | 腾讯财经 | `push2.eastmoney.com/api/qt/stock/get?secid=1.000001`(上证) 等；**复用现有 `em_fetch_quote`，传指数 secid** |
| A 大盘-港股 | 恒生/恒科 | 东方财富 | 腾讯 | secid `100.HSI` / `100.HSTECH` |
| A 大盘-美股 | 道指/纳指/标普 | 东方财富 | Yahoo | secid `100.DJIA`/`100.IXIC`/`100.SPX`；Yahoo `^DJI`/`^IXIC`/`^GSPC` |
| A 大盘-日韩 | 日经/韩国 | 东方财富 | Yahoo | secid `100.N225`/`100.KS11`；Yahoo `^N225`/`^KS11`（东财日韩指数 secid 待实采验证，失败走 Yahoo） |
| B 热门板块 | 行业/概念板块榜 | 东方财富 | 财联社风口 | `push2.eastmoney.com/api/qt/clist/get?fs=m:90+t:2`(行业)/`m:90+t:3`(概念)，fields `f12,f14,f3,f62` |
| B 热门个股 | 人气榜/热门股 | 东方财富 | 同花顺 | `emappdata.eastmoney.com/stockrank/getAllCurrentList`（人气榜）；或 `clist` 按热度 |
| C A股交易额 | 总成交额 | 东方财富 | — | 上证+深证+北证 成交额(f6) 求和，或市场概览 API `datacenter-web.eastmoney.com` |
| D 涨跌停比 | 涨停/跌停家数 | 东方财富 | 计算 clist | `push2ex.eastmoney.com/getTopicZTPool`(涨停)+`getTopicDTPool`(跌停)，`date=YYYYMMDD` |
| E 自选股 | 实时行情 | 现有 collector | — | watchlist 已支持 |
| E 持仓股 | 盈亏 | 本地存储 | — | 依赖 REQ-PROF-01/02（手动录入，不接券商） |
| E 盯盘股 | 监控列表 | 本地存储 | — | **新增**：独立于 watchlist 的盯盘集合（store + 我的页录入），行情页展示 |
| F 消息热点 | 财联社电报 | 财联社 | 东方财富快讯 | `https://www.cls.cn/v1/roll/get_roll_list?app=CailianpressWeb&os=web&rn=50`；返回 `data.roll_data[]`(ctime,content,id…)，需 `Referer:https://www.cls.cn`+UA；备用 `newspush.eastmoney.com`（东财快讯） |

> 财联社说明：社区逆向确认的 `get_roll_list` 免 sign，较稳定；`telegraphList` 需动态 sign，作次选。财联社属"资讯源"，不纳入行情三级 fallback，单独维护一套 fetch + 本地缓存 + 4 秒/定时刷新。

## 4. 验收标准（分期）
- **Phase 1（骨架 + 大盘）**
  - AC1：行情页分区布局（A~F 六区块），遵循 DEC-008（宽松/大圆角/大留白）+ DEC-009 颜色等级
  - AC2：大盘四市场指数接入真实数据（东财 secid，复用 `em_fetch_quote`），交易时段 4 秒刷新；非行情区块先占位
- **Phase 2（热门 + 交易额 + 涨跌停）**
  - AC3：热门板块题材 + 热门个股接东财真实数据
  - AC4：A股交易额、涨跌停比接东财真实数据并正确计算
- **Phase 3（消息热点）**
  - AC5：财联社电报流接入（主源财联社 + 东财快讯备），展示时间/内容/来源，4 秒/定时刷新
- **Phase 4（用户-持仓/盯盘）**
  - AC6：持仓股依赖 REQ-PROF-01/02 落地后在行情页展示盈亏
  - AC7：盯盘股新增本地集合 + 我的页录入入口 + 行情页展示

## 5. 实施记录
- 2026-07-13：建卡。调研六大区块数据源（财联社 `get_roll_list`、东财板块/人气榜/涨停池/指数 secid 等），写入 §3 矩阵。待用户确认实施范围与财联社数据源后进入 🔧。
- **2026-07-13（晚）：Phase 1 实施 + 自测**
  - **数据层（@trend-iq/data）**：
    - `types.ts` 新增 `MarketIndexGroup`（A股/港股/美股/日韩股）与 `MarketIndex`（group/code/name/price/changeAmount/changePercent）。
    - `providers/eastmoney.ts` 新增 `getMarketIndices()`：固定 12 支指数 secid 表（A股5/港股2/美股3/日韩2），并行调 `stock/get`，单只失败不影响其余，涨跌额/幅做 api 与 manual 双算校验。
    - `datasource.ts` 暴露 `getMarketIndices()`（指数以东财为准，不走多源 fallback）。
    - `apps/desktop/src/hooks/useStockData.ts` 新增 `useMarketIndices()` hook：交易时段 4 秒刷新、非交易时段 30 秒（与既有行情刷新策略一致）。
  - **行情页（`OverviewPage.tsx`）重构为六分区骨架**：
    - 大盘：四市场指数真实数据网格（name/点位/涨跌幅，红涨绿跌 `text-up-red`/`text-down-green`），无数据兜底提示。
    - 热门 / A股交易额 / A股涨跌停比 / 消息热点：带「即将上线」徽标的占位区块（含具体子项清单）。
    - 用户：自选股接 watchlist 真实数据；持仓股/盯盘股占位（依赖 Phase 4 + 本地集合）。
    - 遵循 DEC-008（宽松大间距大圆角大留白）+ DEC-009 颜色三档（text-primary/secondary/muted）。

- **2026-07-13（晚·补）大盘指数多源 fallback**：用户反馈大盘指数获取失败（东财在其网络被挡）。增强为**逐支指数跨源兜底**：
  - 新增 `MarketIndexDef`（含东财 secid / 腾讯代码 / 雅虎代码 三套），统一表 `MARKET_INDEX_DEFS`（12 支）。
  - `DataSource` 接口新增 `getMarketIndex(def)` 与 `getMarketIndices()`；东财/腾讯/雅虎 provider 各自实现 `getMarketIndex`（单支抓取+失败返回 null 不抛）。
  - `DataSourceManager.getMarketIndices()`：**逐支遍历所有 provider**（本地缓存→东财→腾讯→雅虎），某支全源失败才缺失，不拖累其它支；某源失败自动换下一源。
  - `datasource.getMarketIndices()` 改为走 manager（不再固定只用东财）。
  - 同花顺无免费行情 API（前期已确认），未纳入；沿用项目既有的 东财→腾讯→雅虎 三源体系，覆盖 A股/港股/美股，日韩以雅虎 `^N225`/`^KS11` 为主。

## 6. 闭环
- **Phase 1：👀 待用户验收**（六分区骨架 + 大盘多源真实数据，代码已实施并自测）。用户拍板后标记 ✅ 并回写 requirements/roadmap。
- Phase 2~4：待后续指令逐 Phase 实施。
