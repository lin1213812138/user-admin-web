<script setup lang="ts">
import { computed } from 'vue';
import { GLOBAL_SIDER_MENU_ID } from '@/constants/app';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import GlobalLogo from '../global-logo/index.vue';
// header 下线后用户区移至侧栏底部，组件暂留 global-header 目录（不删文件）
import UserAvatar from '../global-header/components/user-avatar.vue';

defineOptions({
  name: 'GlobalSider'
});

const appStore = useAppStore();
const themeStore = useThemeStore();

const isTopHybridSidebarFirst = computed(() => themeStore.layout.mode === 'top-hybrid-sidebar-first');
const isTopHybridHeaderFirst = computed(() => themeStore.layout.mode === 'top-hybrid-header-first');
const darkMenu = computed(
  () =>
    !themeStore.darkMode && !isTopHybridSidebarFirst.value && !isTopHybridHeaderFirst.value && themeStore.sider.inverted
);
const showLogo = computed(() => themeStore.layout.mode === 'vertical');
const menuWrapperClass = computed(() => (showLogo.value ? 'flex-1-hidden' : 'h-full'));
</script>

<template>
  <DarkModeContainer class="size-full flex-col-stretch shadow-sider" :inverted="darkMenu">
    <GlobalLogo
      v-if="showLogo"
      :show-title="!appStore.siderCollapse"
      :style="{ height: themeStore.header.height + 'px' }"
    />
    <div :id="GLOBAL_SIDER_MENU_ID" :class="menuWrapperClass"></div>
    <!-- 底部用户区：收起时仅显示图标（见 user-avatar.vue）；inverted 深色侧栏下文字/分隔线需用浅色 -->
    <div
      class="flex-y-center justify-center border-t"
      :class="darkMenu ? 'sider-footer--inverted border-white/10' : 'border-gray-200 dark:border-gray-700'"
      :style="{ height: themeStore.header.height + 'px' }"
    >
      <UserAvatar />
    </div>
  </DarkModeContainer>
</template>

<style scoped>
.sider-footer--inverted {
  color: rgba(255, 255, 255, 0.82);
}

/* NButton 通过内联 CSS 变量设置三态颜色（浅色主题为深色），深色侧栏下需强制覆盖为浅色；
   同时覆盖 hover/pressed 变量，让悬浮反馈在深蓝底上明显可见（内联变量必须 !important） */
.sider-footer--inverted :deep(.n-button) {
  --n-text-color: rgba(255, 255, 255, 0.82) !important;
  --n-text-color-hover: #fff !important;
  --n-text-color-pressed: #fff !important;
  --n-color-hover: rgba(255, 255, 255, 0.16) !important;
  --n-color-pressed: rgba(255, 255, 255, 0.24) !important;
}
</style>
