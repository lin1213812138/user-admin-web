import type { Directive, DirectiveBinding } from 'vue';
import { useAuthStore } from '@/store/modules/auth';

/**
 * `v-auth` directive: removes the element from the DOM when the current user lacks
 * the given permission code(s). Elements are removed (not hidden) so they cannot be
 * brought back via DevTools.
 *
 * @example
 *   <NButton v-auth="'system:user:add'">新增</NButton>
 *   <NButton v-auth="['system:user:edit', 'system:user:delete']">编辑/删除</NButton>
 */
export const authDirective: Directive<HTMLElement, string | string[]> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const authStore = useAuthStore();

    // super admin bypasses all permission checks
    if (authStore.isSuperAdmin) {
      return;
    }

    const codes = binding.value;
    const list = Array.isArray(codes) ? codes : [codes];

    const permitted = list.some(code => authStore.userInfo.permissions.includes(code));

    if (!permitted) {
      el.remove();
    }
  }
};
