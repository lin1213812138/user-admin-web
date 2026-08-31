import type { AxiosResponse } from 'axios';
import { BACKEND_ERROR_CODE, createFlatRequest, createRequest } from '@sa/axios';
import { useAuthStore } from '@/store/modules/auth';
import { localStg } from '@/utils/storage';
import { getServiceBaseURL } from '@/utils/service';
import { $t } from '@/locales';
import { showErrorMsg } from './shared';
import type { RequestInstanceState } from './type';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL, otherBaseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

export const request = createFlatRequest(
  {
    baseURL,
    // wms-user authenticates via an httpOnly session cookie, so credentials must be included
    withCredentials: true,
    headers: {
      apifoxToken: 'XL299LiMEDZ0H5h3A29PxwQXdMJqWyY2'
    }
  },
  {
    defaultState: {
      errMsgStack: [],
      refreshTokenPromise: null
    } as RequestInstanceState,
    transform(response: AxiosResponse<App.Service.Response<any>>) {
      // wms-user puts payload under `ret`; mock/apifox under `data`
      const body = response.data as Record<string, any>;
      return body.data ?? body.ret;
    },
    async onRequest(config) {
      return config;
    },
    isBackendSuccess(response) {
      // wms-user uses `errcode === 0`; mock/apifox uses `code === '0000'`
      const body = response.data as Record<string, any>;
      const code = String(body.errcode ?? body.code);
      return code === import.meta.env.VITE_SERVICE_SUCCESS_CODE || code === '0';
    },
    async onBackendFail(response, _instance) {
      const authStore = useAuthStore();
      const body = response.data as Record<string, any>;
      const responseCode = String(body.code ?? body.errcode);
      const tip = body.errmsg || body.msg;

      function handleLogout() {
        authStore.resetStore();
      }

      function logoutAndCleanup() {
        handleLogout();
        window.removeEventListener('beforeunload', handleLogout);

        request.state.errMsgStack = request.state.errMsgStack.filter(msg => msg !== tip);
      }

      // when the backend response code is in `logoutCodes`, it means the user will be logged out and redirected to login page
      const logoutCodes = import.meta.env.VITE_SERVICE_LOGOUT_CODES?.split(',') || [];
      if (logoutCodes.includes(responseCode)) {
        handleLogout();
        return null;
      }

      // when the backend response code is in `modalLogoutCodes`, it means the user will be logged out by displaying a modal
      const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];
      if (modalLogoutCodes.includes(responseCode) && !request.state.errMsgStack?.includes(tip)) {
        request.state.errMsgStack = [...(request.state.errMsgStack || []), tip];

        // prevent the user from refreshing the page
        window.addEventListener('beforeunload', handleLogout);

        window.$dialog?.error({
          title: $t('common.error'),
          content: tip,
          positiveText: $t('common.confirm'),
          maskClosable: false,
          closeOnEsc: false,
          onPositiveClick() {
            logoutAndCleanup();
          },
          onClose() {
            logoutAndCleanup();
          }
        });

        return null;
      }

      return null;
    },
    onError(error) {
      // session expired (http 401) -> clear local state and back to login.
      // skip auto-logout for the login request itself, otherwise its error message would be swallowed.
      const isLoginRequest = error.config?.url?.includes('/user/login');
      if (error.response?.status === 401 && !isLoginRequest && localStg.get('token')) {
        useAuthStore().resetStore();
        return;
      }

      // wms-user returns business errors with a non-2xx HTTP status, carrying the real
      // message in `errmsg` (or `msg` for mock/apifox). Extract it regardless of `error.code`.
      const data = error.response?.data as Record<string, any> | undefined;
      const message = data?.msg || data?.errmsg || error.message;
      const backendErrorCode = String(data?.code ?? data?.errmsg ?? '');

      // the error message is displayed in the modal
      const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];
      if (modalLogoutCodes.includes(backendErrorCode)) {
        return;
      }

      showErrorMsg(request.state, message);
    }
  }
);

export const demoRequest = createRequest(
  {
    baseURL: otherBaseURL.demo
  },
  {
    transform(response: AxiosResponse<App.Service.DemoResponse>) {
      return response.data.result;
    },
    async onRequest(config) {
      const { headers } = config;

      // set token
      const token = localStg.get('token');
      const Authorization = token ? `Bearer ${token}` : null;
      Object.assign(headers, { Authorization });

      return config;
    },
    isBackendSuccess(response) {
      // when the backend response code is "200", it means the request is success
      // you can change this logic by yourself
      return response.data.status === '200';
    },
    async onBackendFail(_response) {
      // when the backend response code is not "200", it means the request is fail
      // for example: the token is expired, refresh token and retry request
    },
    onError(error) {
      // when the request is fail, you can show error message

      let message = error.message;

      // show backend error message
      if (error.code === BACKEND_ERROR_CODE) {
        message = error.response?.data?.message || message;
      }

      window.$message?.error(message);
    }
  }
);
