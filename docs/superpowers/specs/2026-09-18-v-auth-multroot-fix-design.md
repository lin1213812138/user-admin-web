# 按钮权限 v-auth 在多根组件上失效修复设计

- 日期：2026-09-18
- 范围：`user-admin-web`（前端）
- 后端：`tms-user` 零改动
- 状态：待评审
- 关联设计：[`2026-09-18-permission-control-design.md`](./2026-09-18-permission-control-design.md)（本文是其 §6「按钮权限」未覆盖场景的修复补充）

---

## 1. 问题定位

`permission-control-design.md` §6.1 已落地 `v-auth` 指令与 `useAuth().hasAuth()`，并以 `views/system-manage/user/index.vue` 为接入样板。但在实际接入时出现两类 bug：

### 1.1 多根组件上 `v-auth` 完全不生效（主因）

`v-auth` 是 Vue **自定义指令**，Vue 只会把指令作用到组件的**单根元素**上。若指令挂在**多根（Fragment）组件**上，Vue 在 dev 下告警并**直接丢弃指令**：

> Runtime directive used on component with non-element root node. The directives will not function as intended.

经核查，以下组件都是多根（Fragment）组件，指令挂上去会被丢弃：

- `LButton`：`createReusableTemplate` 的 `DefineButton` 组件 `render()` 返回 `undefined` → 渲染注释节点 `<!---->`，加上 `NTooltip`/`ReuseButton` 形成 `[<!---->, NButton]` 多根（见 `node_modules/@vueuse/core/dist/index.js:73-77`）。
- `NPopconfirm` / `NTooltip`：naive-ui 的 `Popover` 的 `render()` 返回数组 `[trapDiv?, VTarget, NPopoverBody]`（见 `node_modules/naive-ui/es/popover/src/Popover.mjs:440-482`）→ 多根。

而 `NButton`（根节点是单个 `<button>`）、原生 `<span>` 是单根，指令生效。

### 1.2 调用处现状（失效/生效对照）

| 位置                                             | 当前写法                                                               | 根节点                               | 结果                                   |
| ------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------ | -------------------------------------- |
| `user/index.vue:280` 新增                        | `<LButton v-auth="'system:user:add'">`                                 | LButton 多根                         | ❌ 失效（截图复现：无 add 权限却显示） |
| `user/index.vue:338` 启用/停用                   | `<NPopconfirm v-auth="'system:user:enableOrDisable'">`                 | NPopconfirm 多根                     | ❌ 失效 + 错码                         |
| `user/index.vue:346` 删除                        | `<NPopconfirm v-auth="'system:user:delete'">`                          | NPopconfirm 多根                     | ❌ 失效                                |
| `role/index.vue:354` 删除                        | `<NPopconfirm v-auth="'system:role:delete'">`                          | NPopconfirm 多根                     | ❌ 失效                                |
| `user/index.vue:292` 批量删除                    | `<NButton v-auth="'system:user:delete'">`（在 NPopconfirm trigger 内） | NButton 单根（cloneVNode 保留 dirs） | ✅ 生效                                |
| `user/index.vue:306` 导出                        | `<span v-auth="'system:user:export'">`                                 | 原生元素                             | ✅ 生效                                |
| `user/index.vue:335` / `role:292,322` 编辑、新增 | `<NButton v-auth="...">`                                               | NButton 单根                         | ✅ 生效                                |

### 1.3 独立的错码 bug

`user/index.vue:338` 用 `system:user:enableOrDisable`，但 `constants/menu-permissions.ts:82` 定义的码是 `system:${module}:status`（且 `:299` 已把 `user.status` 挂在「用户管理」按钮），角色分配抽屉提交的也是 `system:user:status`。因此 `enableOrDisable` 永远匹配不上 —— 即使指令生效，该按钮也会恒显。

### 1.4 关于「刷新后权限又回来」

