# 项目梳理 · 代码规范化 · 审查流程方案（Trend IQ）

> 本文档为**分析 + 分步实施方案**，不直接执行破坏性操作。所有"清理"步骤均设计了备份/回滚护栏，确保不破坏现有功能。
> 适用范围：`trend-iq/`（Tauri 2 + React 18 + Vite 6 + KLineCharts v9 桌面 App 单体仓库）。

---

## 0. 重要前提与风险（务必先读）

- **⚠️ 项目当前不在任何 git 仓库内**（`git rev-parse` 返回 128）。这意味着：任何文件删除/移动**无法靠 git 回滚**，只能依赖手动备份。所有清理必须先做备份基线。
- **体积真相**：项目总体积约 **1.4 GB**，但**真实源码仅 59 个 TS/TSX 文件、约 10,947 行**。其余 99% 是可重建的编译/依赖产物。
- **配置改动敏感度**：您对配置文件改动高度敏感。本文涉及 `.gitignore`、`eslint`、`prettier` 等配置时，均会先展示 diff、说明可逆性与最坏后果，绝不擅自 patch 应用包体或 `app.asar`。
- **现状基线**：`tsc --noEmit` 仅 `ProfilePage.tsx` 既有 2 个错误（与本次无关）；`strict: true` 已开启；源码无 `TODO/FIXME`、无 `@ts-ignore`（类型纪律良好）。

---

## 1. 项目结构与体积分析

### 1.1 体积拆解（实测）

| 路径 | 体积 | 性质 | 可重建？ |
|------|------|------|----------|
| `apps/desktop/src-tauri/target/release` | **1.3 GB** | Rust 编译产物（.a / 二进制） | ✅ `pnpm tauri build` / `cargo build --release` |
| `node_modules/`（根 `.pnpm` 161M + desktop 16M） | **177 MB** | pnpm 依赖（硬链） | ✅ `pnpm install`（有 `pnpm-lock.yaml` 104KB 锁文件） |
| `apps/desktop/dist` | 1.6 MB | 前端构建输出 | ✅ `pnpm build` |
| `apps/desktop/tsconfig.tsbuildinfo` | 4 KB | tsc 增量缓存 | ✅ 自动再生 |
| `apps/desktop/src` | 188 KB | 前端源码 | ❌ 核心资产 |
| `packages/*/src` | — | 7 个领域包源码 | ❌ 核心资产 |
| `asset/`、`outputs/`、`docs/`、`scripts/` | < 300 KB | 资源/文档/脚本 | ❌ 核心资产 |

> 结论：**98% 的体积来自 `target/release`**，其次是 `node_modules`。这两者删掉都不影响源码与功能，只是下次构建会变慢（需重新编译/安装）。

### 1.2 冗余 / 可优化识别

1. **Rust `target/` 是头号冗余**（1.3G）。开发期 dev server 走 Vite + Tauri dev，并不需要 release 产物。建议：日常保留 `target/debug`（dev 用），release 产物按需构建、并加入 `.gitignore`。
2. **无 `.gitignore`**（实测为空）。当前若初始化 git，`node_modules`、`target`、`dist` 全部会被误纳入版本控制——必须补齐。
3. **`tsconfig.tsbuildinfo` / `dist`** 是纯缓存/产物，应忽略。
4. **`console.*` 共 34 处**（源码内）。开发期可保留，但建议统一收敛到轻量 logger 或在构建期剥离，避免生产日志泄漏。
5. **依赖完整性良好**：7 个 workspace 包（`analysis / data / shared / ui / chart / indicators / store`）全部被引用，无孤立冗余包（`indicators` 被 `analysis` 引用，间接被 desktop 使用）。

### 1.3 体积优化"禁区"

- **不要碰 `apps/desktop/src`、`packages/*/src`、`src-tauri/src`（Rust 源码）**——这是功能本体。
- **不要删除 `pnpm-lock.yaml`**——它是依赖可重现安装的保证。
- **不要改 `tauri.conf.json` / `Cargo.toml`** 里的构建/签名配置，除非您明确指示。

---

## 2. 代码规范化建议

### 2.1 工具链补全（当前最大缺口）

