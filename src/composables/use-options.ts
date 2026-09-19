import { computed } from 'vue';
import type { SelectOption } from 'naive-ui';
import { getGlobalOptions } from '@/constants/options';

/**
 * 全局「启用 / 禁用」状态选项（值 1 / 0）。
 *
 * 所有状态下拉 / 筛选统一取此，无需在每个界面重复定义
 * `[{ label: $t('common.enable'), value: 1 }, { label: $t('common.disable'), value: 0 }]`。
 * 返回 computed，语言切换时自动更新。
 */
export function useStatusOptions() {
  return computed<SelectOption[]>(() => getGlobalOptions('status'));
}
