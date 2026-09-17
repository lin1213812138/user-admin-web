# 分配权限对接 `/role/auths/update` 设计

> 日期:2026-09-17
> 关联:`src/views/system-manage/role/modules/role-permission-drawer.vue`、`src/service/api/role/index.ts`

## 1. 背景与问题

当前「角色管理 → 分配权限」抽屉的提交链路与后端真实接口对不上:

| 项       | 现状                                                                        | 后端真实契约                                            |
| -------- | --------------------------------------------------------------------------- | ------------------------------------------------------- |
| 提交 URL | DEV 走 `mockAssignRoleMenu`(不联网);生产调 `POST /system/role/assignMenu`   | `POST /role/auths/update`                               |
| 请求体   | `{ roleId, menuIds:number[], buttonCodes:string[], subMenuCodes:string[] }` | `{ _id, auths:string[] }`(扁平权限码数组,`strArr` 校验) |

后端 `roleService.updateAuths` 直接 `updateOne(body)`,把整段 `auths` 存进角色;登录后 `fillAuthMap` 把 `auths` 拍平成 `authMap = { [code]: true }`,前端 `userInfo.buttons` / `hasAuth(code)` 直接吃这些码。

前端 `menu-permissions.ts` 自有一套码(菜单 id 如 `201`、按钮 `system:user:add`、子模块 `system:setting:basicConfig`)。**经确认,以"前端定义的码"为准**——后端原样存储,`hasAuth` 链路保持自洽,不引入后端数字码(`12`/`12-1`)。

因此本次不是改个 URL,而是:把抽屉现有"三套独立勾选状态"合并成扁平 `auths` 数组提交给 `/role/auths/update`,并按角色已存 `auths` 做回显。

## 2. 目标与边界

- 码体系:前端定义为准(`system:*` 码 + 菜单 id 字符串)。后端不改数字码、不新增接口。纯前端改动。
- 权限树依旧由前端 `getMenuPermissionTree()` 静态生成(后端无菜单树接口),不再向后端拉树。
- 不做数据权限(`dataAuths`)、录单格式(`orderTemplateIds`)、各 `Ctrl` 字段——本次只动"菜单/按钮/子模块权限"这一段。
- 验证手段:`pnpm typecheck` + `pnpm lint` + `pnpm build`(本仓库无单测)。

## 3. 数据流

### 3.1 打开抽屉(回显)

`props.row` 为列表行,已带 `auths?: string[]`(`Role` 类型字段,`/role/query` 返回即含)。

`loadData()` 改动:

1. `allRows = getMenuPermissionTree()`(不变)。
2. 取 `authSet = new Set(props.row?.auths ?? [])`。
3. 预勾选:
   - 菜单:若 `String(menu.id)` ∈ `authSet`(或该菜单 `home`)→ `checked`。
   - 按钮:若 `button.code` ∈ `authSet` → 勾选,并回填 `rowButtonChecks[menu.id]`。
   - 子模块:若 `submodule.code` ∈ `authSet` → 勾选,并回填 `rowSubMenuChecks[menu.id]`。
   - `home` 菜单恒勾选且禁用(沿用现 `checkboxConfig.checkMethod`)。
4. 由 `checkedIds` / 两个 checks map 驱动视图(沿用现 `applyView` / `buildView`)。

> 注意:勾选某菜单的按钮/子模块时,其父菜单应自动勾选——沿用现 `handleButtonCheckChange` / `handleSubMenuCheckChange` 里的"自动勾选父菜单"逻辑;回显阶段直接以 `authSet` 计算即可,无需触发那些 handler。

### 3.2 提交

`handleSubmit()` 改动:把三套状态合并为扁平 `auths`:

```
const auths: string[] = [];
// 1. 勾选的菜单(含 home)
checkedIds.value.forEach(id => auths.push(String(id)));
// 2. 按钮权限码
Object.values(rowButtonChecks.value).forEach(codes => auths.push(...codes));
// 3. 子模块权限码
Object.values(rowSubMenuChecks.value).forEach(codes => auths.push(...codes));
// 去重
const payload = { _id: props.row!._id, auths: [...new Set(auths)] };
await fetchUpdateRoleAuths(payload);
```

调用改为 `fetchUpdateRoleAuths`(见 §4)。成功后 `drawerVisible=false` 并 `emit('submitted')`(沿用现逻辑)。

## 4. 接口改动(`src/service/api/role/index.ts`)

- 删除 `fetchGetRoleMenuTree`(死代码;抽屉本就用静态树,未调用)。
- `fetchAssignRoleMenu` 改造为真实接口,建议重命名 `fetchUpdateRoleAuths`:

  ```ts
  export function fetchUpdateRoleAuths(params: { _id: string; auths: string[] }) {
    return request<boolean>({
      url: '/role/auths/update',
      method: 'post',
      data: params
    });
  }
  ```

  - 去掉 `if (import.meta.env.DEV) return mock...` 分支——角色其余接口(增删改查)DEV 已是真实调用,保持一致,DEV 直连真实 `/role/auths/update`。

- 顶部注释去掉"权限对接另起设计,暂走 mock"等旧说明。

## 5. Mock 清理(`src/service/api/mock.ts`)

删除随接口失效的 `mockGetRoleMenuTree` / `mockAssignRoleMenu`(及其相关常量 `MENU_TREE` / `ALL_MENU_IDS`,确认无其他引用后一并删)。

## 6. 类型清理(`src/typings/api/system-manage.d.ts`)

- `Role.auths?: string[]` 已存在,无需新增。
- `RoleAssignMenuParams` / `RoleMenuTree` / `RoleMenuNode` 若仅被上述删除代码引用,可一并清理(可选,不阻塞)。

## 7. 改动文件清单

| 文件                                                              | 改动                                                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/service/api/role/index.ts`                                   | 删 `fetchGetRoleMenuTree`;改 `fetchAssignRoleMenu` → 真实 `/role/auths/update`(重命名 `fetchUpdateRoleAuths`) |
| `src/service/api/mock.ts`                                         | 删 `mockGetRoleMenuTree` / `mockAssignRoleMenu` 及相关常量                                                    |
| `src/views/system-manage/role/modules/role-permission-drawer.vue` | `loadData` 按 `row.auths` 回显;`handleSubmit` 组装扁平 `auths`;改调 `fetchUpdateRoleAuths`                    |
| `src/typings/api/system-manage.d.ts`                              | (可选)清理 `RoleAssignMenuParams` / `RoleMenuTree`                                                            |

## 8. 错误处理

- `handleSubmit` 的 `try/finally` 保留;`submitting` loading 态不变。
- 后端 `validate.strict:true` 要求严格 `{ _id, auths }`,不传多余字段;菜单 id 统一转 `String` 以防数字混入。
- 角色 `auths` 为 `undefined`(新建角色未在列表带出)时按空数组处理,不报错。

## 9. 验证

1. `pnpm typecheck` 通过(重点:`fetchUpdateRoleAuths` 入参、抽屉内 `row.auths` 取值)。
2. `pnpm lint` 通过。
3. `pnpm build` 通过。
4. 人工(DEV 连真实后端):打开某角色"分配权限"→ 应还原其已勾选项;勾选/取消若干项后提交 → 调 `POST /role/auths/update`,body `{ _id, auths:[...] }`;重新打开应保持一致(回显正确)。
