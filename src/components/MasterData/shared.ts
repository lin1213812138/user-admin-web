import { computed } from 'vue';
import { $t } from '@/locales';
import type { FormItemConfig } from '@/components/Form/index.vue';

/** Shared bits for all master-data archive components: status options + base search bar */
export function useArchiveBase() {
  const statusOptions = computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
    { label: $t('common.enable'), value: '1' },
    { label: $t('common.disable'), value: '2' }
  ]);

  /** Keyword + status + action-slot search bar, shared by every archive */
  function baseSearch(): FormItemConfig[] {
    return [
      {
        key: 'keyword',
        label: $t('common.keyword'),
        type: 'input',
        span: 8,
        placeholder: $t('page.dataManage.common.keywordPlaceholder')
      },
      { key: 'status', label: $t('common.status'), type: 'select', span: 8, options: statusOptions.value },
      { key: 'actions', label: ' ', slot: 'actions', span: 8 }
    ];
  }

  return { statusOptions, baseSearch };
}
