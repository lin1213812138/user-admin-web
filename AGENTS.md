# CWMS User Admin Web — Agent Guide

> **重要规则**:
>
> 1. 每次与本 Agent 讨论的问题定位、决策、修复，必须在 `changelog/` 目录下生成单独的文档，文件名从用户提示词中提取（如 `changelog/转运项批量搜索.md`），同时将条目链接追加到 [AGENTS_CHANGELOG.md](./AGENTS_CHANGELOG.md) 中。AGENTS.md 只维护项目架构信息，不直接存储讨论记录。
> 2. **开发新功能或修复 Bug 前必须先设计**：在提出任何设计方案之前，不得编写任何代码。设计方案必须使用 `brainstorming` skill 完成，待用户确认设计后才能进入开发阶段。用户确认之前，任何实现动作（代码编写、文件创建等）都是违规操作。
>
> 兄弟项目 `user-web`（同后端 `wms-user` 的另一套前端：Element Plus + JavaScript）见 [user-web AGENTS.md](../user-web/AGENTS.md)。本仓库是它的 **Naive UI + TypeScript** 重写版，业务模块正在逐步迁移。

## 项目概览

Vue 3 + TypeScript 前端项目，WMS 出库管理的**管理端**界面（应用名 `CWMS Admin`）。后端为 `wms-user`（Node.js + Koa + MongoDB），前端直连 `/api/v1/...`。

工程底座来自 [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin) v2.2.0 模板，因此存在大量模板遗留目录（如 `packages/@sa/*`、`views/home/modules/*` 演示组件），改造时不要误删底座、也不要照搬模板写法覆盖本仓库已有约定。

---

## 技术栈

- **框架**: Vue 3.5（`<script setup lang="ts">`）
- **构建**: Vite 8
- **语言**: TypeScript 6（strict + strictNullChecks）
- **UI 库**: Naive UI 2.44
- **表格**: vxe-table + vxe-pc-ui 4.5
- **状态管理**: Pinia 3（**Setup Store 写法**）
- **路由**: Vue Router 5 + **elegant-router 0.3.8（按目录自动生成）**，history 模式
- **HTTP**: Axios，封装在内部包 `@sa/axios`（`createFlatRequest`）
- **国际化**: vue-i18n 11（zh-cn / en-us）
- **桌面端**: Tauri 2（`src-tauri/`）
- **图表**: ECharts 6
- **样式**: UnoCSS 66（presetWind3 + presetSoybeanAdmin）+ SCSS
- **包管理**: pnpm workspace monorepo（**禁止 npm / yarn**）

环境要求：Node.js >= 20.19.0，pnpm >= 10.5.0。

---

## 常用命令

| 命令                                                | 说明                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `pnpm i`                                            | 首次安装依赖。monorepo 架构，只能用 pnpm。                                                                             |
| `pnpm dev`                                          | 启动开发服务器（`--mode test`，端口 9527）。会触发 elegant-router 重新生成路由文件。                                   |
| `pnpm dev:prod`                                     | 以 prod 环境配置启动开发服务器。                                                                                       |
| `pnpm build`                                        | 生产构建（`--mode prod`）。                                                                                            |
| `pnpm build:test`                                   | 测试环境构建（`--mode test`）。                                                                                        |
| `pnpm preview`                                      | 预览构建产物（端口 9725）。                                                                                            |
| `pnpm typecheck`                                    | `vue-tsc --noEmit --skipLibCheck` 类型检查。改完代码必跑。                                                             |
| `pnpm lint`                                         | `oxlint --fix && eslint --fix .`。                                                                                     |
| `pnpm fmt`                                          | oxfmt 格式化。提交前必须真正执行过，否则 pre-commit 的 `git diff --exit-code` 会拒绝提交。                             |
| `pnpm gen-route`                                    | 手动重新生成路由文件（等价于 `pnpm dev` 触发的那一次生成）。                                                           |
| `pnpm commit` / `pnpm commit:zh`                    | 交互式生成 Conventional Commits 提交信息。**不要直接 `git commit`**，`commit-msg` 钩子由 `sa git-commit-verify` 校验。 |
| `pnpm dev:tauri` / `pnpm build:tauri`               | Tauri 桌面端开发 / 打包。                                                                                              |
| `pnpm tauri-icon`                                   | 从 `public/logo.png` 重新生成 Tauri 图标。                                                                             |
| `pnpm cleanup` / `pnpm release` / `pnpm update-pkg` | 清理依赖与产物 / 发版 / 批量更新依赖。                                                                                 |

