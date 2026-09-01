# pnpm release 命令报错诊断

- 日期：2026-09-01
- 触发：`pnpm release` 在使用工具调用 / 非交互 shell 中运行时表现为"报错 / 卡住"。

## 结论（根因修正）

`pnpm release`（即 `sa release`，见 `packages/scripts/src/commands/release.ts`）基于 bumpp，是**交互式**命令：

1. bumpp 与 `@soybeanjs/changelog` 都依赖 `git describe` 来定位"上一个版本"作为基准。
2. **仓库为空（无任何 git tag）时**，`git describe` 直接报
   `fatal: No names found, cannot describe anything.` —— 这不是可忽略的 warning，而是导致 release
   在 `pnpm sa changelog` 步骤卡死/报错的根因（changelog 无法确定增量范围，静默空跑未生成内容）。
3. 随后 bumpp 弹出**版本选择菜单**（major / minor / patch / next / conventional / pre-\* / as-is / custom），要求用方向键手动选择并回车确认。
4. 确认后自动完成：递增 `package.json` 版本 → 执行 `pnpm sa changelog`（@soybeanjs/changelog 生成 CHANGELOG）→ `git tag` → commit（`chore(projects): release v%s`）→ **push 到远程**。

> ⚠️ bumpp **不会**自动创建初始基准 tag。它假设仓库里至少存在一个历史 tag，因此首次发版前必须手动先建一个。

## 正确用法

**首次发版前，先在真实终端建一个本地初始 tag 当基准**（已为用户执行 `git tag v0.0.0`，`git describe --tags --abbrev=0` 已能返回 `v0.0.0`）：

```bash
git tag v0.0.0            # 已执行：建立基准，解决 No names found
git push origin v0.0.0    # 可选：如需远端也有基准（CI / 克隆后 describe）再推
```

然后在**真实终端**（VS Code 集成终端 / PowerShell / CMD）手动运行交互式命令：

```bash
pnpm release
```

用 `↑/↓` 选中 `next`（→ 0.0.1）或 `patch`（→ 0.0.1），回车确认。之后每次发版会基于上一个 tag 自动累加，无需再手动建基准。

## 注意

- 该命令最后会 **push 到远程**，运行前请确保 `git status` 干净、且确实要推送 tag。
- 非交互环境（管道、CI、工具调用）无法提供 TTY 输入，会卡在菜单或报错，**不要在非交互 shell 里跑**。
- 若想不打 tag / 不 push，可手动改 `package.json` 的 `version` 后单独跑 `pnpm sa changelog`，或改造 `release.ts` 增加 `--no-push` 等参数。

## 后续

- 已建立本地基准 tag `v0.0.0`。用户去真实终端执行 `pnpm release` 选 `next/patch` 即可正常发版。
- 是否把 `v0.0.0` 推到 origin、或改造脚本支持非交互发版，留待按需处理。
