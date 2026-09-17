# 分配权限对接 /role/auths/update

## 背景与定位

用户提问：「分配权限界面的接口有调吗？/role/auths/update」。经核对源码定位：

- 抽屉 `role-permission-drawer.vue` 的 `handleSubmit()` 原调 `fetchAssignRoleMenu`：
  - **DEV**：走 `mockAssignRoleMenu`（本地 mock，**根本不联真实后端**）；
  - **非 DEV**：调 `/system/role/assignMenu`，请求体 `{ roleId, menuIds:number[], buttonCodes:string[], subMenuCodes:string[] }`。
- 后端真实契约（`tms-user/lib/api-v1-web/role/index.js`）：`POST /role/auths/update`，body `{ _id, auths: string[] }`（`validate.strict:true`，`strArr`）。`roleService.updateAuths` 直接 `updateOne(body)` 原样存储；登录时 `fillAuthMap` 把 `auths` 拍平成 `authMap = { [code]: true }`，前端 `userInfo.buttons` / `hasAuth(code)` 直接吃这些码。

→ 原实现既没调对接口，入参结构也与后端不符。

## 决策（用户拍板）

**以「前端定义的码」为准**：

- 菜单 id 转字符串（如 `505`）；
- 按钮权限 `system:user:add`、子模块 `system:setting:basicConfig`（来自 `constants/menu-permissions.ts`）。

后端原样存储前端传的码，`hasAuth` 链路保持自洽。代价是后端不再用它的数字码（`12`/`12-1`），改为存前端 `system:*` 码——这是产品层取舍，用户确认。

## 实施（4 处）

1. **`src/service/api/role/index.ts`**
   - 删除 `fetchGetRoleMenuTree`（死代码；抽屉本就用静态树 `getMenuPermissionTree()`，从未调用）；
   - 将 `fetchAssignRoleMenu` 改为真实接口 `fetchUpdateRoleAuths({ _id: string; auths: string[] })`，调 `POST /role/auths/update`（去掉 DEV mock 分支，与角色其余接口一致，DEV 也直连真实后端）。

2. **`src/service/api/mock.ts`**
   - 删除随接口失效的 `mockGetRoleMenuTree` / `mockAssignRoleMenu` 及专用常量 `MENU_TREE` / `ALL_MENU_IDS`。

3. **`src/views/system-manage/role/modules/role-permission-drawer.vue`**
   - `loadData()`：用 `props.row.auths`（列表行已带，类型 `Role.auths?: string[]`）做**预勾选回显**。递归 `walk`：菜单 id 在 `auths`、或任一后代命中 → 该菜单勾选（父级随子级联动，保证提交/回显可往返）；按钮 `code` / 子模块 `code` 命中则回填对应 checks map；`home` 菜单恒勾选且禁用。
   - `handleSubmit()`：把 `checkedIds` / `rowButtonChecks` / `rowSubMenuChecks` 三套状态**合并为扁平 `auths`**（菜单 id 转 `String` + 按钮码 + 子模块码，去重），调 `fetchUpdateRoleAuths({ _id, auths })`。

4. **`src/typings/api/system-manage.d.ts`**
   - 删除已失效的 `RoleMenuNode` / `RoleMenuTree` / `RoleAssignMenuParams` 类型声明（无外部引用）。

**附带清理**：该文件在工作区已被外部重构（#nav-header 简化为纯文字、移除 `navHeaderState`/`toggleCheckAll`），遗留一个无用的 `allIds` 计算属性，一并删除（eslint 报未使用）。

## 验证

- `pnpm typecheck`：本任务相关文件 0 报错。仅剩 `src/views/data-manage/*` 的 `Cannot find module '@/components/MasterData/...'` —— 系工作区已删除这些组件文件导致的**既有错误**，与本次任务无关。
- `eslint`：`role-permission-drawer.vue` 0 error（其余 service / typings 文件 eslint 配置未覆盖，靠 typecheck 保证）。
- 未跑 playwright 实测（需真实后端 `/role/auths/update` 在线）。

## 人工联调建议（DEV 连真实后端）

1. 打开某角色的「分配权限」→ 应还原其已勾选菜单/按钮/子模块（回显正确）；
2. 勾选/取消若干项后提交 → Network 出现 `POST /role/auths/update`，body 形如 `{ "_id": "<角色id>", "auths": ["505","system:user:add",...] }`；
3. 重新打开同一角色 → 勾选项与提交前一致（往返一致）；
4. 首页等 `home` 菜单恒勾选且不可取消。
