# 分配权限对接 /role/auths/update 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把「角色管理 → 分配权限」抽屉的提交从临时 mock / `/system/role/assignMenu` 改为真实后端接口 `POST /role/auths/update`，请求体为 `{ _id, auths: string[] }`（扁平权限码数组），并按角色已存 `auths` 做勾选回显。

**Architecture:** 权限树仍由前端 `getMenuPermissionTree()` 静态生成;抽屉现有三套独立勾选状态（`checkedIds` / `rowButtonChecks` / `rowSubMenuChecks`）在提交时合并为扁平 `auths` 数组;打开抽屉时用 `props.row.auths` 预勾选。码体系以"前端定义为准"（`system:*` 码 + 菜单 id 字符串），后端原样存储，`hasAuth` 链路自洽。

**Tech Stack:** Vue 3.5 `<script setup lang="ts">` + Naive UI + vxe-table;Axios(`@sa/axios` `request`);TypeScript 6 strict。

## Global Constraints

- 码体系以"前端定义的码"为准（菜单 id 转 `String`，如 `"505"`;按钮 `system:user:add`、子模块 `system:setting:basicConfig`）。后端不改数字码、不新增接口。
- 纯前端改动;不手改 `src/router/elegant/**`、`typings/components.d.ts` 等生成文件。
- 验证手段固定为 `pnpm typecheck` + `pnpm lint` + `pnpm build`（本仓库无单测框架）。
- 编辑前设计已用 brainstorming 确认(见 `docs/superpowers/specs/2026-09-17-role-permission-auths-update-design.md`)。
- 包管理只用 pnpm;同一文件多处编辑串行执行。

---

### Task 1: service 层改为真实 `/role/auths/update`

**Files:**

- Modify: `src/service/api/role/index.ts`

**Interfaces:**

- 移除旧 `fetchGetRoleMenuTree`(死代码,抽屉本就用静态树)。
- 新增 `fetchUpdateRoleAuths(params: { _id: string; auths: string[] }): Promise<{data,error,response}>`(flat 请求,调用方直接 `await` 拿 `boolean`)。
- 移除 `mockGetRoleMenuTree` / `mockAssignRoleMenu` 的 import(由 Task 2 删除实现)。

- [ ] **Step 1: 修改 import 与文件头注释**

将

```ts
import { request } from '../../request';
import { mockAssignRoleMenu, mockGetRoleMenuTree } from '../mock';

// 除权限树两个函数暂走 mock 外，其余均为真实接口（tms-user /api/v1/web/role/*），flat 请求需调用方解包 { data, error }
```

改为

```ts
import { request } from '../../request';

// 全部为真实接口（tms-user /api/v1/web/role/*），flat 请求需调用方解包 { data, error }
```

- [ ] **Step 2: 删除 `fetchGetRoleMenuTree` 整段**

删除以下代码块:

```ts
/** get role permission menu tree（权限对接另起设计，暂走 mock） */
export function fetchGetRoleMenuTree(roleId: string) {
  if (import.meta.env.DEV) {
    return mockGetRoleMenuTree(roleId) as unknown as Promise<Api.SystemManage.RoleMenuTree>;
  }

  return request<Api.SystemManage.RoleMenuTree>({
    url: '/system/role/menuTree',
    method: 'get',
    params: { roleId }
  });
}
```

- [ ] **Step 3: 把 `fetchAssignRoleMenu` 替换为 `fetchUpdateRoleAuths`**

将

```ts
/** assign menu permissions to role（权限对接另起设计，暂走 mock） */
export function fetchAssignRoleMenu(params: Api.SystemManage.RoleAssignMenuParams) {
  if (import.meta.env.DEV) {
    return mockAssignRoleMenu(params) as unknown as Promise<boolean>;
  }

  return request<boolean>({
    url: '/system/role/assignMenu',
    method: 'post',
    data: params
  });
}
```

改为

```ts
/** assign permissions to role（真实接口 /role/auths/update，body { _id, auths }） */
export function fetchUpdateRoleAuths(params: { _id: string; auths: string[] }) {
  return request<boolean>({
    url: '/role/auths/update',
    method: 'post',
    data: params
  });
}
```

