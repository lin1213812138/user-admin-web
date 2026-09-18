import { computed } from 'vue';
import { $t } from '@/locales';

/** 启用/禁用状态选项，所有档案搜索栏的 status 过滤共用 */
export function useArchiveStatusOptions() {
  return computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
    { label: $t('common.enable'), value: 1 },
    { label: $t('common.disable'), value: 0 }
  ]);
}

/** 是/否(0-否 1-是)选项，档案弹窗内布尔字段下拉共用 */
export function useArchiveYesNoOptions() {
  return computed<CommonType.Option<0 | 1>[]>(() => [
    { label: $t('common.yesOrNo.yes'), value: 1 },
    { label: $t('common.yesOrNo.no'), value: 0 }
  ]);
}
