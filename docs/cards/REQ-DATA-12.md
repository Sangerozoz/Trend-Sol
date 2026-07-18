# 需求卡 REQ-DATA-12: 接入新浪财经数据源（大盘指数 + 个股兜底）

- **关联需求**：REQ-MKT-01（大盘/个股依赖）、REQ-DATA-03（fallback 顺序）、DEC-数据源优先级
- **提出**：2026-07-13（用户确认新浪财经在其环境可用，且东方财富在大盘页获取失败）

## 1. 需求描述
用户环境实测：**东方财富大盘接口失败、腾讯/雅虎亦可能受限，而新浪财经可用**。为使行情底座不塌，将**新浪财经**作为新数据源接入 `@trend-iq/data` 的 fallback 链，覆盖：
- 大盘指数（A股/港股/美股/日韩，用 `s_<code>` 紧凑格式）
- 个股实时行情（用 `hq.sinajs.cn/list=<symbol>`）

财联社（消息热点）与板块数据另行规划（见 REQ-MKT-01 Phase 2/3）。

## 2. 验收标准（AC）
- [x] AC1：新增 `SinaProvider`，实现 `getQuote`（个股）与 `getMarketIndex`/`getMarketIndices`（大盘），插入 `DataSourceManager` 链 **东财 → 新浪 → 腾讯 → 雅虎**。
- [x] AC2：`MarketIndexDef.codes` 扩展 `sina` 字段，12 支指数补齐新浪代码；A股指数（`s_sh000001` 等）为标准可靠代码，港股/美股/日韩为最佳猜测（失败自动 fallback 雅虎）。
- [x] AC3：Vite 代理新增 `/sina-quote` → `hq.sinajs.cn`（带 `Referer: finance.sina.com.cn`）；`http-client.ts` 浏览器侧 URL 重写同步。
- [x] AC4：浏览器预览无 `pageerror`，大盘/个股取数链路不崩溃（真实数据依赖用户本机网络）。
- [x] AC5：`tsc --noEmit` 数据层改动类型零错误。

## 3. 实施记录
- 2026-07-13：
  - `types.ts`：`MarketIndexDef.codes` 增加 `sina` 字段。
  - `market-index-defs.ts`：12 支指数补齐 `sina` 代码；A股用标准 `s_sh000001` 等，港股/美股/日韩用最佳猜测（`s_hkHSI`/`s_usDJI`/`s_usIXIC`/`s_usSPX`/`s_jpN225`/`s_krKS11`）。
  - 新增 `providers/sina.ts`：`getQuote`（GBK 文本解析，数值字段）、`getMarketIndex`（`s_` 紧凑格式，用定义名称避免乱码）、`getMarketIndices`；K线/分时/搜索返回空交其他源。
  - `datasource.ts`：注册 `SinaProvider`，顺序 东财→新浪→腾讯→雅虎。
  - `vite.config.ts` + `http-client.ts`：新增 `/sina-quote` 代理与重写。

## 4. 自测证据（无头 Chrome）
- 浏览器预览（`#/`）加载：无 `pageerror`，行情页六分区正常渲染。
- 沙箱无外网（新浪/东财/腾讯/雅虎均 403/500），真实数据需用户本机验证；链路不崩溃即达标。
- `tsc --noEmit`：本需求改动 0 类型错误（desktop 仅存 2 个与本次无关的 `ProfilePage.tsx` 预存错误）。

## 5. 闭环
- 状态：🧪 自测完成 → 👀 待用户验收（用户本机刷新确认大盘有数据即算通过）。
- 用户拍板后回写 requirements（REQ-DATA-12 → ✅）与 roadmap。
