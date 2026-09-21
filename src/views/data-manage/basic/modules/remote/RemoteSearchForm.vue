<script setup lang="ts">
import { ref } from 'vue';
import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import { useCountrySelect } from '@/hooks/business/use-country-select';
import { fetchGetRemoteGroupList } from '@/service/api/remote-group';

/** 目的地（国家 _id） */
const countryId = defineModel<string>('countryId', { default: '' });
/** 城市 */
const city = defineModel<string>('city', { default: '' });
/** 邮编 */
const zip = defineModel<string>('zip', { default: '' });
/** 偏远类别 _id */
const remoteGroupId = defineModel<string>('remoteGroupId', { default: '' });

const emit = defineEmits<{
  search: [];
  reset: [];
}>();

/** 目的地下拉（/country/query，Hook 内会话级单例缓存） */
const { options: countryOptions, load: loadCountries } = useCountrySelect();
loadCountries();

/** 偏远类别下拉（/remote-group/query） */
const groupOptions = ref<SelectOption[]>([]);

async function loadGroupOptions() {
  const { data, error } = await fetchGetRemoteGroupList({ page: 1, size: 500 });
  if (error || !data) return;

  groupOptions.value = data.list.map(item => ({ label: item.name, value: item._id }));
}
loadGroupOptions();
</script>

<template>
  <div class="flex flex-wrap items-center gap-12px">
    <NSelect
      v-model:value="countryId"
      class="w-200px!"
      clearable
      filterable
      :options="countryOptions"
      :placeholder="$t('page.dataManage.basic.remote.destinationPlaceholder')"
    />
    <NInput
      v-model:value="zip"
      class="w-220px!"
      clearable
      :placeholder="$t('page.dataManage.basic.remote.cityOrZipTip')"
      @keyup.enter="emit('search')"
    />
    <NInput
      v-model:value="city"
      class="w-220px!"
      clearable
      :placeholder="$t('page.dataManage.basic.remote.cityOrZipTip')"
      @keyup.enter="emit('search')"
    />
    <NSelect
      v-model:value="remoteGroupId"
      class="w-200px!"
      clearable
      filterable
      :options="groupOptions"
      :placeholder="$t('page.dataManage.basic.remote.groupPlaceholder')"
    />
    <LButton type="primary" @click="emit('search')">
      <template #icon><icon-ic-round-search class="text-icon" /></template>
      {{ $t('common.search') }}
    </LButton>
    <LButton @click="emit('reset')">
      <template #icon><icon-ic-round-refresh class="text-icon" /></template>
      {{ $t('common.reset') }}
    </LButton>
  </div>
</template>
