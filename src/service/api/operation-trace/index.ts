import { request } from '../../request';
import { mockCreateOperationTrace, mockGetOperationTraceList, mockUpdateOperationTrace } from '../mock';

/** get operation trace list */
export function fetchGetOperationTraceList(params: Api.SystemManage.OperationTraceSearchParams) {
  if (import.meta.env.DEV) {
    return mockGetOperationTraceList(params) as unknown as Promise<Api.SystemManage.OperationTraceList>;
  }
  return request<Api.SystemManage.OperationTraceList>({
    url: '/system/operation-trace/list',
    method: 'post',
    data: params
  });
}

/** create operation trace */
export function fetchCreateOperationTrace(params: Api.SystemManage.OperationTraceCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateOperationTrace(params) as unknown as Promise<Api.SystemManage.OperationTraceItem>;
  }
  return request<Api.SystemManage.OperationTraceItem>({
    url: '/system/operation-trace/create',
    method: 'post',
    data: params
  });
}

/** update operation trace */
export function fetchUpdateOperationTrace(params: Api.SystemManage.OperationTraceUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateOperationTrace(params) as unknown as Promise<Api.SystemManage.OperationTraceItem>;
  }
  return request<Api.SystemManage.OperationTraceItem>({
    url: '/system/operation-trace/update',
    method: 'post',
    data: params
  });
}