主因即 §1.1（指令在多根组件上从未执行，整页重载后自然仍显示）。补充风险：`v-auth` 当前用 `el.remove()`（见 `directives/auth.ts:28`），被摘掉的 DOM 仍被 Vue 的 vnode 持有引用；若该节点所属组件在表格 `getData()` 刷新等场景下被 re-patch 并触发 insert/move，元素可能被「复活」。详见 §4。

---

## 2. 修复方案（方案 A）

核心原则：**让 `v-auth` 只落在单根元素（原生 `<span>` / 单根 `NButton`）上**；多根组件改用组件级 `auth` prop（LButton）或把 `v-auth` 移入其 trigger 内的单根 `NButton`。

### 2.1 `LButton` 增加 `auth` prop（内部判断，不依赖指令）

`src/components/basic/LButton.vue`：

- Props 新增：

```ts
/** 权限码（单码或数组）；传入后当前用户无该权限时按钮整体不渲染。
 *  等价于 v-auth，但适用于 LButton 这种多根组件（指令无法作用到 fragment 根）。 */
auth?: string | string[];
```

- setup 引入 `useAuth()`，加 `visible`：

```ts
import { useAuth } from '@/hooks/business/auth';
const { hasAuth } = useAuth();
const visible = computed(() => (props.auth ? hasAuth(props.auth) : true));
```

- 模板最外层包 `<template v-if="visible">`（保证 `visible=false` 时整段不渲染，不影响 `NSpace` 布局占位）：

```vue
<template>
  <template v-if="visible">
    <DefineButton>...</DefineButton>
    <NTooltip v-if="props.tooltip" ...>...</NTooltip>
    <ReuseButton v-else />
  </template>
</template>
```

行为与原 `v-auth` 一致（`hasAuth` 含 `isSuperAdmin` 短路）。无权限时**整段不渲染**（包括 disabled 时垫的 span），不留空白占位。

### 2.2 `NPopconfirm` / `NTooltip` 上的 `v-auth` 移入 trigger 内单根 `NButton`

`NPopconfirm` 的 `trigger` 插槽里就是单根 `NButton`，把 `v-auth` 从 `NPopconfirm` 移到该 `NButton`（cloneVNode 会保留 vnode.dirs，指令生效）。无权限时 `NButton` 被移除，浮层无触发源 → 行为正确。

- `user/index.vue:338`：

```diff
- <NPopconfirm v-auth="'system:user:enableOrDisable'" @positive-click="handleToggleStatus(row)">
-   <template #trigger>
-     <NButton size="small" :type="row.status === 1 ? 'warning' : 'success'" text>
+ <NPopconfirm @positive-click="handleToggleStatus(row)">
+   <template #trigger>
+     <NButton v-auth="'system:user:status'" size="small" :type="row.status === 1 ? 'warning' : 'success'" text>
        {{ row.status === 1 ? $t('common.disable') : $t('common.enable') }}
      </NButton>
```

- `user/index.vue:346`：

```diff
- <NPopconfirm v-auth="'system:user:delete'" @positive-click="handleDelete([row._id])">
-   <template #trigger>
-     <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
+ <NPopconfirm @positive-click="handleDelete([row._id])">
+   <template #trigger>
+     <NButton v-auth="'system:user:delete'" size="small" type="error" text>{{ $t('common.delete') }}</NButton>
```

- `role/index.vue:354`：

```diff
- <NPopconfirm v-auth="'system:role:delete'" @positive-click="handleDelete([row])">
-   <template #trigger>
-     <NButton size="small" type="error" text :disabled="row.buildIn === 1">
+ <NPopconfirm @positive-click="handleDelete([row])">
+   <template #trigger>
+     <NButton v-auth="'system:role:delete'" size="small" type="error" text :disabled="row.buildIn === 1">
```

### 2.3 `LButton` 上的 `v-auth` 改为 `auth` prop

- `user/index.vue:280`：

```diff
- <LButton v-auth="'system:user:add'" type="primary" @click="openDrawer('create')">
+ <LButton auth="system:user:add" type="primary" @click="openDrawer('create')">
```

