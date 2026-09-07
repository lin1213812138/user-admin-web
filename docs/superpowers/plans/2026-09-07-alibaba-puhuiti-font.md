# 阿里巴巴普惠体接入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把已生成的 116KB 阿里巴巴普惠体子集接入全站，让页面、Naive UI 组件、vxe-table 表格文字统一使用普惠体，且不影响首屏加载。

**Architecture:** 采用纯 CSS + 一处主题配置的接入方式。新增 `src/styles/css/font.css` 声明 `@font-face`（`font-display: swap`）与 CSS 变量 `--app-font-family`，并覆盖 vxe-table 的 `--vxe-ui-font-family`；`global.css` 引入该文件；`reset.css` 的 `html` 字体栈改用该变量；Naive UI 因不继承全局字体，需在 `store/modules/theme/shared.ts` 的 `getNaiveTheme()` 中给 `common.fontFamily` 写入同样的字体栈。

**Tech Stack:** Vue 3 + Vite 8 + Naive UI 2.44 + vxe-table 4.5 + UnoCSS 66（本任务仅涉及 CSS 与一处 TS 主题配置，不引入新依赖、不改构建配置）

Spec: [`docs/superpowers/specs/2026-09-07-alibaba-puhuiti-font-design.md`](../specs/2026-09-07-alibaba-puhuiti-font-design.md)

## Global Constraints

- 只能用 **pnpm**，禁止 npm / yarn。
- 本机命令在 **PowerShell** 执行；pnpm 被 WebStorm `node-safe-delete-shim` 拦截时，命令前加 `$env:NODE_OPTIONS="";`（cmd 的 `set` 语法无效）。`pnpm dev` 启动若报 `--file parameter is required` 同样用此前缀。
- **本项目没有测试框架、没有 test 脚本**：验证手段是 `pnpm typecheck`、`pnpm lint`、浏览器人工核对，不要去找或臆造单测命令。
- 提交前必须真正执行 `pnpm fmt`（oxfmt），否则 pre-commit 的 `git diff --exit-code` 会拒绝提交。
- **不要直接 `git commit`**：用 `pnpm commit` 交互式生成 Conventional Commits。是否提交、何时提交由用户决定。
- 已知遗留问题：`src/views/system-manage/setting/modules/PrintFormat.vue` 存在 6 个 `@typescript-eslint/no-unused-vars` 误报，**全库 `pnpm lint` 会因此失败，属既有问题，本次不修、不要试图修复**。
- 不要动 `packages/`、不要改 `src/router/elegant/**`、不要改构建配置。
- 已生成的字体产物不要重新生成（除非文案变更）：`src/assets/fonts/AlibabaPuHuiTi-subset.woff2`（116.6KB，family `Alibaba PuHuiTi`）。

---

### Task 1: 新增字体声明文件 `font.css`

**Files:**

- Create: `src/styles/css/font.css`

**Interfaces:**

- Produces: `@font-face` 族名 `Alibaba PuHuiTi`；CSS 变量 `--app-font-family`（供 Task 3 的 `reset.css` 与本文件的 vxe 变量使用）；覆盖 vxe 的 `--vxe-ui-font-family`。

- [ ] **Step 1: 创建文件并写入以下内容**

```css
@font-face {
  font-family: 'Alibaba PuHuiTi';
  src: url('../../assets/fonts/AlibabaPuHuiTi-subset.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

:root {
  --app-font-family: 'Alibaba PuHuiTi', ui-sans-serif, system-ui, -apple-system, 'Microsoft YaHei', sans-serif;
}

/* 覆盖 vxe-table 自带的字体栈；html:root 提升特异性，确保晚于 vxe 样式注入时也生效 */
html:root {
  --vxe-ui-font-family: var(--app-font-family);
}
```

- [ ] **Step 2: 确认字体文件存在且路径正确**

