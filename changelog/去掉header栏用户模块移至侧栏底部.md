# 去掉 header 栏、用户模块移至侧栏底部

> 2026-09-16 · 用户附截图红框：「能不能把这个header栏去掉，把用户模块移到菜单栏底部」

## 需求确认（三问三答）

| 问题                                                                    | 用户决策                                                         |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| header 右侧功能按钮（全局搜索 / 全屏 / 语言切换 / 暗黑切换 / 主题配置） | 全部去掉，界面只保留 侧栏 + tab 栏 + 内容区                      |
| header 左上角「折叠菜单」按钮（☰）                                     | 不要了，侧栏固定展开（移动端开关入口暂不处理，桌面管理端为主）   |
| 侧栏底部用户区样式                                                      | 展开：图标+用户名 水平排列，点击弹「退出登录」菜单；收起：仅图标 |

**用户补充约束：先不删除文件，只做注释。** 因此 `global-header/` 目录（含 `theme-button.vue`、`user-avatar.vue`）、`global-search/`、`global-breadcrumb/`、`theme-drawer/` 等文件全部保留，仅断开引用；用户组件也不迁移目录，由 `global-sider` 跨目录引用。

## 问题定位

1. 布局壳是 `src/layouts/base-layout/index.vue` 挂 `@sa/materials` 的 `AdminLayout`；header 内容在 `src/layouts/modules/global-header/index.vue`（MenuToggler + 面包屑 + 右侧按钮组 + UserAvatar）。
2. **AdminLayout 原生支持 `headerVisible` prop**（`showHeader = Boolean(slots.header) && props.headerVisible`），且 tab 已内置 `top-0!`（`fullContent || !showHeader` 时顶格）、sider 的 `sider-padding-top` 仅在 `showHeader` 时附加 → 传 `:header-visible="false"` 即可整体去 header，无空隙残留，**无需改 `packages/@sa/*`**。
3. 侧栏 `global-sider/index.vue` 结构 = Logo（56px，与 header 同高）+ 菜单挂载点 `div#GLOBAL_SIDER_MENU_ID`（`flex-1-hidden` 撑满）→ 挂载点下方加 56px 用户区天然落在底部。

## 改动清单

- `src/layouts/base-layout/index.vue`
  - 注释 `GlobalHeader`、`ThemeDrawer` 导入与 `<template #header>`、`<ThemeDrawer />` 挂载；
  - 注释 `headerProps` 计算属性（含中文注释说明恢复方式）；
  - `<AdminLayout>` 增加 `:header-visible="false"`。
- `src/layouts/modules/global-sider/index.vue`
  - 跨目录引用 `../global-header/components/user-avatar.vue`（不迁移文件）；
  - 菜单挂载点下方新增底部用户区：56px 高、上边框分隔、水平居中。
- `src/layouts/modules/global-header/components/user-avatar.vue`
  - 下拉弹出方向 `bottom` → `top`（侧栏底部向上弹出）；
  - 用户名随 `appStore.siderCollapse` 隐藏（收起时仅图标）。
- 保留未动：`global-header/index.vue`、`theme-button.vue`、`global-search/`、`global-breadcrumb/`、`theme-drawer/`（死代码，日后恢复 header 时取消注释即可）。

## 影响说明

- 顶部 tab 页签栏保留（不在用户红框内）。
- 移动端抽屉式侧栏失去开关入口、主题配置抽屉失去入口（均为有意下线）。
- 「退出登录」确认弹窗逻辑不变。

## 验证

`pnpm typecheck` + `pnpm lint` + `pnpm dev` 目视确认：无 header、tab 顶格、侧栏底部用户区、退出登录可用。
