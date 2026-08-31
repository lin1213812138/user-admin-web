# AGENTS.md

本文件为 AI 编码助手（CodeBuddy / Claude Code / Cursor 等）在此仓库中工作的约定与操作手册。
**在动手写代码前请先完整阅读本文件，尤其是「禁止事项」与「核心架构约定」两节。**

---

## 1. 项目概述

本项目是 **CWMS Admin** 前端，基于 [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin) v2.2.0 模板二次开发
（`package.json` 中的 `name` 仍为 `soybean-admin`，属正常现象，不要修改）。

- **定位**：中后台管理系统 Web 端（同时具备 Tauri 桌面端构建能力）
- **应用名**：`CWMS Admin`（由 `VITE_APP_TITLE` 控制）

### 技术栈

| 领域     | 选型                                             | 版本      |
| -------- | ------------------------------------------------ | --------- |
| 框架     | Vue 3（`<script setup>` + TS）                   | 3.5       |
| 构建     | Vite                                             | 8         |
| 语言     | TypeScript（严格模式）                           | 6         |
| 状态管理 | Pinia（**Setup Store 写法**）                    | 3         |
| 路由     | vue-router + **elegant-router（自动生成）**      | 5 / 0.3.8 |
| UI 组件  | Naive UI                                         | 2.44      |
| 表格     | vxe-table + vxe-pc-ui                            | 4.5       |
| 样式     | UnoCSS（presetWind3 + presetSoybeanAdmin）+ SCSS | 66        |
| 请求     | Axios（封装在 `@sa/axios`）                      | -         |
| 国际化   | vue-i18n                                         | 11        |
| 包管理   | **pnpm workspace monorepo**                      | ≥10.5     |
| 桌面端   | Tauri（`src-tauri/`，Rust）                      | 2         |

### 环境要求

- Node.js >= 20.19.0（建议 20.19.0+）
- pnpm >= 10.5.0
- **只能使用 pnpm**，禁止用 npm / yarn 安装依赖（monorepo 架构限制）

---

## 2. 常用命令

```bash
pnpm i              # 安装依赖（首次）
pnpm dev            # 启动开发服务器（--mode test，端口 9527）
pnpm dev:prod       # 以 prod 环境配置启动开发服务器
pnpm build          # 生产构建（--mode prod）
pnpm build:test     # 测试环境构建
pnpm preview        # 预览构建产物（端口 9725）
pnpm typecheck      # vue-tsc 类型检查（--noEmit）
pnpm lint           # oxlint --fix && eslint --fix .
pnpm fmt            # oxfmt 格式化
pnpm gen-route      # 手动重新生成路由文件
pnpm commit         # 生成符合 Conventional Commits 的提交信息
pnpm commit:zh      # 同上，中文提示
pnpm cleanup        # 清理依赖/构建产物
pnpm release        # 发布版本
pnpm update-pkg     # 批量更新依赖
```

### Tauri 桌面端

```bash
pnpm dev:tauri      # 桌面端开发模式
pnpm build:tauri    # 桌面端打包
```

### 提交前自检（务必执行）

```bash
pnpm typecheck && pnpm lint && pnpm fmt
```

> `simple-git-hooks` 的 `pre-commit` 会自动跑 `typecheck → lint → fmt → git diff --exit-code`，
> 若格式化后有残留 diff，提交会被拒绝。所以格式化必须真正执行过。

---

## 3. 目录结构

