import { request } from '../../request';

// 以下均为真实接口（tms-user /api/v1/web/group/*），flat 请求需调用方解包 { data, error }

/** get group list（真实接口 /group/query，queryAllCommon 全量查询无分页；keyword 对 name 正则模糊匹配） */
export function fetchGetGroupList(params: Api.SystemManage.GroupSearchParams = {}) {
  return request<Api.SystemManage.GroupList>({
    url: '/group/query',
    method: 'post',
    data: params
  });
}

/** get group detail by id（真实接口 /group/get，附带 userCount / customerCount） */
export function fetchGetGroup(id: string) {
  return request<Api.SystemManage.Group>({
    url: '/group/get',
    method: 'post',
    data: { _id: id }
  });
}

/** create group（真实接口 /group/create，siteId 须为合法 MongoId、name 必填且全局唯一） */
export function fetchCreateGroup(params: Api.SystemManage.GroupCreateParams) {
  return request<null>({
    url: '/group/create',
    method: 'post',
    data: params
  });
}

/** update group（真实接口 /group/update，name 唯一校验） */
export function fetchUpdateGroup(params: Api.SystemManage.GroupUpdateParams) {
  return request<null>({
    url: '/group/update',
    method: 'post',
    data: params
  });
}

/** get group relation users（真实接口 /user/query，where.groupIds 数组成员匹配，flat 请求需调用方解包 { data, error }） */
export function fetchGetGroupUserList(params: { page: number; size: number; groupId: string }) {
  return request<Api.SystemManage.UserList>({
    url: '/user/query',
    method: 'post',
    data: { page: params.page, size: params.size, where: { groupIds: params.groupId } }
  });
}

/** get group relation customers（真实接口 /customer/query，where.groupId 精确过滤，flat 请求需调用方解包 { data, error }） */
export function fetchGetGroupCustomerList(params: { page: number; size: number; groupId: string }) {
  return request<Api.SystemManage.SiteCustomerList>({
    url: '/customer/query',
    method: 'post',
    data: { page: params.page, size: params.size, where: { groupId: params.groupId } }
  });
}

/** delete group by id（真实接口 /group/delete，后端为单条删除；组内用户/客户 groupId 由后端置空） */
export function fetchDeleteGroup(id: string) {
  return request<null>({
    url: '/group/delete',
    method: 'post',
    data: { _id: id }
  });
}
