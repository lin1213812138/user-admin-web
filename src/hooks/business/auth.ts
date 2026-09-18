import { useAuthStore } from '@/store/modules/auth';

export function useAuth() {
  const authStore = useAuthStore();

  function hasAuth(codes: string | string[]) {
    if (!authStore.isLogin) {
      return false;
    }

    // super admin bypasses all permission checks
    if (authStore.isSuperAdmin) {
      return true;
    }

    const list = typeof codes === 'string' ? [codes] : codes;

    return list.some(code => authStore.userInfo.permissions.includes(code));
  }

  return {
    hasAuth
  };
}
