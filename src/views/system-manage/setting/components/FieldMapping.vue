<script setup lang="ts">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import { $t } from '@/locales';
import type { FieldMappingGroup } from './field-mapping-config';

export type { FieldMappingField, FieldMappingGroup } from './field-mapping-config';

const props = withDefaults(
  defineProps<{
    navGroups: FieldMappingGroup[];
    modelValue: Record<string, string[]>;
    /** 占满父容器剩余高度，内容溢出时只在卡片内部滚动（右侧内容各页独有，按需开启） */
    fill?: boolean;
    /** 只读，禁用字段勾选与分组全选按钮 */
    disabled?: boolean;
  }>(),
  { fill: false, disabled: false }
);

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string[]>];
}>();

const cardClass = computed(() => (props.fill ? 'mt-16px flex flex-1 min-h-0 flex-col' : 'mt-16px'));
const cardContentStyle = computed<CSSProperties | undefined>(() =>
  // fill: 卡片占满父容器剩余高度（basis 0 干净占满），内部 NScrollbar 滚动字段映射内容，外层不滚
  props.fill ? { display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, padding: '0' } : undefined
);

function toggleField(groupKey: string, field: string, checked: boolean) {
  const current = props.modelValue[groupKey] ?? [];
  // 先判重再追加，避免数据里存在重复 key 时同名字段被写入两次
  const next = checked ? (current.includes(field) ? current : [...current, field]) : current.filter(f => f !== field);
  emit('update:modelValue', { ...props.modelValue, [groupKey]: next });
}

/** 分组内已勾选的字段数量 */
function checkedCountOf(group: FieldMappingGroup) {
  const current = props.modelValue[group.key] ?? [];
  return group.fields.filter(f => current.includes(f.key)).length;
}

/** 分组是否已被全选（空分组视为未全选，避免出现永远高亮的按钮） */
function isGroupAllChecked(group: FieldMappingGroup) {
  return group.fields.length > 0 && checkedCountOf(group) === group.fields.length;
}

/** 分组是否处于半选（勾了部分字段） */
function isGroupIndeterminate(group: FieldMappingGroup) {
  const count = checkedCountOf(group);
  return count > 0 && count < group.fields.length;
}

/** 按钮类型：未选 default / 半选 tertiary / 全选 primary，兼作勾选状态反馈 */
function groupButtonType(group: FieldMappingGroup) {
  if (isGroupAllChecked(group)) return 'primary';
  return isGroupIndeterminate(group) ? 'tertiary' : 'default';
}

/** 一键全选 / 取消全选：已全选则清空，未全选（含半选）则勾选该组全部字段 */
function toggleGroup(group: FieldMappingGroup) {
  const next = isGroupAllChecked(group) ? [] : group.fields.map(f => f.key);
  emit('update:modelValue', { ...props.modelValue, [group.key]: next });
}
</script>

<template>
  <NCard :title="$t('page.manage.setting.fieldMapping')" :class="cardClass" :content-style="cardContentStyle">
    <template #header-extra>
      <NSpace class="min-w-0 justify-end" :size="8" wrap>
        <NButton
          v-for="g in navGroups"
          :key="g.key"
          :type="groupButtonType(g)"
          :title="isGroupAllChecked(g) ? $t('common.unselectAll') : $t('common.selectAll')"
          :disabled="disabled || g.fields.length === 0"
          @click="toggleGroup(g)"
        >
          {{ `${g.title} ${checkedCountOf(g)}/${g.fields.length}` }}
        </NButton>
      </NSpace>
    </template>
    <NScrollbar v-if="fill" class="min-h-0 flex-1" content-class="min-h-full">
      <div class="min-w-full px-16px py-16px">
        <div v-for="g in navGroups" :key="g.key" class="flex items-baseline gap-16px mb-12px last:mb-0">
          <div class="w-180px py-8px font-medium">
            {{ g.title }}
          </div>
          <div class="min-w-0 flex-1">
            <NGrid :cols="24" :x-gap="0" :y-gap="8">
              <NGridItem v-for="f in g.fields" :key="f.key" :span="f.span ?? 8">
                <NCheckbox
                  class="w-full pr-12px"
                  :checked="(modelValue[g.key] ?? []).includes(f.key)"
                  :disabled="disabled"
                  @update:checked="checked => toggleField(g.key, f.key, checked)"
                >
                  {{ f.label }}
                </NCheckbox>
              </NGridItem>
            </NGrid>
          </div>
        </div>
      </div>
    </NScrollbar>
    <div v-else class="min-w-full">
      <div v-for="g in navGroups" :key="g.key" class="flex items-baseline gap-16px mb-12px last:mb-0">
        <div class="w-180px py-8px font-medium">
          {{ g.title }}
        </div>
        <div class="min-w-0 flex-1">
          <NGrid :cols="24" :x-gap="0" :y-gap="8">
            <NGridItem v-for="f in g.fields" :key="f.key" :span="f.span ?? 8">
              <NCheckbox
                class="w-full pr-12px"
                :checked="(modelValue[g.key] ?? []).includes(f.key)"
                :disabled="disabled"
                @update:checked="checked => toggleField(g.key, f.key, checked)"
              >
                {{ f.label }}
              </NCheckbox>
            </NGridItem>
          </NGrid>
        </div>
      </div>
    </div>
  </NCard>
</template>
