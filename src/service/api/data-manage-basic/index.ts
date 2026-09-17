import { request } from '../../request';

/**
 * 通用资料 - 国家地区（/country）与 FBA 仓库（/fba），均为 tms-user 真实接口（无 DEV mock）。
 * 通用分页契约：{ page, size, keyword, where } → { list, total }；
 * create/update 收 body（create 无需 _id，update 必填 _id）；delete 收 { ids: string[] }。
 */

// ---- 国家地区 /country ----

export interface CountryQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
  where?: Record<string, unknown>;
}

export interface CountryQueryResult {
  list: Api.DataManage.BasicCountryRegion[];
  total: number;
}

export function fetchGetCountryList(params: CountryQueryParams) {
  return request<CountryQueryResult>({ url: '/country/query', method: 'post', data: params });
}
export function fetchCreateCountry(params: Partial<Api.DataManage.BasicCountryRegion>) {
  return request<unknown>({ url: '/country/create', method: 'post', data: params });
}
export function fetchUpdateCountry(params: Partial<Api.DataManage.BasicCountryRegion>) {
  return request<unknown>({ url: '/country/update', method: 'post', data: params });
}
export function fetchDeleteCountry(ids: string[]) {
  return request<unknown>({ url: '/country/delete', method: 'post', data: { ids } });
}

// ---- FBA 仓库 /fba ----

export interface FbaWarehouseQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
  where?: Record<string, unknown>;
}

export interface FbaWarehouseQueryResult {
  list: Api.DataManage.BasicFbaWarehouse[];
  total: number;
}

export function fetchGetFbaWarehouseList(params: FbaWarehouseQueryParams) {
  return request<FbaWarehouseQueryResult>({ url: '/fba/query', method: 'post', data: params });
}
export function fetchCreateFbaWarehouse(params: Partial<Api.DataManage.BasicFbaWarehouse>) {
  return request<unknown>({ url: '/fba/create', method: 'post', data: params });
}
export function fetchUpdateFbaWarehouse(params: Partial<Api.DataManage.BasicFbaWarehouse>) {
  return request<unknown>({ url: '/fba/update', method: 'post', data: params });
}
export function fetchDeleteFbaWarehouse(ids: string[]) {
  return request<unknown>({ url: '/fba/delete', method: 'post', data: { ids } });
}
