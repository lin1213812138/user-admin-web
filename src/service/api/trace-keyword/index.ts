import { request } from '../../request';

/**
 * 轨迹关键词接口（track-status-config），tms-user 真实接口（无 DEV mock）。
 * flat request，调用方需解包 { data, error }。
 * 分页契约：{ page, size, keyword, where } → { list, total }；delete 仅单条 _id。
 */

/** 轨迹关键词列表（keyword 只搜名称） */
export function fetchGetTraceKeywordList(params: Api.SystemManage.TraceKeywordSearchParams) {
  return request<Api.SystemManage.TraceKeywordList>({
    url: '/track-status-config/query',
    method: 'post',
    data: params
  });
}

/** 新建轨迹关键词（name 后端唯一校验） */
export function fetchCreateTraceKeyword(params: Api.SystemManage.TraceKeywordCreateParams) {
  return request<Record<string, never>>({ url: '/track-status-config/create', method: 'post', data: params });
}

/** 更新轨迹关键词（必填 _id） */
export function fetchUpdateTraceKeyword(params: Api.SystemManage.TraceKeywordUpdateParams) {
  return request<Record<string, never>>({ url: '/track-status-config/update', method: 'post', data: params });
}

/** 删除轨迹关键词（仅单条 _id） */
export function fetchDeleteTraceKeyword(id: string) {
  return request<Record<string, never>>({ url: '/track-status-config/delete', method: 'post', data: { _id: id } });
}
