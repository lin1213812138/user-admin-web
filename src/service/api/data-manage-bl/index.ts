import { request } from '../../request';

/**
 * 提单资料接口（航线 / 港口 / 航名航次 / 地址簿 / 柜型 / 轨迹配置），全部为 tms-user 真实接口（无 DEV mock）。
 * 均为 flat request，调用方需解包 { data, error }。
 * 通用分页契约：{ page, size, keyword, where } → { list, total }；create/update 返回布尔；delete 仅单 _id。
 */

// ---- 航线 /bl-route ----

export function fetchGetBlRouteList(params: Api.DataManageBl.BlQueryParams) {
  return request<Api.DataManageBl.BlQueryResult<Api.DataManageBl.BlRoute>>({
    url: '/bl-route/query',
    method: 'post',
    data: params
  });
}
export function fetchCreateBlRoute(params: Partial<Api.DataManageBl.BlRoute>) {
  return request<boolean>({ url: '/bl-route/create', method: 'post', data: params });
}
export function fetchUpdateBlRoute(params: Partial<Api.DataManageBl.BlRoute>) {
  return request<boolean>({ url: '/bl-route/update', method: 'post', data: params });
}
export function fetchDeleteBlRoute(id: string) {
  return request<boolean>({ url: '/bl-route/delete', method: 'post', data: { _id: id } });
}

// ---- 港口 /bl-port ----

export function fetchGetBlPortList(params: Api.DataManageBl.BlQueryParams) {
  return request<Api.DataManageBl.BlQueryResult<Api.DataManageBl.BlPort>>({
    url: '/bl-port/query',
    method: 'post',
    data: params
  });
}
export function fetchCreateBlPort(params: Partial<Api.DataManageBl.BlPort>) {
  return request<boolean>({ url: '/bl-port/create', method: 'post', data: params });
}
export function fetchUpdateBlPort(params: Partial<Api.DataManageBl.BlPort>) {
  return request<boolean>({ url: '/bl-port/update', method: 'post', data: params });
}
export function fetchDeleteBlPort(id: string) {
  return request<boolean>({ url: '/bl-port/delete', method: 'post', data: { _id: id } });
}

// ---- 航名航次 /bl-trip ----

export function fetchGetBlTripList(params: Api.DataManageBl.BlQueryParams) {
  return request<Api.DataManageBl.BlQueryResult<Api.DataManageBl.BlTrip>>({
    url: '/bl-trip/query',
    method: 'post',
    data: params
  });
}
export function fetchCreateBlTrip(params: Partial<Api.DataManageBl.BlTrip>) {
  return request<boolean>({ url: '/bl-trip/create', method: 'post', data: params });
}
export function fetchUpdateBlTrip(params: Partial<Api.DataManageBl.BlTrip>) {
  return request<boolean>({ url: '/bl-trip/update', method: 'post', data: params });
}
export function fetchDeleteBlTrip(id: string) {
  return request<boolean>({ url: '/bl-trip/delete', method: 'post', data: { _id: id } });
}

// ---- 提单地址簿 /bl-address ----

export function fetchGetBlAddressList(params: Api.DataManageBl.BlQueryParams) {
  return request<Api.DataManageBl.BlQueryResult<Api.DataManageBl.BlAddress>>({
    url: '/bl-address/query',
    method: 'post',
    data: params
  });
}
export function fetchCreateBlAddress(params: Partial<Api.DataManageBl.BlAddress>) {
  return request<boolean>({ url: '/bl-address/create', method: 'post', data: params });
}
export function fetchUpdateBlAddress(params: Partial<Api.DataManageBl.BlAddress>) {
  return request<boolean>({ url: '/bl-address/update', method: 'post', data: params });
}
export function fetchDeleteBlAddress(id: string) {
  return request<boolean>({ url: '/bl-address/delete', method: 'post', data: { _id: id } });
}

// ---- 柜型 /bl-unit ----

export function fetchGetBlUnitList(params: Api.DataManageBl.BlQueryParams) {
  return request<Api.DataManageBl.BlQueryResult<Api.DataManageBl.BlUnit>>({
    url: '/bl-unit/query',
    method: 'post',
    data: params
  });
}
export function fetchCreateBlUnit(params: Partial<Api.DataManageBl.BlUnit>) {
  return request<boolean>({ url: '/bl-unit/create', method: 'post', data: params });
}
export function fetchUpdateBlUnit(params: Partial<Api.DataManageBl.BlUnit>) {
  return request<boolean>({ url: '/bl-unit/update', method: 'post', data: params });
}
export function fetchDeleteBlUnit(id: string) {
  return request<boolean>({ url: '/bl-unit/delete', method: 'post', data: { _id: id } });
}

// ---- 轨迹配置 /track-config ----

export function fetchGetTrackConfigList(params: Api.DataManageBl.BlQueryParams) {
  return request<Api.DataManageBl.BlQueryResult<Api.DataManageBl.TrackConfig>>({
    url: '/track-config/query',
    method: 'post',
    data: params
  });
}
export function fetchCreateTrackConfig(params: Partial<Api.DataManageBl.TrackConfig>) {
  return request<boolean>({ url: '/track-config/create', method: 'post', data: params });
}
export function fetchUpdateTrackConfig(params: Partial<Api.DataManageBl.TrackConfig>) {
  return request<boolean>({ url: '/track-config/update', method: 'post', data: params });
}
export function fetchDeleteTrackConfig(id: string) {
  return request<boolean>({ url: '/track-config/delete', method: 'post', data: { _id: id } });
}
