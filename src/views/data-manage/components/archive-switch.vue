<script setup lang="ts">
import { computed, defineAsyncComponent, h, ref, type Component } from 'vue';
import { NSpin } from 'naive-ui';
import { useThemeStore } from '@/store/modules/theme';
import { $t } from '@/locales';

export interface ArchiveSwitchItem {
  key: string;
  labelKey: App.I18n.I18nKey;
  load: () => Promise<{ default: Component }>;
}

const props = defineProps<{ items: ArchiveSwitchItem[] }>();

/** Placeholder shown while an async chunk itself is still being fetched */
const loadingComponent: Component = () =>
  h('div', { class: 'flex h-full w-full items-center justify-center' }, [h(NSpin)]);

const asyncComps: Record<string, Component> = {};
for (const item of props.items) {
  asyncComps[item.key] = defineAsyncComponent({
    loader: item.load,
    loadingComponent
  });
}

const themeStore = useThemeStore();

/** Follow the page transition configured in theme settings */
const transitionName = computed(() => (themeStore.page.animate ? themeStore.page.animateMode : ''));

const activeKey = ref(props.items[0]?.key ?? '');

function handleSelect(key: string) {
  activeKey.value = key;
}
</script>

<template>
  <div class="flex h-full w-full overflow-hidden">
    <nav class="w-180px shrink-0 border-r border-#e5e7eb p-8px">
      <button
        v-for="item in items"
        :key="item.key"
        class="mb-4px w-full rounded px-12px py-8px text-left text-14px"
        :class="activeKey === item.key ? 'bg-primary/10 font-medium text-primary' : 'text-#4b5563 hover:bg-#f3f4f6'"
        @click="handleSelect(item.key)"
      >
        {{ $t(item.labelKey) }}
      </button>
    </nav>
    <div class="relative min-w-0 flex-1 overflow-hidden">
      <Transition :name="transitionName" mode="out-in">
        <KeepAlive>
          <component :is="asyncComps[activeKey]" :key="activeKey" class="h-full w-full" />
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>
