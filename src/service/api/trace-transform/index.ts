import { request } from '../../request';
import {
  mockCreateTraceTransform,
  mockDeleteTraceTransform,
  mockGetTraceTransformList,
  mockUpdateTraceTransform
} from '../mock';

/** get trace transform list（轨迹改造 - 异常状态定义） */
export function fetchGetTraceTransformList(params: Api.SystemManage.TraceTransformSearchParams) {
  if (import.meta.env.DEV) {
    return mockGetTraceTransformList(params) as unknown as Promise<Api.SystemManage.TraceTransformList>;
  }
  return request<Api.SystemManage.TraceTransformList>({
    url: '/system/trace-transform/list',
    method: 'post',
    data: params
  });
}

/** create trace transform */
export function fetchCreateTraceTransform(params: Api.SystemManage.TraceTransformCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateTraceTransform(params) as unknown as Promise<Api.SystemManage.TraceTransformItem>;
  }
  return request<Api.SystemManage.TraceTransformItem>({
    url: '/system/trace-transform/create',
    method: 'post',
    data: params
  });
}

/** update trace transform */
export function fetchUpdateTraceTransform(params: Api.SystemManage.TraceTransformUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateTraceTransform(params) as unknown as Promise<Api.SystemManage.TraceTransformItem>;
  }
  return request<Api.SystemManage.TraceTransformItem>({
    url: '/system/trace-transform/update',
    method: 'post',
    data: params
  });
}

/** delete trace transform by ids */
export function fetchDeleteTraceTransform(ids: number[]) {
  if (import.meta.env.DEV) {
    return mockDeleteTraceTransform(ids) as unknown as Promise<boolean>;
  }

  return request<boolean>({
    url: '/system/trace-transform/delete',
    method: 'post',
    data: { ids }
  });
}