Run: `Get-Item src\assets\fonts\AlibabaPuHuiTi-subset.woff2 | Select-Object Name,Length`
Expected: `AlibabaPuHuiTi-subset.woff2`，Length 约 `119372`。相对路径 `../../assets/fonts/...` 从 `src/styles/css/` 解析到 `src/assets/fonts/`，正确。

---

### Task 2: 样式入口引入字体文件

**Files:**

- Modify: `src/styles/css/global.css:1-3`

**Interfaces:**

- Consumes: Task 1 的 `src/styles/css/font.css`
- Produces: 字体声明进入全局样式链（`main.ts → plugins/assets.ts → uno.css + global.css`）

- [ ] **Step 1: 在 `@import './reset.css';` 之前插入字体引入**

修改后文件头部为：

```css
@import './font.css';
@import './reset.css';
@import './nprogress.css';
@import './transition.css';
```

注意：`@import` 必须位于所有普通规则之前，因此只能插在现有 `@import` 区块内，不能放到文件末尾。

---

### Task 3: 全局字体栈改用变量

**Files:**

- Modify: `src/styles/css/reset.css:28-42`（`html` 选择器内的 `font-family`）

**Interfaces:**

- Consumes: Task 1 的 `--app-font-family`
- Produces: 全站默认字体（非组件库元素）切换为普惠体

- [ ] **Step 1: 替换 `html` 的 font-family 值**

`reset.css` 中该值是**多行**的（第 28-42 行），整段替换为单行变量引用。替换后该选择器应为：

```css
html {
  line-height: 1.5; /* 1 */
  -webkit-text-size-adjust: 100%; /* 2 */
  -moz-tab-size: 4; /* 3 */
  tab-size: 4; /* 3 */
  font-family: var(--app-font-family); /* 4 */
}
```

原多行为 `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; /* 4 */`，整段删除并换成上面的 `var(--app-font-family)`，保留行尾注释 `/* 4 */`（原字体链已并入 `--app-font-family`，不要额外保留旧列表）。

---

### Task 4: Naive UI 主题字体

**Files:**

- Modify: `src/store/modules/theme/shared.ts`（`getNaiveTheme()` 的 `common`，约 250-255 行）

**Interfaces:**

- Consumes: 无（字体族名需与 Task 1 的 `--app-font-family` 保持一致）
- Produces: `GlobalThemeOverrides.common.fontFamily`，供 `src/App.vue` 的 `NConfigProvider :theme-overrides` 生效

- [ ] **Step 1: 在文件顶部（import 之后、类型定义之前）新增常量**

```ts
/**
 * Application font family
 *
 * It must be consistent with the CSS variable `--app-font-family` in `src/styles/css/font.css`.
 */
const APP_FONT_FAMILY = "'Alibaba PuHuiTi', ui-sans-serif, system-ui, -apple-system, 'Microsoft YaHei', sans-serif";
```

- [ ] **Step 2: 在 `getNaiveTheme()` 的 `common` 中加入 fontFamily**

只改 `common`，在 `borderRadius` 后追加一行 `fontFamily: APP_FONT_FAMILY`：

```ts
  const theme: GlobalThemeOverrides = {
    common: {
      ...getNaiveThemeColors(colors, settings.recommendColor),
      borderRadius: `${settings.themeRadius}px`,
      fontFamily: APP_FONT_FAMILY
    },
    // LoadingBar 及其余既有配置保持原样，不要删除或改写
```

**不要**把上面的注释写进代码文件，它只是提示；实际文件里 `LoadingBar` 段原样保留。

注意：Naive 的字体通过 cssinjs 注入，此处必须写完整字符串，不能用 `var(--app-font-family)`；因此改字体名要同步 CSS 变量与这个常量两处。

- [ ] **Step 3: 类型检查**

Run: `pnpm typecheck`
Expected: 无新增报错（`GlobalThemeOverrides['common']` 支持 `fontFamily`）。

---

### Task 5: 仓库清理（源字体不入库 + 移除未用依赖）

**Files:**

