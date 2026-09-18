# 菜单权限与按钮权限控制设计

- 日期：2026-09-18
- 范围：`user-admin-web`（前端）
- 后端：`tms-user` **零改动**
- 状态：已确认待评审

---

## 1. 背景与现状

权限链路目前是「只写不读」：角色管理页能把权限码写进 `role.auths`（`/role/auths/update`），后端 `authMap` 也能对接口做 403 拦截，但前端**从未消费过这些码**。

三个断层：

1. **菜单过滤空转**：`src/router/elegant/routes.ts` 中没有任何路由声明 `meta.roles`，`filterAuthRoutesByRoles`（`src/store/modules/route/shared.ts:12-43`）因 `isEmptyRoles` 恒为 `true` 原样返回全部路由；`src/router/guard/route.ts:29-32` 的 `hasAuth` 同样恒为 `true`。
2. **权限码语义混装**：`role.auths` 里同时存在「前端自增数字菜单 id（如 `"601"`）」「按钮码（`system:user:add`）」「子模块码」。后端 `authMap = zipObject(auths, true)`（`lib/services/role.js:69`），对后端而言 `601` 只是一串无意义 key。且前端 `userInfo.buttons === userInfo.roles`（后端不返回 `showOps`），无法区分菜单可见与按钮可用。
3. **超管判定恒 false**：`isStaticSuper` 依赖 `roles.includes('R_SUPER')`，而 `R_SUPER` 永不出现在 `authMap` 中。

按钮级控制完全缺失：无 `src/directives`、无 `app.directive`、`useAuth().hasAuth` 零调用、`views/system-manage/user/index.vue` 的 5 个 `NButton` 全部裸露。

## 2. 目标与非目标

**目标**

- 菜单（含一级目录）按权限码显隐；直接输入 URL 也被守卫拦截
- 按钮按权限码显隐，并提供参与逻辑判断的函数形式
- 权限码只保留一种格式 `system:{模块}:{动作}`，数字菜单 id 逻辑废弃
- 超管（`roleType === 100` / `accountType=1`）直通，且与后端接口鉴权口径不冲突

**非目标**

- 不动后端（不新增 menu 表、不改 `auth.js`）
- 不启用 `VITE_AUTH_ROUTE_MODE=dynamic`，不接 `/route/getUserRoutes`（后端无此接口，属模板死代码）
- 不做数据权限（后端 `filterCheck` 已实现）
- 本轮不迁移 DB 中已有的数字 id 脏数据

## 3. 权限模型

统一为**单一权限码集合**，两种用途共用一套码：

```
system:{模块}:list      → 菜单 / 路由可见性（如 system:user:list）
system:{模块}:{动作}    → 按钮（如 system:user:add / edit / delete / export）
system:{模块}:{子模块}  → 子模块入口（如 system:setting:basicConfig）
```

**读取规则**：`authMap` 中**只认带 `:` 的 key**，纯数字项在前端派生阶段直接丢弃。

> 这是「逻辑废弃」而非「数据迁移」——DB 里残留的 `601` 无害，无需一次性清洗脚本，也不影响后端。

**超管**：`isSuperAdmin = roleType === SUPER_ROLE_TYPE || accountType === 1`，直通全部菜单与按钮，短路所有码校验。

常量集中在 `src/constants/auth.ts`，便于后续调整：

```ts
/**
 * 前端认定的超级管理员角色类型，与后端 `ROLE_TYPE.ADMIN`（100）对齐。
 *
 * 后端 `lib/services/role.js:77` 注入会话 `user.roleType = max(map(roleList,'roleType'))`；
 * `lib/services/role.js:50` 的删除保护只对 `roleType==100` 生效；`lib/services/role.js:89`
 * 用 `roleType==100` 放宽改密/改资料权限。接口层 `auth.js:22` 仍只认 `accountType==1`，
 * 因此即使 roleType==100，仍需 §7 的权限树全选，确保后端 `authMap` 校验通过。
 */
export const SUPER_ROLE_TYPE = 100;
```

