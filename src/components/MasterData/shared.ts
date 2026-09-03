import { computed } from 'vue';
import { $t } from '@/locales';

/** 启用/禁用状态选项，所有档案搜索栏的 status 过滤共用 */
export function useArchiveStatusOptions() {
  return computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
    { label: $t('common.enable'), value: '1' },
    { label: $t('common.disable'), value: '2' }
  ]);
}
