import { request } from '../request';
import {
  mockAssignRoleMenu,
  mockCreateGroup,
  mockCreateMenu,
  mockCreateRole,
  mockCreateSite,
  mockCreateUser,
  mockDeleteGroup,
  mockCustomerList,
  mockCreateCustomer,
  mockUpdateCustomer,
  mockDeleteCustomer,
  mockDeleteMenu,
  mockDeleteRole,
  mockDeleteSite,
  mockGetRoleMenuTree,
  mockGroupList,
  mockMenuList,
  mockRoleList,
  mockSiteList,
  mockUpdateGroup,
  mockUpdateMenu,
  mockUpdateRole,
  mockUpdateSite,
  mockUpdateUser,
  mockUserList,
  mockGetInitDataList,
  mockCreateInitData,
  mockUpdateInitData,
  mockDeleteInitData,
  mockGetTraceConfigList,
  mockCreateTraceConfig,
  mockUpdateTraceConfig,
  mockGetTraceTransformList,
  mockCreateTraceTransform,
  mockUpdateTraceTransform,
  mockDeleteTraceTransform,
  mockGetTraceKeywordList,
  mockCreateTraceKeyword,
  mockUpdateTraceKeyword,
  mockDeleteTraceKeyword,
  mockGetOperationTraceList,
  mockCreateOperationTrace,
  mockUpdateOperationTrace
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
    return mockUpdateUser(params) as unknown as Promise<Api.SystemManage.User>;
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

/** get site list */
export function fetchGetSiteList(params: Api.SystemManage.SiteSearchParams) {
  if (import.meta.env.DEV) {
    return mockSiteList(params) as unknown as Promise<Api.SystemManage.SiteList>;
  }

  return request<Api.SystemManage.SiteList>({
    url: '/system/site/list',
    method: 'post',
    data: params
  });
}

/** create site */
export function fetchCreateSite(params: Api.SystemManage.SiteCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateSite(params) as unknown as Promise<Api.SystemManage.Site>;
  }

  return request<Api.SystemManage.Site>({
    url: '/system/site/create',
    method: 'post',
    data: params
  });
}

/** update site */
export function fetchUpdateSite(params: Api.SystemManage.SiteUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateSite(params) as unknown as Promise<Api.SystemManage.Site>;
  }

  return request<Api.SystemManage.Site>({
    url: '/system/site/update',
    method: 'post',
    data: params
  });
}

/** delete site by ids */
export function fetchDeleteSite(ids: number[]) {
  if (import.meta.env.DEV) {
    return mockDeleteSite(ids) as unknown as Promise<boolean>;
  }

  return request<boolean>({
    url: '/system/site/delete',
    method: 'post',
    data: { ids }
  });
}

/** get group list */
export function fetchGetGroupList(params: Api.SystemManage.GroupSearchParams) {
  if (import.meta.env.DEV) {
    return mockGroupList(params) as unknown as Promise<Api.SystemManage.GroupList>;
  }

  return request<Api.SystemManage.GroupList>({
    url: '/system/group/list',
    method: 'post',
    data: params
  });
}

/** create group */
export function fetchCreateGroup(params: Api.SystemManage.GroupCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateGroup(params) as unknown as Promise<Api.SystemManage.Group>;
  }

  return request<Api.SystemManage.Group>({
    url: '/system/group/create',
    method: 'post',
    data: params
  });
}

/** update group */
export function fetchUpdateGroup(params: Api.SystemManage.GroupUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateGroup(params) as unknown as Promise<Api.SystemManage.Group>;
  }

  return request<Api.SystemManage.Group>({
    url: '/system/group/update',
    method: 'post',
    data: params
  });
}

/** delete group by ids */
export function fetchDeleteGroup(ids: number[]) {
  if (import.meta.env.DEV) {
    return mockDeleteGroup(ids) as unknown as Promise<boolean>;
  }

  return request<boolean>({
    url: '/system/group/delete',
    method: 'post',
    data: { ids }
  });
}

