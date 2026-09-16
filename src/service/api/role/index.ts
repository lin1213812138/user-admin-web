import { request } from '../../request';
import { mockAssignRoleMenu, mockGetRoleMenuTree } from '../mock';

// 除权限树两个函数暂走 mock 外，其余均为真实接口（tms-user /api/v1/web/role/*），flat 请求需调用方解包 { data, error }

/** get role list（真实接口 /role/query，queryAllCommon 全量查询无分页，后端按 order 升序返回） */
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams = {}) {
  return request<Api.SystemManage.RoleList>({
    url: '/role/query',
    method: 'post',
    data: params
  });
}

/** get role query list（真实接口 /role/query 全量，供用户管理等模块选角色用） */
export function fetchGetRoleQueryList(params: { keyword?: string; keywordFields?: string[] } = {}) {
  return request<Api.SystemManage.RoleQueryList>({
    url: '/role/query',
    method: 'post',
    data: params
  });
}

/** get role detail by id（真实接口 /role/get） */
export function fetchGetRole(id: string) {
  return request<Api.SystemManage.Role>({
    url: '/role/get',
    method: 'post',
    data: { _id: id }
  });
}

/** create role（真实接口 /role/create，name 必填且全局唯一；传 refId 时后端自动复制被套用角色的 auths，审计字段由后端填充） */
export function fetchCreateRole(params: Api.SystemManage.RoleCreateParams) {
  return request<null>({
    url: '/role/create',
    method: 'post',
    data: params
  });
}

/** update role（真实接口 /role/update，name 唯一校验；refId 变更时后端做 auths 差集/并集合并） */
export function fetchUpdateRole(params: Api.SystemManage.RoleUpdateParams) {
  return request<null>({
    url: '/role/update',
    method: 'post',
    data: params
  });
}

/** delete role by id（真实接口 /role/delete，后端为单条删除） */
export function fetchDeleteRole(id: string) {
  return request<null>({
    url: '/role/delete',
    method: 'post',
    data: { _id: id }
  });
}

/** get role permission menu tree（权限对接另起设计，暂走 mock） */
export function fetchGetRoleMenuTree(roleId: string) {
  if (import.meta.env.DEV) {
    return mockGetRoleMenuTree(roleId) as unknown as Promise<Api.SystemManage.RoleMenuTree>;
  }

  return request<Api.SystemManage.RoleMenuTree>({
    url: '/system/role/menuTree',
    method: 'get',
    params: { roleId }
  });
}

/** assign menu permissions to role（权限对接另起设计，暂走 mock） */
export function fetchAssignRoleMenu(params: Api.SystemManage.RoleAssignMenuParams) {
  if (import.meta.env.DEV) {
    return mockAssignRoleMenu(params) as unknown as Promise<boolean>;
  }

  return request<boolean>({
    url: '/system/role/assignMenu',
    method: 'post',
    data: params
  });
}
