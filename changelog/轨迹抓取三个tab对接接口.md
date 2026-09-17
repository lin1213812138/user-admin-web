# 轨迹抓取三个 tab 对接接口

> 用户贴系统设置「追踪网络」tab 截图，红框圈「异常轨迹 / 轨迹关键词 / 抓取时间」三个 tab："这三个界面接口也接一下"。

## 现状

- 系统设置 → 轨迹抓取配置 4 个子 tab：追踪网络(track-network) / 异常轨迹(track-transform) / 轨迹关键词(track-keyword) / 抓取时间(capture-time)。
- 三个目标 tab 的 service（`trace-transform` / `trace-keyword` / `capture-time`）DEV 走本地 mock，生产 URL 是虚构的 `/system/...`；类型按 mock 设计（`id:number`、`statusName/timeFormat/location/description/keywordDefinition`、`ruleName/scope/keywordGroup/waybillStatus/enabled`），与后端模型对不上。

## 后端事实（tms-user 源码，`/api/v1/web` 前缀，errcode/ret 包装）

| Tab        | 后端路由                                                                       | 字段                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 异常轨迹   | `/track-err-config/{create,update,delete,query,get}`（code 1045 异常状态配置） | `name` 状态名称 / `timeType` 0-年月日 1-年月日时分 2-年月日时分秒 / `place` 服务地点 / `desc` 详细描述 / `detectDesc` 关键词判断定义 / creator / updateBy / createDate / updateDate |
| 轨迹关键词 | `/track-status-config/{create,update,delete,query,get}`（code 1089）           | `name` / `common` 0-否 1-是 全局通用 / `configIds[]` 关联追踪网络 / `detectEvents[]` 关键词 / `orderStatus` 50-转运中 60-已送达 70-异常件 80-已退件                                 |
| 抓取时间   | `/track-schedule/{save,get}`（单文档 upsert）                                  | `exeTimes` number[]（0-23 小时）；creator/updateBy 由 `processData` 中间件自动注入                                                                                                  |

- 异常轨迹 `query` 走 `queryAllCommon`：**全量返回 `{list}`**，无 total、忽略 page/size（与渠道类别 `/channel-group/query` 同款既有行为）。
- 轨迹关键词 `query` 走 `queryCommon`（keywordFields=['name']）：`{page,size,keyword,where}` → `{list,total}`。
- delete 均仅单条 `_id`。
- **抓取时间 tab 的「抓取执行记录」表格后端没有任何接口**（定时任务目前硬编码每天 3 点，`schedule.js` 未消费 `exeTimes`）。

## 用户确认的三项决策

1. **抓取执行记录表保留 mock 现状**，本次只把「抓取时间设置」弹窗接到 `/track-schedule/save`、`get`。
2. **轨迹关键词完全对齐后端**：表单改为 名称 + 全局通用开关 + 关联追踪网络（多选，数据源 `/track-config/query`）+ 关键词 + 运单状态，去掉启用开关；表格列相应重排，含追踪网络名称映射。
3. **只接红框三个 tab**，追踪网络（`/track-config/*`）后续单独处理。

## 方案（已确认：方案 A 直连对齐）

service 层去 DEV mock 直连 tms-user、类型按后端字段重写、表格列/抽屉表单按后端字段重排——与 `data-manage-ship`（发货资料）范式一致，flat request 解包 `{data, error}`。不采用 service 适配层（类型与后端契约脱节，双份字段名纯增维护成本）。文件组织维持「每 tab 一个 service 目录」。

## 实施清单

1. **typings**（`typings/api/system-manage.d.ts`）：保留类型名、字段对齐后端——
   - `TraceTransformItem`：`_id` + `name/timeType/place?/desc?/detectDesc?/creator?/updateBy?/createDate?/updateDate?`；`TraceTransformList` = `{ list }`（全量无 total）。
   - `TraceKeywordItem`：`_id` + `name/common/configIds/detectEvents/orderStatus/creator?/updateBy?/createDate?/updateDate?`；删 scope/enabled 相关。
   - `CaptureTimeConfig` = `{ exeTimes: number[] } | null`；`CaptureTimeConfigSaveParams` = `{ exeTimes }`；`CaptureTimeRecord`（执行记录 mock）不动。
