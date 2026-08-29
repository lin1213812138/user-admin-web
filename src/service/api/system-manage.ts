import { request } from '../request';
import { mockUserList, mockCreateUser } from './mock';

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
