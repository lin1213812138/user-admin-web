import { request } from '../../request';

// 以下均为真实接口（tms-user /api/v1/web/customer-source/*）；注意后端无 delete 路由

/** 客户来源分页列表（真实接口 /customer-source/query，返回 ret:{ list, total }，固定 sort:{order:1}） */
export function fetchGetCustomerSourcePageList(params: Api.SystemManage.CustomerSourceSearchParams) {
  const { current, size, keyword, status } = params;
  const where: Record<string, unknown> = {};
  if (status !== undefined && status !== null) where.status = status;

  return request<Api.SystemManage.CustomerSourceList>({
    url: '/customer-source/query',
    method: 'post',
    data: { page: current, size, keyword: keyword?.trim() || undefined, where }
  });
}

/** 客户来源详情（真实接口 /customer-source/get） */
export function fetchGetCustomerSource(id: string) {
  return request<Api.SystemManage.CustomerSourceItem>({
    url: '/customer-source/get',
    method: 'post',
    data: { _id: id }
  });
}

/** 新增客户来源（真实接口 /customer-source/create，name 必填且唯一） */
export function fetchCreateCustomerSource(params: Api.SystemManage.CustomerSourceSaveParams) {
  return request<null>({ url: '/customer-source/create', method: 'post', data: params });
}

/** 修改客户来源（/customer-source/update，需 _id；后端 updateCommon({ uniqField: 'name' }) 要求随行回传 name） */
export function fetchUpdateCustomerSource(params: Api.SystemManage.CustomerSourceUpdateParams) {
  return request<null>({ url: '/customer-source/update', method: 'post', data: params });
}
