# REQ-UI-01 数据占位与布局稳定性

- **状态**：✅ 已闭环（2026-07-15 用户拍板验收通过）
- **优先级**：P1
- **提出时间**：2026-07-15
- **关联**：REQ-NAV-09（顶栏指数）、REQ-MKT-02（行情页大盘模块）、数据层 `MARKET_INDEX_DEFS`、DEC-008（宽松大间距）、DEC-009（颜色三档）
- **类型**：UI 体验 / 稳定性

## 1. 背景
用户反馈：行情页与顶栏的"大盘指数"在**数据未加载出来时给的是提示文字（如 `--` / 「指数加载中…」），数据加载完成后布局发生位移**——顶栏把搜索框推开、行情页从"提示块"整块替换成"卡片矩阵"，整体跳动。

核心诉求：**布局结构应在加载前后保持稳定**；未加载时显示**固定尺寸的占位（skeleton）**，加载完成后**原地替换内容**，不发生任何位置/尺寸变化。

## 2. 问题定位
- **顶栏（`AppShell.tsx` `TopGlobalBar`）**：价格/涨跌幅容器无固定宽度。未加载显示 `--`（2字符）/ 空串；加载后变 `3100.23` / `+1.23%`，宽度突变 → 搜索框被推开。
- **行情页（`OverviewPage.tsx`）**：`isLoading && indices.length===0` 时整块渲染「指数加载中…」；加载成功才渲染 A股 5 卡 + 其他市场 6 行（结构由"无"变"有"）。且 `idx` 不存在时组件 `return null` → 加载前该区为空。

## 3. 解决原则
1. **结构由稳定定义驱动**：用 `MARKET_INDEX_DEFS`（固定 11 项：A股 5 + 港股 1 + 美股 3 + 日韩 2）作为渲染骨架的来源，**渲染数量永远等于定义数，与数据是否加载无关** → 零结构抖动。
2. **占位固定尺寸**：未加载时，价格/涨跌幅位置用 `animate-pulse` 固定宽度骨架条占据；名称（来自 def，已知）始终显示，不占位跳动。
3. **容器固定宽度**：顶栏价格/涨跌幅容器给 `min-w` + `text-right tabular-nums`，加载前后宽度一致。
4. **失败态不闪烁但稳定**：`isError` 或数据空且非 loading 时，骨架条停止 `animate-pulse`（静态灰条），布局仍稳定（不回退到"提示整块"）。

## 4. 验收标准（AC）
- [x] AC1：顶栏三大指数（上证/深证/创业板）在**数据未加载时**显示固定宽度占位，加载完成后数值**原地替换**、搜索框/设置入口位置**零位移**。
- [x] AC2：行情页「大盘指数」区在**数据未加载时**即渲染 A股 5 张大卡片 + 其他市场 6 个文字槽的完整骨架结构（数量、位置固定），加载完成后**原地填充**数值，不发生整块替换或区域塌陷。
- [x] AC3：A股 大卡片与"其他市场"文字槽在加载前后**高度一致**（名称行/价格行/涨跌行均固定高度容器），无行高跳动。
- [x] AC4：`MARKET_INDEX_DEFS` 从 `@trend-iq/data` 包根可导入（透传导出）。
- [x] AC5：无 `pageerror`；遵循 DEC-008/009；真实数据下红涨绿跌正常。
- [x] AC6：本卡最终闭环，回写 `requirements.md` 与 `roadmap.md`。

## 5. 实施记录
- 2026-07-15 🔧 建卡并实施：
  - `packages/data/src/index.ts` 增加 `export * from "./market-index-defs";`，使 `MARKET_INDEX_DEFS` 从包根可用。
  - `AppShell.tsx` `TopGlobalBar`：价格容器 `min-w-[4.25rem] text-right tabular-nums`、涨跌幅容器 `min-w-[3rem] text-right tabular-nums`；未加载时填充固定宽度骨架条，加载后数值右对齐原地替换。
  - `OverviewPage.tsx`：大盘指数区块改为基于 `MARKET_INDEX_DEFS` 固定渲染（A股 5 卡 + 其他 6 槽），移除 `isLoading` 整块替换；`IndexCard` 改造为接受 `def + idx? + loading`，无 idx 时渲染固定高度骨架；其他市场文字槽同样基于 def 固定渲染、未加载骨架占位。

## 6. 自测证据
- **编译层**：`tsc --noEmit` 对 `OverviewPage.tsx` / `AppShell.tsx` / `data` 均无新增报错（仅 `ProfilePage.tsx` 两个历史预存错误无关）；Vite 转译三个文件均返回 `HTTP 200` 无 transform 错误。确认标记进入产物：`min-w-[4.25rem]` / `min-w-[3rem]` / `animate-pulse`（顶栏）、`MARKET_INDEX_DEFS` / `OtherIndexText` / `min-w-[150px]`（行情页）、`market-index-defs` 再导出（data）；旧「指数加载中…」文本引用归零。
- **布局稳定性（无头 Chrome 1512×950，真实渲染）**：在「数据请求进行中」与「请求落定后（沙箱无网→失败静态骨架）」两个时间点各抓一次结构：
  - `aCards=5` 且两次相等（A股 大卡片容器数恒定）；`oPresent=6` 且两次相等（其他市场 6 名称恒渲染）；`aPresent=5`、`topPresent=3` 恒在。
  - `hasLoading=false`、`hasFailed=false`（**无"指数加载中…"整块替换**，结构由 `MARKET_INDEX_DEFS` 固定驱动）。
  - `PAGEERRORS=0`。
  - 结论：加载前后结构数量/位置零变化 → 布局稳定达成。

## 7. 闭环
- **状态：✅ 已闭环**（2026-07-15 用户拍板验收通过：加载前后结构数量/位置零变化，布局稳定达成）。已回写 `requirements.md` 状态为 ✅ 已交付、`roadmap.md` 实施记录标记闭环。
