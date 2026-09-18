import { request } from '../../request';

// 真实接口（tms-user /api/v1/web/ship-to|shipper/*），flat 请求需调用方解包 { data, error }

/** keyword 匹配字段：后端 queryCommon 必须显式传入 keywordFields，否则 keyword 不生效（匹配姓名/电话/邮编，对齐老系统检索框） */
const ADDRESS_KEYWORD_FIELDS = ['name', 'phone', 'zip'];

/** get ship-to list（真实接口 /ship-to/query，where.customerId 过滤，fillCountry/fillName 回填 country/customer） */
export function fetchGetShipToList(params: Api.SystemManage.CustomerAddressSearchParams) {
  return request<Api.SystemManage.CustomerAddressList>({
    url: '/ship-to/query',
    method: 'post',
    data: { keywordFields: ADDRESS_KEYWORD_FIELDS, ...params }
  });
}

/** create ship-to（真实接口 /ship-to/create，customerId 必填） */
export function fetchCreateShipTo(params: Api.SystemManage.CustomerAddressSaveParams) {
  return request<null>({
    url: '/ship-to/create',
    method: 'post',
    data: params
  });
}

/** update ship-to（真实接口 /ship-to/update，需 _id） */
export function fetchUpdateShipTo(params: Api.SystemManage.CustomerAddressSaveParams) {
  return request<null>({
    url: '/ship-to/update',
    method: 'post',
    data: params
  });
}

/** delete ship-to（真实接口 /ship-to/delete，body 为 ids 字符串数组） */
export function fetchDeleteShipTo(ids: string[]) {
  return request<null>({
    url: '/ship-to/delete',
    method: 'post',
    data: { ids }
  });
}

/** get shipper list（真实接口 /shipper/query，结构同 /ship-to/query） */
export function fetchGetShipperList(params: Api.SystemManage.CustomerAddressSearchParams) {
  return request<Api.SystemManage.CustomerAddressList>({
    url: '/shipper/query',
    method: 'post',
    data: { keywordFields: ADDRESS_KEYWORD_FIELDS, ...params }
  });
}

/** create shipper（真实接口 /shipper/create） */
export function fetchCreateShipper(params: Api.SystemManage.CustomerAddressSaveParams) {
  return request<null>({
    url: '/shipper/create',
    method: 'post',
    data: params
  });
}

/** update shipper（真实接口 /shipper/update） */
export function fetchUpdateShipper(params: Api.SystemManage.CustomerAddressSaveParams) {
  return request<null>({
    url: '/shipper/update',
    method: 'post',
    data: params
  });
}

/** delete shipper（真实接口 /shipper/delete，body 为 ids 字符串数组） */
export function fetchDeleteShipper(ids: string[]) {
  return request<null>({
    url: '/shipper/delete',
    method: 'post',
    data: { ids }
  });
}
