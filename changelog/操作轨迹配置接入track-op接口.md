# 操作轨迹配置接入 track-op 接口

> 用户给出 tms-user `TrackOpSchema`，要求用真实接口把「系统设置 → 操作轨迹配置」tab 改为**表格内编辑 + 批量保存**。

## 后端事实（用户提供 schema）

`TrackOpSchema`：`opType`(0-运单预报/1-运单揽收/2-运单入库/3-运单发货出库/4-运单派送出库)、`timeType`(0-年月日/1-年月日时分/2-年月日时分秒)、`place`(服务地点)、`desc`(详细描述)、`status`(0-否/1-是，默认 1)，另有 `_id`/`creator*`/`createDate`/`updateDate`。

接口（仅两个）：

- `POST /track-op/query` → `{ list: [...] }`（固定 5 条种子数据，无分页）
- `POST /track-op/update` → 批量保存（整表提交 `{ list: [...] }`）

## 设计确认

- 位置：复用现有 `system-manage/setting` 的 `operation-trace` tab（tab 名「操作轨迹配置」已对，原 `OperationTrace.vue` 是 node/location/drawer 草稿，与本 schema 同名不同字段，直接覆盖）。
- 数据集合：固定 5 条不可增删（只有批量保存/列表接口，无单条新增/删除）。
- 编辑模型：**表格内编辑**（操作节点只读标签，时间格式=下拉，服务地点/详细描述=输入框，是否发布=开关），顶部「批量保存」按钮整表提交。

## 实施（6 处）

1. `typings/api/system-manage.d.ts`：新增 `TrackOpItem` / `TrackOpList`（`_id`/`opType`/`timeType`/`place`/`desc`/`status`/`createDate`/`updateDate`）。
2. `typings/app.d.ts`：扩展 `page.manage.setting.operationTrace`（col 5 项 + opTypeOption 5 项 + timeTypeOption 3 项 + batchSave/saveSuccess/saveFailed）。
3. `locales/langs/zh-cn.ts` + `en-us.ts`：同步上述 i18n。
4. `service/api/operation-trace/index.ts`：重写为 `fetchGetTrackOpList()`（`/track-op/query`）、`fetchBatchUpdateTrackOp(list)`（`/track-op/update`），**真实接口、无 DEV mock**（沿用 user/role 的 `createFlatRequest` 解包 `{ data, error }` 写法）。
5. `views/.../operation-trace/OperationTrace.vue`：重写为 `useVxeTable`（`:pagination="null"` 无分页）+ `Table`，各列自定义插槽渲染可编辑单元格，`data.value` 直接被行内控件双向绑定（vxe 复用原对象引用，批量保存时整表读取提交）；`opType` 只读 `NTag`、`timeType` 用 `NSelect`、`place`/`desc` 用 `NInput`、`status` 用 `NSwitch`(checked=1/unchecked=0)；批量保存读 `data.value` 调 `fetchBatchUpdateTrackOp` 成功提示后刷新。
6. 删除 `OperationTraceDrawer.vue`：被内联编辑取代，且其导入的 `fetchCreateOperationTrace`/`fetchUpdateOperationTrace`/`OperationTraceItem` 已随 service 重写移除，保留会导致类型检查失败。

## 追加：服务地点改下拉（用户截图）

用户贴「服务地点」下拉截图（选项 `[运单出发地]`/`[目的地]`）：`place` 由 `NInput` 改 `NSelect`（单选、可清空、`:filterable="false"`、`:consistent-menu-width="false"`），选项固定占位符 `[运单出发地]`/`[目的地]`（值即占位符原文，后端替换）；i18n 三处新增 `operationTrace.placeOption`（占位符中英文共用原文）。

- 未采纳多选（截图选中值呈「运单出发地 ×」标签形态）：后端 `place: String`，多选需先确认存储格式；存量值 `[站点默认出发地]` 不在选项内时原样显示。

## 追加：新增一行按钮（用户："再加个按钮：新增一行"）

顶部「新增一行」按钮 `handleAddRow()`：本地 `data.value.push` 一条空行（`_id: ''`，`opType/timeType/place/desc/status` 给默认值），随「批量保存」整表提交，后端 `/track-op/update` 按 `_id` 是否为空做 upsert（新增时后端生成 `_id`）。

- 因需给新行选节点，原只读 `NTag` 的 `opType` 列改为 `NSelect`（0-4 下拉，与 timeType/place 同形态），并移除不再使用的 `NTag` 引入。
- i18n 三处新增 `operationTrace.addRow`（`app.d.ts` 的 operationTrace 段，与 export-format 区块已有的同名 `addRow` 键互不冲突）。

## 验证

- `pnpm typecheck` 0、`pnpm lint` 0 error（2 条既有 warning 在 `link.vue`，无关）。
- 未跑 playwright 实测（需真实后端 `/track-op/*` 在线）；接口路径/字段与用户提供 schema 对齐。

## 注意

- `/track-op/*` 为**真实接口、DEV 无 mock**，本地 dev 无后端时列表会报错；如需离线演示可后续补 `service/api/mock.ts` 分支（参考 export-format 之外的 system-manage mock 模式）。
- 原 `typings` 里 `OperationTrace*` 类型与 `service` 旧导出已弃用（本次删除其唯一消费方 drawer），暂留作死代码未清理。
