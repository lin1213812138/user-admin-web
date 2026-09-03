<script setup lang="ts">
interface NavGroup {
  key: string;
  title: string;
  fields: string[];
}

const props = defineProps<{
  navGroups: NavGroup[];
  modelValue: Record<string, string[]>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string[]>];
}>();

function toggleField(groupKey: string, field: string, checked: boolean) {
  const current = props.modelValue[groupKey] ?? [];
  const next = checked ? [...current, field] : current.filter(f => f !== field);
  emit('update:modelValue', { ...props.modelValue, [groupKey]: next });
}
</script>

<template>
  <NCard :title="$t('page.manage.setting.fieldMapping')" class="mt-16px">
    <div v-for="g in navGroups" :key="g.key" class="flex items-baseline gap-16px mb-12px last:mb-0">
      <div class="w-180px py-8px font-medium">
        {{ g.title }}
      </div>
      <div class="min-w-0 flex-1">
        <NGrid :cols="3" :x-gap="12" :y-gap="8">
          <NGridItem v-for="f in g.fields" :key="f">
            <NCheckbox
              :checked="(modelValue[g.key] ?? []).includes(f)"
              @update:checked="checked => toggleField(g.key, f, checked)"
            >
              {{ f }}
            </NCheckbox>
          </NGridItem>
        </NGrid>
      </div>
    </div>
  </NCard>
</template>