- `roleType` 由后端 `lib/services/role.js:77` 注入会话：`user.roleType = max(map(roleList, 'roleType'))`。
- `accountType === 1` 是后端 `lib/services/auth.js:22` 的接口直通口径。两个条件都判，是为了覆盖「管理员角色」与「管理员账号」两种形态。

**不改后端如何避免「菜单放行、接口 403」**：见 §7 —— 管理员角色的权限树强制全选，其 `auths` 必然完整，后端 `authMap` 校验自然通过。由于后端完全不认识 `5`（只认 `100`），这条兜底是**必需的**，不是可选的。

## 4. 认证层改造

文件：`src/store/modules/auth/index.ts`、`src/typings/api/auth.d.ts`

- `UserDetail` 补 `roleType?: number`（后端已返回，前端类型缺失）
- `applyUser()` 改写派生逻辑：

```ts
const authKeys = Object.keys(user.authMap || {}).filter(code => code.includes(':'));
userInfo.permissions = authKeys;
```

- `UserInfo` 新增 `permissions: string[]`；**移除 `roles` / `buttons`**（二者当前恒等且语义混乱，统一为 `permissions`）
- `isStaticSuper` → `isSuperAdmin`：`computed(() => userInfo.roleType === SUPER_ROLE_TYPE || userInfo.accountType === 1)`
- `resetStore()` 清空 `permissions`

影响面（需同步改）：`src/store/modules/route/index.ts:200`、`src/router/guard/route.ts:31`、`src/hooks/business/auth.ts:12-15`。

## 5. 菜单权限

### 5.1 权限码注入点

`build/plugins/router.ts` 的 `onRouteMetaGen(routeName)` 是路由 meta 的**唯一注入点**（icon / order / hideInMenu / activeMenu 都在此声明）。权限码沿用同一方式集中声明，不改动任何 `.vue`：

```ts
const routePermissions: Partial<Record<RouteKey, string>> = {
  'customer-manage_customer': 'system:customer:list',
  'data-manage_ship': 'system:ship:list',
  'system-manage_user': 'system:user:list'
  // ...
};

if (routePermissions[key]) meta.permission = routePermissions[key];
```

码值从 `src/constants/menu-permissions.ts` 的 `MENU_PERMISSION_TREE`（字段 `routePath` / `permission`）逐条对齐；缺失的补进该常量文件，避免两处真值来源。

覆盖范围：16 条业务路由 + `/home`。`hideInMenu` 路由（`print-design` / `label-designer` / `personal-center`）同样声明 `permission`，因为守卫仍会拦直接访问。

### 5.2 类型

`src/typings/router.d.ts` 的 `RouteMeta` 补 `permission?: string`，注释沿用现有约定说明「仅 static 模式生效」。

### 5.3 过滤逻辑

`src/store/modules/route/shared.ts`：

- `filterAuthRoutesByRoles` → `filterAuthRoutesByPermission(routes, permissions, isSuperAdmin)`
- **叶子节点**：`!routePermission || permissions.includes(routePermission) || isSuperAdmin`
- **父级目录**：先递归过滤子级；子级全部被裁掉则父级一并裁掉（现有实现会留下空目录）；父级自身未声明 `permission` 时不单独判定
- **未声明 `permission` 的路由默认放行**，并在 `import.meta.env.DEV` 下对「非 constant、非 hideInMenu 却无 permission」的路由 `console.warn`

> 默认放行而非默认拦截的理由：本轮是首次启用读取端，默认拦截会让漏配的菜单集体消失；`/home` 也依赖这条规则，避免 `VITE_ROUTE_HOME=home` 被裁掉后 redirect 死循环。dev 告警用于逐步收敛覆盖率。

### 5.4 路由守卫

`src/router/guard/route.ts`：把 `routeRoles` / `hasRole` 换成 `routePermission` / `hasPermission`，判定式与 §5.3 叶子规则完全一致（含 `isSuperAdmin` 短路）。被裁掉的路由未注册，输入 URL 走 404 兜底。

## 6. 按钮权限

### 6.1 指令

新增 `src/directives/auth.ts`：

