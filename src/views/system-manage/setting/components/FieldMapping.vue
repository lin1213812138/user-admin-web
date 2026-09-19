<script setup lang="ts">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import { $t } from '@/locales';
import type { FieldMappingGroup, FieldMappingValue } from './field-mapping-config';

export type { FieldMappingField, FieldMappingGroup, FieldMappingValue } from './field-mapping-config';

const props = withDefaults(
  defineProps<{
    navGroups: FieldMappingGroup[];
    modelValue: Record<string, FieldMappingValue>;
    /** 占满父容器剩余高度，内容溢出时只在卡片内部滚动（右侧内容各页独有，按需开启） */
    fill?: boolean;
    /** 只读，禁用字段勾选与分组全选按钮 */
    disabled?: boolean;
  }>(),
  { fill: false, disabled: false }
);

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, FieldMappingValue>];
}>();

const cardClass = computed(() => (props.fill ? 'mt-16px flex flex-1 min-h-0 flex-col' : 'mt-16px'));
const cardContentStyle = computed<CSSProperties | undefined>(() =>
  // fill: 卡片占满父容器剩余高度（basis 0 干净占满），内部 NScrollbar 滚动字段映射内容，外层不滚
  props.fill ? { display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, padding: '0' } : undefined
);

/** 取某分组的映射值，缺省视为全空，避免各调用点重复判空 */
function groupValueOf(groupKey: string): FieldMappingValue {
  return props.modelValue[groupKey] ?? { show: [], required: [] };
}

/** 字段是否已勾选「显示」 */
function isShown(groupKey: string, field: string) {
  return groupValueOf(groupKey).show.includes(field);
}

/** 字段是否已勾选「必填」 */
function isRequired(groupKey: string, field: string) {
  return groupValueOf(groupKey).required.includes(field);
}

function toggleField(groupKey: string, field: string, checked: boolean) {
  const current = groupValueOf(groupKey);
  // 先判重再追加，避免数据里存在重复 key 时同名字段被写入两次
  const next = checked
    ? current.show.includes(field)
      ? current.show
      : [...current.show, field]
    : current.show.filter(f => f !== field);
  // 勾选显示时默认同时设为必填；取消显示不清除已设必填
  const required = checked && !current.required.includes(field) ? [...current.required, field] : current.required;
  emit('update:modelValue', { ...props.modelValue, [groupKey]: { ...current, show: next, required } });
}

/** 勾选 / 取消「必填」：与「显示」独立存储，不联动修改对方 */
function toggleRequired(groupKey: string, field: string, checked: boolean) {
  const current = groupValueOf(groupKey);
  const next = checked
    ? current.required.includes(field)
      ? current.required
      : [...current.required, field]
    : current.required.filter(f => f !== field);
  emit('update:modelValue', { ...props.modelValue, [groupKey]: { ...current, required: next } });
}

