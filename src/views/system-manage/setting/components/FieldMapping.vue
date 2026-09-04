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
  }>(),
  { fill: false }
);

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string[]>];
}>();

const contentStyle = computed<CSSProperties | undefined>(() =>
  props.fill ? { display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 } : undefined
);

function toggleField(groupKey: string, field: string, checked: boolean) {
  const current = props.modelValue[groupKey] ?? [];
  const next = checked ? [...current, field] : current.filter(f => f !== field);
  emit('update:modelValue', { ...props.modelValue, [groupKey]: next });
}
</script>

<template>
  <NCard
    :title="$t('page.manage.setting.fieldMapping')"
    class="mt-16px"
    :class="{ 'flex-1 min-h-0 flex-col': fill }"
    :content-style="contentStyle"
  >
    <NScrollbar class="min-h-0" :class="{ 'flex-1': fill }">
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
                @update:checked="checked => toggleField(g.key, f.key, checked)"
              >
                {{ f.label }}
              </NCheckbox>
            </NGridItem>
          </NGrid>
        </div>
      </div>
    </NScrollbar>
  </NCard>
</template>
