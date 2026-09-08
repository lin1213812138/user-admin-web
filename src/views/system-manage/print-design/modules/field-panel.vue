<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { $t } from '@/locales';
import type { BasicElement } from './basic-elements';
import type { PrintFieldGroup } from './print-fields';

defineProps<{
  groups: PrintFieldGroup[];
  basicElements: BasicElement[];
}>();

const emit = defineEmits<{ ready: [root: HTMLElement | null] }>();

const rootRef = ref<HTMLElement | null>(null);
// 默认全部折叠；拖拽通过 MutationObserver 持续注册，折叠项首次展开后即可拖拽
const expandedNames = ref<string[]>([]);

function handleToggle(evt: Event, name: string) {
  const open = (evt.target as HTMLDetailsElement).open;
  const set = new Set(expandedNames.value);
  if (open) {
    set.add(name);
  } else {
    set.delete(name);
  }
  expandedNames.value = [...set];
}

onMounted(async () => {
  await nextTick();
  emit('ready', rootRef.value);
});
</script>

<template>
  <div ref="rootRef" class="field-panel h-full w-full flex flex-col overflow-hidden">
    <NScrollbar class="min-h-0 flex-1">
      <div class="field-menu">
        <details
          v-for="group in groups"
          :key="group.key"
          class="field-group"
          :open="expandedNames.includes(group.key)"
          @toggle="handleToggle($event, group.key)"
        >
          <summary class="field-group-summary">
            <span class="field-group-arrow"></span>
            <span class="field-group-title">{{ group.label }}</span>
          </summary>
          <div class="field-group-content">
            <div
              v-for="field in group.fields"
              :key="field.key"
              class="ep-draggable-item field-item"
              :tid="`${group.key}.${field.key}`"
            >
              <svg class="field-item-drag" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="6" r="2" />
                <circle cx="9" cy="12" r="2" />
                <circle cx="9" cy="18" r="2" />
                <circle cx="15" cy="6" r="2" />
                <circle cx="15" cy="12" r="2" />
                <circle cx="15" cy="18" r="2" />
              </svg>
              <span class="field-item-label">{{ field.label }}</span>
            </div>
          </div>
        </details>

        <details class="field-group" :open="expandedNames.includes('basic')" @toggle="handleToggle($event, 'basic')">
          <summary class="field-group-summary">
            <span class="field-group-arrow"></span>
            <span class="field-group-title">{{ $t('page.manage.printDesign.basicElements') }}</span>
          </summary>
          <div class="field-group-content">
            <div v-for="item in basicElements" :key="item.tid" class="ep-draggable-item field-item" :tid="item.tid">
              <svg class="field-item-drag" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="6" r="2" />
                <circle cx="9" cy="12" r="2" />
                <circle cx="9" cy="18" r="2" />
                <circle cx="15" cy="6" r="2" />
                <circle cx="15" cy="12" r="2" />
                <circle cx="15" cy="18" r="2" />
              </svg>
              <span class="field-item-label">{{ $t(item.labelKey) }}</span>
            </div>
          </div>
        </details>
      </div>
    </NScrollbar>
  </div>
</template>

<style scoped>
.field-panel {
  background-color: #f7f8fa;
}

.dark .field-panel {
  background-color: #18181c;
}

/* 像左侧菜单一样：分组之间无间距、上下边框相连 */
.field-group {
  border-bottom: 1px solid #e5e6eb;
}

.dark .field-group {
  border-bottom-color: #333;
}

.field-group-summary {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
  background-color: transparent;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.field-group-summary:hover {
  background-color: #f2f3f5;
}

.dark .field-group-summary {
  color: #e5e6eb;
}

.dark .field-group-summary:hover {
  background-color: #2a2a2a;
}

/* 隐藏默认 details 箭头 */
.field-group-summary::-webkit-details-marker {
  display: none;
}

.field-group-summary::marker {
  display: none;
}

.field-group-arrow {
  width: 0;
  height: 0;
  margin-right: 8px;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 5px solid #86909c;
  transition: transform 0.2s ease;
}

.field-group[open] > .field-group-summary .field-group-arrow {
  transform: rotate(90deg);
}

.dark .field-group-arrow {
  border-left-color: #c9cdd4;
}

.field-group-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 12px 12px 28px;
  background-color: transparent;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: move;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  background-color: #fff;
  padding: 8px 12px;
  font-size: 12px;
  color: #4e5969;
  transition: all 0.2s ease;
}

.field-item-drag {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  fill: currentColor;
  color: #86909c;
  transition: color 0.2s ease;
}

.field-item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .field-item {
  border-color: #333;
  background-color: #262626;
  color: #c9cdd4;
}

.field-item:hover {
  border-color: #165dff;
  background-color: #f2f3f5;
  color: #165dff;
}

.field-item:hover .field-item-drag {
  color: #165dff;
}

.dark .field-item:hover {
  border-color: #3c7eff;
  background-color: #333;
  color: #3c7eff;
}

.dark .field-item:hover .field-item-drag {
  color: #3c7eff;
}
</style>