- Modify: `.gitignore`
- Modify: `package.json`（移除 `cn-font-split`）

**Interfaces:**

- Consumes: Task 1 的字体产物（子集入库，源字体不入库）
- Produces: 干净的依赖与仓库体积

- [ ] **Step 1: 在 `.gitignore` 追加源字体排除规则**

```gitignore
# 字体源文件（体积大，仅用于重建子集，重建命令见 changelog/阿里巴巴普惠体字体子集化.md）
src/assets/fonts/source/
```

若 `.gitignore` 不存在则创建。

- [ ] **Step 2: 移除未使用的依赖**

Run: `$env:NODE_OPTIONS=""; pnpm remove cn-font-split`
Expected: `devDependencies` 中不再有 `cn-font-split`。若报 `--file parameter is required`，确认已按 Global Constraints 清空 `NODE_OPTIONS`。

- [ ] **Step 3: 确认子集产物仍在版本控制内**

Run: `git status --short`
Expected: `src/assets/fonts/AlibabaPuHuiTi-subset.woff2` 可被添加；`src/assets/fonts/source/` 不出现（已被忽略）。

---

### Task 6: 验证与兜底修正

**Files:**

- 可能修改：`src/styles/css/font.css`（仅当 vxe 变量被覆盖时）、`src/store/modules/theme/shared.ts`（仅当 Naive 未生效时）

**Interfaces:**

- Consumes: Task 1-4 的全部产物

- [ ] **Step 1: 启动开发服务器**

Run: `$env:NODE_OPTIONS=""; pnpm dev`
Expected: 启动成功（端口 9111）。

- [ ] **Step 2: 浏览器人工核对清单**

打开任意页面（建议「系统管理 → 用户管理」）逐项确认：

1. DevTools → Network 过滤 `woff2`：只有一个请求、大小约 116KB、状态 200。
2. **vxe-table 表格**：表头与单元格文字是否为普惠体（这是最容易漏的一处）。
3. **Naive 组件**：点开一个弹窗 / 下拉框 / 按钮，确认文字是普惠体。
4. **菜单与页面标题**：侧边菜单、面包屑是否为普惠体。
5. **首屏**：刷新页面，不应出现长时间空白（`font-display: swap` 会先用系统字体渲染）。

- [ ] **Step 3: 兜底修正（仅在验证失败时执行）**

- 若 **表格文字没变**：说明 vxe 样式覆盖了变量，把 `font.css` 中的选择器从 `html:root` 提升为 `html:root:root`，仍无效则在变量值末尾加 `!important`（`--vxe-ui-font-family: var(--app-font-family) !important;`）。
- 若 **Naive 组件文字没变**：确认 `src/App.vue` 的 `NConfigProvider` 仍绑定 `:theme-overrides="themeStore.naiveTheme"`，且 `getNaiveTheme()` 的返回值里 `common.fontFamily` 存在；检查是否有预设主题（`theme-preset.vue` 的 `setNaiveThemeOverrides`）在运行时覆盖了 `common`。

- [ ] **Step 4: 静态检查**

Run: `pnpm typecheck`
Expected: 通过。
Run: `pnpm lint`
Expected: 仅可能出现 `PrintFormat.vue` 的既有误报（6 个 unused-vars），**不要去修它**；本次改动不应引入新的 lint 报错。

- [ ] **Step 5: 格式化并交付（提交由用户决定）**

Run: `pnpm fmt`
Expected: 无输出或仅格式化提示；`git diff` 中无格式噪声。
提交（如需）：`pnpm commit`，类型建议 `feat`，主题如 `feat: 接入阿里巴巴普惠体子集字体`。**不要直接 `git commit`。**

- [ ] **Step 6: 更新讨论记录**

在 `changelog/阿里巴巴普惠体字体子集化.md` 的「待办与风险（尚未实现）」中，把第 1 条「接入 CSS 未做」更新为已完成，并记录验证结论（表格 / Naive / 菜单三处是否生效、最终字体体积）。
