import { request } from '../request';
import type { MasterDataRow } from '@/components/MasterData/types';
import { mockArchiveCreate, mockArchiveDelete, mockArchiveList, mockArchiveUpdate } from './mock-data-manage';

/** get archive list (DEV: mock; PROD: /data-manage/:archive/list) */
export function fetchGetDataManageList<T extends MasterDataRow>(
  archive: Api.DataManage.DataManageArchiveKey,
  params: Api.DataManage.ArchiveSearchParams
) {
  if (import.meta.env.DEV) {
    return mockArchiveList<T>(archive, params) as unknown as Promise<Api.DataManage.ArchiveList<T>>;
  }
  return request<Api.DataManage.ArchiveList<T>>({
    url: `/data-manage/${archive}/list`,
    method: 'post',
    data: params
  }) as unknown as Promise<Api.DataManage.ArchiveList<T>>;
}

/** create archive item (DEV: mock; PROD: /data-manage/:archive/create) */
export function fetchCreateDataManage<T extends MasterDataRow>(
  archive: Api.DataManage.DataManageArchiveKey,
  params: Partial<T>
) {
  if (import.meta.env.DEV) {
    return mockArchiveCreate<T>(archive, params) as unknown as Promise<T>;
  }
  return request<T>({
    url: `/data-manage/${archive}/create`,
    method: 'post',
    data: params
  }) as unknown as Promise<T>;
}

/** update archive item (DEV: mock; PROD: /data-manage/:archive/update) */
export function fetchUpdateDataManage<T extends MasterDataRow>(
  archive: Api.DataManage.DataManageArchiveKey,
  params: T
) {
  if (import.meta.env.DEV) {
    return mockArchiveUpdate<T>(archive, params) as unknown as Promise<T>;
  }
  return request<T>({
    url: `/data-manage/${archive}/update`,
    method: 'post',
    data: params
  }) as unknown as Promise<T>;
}

/** delete archive items by ids (DEV: mock; PROD: /data-manage/:archive/delete) */
export function fetchDeleteDataManage(archive: Api.DataManage.DataManageArchiveKey, ids: number[]) {
  if (import.meta.env.DEV) {
    return mockArchiveDelete(archive, ids) as unknown as Promise<boolean>;
  }
  return request<boolean>({
    url: `/data-manage/${archive}/delete`,
    method: 'post',
    data: { ids }
  }) as unknown as Promise<boolean>;
}
