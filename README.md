# CWMS Admin · 用户管理前端

CWMS 出库管理系统的**管理端**前端，应用名 `CWMS Admin`。基于 [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin) v2.2.0 模板改造而来，使用 Naive UI + TypeScript 重写，逐步替代兄弟项目 `user-web`（Element Plus + JavaScript）。

后端为 `wms-user`（Node.js + Koa + MongoDB），前端直连 `/api/v1/...`。

## 技术栈

- **框架**: Vue 3.5（`<script setup lang="ts">`）
- **构建**: Vite 8
- **语言**: TypeScript 6（strict + strictNullChecks）
- **UI 库**: Naive UI 2.44
- **表格**: vxe-table + vxe-pc-ui 4.5
- **状态管理**: Pinia 3（Setup Store）
- **路由**: Vue Router 5 + elegant-router（按目录自动生成），history 模式
- **HTTP**: Axios，封装在内部包 `@sa/axios`（`createFlatRequest`）
- **国际化**: vue-i18n 11（zh-cn / en-us）
- **图表**: ECharts 6
- **样式**: UnoCSS 66 + SCSS
- **包管理**: pnpm workspace monorepo（**禁止 npm / yarn**）

## 环境要求

- Node.js >= 20.19.0
- pnpm >= 10.5.0

## 快速开始

```bash
# 安装依赖（monorepo，只能用 pnpm）
pnpm i

# 启动开发服务器（--mode test，端口 9527）
pnpm dev

# 生产环境配置启动
pnpm dev:prod
```

## 常用脚本

| 命令                                                | 说明                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm i`                                            | 首次安装依赖。                                                                       |
| `pnpm dev`                                          | 启动开发服务器（`--mode test`，端口 9527），触发 elegant-router 重新生成路由。       |
| `pnpm dev:prod`                                     | 以 prod 环境配置启动开发服务器。                                                     |
| `pnpm build`                                        | 生产构建（`--mode prod`）。                                                          |
| `pnpm build:test`                                   | 测试环境构建（`--mode test`）。                                                      |
| `pnpm preview`                                      | 预览构建产物（端口 9725）。                                                          |
| `pnpm typecheck`                                    | `vue-tsc --noEmit --skipLibCheck` 类型检查，改完代码必跑。                           |
| `pnpm lint`                                         | `oxlint --fix && eslint --fix .`。                                                   |
| `pnpm fmt`                                          | oxfmt 格式化。提交前必须执行，否则 pre-commit 的 `git diff --exit-code` 会拒绝提交。 |
| `pnpm gen-route`                                    | 手动重新生成路由文件（等价于 `pnpm dev` 触发的一次生成）。                           |
| `pnpm commit` / `pnpm commit:zh`                    | 交互式生成 Conventional Commits 提交信息（不要直接 `git commit`）。                  |
| `pnpm cleanup` / `pnpm release` / `pnpm update-pkg` | 清理依赖与产物 / 发版 / 批量更新依赖。                                               |

> pre-commit 钩子（`simple-git-hooks`）依次执行：`typecheck → lint → fmt → git diff --exit-code`。

## 目录结构

```
user-admin-web/
├── build/                      # Vite 配置：config/、plugins/
├── packages/                   # pnpm workspace 内部包 @sa/*（axios / color / hooks / materials / scripts / uno-preset / utils）
├── src/
│   ├── assets/                 # 静态资源（svg-icon / 图片）
│   ├── components/             # 通用组件（Table / Form / advanced / common / custom）
│   ├── constants/              # app / common / reg（表单校验正则）
│   ├── enum/                   # SetupStoreId 等枚举
│   ├── hooks/                  # common / business
│   ├── layouts/                # base-layout、blank-layout + modules/
│   ├── locales/                # langs/zh-cn.ts、langs/en-us.ts
│   ├── plugins/                # loading / nprogress / iconify / dayjs
│   ├── router/                 # elegant/（自动生成）、guard/（手写）、routes/（手写）
│   ├── service/                # api/、request/
│   ├── store/modules/          # app / auth / route / tab / theme
│   ├── styles/                 # 全局 scss / css
│   ├── theme/                  # settings.ts、vars.ts、preset/
│   ├── typings/                # 全局命名空间声明
│   ├── utils/                  # storage / service / icon / common / agent / crypto
│   └── views/                 # _builtin/、home/、system-manage/
├── changelog/                  # Agent 讨论记录
├── .env / .env.test / .env.prod
├── uno.config.ts / vite.config.ts / tsconfig.json / eslint.config.js / .oxfmtrc.json
```

路径别名：`@/*` → `./src/*`，`~/*` → 项目根目录。

## 开发约定

- **路由自动生成**：路由由 `src/views/` 目录结构自动生成，**禁止手写路由表**，禁止手改 `src/router/elegant/**` 与 `src/typings/elegant-router.d.ts`、`src/typings/components.d.ts`。新增页面后运行 `pnpm gen-route`。
- **表格**：统一使用 `useVxeTable` + `<Table>` 组合式封装，禁止自行封装表格。
- **表单**：新业务表单优先使用声明式 `FormWrap`（`src/components/Form/index.vue`）。
- **HTTP**：禁止在组件中直接调用 axios，统一走 `@/service/request` + `@/service/api`，接口函数以 `fetch` 开头。
- **国际化**：禁止硬编码文案，一律走 i18n，zh-cn / en-us 同步。
- **存储**：统一走 `src/utils/storage.ts` 的 `localStg` / `sessionStg`（表格列配置缓存例外，直接写裸 `localStorage`）。
- **类型**：开启 strict，禁止使用 `any`。
- **格式**：`pnpm fmt`（oxfmt）统一管理，2 空格缩进、单引号、打印宽度 120、无尾随逗号。

## 数据流

```
views/<模块>/<页面>/index.vue
  → useVxeTable({ api, transform })
  → service/api/<模块>.ts  (fetchXxx)
  → request (@sa/axios createFlatRequest)
  → 后端 /api/v1/...
  → store/modules/* (Pinia Setup Store)
  → 视图渲染
```

类型声明集中在 `src/typings/api/*.d.ts` 的 `Api.<Module>` 命名空间，无需 import。

## 接口约定

- 会话使用 httpOnly Cookie，登录接口不返回 token；`request` 以 `withCredentials: true` 创建。
- 响应体兼容双形态：`{ errcode: 0, errmsg: 'OK', ret: {...} }`（wms-user）与 `{ code: '0000', msg, data }`（mock / apifox）。
- 登录密码加密：`MD5(MD5(明文) + 明文)`（见 `src/utils/crypto.ts`）。

## 权限模式

当前为**静态路由模式**（`VITE_AUTH_ROUTE_MODE=static`）。`userInfo.roles` / `userInfo.buttons` 由后端 `authMap` 推导。超管角色 `VITE_STATIC_SUPER_ROLE=R_SUPER` 跳过路由过滤。

## 环境变量

| 文件        | 用途                       |
| ----------- | -------------------------- |
| `.env`      | 默认环境                   |
| `.env.test` | 测试环境（开发服务器默认） |
| `.env.prod` | 生产环境                   |
