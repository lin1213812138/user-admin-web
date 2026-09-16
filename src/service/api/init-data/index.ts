import { request } from '../../request';
import { mockCreateInitData, mockDeleteInitData, mockGetInitDataList, mockUpdateInitData } from '../mock';

/** get init data list */
export function fetchGetInitDataList(params: Api.SystemManage.InitDataSearchParams) {
  if (import.meta.env.DEV) {
    return mockGetInitDataList(params) as unknown as Promise<Api.SystemManage.InitDataList>;
  }

  return request<Api.SystemManage.InitDataList>({
    url: '/system/init-data/list',
    method: 'post',
    data: params
  });
}

/** create init data */
export function fetchCreateInitData(params: Api.SystemManage.InitDataCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateInitData(params) as unknown as Promise<Api.SystemManage.InitDataItem>;
  }

  return request<Api.SystemManage.InitDataItem>({
    url: '/system/init-data/create',
    method: 'post',
    data: params
  });
}

/** update init data */
export function fetchUpdateInitData(params: Api.SystemManage.InitDataUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateInitData(params) as unknown as Promise<Api.SystemManage.InitDataItem>;
  }

  return request<Api.SystemManage.InitDataItem>({
    url: '/system/init-data/update',
    method: 'post',
    data: params
  });
}

/** delete init data by ids */
export function fetchDeleteInitData(ids: number[]) {
  if (import.meta.env.DEV) {
    return mockDeleteInitData(ids) as unknown as Promise<boolean>;
  }

  return request<boolean>({
    url: '/system/init-data/delete',
    method: 'post',
    data: { ids }
  });
}
