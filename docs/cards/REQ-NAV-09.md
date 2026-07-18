# 需求卡 REQ-NAV-09: 顶部全局栏大盘指数补真实数据

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：✅ 已闭环（2026-07-16 用户拍板验收通过）
- **优先级**：P1
- **提出日期**：2026-07-14
- **提出人**：用户
- **关联阶段**：Phase 1.2
- **关联决策**：REQ-NAV-03（顶部全局栏）、REQ-DATA-03/REQ-DATA-12（多源 fallback）

---

## 1. 需求描述
> 用户原话：「顶部状态栏吧，这里有上证深证创业板+搜索+设置 这个栏哈 其中上证深证创业板 缺少数据，补一下」

**理解**：
- 顶部全局栏（`TopGlobalBar`，固定于所有页面）展示 上证 / 深证 / 创业板 三大指数，此前为 mock 占位（`INDICES` 写死 + 空 `useEffect`），点位恒为 `--`、无涨跌幅。
- 需接入真实数据源，展示实时点位 + 涨跌幅（红涨绿跌）。
- 复用现有大盘指数多源 fallback 链路（东财→新浪→腾讯→雅虎），与行情页（`useMarketIndices`）同源、react-query 按 queryKey 共享缓存，交易时段 4 秒刷新。

## 2. 验收标准（AC）
- [x] AC1：顶栏展示 上证 / 深证 / 创业板 三项，点位与涨跌幅来自真实数据源（非 mock）。
- [x] AC2：涨跌幅按中国习惯红涨绿跌着色；无数据时显示 `--`（保持布局稳定，不留白跳动）。
- [x] AC3：复用 `useMarketIndices()`（多源 fallback + 交易时段 4 秒刷新），不新增独立请求逻辑。
- [x] AC4：移除原 mock `INDICES` 常量与空 `useEffect` 占位；`tsc` 与 Vite 转译无新增报错。
- [ ] AC5：用户本机（有网）刷新确认顶栏三大指数出真实数据、红涨绿跌正确。

## 3. 实施记录
### 🔧 实施中
- `apps/desktop/src/components/AppShell.tsx`：
  - 移除 `import { useState, useEffect }` 与 mock `INDICES` 常量、空 `useEffect`。
  - 新增顶栏固定顺序常量 `TOP_INDEX_CODES = ["sh000001","sz399001","sz399006"]` 与简称映射 `TOP_INDEX_LABEL`（上证/深证/创业板），对应 `MARKET_INDEX_DEFS` 的 A股 前三项稳定 id。
  - `TopGlobalBar` 改接 `useMarketIndices()`：以 `code` 建 Map，按固定顺序取三大指数；`idx.price.toFixed(2)` 显示点位，`idx.changePercent` 带符号显示涨跌幅，`>=0` 红（`text-up-red`）否则绿（`text-down-green`）；数据未就绪显示 `--`，布局三槽恒在。

### 🧪 自测（我来做）
- **方法**：`tsc --noEmit` + Vite 转译 `AppShell.tsx`（`http://localhost:1420/src/components/AppShell.tsx`）。
- **结果**：通过。
- **证据**：
  - `tsc` 对 AppShell 无报错（仅 `ProfilePage.tsx` 两个历史预存错误，无关）。
  - Vite 转译返回 `HTTP 200`、`bytes=25455`、无 transform 错误。
  - 标记已入产物：`useMarketIndices`(3处) / `TOP_INDEX_CODES`(2) / `sh000001`(2)；`useState`(0) / `useEffect`(0) 已彻底移除。

### 👀 用户验收
- **结果**：✅ 通过
- **日期**：2026-07-15
- **意见**：用户拍板验收通过（顶栏三大指数已接真实数据）。

## 4. 闭环
- **结论**：✅ 已闭环（2026-07-15 用户拍板）。已回写 `requirements.md`（REQ-NAV-09 → ✅ 已交付；并标注 REQ-NAV-03 大盘指数数据已落地）与 `roadmap.md` 实施记录。
- **遗留 / follow-up**：搜索框、设置入口维持现状（设置入口去留仍待 DEC-006 未决项）；港股/美股/日韩指数不在顶栏展示（仅 A股 三大）。
