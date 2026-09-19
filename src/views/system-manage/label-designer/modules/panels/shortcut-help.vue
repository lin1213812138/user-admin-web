<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';

interface ShortcutRow {
  label: string;
  win: string;
  mac: string;
}

/** 快捷键对照清单：键位组合为符号常量（两语言一致），行标签走 i18n */
const rows = computed<ShortcutRow[]>(() => [
  { label: $t('page.manage.labelDesign.save'), win: 'Ctrl + S', mac: '⌘ + S' },
  { label: $t('page.manage.labelDesign.undo'), win: 'Ctrl + Z', mac: '⌘ + Z' },
  {
    label: $t('page.manage.labelDesign.redo'),
    win: 'Ctrl + Y / Ctrl + Shift + Z',
    mac: '⌘ + Y / ⌘ + Shift + Z'
  },
  { label: $t('page.manage.labelDesign.shortcutCopyPaste'), win: 'Ctrl + X / C / V', mac: '⌘ + X / C / V' },
  {
    label: $t('page.manage.labelDesign.shortcutMove'),
    win: $t('page.manage.labelDesign.shortcutArrows'),
    mac: $t('page.manage.labelDesign.shortcutArrows')
  },
  {
    label: $t('page.manage.labelDesign.shortcutQuickMove'),
    win: `Shift + ${$t('page.manage.labelDesign.shortcutArrows')}`,
    mac: `Shift + ${$t('page.manage.labelDesign.shortcutArrows')}`
  },
  {
    label: $t('page.manage.labelDesign.shortcutNudge'),
    win: `Alt + ${$t('page.manage.labelDesign.shortcutArrows')}`,
    mac: `⌥ + ${$t('page.manage.labelDesign.shortcutArrows')}`
  },
  { label: $t('page.manage.labelDesign.shortcutDelete'), win: 'Delete / Backspace', mac: 'Delete / Backspace' }
]);

const cols = computed(() => [
  { title: $t('page.manage.labelDesign.shortcutWindows'), key: 'win' as const },
  { title: $t('page.manage.labelDesign.shortcutMac'), key: 'mac' as const }
]);
</script>

<template>
  <!-- 快捷键帮助：按钮 + Popover 两列对照（Windows / Mac） -->
  <NPopover trigger="click" placement="bottom-end">
    <template #trigger>
      <NTooltip>
        <template #trigger>
          <LButton quaternary>
            <template #icon><icon-ic-round-keyboard class="text-icon" /></template>
          </LButton>
        </template>
        {{ $t('page.manage.labelDesign.shortcut') }}
      </NTooltip>
    </template>
    <div class="w-440px">
      <div class="mb-8px text-14px font-medium">{{ $t('page.manage.labelDesign.shortcut') }}</div>
      <div class="grid grid-cols-2 gap-12px">
        <div v-for="col in cols" :key="col.key" class="rounded-4px bg-#f3f3f5 p-12px dark:bg-#2a2a2a">
          <div class="mb-6px text-13px font-medium">{{ col.title }}</div>
          <div v-for="row in rows" :key="row.label" class="flex items-start justify-between gap-12px py-3px text-12px">
            <span class="shrink-0 color-#666 dark:color-#999">{{ row.label }}</span>
            <span class="text-right">{{ row[col.key] }}</span>
          </div>
        </div>
      </div>
    </div>
  </NPopover>
</template>
