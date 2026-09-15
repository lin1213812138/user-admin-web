<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import { NTabPane, NTabs } from 'naive-ui';
import MasterDetail from '@/views/system-manage/setting/components/MasterDetail.vue';
import BasicInfoForm from './BasicInfoForm.vue';
import InitDataCategory from './InitDataCategory.vue';
import { initDataCategoryTabs } from './init-data-info';

/** 左栏菜单项（复用通用左右布局组件 MasterDetail 的 items 结构） */
const menuItems = computed(() => [
  { id: 0, name: $t('page.manage.setting.initData.basicInit') },
  { id: 1, name: $t('page.manage.setting.initData.businessInit') }
]);

const selectedId = ref<number | null>(0);
const activeTab = ref<Api.SystemManage.InitDataCategory>('channel');

function handleTabChange(value: string | number) {
  activeTab.value = value as Api.SystemManage.InitDataCategory;
}
</script>

<template>
  <MasterDetail
    v-model:selected-id="selectedId"
    :items="menuItems"
    :show-search="false"
    :show-actions="false"
    :show-status="false"
    :editable="false"
    :list-title="$t('page.manage.setting.initData.title')"
  >
    <BasicInfoForm v-if="selectedId === 0" />
    <NTabs v-else :value="activeTab" type="line" class="init-data-tabs" @update:value="handleTabChange">
      <NTabPane v-for="tab in initDataCategoryTabs" :key="tab.key" :name="tab.key" :tab="$t(tab.titleKey)">
        <InitDataCategory :category="tab.key" />
      </NTabPane>
    </NTabs>
  </MasterDetail>
</template>

<style scoped>
.init-data-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.init-data-tabs :deep(.n-tabs-pane-wrapper) {
  flex: 1 1 auto;
  min-height: 0;
}

.init-data-tabs :deep(.n-tab-pane) {
  height: 100%;
}
</style>