```
user-admin-web/
├── build/                  # Vite 构建配置
│   ├── config/             #   index.ts（入口）/ proxy.ts（代理）/ time.ts（构建时间）
│   └── plugins/            #   index.ts / router.ts / unocss.ts / unplugin.ts / html.ts / devtools.ts
├── packages/               # pnpm workspace 内部包（@sa/*）
│   ├── axios/              #   请求库封装（createRequest / createFlatRequest）
│   ├── color/              #   颜色处理
│   ├── hooks/              #   通用 hooks（useLoading、useBoolean 等）
│   ├── materials/          #   通用物料组件
│   ├── scripts/            #   CLI 工具（sa 命令：git-commit / gen-route / release / cleanup）
│   ├── uno-preset/         #   UnoCSS 预设 presetSoybeanAdmin
│   └── utils/              #   通用工具函数
├── src/
│   ├── assets/             # 静态资源（svg / 图片）
│   ├── components/         # 全局组件
│   │   ├── advanced/       #   复合业务组件（table-column-setting、table-header-operation）
│   │   ├── common/         #   通用基础组件（app-provider、dark-mode-container、lang-switch...）
│   │   ├── custom/         #   自定义封装组件（button-icon、svg-icon、better-scroll、count-to...）
│   │   ├── Form/           #   表单封装（index.vue + form-config.ts）
│   │   └── Table/          #   vxe-table 封装（use-vxe-table.ts + table.vue + table-column-config.vue）
│   ├── constants/          # 常量（app.ts / common.ts / reg.ts）
│   ├── enum/               # 枚举（index.ts，含 SetupStoreId 等）
│   ├── hooks/              # 组合式函数
│   │   ├── common/         #   router.ts / table.ts / form.ts / icon.ts / echarts.ts
│   │   └── business/       #   auth.ts / captcha.ts
│   ├── layouts/            # 布局
│   │   ├── base-layout/    #   主布局（base）
│   │   ├── blank-layout/   #   空白布局（blank）
│   │   └── modules/        #   global-header / global-sider / global-menu / global-tab /
│   │                       #   global-content / global-footer / global-logo / global-search /
│   │                       #   global-breadcrumb / theme-drawer
│   ├── locales/            # 国际化（langs/zh-cn.ts、langs/en-us.ts、locale.ts、naive.ts、dayjs.ts）
│   ├── plugins/            # Vue 插件安装（loading / nprogress / iconify / dayjs 等）
│   ├── router/             # 路由（详见第 4.1 节）
│   │   ├── elegant/        #   【自动生成，禁止手改】routes.ts / imports.ts / transform.ts
│   │   ├── guard/          #   【手写】index.ts / route.ts / progress.ts / title.ts
│   │   ├── routes/         #   【手写】index.ts（静态路由 + customRoutes）/ builtin.ts
│   │   └── index.ts
│   ├── service/            # 接口层
│   │   ├── api/            #   按业务模块拆分（auth.ts / route.ts / system-manage.ts / mock.ts / index.ts）
│   │   └── request/        #   index.ts（request、demoRequest）/ shared.ts / type.ts
│   ├── store/              # Pinia
│   │   ├── modules/        #   app / auth / route / tab / theme（每个目录 index.ts + shared.ts）
│   │   ├── plugins/        #   store 插件
│   │   └── index.ts
│   ├── styles/             # 全局样式（scss / css）
│   ├── theme/              # 主题（settings.ts 默认配置、vars.ts 主题变量、preset/）
│   ├── typings/            # 类型声明
│   │   ├── api/            #   auth.d.ts / common.d.ts / route.d.ts / system-manage.d.ts
│   │   ├── app.d.ts        #   App.* 命名空间
│   │   ├── common.d.ts     #   Common.* 命名空间
│   │   ├── router.d.ts     #   RouteMeta 字段定义
│   │   ├── storage.d.ts    #   本地存储类型
│   │   ├── union-key.d.ts  #   UnionKey.* 命名空间
│   │   ├── global.d.ts     #   全局挂载（window.$message 等）
│   │   ├── components.d.ts #   【自动生成】unplugin-vue-components
│   │   └── elegant-router.d.ts # 【自动生成】路由 key 联合类型
│   ├── utils/              # 工具（storage.ts / service.ts / icon.ts / common.ts / agent.ts）
│   ├── views/              # 页面（路由由目录结构自动生成）
│   │   ├── _builtin/       #   内置页：login / 403 / 404 / 500 / iframe-page
│   │   ├── home/           #   首页（modules/ 存放子组件）
│   │   └── system-manage/  #   系统管理：user / role / menu / dept
│   ├── App.vue
│   └── main.ts
├── src-tauri/              # Tauri Rust 工程
├── .env / .env.test / .env.prod  # 环境变量
├── uno.config.ts           # UnoCSS 配置
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TS 配置（别名 @ → src，~ → 根目录）
└── eslint.config.js        # ESLint（@soybeanjs/eslint-config-vue）
```

### 路径别名

| 别名  | 指向       |
| ----- | ---------- |
| `@/*` | `./src/*`  |
| `~/*` | 项目根目录 |

---

