# REQ-UI-15: 输入框滚动提示词（CHAT_HINTS）来源与更新机制规划

> 🔒 **MANDATORY（强制门禁）**：本卡必须按状态机走完 ⬜→📐技术方案→🔧实施→🧪自测→👀待审查→✅，不可跳跃。本卡当前处于 📐 技术方案（已定稿，待用户确认实施）。

- **状态**：⬜ 待实施 → 📐 技术方案（已定稿，待用户确认实施）→ 🔧 实施中 → 🧪 自测中 → 👀 待用户验收 → ✅ 已闭环
- **优先级**：P2
- **提出日期**：2026-07-20
- **提出人**：用户
- **关联阶段**：Phase 1.2
- **关联文件**：`apps/desktop/src/lib/chatPrompts.ts`、`apps/desktop/src/components/chat/ChatComposer.tsx`
- **关联技能**：`news-search`（同花顺问财财经新闻，已装）、`tencent-news`（腾讯新闻，已装，仅财经类补充）

---

## 1. 现状（探查结论）

- `chatPrompts.ts` 导出 `CHAT_HINTS: string[]`（12 条 A股 题材提示词），**硬编码静态数组**。
- `ChatComposer.tsx` 用 `setInterval(4000)` 每 4 秒切换一条（`(i+1) % CHAT_HINTS.length`），首页以 GSAP 文字动画展示；Tab 键可填入当前提示词。
- 文件注释约定："市场出现新热点时在此补充/替换条目"——即**更新 = 人工改代码 + 发版**。
- **无任何**：远程拉取、动态生成、本地缓存、版本比对、用户自定义能力。
- 结论：这就是用户反馈"提示词并未更新"的根因——数组是死的，没有自动/远程更新通道。

## 2. 需求目标

规划提示词的**来源（Source）**与**更新机制（Update Mechanism）**，使提示词随财经新闻动态更新（类似微博热点/新闻头条），同时保证：
- 永远有提示词可展示（网络失败/沙箱环境必须降级到内置兜底）；
- 仅限**财经/股票/金融**领域，其他新闻不要；
- 不破坏现有 GSAP 滚动展示与 Tab 填入交互；
- 符合工程约束（Tauri 桌面 app、Rust 后端可原生网络、sandbox 外网受限）。

## 3. 最终方案·来源（双源，财经垂直）

- **主源 `news-search`（同花顺问财财经新闻，已安装）**
  - 调用：`POST https://openapi.iwencai.com/v1/comprehensive/search`，body `{query, channels:["news"], app_id:"AIME_SKILL", size}`。
  - 返回字段：`title` / `summary` / `url` / `publish_time`（**无现成影响力/发布方评分字段**）。
  - 查询约束：query 限定"近10天 财经/股票/金融/政策/行业"，并对 `publish_time` 过滤 `≥ now-10d`。
  - 鉴权：`IWENCAI_API_KEY`（已配置于 ~/.zshrc）。
- **补充源 腾讯新闻 `tencent-news`（已装，仅财经类）**
  - 通过 `run-cli` 拉取，域限定"财经/股票/金融"（其他领域不要）。
  - 增加覆盖面；需腾讯新闻 API Key（news.qq.com，待用户配置；未配则跳过此源）。

## 4. 最终方案·筛选打分（LLM 语义）

- 因 API **不返回**影响力/发布方影响力字段，统一由 **LLM 语义打分**（用户已选）：
  - **时效性**：`publish_time` 距今（近10天窗口内越新越高）。
  - **发布方影响力**：从 `url` 域名 / 标题推断媒体权威度（央媒/财经媒体/官媒/上市公司公告加权）。
  - **影响力**：标题+摘要语义判断事件重要性、政策/行业/市场影响面。
- 综合打分排序，取 **Top 10–12** 条；转写为口语化提示词（如"近10天 XX 政策落地，相关板块怎么看？"），贴合股民提问口吻。

## 5. 最终方案·更新机制（Agent 生成 → 远程托管 → App 拉取）

1. **生成侧（automation，每 30 分钟）**：Agent 调 `news-search`（+ 腾讯新闻财经）→ LLM 打分筛选近10天 Top N → 生成 `chat-hints.json`：
   ```json
   { "version": <递增整数>, "updatedAt": "<ISO8601>", "hints": ["...", "..."] }
   ```
   → 推送到**远程静态地址**（见第 7 节待决）。
2. **App 侧（REQ-UI-15 实施内容）**：新增 `lib/chatHintsSource.ts`——
   - 启动 + 每 30 分钟拉取远程 JSON；
   - 本地缓存（localStorage / Rust 缓存目录），`version` 比对，未变不重复拉；
   - 失败 / sandbox 无外网 → **强制降级内置 `CHAT_HINTS`**（保留为默认集，兜底）。
   - `ChatComposer` 的 `CHAT_HINTS` 改为从 `chatHintsSource` 读取；GSAP 滚动、`setInterval(4000)` 切换、Tab 填入交互**保持不变**。
3. **刷新对齐**：生成侧与 App 侧均 30 分钟粒度，类似新闻头条轮播。

## 6. 工程约束与风险

- sandbox Node/前端无外网 → 远程拉取在 sandbox 必降级内置；真网本机验收远程通道。
- 远程 URL 走浏览器直连（不走 Vite 代理，见 sandbox 网络经验）。
- `news-search` 需 `IWENCAI_API_KEY`（已配）；腾讯新闻需独立 Key（待用户配，可选）。
- LLM 打分每次生成消耗 token；成果缓存 30 分钟。

## 7. 依赖与待决

- **[待决 A] 远程托管地址**：生成侧产出的 `chat-hints.json` 放哪？候选：① WorkBuddy CloudStudio 静态部署（推荐，本机可访问）；② GitHub raw / 自有静态托管；③ 写入项目内文件（需发版，弱）。**实施前需用户拍板**（或默认采用 CloudStudio）。
- **[待决 B] 腾讯新闻补充源**：取决于用户是否配腾讯新闻 API Key。
- **[待决 C] 进入实施**：本卡当前为 📐 技术方案，待用户确认后转 🔧 实施。

## 8. 验收标准（草案）

- [ ] 每 30 分钟，automation 生成新的 `chat-hints.json`（财经垂直、近10天、LLM 打分 Top N）；
- [ ] App 启动 + 每 30 分钟拉取并展示，提示词随新闻更新，无需发版；
- [ ] 离线 / sandbox / 远程失败 → 自动降级内置 `CHAT_HINTS`，提示词不空；
- [ ] 缓存命中（version 未变）不重复拉取；
- [ ] GSAP 滚动 + Tab 填入交互不受影响；
- [ ] tsc 0 新增错误、dev HMR 正常。

---

## 自测（实施后填）
（待 🔧 实施。）
