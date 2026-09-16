import { request } from '../../request';
import { mockCreateTraceConfig, mockGetTraceConfigList, mockUpdateTraceConfig } from '../mock';

/** get trace config list (前 4 个同构子 tab) */
export function fetchGetTraceConfigList(params: Api.SystemManage.TraceConfigSearchParams) {
  if (import.meta.env.DEV) {
    return mockGetTraceConfigList(params) as unknown as Promise<Api.SystemManage.TraceConfigList>;
  }
  return request<Api.SystemManage.TraceConfigList>({
    url: '/system/trace-config/list',
    method: 'post',
    data: params
  });
}

/** create trace config */
export function fetchCreateTraceConfig(params: Api.SystemManage.TraceConfigCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateTraceConfig(params) as unknown as Promise<Api.SystemManage.TraceConfigItem>;
  }
  return request<Api.SystemManage.TraceConfigItem>({
    url: '/system/trace-config/create',
    method: 'post',
    data: params
  });
}

/** update trace config */
export function fetchUpdateTraceConfig(params: Api.SystemManage.TraceConfigUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateTraceConfig(params) as unknown as Promise<Api.SystemManage.TraceConfigItem>;
  }
  return request<Api.SystemManage.TraceConfigItem>({
    url: '/system/trace-config/update',
    method: 'post',
    data: params
  });
}