**本仓库没有测试框架，也没有 test 脚本。** 验证手段是 `pnpm typecheck` + `pnpm lint` + `pnpm build`，不要去找单测命令或臆造测试入口。

pre-commit 钩子（`simple-git-hooks`）依次执行：`typecheck → lint → fmt → git diff --exit-code`。

---

## 目录结构

```
user-admin-web/
├── build/                      # Vite 配置：config/(index|proxy|time)、plugins/(router|unocss|unplugin|html|devtools)
├── packages/                   # pnpm workspace 内部包 @sa/*（axios / color / hooks / materials / scripts / uno-preset / utils）
├── src/
│   ├── assets/                 # 静态资源（svg-icon / 图片）
│   ├── components/             # 通用组件（自动按需引入，无需注册）
│   │   ├── Table/              #   通用表格：use-vxe-table.ts + table.vue + table-column-config.vue
│   │   ├── Form/               #   声明式表单：index.vue + form-config.ts
│   │   ├── advanced/           #   table-column-setting、table-header-operation
│   │   ├── common/             #   drawer、app-provider、dark-mode-container、lang-switch、link ...
│   │   └── custom/             #   button-icon、svg-icon、better-scroll、count-to ...
│   ├── constants/              # app / common / reg（表单校验正则）
│   ├── enum/                   # SetupStoreId 等枚举
│   ├── hooks/
│   │   ├── common/             #   router / table / form / icon / echarts
│   │   └── business/           #   auth / captcha
│   ├── layouts/                # base-layout、blank-layout + modules/(header|sider|menu|tab|content|search|...)
│   ├── locales/                # langs/zh-cn.ts、langs/en-us.ts、naive.ts、dayjs.ts
│   ├── plugins/                # loading / nprogress / iconify / dayjs 等插件安装
│   ├── router/
│   │   ├── elegant/            #   【自动生成，禁止手改】routes.ts / imports.ts / transform.ts
│   │   ├── guard/              #   【手写】index.ts / route.ts / progress.ts / title.ts
│   │   └── routes/             #   【手写】index.ts（customRoutes + createStaticRoutes）、builtin.ts
│   ├── service/
│   │   ├── api/                #   auth / route / system-manage / mock / index
│   │   └── request/            #   index.ts（request、demoRequest）、shared.ts、type.ts
│   ├── store/modules/          # app / auth / route / tab / theme（每个目录 index.ts + shared.ts）
│   ├── styles/                 # 全局 scss / css
│   ├── theme/                  # settings.ts（默认主题）、vars.ts、preset/
│   ├── typings/                # 全局命名空间声明（app / common / router / api / storage / union-key ...）
│   ├── utils/                  # storage / service / icon / common / agent / crypto
│   └── views/
│       ├── _builtin/           #   login / 403 / 404 / 500 / iframe-page
│       ├── home/               #   首页（modules/ 为演示子组件）
│       └── system-manage/      #   user / role / menu / dept
├── src-tauri/                  # Tauri Rust 工程（构建产物无需关注）
├── changelog/                  # Agent 讨论记录（见顶部规则 1）
├── .env / .env.test / .env.prod
├── uno.config.ts / vite.config.ts / tsconfig.json / eslint.config.js / .oxfmtrc.json
```

路径别名：`@/*` → `./src/*`，`~/*` → 项目根目录。

---

## 核心组件架构

### Table — 通用表格（`useVxeTable` + `Table`）

与兄弟项目 user-web 的 `NTable` 不同，**本仓库是「组合式函数 + 受控组件」两层**：`useVxeTable` 负责取数/分页/列状态，`<Table>` 只负责渲染。

```ts
const { data, loading, empty, columnConfigs, columns, pagination, getData, resetColumns, persistColumns } = useVxeTable<
  Api.SystemManage.UserList,
  UserItem
>({
  api: ({ current, size }) => fetchGetUserList({ current, size }) as Promise<Api.SystemManage.UserList>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      { key: 'userName', title: $t('page.manage.user.userName'), type: 'detail', visible: true, sortable: false },
      {
        key: 'status',
        title: $t('page.manage.user.status'),
        type: 'status',
        visible: true,
        width: 100,
        fixed: 'right',
        sortable: false,
        align: 'center'
      }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'system-manage-user' // 不传则不持久化列配置
});
```

- 列 `type`：`'status'` 自动渲染启用/禁用 `NTag`（`activeValue` 默认 `'1'`）；`'detail'` 自动渲染可点击复制的文本。两者都**无需业务写插槽**。
- 自定义单元格：`<template #列名="{ row }">`，插槽名即 `col.key`。