## 4. 核心架构约定

### 4.1 路由（elegant-router 自动生成）

**核心规则：路由由 `src/views/` 下的目录结构自动生成，不要手写路由表。**

生成后的文件（**禁止手动编辑**，文件头有 `/* eslint-disable */` / `// Generated by elegant-router`）：

- `src/router/elegant/routes.ts`
- `src/router/elegant/imports.ts`
- `src/router/elegant/transform.ts`
- `src/typings/elegant-router.d.ts`
- `src/typings/components.d.ts`

（这些路径已在 `.oxfmtrc.json` 的 `ignorePatterns` 中列出。）

#### 文件 → 路由映射

| views 中的文件                         | 生成的 name / path                                                 |
| -------------------------------------- | ------------------------------------------------------------------ |
| `views/home/index.vue`                 | `home` / `/home`（单层路由，component 为 `layout.base$view.home`） |
| `views/system-manage/user/index.vue`   | `system-manage_user` / `/system-manage/user`                       |
| `views/_builtin/403/index.vue`         | `403` / `/403`（`_builtin` 前缀被剥离）                            |
| `views/_builtin/iframe-page/[url].vue` | `iframe-page` / `/iframe-page/:url`（`[param]` 为动态段）          |

- 层级分隔符为**下划线 `_`**：`a/b/c` → `a_b_c`
- 单层路由 name 不含 `_`，component 写成 `layout.xxx$view.yyy`
- 有子路由时，父级只写 `layout.base`，并自动 redirect 到第一个子路由
- `_builtin` 是保留目录名

#### 需要手改的地方

1. **新增 layout / 修改 layout 映射** → 改 `build/plugins/router.ts` 的 `layouts` 字段：

```ts
ElegantVueRouter({
  layouts: {
    base: 'src/layouts/base-layout/index.vue',
    blank: 'src/layouts/blank-layout/index.vue'
  },
  routePathTransformer(routeName, routePath) {
    /* login 等特殊路径改写 */
  },
  onRouteMetaGen(routeName) {
    /* 生成默认 meta：title + i18nKey；login/403/404/500 自动 constant: true */
  }
});
```

2. **自定义路由 meta**（icon / order / roles / hideInMenu / keepAlive 等）→ 写到
   `src/router/routes/index.ts` 的 `customRoutes: CustomRoute[]` 数组中，按 `name` 覆盖合并。

   ⚠️ **禁止直接修改 `src/router/elegant/*.ts` 来加 icon 等 meta**，会被下次生成覆盖。

3. **meta 字段的完整定义** 在 `src/typings/router.d.ts` 的 `RouteMeta` 接口：
   `title / i18nKey / roles / keepAlive / constant / icon / localIcon / iconFontSize / order /
href / hideInMenu / activeMenu / multiTab / fixedIndexInTab / query`

#### 路由模式

`VITE_AUTH_ROUTE_MODE=static`（当前配置）表示前端静态路由，`src/router/routes/index.ts` 的
`createStaticRoutes()` 按 `meta.constant` 拆分为 `constantRoutes` 与 `authRoutes`。

#### 新增页面 SOP

1. 在 `src/views/<模块>/<页面>/index.vue` 创建页面（页面私有子组件放同级 `modules/` 目录）
2. 运行 `pnpm dev`（会触发 elegant-router 重新生成）或手动 `pnpm gen-route`
3. 如需图标/排序等 meta，在 `src/router/routes/index.ts` 的 `customRoutes` 中追加
4. 如需菜单标题文案，在 `src/locales/langs/zh-cn.ts` 与 `en-us.ts` 的 `route.*` 下补充

#### 路由守卫

`src/router/guard/index.ts` 按序注册：`createProgressGuard`（NProgress）→
`createRouteGuard`（鉴权 + 动态路由初始化）→ `createDocumentTitleGuard`（标题 i18n）。
新增守卫在此处注册。

---

### 4.2 状态管理（Pinia Setup Store）

- **一律使用 Setup Store 写法**（`defineStore(id, () => { ... })`），不要用 Options Store。
- store id 统一取自 `src/enum/index.ts` 的 `SetupStoreId` 枚举，不要硬编码字符串。
- 目录约定：`src/store/modules/<模块>/index.ts`（主逻辑）+ 同目录 `shared.ts`（可复用纯函数 / 存储读写）。
- 现有模块：`app`、`auth`、`route`、`tab`、`theme`。
- 跨 store 调用直接 `useXxxStore()` 引入，注意避免循环依赖。