2. **service**：
   - `trace-transform` → `/track-err-config/*`（无 DEV mock）。
   - `trace-keyword` → `/track-status-config/*`（无 DEV mock）。
   - 新建 `track-config/index.ts`：仅 `fetchGetTrackConfigList()` 全量，作为轨迹关键词的数据源（追踪网络 tab 本身不动）。
   - `capture-time`：记录列表保留 mock；config get/save 改 `/track-schedule/{get,save}`。
   - `mock.ts`：删异常轨迹 4 个 + 关键词 4 个 + 抓取时间 config 2 个 mock（含 `traceTransformItems` / `traceKeywordItems` / `captureTimeConfig` 数组）；保留执行记录与 trace-config 全部。
3. **页面**：
   - 异常轨迹：列 name/timeType(复用 timeFormatOption 文案)/place/desc/detectDesc；`transform: r => ({ records: r.list, total: r.list.length })`（分页器仅展示）；删除传 `{_id}`；Drawer 表单 5 字段重排，提交改 `{data,error}` 解包。
   - 轨迹关键词：列 name/common(NTag 是/否)/configIds(挂载拉 track-config 全量建映射，join '、')/detectEvents(join '、')/orderStatus(复用 waybillStatusOption 文案)/updateBy/updateDate；Drawer 表单 name + common(switch) + configIds(NSelect multiple) + detectEvents(逗号分隔输入，提交 split(/[,，]/)) + orderStatus(select 50/60/70/80)；cacheKey 升 `trace-keyword-v2`。
   - 抓取时间：`CaptureTimeModal` loadConfig 改 `/track-schedule/get`（exeTimes 数字 → "00"~"23" 字符串），保存改 `/track-schedule/save`（行值转数字），非空/重复校验保留；`CaptureTimeTable` 不动。
4. **cacheKey**：默认列变化 → `trace-transform`→`trace-transform-v2`、`trace-keyword`→`trace-keyword-v2`（抓取时间表未动不升）。
5. **i18n 三处同步**（zh-cn / en-us / `app.d.ts` I18n Schema）：新增「全局通用」「关联追踪网络」等 key；删 `scopeOption.*`、`col.enabled`、`form.enabled`、`ruleName` 等不再使用的 key。

## 验证

- `pnpm typecheck`：**本次改动的文件 0 error**；剩余 error 全部来自实施期间**并行进行中的追踪网络对接**（另一会话/用户手工）：`constants/track-config.ts` 的 `Option.CommonOption` 误用、`service/api/index.ts` 悬空的 `export './trace-config'`（目录已被并行流清空）、TrackNetwork Drawer/Table 引用了尚未添加的 i18n key——均未触碰。
- `oxlint`（19 个改动文件）0 warnings 0 errors；`eslint`（vue 组件）0 error。

## 并行冲突记录（重要）

实施期间另一会话正在同一页面（轨迹抓取配置）对接**追踪网络** tab：

1. 接管了我为关键词数据源新建的 `service/api/track-config/index.ts`，改写为追踪网络 tab 的完整 CRUD（`fetchGetTrackConfigList(params)` 等）；
2. 把 `TraceConfig*` 类型重写为后端 track-config 全模型（含 account/password/key/web/channel/accountNo）；
3. 清空了 `service/api/trace-config/` 目录、新增 `src/constants/track-config.ts`；
4. 覆盖了我在 `en-us.ts` form 块的改动（scope/enabled 回流，已重新套用修复）。

适配处理：关键词表格的数据源改为调用并行流的 `fetchGetTrackConfigList({})`、复用其 `TraceConfigList`/`TraceConfigItem` 类型；删除了我此前建的重复类型 `TrackConfigItem`/`TrackConfigList` 与 mock.ts 中已被孤儿化的 trace-config mock（service 目录已空、并行流注释明确"无 DEV mock"）。

## 后续

- playwright 运行走查暂缓：同一页面的 TrackNetwork 组件在并行流中未完成（typecheck 未绿），待追踪网络对接完成后一起走查三个 tab 的 CRUD。