```vue
<Table
  :columns="columns"
  :data="data"
  :loading="loading"
  :pagination="pagination"
  :show-seq="true"
  :show-checkbox="true"
  :show-action="true"
  @refresh="getData"
  @page-change="handlePageChange"
  @selection-change="handleSelectionChange"
  @detail="handleDetail"
>
  <template #operation-left>  <!-- 表格上方左侧按钮区，插槽暴露 refresh -->
  <template #operation-right> <!-- 右侧：列设置 / 刷新 -->
  <template #action="{ row }"><!-- 操作列 -->
</Table>
```

其它 props：`border` / `stripe` / `actionTitle` / `actionWidth` / `actionAlign` / `height`。

### TableColumnConfig — 列配置持久化

```vue
<TableColumnConfig v-model:visible="configVisible" v-model:columns="columnConfigs" @confirm="persistColumns" />
```

列配置写入裸 `localStorage['vxe-table-column:<cacheKey>']`，**不走 `localStg` / `VITE_STORAGE_PREFIX`**（本项目唯一的存储例外）。`resetColumns()` 恢复默认并清除缓存。

### Form — 声明式表单（`FormWrap`）

`src/components/Form/index.vue`（组件名 `FormWrap`）+ `FormItemConfig[]` 配置驱动，24 栅格布局，自动为 `required: true` 的项生成必填规则。

```ts
const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'userName',
    label: $t('page.manage.user.userName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: '...'
  },
  {
    key: 'status',
    label: $t('page.manage.user.status'),
    type: 'switch',
    span: 24,
    checkedText: '启用',
    uncheckedText: '禁用'
  }
]);
```

```vue
<NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" :disabled="isDetail" />
```

- 支持 `input` / `textarea` / `number` / `switch` / `select`，或用 `slot: '<key>'` 走具名插槽自定义。
- 暴露 `validate(): Promise<boolean>` 与 `restoreValidation()`；提交前 `if (!(await formRef.value?.validate())) return;`。
- 不传 `items` 时退化为普通 `NForm` 容器（`<slot />`）。

### 表单的另一条路径（登录等页面）

`views/_builtin/login` 等页面用 naive-ui 原生 `NForm` + `useFormRules()` / `useNaiveForm()`（`src/hooks/common/form.ts`），正则常量在 `src/constants/reg.ts`。**新业务表单优先用 `FormWrap`**，不要在同一页面混用两套写法。

### Drawer — 抽屉

`@/components/common/drawer.vue`，Props：`show`（`v-model:show`）、`title`、`loading`、`footer`；事件 `@submit`。子抽屉通过 `emit('submitted')` 通知父级刷新列表（`getData()`）。

---

## 数据流模式

```
页面 views/<模块>/<页面>/index.vue
       ↓  useVxeTable({ api, transform })
service/api/<模块>.ts  ←── fetchXxx()（命名以 fetch 开头）
       ↓  request（@sa/axios createFlatRequest）
后端 /api/v1/...   （DEV 下 system-manage 走 service/api/mock.ts 本地 mock）
       ↓
store/modules/*（Pinia Setup Store）→ 视图渲染
```

- 类型声明在 `src/typings/api/*.d.ts` 的 `Api.<Module>` 命名空间下，无需 import。
- ⚠️ **两套返回结构并存，极易踩坑**：
  - `auth.ts` / `route.ts` 走真实 `request`，返回 `{ data, error }`，解构使用 `const { data, error } = await fetchLogin(...)`。
  - `system-manage.ts` 在 `import.meta.env.DEV` 下直接返回 `mock.ts` 的值（经 `as unknown as Promise<T>` 强转），**没有 `{ data, error }` 包裹**，调用方直接 `await fetchGetUserList(params)` 拿裸数据。
  - 新增接口时必须明确跟随哪一种，并在函数上方注明。

---

## 接口与后端约定

- **会话是 httpOnly Cookie**，登录接口**不返回 token**。`request` 以 `withCredentials: true` 创建；`authStore.token` 实际存的是 `userId` 标记，仅用于让 `isLogin` 与路由守卫跨刷新可用。
- **响应体兼容双形态**（`src/service/request/index.ts`）：
  - `wms-user`：`{ errcode: 0, errmsg: 'OK', ret: { ... } }`
  - mock / apifox：`{ code: '0000', msg, data }`
  - `transform` 取 `body.data ?? body.ret`；`isBackendSuccess` 判定 `errcode === 0` 或 `code === VITE_SERVICE_SUCCESS_CODE`；错误文案取 `errmsg` / `msg`。