标准写法示例：

```ts
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { SetupStoreId } from '@/enum';

export const useXxxStore = defineStore(SetupStoreId.Xxx, () => {
  const count = ref(0);
  const double = computed(() => count.value * 2);

  function resetStore() {
    count.value = 0;
  }

  return { count, double, resetStore };
});
```

---

### 4.3 请求层

- 实例定义在 `src/service/request/index.ts`：
  - `request` —— 主后端（`@sa/axios` 的 `createFlatRequest`，响应直接返回 `data`，无需层层 `.data`）
  - `demoRequest` —— 第三方 demo 服务（`createRequest`）
- 辅助逻辑放 `shared.ts`（token 拼接、无感刷新、错误提示），类型放 `type.ts`。
- 业务接口按模块放在 `src/service/api/*.ts`，并统一在 `src/service/api/index.ts` 中导出。
- 接口类型声明在 `src/typings/api/*.d.ts` 的 `Api.Xxx` 命名空间下。

#### 新增接口 SOP

1. 在 `src/typings/api/<模块>.d.ts` 中声明请求/响应类型（`Api.<Module>.xxx`）
2. 在 `src/service/api/<模块>.ts` 中新增函数，命名以 `fetch` 开头：

```ts
import { request } from '../request';

/** get user list */
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request<Api.SystemManage.UserList>({
    url: '/system/user/list',
    method: 'post',
    data: params
  });
}
```

3. 在 `src/service/api/index.ts` 中导出

> 现有代码在 `import.meta.env.DEV` 下会走 `src/service/api/mock.ts` 的本地 mock，
> 新增接口时请沿用该模式（若后端尚未就绪）。

#### 后端约定码（见 `.env`）

| 变量                               | 含义                       |
| ---------------------------------- | -------------------------- |
| `VITE_SERVICE_SUCCESS_CODE=0000`   | 业务成功码                 |
| `VITE_SERVICE_LOGOUT_CODES`        | 直接登出                   |
| `VITE_SERVICE_MODAL_LOGOUT_CODES`  | 弹窗提示后登出             |
| `VITE_SERVICE_EXPIRED_TOKEN_CODES` | token 过期，触发刷新并重试 |

---

### 4.4 类型系统

全局类型通过**命名空间**声明，无需 import 即可使用：

| 命名空间     | 位置                                          | 用途                                                          |
| ------------ | --------------------------------------------- | ------------------------------------------------------------- |
| `App.*`      | `src/typings/app.d.ts`                        | 应用级类型（含 `App.Theme.*`、`App.I18n.*`、`App.Service.*`） |
| `Api.*`      | `src/typings/api/*.d.ts`                      | 接口请求/响应类型                                             |
| `Common.*`   | `src/typings/common.d.ts`                     | 通用类型（如 `Common.EnableStatus`）                          |
| `UnionKey.*` | `src/typings/union-key.d.ts`                  | 联合 key（如 `UnionKey.LoginModule`）                         |
| `RouteKey`   | `src/typings/elegant-router.d.ts`（自动生成） | 路由名联合类型                                                |

新增共享类型时**优先扩展示有命名空间**，不要新建散落的 `.d.ts`。

---

### 4.5 国际化

- 语言包：`src/locales/langs/zh-cn.ts`（默认语言）、`src/locales/langs/en-us.ts`
- 聚合：`src/locales/locale.ts` → `src/locales/index.ts`
- 在组件/ts 中使用 `import { $t } from '@/locales'`，`$t('key.path')` 具备类型提示（key 类型由语言包推导）
- Naive UI 组件库文案映射：`src/locales/naive.ts`；dayjs 本地化：`src/locales/dayjs.ts`
- **新增文案时必须同时补 `zh-cn.ts` 和 `en-us.ts`**，否则另一语言会缺失且 TS 可能报错
- 路由菜单文案 key 约定为 `route.<routeKey>`

---

### 4.6 主题与样式

