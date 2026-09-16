import { request } from '../../request';
import {
  mockCreateTraceKeyword,
  mockDeleteTraceKeyword,
  mockGetTraceKeywordList,
  mockUpdateTraceKeyword
} from '../mock';

/** get trace keyword list（轨迹关键词 - 匹配规则） */
export function fetchGetTraceKeywordList(params: Api.SystemManage.TraceKeywordSearchParams) {
  if (import.meta.env.DEV) {
    return mockGetTraceKeywordList(params) as unknown as Promise<Api.SystemManage.TraceKeywordList>;
  }
  return request<Api.SystemManage.TraceKeywordList>({
    url: '/system/trace-keyword/list',
    method: 'post',
    data: params
  });
}

/** create trace keyword */
export function fetchCreateTraceKeyword(params: Api.SystemManage.TraceKeywordCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateTraceKeyword(params) as unknown as Promise<Api.SystemManage.TraceKeywordItem>;
  }
  return request<Api.SystemManage.TraceKeywordItem>({
    url: '/system/trace-keyword/create',
    method: 'post',
    data: params
  });
}

/** update trace keyword */
export function fetchUpdateTraceKeyword(params: Api.SystemManage.TraceKeywordUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateTraceKeyword(params) as unknown as Promise<Api.SystemManage.TraceKeywordItem>;
  }
  return request<Api.SystemManage.TraceKeywordItem>({
    url: '/system/trace-keyword/update',
    method: 'post',
    data: params
  });
}

/** delete trace keyword by ids */
export function fetchDeleteTraceKeyword(ids: number[]) {
  if (import.meta.env.DEV) {
    return mockDeleteTraceKeyword(ids) as unknown as Promise<boolean>;
  }

  return request<boolean>({
    url: '/system/trace-keyword/delete',
    method: 'post',
    data: { ids }
  });
}
