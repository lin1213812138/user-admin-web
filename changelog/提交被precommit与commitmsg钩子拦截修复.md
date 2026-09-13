# 提交被 pre-commit 与 commit-msg 钩子拦截修复

## 背景

用户反馈「提交不了」，要求用中文提交标签设计器这批已 stage 的改动。逐步跑钩子后定位到**两个与业务代码无关的环境问题**，逐个修复后走完整钩子链提交成功（提交 `cbafcd6`）。

## 问题 1：pre-commit 的 `pnpm typecheck` 失败

```
packages/scripts/src/commands/cleanup.ts(1,24): error TS7016:
Could not find a declaration file for module 'rimraf'.
node_modules/rimraf/rimraf.js implicitly has an 'any' type.
```

**根因**：`packages/scripts/package.json` 声明 `rimraf: 6.1.3`（v6 自带类型、且 `cleanup.ts` 用的是 `import { rimraf } from 'rimraf'` 具名导出），但当前 `node_modules` 里实际是 **rimraf 2.7.1**（v2 无类型声明、API 也不同）。这是之前为绕开 IDE junction 问题手工铺 hoisted 目录时留下的残留——没有 `.pnpm` store，也没有 `packages/scripts/node_modules`。

**修复**：`npm pack rimraf@6.1.3` 取官方包，解包后整份拷到 `packages/scripts/node_modules/rimraf`，让 TS 从 `packages/scripts/src/**` 向上解析时优先命中 v6。

- **不动根 `node_modules/rimraf`（仍是 2.7.1）**：其他依赖可能按 v2 的 API 在用，替换会有运行时风险。
- rimraf v6 的 `opt-arg.d.ts` 引用了 `glob` 类型，但 `vue-tsc --skipLibCheck` 会跳过所有 d.ts 内部检查，因此无需再补 `glob`。
- 修复后 `pnpm typecheck` 退出码 0。

## 问题 2：commit-msg 的 `pnpm sa git-commit-verify` 失败

```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"
for E:\LINFLY\TMS\user-admin-web\node_modules\@sa\scripts\bin.ts
```

**根因**：`packages/scripts/bin.ts` 的 shebang 是 `#!/usr/bin/env tsx`，但 `node_modules/.bin/` 下 `sa` / `sa.cmd` / `sa.ps1` 三个 shim 都被生成成直接用 `node` 跑 `bin.ts`，Windows 上 node 不认 `.ts` 扩展名。

**修复**：把三个 shim 改成经 `tsx` 启动：

```
node "%~dp0\..\tsx\dist\cli.mjs" "%~dp0\..\@sa\scripts\bin.ts" %*
```

`sa`（sh）/ `sa.ps1` 同理替换解释器为 `node ../tsx/dist/cli.mjs`。`node_modules` 不入库，属本地环境修复。

## 提交

- 钩子链 `typecheck → lint → fmt → git diff --exit-code` 全部通过（lint 仅剩 `link.vue` 两条既有 warning）。
- 提交信息含中文，改用 `git commit -F .git/COMMIT_MSG_TMP.txt` 传入：终端直接传中文参数在 Windows 下有编码风险，用 UTF-8 文件更稳（`-F` 仍会正常触发 commit-msg 钩子）。
- 结果：`cbafcd6 feat(label-designer): 拖拽越界回弹与面板拖拽回位动画`，14 files changed，工作区干净。

## 教训

- `node_modules` 手工铺装后，**依赖版本可能与 package.json 声明不一致**（rimraf 2 vs 6）；遇到类型报错先核对实际安装版本，而不是先怀疑代码。
- Windows 下 `.bin` shim 不认 shebang 里的 `tsx`，凡是用 `#!/usr/bin/env tsx` 的 bin（本项目 `sa`）都可能被生成成 `node xx.ts`，需手工改 shim。
