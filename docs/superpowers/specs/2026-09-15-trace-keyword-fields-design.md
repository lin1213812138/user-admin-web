# 轨迹关键词：字段改造（匹配规则表）设计

**日期**：2026-09-15
**关联记录**：[changelog/轨迹关键词字段改造.md](../../../changelog/轨迹关键词字段改造.md)

## 背景与需求

用户提供原型截图：「系统设置 → 轨迹抓取配置 → 轨迹关键词」子 tab 的字段应为
**规则名称 / 使用范围 / 关键词组 / 运单状态 / 启用状态 / 最后编辑 / 编辑时间** + 操作（编辑 / 更多），
示例 2 条（安达配送完成·全局通用·配送完成·已送达·启用·王恒·2026-09-04 16:42:34；
规则·全局通用·した·异常件·启用·超管员·2026-08-31 10:02:53）。

现状：「轨迹关键词」仍与追踪网络 / 抓取时间同构，共用 `TraceConfigTable` + `TraceConfigDrawer`
（名称 / 服务器地址 / 系统类型 / 最后编辑 / 编辑时间），与截图不符。

澄清确认：

1. **范围**：只改「轨迹关键词」，其余 4 个 tab（追踪网络 / 抓取时间 / 轨迹改造 / 操作轨迹）不变；
2. **使用范围**：按初版枚举——全局通用 / 指定站点 / 指定客户（本版只存枚举值，不做站点/客户二级联动）；
3. **运单状态**：按用户截图——转运中 / 已送达 / 异常件 / 已退件（必填）；
4. **关键词组**：自由文本，多个关键词用中文逗号分隔；
5. **操作列**：编辑 + 删除（`NPopconfirm` 二次确认），截图省略号按原型示意处理。

## 方案

### 1. 数据模型（`src/typings/api/system-manage.d.ts` 新增）

```ts
type TraceKeywordScope = 'global' | 'site' | 'customer';
type TraceKeywordWaybillStatus = 'in-transit' | 'delivered' | 'exception' | 'returned';

interface TraceKeywordItem {
  id: number;
  ruleName: string; // 规则名称（必填）
  scope: TraceKeywordScope; // 使用范围（默认 global）
  keywordGroup: string; // 关键词组（必填，中文逗号分隔）
  waybillStatus: TraceKeywordWaybillStatus; // 运单状态（必填，默认 in-transit）
  enabled: Api.Common.EnableStatus; // 启用状态（1 启用 / 0 禁用，新增默认 1）
  lastEditor: string; // 最后编辑（审计）
  editTime: string; // 编辑时间（审计）
}
// + TraceKeywordList / SearchParams / CreateParams / UpdateParams（Create 不含审计字段）
```

枚举存 key、展示走 i18n（`scopeOption` / `waybillStatusOption`）。

### 2. 组件

| 文件                          | 说明                                                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 新增 `TraceKeywordTable.vue`  | `useVxeTable` + `Table`，cacheKey `trace-keyword`；列=序号/规则名称/使用范围/关键词组/运单状态/启用状态（NTag 启用·禁用）/最后编辑/编辑时间/操作（编辑、删除） |
| 新增 `TraceKeywordDrawer.vue` | `NFormWrap`：规则名称（必填）/ 使用范围（select 3 项，默认全局通用）/ 关键词组（必填）/ 运单状态（select 4 项，默认转运中）/ 启用状态（switch 1/0，默认启用）  |
| 修改 `TraceCapture.vue`       | `configTabs` 循环再加 `track-keyword` 分支渲染 `TraceKeywordTable`；tab 顺序不变                                                                               |

### 3. 数据与接口（DEV mock 先行）

- `mock.ts`：`traceKeywordItems` 2 条截图数据 + `mockGet / Create / Update / DeleteTraceKeyword`（create/update 自动填 `lastEditor` / `editTime`）；
- `system-manage.ts`：4 个 `fetch*TraceKeyword`，DEV 走 mock（`as unknown as`），PROD `/system/trace-keyword/*`；删除 `ids: number[]`。

### 4. i18n（zh-cn / en-us / `typings/app.d.ts` 三处同步）

- `col` 增 `ruleName` / `scope` / `keywordGroup` / `waybillStatus` / `enabled`（`lastEditor` / `editTime` 复用现有键）；
- `form` 增 `ruleName(+Placeholder)` / `scope` / `keywordGroup(+Placeholder)` / `waybillStatus` / `enabled`；
- 增 `scopeOption.{global,site,customer}`、`waybillStatusOption.{inTransit,delivered,exception,returned}`。

## 不改动

- 追踪网络 / 抓取时间 / 轨迹改造 / 操作轨迹 4 个 tab 的组件、mock、类型；
- `TraceConfig*`、`TraceTransform*` 现有类型与接口；
- 不做勾选列 / 批量删除。

## 验证

- `pnpm typecheck` 0 错误；改动文件 oxfmt / oxlint / eslint 0 问题；
- `pnpm build` 通过；
- 无浏览器端到端（本地无后端会话），最终视觉效果由用户查看确认。