- [ ] **Step 4: 类型检查校验（暂不应有调用方报错，Task 3/4 再接上）**

Run: `pnpm typecheck`
Expected: PASS(本任务后 `fetchUpdateRoleAuths` 已声明;旧 `fetchAssignRoleMenu` 暂无引用,不会报错。若报"已声明未使用"属于正常,Task 4 接入后消除)

- [ ] **Step 5: 提交**

```bash
git add src/service/api/role/index.ts
git commit -m "feat(role): add fetchUpdateRoleAuths for /role/auths/update"
```

---

### Task 2: 清理 mock 中失效的权限树/分配函数

**Files:**

- Modify: `src/service/api/mock.ts`

**Interfaces:**

- 删除 `mockGetRoleMenuTree`(及专用常量 `MENU_TREE` / `ALL_MENU_IDS`)。
- 删除 `mockAssignRoleMenu`。
- 保留 mock.ts 其余函数不动。

- [ ] **Step 1: 删除 `MENU_TREE` / `ALL_MENU_IDS` / `mockGetRoleMenuTree`**

删除文件顶部以下代码(含其间的注释):

```ts
const MENU_TREE: Api.SystemManage.RoleMenuNode[] = [
  { id: 1, title: '首页', children: [] },
  {
    id: 2,
    title: '系统管理',
    children: [
      { id: 21, title: '用户管理' },
      { id: 22, title: '角色管理' },
      { id: 23, title: '菜单管理' },
      { id: 25, title: '站点管理' },
      { id: 26, title: '组别管理' },
      { id: 27, title: '客户管理' }
    ]
  }
];

const ALL_MENU_IDS = [1, 21, 22, 23, 25, 26, 27];

/** mock role permission menu tree（角色已接真实接口，主键为 MongoId 字符串；权限树为演示数据） */
export function mockGetRoleMenuTree(_roleId: string): Api.SystemManage.RoleMenuTree {
  return {
    menus: MENU_TREE,
    checkedMenuIds: [...ALL_MENU_IDS]
  };
}
```

- [ ] **Step 2: 删除 `mockAssignRoleMenu`**

删除:

```ts
/** mock assign menus to role */
export function mockAssignRoleMenu(_params: Api.SystemManage.RoleAssignMenuParams): boolean {
  return true;
}
```

- [ ] **Step 3: 确认无其他引用**

Run:

```bash
rg -n "mockGetRoleMenuTree|mockAssignRoleMenu|RoleMenuNode|RoleMenuTree|RoleAssignMenuParams" src/service
```

Expected: 仅 `src/typings/api/system-manage.d.ts` 中 `RoleMenuTree`/`RoleMenuNode`/`RoleAssignMenuParams` 的**类型声明**出现(实现引用应已全部删除);若出现任何 `.ts` 对这两个 mock 函数的 import/调用,返回 Task 1 复核。

- [ ] **Step 4: 类型检查**

Run: `pnpm typecheck`
Expected: PASS(若 `Api.SystemManage.RoleMenuNode` 等类型变成"仅声明未用",不报错;Task 5 统一清理)

- [ ] **Step 5: 提交**

```bash
git add src/service/api/mock.ts
git commit -m "refactor(role): remove obsolete permission-tree mocks"
```

---

### Task 3: 抽屉打开时按 `row.auths` 回显勾选

**Files:**

- Modify: `src/views/system-manage/role/modules/role-permission-drawer.vue`(`loadData` 函数,约 361–373 行)

**Interfaces:**

- 消费:`props.row?: Api.SystemManage.Role | null`(含 `auths?: string[]`)。
- 产出:正确初始化 `checkedIds` / `rowButtonChecks` / `rowSubMenuChecks`,供现有 `applyView` / 提交使用。
- 依赖 Task 1/2 已完成,本任务只改 `loadData`,不改提交。

- [ ] **Step 1: 重写 `loadData` 做预勾选**

将

