import { request } from '../../request';

/**
 * 渠道加收接口（tms-user，/channel-fee-ext/*）。flat request，调用方需解包 { data, error }。
 *
 * 契约要点（已核 tms-user）：
 * - `create` 校验 `refId`（36 位）+ `name`，且 name 在**同一渠道内唯一**（重名返回 103401）；
 * - `query` 走 queryCommon（`{ page, size, keyword, where }`），返回后无条件 fillName 回填
 *   `country`（国家 nameCn 以「，」拼接），无需传 scene；
 * - 计费只读 `varType` + `start`/`end`，`expr` 仅作展示与「无条件加收」标记。
 */

/** 渠道加收列表（/channel-fee-ext/query；where.refId 过滤所属渠道） */
export function fetchGetChannelFeeExtList(params: Api.ChannelQuote.ChannelFeeExtSearchParams) {
  return request<Api.ChannelQuote.ChannelFeeExtList>({
    url: '/channel-fee-ext/query',
    method: 'post',
    data: params
  });
}

/** 新增加收（/channel-fee-ext/create） */
export function fetchCreateChannelFeeExt(params: Api.ChannelQuote.ChannelFeeExtSaveParams) {
  return request<null>({
    url: '/channel-fee-ext/create',
    method: 'post',
    data: params
  });
}

/**
 * 修改加收（/channel-fee-ext/update）
 *
 * 必填 `_id`；且必须随行回传 **`refId` + `name`** —— 后端 `updateCommon` 走
 * `uniqField:'name'` + `uniqFilter:{ refId: params.body.refId }`，缺 refId 会导致同渠道重名校验失效。
 */
export function fetchUpdateChannelFeeExt(params: Api.ChannelQuote.ChannelFeeExtSaveParams & { _id: string }) {
  return request<null>({
    url: '/channel-fee-ext/update',
    method: 'post',
    data: params
  });
}

/**
 * 删除加收（/channel-fee-ext/delete）。
 *
 * 后端按 `ids: string[]` 接收（`validate.requireStrArr`：数组、minItems 1），单条删除即传长度 1 的数组。
 * `sync` 为真时后端额外 `deleteMany({ syncId: ids })`：删除**承运网络侧的源附加费**时，
 * 把此前同步到各渠道的副本一并清掉（渠道侧删除自身副本时无需传，传了也匹配不到记录）。
 */
export function fetchDeleteChannelFeeExt(_id: string, sync = false) {
  return request<null>({
    url: '/channel-fee-ext/delete',
    method: 'post',
    data: { ids: [_id], sync }
  });
}

/**
 * 同步加收到渠道（/channel-fee-ext/sync）。
 *
 * 契约要点（已核 tms-user `services/channel-fee-ext.js#syncList`）：
 * - `ids` = 源加收 _id（承运网络下的加收）；`refIds` = 目标渠道 _id；
 * - 后端按 `syncId` 覆盖目标渠道中同来源的旧副本（重复同步不叠加），渠道自有加收（无 syncId）不受影响。
 */
export function fetchSyncChannelFeeExt(params: Api.ChannelQuote.ChannelFeeExtSyncParams) {
  return request<null>({
    url: '/channel-fee-ext/sync',
    method: 'post',
    data: params
  });
}
