# 工程标准与开发流程规范（Engineering Standards & Dev Process）

> 适用范围：TrendSol（Trend IQ）全仓库（Tauri 2 + React 18 + Vite 6 + KLineCharts v9 + Rust collector）。
> 目的：将"最规范的软件开发流程"制度化，使每个需求从规划→编码→测试→审查→交付都在统一门禁下推进，交付稳定、结构清晰、易维护、可扩展的代码。
> 生效日期：2026-07-18（用户明确要求的工程标准升级）。

---

## 0. 与现有强制门禁的关系

本规范**强化**既有需求闭环门禁（`docs/README.md`「⚠️ 强制门禁」），在原有五态基础上插入"技术方案"与"单元测试"两个强制前置：

```
⬜ 待实施  →  📐 技术方案  →  🔧 实施中  →  🧪 自测(含单测)  →  👀 待审查  →  ✅ 已闭环
                (新增)            (含编码规范)     (新增单测)        (新增审查)
```

- **不做无卡需求**：任何功能/重构必须先建 `docs/cards/REQ-XXX.md`。
- **状态机不可跳跃**：⬜→📐→🔧→🧪→👀→✅；禁止实施直跳交付。
- **技术方案是编码前置**：🔧 实施前必须有 📐 技术方案文档（见第 1 章）。
- **单测是交付前置**：🧪 自测必须包含单元测试（见第 3 章），无单测不得进 👀。
- **审查是闭环前置**：👀 待审查必须走第 5 章审查清单，未过审不得 ✅。
- **闭环需用户拍板**：只有用户明确"通过/OK/验收合格"才 ✅；"开始验收/可以验收"仅进入 👀。

---

## 1. 事前规划：技术方案文档（📐 强制前置）

**规则**：每个 `REQ-XXX` 在进入 🔧 前，必须在 `docs/cards/REQ-XXX.md` 内追加「技术方案」章节（或独立 `docs/tech-design/REQ-XXX.md`），并经用户确认后再编码。技术方案缺失的需求卡，自审阶段应打回 📐。

### 技术方案文档必须包含
1. **背景与目标**：解决什么问题、验收标准（AC）速览。
2. **架构设计与模块划分**：涉及哪些 package / 目录；新增或修改的模块边界。
3. **组件职责**：每个新增/修改的组件/函数/模块单一职责说明。
4. **接口定义**：
   - TypeScript：导出类型、函数签名、Props、Store action 签名。
   - Rust：pub 函数/结构体/trait 签名、跨 FFI 的 `#[tauri::command]` 参数与返回类型。
5. **数据流向**：UI → Store → Rust collector → 数据源 → 回写 UI 的链路（画文字时序或 mermaid）。
6. **关键决策与权衡**：选型理由、放弃的方案、参考 `docs/decisions.md`（ADR）。
7. **风险与边界**：异常路径、空数据、网络失败、超大输入、并发/竞态。
8. **测试策略**：单测覆盖点（见第 3 章）、是否需要集成/E2E。

### 现有架构基线
`docs/architecture.md` 为权威架构文档，技术方案须与其一致；如发现架构文档过时，先在技术方案中标注并将更新并入 PR。

---

## 2. 编码规范（🔧 实施中遵守）

### 2.1 命名规范
| 对象 | 规范 | 示例 |
|---|---|---|
| 变量 / 函数 | `camelCase` | `fetchQuote`、`queueLength` |
| 常量 / 枚举值 | `UPPER_SNAKE_CASE` / `PascalCase` | `MAX_RETRY`、`Period.Day` |
| 类型 / 接口 / 组件 / 类 | `PascalCase` | `ChatStore`、`KLineChart` |
| 文件 / 目录 | `kebab-case` | `chat-composer.tsx`、`src-tauri/` |
| React 组件文件 | 与默认导出组件同名 `PascalCase.tsx` | `ChatComposer.tsx` |
| 测试文件 | `*.test.ts(x)` / `*.spec.ts(x)` | `chatStore.test.ts` |
| 布尔变量 | `is/has/can/should` 前缀 | `isGenerating`、`hasContent` |

### 2.2 注释规范
- **写"为什么"不写"是什么"**：不重复代码语义，解释业务意图、非常规决策、陷阱。
- **JSDoc**：所有跨模块导出的函数/组件/typedef 写 JSDoc（参数、返回值、抛错条件）。
- **禁止**：无意义注释（`// 循环`、`// TODO 临时`）、大段被注释掉的死代码（用 git 历史代替）。
- **TODO/FIXME**：必须带 owner 与 issue 引用（`// TODO(sanger): #123 处理时区`）；现有 0 处，维持此纪律。
- Rust：pub 项写 `///` doc comment；unsafe 块必须注释说明 Safety 前提。

