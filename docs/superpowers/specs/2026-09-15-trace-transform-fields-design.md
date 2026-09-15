# 轨迹改造：字段改造（异常状态定义表）设计

**日期**：2026-09-15
**关联记录**：[changelog/轨迹改造字段改造.md](../../../changelog/轨迹改造字段改造.md)

## 背景与需求

用户提供原型截图：「系统设置 → 轨迹抓取配置 → 轨迹改造」子 tab 的字段应为
**排序 / 状态名称 / 时间格式 / 服务地点 / 详细描述 / 抓取轨迹关键词判断定义**，
示例为 8 条异常状态（航班延误、船期延误、清关延误、扣关、派送失败、快件丢失、快件破损、其它异常），
带「添加一行」按钮与行内「编辑 / 删除」。

现状：`TraceCapture.vue` 中「轨迹改造」与前 3 个子页（追踪网络 / 轨迹关键词 / 抓取时间）同构，
共用 `TraceConfigTable` + `TraceConfigDrawer`（名称 / 服务器地址 / 系统类型 / 最后编辑 / 编辑时间），
与截图字段不符。

澄清确认（4 问）：

1. **范围**：只改「轨迹改造」，其余 4 个 tab（追踪网络 / 轨迹关键词 / 抓取时间 / 操作轨迹）保持现状；
2. **交互**：沿用抽屉表单范式——工具栏「添加一行」→ 抽屉新增，行内「编辑 / 删除」；
3. **「抓取轨迹关键词判断定义」**：自由文本，多个关键词用中文逗号分隔（如「丢失，遗失」）；
4. **「排序」**：表格自动序号（等同行号），不落库、不可编辑。

补充（原型第二张图）：时间格式为下拉三选一——「年月日 / 年-月-日 时分 / 年-月-日 时分:秒」。

## 方案

### 1. 数据模型（`src/typings/api/system-manage.d.ts` 新增，不动 `TraceConfig*`）

```ts
type TraceTransformTimeFormat = 'ymd' | 'ymd-hm' | 'ymd-hms';

interface TraceTransformItem {
  id: number;
  statusName: string; // 状态名称（必填）
  timeFormat: TraceTransformTimeFormat; // 时间格式（下拉三选一，默认 ymd-hm）
  location: string; // 服务地点（可空）
  description: string; // 详细描述（可空）
  keywordDefinition: string; // 抓取轨迹关键词判断定义（可空）
}
// + TraceTransformList / SearchParams / CreateParams / UpdateParams
```

时间格式存**枚举 key 而非中文串**，展示走 i18n（`timeFormatOption.ymd | ymdHm | ymdHms`），
满足「禁止硬编码文案」规范。

### 2. 组件（`views/system-manage/setting/modules/trace-capture/`）

| 文件                            | 说明                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 新增 `TraceTransformTable.vue`  | `useVxeTable` + `Table`；工具栏「添加一行」、行内「编辑 / 删除」（`NPopconfirm` 二次确认）；cacheKey `trace-transform`                                        |
| 新增 `TraceTransformDrawer.vue` | `NFormWrap` 抽屉表单：状态名称（input 必填）/ 时间格式（select 三选一，默认「年-月-日 时分」）/ 服务地点（input）/ 详细描述（input）/ 关键词判断定义（input） |
| 修改 `TraceCapture.vue`         | `configTabs` 循环内加分支：`track-transform` 渲染 `TraceTransformTable`，其余 3 项继续 `TraceConfigTable`；tab 顺序不变                                       |

表格列：序号（`show-seq`，即截图「排序」）/ 状态名称 / 时间格式（i18n 文案）/ 服务地点（空显示 `--`）/
详细描述 / 抓取轨迹关键词判断定义 / 操作（编辑、删除）。

### 3. 数据与接口（DEV mock 先行）

- `mock.ts`：`traceTransformItems` 按截图 8 条造数（服务地点留空）+ `mockGet / Create / Update / DeleteTraceTransform`；
- `system-manage.ts`：`fetchGet / Create / Update / DeleteTraceTransform`，DEV 走 mock（`as unknown as`），
  PROD 走 `/system/trace-transform/...`；删除签名 `fetchDeleteTraceTransform(ids: number[])`（与初始化数据一致）。

### 4. i18n（zh-cn / en-us / `typings/app.d.ts` 三处同步）

- `col` 增 `statusName`、`keywordDefinition`（`timeFormat` / `location` / `description` 复用现有键）；
- `form` 增 `statusName` / `statusNamePlaceholder` / `keywordDefinition` / `keywordDefinitionPlaceholder`；
- 增 `addRow`（「添加一行」）与 `timeFormatOption.{ymd, ymdHm, ymdHms}`。

## 不改动

- 追踪网络 / 轨迹关键词 / 抓取时间 / 操作轨迹 4 个 tab 的组件、mock、类型；
- `TraceConfig*` 与 `OperationTrace*` 现有类型与接口；
- 不做勾选列 / 批量删除（截图左侧勾选列视为原型示意）、不做审计字段（最后编辑 / 编辑时间）。

## 验证

- `pnpm typecheck` 0 错误；改动文件 oxfmt / oxlint / eslint 0 问题；
- `pnpm build` 通过；
- 无浏览器端到端（本地无后端会话），最终视觉效果由用户查看确认。
