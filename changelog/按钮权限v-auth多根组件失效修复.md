# 按钮权限 v-auth 在多根组件上失效修复

日期：2026-09-18
范围：user-admin-web（前端），后端 tms-user 零改动

## 1. 问题定位

「用户管理」页面「新增」按钮，当前账号无 `system:user:add` 权限却仍然显示（刷新后也回来）。

根因：`v-auth` 是 Vue **自定义指令**，只会作用到组件的**单根元素**；挂在**多根（Fragment）组件**上时 Vue 直接丢弃指令（dev 告警 `Runtime directive used on component with non-element root node. The directives will not function as intended`）。

- `LButton` 模板含 `createReusableTemplate` 的 `DefineButton`（其组件 `setup` 返回 `undefined` → 渲染注释节点 `<!---->`），加上 `NTooltip`/`ReuseButton` 形成 `[<!---->, NButton]` 多根 → 指令失效。
- `NPopconfirm` / `NTooltip`：naive-ui 的 `Popover` 的 `render()` 返回数组（`VBinder` 默认插槽 `[trapDiv?, VTarget, NPopoverBody]`）→ 多根 → 指令失效。

经核查受影响/不受影响对照（见 spec §1.2）：

| 位置                                          | 写法                                                   | 结果           |
| --------------------------------------------- | ------------------------------------------------------ | -------------- |
| `user/index.vue:280` 新增                     | `<LButton v-auth>`                                     | ❌ 失效        |
| `user/index.vue:338` 启用/停用                | `<NPopconfirm v-auth="'system:user:enableOrDisable'">` | ❌ 失效 + 错码 |
| `user/index.vue:346` 删除                     | `<NPopconfirm v-auth="'system:user:delete'">`          | ❌ 失效        |
| `role/index.vue:354` 删除                     | `<NPopconfirm v-auth="'system:role:delete'">`          | ❌ 失效        |
| `user/index.vue:292/306/335`、 `role:292/322` | `<NButton v-auth>` / `<span v-auth>`                   | ✅ 单根生效    |

附带独立 bug：`user/index.vue:338` 用码 `system:user:enableOrDisable`，但 `constants/menu-permissions.ts:82` 定义的是 `system:${module}:status`（且 `:299` 已把 `user.status` 挂在用户管理按钮，角色分配抽屉也提交 `status`）→ `enableOrDisable` 永远匹配不上。

## 2. 决策

采用方案 A：让 `v-auth` 只落在单根元素（原生 `<span>` / 单根 `NButton`）上；多根组件改用组件级 `auth` prop（LButton）或把 `v-auth` 移入其 trigger 内单根 `NButton`。

- **LButton 新增 `auth?: string | string[]` prop**：内部 `useAuth().hasAuth()`，无权限时整段不渲染（等价 `v-auth`，但不依赖指令、不受根节点数影响）。`user/index.vue:280` 由 `v-auth="'system:user:add'"` 改 `auth="system:user:add"`。
- **NPopconfirm 上的 `v-auth` 移入 trigger 内单根 `NButton`**：`user/index.vue:338/346`、`role/index.vue:354` 均如此处理；`user/index.vue:338` 同时改码 `enableOrDisable` → `status`。
- **指令语义不动**：`directives/auth.ts` 的 `el.remove()` 是 `permission-control-design.md` §6.1 已确认的设计决策；修复后所有 `v-auth` 均落在单根元素，符合该意图。补充一条规则：「`v-auth` 只能用于原生元素或单根组件；多根组件改用 `LButton` 的 `auth` prop 或挂到其内部单根触发元素」。
- 按钮码沿用既有裸字符串写法（与现有 user/role 页面一致），不引入 `menu-permissions.ts` 派生常量（属后续统一项）。

## 3. 改动清单

| 文件                                                             | 改动                                                                                                                                    |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/basic/LButton.vue`                               | Props 增 `auth`；setup 增 `visible = computed(() => props.auth ? hasAuth(props.auth) : true)`；模板外层包 `<template v-if="visible">`   |
| `src/views/system-manage/user/index.vue`                         | L280 `v-auth`→`auth` prop；L338 `v-auth` 移入 trigger `NButton` 并改码 `enableOrDisable`→`status`；L346 `v-auth` 移入 trigger `NButton` |
| `src/views/system-manage/role/index.vue`                         | L354 `v-auth` 移入 trigger `NButton`                                                                                                    |
| `docs/superpowers/specs/2026-09-18-permission-control-design.md` | §6 补充「v-auth 仅用于单根元素」规则                                                                                                    |

不涉及 `directives/auth.ts`、`hooks/business/auth.ts`、`menu-permissions.ts` 的代码改动。

详细设计与 before/after diff 见 `docs/superpowers/specs/2026-09-18-v-auth-multroot-fix-design.md`。

## 4. 验证

`pnpm typecheck` / `pnpm lint` / `pnpm fmt` / `pnpm build:test` 全绿（已实跑通过：typecheck 0 error；lint 0 error，仅 `link.vue` 既有 2 个 `vue/no-undef-properties` warning 与本改动无关；fmt 通过；`build:test` Build successful）。代码层已保证失效点修复，待手动冒烟：用无 `system:user:add` / `system:user:status` / `system:user:delete` 权限账号登录，确认新增、启用/停用、删除（行内）按钮消失；有 `system:user:status` 权限时启用/停用重新出现；dev 控制台无 `Runtime directive used on component with non-element root node` 告警。