/** 分组内已勾选「显示」的字段数量（分组按钮只统计显示维度） */
function checkedCountOf(group: FieldMappingGroup) {
  const current = groupValueOf(group.key).show;
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

/** 一键全选 / 取消全选：已全选则清空显示，未全选（含半选）则全选该组字段并默认设为必填（与字段级勾选行为一致）；锁定字段（disabled）永远保持勾选 */
function toggleGroup(group: FieldMappingGroup) {
  const current = groupValueOf(group.key);
  const allChecked = isGroupAllChecked(group);
  const keys = group.fields.map(f => f.key);
  const lockedKeys = group.fields.filter(f => f.disabled).map(f => f.key);
  const show = allChecked ? lockedKeys : keys;
  // 取消全选不清除已设必填
  const required = allChecked
    ? current.required
    : [...current.required, ...keys.filter(k => !current.required.includes(k))];
  emit('update:modelValue', { ...props.modelValue, [group.key]: { ...current, show, required } });
}
</script>

<template>
  <NCard :title="$t('page.manage.setting.fieldMapping')" :class="cardClass" :content-style="cardContentStyle">
    <template #header-extra>
      <NSpace class="min-w-0 justify-end" :size="8" wrap>
        <LButton
          v-for="g in navGroups"
          :key="g.key"
          :type="groupButtonType(g)"
          :title="isGroupAllChecked(g) ? $t('common.unselectAll') : $t('common.selectAll')"
          :disabled="disabled || g.fields.length === 0"
          @click="toggleGroup(g)"
        >
          {{ `${g.title} ${checkedCountOf(g)}/${g.fields.length}` }}
        </LButton>
      </NSpace>
    </template>
    <NScrollbar v-if="fill" class="min-h-0 flex-1" content-class="min-h-full">
      <div class="min-w-full px-10px py-10px">
        <div v-for="g in navGroups" :key="g.key" class="flex items-baseline gap-16px mb-12px last:mb-0">
          <div class="w-180px py-8px font-medium">
            {{ g.title }}
          </div>
          <div class="min-w-0 flex-1">
            <NGrid :cols="24" :x-gap="0" :y-gap="8">
              <NGridItem v-for="f in g.fields" :key="f.key" :span="f.span ?? 6">
                <div class="flex items-center gap-6px pr-12px">
                  <NTooltip>
                    <template #trigger>
                      <NCheckbox
                        :checked="isShown(g.key, f.key)"
                        :disabled="disabled || f.disabled"
                        @update:checked="checked => toggleField(g.key, f.key, checked)"
                      >
                        {{ f.label }}
                      </NCheckbox>
                    </template>
                    {{ $t('common.show') }}
                  </NTooltip>
                  <NTooltip v-if="isShown(g.key, f.key)">
                    <template #trigger>
                      <span
                        class="inline-flex h-24px w-24px shrink-0 select-none items-center justify-center text-16px leading-none transition-colors rd-4px"
                        :class="[
                          isRequired(g.key, f.key) ? 'text-error' : 'text-#c0c4cc',
                          disabled ? '' : 'cursor-pointer hover:bg-#f3f4f6 hover:text-error dark:hover:bg-#ffffff1a'
                        ]"
                        @click="!disabled && toggleRequired(g.key, f.key, !isRequired(g.key, f.key))"
                      >
                        {{ isRequired(g.key, f.key) ? '★' : '☆' }}
                      </span>
                    </template>
                    {{ $t('page.manage.setting.fieldMappingRequired') }}
                  </NTooltip>
                </div>
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
            <NGridItem v-for="f in g.fields" :key="f.key" :span="f.span ?? 6">
              <div class="flex items-center gap-6px pr-12px">
                <NTooltip>
                  <template #trigger>
                    <NCheckbox
                      :checked="isShown(g.key, f.key)"
                      :disabled="disabled || f.disabled"
                      @update:checked="checked => toggleField(g.key, f.key, checked)"
                    >
                      {{ f.label }}
                    </NCheckbox>
                  </template>
                  {{ $t('common.show') }}
                </NTooltip>
                <NTooltip v-if="isShown(g.key, f.key)">
                  <template #trigger>
                    <span
                      class="inline-flex h-24px w-24px shrink-0 select-none items-center justify-center text-16px leading-none transition-colors rd-4px"
                      :class="[
                        isRequired(g.key, f.key) ? 'text-error' : 'text-#c0c4cc',
                        disabled ? '' : 'cursor-pointer hover:bg-#f3f4f6 hover:text-error dark:hover:bg-#ffffff1a'
                      ]"
                      @click="!disabled && toggleRequired(g.key, f.key, !isRequired(g.key, f.key))"
                    >
                      {{ isRequired(g.key, f.key) ? '★' : '☆' }}
                    </span>
                  </template>
                  {{ $t('page.manage.setting.fieldMappingRequired') }}
                </NTooltip>
              </div>
            </NGridItem>
          </NGrid>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
/* naive 卡片头部靠 `__main: flex 1`（basis 0）撑满剩余宽度，把 `__header-extra` 按钮组顶到卡片最右；
   设置页右侧变窄后标题（flex: 1 1 0 + min-width: 0）会被按钮组挤成 0 宽竖排，故：
   - 保留撑满能力但 basis 改 auto（标题按内容宽参与分配，宽容器仍能把按钮组推到最右 = 左右布局）
   - min-width 改 max-content（窄容器下标题最多压到自身内容宽，不竖排；按钮组靠 NSpace wrap 换行）
   naive 原生规则 `.n-card > .n-card-header .n-card-header__main`（特异性 0,3,0）
   高于 :deep 编译出的 `[data-v] .n-card-header__main`（0,2,0），故用 !important 覆盖 */
:deep(.n-card-header__main) {
  flex: 1 1 auto !important;
  min-width: max-content !important;
}
</style>