现状：根 `package.json` 有 `"lint": "eslint . --ext ts,tsx"` 脚本，但 **eslint 未安装、无配置文件** → 该脚本会直接失败（悬空配置）。

建议（分步、先 dry-run 不自动改）：
1. 安装 `eslint` + `@typescript-eslint` + `typescript-eslint` + `prettier` + `eslint-config-prettier` 到根 devDependencies（仅加依赖，不自动改代码）。
2. 新增 `eslint.config.mjs`（flat config，TS 严格规则子集）+ `.prettierrc.json` + `.editorconfig`。
3. 先跑 `pnpm lint` 查看问题清单，**只报告不改**，由您决定逐项修复。

### 2.2 风格统一建议（Prettier 基线）

| 项 | 建议值 | 说明 |
|----|--------|------|
| 缩进 | 2 空格 | 与现有 tsconfig/默认一致 |
| 引号 | 单引号（JSX 属性双引号） | TS 社区惯例 |
| 分号 | 保留 | 与现有代码一致 |
| 尾逗号 | `all` | 减少无意义 diff |
| 行宽 | 100 | 平衡可读性 |
| 文件编码 | UTF-8 / LF | 跨平台一致（`.editorconfig` 固化） |

### 2.3 命名规范

- **组件**：`PascalCase`，如 `ChatComposer.tsx`、`TrendSolIcon.tsx`（现状已合规）。
- **Hook**：`use` 前缀，如 `useChatQueue`、`useMarketRefresh`。
- **Store 动作**：动词短语，如 `enqueue` / `togglePinQueue` / `stopGeneration`（现状已合规）。
- **文件（非组件）**：`kebab-case`，如 `http-client.ts`、`icon-map.md`。
- **常量**：`UPPER_SNAKE_CASE`；魔法数字（如 4 秒刷新间隔）抽到 `lib/constants.ts`。
- **类型**：`PascalCase`，接口可 `I` 前缀或不用（团队统一即可，现状未用 `I`）。

### 2.4 目录结构优化

现状已较清晰（`components/{chat,market}`、`hooks`、`lib`、`pages`、`store` + `packages/*` 按领域拆分）。补充建议：
- **Barrel 导出**：各 `packages/*/src/index.ts` 已存在，desktop 内部 `components` 也可加 `index.ts` 收敛导入。
- **错误边界**：建议加 `ErrorBoundary` 包裹路由，避免单页异常白屏。
- **常量/配置集中**：刷新间隔、API 域名、颜色 token 集中到 `lib/constants.ts`，避免散落硬编码。
- **图标资产**：官方图标统一收口在 `src/components/TrendSolIcon.tsx`（现已约定），避免散落内联 SVG。

### 2.5 类型与质量

- `strict: true` 已开（良好）。
- 源码 **0 处 `@ts-ignore`**（良好），保持。
- 引入 ESLint `@typescript-eslint` 规则拦截 `any` 隐式、未使用变量、危险赋值。
- `console.*`：开发期允许，建议封装 `lib/logger.ts`，生产构建 strip。

---

## 3. 代码审查流程

### 3.1 审查重点（Checklist）

**功能正确性**
- [ ] 需求卡（REQ-xxx）状态机走完 ⬜→🔧→🧪→👀→✅，未跳跃
- [ ] 自测（🧪）已执行：`tsc --noEmit` 0 新增、无头验证零真实 `pageerror`
- [ ] 改动可映射到具体 AC（验收标准）

**类型与边界**
- [ ] 无新增 `any`、无 `@ts-ignore`
- [ ] Rust ↔ 前端（Tauri invoke）参数类型对齐
- [ ] 外部 API fallback（东财→腾讯→Yahoo）方法级独立

**性能与资源**
- [ ] 交易时段 4s 刷新无内存泄漏（定时器清理、取消订阅）
- [ ] 列表/队列渲染无不必要的重渲染
- [ ] 不引入大体量依赖（先查 bundle 影响）

**安全与稳定**
- [ ] 不改动 `pnpm-lock.yaml` / `tauri.conf.json` / 签名配置无必要不改
- [ ] 用户输入（股票代码、提示词）做校验/转义
- [ ] 无 `console.*` 泄漏敏感数据

