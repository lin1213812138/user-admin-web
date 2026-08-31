import { request } from '../request';
import { md5 } from '@/utils/crypto';

/**
 * Login (wms-user backend)
 *
 * Request body: `{ account, password }`, where `password = MD5(MD5(plain) + plain)`.
 * Response: `{ user }` (no token; the session is kept via an httpOnly cookie, so the
 * request instance must be created with `withCredentials: true`).
 *
 * @param userName User account
 * @param password Plain text password
 */
export function fetchLogin(userName: string, password: string) {
  return request<Api.Auth.LoginResult>({
    url: '/api/v1/user/login',
    method: 'post',
    data: {
      account: userName,
      password: md5(md5(password) + password)
    }
  });
}

/**
 * Get current user info from the session (wms-user: `/user/session/get`)
 *
 * The backend registers this route as POST only; a GET is answered with 404.
 */
export function fetchGetUserInfo() {
  return request<Api.Auth.SessionUser>({ url: '/api/v1/user/session/get', method: 'post' });
}

/**
 * return custom backend error
 *
 * @param code error code
 * @param msg error message
 */
export function fetchCustomBackendError(code: string, msg: string) {
  return request({ url: '/auth/error', params: { code, msg } });
}