- 默认主题配置：`src/theme/settings.ts`（`themeSettings` 为默认值，`overrideThemeSettings` 用于版本升级覆盖）
- 主题变量：`src/theme/vars.ts`（注入 UnoCSS theme）
- UnoCSS 配置：`uno.config.ts`（presetWind3 + presetSoybeanAdmin，shortcut `card-wrapper`）
- 全局 SCSS 变量/混合自动注入：`src/styles/scss/global.scss`（通过 vite `css.preprocessorOptions.scss.additionalData`）
- **样式优先用 UnoCSS 原子类**，暗黑模式通过 `.dark` class 切换；避免内联 style 与大量手写 CSS
- 图标：Iconify（`@iconify/vue`）+ 本地 svg（`src/assets/svg-icon`，组件 `SvgIcon`）；
  前缀由 `VITE_ICON_PREFIX` / `VITE_ICON_LOCAL_PREFIX` 控制
- 典型容器类名：`class="h-full w-full p-16px"`（注意 UnoCSS 中 16px 写作 `p-16px`）

---

### 4.7 表格与表单封装

**表格**：统一使用 `src/components/Table` 的 `useVxeTable`（基于 vxe-table 封装），
已内置分页、loading、列显隐配置、列持久化（`cacheKey`）。典型用法：

```ts
const { data, loading, columns, pagination, getData, persistColumns } = useVxeTable<
  Api.SystemManage.UserList,
  UserItem
>({
  api: ({ current, size }) => fetchGetUserList({ current, size }) as Promise<Api.SystemManage.UserList>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [{ key: 'userName', title: $t('page.manage.user.userName'), visible: true, sortable: false }] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'system-manage-user'
});
```

> 不要绕过 `useVxeTable` 直接引入 vxe-table 写页面，以免丢失统一的列配置与持久化能力。

**表单**：使用 `src/components/Form`（`index.vue` + `form-config.ts`）与
`src/hooks/common/form.ts` 的组合式封装。

---

## 5. 代码规范

### 格式化（oxfmt）

配置见 `.oxfmtrc.json`，**执行 `pnpm fmt` 即可，不要手动调整格式**：

| 项               | 值                                               |
| ---------------- | ------------------------------------------------ |
| 缩进             | 2 空格                                           |
| 换行             | LF（见 `.editorconfig`）                         |
| 单引号           | 是（`singleQuote: true`）                        |
| 打印宽度         | 120                                              |
| 尾随逗号         | 无（`trailingComma: "none"`）                    |
| 箭头函数单参括号 | 省略（`arrowParens: "avoid"`，即 `item => ...`） |

### 命名

| 对象           | 规则                                               | 示例                                                       |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| 组件文件       | kebab-case                                         | `table-column-setting.vue`                                 |
| 组件使用       | PascalCase（ESLint 规则，忽略 `icon-*` / `vxe-*`） | `<TableColumnSetting />`                                   |
| 目录           | kebab-case                                         | `system-manage/`、`global-header/`                         |
| 页面目录       | kebab-case + `index.vue`                           | `views/system-manage/user/index.vue`                       |
| 页面私有子组件 | 同级 `modules/` 目录                               | `views/system-manage/user/modules/user-operate-drawer.vue` |
| 组合式函数     | `useXxx`                                           | `useVxeTable`、`useRouterPush`                             |
| 接口函数       | `fetchXxx`                                         | `fetchGetUserList`、`fetchCreateUser`                      |
| store          | `useXxxStore`，id 取 `SetupStoreId`                | `useAuthStore`                                             |
| 类型命名空间   | 已有命名空间内扩展                                 | `Api.SystemManage.UserList`                                |
| 路由目录       | 下划线 `_` 为层级分隔符，勿在业务目录名中使用      | -                                                          |

### 注释

- 使用 **JSDoc 风格英文注释**，函数上方一行说明，如 `/** get user list */`
- 关键逻辑（尤其是非显而易见的判断）用英文注释说明「为什么」
- 不要写无意义的注释，不要输出大段中文注释到代码里

### TypeScript

- 开启 `strict` 与 `strictNullChecks`，**禁止使用 `any`**（必要时用 `unknown` + 类型收窄）
- 接口响应优先返回明确类型，避免隐式 `any`
- `noUnusedLocals: false`，但仍应清理无用变量

### 其他