- **登录密码加密**：`MD5(MD5(明文) + 明文)`，见 `src/utils/crypto.ts` 的 `md5()`。
- 请求固定携带 `apifoxToken` 头（apifox mock 用）。
- HTTP 401 且本地存在 token → `authStore.resetStore()`。当前**未实现 refreshToken 无感刷新**（`VITE_SERVICE_EXPIRED_TOKEN_CODES` 暂未生效）。
- 错误码语义见 `.env`：`VITE_SERVICE_LOGOUT_CODES`（直接登出）、`VITE_SERVICE_MODAL_LOGOUT_CODES`（弹窗后登出）。
- 全局提示用 `window.$message` / `window.$dialog` / `window.$notification`，可选链调用。

---

## 路由约定

- **history 模式**（`VITE_ROUTER_HISTORY_MODE=history`）。
- **路由由 `src/views/` 目录结构自动生成，禁止手写路由表，禁止手改 `src/router/elegant/**`**（`routes.ts`/`imports.ts`/`transform.ts`，以及 `src/typings/elegant-router.d.ts`、`src/typings/components.d.ts`）。
- 映射规则：层级分隔符为下划线 `_`（`a/b/c` → `a_b_c`）；单层路由 name 不含 `_`；`[param]` 为动态段；`_builtin` 为保留目录（前缀被剥离，如 `views/_builtin/403/index.vue` → name `403`）。
- 需要覆盖 `meta`（icon / order / roles / hideInMenu / keepAlive 等）写到 `src/router/routes/index.ts` 的 `customRoutes` 数组，按 `name` 合并；layout 映射在 `build/plugins/router.ts`。
- 新增页面 SOP：建 `views/<模块>/<页面>/index.vue`（页面私有子组件放同级 `modules/`）→ `pnpm gen-route`（或 `pnpm dev`）→ 按需补 `customRoutes` → 补 `zh-cn.ts` / `en-us.ts` 的 `route.*` 文案。
- 守卫注册顺序（`src/router/guard/index.ts`）：`createProgressGuard` → `createRouteGuard` → `createDocumentTitleGuard`。

---

## 权限模式

- 当前为**静态路由模式**（`VITE_AUTH_ROUTE_MODE=static`）。
- 链路：`guard/route.ts` → `routeStore.initConstantRoute()` / `initAuthRoute()` → `filterAuthRoutesByRoles(staticAuthRoutes, authStore.userInfo.roles)`（`store/modules/route/shared.ts`）。
- `userInfo.roles` / `userInfo.buttons` 由后端 `authMap` 的键 + `showOps` 中的字符串项推导（`authStore.applyUser()`）。
- 超管角色 `VITE_STATIC_SUPER_ROLE=R_SUPER`：`isStaticSuper` 为 true 时跳过过滤，全量路由。
- 路由 `meta.roles` 为空 → 登录后即可访问；非空则需命中任一角色，否则跳 `403`。
- ⚠️ 与 user-web 不同：**本仓库尚未提供 `v-btn-auth` 指令 / `useBtnAuth` hook**。`userInfo.buttons` 已就绪但未接入任何指令，按钮级权限需要自行实现（实现前按顶部规则 2 先出设计）。

---

## 状态管理（Pinia）

- 一律 **Setup Store**：`defineStore(SetupStoreId.Xxx, () => { ... })`，id 取 `src/enum/index.ts` 的 `SetupStoreId` 枚举，禁止硬编码字符串。
- 目录约定：`store/modules/<模块>/index.ts`（主逻辑）+ 同目录 `shared.ts`（纯函数 / 存储读写）。
- 现有模块：`app`、`auth`、`route`、`tab`、`theme`。
- 跨 store 直接 `useXxxStore()`，注意循环依赖（`auth` ↔ `route` ↔ `tab` 已存在相互引用，新增时谨慎）。

---

## 国际化

- 语言包：`src/locales/langs/zh-cn.ts`（默认）、`src/locales/langs/en-us.ts`；聚合在 `src/locales/locale.ts`。
- 使用 `import { $t } from '@/locales'`，`$t('key.path')` 具备类型提示。
- Naive UI 组件库文案：`src/locales/naive.ts`；dayjs 本地化：`src/locales/dayjs.ts`。
- **新增文案必须 zh-cn / en-us 同步**，否则另一语言缺失且 TS 报错。
- 路由菜单文案 key 约定 `route.<routeKey>`；页面文案 key 约定 `page.<module>.<page>.*`。

---

## 代码规范

