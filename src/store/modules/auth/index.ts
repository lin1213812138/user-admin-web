import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { router } from '@/router';
import { useLoading } from '@sa/hooks';
import { fetchGetUserInfo, fetchLogin } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { $t } from '@/locales';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken } from './shared';
import { SUPER_ROLE_TYPE } from '@/constants/auth';

/** Empty user info used to reset the reactive `userInfo` */
function createEmptyUserInfo(): Api.Auth.UserInfo {
  return {
    _id: '',
    account: '',
    userId: '',
    userName: '',
    permissions: []
  };
}

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref('');

  const userInfo: Api.Auth.UserInfo = reactive({
    _id: '',
    account: '',
    userId: '',
    userName: '',
    permissions: []
  });

  /** is super admin: only roleType === SUPER_ROLE_TYPE (100) bypasses all permission checks */
  const isSuperAdmin = computed(() => userInfo.roleType === SUPER_ROLE_TYPE);

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  /**
   * Reset user info
   *
   * setup store has no built-in `$reset`, and a plain `Object.assign` with the empty object would
   * keep backend-only fields (roleType / accountType / authMap ...) of the previous account,
   * which would make `isSuperAdmin` return `true` for a non-super user.
   */
  function resetUserInfo() {
    Object.keys(userInfo).forEach(key => {
      delete userInfo[key];
    });

    Object.assign(userInfo, createEmptyUserInfo());
  }

  /** Reset auth store */
  async function resetStore() {
    recordUserId();

    clearAuthStorage();

    // setup store has no built-in `$reset`, reset by hand
    resetUserInfo();

    token.value = '';

    tabStore.cacheTabs();

    // reset route store (remove auth routes) before navigating to login,
    // so the route re-registration won't interfere with the navigation
    await routeStore.resetStore();

    if (!router.currentRoute.value.meta.constant) {
      await toLogin();
    }
  }

  /** Record the user ID of the previous login session Used to compare with the current user ID on next login */
  function recordUserId() {
    if (!userInfo.userId) {
      return;
    }

    // Store current user ID locally for next login comparison
    localStg.set('lastLoginUserId', userInfo.userId);
  }

  /**
   * Check if current login user is different from previous login user If different, clear all tabs
   *
   * @returns {boolean} Whether to clear all tabs
   */
  function checkTabClear(): boolean {
    if (!userInfo.userId) {
      return false;
    }

    const lastLoginUserId = localStg.get('lastLoginUserId');

    // Clear all tabs if current user is different from previous user
    if (!lastLoginUserId || lastLoginUserId !== userInfo.userId) {
      localStg.remove('globalTabs');
      tabStore.clearTabs();

      localStg.remove('lastLoginUserId');
      return true;
    }

    localStg.remove('lastLoginUserId');
    return false;
  }

  /** Map a wms-user detail object into the normalized userInfo and persist the session */
  function applyUser(user: Api.Auth.UserDetail) {
    // clear the previous account first, so fields the backend does not return this time
    // (roleType / accountType / authMap ...) cannot leak into the new session
    resetUserInfo();

    // preserve every field returned by the backend (status / warehouse / role ids / dates ...)
    Object.assign(userInfo, user);

    const authKeys = Object.keys(user.authMap || {});

    userInfo.userId = String(user['_id'] ?? '');
    userInfo.userName = user.name || user.account || user.originAccount || '';
    // only keep permission codes containing ':' (e.g. `system:user:add`); pure numeric menu ids are dropped
    userInfo.permissions = authKeys.filter(code => code.includes(':'));

    // wms-user keeps the real session in an httpOnly cookie; we only persist a local
    // marker (the user id) so the route guard / `isLogin` keep working across reloads.
    token.value = userInfo.userId;
    localStg.set('token', token.value);
    localStg.set('userInfo', userInfo);
  }

  /**
   * Login
   *
   * @param userName User name
   * @param password Password
   * @param [redirect=true] Whether to redirect after login. Default is `true`
   */
  async function login(userName: string, password: string, redirect = true) {
    startLoading();

    const { data, error } = await fetchLogin(userName, password);

    if (!error && data?.user) {
      applyUser(data.user);

      // Check if the tab needs to be cleared
      const isClear = checkTabClear();
      let needRedirect = redirect;

      if (isClear) {
        // If the tab needs to be cleared,it means we don't need to redirect.
        needRedirect = false;
      }

      // the auth routes were built for another account, rebuild them so the menus are
      // filtered by the new user's permissions instead of the previous one's
      if (routeStore.isInitAuthRoute && routeStore.authRouteUserId !== userInfo.userId) {
        await routeStore.resetStore();
      }

      await redirectFromLogin(needRedirect);

      window.$notification?.success({
        title: $t('page.login.common.loginSuccess'),
        content: $t('page.login.common.welcomeBack', { userName: userInfo.userName }),
        duration: 4500
      });
    } else {
      resetStore();
    }

    endLoading();
  }

  /** Fetch current user info from the session and apply it */
  async function getUserInfo() {
    const { data, error } = await fetchGetUserInfo();

    if (!error && data) {
      // update store
      applyUser(data);

      return true;
    }

    return false;
  }

  /** Init user info after page reload (validates the cookie session) */
  async function initUserInfo() {
    const maybeToken = getToken();

    if (!maybeToken) {
      return;
    }

    token.value = maybeToken;

    // restore cached userInfo for an instant UI, then refresh it from the session
    // reset before restoring the cached user info, otherwise a stale cached field
    // (roleType / accountType) of another account would leak into this session
    resetUserInfo();

    const cached = localStg.get('userInfo') as Api.Auth.UserInfo | null;
    if (cached) {
      Object.assign(userInfo, cached);
    }

    const pass = await getUserInfo();

    if (!pass) {
      resetStore();
    }
  }

  return {
    token,
    userInfo,
    isSuperAdmin,
    isLogin,
    loginLoading,
    resetStore,
    login,
    getUserInfo,
    initUserInfo
  };
});
