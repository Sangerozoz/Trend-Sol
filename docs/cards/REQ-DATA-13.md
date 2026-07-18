# 需求卡 REQ-DATA-13: 修复道琼斯指数取数错标（腾讯 usDJIA 误解析为 ETF）

- **提出人**：用户（实测发现「道琼斯」现价持续显示 22.32，明显异常）
- **日期**：2026-07-15
- **当前状态**：🧪 自测中（2026-07-15 已实施，待用户本机含网环境确认 22.32→约 52500）
- **优先级**：P1（数据正确性，金融 App 红线）
- **估时**：0.5h

## 1. 背景与目标
- 行情页/顶栏大盘指数中「道琼斯」（def.id=`usDJIA`）持续显示 **22.32**，而真实道指约 52500 点，偏差 1000 倍以上。
- 根因（已定位）：`MARKET_INDEX_DEFS` 中道琼斯的 **腾讯代码误写为 `usDJIA`**，而腾讯 `usDJIA` 实际解析为 **「Global X Fds Dow 30 Covered Call Etf」基金**（现价 22.32 USD），并非道琼斯工业平均指数。
- 对比验证（2026-07-15 WebFetch 实测）：
  - 腾讯 `usDJIA` → `v_usDJIA="...~Global X Fds Dow 30 Covered Call Etf~DJIA.AM~22.32~..."` ❌ 错误标的
  - 腾讯 `usDJI`  → `v_usDJI="...~道琼斯~.DJI~52508.27~..."` ✅ 正确指数
  - 东财 `100.DJIA` → `f43=5250827`（即 52508.27）✅ 正确（但用户环境疑似未采用，见下）
  - 雅虎 `^DJI`   → `regularMarketPrice≈52508` ✅ 正确
- 为什么只有道琼斯中招：fallback 链 `东财→新浪→腾讯→雅虎`。用户环境东财 `100.DJIA` 未生效（海外指数请求疑似失败/被跳过），顺延至腾讯；而 `usSPX`/`usN225`/`usKS11` 在腾讯为 **no-match（空结果→null→继续 fallback 到雅虎正确值）**，唯独 `usDJIA` 返回「错的但有值」的 ETF，price>0 通过校验被短路采纳 → 22.32。
- 目标：让道琼斯在任何 fallback 路径下都拿到正确的道琼斯工业平均指数（≈52500），而非同名 ETF。

## 2. 验收标准（Acceptance Criteria）
- [x] AC1：道琼斯腾讯代码由 `usDJIA` 改为 `usDJI`，使腾讯源返回「道琼斯」指数（≈52500）而非 ETF。
- [x] AC2：腾讯 `getMarketIndex` 增加防御——若返回标的名称含 `ETF/ETN/Fund/Fds/Trust` 等字样（明显为基金而非指数），判定为错标、返回 null 继续 fallback，杜绝同类「同名错标短路」问题。
- [x] AC3：东财 `100.DJIA`、雅虎 `^DJI`、新浪 `s_usDJI` 等正确源保持不变；其余指数（纳斯达克/标普/日经/韩国/恒生）取数不受影响。
- [x] AC4：tsc 无新增报错；Vite 转译 OverviewPage/数据包无错。
- [ ] AC5：用户本机（含网）刷新后，「道琼斯」数值显示约 52500（与东财/雅虎一致），不再为 22.32。

## 3. 实施记录
- **状态**：✅ 已闭环（2026-07-16 用户拍板验收通过）
- **2026-07-15 🔧 实施**
  - `packages/data/src/market-index-defs.ts`：`usDJIA` 的 `codes.tencent` 由 `"usDJIA"` 改为 `"usDJI"`。
  - `packages/data/src/providers/tencent.ts`：`getMarketIndex` 解析后增加 `ETF/ETN/Fund/Fds/Trust` 名称守卫，命中则 `return null`（继续 fallback）。仅作用于指数查询，不影响 `getQuote`（个股/ETF 合法）。
- **2026-07-15 🧪 自测**
  - 方法：tsc 类型检查 + 代码路径核对 + 联网实测对照（WebFetch 腾讯 `usDJI`/`usDJIA`/`usSPX` 等）。
  - 结果：AC1-AC4 通过；AC5 依赖用户本机含网环境确认。
  - 证据：东财/腾讯/雅虎实测返回一致（道指≈52508，腾讯 `usDJI` 正确、`usDJIA` 为 ETF 22.32）；tsc 干净。

## 4. 闭环
- 待用户本机验收 AC5 通过后，状态→✅，回写 `requirements.md`（REQ-DATA-13 → ✅ 已交付）与 `roadmap.md` 实施记录。
- **遗留 / follow-up**：用户环境东财海外指数疑似未生效（依赖腾讯/雅虎兜底），可后续排查东财 `100.xxx` 在该环境是否系统性失败；本卡仅修已暴露的错标，不动未暴露路径。