### 2.3 目录结构规范（monorepo）
```
trend-iq/
├── packages/                 # 纯逻辑/可复用库（低耦合、无 UI 副作用）
│   ├── shared/               # 类型、常量、工具（无副作用）
│   ├── data/                 # 数据获取/缓存（含 Rust 交互类型）
│   ├── store/                # Zustand stores（状态编排）
│   ├── analysis/             # 分析/指标计算纯函数
│   ├── indicators/           # 技术指标算法（被 analysis 依赖）
│   ├── chart/                # KLineCharts 封装/扩展
│   └── ui/                   # 通用 UI 组件（presentational）
├── apps/desktop/             # Tauri 应用壳 + 页面（组合 packages）
│   ├── src/
│   │   ├── components/       # 业务组件（按域分目录）
│   │   ├── pages/            # 路由页面
│   │   ├── store/            # 应用级 store（组合 packages/store）
│   │   └── ...
│   └── src-tauri/            # Rust 后端（collector/FPI）
└── docs/                     # 单一可信源（需求/架构/决策/卡片）
```
- packages 之间**单向依赖**（`ui` 可依赖 `shared`/`store`，反之不可）；循环依赖视为 P0 缺陷。
- 业务组件按域归类（如 `components/chat/`、`components/market/`），不堆平。

### 2.4 格式化（工具链落地）
- **Prettier**：统一缩进 2 空格、LF 换行、尾逗号、单引号（字符串）、分号。
- **ESLint**（`@typescript-eslint` + `react-hooks` + `react-refresh`）：`no-explicit-any` 警告级、`no-console` 警告级（当前 34 处逐步收敛）、`react-hooks/rules-of-hooks` 错误级。
- 配置改动（新增 `.eslintrc`/`.prettierrc`）属敏感操作，按第 6 章路线图先 dry-run 预览再写回。

---

## 3. 稳定性保障（🧪 自测含单测）

### 3.1 输入校验
- 所有外部输入（用户输入、API 响应、FFI 返回、URL 参数）**不信任**：先校验再使用。
- API 响应用运行时校验（zod 或手动 guard），不假设字段存在；缺字段/类型错 → 降级而非崩溃。
- 数值边界：除零、NaN、Infinity、空数组、超大数（成交额 unit 换算）必须覆盖。

### 3.2 异常处理
- 不吞异常：`catch` 必须记录（logger）或向上抛；禁止 `catch {}` 空块。
- 异步失败有兜底 UI（loading/error 态），不在生成中态卡死。
- Rust：`Result<T, E>` 贯穿边界；FFI 命令返回 `Result` 或明确 `null`，不在 Rust 端 `panic` 跨 FFI。

### 3.3 边界条件
- 空/单条数据、首屏无网络、数据中断重连、并发重复请求（防抖/锁）、超长文本截断。
- 队列/Store 的竞态：连续入队、生成中切换页面、持久化恢复（localStorage 损坏）。

### 3.4 单元测试（强制）
- **框架**：Vitest（与 Vite 同构，零额外配置）+ `@testing-library/react` + `jsdom` + Rust 侧 `cargo test`。
- **必须覆盖**：
  - 纯函数（指标计算、格式化、校验 guard）——100% 行覆盖目标。
  - Store reducer/action（入队、置顶调序、持久化恢复）。
  - 关键 UI 交互（发送队列、置顶移到队首、生成中单按钮切换）。
- **覆盖率门槛**：核心 packages（shared/analysis/indicators/store）行覆盖 ≥ 80%；PR 不得降低总覆盖率。
- **运行**：`pnpm test`（新增）、`pnpm test:cov`（覆盖率）；CI 必跑。
- 当前缺口：项目 **0 测试**，须从 Phase 1.3 起补齐（见第 6 章）。

---

## 4. 可维护性与可扩展性

### 4.1 设计原则
- **低耦合高内聚**：packages 单向依赖；组件只做一件事；Store 不写 UI 逻辑。
- **SOLID 在 React/Rust 的落地**：
  - 单一职责：一个组件/函数/模块一个变更理由。
  - 开闭：扩展点用策略/配置/插件，而非改核心分支（如数据源 fallback 用方法级策略注册）。
  - 依赖倒置：UI 依赖 `packages/store` 抽象，不直接依赖 `data` 实现。
