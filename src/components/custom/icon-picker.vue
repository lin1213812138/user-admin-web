<script setup lang="ts">
import { computed, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { $t } from '@/locales';
import { iconifyIcons, viconsCollections, type IconEntry, type IconSource } from '@/constants/icons';
import IconRenderer from './icon-renderer.vue';

defineOptions({ name: 'IconPicker' });

interface Props {
  /** selected iconify icon name or vicons key, e.g. "mdi:home" / "vicons:ionicons5:Home" */
  value?: string;
  /** disable the picker */
  disabled?: boolean;
  /** placeholder when no icon selected */
  placeholder?: string;
  /** show clear button, default true */
  clearable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  disabled: false,
  placeholder: '',
  clearable: true
});

const emit = defineEmits<{
  'update:value': [string];
}>();

const visible = ref(false);
const keyword = ref('');
const activeTab = ref<IconSource>('iconify');

const tabs = computed<{ key: IconSource; label: string }[]>(() => [
  { key: 'iconify', label: $t('common.iconPicker.iconify') },
  ...viconsCollections.map(c => ({ key: c.id as IconSource, label: c.label }))
]);

const allEntries = computed<IconEntry[]>(() => {
  const list: IconEntry[] = iconifyIcons.map(name => ({ key: name, name, source: 'iconify' }));
  for (const col of viconsCollections) {
    for (const name of Object.keys(col.icons)) {
      if (name === 'default') continue;
      list.push({ key: `vicons:${col.id}:${name}`, name, source: col.id });
    }
  }
  return list;
});

const visibleEntries = computed<IconEntry[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  return allEntries.value.filter(entry => {
    if (entry.source !== activeTab.value) return false;
    if (kw && !entry.name.toLowerCase().includes(kw)) return false;
    return true;
  });
});

function handleSelect(key: string) {
  emit('update:value', key);
  visible.value = false;
}

function handleClear() {
  emit('update:value', '');
  visible.value = false;
}
</script>

<template>
  <NPopover v-model:show="visible" trigger="click" placement="bottom-start" :disabled="props.disabled" :width="340">
    <template #trigger>
      <NInput
        :value="props.value"
        :placeholder="props.placeholder || $t('common.iconPicker.placeholder')"
        readonly
        :disabled="props.disabled"
      >
        <template #prefix>
          <IconRenderer v-if="props.value" :icon="props.value" class="text-icon" />
          <span v-else class="text-16px text-gray-400">#</span>
        </template>
      </NInput>
    </template>

    <div class="flex flex-col gap-8px">
      <NTabs v-model:value="activeTab" type="segment" size="small">
        <NTabPane v-for="t in tabs" :key="t.key" :name="t.key" :tab="t.label" />
      </NTabs>

      <NInput v-model:value="keyword" :placeholder="$t('common.iconPicker.search')" clearable>
        <template #prefix>
          <Icon icon="mdi:magnify" class="text-icon" />
        </template>
      </NInput>

      <div class="h-240px overflow-y-auto overflow-x-hidden">
        <div v-if="visibleEntries.length" class="grid w-full grid-cols-8 gap-4px">
          <button
            v-for="entry in visibleEntries"
            :key="entry.key"
            type="button"
            class="flex h-32px w-full min-w-0 items-center justify-center rounded-4px border border-solid border-transparent text-18px leading-0 hover:border-primary hover:bg-primary-10%"
            :class="{ 'border-primary bg-primary-10%': entry.key === props.value }"
            :title="entry.name"
            @click="handleSelect(entry.key)"
          >
            <IconRenderer :icon="entry.key" />
          </button>
        </div>
        <div v-else class="flex h-full items-center justify-center text-gray-400">
          {{ $t('common.iconPicker.empty') }}
        </div>
      </div>

      <NButton v-if="props.clearable" block secondary size="small" @click="handleClear">
        {{ $t('common.iconPicker.clear') }}
      </NButton>
    </div>
  </NPopover>
</template>
