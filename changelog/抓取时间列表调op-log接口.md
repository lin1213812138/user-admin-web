# 抓取时间列表调 /op-log/query

> 日期：2026-09-17
> 背景：用户贴 tms-user `OpLogSchema`（opType 注释扩为 0-登录 1-修改 2-删除 3-退出 **4-追踪**）与 `/op-log/query` 请求示例（page/size/where{refIds,refNames,client,opType}/keyword/startDate/endDate），要求「抓取时间列表调这个接口：/op-log/query，opType 默认传 4」。

## 定位

- 「抓取时间」tab（系统设置 → 轨迹抓取 → 抓取时间）主表格 = 抓取执行记录，此前 DEV 走 mock、PROD 调占位假接口 `/system/capture-time/list`（后端并无此接口，代码注释「等后端有记录接口再接」）。
- `/op-log/query` 已有封装 `fetchGetOpLogList`（flat 请求，调用方解包 `{data, error}`，返回 ret:{list,total}），系统日志页已在用。

## 决策（用户确认）

1. 「操作日志」列映射 `name`（操作名称，与系统日志页一致），不展示 desc（摘要）。
2. 不加搜索栏（YAGNI，保持仅列设置 + 抓取时间设置按钮）。
3. 清理旧 mock 链路：删 `fetchGetCaptureTimeRecordList` + mock 数据 + `CaptureTimeRecord` 类型族；保留 `/track-schedule/{get,save}` 配置接口。
4. 系统日志页不动（不加「追踪」筛选选项）。

## 实施

| 文件                                                                                      | 改动                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/typings/api/system-manage.d.ts`                                                      | `OpLogOpType` 扩 `4`；删 `CaptureTimeRecord` / `CaptureTimeRecordList` / `CaptureTimeSearchParams`                                                                                                                                                                                                         |
| `src/service/api/capture-time/index.ts`                                                   | 删 `fetchGetCaptureTimeRecordList` 及 mock import；保留 `fetchGetCaptureTimeConfig` / `fetchSaveCaptureTimeConfig`                                                                                                                                                                                         |
| `src/service/api/mock.ts`                                                                 | 删 `captureTimeRecords` 数组、`mockGetCaptureTimeRecordList`、`timeStampOf`（仅它使用；`CURRENT_OPERATOR` 有其他引用保留）                                                                                                                                                                                 |
| `src/views/system-manage/setting/modules/trace-capture/capture-time/CaptureTimeTable.vue` | api 改调 `fetchGetOpLogList({ page, size, where: { opType: 4 } })`；列 key 换 OpLog 字段：`name`(type:detail 可复制) / `client`(NTag TMS/PC/PDA/OMS) / `opType`(NTag，0-3 兜底 + 4-追踪 warning 色) / `creator` / `createDate`(dayjs 格式化)；cacheKey 升 `trace-capture-time-v2`（默认列 key 变更必须升） |
| `src/locales/langs/zh-cn.ts` / `en-us.ts` / `src/typings/app.d.ts`                        | `page.manage.opLog.opTypeOption` 加 `trace`（追踪 / Trace）三处同步                                                                                                                                                                                                                                        |
| `src/views/system-manage/log/index.vue`                                                   | 仅类型连锁修复：`opTypeTagType` 的 map 补第 5 位 `'warning'`（`OpLogOpType` 扩 4 后 tuple 长度 4 索引 4 报 TS2493），本页筛选行为不变                                                                                                                                                                      |

## 验证

- `pnpm typecheck`：0 error。
- `pnpm lint`（oxlint + eslint）：0 error（仅剩 `components/common/link.vue` 2 条既有 warning，与本次无关）。
- 未跑 playwright：需真实后端产生 opType=4（追踪）日志才能看到数据，建议联调时实测列表与分页。