```ts
export const vAuth: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    if (!hasPermission(binding.value)) el.remove();
  }
};
```

- 无权限时 `el.remove()`（而非 `display:none`，避免 DevTools 改回）
- 权限集合在会话期内不变，只需处理 `mounted`
- 不支持与 `v-if` 混用于同一元素

新增 `src/plugins/directive.ts` 负责 `app.directive('auth', vAuth)` 注册，挂在 `src/plugins/index.ts`（现有 6 个 export 后追加）。

### 6.2 函数形式

保留并改造 `src/hooks/business/auth.ts`：

```ts
export function useAuth() {
  const authStore = useAuthStore();
  function hasAuth(codes: string | string[]) {
    /* isSuperAdmin 短路 + permissions 命中 */
  }
  return { hasAuth };
}
```

用于 `disabled`、是否渲染某列、提交前判断等需要参与逻辑的场景。

### 6.3 页面接入

以 `src/views/system-manage/user/index.vue` 为样板：新增、批量删除、编辑、启用/停用、删除五个点。按钮码从 `src/constants/menu-permissions.ts` 派生常量引用，不硬编码裸字符串。

其余页面（role / group / site / customer / data-manage 各模块）按同一样板接入，本轮覆盖「写操作」按钮，查询/重置不设码。

## 7. 角色管理页配套

- `role-permission-drawer.vue`：提交时**只输出 `system:` 码**，不再把数字 id 塞进 `auths`（`getMenuPermissionTree()` 的 id 生成规则不再落库）
- **管理员角色权限树强制全选且只读**：当 `roleType === SUPER_ROLE_TYPE`（即 `100`）时，勾选框 `disabled` 且全选。这保证其 `auths` 完整，后端 `authMap` 校验必然通过 —— 即使前端 `roleType` 已与后端 `ADMIN=100` 对齐，接口层 `auth.js:22` 仍只认 `accountType==1`，所以此兜底为必需项
- **`RoleType` 已与后端对齐为 `100`**：`Api.SystemManage.RoleType` 与角色管理页下拉的「管理员」均为 `100`，与后端 `ROLE_TYPE.ADMIN` 一致。超管判定统一引用 `SUPER_ROLE_TYPE` 常量，不散落字面量

## 8. 落地顺序

0. 新增 `src/constants/auth.ts`（`SUPER_ROLE_TYPE = 100`）
1. 类型（`auth.d.ts` / `router.d.ts` / `system-manage.d.ts`）+ 认证层 `applyUser`
2. `routePermissions` 映射 + `filterAuthRoutesByPermission` + 守卫
3. `v-auth` 指令 + `useAuth` + 插件注册
4. 角色管理页（权限树输出、管理员全选只读、RoleType 修正）
5. 页面按钮接入（user 打样 → 其余页面）

每步执行 `pnpm typecheck` + `pnpm lint`，收尾 `pnpm build:test`。

## 9. 风险与验证

| 风险                                                                           | 应对                                                                                                                                 |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| 漏配 `permission` 导致菜单意外隐藏                                             | 默认放行 + dev 告警，不会因漏配而减少菜单                                                                                            |
| 老角色 `auths` 只有数字 id，改造后菜单全消失                                   | 需要业务侧重新为角色勾选一次权限（一次性人工操作）                                                                                   |
| 超管（`roleType=100`）但 `accountType≠1` 的用户接口 403                        | 管理员角色权限树强制全选（§7）；前端 roleType 已与后端 ADMIN=100 对齐，但接口层 auth.js:22 只认 accountType==1，仍依赖权限树全选兜底 |
| 后端删除保护（`lib/services/role.js:50` 只拦 `roleType==100`）对管理员角色生效 | roleType=100 已对齐后端，该保护自动生效，管理员角色不可删除                                                                          |
| 数字 id 残留在 DB                                                              | 无害，前端读取时丢弃                                                                                                                 |

验证：`pnpm typecheck`、`pnpm lint`、`pnpm build:test` 全绿；手动冒烟用两个角色（超管 / 仅部分权限）分别登录，确认菜单与按钮差异，并确认直接输入无权限 URL 不可访问。
