import { request } from '../../request';

// 以下均为真实接口（tms-user /api/v1/web/user/*），flat 请求需调用方解包 { data, error }

/** get user list（真实接口 /user/query，queryCommon 分页；keyword 固定匹配 name/fullName/account） */
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request<Api.SystemManage.UserList>({
    url: '/user/query',
    method: 'post',
    data: params
  });
}

/** get user detail by id（真实接口 /user/get，返回全字段并回填 site/group/role 名称） */
export function fetchGetUser(id: string) {
  return request<Api.SystemManage.User>({
    url: '/user/get',
    method: 'post',
    data: { _id: id }
  });
}

/** create user（真实接口 /user/create，后端必填 account/password/siteId，account + name 唯一，密码后端加密） */
export function fetchCreateUser(params: Api.SystemManage.UserCreateParams) {
  return request<null>({
    url: '/user/create',
    method: 'post',
    data: params
  });
}

/** update user（真实接口 /user/update，password 缺省则不改密码；改自己密码后端会强制重新登录） */
export function fetchUpdateUser(params: Api.SystemManage.UserUpdateParams) {
  return request<null>({
    url: '/user/update',
    method: 'post',
    data: params
  });
}

/** update self profile（个人中心，真实接口同为 /user/update；仅提交可编辑字段，account/siteId/status/roleIds/groupIds 不可改） */
export function fetchUpdateSelfProfile(params: Api.SystemManage.UserSelfUpdateParams) {
  return request<null>({
    url: '/user/update',
    method: 'post',
    data: params
  });
}

/** delete user by id（真实接口 /user/delete，单条删除；管理员账号/本人/绑定客户的业务员会被后端拒绝） */
export function fetchDeleteUser(id: string) {
  return request<null>({
    url: '/user/delete',
    method: 'post',
    data: { _id: id }
  });
}