- **不要过度设计**：YAGNI——只为真实需求预留扩展点，不为想象中的未来加抽象。

### 4.2 预留扩展接口（实例）
- 数据源：东方财富→腾讯→Yahoo 三级 fallback，新增源只需实现同一方法签名并注册。
- 图标资产：集中在 `TrendSolIcon.tsx`，新增官方图标只加一个导出组件，不在业务内联。
- 需求卡/技术方案：新增 REQ 走统一模板，不特例化流程。

### 4.3 可观测性
- 统一 logger（开发 console.warn/error，生产可接 Tauri 日志）；禁止散落 `console.log` 调试。
- 关键路径埋点（采集触发、刷新周期、fallback 切换）便于排障。

---

## 5. 代码审查（👀 待审查 → ✅）

### 5.1 PR / 提交规范
- 一个 REQ 一张卡，建议一个 PR（或 PR 关联 REQ-XXX）。
- commit message：`type(scope): subject`，type ∈ {feat,fix,refactor,test,docs,chore,style}。
- PR 模板必填：需求链接、技术方案链接、测试说明、自测证据（截图/命令输出）、风险点。

### 5.2 审查清单（审查人逐条确认）
**P0（必须修复，否则驳回）**
- [ ] 无编译/类型错误（`pnpm typecheck` 通过）
- [ ] 无新增 `any` / `@ts-ignore` / 空 `catch`
- [ ] 无循环依赖、无未使用导入
- [ ] 输入校验与异常处理覆盖边界（第 3.1–3.3）
- [ ] 关键逻辑有单测且通过（第 3.4）
- [ ] 无敏感信息提交（token/密钥/`.env`）

**P1（应修复）**
- [ ] 命名/注释符合第 2 章
- [ ] 目录结构/依赖方向正确
- [ ] 无重复逻辑（提取公共函数/组件）
- [ ] 覆盖率未下降

**P2（建议）**
- [ ] 日志规范、无调试残留
- [ ] 文档同步（requirements/roadmap/cards 状态回写）
- [ ] 性能（不必要的重渲染、重复请求）

### 5.3 审查执行
- 当前为单人项目：Agent 自审 + 用户终验。Agent 自审须产出**审查记录**（缺陷清单 + 修复），附在 REQ 卡「代码审查」章节。
- 后续多人：至少 1 人 Approved 方可 merge；P0 未清不得 merge。

---

## 6. 落地路线图（分阶段、带护栏）

> ⚠️ 涉及配置文件/依赖改动（ESLint/Prettier/Vitest）属敏感操作，按用户偏好：**先 dry-run 预览 diff，用户确认后才写回**。每步可逆（已 git 化）。

| Step | 内容 | 类型 | 风险 | 确认点 |
|---|---|---|---|---|
| A | 补 `docs/architecture.md` 数据流向图 + 现有模块职责基线 | 文档 | 零 | 直接做 |
| B | 引入 Vitest + RTL + jsdom；写 `chatStore`/`indicators` 首批单测 | 依赖+代码 | 中（增 devDeps） | dry-run 预览后确认 |
| C | 引入 ESLint + Prettier；`--fix --dry-run` 生成 diff 报告 | 配置 | 中（改配置） | **必须**先看 diff |
| D | 收敛 34 处 `console.*` + 0 `any` 纪律强化 | 代码 | 低 | 随 C 一并 |
| E | PR 模板 + 审查清单接入 `.github/` | 配置 | 低 | 直接做 |
| F | 依赖体检（重复/未使用依赖） | 分析 | 低 | 报告后确认 |

**执行顺序建议**：A（文档基线）→ B（单测先行，建立安全网）→ C/D（规范工具链，有单测兜底更稳）→ E（审查接入）→ F（依赖体检）。

---

## 附录：当前工程缺口速览（2026-07-18）
- 测试：9 package 仅 `typecheck`，**0 单测**，无 Vitest/Jest。
- 规范工具链：无 ESLint/Prettier；根 `lint` 脚本悬空（eslint 未装）。
- 类型纪律：✅ `strict:true`、0 TODO、0 `@ts-ignore`、34 `console.*`。
- 流程纪律：✅ 强制门禁（REQ 卡 + 状态机）、技术方案文档 **尚未强制**（本规范补入）。
- 审查：❌ 无 PR 模板/审查清单（本规范补入）。
