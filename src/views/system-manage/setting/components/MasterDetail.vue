<script setup lang="ts">
import { computed } from 'vue';
import { useThemeVars } from 'naive-ui';
import { $t } from '@/locales';

interface ListItem {
  id: number;
  name: string;
  status?: Api.Common.EnableStatus;
}

const props = withDefaults(
  defineProps<{
    listTitle?: string;
    searchPlaceholder?: string;
    items: ListItem[];
    selectedId: number | null;
    /** 是否显示列表项的启用/禁用徽标（由各页面自行决定，非所有 tab 通用） */
    showStatus?: boolean;
    /** 是否渲染默认的顶部操作栏（新增/编辑/删除），非所有 tab 通用 */
    showActions?: boolean;
    editable?: boolean;
    /** 是否显示左侧列表的搜索框（固定分类场景传 false） */
    showSearch?: boolean;
  }>(),
  {
    listTitle: '',
    searchPlaceholder: '',
    showStatus: false,
    showActions: false,
    editable: true,
    showSearch: true
  }
);

const emit = defineEmits<{
  'update:selectedId': [id: number | null];
  create: [];
  edit: [];
  delete: [];
}>();

const themeVars = useThemeVars();

const keyword = defineModel<string>('keyword', { default: '' });

const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return props.items;
  return props.items.filter(item => item.name.toLowerCase().includes(kw));
});

function handleSelect(id: number) {
  emit('update:selectedId', id);
}
</script>

<template>
  <div
    class="h-full w-full flex gap-8px overflow-hidden"
    :style="{
      '--menu-primary': themeVars.primaryColor,
      '--menu-hover-bg': themeVars.hoverColor,
      '--status-enable': themeVars.successColor,
      '--status-disable': themeVars.errorColor
    }"
  >
    <div class="w-240px h-full flex-col">
      <NCard
        :title="listTitle"
        class="h-full"
        :header-style="{ padding: '10px 8px 0 10px', 'font-size': '16px' }"
        :content-style="{ padding: '8px', display: 'flex', flexDirection: 'column', minHeight: '0' }"
      >
        <template #default>
          <NInput v-if="showSearch" v-model:value="keyword" :placeholder="searchPlaceholder" clearable class="mb-6px" />
          <NScrollbar class="min-h-0 flex-1">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              class="menu-item"
              :class="{ 'menu-item--active': item.id === selectedId }"
              @click="handleSelect(item.id)"
            >
              <span class="truncate">{{ item.name }}</span>
              <span v-if="showStatus && item.status !== undefined" class="menu-item__status">
                <i
                  class="menu-item__dot"
                  :class="item.status === 1 ? 'menu-item__dot--enable' : 'menu-item__dot--disable'"
                />
                {{ item.status === 1 ? $t('common.enable') : $t('common.disable') }}
              </span>
            </div>
          </NScrollbar>
        </template>
      </NCard>
    </div>
    <div class="min-w-0 flex-1 flex-col">
      <NCard class="h-full" :content-style="{ padding: '0', display: 'flex', flexDirection: 'column', minHeight: '0' }">
        <div
          v-if="showActions"
          class="flex shrink-0 items-center justify-between px-16px py-16px border-b-1 border-[#ebeef5]"
        >
          <slot name="header">
            <NSpace>
              <NButton v-if="editable" type="primary" ghost size="small" @click="emit('create')">
                <template #icon><icon-ic-round-plus class="text-icon" /></template>
                {{ $t('common.add') }}
              </NButton>
              <NButton
                v-if="editable"
                type="primary"
                ghost
                size="small"
                :disabled="selectedId === null"
                @click="emit('edit')"
              >
                <template #icon><icon-ic-round-edit class="text-icon" /></template>
                {{ $t('common.edit') }}
              </NButton>
              <NButton
                v-if="editable"
                type="error"
                ghost
                size="small"
                :disabled="selectedId === null"
                @click="emit('delete')"
              >
                <template #icon><icon-ic-round-delete class="text-icon" /></template>
                {{ $t('common.delete') }}
              </NButton>
            </NSpace>
          </slot>
          <slot name="operation-extra" />
        </div>
        <!-- 右侧内容区：固定高度（flex-1 + min-h-0 + overflow-hidden），整体不滚动；高度不足时卡片 flex:1 吃掉剩余空间，内容超高时由各页内容自行内部滚动（如录单格式字段映射卡片） -->
        <div class="min-w-0 flex-1 flex-col min-h-0 overflow-hidden px-16px py-16px">
          <slot />
        </div>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 32px;
  padding: 4px 10px;
  margin: 6px 0;
  border-radius: 5px;
  cursor: pointer;
}
.menu-item:hover {
  background-color: var(--menu-hover-bg);
}
.menu-item--active {
  color: #fff;
  background-color: var(--menu-primary);
}
.menu-item--active:hover {
  background-color: var(--menu-primary);
}
.menu-item__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  font-size: 12px;
}
.menu-item__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.menu-item__dot--enable {
  background-color: var(--status-enable);
}
.menu-item__dot--disable {
  background-color: var(--status-disable);
}
</style>
