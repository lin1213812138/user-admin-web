import { request } from '../../request';

/**
 * 轨迹信息改造规则接口（系统设置 → 轨迹抓取 → 追踪网络 → 轨迹信息改造），对应 tms-user /track-replace/*（模型：track-replace）。
 * tms-user 真实接口，无 DEV mock。flat request，调用方需解包 { data, error }。
 */

/** 按 configId 拉取该追踪网络全部改造规则（单网络规则量小，size 拉满） */
export function fetchGetTrackReplaceList(params: { where: { configId: string }; page?: number; size?: number }) {
  return request<Api.SystemManage.TraceReplaceList>({
    url: '/track-replace/query',
    method: 'post',
    data: params
  });
}

/** 批量保存（增/删/改一步到位，后端按 _id 差集处理） */
export function fetchBatchSaveTrackReplace(params: Api.SystemManage.TraceReplaceBatchSaveParams) {
  return request<boolean>({ url: '/track-replace/batch/save', method: 'post', data: params });
}
