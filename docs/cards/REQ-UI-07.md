# REQ-UI-07: 行情页设计稿高保真修复（AI 输入框 / Trend Sol 字体 / 订阅图标）

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：✅ 已闭环（2026-07-18 用户验收通过；AC3 由 REQ-UI-08 闭环后整体闭环）
- **优先级**：P0
- **提出日期**：2026-07-17
- **提出人**：用户
- **关联阶段**：Phase 1.2
- **关联卡**：REQ-UI-01、REQ-UI-05

---

## 1. 需求描述
> 用户原话：当前页面实现与设计稿存在明显差异，设计稿还原度较低。具体：1）输入框样式（边框、圆角、内边距、占位符文字样式、背景色）与设计稿完全不一致；2）"Trend Sol" 文字字体与设计稿不符；3）订阅按钮/区域缺少设计稿中的图标。请逐项对照设计稿修复，确保整体页面视觉还原度达到设计稿要求。

设计稿来源：MasterGo `app-window 4:3898`（缓存 `.mastergo/design/198968576223971/M/app-window-4-3898.html` + 截图）。

关键设计稿提取：
- `Trend Sol` 标题（4:210）：`color: #E8E8E8; font-size: 30px; font-family: DingTalk JinBuTi; line-height: 38px`
- 订阅按钮（4:179）：`height: 32px; gap: 8px; padding: 2px 12px; background: rgba(255,255,255,0.1); border-radius: 256000px`，内含 24×24 icon `e5861f2faa89f9f6d5708f1c31e4493c.png`，文字 `color: #FFBB00; font-size: 14px; font-family: Douyin Sans; font-weight: 700; line-height: 17px`
- AI 对话输入框（4:09370，截图）：宽 768px，深色面板，多行 textarea，顶部 placeholder `可以问问我茅台走势`，底部工具栏：左侧「+」按钮，右侧「Deepseek V4」模型选择器、麦克风、发送箭头按钮

## 2. 验收标准（Acceptance Criteria）
- [x] AC1：`Trend Sol` 标题使用 `font-family: DingTalk JinBuTi`（字号 30px / 行高 38px / 颜色 #E8E8E8）— **用户通过**
- [x] AC2：订阅按钮左侧显示设计稿中的 24×24 图标，图标资源正确引用，按钮样式（胶囊、背景 rgba(255,255,255,0.1)、黄字 #FFBB00、Douyin Sans 700）与设计稿一致 — **用户通过**
- [ ] AC3：AI 对话输入框从单行 input 改为 textarea，带底部工具栏（+ / Deepseek V4 / 麦克风 / 发送箭头），边框/圆角/内边距/背景色/占位符样式与截图一致 — **打回**：视觉结构通过，但用户指出交互不完整、需补充，转 REQ-UI-08 长期优化
- [x] AC4：运行 `tsc --noEmit` 无新增错误，无头浏览器访问 `localhost:1420` 无 `pageerror` — **自测通过**
- [x] AC5：导航选中态尺寸统一（图标/文字两态零尺寸变化）— **用户通过**

## 3. 实施记录

### 🔧 实施中
- 日期：2026-07-17
- 文件：
  - `apps/desktop/src/pages/OverviewPage.tsx`：标题加 DingTalk JinBuTi
  - `apps/desktop/src/components/AppShell.tsx`：订阅按钮加图标、Douyin Sans 字重
  - `apps/desktop/src/components/market/AiChatEntry.tsx`：重构成 textarea + 底部工具栏
  - `apps/desktop/public/assets/e5861f2faa89f9f6d5708f1c31e4493c.png`：新增图标静态资源
  - `apps/desktop/src/components/AppShell.tsx`：导航选中态尺寸统一（图标恒 `text-lg` 18px、文字恒 10px，选中仅切填充图标+白色，无尺寸跳变）
  - `apps/desktop/src/components/market/AiChatEntry.tsx`：AI 输入框聚焦描边 `focus-within:border-white` → `focus-within:border-white/30`，与搜索框 `focus:border-white/30` 对齐

### 🧪 自测（我来做）
- **方法**：dev server 预览 + 无头 Chrome 访问 `localhost:1420` 抓 `pageerror` / `tsc --noEmit`
- **结果**：通过
- **证据**：
  - `tsc --noEmit`：仅 `ProfilePage.tsx` 既有 2 错（ColumnProps / Dayjs），本次改动 0 新增；packages/ui 同 0 新增。
  - 无头 Chrome（puppeteer-core，1440×900）：
    - `pageerror`：0 个；console 错误均为沙箱无外网导致的数据代理失败（500/ERR_CONNECTION_REFUSED/ERR_EMPTY_RESPONSE），与本次 UI 改动无关。
    - 关键元素探测：
      - `Trend Sol` 标题 `style.fontFamily` = `"DingTalk JinBuTi", "PingFang SC", sans-serif`
      - 订阅按钮 `<img>` 存在，`src = http://localhost:1420/assets/e5861f2faa89f9f6d5708f1c31e4493c.png`（HTTP 200）
      - AI 输入区 tagName = `TEXTAREA`，placeholder = `可以问问我茅台走势`
      - 发送按钮存在且可交互
  - 截图：`/tmp/trend-iq-verify/overview.png`

### 👀 用户验收
- **结果**：部分通过（2026-07-17）
- **日期**：2026-07-17
- **意见**：1（字体）/2（订阅图标）/4（导航选中态尺寸）/5（聚焦描边）通过；3（AI 对话输入框）不通过——视觉结构 OK，但交互不完整、需补充，已拆 REQ-UI-08 跟踪。

## 5. 后续追加修复（2026-07-17，同批验收）
- **导航选中态尺寸统一**（用户反馈：选中/未选中图标和文字大小不一致）
  - 根因：`AppShell.tsx` 图标 `active ? "text-2xl" : "text-lg"`（24/18px）+ `strokeWidth` 随态变化。
  - 修复：图标恒 `text-lg`（18px）、`strokeWidth=4`；选中仅切填充图标变体（`iconFill`）+ 父级 `text-white` 变白，尺寸零变化。
  - 自测证据：无头逐项点击四项导航，图标恒 18×18、文字恒 10px；选中=填充+白，未选中=线性+灰 rgb(102,102,102)；零 pageerror。
- **输入框聚焦描边对齐搜索框**（用户反馈：AI 输入框聚焦描边太白）
  - 修复：`AiChatEntry.tsx` 聚焦描边 `border-white` → `border-white/30`，与 `SearchBar.tsx` 的 `focus:border-white/30` 一致。
  - 自测证据：无头实测 AI 框聚焦 `rgba(255,255,255,0.3)`、搜索框聚焦同样 `rgba(255,255,255,0.3)`；未聚焦 AI=#262626、搜索框=白15%；零 pageerror。

## 4. 闭环
- **结论**：待用户确认后回写 ✅
- **遗留 / follow-up**：若本机缺少 DingTalk JinBuTi / Douyin Sans 字体，系统会回退到 PingFang SC；如需 100% 还原，后续可引入字体文件。
