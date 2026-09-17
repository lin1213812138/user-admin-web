import { request } from '../../request';

// 以下均为真实接口（tms-user /api/v1/web/customer/*），flat 请求需调用方解包 { data, error }

/** get customer list（真实接口 /customer/query，scene=1 管理列表含停用客户；keyword 匹配 code/name/account） */
export function fetchGetCustomerList(params: Api.SystemManage.CustomerSearchParams) {
  return request<Api.SystemManage.CustomerList>({
    url: '/customer/query',
    method: 'post',
    data: params
  });
}

/** get customer detail by id（真实接口 /customer/get，附带 billMode/level/source/group 名称回填） */
export function fetchGetCustomer(id: string) {
  return request<Api.SystemManage.Customer>({
    url: '/customer/get',
    method: 'post',
    data: { _id: id }
  });
}

/** create customer（真实接口 /customer/create，name/account 必填且唯一，code 不传后端按单号规则自动生成） */
export function fetchCreateCustomer(params: Api.SystemManage.CustomerCreateParams) {
  return request<null>({
    url: '/customer/create',
    method: 'post',
    data: params
  });
}

/** update customer（真实接口 /customer/update，改 account 时后端校验唯一并同步 upperAccount） */
export function fetchUpdateCustomer(params: Api.SystemManage.CustomerUpdateParams) {
  return request<null>({
    url: '/customer/update',
    method: 'post',
    data: params
  });
}

/** update customer partial（真实接口 /customer/update，后端仅赋值传入字段；详情页局部更新 webStatus/apiStatus 用，绕开全量必填 name/account） */
export function fetchUpdateCustomerPartial(
  params: { _id: string } & Partial<Pick<Api.SystemManage.Customer, 'webStatus' | 'apiStatus'>>
) {
  return request<null>({
    url: '/customer/update',
    method: 'post',
    data: params
  });
}

/** reset customer password（真实接口 /customer/password/reset，后端固定重置为初始密码 pwd123456，无返回值） */
export function fetchResetCustomerPassword(id: string) {
  return request<null>({
    url: '/customer/password/reset',
    method: 'post',
    data: { _id: id }
  });
}

/** get customer level options（真实接口 /customer-level/query，字典下拉用，只取启用项） */
export function fetchGetCustomerLevelList() {
  return request<Api.SystemManage.CustomerLevelList>({
    url: '/customer-level/query',
    method: 'post',
    data: { page: 1, size: 999, where: { status: 1 } }
  });
}

/** get customer source options（真实接口 /customer-source/query，字典下拉用，只取启用项） */
export function fetchGetCustomerSourceList() {
  return request<Api.SystemManage.CustomerSourceList>({
    url: '/customer-source/query',
    method: 'post',
    data: { page: 1, size: 999, where: { status: 1 } }
  });
}

/** get bill mode options（真实接口 /bill-mode/query，结算方式下拉用，只取启用项） */
export function fetchGetBillModeList() {
  return request<Api.SystemManage.BillModeList>({
    url: '/bill-mode/query',
    method: 'post',
    data: { page: 1, size: 999, where: { status: 1 } }
  });
}
