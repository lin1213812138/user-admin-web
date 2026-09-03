# pnpm release 提交被 pre-commit 钩子拦截（git diff --exit-code 失败）

- 日期：2026-09-03
- 触发：`pnpm release` 在真实终端跑完版本选择、changelog 生成、`typecheck` / `lint` / `fmt` 后，最终 `git commit` 报错退出（bumpp 抛 `Process exited with non-zero status (1)`，命令为 `git commit --allow-empty --all --message 'chore(projects): release v%s'`）。

## 根因

`pnpm release` 链路（`sa release` → `packages/scripts/src/commands/release.ts` → bumpp）：

1. bumpp 改 `package.json` 版本号；
2. 执行 `execute`（`pnpm sa changelog`）→ `@soybeanjs/changelog` **重新生成** `CHANGELOG.md`；
3. `git commit -A` → 触发 `pre-commit` 钩子：`pnpm typecheck && pnpm lint && pnpm fmt && git diff --exit-code`。

`@soybeanjs/changelog` 生成的 `CHANGELOG.md` 在贡献者段落带一个空行（`### Contributors` 与 `[LINFLY](...)` 之间），而 `oxfmt`（`pnpm fmt`）会**删掉这个空行**。于是：

- 第 2 步生成的 `CHANGELOG.md` 含空行；
- 第 3 步钩子里的 `pnpm fmt` 删掉空行（工作区 vs 暂存区产生差异）；
- 紧接着 `git diff --exit-code` 检测到未暂存改动 → 退出码 1 → `git commit` 失败 → bumpp 抛错。

日志里那段 `diff --git a/CHANGELOG.md ...` 正是 `git diff --exit-code` 的输出现场。

> 不是 `commit-msg` 钩子的问题：`pnpm sa git-commit-verify` 的正则能匹配 `chore(projects): release v0.0.2`。
> 先 `pnpm fmt` 再 `pnpm release` **没用**：发布时 changelog 会重新生成，空行又回来。

## 修复

让 changelog 生成之后、bumpp 暂存之前就把仓库格式化干净，使钩子里的 `pnpm fmt` 变成空操作，`git diff --exit-code` 即可通过。

改 `packages/scripts/src/commands/release.ts`：把 bumpp 的 `execute` 由字符串改为函数，先跑原 `execute`（`pnpm sa changelog`），再补一句 `pnpm fmt`：

```ts
export async function release(execute = 'pnpm sa changelog', push = true) {
  await versionBump({
    files: ['**/package.json', '!**/node_modules'],
    execute: async () => {
      const [command, ...args] = execute.split(/\s+/);
      await execCommand(command, args, { stdio: 'inherit' });
      // format regenerated changelog so the pre-commit `git diff --exit-code` passes
      await execCommand('pnpm', ['fmt'], { stdio: 'inherit' });
    },
    all: true,
    tag: true,
    commit: 'chore(projects): release v%s',
    push
  });
}
```

`sa` 由 `tsx` 直接跑 `packages/scripts/src`（见 `bin.ts` 的 `#!/usr/bin/env tsx`），改完即时生效，无需重新构建 `@sa/scripts`。

## 备注

- bumpp 的 `execute` 字符串若含 `&&`，会被 `tokenizeArgs` 误拆成单条命令的参数，所以用函数式 `execute` 分两次 `execCommand` 调用。
- 该命令最后仍会 **push 到远程**（含 tag），运行前确保 `git status` 干净且确实要推送。
- 非交互 shell（管道 / 工具调用）仍会卡在 bumpp 的版本选择菜单，需在真实终端手动选 `next` / `patch` 回车确认（见 `pnpm-release命令报错诊断.md`）。
