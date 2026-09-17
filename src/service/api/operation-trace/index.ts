import { request } from '../../request';

// 均为真实接口（tms-user /track-op/*），flat 请求需调用方解包 { data, error }

/** 操作轨迹配置列表（真实接口 /track-op/query，固定返回 5 种操作节点，无分页） */
export function fetchGetTrackOpList() {
  return request<Api.SystemManage.TrackOpList>({
    url: '/track-op/query',
    method: 'post',
    data: {}
  });
}

/** 批量保存操作轨迹配置（真实接口 /track-op/update，整表提交） */
export function fetchBatchUpdateTrackOp(list: Api.SystemManage.TrackOpItem[]) {
  return request<null>({
    url: '/track-op/update',
    method: 'post',
    data: { list }
  });
}
