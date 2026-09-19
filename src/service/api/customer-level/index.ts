import { request } from '../../request';

// 以下均为真实接口（tms-user /api/v1/web/customer-level/*），flat 请求需调用方解包 { data, error }

/** 客户等级分页列表（真实接口 /customer-level/query，返回 ret:{ list, total }，固定 sort:{num:1}） */
export function fetchGetCustomerLevelPageList(params: Api.SystemManage.CustomerLevelSearchParams) {
  const { current, size, keyword, status } = params;
  const where: Record<string, unknown> = {};
  if (status !== undefined && status !== null) where.status = status;

  return request<Api.SystemManage.CustomerLevelList>({
    url: '/customer-level/query',
    method: 'post',
    data: {
      page: current,
      size,
      keyword: keyword?.trim() || undefined,
      where
    }
  });
}

/** 客户等级详情（真实接口 /customer-level/get） */
export function fetchGetCustomerLevel(id: string) {
  return request<Api.SystemManage.CustomerLevelItem>({
    url: '/customer-level/get',
    method: 'post',
    data: { _id: id }
  });
}

/** 新增客户等级（真实接口 /customer-level/create，name 必填且唯一，num 由后端自动重排） */
export function fetchCreateCustomerLevel(params: Api.SystemManage.CustomerLevelSaveParams) {
  return request<null>({
    url: '/customer-level/create',
    method: 'post',
    data: params
  });
}

/**
 * 修改客户等级（真实接口 /customer-level/update，需 _id）
 *
 * 后端走 updateCommon({ uniqField: 'name' })：局部更新缺 name 会参与唯一性判断并写入 nameUpdate 脏字段，
 * 因此调用方必须随行回传 name（编辑抽屉已保证）。
 */
export function fetchUpdateCustomerLevel(params: Api.SystemManage.CustomerLevelUpdateParams) {
  return request<null>({
    url: '/customer-level/update',
    method: 'post',
    data: params
  });
}

/** 删除客户等级（真实接口 /customer-level/delete，有关联客户时后端抛出 DEL_ERROR 由拦截器统一弹错） */
export function fetchDeleteCustomerLevel(id: string) {
  return request<null>({
    url: '/customer-level/delete',
    method: 'post',
    data: { _id: id }
  });
}