/** get customer list */
export function fetchGetCustomerList(params: Api.SystemManage.CustomerSearchParams) {
  if (import.meta.env.DEV) {
    return mockCustomerList(params) as unknown as Promise<Api.SystemManage.CustomerList>;
  }

  return request<Api.SystemManage.CustomerList>({
    url: '/system/customer/list',
    method: 'post',
    data: params
  });
}

/** create customer */
export function fetchCreateCustomer(params: Api.SystemManage.CustomerCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateCustomer(params) as unknown as Promise<Api.SystemManage.Customer>;
  }

  return request<Api.SystemManage.Customer>({
    url: '/system/customer/create',
    method: 'post',
    data: params
  });
}

/** update customer */
export function fetchUpdateCustomer(params: Api.SystemManage.CustomerUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateCustomer(params) as unknown as Promise<Api.SystemManage.Customer>;
  }

  return request<Api.SystemManage.Customer>({
    url: '/system/customer/update',
    method: 'post',
    data: params
  });
}

/** delete customer by ids */
export function fetchDeleteCustomer(ids: number[]) {
  if (import.meta.env.DEV) {
    return mockDeleteCustomer(ids) as unknown as Promise<boolean>;
  }

  return request<boolean>({
    url: '/system/customer/delete',
    method: 'post',
    data: { ids }
  });
}

/** get init data list */
export function fetchGetInitDataList(params: Api.SystemManage.InitDataSearchParams) {
  if (import.meta.env.DEV) {
    return mockGetInitDataList(params) as unknown as Promise<Api.SystemManage.InitDataList>;
  }

  return request<Api.SystemManage.InitDataList>({
    url: '/system/init-data/list',
    method: 'post',
    data: params
  });
}

/** create init data */
export function fetchCreateInitData(params: Api.SystemManage.InitDataCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateInitData(params) as unknown as Promise<Api.SystemManage.InitDataItem>;
  }

  return request<Api.SystemManage.InitDataItem>({
    url: '/system/init-data/create',
    method: 'post',
    data: params
  });
}

/** update init data */
export function fetchUpdateInitData(params: Api.SystemManage.InitDataUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateInitData(params) as unknown as Promise<Api.SystemManage.InitDataItem>;
  }

  return request<Api.SystemManage.InitDataItem>({
    url: '/system/init-data/update',
    method: 'post',
    data: params
  });
}

/** delete init data by ids */
export function fetchDeleteInitData(ids: number[]) {
  if (import.meta.env.DEV) {
    return mockDeleteInitData(ids) as unknown as Promise<boolean>;
  }

  return request<boolean>({
    url: '/system/init-data/delete',
    method: 'post',
    data: { ids }
  });
}

/** get trace config list (前 4 个同构子 tab) */
export function fetchGetTraceConfigList(params: Api.SystemManage.TraceConfigSearchParams) {
  if (import.meta.env.DEV) {
    return mockGetTraceConfigList(params) as unknown as Promise<Api.SystemManage.TraceConfigList>;
  }
  return request<Api.SystemManage.TraceConfigList>({
    url: '/system/trace-config/list',
    method: 'post',
    data: params
  });
}

/** create trace config */
export function fetchCreateTraceConfig(params: Api.SystemManage.TraceConfigCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateTraceConfig(params) as unknown as Promise<Api.SystemManage.TraceConfigItem>;
  }
  return request<Api.SystemManage.TraceConfigItem>({
    url: '/system/trace-config/create',
    method: 'post',
    data: params
  });
}

/** update trace config */
export function fetchUpdateTraceConfig(params: Api.SystemManage.TraceConfigUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateTraceConfig(params) as unknown as Promise<Api.SystemManage.TraceConfigItem>;
  }
  return request<Api.SystemManage.TraceConfigItem>({
    url: '/system/trace-config/update',
    method: 'post',
    data: params
  });
}

/** get trace transform list（轨迹改造 - 异常状态定义） */
export function fetchGetTraceTransformList(params: Api.SystemManage.TraceTransformSearchParams) {
  if (import.meta.env.DEV) {
    return mockGetTraceTransformList(params) as unknown as Promise<Api.SystemManage.TraceTransformList>;
  }
  return request<Api.SystemManage.TraceTransformList>({
    url: '/system/trace-transform/list',
    method: 'post',
    data: params
  });
}