### 2.4 不受影响、保持不动的用法（已在单根元素上，记录以明确范围）

- `user/index.vue:292` 批量删除 `<NButton v-auth>`（trigger 内，单根）✅
- `user/index.vue:306` 导出 `<span v-auth>`（原生元素）✅
- `user/index.vue:335` 编辑 / `role/index.vue:292` 新增 / `role/index.vue:322` 编辑 `<NButton v-auth>`（单根）✅

---

## 3. 权限码约定（补充到 §1.3）

启用/停用按钮权限码统一为 `system:user:status`（与 `menu-permissions.ts` `op('user').status` 及角色分配抽屉一致）。**前端权限校验只认 `menu-permissions.ts` 生成的码**；若后端 `/system/menu/list` 对启用/停用返回的是别的码，需同步修正 `menu-permissions.ts`（不在本次范围，但需登录验证时确认返回值为 `system:user:status`）。

按钮码本次沿用既有落地的**裸字符串**写法（与 `user/index.vue` / `role/index.vue` 现状一致），不引入 `menu-permissions.ts` 派生常量 —— 该「派生常量」约定属 `permission-control-design.md` §6.3 的后续统一项，不在本修复范围。

---

## 4. 指令语义处理决策

**本次不改动 `v-auth` 指令的 `el.remove()` 语义**，理由：

1. `permission-control-design.md` §6.1 已明确「无权限时 `el.remove()`（而非 `display:none`，避免 DevTools 改回）」，是已确认的设计决策；
2. 经 §2 修复后，所有 `v-auth` 均落在单根元素（`NButton` / `<span>`）上，完全符合该设计意图，根因已消除。

**可选增强（不在本次强制）**：若后续发现表格 `getData()` 刷新后单根按钮被「复活」（§1.4 的 remove/patch 风险），再将指令改为 `display:none` + 增加 `updated` 钩子。该改动会覆盖 §6.1 的 remove 决策，需届时单独评审。

**新增约定（防回归）**：在 `permission-control-design.md` §6 补充一条规则 ——「`v-auth` 只能用于原生元素或单根组件（`NButton` / `<span>` 等）；多根组件（LButton / NPopconfirm / NTooltip / 自定义多根组件）上的权限控制改用 `LButton` 的 `auth` prop，或把 `v-auth` 挂到其内部单根触发元素上。」

---

## 5. 改动清单

| 文件                                                             | 改动                                                                                                                                    |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/basic/LButton.vue`                               | Props 增 `auth`；setup 增 `visible`；模板外层包 `<template v-if="visible">`                                                             |
| `src/views/system-manage/user/index.vue`                         | L280 `v-auth`→`auth` prop；L338 `v-auth` 移入 trigger `NButton` 并改码 `enableOrDisable`→`status`；L346 `v-auth` 移入 trigger `NButton` |
| `src/views/system-manage/role/index.vue`                         | L354 `v-auth` 移入 trigger `NButton`                                                                                                    |
| `docs/superpowers/specs/2026-09-18-permission-control-design.md` | §6 补充「v-auth 仅用于单根元素」规则                                                                                                    |

不涉及 `directives/auth.ts`、`hooks/business/auth.ts`、`menu-permissions.ts` 的代码改动。

---

## 6. 验证

1. `pnpm typecheck`、`pnpm lint`、`pnpm fmt`、`pnpm build:test` 全绿。
2. 用**无** `system:user:add` / `system:user:status` / `system:user:delete` 权限的账号登录「用户管理」：
   - 工具栏「新增」按钮消失；
   - 行内「启用/停用」「删除」按钮消失；
   - 「编辑」「批量删除」「导出」按各自权限正常显隐（编辑当前有 add/edit 之外的码，按实际权限验证）。
3. 用**有** `system:user:status` 权限的账号登录，确认「启用/停用」重新出现。
4. dev 控制台确认**无** `Runtime directive used on component with non-element root node` 告警。
5. `role/index.vue` 删除按钮同理按 `system:role:delete` 验证。
