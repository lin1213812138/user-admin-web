# 子模块主文件统一为 index.vue

- 日期：2026-09-20
- 类型：重构（纯文件重命名 + 引用路径同步，零逻辑变更）
- 状态：已实施（typecheck / lint / build 通过；页面冒烟待用户）
- spec：`docs/superpowers/specs/2026-09-20-子模块主文件统一为index-design.md`

## 需求

用户先问：「现在这种子模块可以是 index.vue 并且不会被加到菜单里面吗？」（截图：`data-manage/ship/modules/carrier/Carrier.vue` 等 `modules/<子目录>/<同名大驼峰主文件>.vue`），确认可行后再下指令：「那能不能帮我把子模块的文件名称改成 index.vue 呢？」

## 流程（硬闸门）

G0 技能判定（`spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation`）→ G1 spec 落 `docs/superpowers/specs/2026-09-20-子模块主文件统一为index-design.md`（状态「待确认（禁止实现）」）→ G2 用户「可以，开始改吧」（命中宽泛口令「开始」）→ G3 落章「已确认（用户确认：可以，开始改吧）」→ G5 实施 → G6 本记录。

## 结论先行：为什么安全

`modules/**` 已被 `build/plugins/router.ts` 的 `pageExcludePatterns: ['**/components/**', '**/modules/**']` 排除扫描；该配置在 `@elegant-router/core@0.3.8` 内直接作为 `fast-glob` 的 `ignore`（相对 `src/views`），文件监听器 `chokidar` 用同一份 ignore。实测扫描：26 个页面命中、`modules` 路径命中 0。菜单由路由表派生（`store/modules/route/shared.ts` 按 `hideInMenu` 过滤），无路由即无菜单项。既有先例：`channel-quote/receive/modules/quote-setting/index.vue` 早已是 `index.vue` 且靠手工注册（`customRoutes.map` + `embeddedViews`）才成为独立路由。

## 实施

### 1. 改名（36 个，文件内容逐字不变）

用 `Move-Item` 批量重命名（同一卷内重命名，内容与 git rename 相似度均可保留；不用 `git mv`，避免改动 git 暂存区干扰用户未提交的工作）。重命名前已确认目标 `index.vue` 不存在（唯一保护：`Test-Path` 命中则跳过并告警，实际 0 跳过）。

| 范围                                                                          | 数量 | 示例                                                         |
| ----------------------------------------------------------------------------- | ---- | ------------------------------------------------------------ |
| `data-manage`（basic 2 / bl 6 / business 8 / finance 4 / no-rule 4 / ship 4） | 28   | `ship/modules/carrier/Carrier.vue` → `carrier/index.vue`     |
| `personal-center`                                                             | 2    | `profile-info/ProfileInfo.vue` → `profile-info/index.vue`    |
| `system-manage/setting`                                                       | 6    | `trace-capture/TraceCapture.vue` → `trace-capture/index.vue` |

结果：`Move` 输出 `TOTAL_MOVED=36`；`modules` 下 `index.vue` 总数由 6 → 42，无覆盖。

### 2. 引用同步（8 个宿主文件 / 36 处）

- `data-manage` 6 个 `index.vue`：动态 `load: () => import('@/views/<模块>/modules/<dir>/index.vue')`（28 处）；
- `personal-center/index.vue`（2 处）与 `system-manage/setting/index.vue`（6 处）：静态 import。

已全量核对 `src/**`（含 `.ts` / typings / store）无其它引用点。

## 踩坑

同一次批量里对同一文件并行发起多个 diff 编辑时，`business/index.vue` 中 `clearance-method/ClearanceMethod.vue` → `index.vue` 这一处替换被覆盖丢失（同批其余 7 处生效）。`pnpm typecheck` 直接报 `TS2307: Cannot find module '@/views/data-manage/business/modules/clearance-method/ClearanceMethod.vue'` 精确定位，补齐后 0 错误。

结论：**批量改名后必须跑 typecheck —— `vue-tsc` 会校验 `.vue` import 路径的存在性**（本次即由它兜住了遗漏）。

## 验证

| 项                                                      | 结果                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                                        | 0 错误                                                                                            |
| `pnpm lint`                                             | 0 error（`components/common/link.vue` 2 条既有 warning，与本次无关）                              |
| `pnpm build:test`                                       | Build successful（Vite 解析全部 import，断链会在此暴露）                                          |
| 路由扫描回归                                            | `MODULES_HITS=0`、`TOTAL=26`，26 个路由名与改动前逐一一致 ⇒ 路由 / 菜单零变化                     |
| 残留引用（区分大小写搜索 `modules/<dir>/<Pascal>.vue`） | 0                                                                                                 |
| git 变化范围                                            | 36 个 `D`（旧文件）+ 36 个 `??`（新 index.vue）+ 8 个宿主文件 `M`，`src/router/elegant/**` 无变化 |

## 边界（不做的事）

- 未改从属文件（`XxxOperateDrawer.vue` / `XxxSearchForm.vue` / `export-format-drawer.vue` 等）、未改单文件型 `modules/*.vue`、未动 `system-manage/label-designer/modules/{panels,canvas}`、未动 `trace-capture/{capture-time,track-*}` 三层目录、未动 `channel-quote/receive/modules/**`（本就是 index.vue）；
- 未改路由 / 菜单 / 权限码 / i18n / 接口 / 类型 / `build/plugins/router.ts` 的扫描配置；
- 未改任何组件内部逻辑、`defineOptions name`、模板与样式。

## 后续须知

- `modules/**` 下的文件**永远**不会被自动路由扫描；若某子页将来需要独立 URL（可直达、可刷新），必须走手工注册三件套：`customRoutes.map`（拿 RouteKey/路径）+ `src/router/routes/index.ts` 注入到父级 children（`hideInMenu` + `activeMenu`）+ `embeddedViews` 补挂视图，范例 `channel-quote_receive_quote-setting`；
- 若某目录整体移出 `modules/`，其 `index.vue` 会立刻被扫成路由并**默认进菜单**（`onRouteMetaGen` 不给 `hideInMenu`），需同步加进 `hideInMenuRoutes`。

## 冒烟清单（待用户）

1. 资料管理 6 页（basic / bl / business / finance / no-rule / ship）各子模块正常显示与增删改查；
2. 系统设置 6 个 tab 正常；
3. 个人中心两个 tab 正常；
4. 侧栏菜单无新增 / 消失项。
