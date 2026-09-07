# SDD ledger — plan: docs/superpowers/plans/2026-09-07-alibaba-puhuiti-font.md

## Execution mode

Subagent-driven 请求已确认（用户选 1），但当前环境仅提供只读的 `code-explorer` 子代理，无法写入文件或执行命令。
因此按 SDD 的任务划分与自检节奏在**主控会话内联执行**，本 ledger 仍逐任务记录进度（含 BASE/HEAD、自检结论）。

Working branch: `main`（工作区直接改动，**未提交**，由用户决定提交时机）

## Tasks

- Task 1: 新增 `src/styles/css/font.css` — complete（@font-face swap + `--app-font-family` + `html:root` 覆盖 `--vxe-ui-font-family`）
- Task 2: `global.css` 引入 font.css — complete（`@import './font.css';` 置于 reset 之前）
- Task 3: `reset.css` html 字体栈改用变量 — complete（原多行字体栈含 `'Noto Color Emoji'`，整段替换为 `var(--app-font-family)`）
- Task 4: `theme/shared.ts` 加 `common.fontFamily` — complete（新增 `APP_FONT_FAMILY` 常量并注入 `common`）
- Task 5: `.gitignore` 排除源字体 + 移除 `cn-font-split` — complete（依赖已 remove，Packages -22）
- Task 6: 验证 — complete（typecheck 通过 / lint 0 error，仅 link.vue 2 个既有 warning / build:test 成功且 woff2 119372 带 hash / changelog 已更新）
  - 遗留（需用户人工）：`pnpm dev` 目视核对表格、Naive 组件、菜单三处字体
- 全部改动**未提交**，等用户决定提交时机（`pnpm commit`，勿直接 git commit）
