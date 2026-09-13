# 提交被 pre-commit 与 commit-msg 钩子拦截修复

## 背景

用户反馈「提交不了」。逐步跑钩子后定位到**两个与业务代码无关的环境问题**：一个让 `pre-commit` 的 `typecheck` 失败，一个让 `commit-msg` 的 `pnpm sa` 失败。首轮先让提交跑通（`cbafcd6`），随后用户要求「彻底修复好」，把第二处改成**不依赖 shim 生成方式**的根治方案。

## 问题 1：`pnpm typecheck` 报 TS7016 缺 rimraf 类型

```
packages/scripts/src/commands/cleanup.ts(1,24): error TS7016:
Could not find a declaration file for module 'rimraf'.
node_modules/rimraf/rimraf.js implicitly has an 'any' type.
```

**根因**：`packages/scripts/package.json` 声明 `rimraf: 6.1.3`（v6 自带类型，且 `cleanup.ts` 用的是 `import { rimraf } from 'rimraf'` 具名导出），但当前 `node_modules` 里实际是 **rimraf 2.7.1**（v2 无类型声明、API 也不同）。这是之前为绕开 IDE junction 问题手工铺 hoisted 目录时留下的残留——没有 `.pnpm` store、没有 `.modules.yaml`，也没有 `packages/scripts/node_modules`，于是 TS 一路向上解析到了根目录的 v2。

**修复**：`npm pack rimraf@6.1.3` 取官方包，解包后整份拷到 `packages/scripts/node_modules/rimraf`，让 TS 从 `packages/scripts/src/**` 向上解析时优先命中 v6。

- **不动根 `node_modules/rimraf`（仍是 2.7.1）**：其他依赖（lockfile 里 `flat` 一类）按 v2 的 API 在用，替换会有运行时风险。
- rimraf v6 的 `opt-arg.d.ts` 引用了 `glob` 类型，但 `vue-tsc --skipLibCheck` 会跳过所有 d.ts 内部检查，因此无需再补 `glob`。
- 该目录是真实文件（非符号链接），即使后续由 npm 类工具重新安装根依赖也不会被清掉，稳定性足够。

## 问题 2：`commit-msg` 的 `pnpm sa` 报 `ERR_UNKNOWN_FILE_EXTENSION`

```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"
for E:\LINFLY\TMS\user-admin-web\node_modules\@sa\scripts\bin.ts
```

**根因**：`packages/scripts/bin.ts` 的 shebang 是 `#!/usr/bin/env tsx`，但 `node_modules/.bin/` 下的 `sa` / `sa.cmd` / `sa.ps1` 三个 shim 都被生成成**直接用 `node` 跑 `bin.ts`**，Windows 上 node 不认 `.ts` 扩展名。当前 `node_modules` 是 npm 类工具铺的（无 `.pnpm` / `.modules.yaml`），这类 shim 生成器只识别 `node` shebang，不会理会 `tsx`。

**首轮修复（治标）**：把三个 shim 改成 `node ../tsx/dist/cli.mjs ../@sa/scripts/bin.ts`。提交通过了，但**很快又失效**——`node_modules/.bin` 下的 shim 被依赖工具重新生成，内容变回 `node bin.ts`，同类问题复发。

**彻底修复（治本）**：让 bin 目标本身变成「纯 node 能直接执行」的文件，这样**无论 shim 怎么生成都是对的**：

1. 新增 `packages/scripts/bin.mjs` —— 纯 JS，`require.resolve('tsx/cli')` 定位 tsx 后 `spawnSync` 委托执行 `src/index.ts`（与原先可用的 `tsx bin.ts` 行为完全一致，绕开 tsx 以 CJS 模式加载 TS 导致的 `Cannot find module './commands'`）。
2. `packages/scripts/package.json` 的 `bin.sa` 由 `./bin.ts` 改为 `./bin.mjs`。
3. 删除 `packages/scripts/bin.ts`（`packages/scripts/tsconfig.json` 只 include `src/**/*` + `typings/**/*`，删掉不影响类型检查）。
4. `node_modules` 里的 `@sa/scripts` 是**真实拷贝**（非软链），同步拷入 `bin.mjs` 与新的 `package.json`。
5. 三个 shim 改为 `node "…/@sa/scripts/bin.mjs"` —— 这正是生成器按新 `bin` 字段会产出的内容，因此后续再被重置也不会坏。

## 提交

- 钩子链 `typecheck → lint → fmt → git diff --exit-code → commit-msg` 全部通过（lint 仅剩 `link.vue` 两条既有 warning）。
- 中文提交信息统一用 `git commit -F .git/COMMIT_MSG_TMP.txt` 传入：终端直接传中文参数在 Windows 下有编码风险，用 UTF-8 文件更稳（`-F` 仍会正常触发 commit-msg 钩子）。
- 结果：
  - `cbafcd6 feat(label-designer): 拖拽越界回弹与面板拖拽回位动画`（14 files）
  - `d033496 docs: 记录 pre-commit 与 commit-msg 钩子拦截的修复过程`
  - 本条「彻底修复」随对应 `fix(scripts)` 提交一起入库。

## 教训

- `node_modules` 手工铺装后，**依赖版本可能与 package.json 声明不一致**（rimraf 2 vs 6），遇到类型报错先核对**实际安装版本**，而不是先怀疑代码。
- **修 `node_modules` 内的东西都可能被重新生成覆盖**：`.bin` shim、软链、嵌套依赖都属易失状态。能落到仓库代码里的修复（`bin` 指向 `.mjs` 启动器）才是根治；只改 `node_modules` 只能当临时救急。
- Windows 下依赖工具的 shim 生成器不认 shebang 里的 `tsx`，凡 `#!/usr/bin/env tsx` 的 bin 都会被生成成 `node xx.ts`；bin 目标用 `.mjs`/`.cjs` 可彻底规避。
