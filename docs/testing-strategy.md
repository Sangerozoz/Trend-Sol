# 测试基建技术方案（📐 事前规划）

> 关联：`docs/engineering-standards.md` 第 3 章（稳定性保障）、第 6 章路线图 B 步。
> 本方案为「引入 Vitest 建立单元测试安全网」的事前技术设计，经确认后进入 🔧 实施。

## 1. 目标与范围

**目标**：在现有 pnpm monorepo 中建立标准化单元测试底座，为后续功能迭代提供回归安全网，落实工程标准第 3 点（输入校验 / 异常处理 / 边界覆盖 / 单测）。

**首批范围（本方案实施）**：
- 接入 **Vitest**（根级），统一运行 `pnpm test`。
- 为两类核心逻辑编写首批单测：
  1. `packages/analysis` 纯算法（线性回归、极值点、斐波那契回撤）—— 与行情分析强相关，数学可精确断言。
  2. `apps/desktop/src/store/chatStore.ts` 发送队列逻辑（enqueue / 移到队首 / 删除 / 撤回 / 清空 / 完成后自动续发）—— 锁定刚验收的 REQ-UI-13/14 行为，防止回归。
- 配置覆盖率统计（v8），输出报告，设长期目标 **核心包行覆盖 ≥ 80%**（本次仅报告，不强制阈值以免 CI 阻断）。

**不在本次范围**：组件渲染测试（@testing-library/react 已预留依赖，后续批次使用）、ESLint/Prettier（路线图 C/D 步）。

## 2. 工具选型与理由

| 维度 | 选择 | 理由 |
|---|---|---|
| 测试运行器 | **Vitest** | Vite 生态原生、ESM 友好、与现有 Vite 配置零摩擦；比 Jest 更快、TS/JSX 开箱即用 |
| 测试环境 | **jsdom** | chatStore 用 zustand `persist` 依赖 `localStorage`，jsdom 提供；纯算法在 jsdom 下同样可跑 |
| 覆盖率 | **@vitest/coverage-v8** | 基于 V8 内建覆盖，零额外插桩、精度高 |
| 组件测试（预留） | `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` | 后续批次写组件用例；本批不强制使用 |

## 3. 目录与文件约定（编码规范衔接）

- 测试文件与源码**同目录就近放置**：`src/**/__tests__/*.test.ts`（分析包）、`src/store/__tests__/*.test.ts`（chatStore）。
- 命名：`*.test.ts` / `*.test.tsx`；测试套件用 `describe('模块名', ...)`，用例用 `it('应当…', ...)` 描述行为。
- fixture 内联或放 `__tests__/fixtures.ts`，避免依赖外部文件。
- 断言用 Vitest 内置 `expect`（globals 开启），不引第三方断言库。

## 4. 配置方案

新增根 `vitest.config.ts`：

- `resolve.alias`：`@trend-iq/{data,analysis,indicators,chart,store,shared,ui}` → 各 `packages/*/src/index.ts`；`@` → `apps/desktop/src`。
- `test.globals: true`、`test.environment: "jsdom"`。
- `test.include`：`packages/**/src/**/*.test.ts`、`apps/desktop/src/**/*.test.ts`。
- `test.exclude`：默认排除 `node_modules` / `dist`。
- `test.coverage`：`provider: "v8"`，`reporter: ["text","html"]`，`include` 指向被测目录。

根 `package.json` 新增 devDependencies 与 scripts：

```jsonc
"devDependencies": {
  "vitest": "^2.1.0",
  "@vitest/coverage-v8": "^2.1.0",
  "jsdom": "^25.0.0",
  "@testing-library/react": "^16.0.0",
  "@testing-library/jest-dom": "^6.5.0",
  "@testing-library/user-event": "^14.5.0"
},
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:cov": "vitest run --coverage"
}
```

## 5. 首批测试用例清单

### 5.1 `packages/analysis/src/__tests__/linear-regression.test.ts`
- `linearRegression`：两点精确斜率/截距；多点 R²≈1；`n<2` 返回零向量（边界）；竖直 x 重复（denominator≈0）返回 `intercept=meanY`（边界）。
- `lineFromTwoPoints`：正常斜率；`x1==x2` 退化为 `slope:0`（边界）。
- `lineValueAt`：代入验证。

### 5.2 `packages/analysis/src/__tests__/extrema.test.ts`
- `findPivots`：合成 K 线，验证在窗口内识别唯一高/低点；`order` 边界（端点不入选）。
- `filterByProminence`：`<2` 个直接返回；显著度低于阈值的噪声被滤除；首尾保留。
- `getAllPivots`：返回 `{highs, lows}` 且经显著度过滤。

### 5.3 `packages/analysis/src/__tests__/fibonacci.test.ts`
- `detectFibonacci`：`<30` 根返回 `null`（边界）；合成单调上涨波段 → `direction:"up"`、`swingLowIdx<swingHighIdx`、levels 含 0%/23.6%/…/100% 及扩展位；价格计算 `price = swingHigh - diff*ratio` 精确。

### 5.4 `apps/desktop/src/store/__tests__/chatStore.test.ts`
- `enqueue`：空白文本+无附件 → 不入队（输入校验）；带文本 → 追加队尾；带附件 → 记录。
- `togglePinQueue`（REQ-UI-14）：将非队首条目移到队首；已在队首 → no-op；不存在 id → no-op；多次点击可分别置顶（顺序正确）。
- `removeFromQueue` / `recallFromQueue`：`recall` 移除并回填 `draftText/draftAttachments`；不存在 id → no-op。
- `clearQueue`：清空。
- **自动续发**（REQ-UI-13）：用 `vi.mock("../lib/llm")` 桩 `sendChat` 立即 resolve；预置 queue 后调用 `send` → 断言队首出队、下一消息进入 `messages`、`sendChat` 调两次。

## 6. 覆盖率目标（长期）
- 核心算法包 `packages/analysis`：行覆盖 ≥ 80%。
- `apps/desktop/src/store`：队列相关逻辑 ≥ 80%。
- 本次仅**报告**覆盖率，不强制阈值（避免首次接入即阻断 `pnpm test`）。

## 7. 风险与可逆性
- **可逆**：全部为新增文件（vitest.config.ts、测试文件）+ 根 package.json devDeps 与 scripts；不修改任何现有源码逻辑。如需回退，`git revert` 即可。
- **不破坏 dev 预览**：仅新增 devDependencies，不改动 vite 配置、不触及 `node_modules` 中运行依赖；`localhost:1420` 不受影响。
- **网络**：`pnpm install` 需访问 npm registry（公开包），在放开沙箱网络环境下执行。
- **persist 隔离**：chatStore 测试在 `beforeEach` 清 `localStorage` 并重置被测 state，避免用例间串扰。

## 8. 验收标准
1. `pnpm test` 所有用例 **全绿**。
2. `pnpm test:cov` 能生成覆盖率文本报告，且首批目标目录被统计。
3. `pnpm typecheck` 无新增错误。
4. `localhost:1420` dev 预览仍正常（HTTP 200）。
5. 新增文件已提交/可提交至 `Trend-Sol` 仓库。
