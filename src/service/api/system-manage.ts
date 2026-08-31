import { request } from '../request';
import {
  mockAssignRoleMenu,
  mockCreateMenu,
  mockCreateRole,
  mockCreateUser,
  mockDeleteMenu,
  mockDeleteRole,
  mockGetRoleMenuTree,
  mockMenuList,
  mockRoleList,
  mockUpdateMenu,
  mockUpdateRole,
  mockUserList
} from './mock';

/** get user list */
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  if (import.meta.env.DEV) {
    return mockUserList(params) as unknown as Promise<Api.SystemManage.UserList>;
  }

  return request<Api.SystemManage.UserList>({
    url: '/system/user/list',
    method: 'post',
    data: params
  });
}

/** create user */
export function fetchCreateUser(params: Api.SystemManage.UserCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateUser(params) as unknown as Promise<Api.SystemManage.User>;
  }

  return request<Api.SystemManage.User>({
    url: '/system/user/create',
    method: 'post',
    data: params
  });
}

/** update user */
export function fetchUpdateUser(params: Api.SystemManage.UserUpdateParams) {
  if (import.meta.env.DEV) {
    return Promise.resolve({ ...params } as unknown as Api.SystemManage.User);
  }

  return request<Api.SystemManage.User>({
    url: '/system/user/update',
    method: 'post',
    data: params
  });
}

/** get role list */
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  if (import.meta.env.DEV) {
    return mockRoleList(params) as unknown as Promise<Api.SystemManage.RoleList>;
  }

  return request<Api.SystemManage.RoleList>({
    url: '/system/role/list',
    method: 'post',
    data: params
  });
}

/** create role */
export function fetchCreateRole(params: Api.SystemManage.RoleCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateRole(params) as unknown as Promise<Api.SystemManage.Role>;
  }

  return request<Api.SystemManage.Role>({
    url: '/system/role/create',
    method: 'post',
    data: params
  });
}

/** update role */
export function fetchUpdateRole(params: Api.SystemManage.RoleUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateRole(params) as unknown as Promise<Api.SystemManage.Role>;
  }

  return request<Api.SystemManage.Role>({
    url: '/system/role/update',
    method: 'post',
    data: params
  });
}

/** delete role by ids */
export function fetchDeleteRole(ids: number[]) {
  if (import.meta.env.DEV) {
    return mockDeleteRole(ids) as unknown as Promise<boolean>;
  }

  return request<boolean>({
    url: '/system/role/delete',
    method: 'post',
    data: { ids }
  });
}

/** get role permission menu tree */
export function fetchGetRoleMenuTree(roleId: number) {
  if (import.meta.env.DEV) {
    return mockGetRoleMenuTree(roleId) as unknown as Promise<Api.SystemManage.RoleMenuTree>;
  }

  return request<Api.SystemManage.RoleMenuTree>({
    url: '/system/role/menuTree',
    method: 'get',
    params: { roleId }
  });
}

/** assign menu permissions to role */
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

/** get menu list (flat array, built to tree at frontend) */
export function fetchGetMenuList(params: Api.SystemManage.MenuSearchParams) {
  if (import.meta.env.DEV) {
    return mockMenuList(params) as unknown as Promise<Api.SystemManage.MenuList>;
  }

  return request<Api.SystemManage.MenuList>({
    url: '/system/menu/list',
    method: 'post',
    data: params
  });
}

/** create menu */
export function fetchCreateMenu(params: Api.SystemManage.MenuCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateMenu(params) as unknown as Promise<Api.SystemManage.Menu>;
  }

  return request<Api.SystemManage.Menu>({
    url: '/system/menu/create',
    method: 'post',
    data: params
  });
}

/** update menu */
export function fetchUpdateMenu(params: Api.SystemManage.MenuUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateMenu(params) as unknown as Promise<Api.SystemManage.Menu>;
  }

  return request<Api.SystemManage.Menu>({
    url: '/system/menu/update',
    method: 'post',
    data: params
  });
}

/** delete menu by ids */
export function fetchDeleteMenu(ids: number[]) {
  if (import.meta.env.DEV) {
    return mockDeleteMenu(ids) as unknown as Promise<boolean>;
  }

  return request<boolean>({
    url: '/system/menu/delete',
    method: 'post',
    data: { ids }
  });
}
