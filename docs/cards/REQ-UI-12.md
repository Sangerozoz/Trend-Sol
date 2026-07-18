# REQ-UI-12: AI 回复 Markdown 渲染

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→🔧→🧪→👀→✅，不可跳跃、不可省略。自测（🧪）是交付用户（👀）的前置条件；闭环（✅）需用户拍板。每轮必走，无例外。

- **状态**：✅ 已闭环（⬜→🔧→🧪→👀→✅；2026-07-18 用户验收通过）
- **优先级**：P1
- **提出日期**：2026-07-18
- **提出人**：用户
- **关联阶段**：Phase 1.2
- **关联卡**：REQ-UI-11（提示词 UI 撤销后，AI 内容呈现聚焦 Markdown 渲染）

---

## 1. 需求描述
> 用户原话：「ai回复内容为md格式，但是文字渲染未渲染，只是有md格式文件的标签。 是不是需要加入markdown的库才能正确渲染文字样式，表格这些」

背景：当前 `ChatPage.tsx` 的 assistant 消息以 `whitespace-pre-wrap` 纯文本输出，`m.content` 中的 Markdown 语法（`# 标题`、`**粗体**`、`| 表格 |`、`- 列表`、`> 引用`、\`代码\` 等）被当作纯文本字面显示，用户看到的是原始 MD 标签而非渲染后的样式。

---

## 2. 验收标准（AC）

- **AC1**：assistant 消息中的 Markdown 标题（`#`/`##`/`###`）渲染为对应层级的标题样式（字号/字重/间距），不再显示 `#` 字面符号。
- **AC2**：`**加粗**` / `*斜体*` / `` `代码` `` 渲染为粗体 / 斜体 / 行内代码样式；代码块（``` lang）渲染为带背景的等宽块。
- **AC3**：Markdown 表格（`| col | col |` + 分隔行）渲染为带边框/斑马纹的真实 `<table>`，表头与单元格对齐。
- **AC4**：有序/无序列表（`1.` / `-`）渲染为缩进列表；`>` 引用渲染为带左侧竖线/不同背景的引用块。
- **AC5**：链接（`[文本](url)`）渲染为可点击链接（深色主题下配色可见，安全过滤后仍可点）。
- **AC6**：仅 assistant 消息走 Markdown 渲染；**user 消息保持纯文本**（输入即所见，不解析 MD）；error 消息样式（红绿边框）保持不变。
- **AC7**：引入 Markdown 库后 `tsc --noEmit` 无新增类型错误；对话页渲染无 JS `pageerror`。
- **AC8**：深色主题融合——Markdown 元素配色复用设计 token（text-primary / text-muted / border-default / bg-tertiary / accent 链接），不出现刺眼亮色或白底块。

---

## 3. 实施方案

- 安装依赖：`react-markdown` + `remark-gfm`（GFM 表格/删除线/任务列表），`pnpm -F desktop add react-markdown remark-gfm --store-dir .../.pnpm-store/v11`。
- 新建 `components/chat/MarkdownMessage.tsx`：封装 `<ReactMarkdown remarkPlugins={[remarkGfm]}>`，对链接 `a` 加 `target="_blank" rel="noopener noreferrer"`、加 `.markdown-body` 根 class。
- `ChatPage.tsx`：assistant（非 error）消息内容用 `<MarkdownMessage content={m.content} />` 替换纯文本；user / error 维持原样。
- `index.css`：追加 `.markdown-body` 深色主题样式（h1-h3、p、ul/ol/li、table/thead/th/td、code/pre、blockquote、a），复用 token 色。
- 安全：react-markdown 默认不渲染原始 HTML（不 dangerouslySetInnerHTML），天然防 XSS；链接外链加 `rel=noopener`。

---

## 4. 实施记录

- 安装依赖：`pnpm -F desktop add react-markdown@^10.1.0 remark-gfm@^4.0.1 --store-dir .pnpm-store/v11`（react-markdown 走 `hast` 渲染、默认不渲染原始 HTML，天然防 XSS）。
- 新建 `apps/desktop/src/components/chat/MarkdownMessage.tsx`：封装 `<ReactMarkdown remarkPlugins={[remarkGfm]}>`，根节点 `div.markdown-body`；链接 `a` 统一加 `target="_blank" rel="noopener noreferrer"`（外链安全）；组件 `memo` 化避免无关重渲染。
- `ChatPage.tsx`：assistant（非 error）消息内容由纯文本 `whitespace-pre-wrap` 改为 `<MarkdownMessage content={m.content} />`；**user 消息保持纯文本**（输入即所见，`#` 等 MD 符号不解析）、error 消息维持红绿边框（`bg-bg-secondary border border-down-green/40 text-down-green`）不变。
- `index.css`：追加 `.markdown-body` 深色主题样式，复用设计 token（text-primary #e8e8e8 / text-muted #666 / border-default #262626 / bg-tertiary #161616 / accent #3b82f6 链接），覆盖 h1-h3（字号/字重/间距）、p、ul/ol/li、table/thead/th/td（边框+斑马纹）、code/pre（等宽背景块）、blockquote（左竖线+背景）、a（accent 可点）。

---

## 5. 🧪 自测（我来做）

- **tsc --noEmit**：仅 `ProfilePage.tsx` 既有 2 个预存错误（与本次无关），Markdown 改动 **0 新增**。
- **无头 Chrome（localhost:1420，seed localStorage 注入含 MD 的 assistant 消息）**：
  - AC1 标题：渲染出 `<h1>`（字号/字重增大），DOM 不再含 `#` 字面符号 ✅
  - AC2 行内：**加粗** / *斜体* / `行内代码` / 代码块（``` 渲染为带背景等宽块）均正确 ✅
  - AC3 表格：`| col | col |` 渲染出真实 `<table>`（带边框 + 斑马纹，表头/单元格对齐）✅
  - AC4 列表/引用：有序/无序列表缩进渲染、`>` 渲染为带左竖线/不同背景的引用块 ✅
  - AC5 链接：`[文本](url)` 渲染为 `<a target="_blank" rel="noopener noreferrer">` 可点 ✅
  - AC6 隔离：user 消息保持纯文本（`#` 字面保留）、error 消息红绿边框不变 ✅
  - AC7 稳定性：渲染过程 **零 JS `pageerror`** ✅
  - AC8 深色融合：截图 `/tmp/markdown_render.png` 确认各 MD 元素配色贴合黑底 token、无刺眼亮色/白底块 ✅
- 状态：🧪 自测全过，👀 待用户验收。

---

## 6. 用户验收通过

- **2026-07-18**：用户拍板验收通过（与 REQ-UI-10 / REQ-NAV-11 / REQ-NAV-12 一并通过），状态 ✅ 已闭环。
