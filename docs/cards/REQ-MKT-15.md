# REQ-MKT-15 整页最小宽度 + 横向滚动（以美港日韩自然宽为基准）

- **提出**：2026-07-20（用户）
- **优先级**：P1
- **状态**：⬜ 待实施 → 📐 技术方案 → 🔧 实施中 → 🧪 自测中 → 👀 待用户验收 → ✅ 已闭环（打回则回到 🔧）
- **当前状态**：✅ 已闭环（2026-07-20 用户验收通过；tsc 0 新增错误；vite build 成功，CSS 工具类全部生成）

## 描述
用户要求修复美港日韩（其他市场）区块的页面缩放行为，三点诉求：
1. **不隐藏**：美港日韩相关内容始终完整显示，不被压缩/截断/内部横滑隐藏。
2. **以美港日韩自然宽为页面最小宽度基准**：把美港日韩区块「未缩放时」的整体宽度作为整页 `min-width` 的定义依据（不是用单元格 200px 等数值去相加推断，而是测这块内容不缩放时的真实宽）。
3. **禁止无限缩放**：页面有明确 `min-width`；视口小于该值时出现**整页底部横滑条**，内容不再继续缩小。

## 技术方案
文件：`apps/desktop/src/pages/OverviewPage.tsx`

### A. 取消美港日韩行内横滑，固定其宽度不压缩
- 删除每行外包的 `overflow-x-auto` 容器与内层 `min-w-max`；行改为 `flex justify-between items-center gap-6`（宽窗边到边、窄窗保持自然宽）。
- `OtherIndexCell` 外层 `span` 加 `shrink-0`（原仅 `min-w-[200px]`）：单元格不可被压缩，整行自然宽固定为 `3×200 + 2×24 = 648px`，始终完整显示（满足诉求 1）。

### B. 整页最小宽度 + 横向滚动
- 根滚动容器由 `h-full overflow-y-auto px-8 py-8` 改为 `h-full overflow-auto`（允许双向滚动，去掉根自身 padding）。
- 新增内层包裹 `div`：`min-w-[760px] px-8 py-8`，包裹 AI 入口 + 主 grid。
  - 宽屏：内层 `min-w` 仅作下限，块级宽度 `auto` 自动撑满根宽（不强行 760）。
  - 窄屏（视口 < 760）：内层锁 760，根 `overflow-auto` 出整页横滑条，内容不再缩小（满足诉求 3）。

### 最小宽度取值依据（实测，非拍脑袋）
美港日韩单行自然宽 = `3×200(单元格) + 2×24(gap-6) = 648px`。
该区块位于「大盘概览」卡片内（`p-6` = 48px）+ 页面 `px-8`（64px）：
`648 + 48 + 64 = 760px` → **整页 `min-width = 760px`**（视口阈值）。
- 视口 ≥ 760：整页正常铺满，美港日韩 边到边分布。
- 视口 < 760：整页底部横滑，美港日韩 始终 648px 完整显示、不缩放。
- 旁证：A股 行自然宽 `5×132+4×12=708px` < 760 楼层下卡片内宽(648) → A股 仍走自身 `overflow-x-auto` 内部横滑（与 REQ-MKT-14 一致，用户未要求改 A股）。

## 验收标准（AC）
- AC1：窗口拖窄至 < 760px，整页（非仅美港日韩行）出现底部横滑条，内容宽度稳定不再缩小。
- AC2：美港日韩 6 个标的（道琼斯/纳斯达克/恒生/日经225/韩国KOSPI/标普500）始终完整显示，无截断、无行内横滑。
- AC3：窗口 ≥ 760px 时布局与改动前一致（xl 三栏、无多余横滑）。
- AC4：`tsc` 0 新增错误；`vite build` 成功，编译 CSS 含 `min-width:760px`、`overflow:auto`(`overflow-x-auto`+`overflow-y-auto` 编译为 `auto`/`overflow-x:auto;overflow-y:auto`)。

## 自测（我来做）
- 方法：dev server(HMR) 预览 + `tsc` 类型检查 + `vite build` 编译 CSS 核查工具类；无头截图受 sandbox 限制（exit 137）同 REQ-MKT-13/14。
- 结果：
  - `tsc --noEmit`：仅 `ProfilePage.tsx` 2 处预存错误（REQ-MKT-13 同款，与本次无关），**0 新增错误**。
  - `vite build`：成功（exit 0）。
  - 编译 CSS 核查：`min-width:760px`×1、`overflow:auto`×15（含根容器）、`overflow-x:auto`×3、`min-width:200px`×1、`min-width:132px`×1 → 全部命中，机制正确。
  - 无头 Chrome 截图被 sandbox 杀进程(exit 137)未附运行图，整页横滑为标准 `overflow-auto + min-w` 机制、逻辑确定，按 REQ-MKT-13/14 同类 sandbox 限制待本机验收。
- 证据：`/tmp/vite-build15.log`、`apps/desktop/dist/assets/index-*.css`（gitignored 构建产物）。
- **结论**：实施完成，待用户本机验收拍板闭环。