**规范**
- [ ] 命名/目录符合 §2.3–2.4
- [ ] 通过 `pnpm lint` + `pnpm typecheck`

### 3.2 审查标准（分级）

- **P0（必须）**：破坏功能、类型回归、安全/数据风险、违反门禁状态机。
- **P1（应当）**：性能回归、命名/风格明显偏离、缺失 AC 映射。
- **P2（建议）**：注释、小重构、可读性。

### 3.3 流程（建议落地为 PR 模板 + 本清单）

1. 开发者提 PR → 关联 REQ 卡 → 附自测证据（typecheck 输出 / 无头截图）。
2. Reviewer 按 §3.1 清单逐项勾选，P0 不过直接打回。
3. 通过后开发者把卡推进 ✅ 并回写 `requirements.md` / `roadmap.md`。

---

## 4. 分步实施方案（谨慎、可回滚）

> 每一步都可独立执行、可验证、可回退。建议**严格按序**，前一步稳定后再做下一步。

**Step 0 — 备份基线（必做，零风险）**
```bash
# 在项目上级目录生成带时间戳的整体备份 tarball
tar -czf /tmp/trend-iq-backup-$(date +%Y%m%d-%H%M).tar.gz \
  -C /Users/sanger/WorkBuddy/2026-07-01-11-51-31 trend-iq
```
- 可逆性：随时 `tar -xzf` 还原。最坏后果：占用约 1.4G 磁盘临时空间。

**Step 1 — 补 `.gitignore`（零风险，纯新增）**
- 新增 `.gitignore`，忽略 `node_modules/`、`target/`、`dist/`、`*.tsbuildinfo`、`.DS_Store`。
- 可逆性：新增文件，删除即可。不放任何现有文件。

**Step 2 — 初始化 git + 首个基线 commit（建立可回滚基线）**
- `git init && git add -A && git commit -m "baseline: pre-cleanup"`。
- 此后所有改动都有版本历史，删除也能 `git checkout` 恢复。
- ⚠️ 此步会创建 `.git`，若您介意可跳过，但强烈建议做。

**Step 3 — 清理可重建产物（需 Step 0/2 之后）**
- 删除 `apps/desktop/src-tauri/target/release`（省 1.3G）、`apps/desktop/dist`、`*.tsbuildinfo`。
- 验证：`pnpm dev` 能正常起（dev 不依赖 release）；如需发版再 `pnpm tauri build` 重建。
- 可逆性：靠 Step 0 备份 / Step 2 git（产物本就被 ignore，不进版本库，靠备份还原）。

**Step 4 — 接入 ESLint + Prettier（先报告后改）**
- 装依赖 + 加配置文件（见 §2.1）。
- 先 `pnpm lint` 出报告，**只展示清单不改代码**，由您拍板逐项修。

**Step 5 — `console.*` 收敛（低风险）**
- 封装 `lib/logger.ts`，源码 34 处逐步替换；或配置构建期 strip。

**Step 6 — 固化审查流程（文档）**
- 把 §3 清单落地为 `docs/CODE_REVIEW.md` + PR 模板。

**Step 7（可选）— 依赖体检**
- 跑 `pnpm dlx depcheck`（或 `knip`）查未使用依赖/导出，再决定裁剪。

---

## 5. 立即可做 vs 需您确认

| 动作 | 风险 | 需要您确认？ |
|------|------|--------------|
| 写分析报告（本文档） | 无 | 否 |
| Step 0 备份 tarball | 极低 | 否（仅占临时空间） |
| Step 1 加 `.gitignore` | 无 | 否 |
| Step 2 `git init` 基线 | 低 | **是**（创建 .git，您可能不想） |
| Step 3 删 target/dist | 中（需先备份） | **是**（删 1.3G 产物） |
| Step 4 装 ESLint/Prettier | 低 | **是**（改 devDependencies + 新增配置） |
| Step 5 console 收敛 | 低 | 否（可分批） |

> 下一步建议：先执行 **Step 0 + Step 1**（零风险），其余按您确认逐档推进。我不会在您明确同意前删除任何文件或改写配置。
