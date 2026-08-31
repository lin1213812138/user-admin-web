# 重写 AGENTS 文档结构

## 背景

用户提供了兄弟项目 `user-web` 的 AGENTS.md（Element Plus + JavaScript），要求「按照这个」重写本仓库（`user-admin-web`）的 AGENTS.md。

## 决策

- **只沿用模板的「结构与写作风格」，不沿用其技术栈内容。** 粘贴内容描述的是 `user-web`（Vite 5 / Element Plus 2.8 / JS / hash 路由 / `NTable`+`NForm`+`NDialog` / `src/api`+`src/config`），与本仓库实际（Vite 8 / Naive UI 2.44 / TypeScript / history + elegant-router / `Table`+`Form` / `src/service/api`+`src/store/modules`）完全不同。
- 若照抄会产生错误文档，故逐节用本仓库真实代码核对后重写，并在文档开头标注两个项目的关系。
- 同步落地模板顶部规则 1 要求的 `changelog/` 目录与 `AGENTS_CHANGELOG.md`（本仓库此前不存在）。

## 与原模板的主要差异（按本仓库实际替换）

| 模板（user-web）                                                      | 本仓库（user-admin-web）                                                                                    |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Vite 5 / JavaScript / Element Plus 2.8                                | Vite 8 / TypeScript 6（strict）/ Naive UI 2.44                                                              |
| vxe-table 4.9 + Handsontable 15                                       | vxe-table + vxe-pc-ui 4.5（无 Handsontable）                                                                |
| Vue Router 4，hash 模式，`src/config/routeConfig.js`                  | Vue Router 5，history 模式，elegant-router 按 views 目录自动生成                                            |
| `NTable`：`v-model` + `:request` + `:tableConfig`                     | `useVxeTable`（组合式）+ 受控 `<Table>`，列配置持久化走 localStorage                                        |
| `NForm`：`input`/`select`/`date`/`uploadFile`/`autocomplete`/`input2` | `FormWrap`：`input`/`textarea`/`number`/`switch`/`select`，`FormItemConfig[]` 驱动                          |
| `NDialog` / `NDrawer`：`ref.open(row)`                                | `components/common/drawer.vue`：`v-model:show` + `@submit`                                                  |
| `v-btn-auth` 指令 + `useBtnAuth` hook                                 | 尚未实现按钮级权限指令，`userInfo.buttons` 已就绪但未接入                                                   |
| `src/api/` + `src/config/`                                            | `src/service/api/` + `src/store/modules/`，类型在 `src/typings/api/*.d.ts`                                  |
| `.husky/` + commitlint                                                | `simple-git-hooks` + `sa git-commit-verify`，提交走 `pnpm commit`                                           |
| —                                                                     | 新增：接口与后端约定（Cookie 会话、双响应形态、MD5 密码）、Pinia Setup Store 约定、环境变量表、禁止事项清单 |

## 新增/修改文件

- `AGENTS.md`（整体重写）
- `AGENTS_CHANGELOG.md`（新建）
- `changelog/重写AGENTS文档结构.md`（本文件）