- 格式化用 `pnpm fmt`（oxfmt），**不要手动调格式**：2 空格缩进、单引号、打印宽度 120、无尾随逗号、箭头函数单参省略括号（`item => ...`）。配置见 `.oxfmtrc.json`。
- 命名：组件文件与目录 kebab-case；组件使用 PascalCase；组合式函数 `useXxx`；接口函数 `fetchXxx`；store `useXxxStore`。
- 注释用**英文 JSDoc**（`/** get user list */`），关键逻辑用英文说明「为什么」，不写无意义注释、不输出大段中文注释。
- TypeScript：开启 strict，**禁止 `any`**（必要时 `unknown` + 类型收窄）。
- 样式优先 UnoCSS 原子类（暗黑模式靠 `.dark` class），避免内联 style；容器典型写法 `class="h-full w-full p-16px"`。
- 优先用 `@/*` 别名导入。
- 本地存储统一走 `src/utils/storage.ts` 的 `localStg` / `sessionStg`（列配置缓存例外，见上文）。

**禁止事项**

1. 禁止手动编辑 `src/router/elegant/**`、`src/typings/elegant-router.d.ts`、`src/typings/components.d.ts`。
2. 禁止手写路由表代替 views 目录约定。
3. 禁止使用 npm / yarn，只用 pnpm。
4. 禁止在业务代码中使用 `any`。
5. 禁止在组件中直接调用 axios，统一走 `@/service/request` + `@/service/api`。
6. 禁止绕过 `useVxeTable` 自行封装表格。
7. 禁止硬编码文案，一律走 i18n（zh-cn / en-us 同步）。
8. 禁止硬编码 Pinia store id。
9. 禁止在业务代码中写死后端地址。
10. 不要动 `packages/` 下 `@sa/*` 内部包，除非任务明确要求；业务改动应落在 `src/`。

---

## 环境变量

| 文件        | 用途                                                                           |
| ----------- | ------------------------------------------------------------------------------ |
| `.env`      | 公共配置（base url、应用名、图标前缀、路由模式、服务码、存储前缀等）           |
| `.env.test` | 测试环境后端地址，`pnpm dev` 默认使用（当前指向本地 `http://localhost:10010`） |
| `.env.prod` | 生产环境后端地址，`pnpm build` 使用（⚠️ 当前仍指向 apifox mock，上线前必改）   |

关键变量：`VITE_BASE_URL`（子目录部署必须以 `/` 结尾）、`VITE_AUTH_ROUTE_MODE`、`VITE_ROUTE_HOME`、`VITE_ROUTER_HISTORY_MODE`、`VITE_HTTP_PROXY`、`VITE_STATIC_SUPER_ROLE`、`VITE_STORAGE_PREFIX`、`VITE_SOURCE_MAP`、`VITE_PROXY_LOG`、`VITE_AUTOMATICALLY_DETECT_UPDATE`、`VITE_DEVTOOLS_LAUNCH_EDITOR`。

新增自定义 `VITE_*` 变量需在 `src/typings/vite-env.d.ts` 的 `ImportMetaEnv` 中补声明。

调试提示：`VITE_HTTP_PROXY=Y` 才启用 dev 代理（规则在 `build/config/proxy.ts`），`VITE_PROXY_LOG=Y` 会在终端打印真实请求地址；登录异常优先查 Cookie 与 `/api/v1/user/session/get`。

---

## 关键页面索引

| 模块     | 页面路径                         | 说明                                                                  |
| -------- | -------------------------------- | --------------------------------------------------------------------- |
| 首页     | `home/`                          | 模板演示页（card-data / line-chart / pie-chart 等），业务接入后可替换 |
| 登录     | `_builtin/login/`                | pwd-login / code-login / register / reset-pwd，含 `useFormRules` 校验 |
| 用户管理 | `system-manage/user/`            | `useVxeTable` + 列配置 + `user-operate-drawer`（新增/编辑/详情）      |
| 角色管理 | `system-manage/role/`            | `role-operate-drawer`、`role-permission-drawer`（菜单权限树）         |
| 菜单管理 | `system-manage/menu/`            | 菜单维护                                                              |
| 部门管理 | `system-manage/dept/`            | 部门维护                                                              |
| 异常页   | `_builtin/403`、`404`、`500`     | 内置页，`meta.constant` 自动为 true                                   |
| 内嵌页   | `_builtin/iframe-page/[url].vue` | 动态段路由示例                                                        |

---

## 讨论记录索引

所有 Agent 讨论记录见 [AGENTS_CHANGELOG.md](./AGENTS_CHANGELOG.md)。
