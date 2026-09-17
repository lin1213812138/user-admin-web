import { request } from '../../request';

/**
 * 异常轨迹接口（track-err-config 异常状态配置），tms-user 真实接口（无 DEV mock）。
 * flat request，调用方需解包 { data, error }。
 * query 为全量返回 { list }（后端忽略分页）；delete 仅单条 _id。
 */

/** 异常轨迹列表（全量返回，无 total） */
export function fetchGetTraceTransformList(params: { current: number; size: number }) {
  return request<Api.SystemManage.TraceTransformList>({
    url: '/track-err-config/query',
    method: 'post',
    data: params
  });
}

/** 新建异常轨迹（name 后端唯一校验） */
export function fetchCreateTraceTransform(params: Api.SystemManage.TraceTransformCreateParams) {
  return request<Record<string, never>>({ url: '/track-err-config/create', method: 'post', data: params });
}

/** 更新异常轨迹（必填 _id） */
export function fetchUpdateTraceTransform(params: Api.SystemManage.TraceTransformUpdateParams) {
  return request<Record<string, never>>({ url: '/track-err-config/update', method: 'post', data: params });
}

/** 删除异常轨迹（仅单条 _id） */
export function fetchDeleteTraceTransform(id: string) {
  return request<Record<string, never>>({ url: '/track-err-config/delete', method: 'post', data: { _id: id } });
}