/** create trace transform */
export function fetchCreateTraceTransform(params: Api.SystemManage.TraceTransformCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateTraceTransform(params) as unknown as Promise<Api.SystemManage.TraceTransformItem>;
  }
  return request<Api.SystemManage.TraceTransformItem>({
    url: '/system/trace-transform/create',
    method: 'post',
    data: params
  });
}

/** update trace transform */
export function fetchUpdateTraceTransform(params: Api.SystemManage.TraceTransformUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateTraceTransform(params) as unknown as Promise<Api.SystemManage.TraceTransformItem>;
  }
  return request<Api.SystemManage.TraceTransformItem>({
    url: '/system/trace-transform/update',
    method: 'post',
    data: params
  });
}

/** delete trace transform by ids */
export function fetchDeleteTraceTransform(ids: number[]) {
  if (import.meta.env.DEV) {
    return mockDeleteTraceTransform(ids) as unknown as Promise<boolean>;
  }

  return request<boolean>({
    url: '/system/trace-transform/delete',
    method: 'post',
    data: { ids }
  });
}

/** get trace keyword list（轨迹关键词 - 匹配规则） */
export function fetchGetTraceKeywordList(params: Api.SystemManage.TraceKeywordSearchParams) {
  if (import.meta.env.DEV) {
    return mockGetTraceKeywordList(params) as unknown as Promise<Api.SystemManage.TraceKeywordList>;
  }
  return request<Api.SystemManage.TraceKeywordList>({
    url: '/system/trace-keyword/list',
    method: 'post',
    data: params
  });
}

/** create trace keyword */
export function fetchCreateTraceKeyword(params: Api.SystemManage.TraceKeywordCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateTraceKeyword(params) as unknown as Promise<Api.SystemManage.TraceKeywordItem>;
  }
  return request<Api.SystemManage.TraceKeywordItem>({
    url: '/system/trace-keyword/create',
    method: 'post',
    data: params
  });
}

/** update trace keyword */
export function fetchUpdateTraceKeyword(params: Api.SystemManage.TraceKeywordUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateTraceKeyword(params) as unknown as Promise<Api.SystemManage.TraceKeywordItem>;
  }
  return request<Api.SystemManage.TraceKeywordItem>({
    url: '/system/trace-keyword/update',
    method: 'post',
    data: params
  });
}

/** delete trace keyword by ids */
export function fetchDeleteTraceKeyword(ids: number[]) {
  if (import.meta.env.DEV) {
    return mockDeleteTraceKeyword(ids) as unknown as Promise<boolean>;
  }

  return request<boolean>({
    url: '/system/trace-keyword/delete',
    method: 'post',
    data: { ids }
  });
}

/** get operation trace list */
export function fetchGetOperationTraceList(params: Api.SystemManage.OperationTraceSearchParams) {
  if (import.meta.env.DEV) {
    return mockGetOperationTraceList(params) as unknown as Promise<Api.SystemManage.OperationTraceList>;
  }
  return request<Api.SystemManage.OperationTraceList>({
    url: '/system/operation-trace/list',
    method: 'post',
    data: params
  });
}

/** create operation trace */
export function fetchCreateOperationTrace(params: Api.SystemManage.OperationTraceCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateOperationTrace(params) as unknown as Promise<Api.SystemManage.OperationTraceItem>;
  }
  return request<Api.SystemManage.OperationTraceItem>({
    url: '/system/operation-trace/create',
    method: 'post',
    data: params
  });
}

/** update operation trace */
export function fetchUpdateOperationTrace(params: Api.SystemManage.OperationTraceUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateOperationTrace(params) as unknown as Promise<Api.SystemManage.OperationTraceItem>;
  }
  return request<Api.SystemManage.OperationTraceItem>({
    url: '/system/operation-trace/update',
    method: 'post',
    data: params
  });
}