```ts
function loadData() {
  allRows.value = getMenuPermissionTree();
  HOME_IDS.value = collectHomeIds(allRows.value);
  checkedIds.value = withHome([...allIds.value]);
  // 默认展开全部有子节点的菜单（受控展开，applyView 重建后不丢失）
  expandedKeys.value = collectExpandableIds(allRows.value);
  rowButtonChecks.value = {};
  rowSubMenuChecks.value = {};
  keyword.value = '';
  applyView();
  // 打开抽屉时展开全部（仅这一次）；之后勾选/搜索重建的数据由 vxe 按 rowid 恢复展开态
  syncTreeExpand();
}
```

改为

```ts
function loadData() {
  allRows.value = getMenuPermissionTree();
  HOME_IDS.value = collectHomeIds(allRows.value);
  // 角色已存权限码（菜单 id 转字符串 + 按钮/子模块 code），用于回显预勾选
  const authSet = new Set((props.row?.auths ?? []).map(String));

  const checked: number[] = [];
  const btnChecks: Record<number, string[]> = {};
  const subChecks: Record<number, string[]> = {};

  // 递归：菜单 id 在 authSet、或任一后代命中 → 该菜单勾选（保证父级随子级联动、提交/回显可往返）
  function walk(rows: MenuPermissionRow[]): boolean {
    return rows.some(row => {
      let matched = authSet.has(String(row.id));
      if (row.children?.length && walk(row.children)) {
        matched = true;
      }
      if (matched) {
        checked.push(row.id);
      }
      if (row.buttons.length) {
        const hit = row.buttons.filter(b => authSet.has(b.code)).map(b => b.code);
        if (hit.length) btnChecks[row.id] = hit;
      }
      if (row.subMenus.length) {
        const hit = row.subMenus.filter(s => authSet.has(s.code)).map(s => s.code);
        if (hit.length) subChecks[row.id] = hit;
      }
      return matched;
    });
  }
  walk(allRows.value);

  checkedIds.value = withHome(checked);
  rowButtonChecks.value = btnChecks;
  rowSubMenuChecks.value = subChecks;
  expandedKeys.value = collectExpandableIds(allRows.value);
  keyword.value = '';
  applyView();
  // 打开抽屉时展开全部（仅这一次）；之后勾选/搜索重建的数据由 vxe 按 rowid 恢复展开态
  syncTreeExpand();
}
```

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck`
Expected: PASS(`props.row?.auths` 为可选 `string[]`,`.map(String)` 安全;`MenuPermissionRow` 已 import)

- [ ] **Step 3: 提交**

```bash
git add src/views/system-manage/role/modules/role-permission-drawer.vue
git commit -m "feat(role): echo existing auths when opening permission drawer"
```

---

### Task 4: 提交时组装扁平 `auths` 并调真实接口

**Files:**

- Modify: `src/views/system-manage/role/modules/role-permission-drawer.vue`(import 行 + `handleSubmit`,约 5 行与 445–459 行)

**Interfaces:**

- 消费:Task 1 的 `fetchUpdateRoleAuths`;现有 `checkedIds` / `rowButtonChecks` / `rowSubMenuChecks`。
- 产出:`POST /role/auths/update` 调用成功 → 关抽屉 + `emit('submitted')`。

- [ ] **Step 1: 改 import**

将

```ts
import { fetchAssignRoleMenu } from '@/service/api/role';
```

改为

```ts
import { fetchUpdateRoleAuths } from '@/service/api/role';
```

- [ ] **Step 2: 重写 `handleSubmit`**

将

```ts
async function handleSubmit() {
  if (!props.row) return;
  submitting.value = true;
  try {
    // 收集所有菜单勾选的按钮 / 子模块权限码（去重）
    const buttonCodes = [...new Set(Object.values(rowButtonChecks.value).flat())];
    const subMenuCodes = [...new Set(Object.values(rowSubMenuChecks.value).flat())];
    await fetchAssignRoleMenu({ roleId: props.row._id, menuIds: checkedIds.value, buttonCodes, subMenuCodes });
    window.$message?.success($t('common.updateSuccess'));
    drawerVisible.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}
```

改为

```ts
async function handleSubmit() {
  if (!props.row) return;
  submitting.value = true;
  try {
    // 三套勾选状态合并为扁平 auths：菜单 id(转字符串) + 按钮码 + 子模块码，去重
    const auths = new Set<string>();
    checkedIds.value.forEach(id => auths.add(String(id)));
    Object.values(rowButtonChecks.value).forEach(codes => codes.forEach(code => auths.add(code)));
    Object.values(rowSubMenuChecks.value).forEach(codes => codes.forEach(code => auths.add(code)));

    await fetchUpdateRoleAuths({ _id: props.row._id, auths: [...auths] });
    window.$message?.success($t('common.updateSuccess'));
    drawerVisible.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}
```

- [ ] **Step 3: 类型检查**

Run: `pnpm typecheck`
Expected: PASS(无 `fetchAssignRoleMenu` 残留引用;`auths` 类型为 `string[]`,与 `fetchUpdateRoleAuths` 入参一致)

- [ ] **Step 4: Lint**

Run: `pnpm lint`
Expected: PASS(无未使用变量;`oxlint` + `eslint --fix`)

- [ ] **Step 5: 提交**

```bash
git add src/views/system-manage/role/modules/role-permission-drawer.vue
git commit -m "feat(role): submit flat auths to /role/auths/update"
```

---

### Task 5(可选): 清理失效类型声明

**Files:**

- Modify: `src/typings/api/system-manage.d.ts`

**Interfaces:**

- 仅当 `RoleAssignMenuParams` / `RoleMenuTree` / `RoleMenuNode` 确认无其他引用时执行。
- 不阻塞 Task 1–4 的功能完整性。

- [ ] **Step 1: 全仓搜索引用**

Run:

```bash
rg -n "RoleAssignMenuParams|RoleMenuTree|RoleMenuNode" src
```

Expected: 仅 `src/typings/api/system-manage.d.ts` 内出现声明;若无任何业务代码引用,继续 Step 2,否则跳过本任务。

- [ ] **Step 2: 删除类型声明**

删除 `src/typings/api/system-manage.d.ts` 中:

```ts
/** role permission tree, contains all menus and the checked menus of the role */
type RoleMenuTree = {
  menus: RoleMenuNode[];
  checkedMenuIds: number[];
};

/** role assign menu params */
type RoleAssignMenuParams = {
  /** 角色 MongoId */
  roleId: string;
  menuIds: number[];
  buttonCodes: string[];
  subMenuCodes: string[];
};
```

(以及 `RoleMenuNode` 的声明,若其仅被上述类型引用)

- [ ] **Step 3: 类型检查**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: 提交(若执行)**

```bash
git add src/typings/api/system-manage.d.ts
git commit -m "refactor(role): drop unused role-menu-tree types"
```

---

### Task 6: 全量验证

**Files:** 无新增;校验整个改动。

- [ ] **Step 1: typecheck + lint + build**

Run:

```bash
pnpm typecheck && pnpm lint && pnpm build:test
```

Expected: 三项均 PASS(`build:test` 走 `--mode test` 真实接口配置;若需 prod 可改 `pnpm build`)

- [ ] **Step 2: 人工联调(DEV 连真实后端)**

1. `pnpm dev` 启动,登录后进入「系统管理 → 角色管理」。
2. 打开某角色的「分配权限」→ 应还原其已勾选菜单/按钮/子模块(回显正确)。
3. 勾选/取消若干项后提交 → 浏览器 Network 应出现 `POST /role/auths/update`,body 形如 `{ "_id": "<角色id>", "auths": ["505","system:user:add",...] }`。
4. 重新打开同一角色 → 勾选项与提交前一致(往返一致)。
5. 首页等 `home` 菜单恒勾选且不可取消。

- [ ] **Step 3: 终态提交(若前面分步提交已足够,可跳过)**

```bash
git add -A && git commit -m "feat(role): wire permission drawer to /role/auths/update"
```
