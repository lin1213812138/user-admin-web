import { request } from '../../request';
import { mockCreateMenu, mockDeleteMenu, mockMenuList, mockUpdateMenu } from '../mock';

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
