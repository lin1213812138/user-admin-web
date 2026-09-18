import type { App } from 'vue';
import { authDirective } from '@/directives/auth';

/** Register global permission directives (e.g. `v-auth`) */
export function setupPermissionDirective(app: App) {
  app.directive('auth', authDirective);
}
