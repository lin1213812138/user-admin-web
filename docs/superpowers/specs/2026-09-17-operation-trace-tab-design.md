# 操作轨迹配置独立为系统设置顶级 tab 设计

**日期**：2026-09-17
**关联记录**：[changelog/操作轨迹配置单独提为一个模块.md](../../../changelog/操作轨迹配置单独提为一个模块.md)

## 背景与问题

「系统设置」页（`/system-manage/setting`）左侧竖 tab 现为 6 项：基础配置 / 录单格式 / 打印格式 / 导出格式 / 运单号规则 / 轨迹抓取配置。

其中「轨迹抓取配置」内部用子 tab 承载 4 个模块：追踪网络 / 轨迹改造 / 轨迹关键词 / 操作轨迹。用户要求把「操作轨迹配置」单独提为一个模块。

经提问确认，提取层级选 **A：系统设置页内的顶级 tab**（与基础配置、录单格式等并列），不新增路由与侧栏菜单。

## 目标

- 「系统设置」左侧竖 tab 变为 7 项，新增「操作轨迹配置」追加在末尾（轨迹抓取配置之后）。
- 「轨迹抓取配置」内部只剩 3 个子 tab（追踪网络 / 轨迹改造 / 轨迹关键词），操作轨迹子 tab 移除。
- 新 tab 支持 `?tab=operation-trace` 直达（`setting/index.vue` 的 `syncTabFromQuery` 按 tabs 数组校验，新增即自动生效）。
- 不改路由、不改菜单、不触发 elegant-router 重生成。

## 方案

### 1. 组件挪位 + 归位命名

| 现在                                                                         | 之后                                                                           |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `views/system-manage/setting/modules/trace-capture/OperationTraceTable.vue`  | `views/system-manage/setting/modules/operation-trace/OperationTrace.vue`       |
| `views/system-manage/setting/modules/trace-capture/OperationTraceDrawer.vue` | `views/system-manage/setting/modules/operation-trace/OperationTraceDrawer.vue` |

- 主组件对齐各模块命名习惯（`InputFormat.vue` / `PrintFormat.vue` / `TraceCapture.vue` 均为「模块名.vue」，而非 `XxxTable.vue`）。
- 组件内部零逻辑改动；`useVxeTable` 的 `cacheKey: 'operation-trace'` 保持不变 → 已有用户的列配置缓存继续生效。
- `modules/operation-trace/` 空目录已存在，直接使用；`views/**/modules/**` 下非 `index.vue` 组件不参与 elegant 路由生成（现有 19 个模块组件同待遇），**严禁命名为 `index.vue`**。

### 2. `trace-capture/TraceCapture.vue` 移除操作轨迹

- 删 `OperationTraceTable` import、`SubTabKey` 联合类型（`active` 直接使用 `Api.SystemManage.TraceCaptureCategory`）、`operationTabLabel`、最后一个 `<NTabPane name="operation-trace">`；
- 同步更新头注释（说明仅剩 3 个子页）。

### 3. `setting/index.vue` 新增顶级 tab

- `tabs` 追加 `{ value: 'operation-trace', label: $t('page.manage.setting.operationTrace.title') }`（末尾）；
- `componentMap` 追加 `'operation-trace': OperationTrace`（静态 import，与其它模块一致）。

### 4. i18n（方案甲：复用现有 key）

- 新增 `page.manage.setting.operationTrace.title`（zh `操作轨迹配置` / en `Operation Trace Config`），三处同步：`zh-cn.ts`、`en-us.ts`、`typings/app.d.ts` 的 I18n Schema。
- 删除已无引用的 `traceCapture.subTab.operationTrace`（zh / en / app.d.ts 三处）。
- 列 / 表单 / 抽屉标题文案（`col.node`、`form.node`、`createTitle` 等）继续复用 `traceCapture.*`：这些 key 是整个轨迹域共用的（`createTitle` 一个 key 四个抽屉在用、`col.timeFormat` 被轨迹改造与操作轨迹共用），新建独立命名空间会造成同名 key 双份、长期双写。

## 不改动

- service（`@/service/api/operation-trace`）、mock、类型声明（`Api.SystemManage.OperationTrace*`）；
- 表格列、抽屉字段、`cacheKey`；
- `base-layout` 的 `contentShowPadding` 排除数组（新 tab 仍在 `system-manage_setting` 路由下）；
- 路由 / 菜单 / elegant 生成物。

## 验证

- `pnpm typecheck` 0 错误；改动文件 oxfmt / oxlint / eslint 0 问题；
- `pnpm build` 通过；
- 全项目搜 `OperationTraceTable` 0 命中、`traceCapture.subTab.operationTrace` 0 命中；
- 本地无后端会话时最终视觉由用户确认；如需可 playwright 登录 dev 实测新 tab 渲染与 `?tab=` 直达。