- 组件一律 `<script setup lang="ts">`
- 优先使用 `@/*` 别名导入，不要写长相对路径
- 全局提示用 `window.$message` / `window.$dialog`（已有全局类型声明），可选链调用 `window.$message?.success()`
- 本地存储统一走 `src/utils/storage.ts` 的 `localStg` / `sessionStg`，键前缀由 `VITE_STORAGE_PREFIX` 控制

---

## 6. 环境变量

| 文件        | 用途                                                                 |
| ----------- | -------------------------------------------------------------------- |
| `.env`      | 公共配置（base url、应用名、图标前缀、路由模式、服务码、存储前缀等） |
| `.env.test` | 测试环境后端地址（`pnpm dev` 默认使用）                              |
| `.env.prod` | 生产环境后端地址（`pnpm build` 使用）                                |

关键变量（改前请确认影响面）：

- `VITE_BASE_URL` —— 部署基础路径，**子目录部署必须以 `/` 结尾**
- `VITE_AUTH_ROUTE_MODE` —— `static` / `dynamic` 路由鉴权模式
- `VITE_ROUTE_HOME` —— 登录后首页路由名
- `VITE_ROUTER_HISTORY_MODE` —— `hash` / `history` / `memory`
- `VITE_HTTP_PROXY` —— 开发环境是否启用代理（`build/config/proxy.ts` 负责生成代理规则）
- `VITE_STATIC_SUPER_ROLE` —— 静态路由模式下的超管角色码
- `VITE_SOURCE_MAP`、`VITE_AUTOMATICALLY_DETECT_UPDATE`、`VITE_PROXY_LOG`

新增自定义 `VITE_*` 变量时，需在 `src/typings/vite-env.d.ts` 的 `ImportMetaEnv` 中补声明，
否则 `import.meta.env.XXX` 会丢类型。

---

## 7. 禁止事项

1. **禁止手动编辑自动生成文件**：
   `src/router/elegant/**`、`src/typings/elegant-router.d.ts`、`src/typings/components.d.ts`
2. **禁止手写路由表**代替 views 目录约定；需要覆盖 meta 请走 `customRoutes`
3. **禁止使用 npm / yarn 安装依赖**，只用 pnpm
4. **禁止在业务代码中使用 `any`**
5. **禁止在组件中直接调用 axios**，统一走 `@/service/request` + `@/service/api`
6. **禁止跳过 `useVxeTable` 自行封装表格**（除非明确需求）
7. **禁止硬编码文案**，一律走 i18n（且 zh-cn / en-us 同步新增）
8. **禁止硬编码 Pinia store id**，统一用 `SetupStoreId` 枚举
9. **禁止在业务代码中写死后端地址**，走环境变量 + `src/utils/service.ts` 的 `getServiceBaseURL`
10. **不要把 `src-tauri/**` 的构建产物纳入关注范围\*\*；Vite dev server 已配置忽略监听该目录
11. **不要动 `packages/` 下 `@sa/*` 内部包**，除非任务明确要求；业务改动应落在 `src/`

---

## 8. 常见任务速查

| 任务                | 入口                                                                               |
| ------------------- | ---------------------------------------------------------------------------------- |
| 新增页面            | `src/views/<模块>/<页面>/index.vue` → `pnpm gen-route` → 补 `customRoutes` 与 i18n |
| 新增接口            | `src/typings/api/*.d.ts` → `src/service/api/*.ts` → `src/service/api/index.ts`     |
| 新增 store          | `src/store/modules/<模块>/index.ts`（Setup Store）+ `SetupStoreId` 枚举            |
| 新增全局组件        | `src/components/{common,custom,advanced}/`（自动按需引入，无需注册）               |
| 新增布局模块        | `src/layouts/modules/`，并在对应布局中引入                                         |
| 修改主题默认值      | `src/theme/settings.ts`                                                            |
| 修改 UnoCSS 配置    | `uno.config.ts` / `packages/uno-preset`                                            |
| 修改 Vite 配置/插件 | `vite.config.ts` → `build/plugins/*` → `build/config/*`                            |
| 新增环境变量        | `.env` / `.env.test` / `.env.prod` + `src/typings/vite-env.d.ts`                   |
| 新增路由守卫        | `src/router/guard/*.ts` 并在 `guard/index.ts` 注册                                 |
| 修改代理            | `build/config/proxy.ts`                                                            |
