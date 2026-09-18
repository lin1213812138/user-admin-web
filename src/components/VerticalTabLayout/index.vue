<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({
  name: 'VerticalTabLayout'
});

const themeStore = useThemeStore();
const transitionName = computed(() => (themeStore.page.animate ? themeStore.page.animateMode : ''));

interface TabItem {
  /** tab 值（与 v-model:value 比对） */
  value: string | number;
  /** tab 文案 */
  label: string;
}

const props = withDefaults(
  defineProps<{
    /** 当前激活的 tab（v-model:value） */
    value: string | number;
    /** tab 项列表 */
    tabs: TabItem[];
    /** 左栏顶部页面名称（不传则不渲染标题区） */
    title?: string;
    /** 切 tab 后，延迟多少毫秒再切换右侧内容区；用于等左侧指示条动画完成后再加载异步组件，避免抢帧 */
    contentDelay?: number;
  }>(),
  {
    title: '',
    contentDelay: 200
  }
);

const emit = defineEmits<{
  'update:value': [value: string | number];
}>();

/** 左侧 tab UI 高亮的值：点击后立即更新，保证指示条动画先跑 */
const activeTab = ref(props.value);

let delayTimer: ReturnType<typeof setTimeout> | null = null;
/** 已点击但还没派发到右侧内容的待切换值 */
let pendingValue: string | number | null = null;

watch(
  () => props.value,
  newValue => {
    activeTab.value = newValue;
  }
);

/** 真正派发切换：清掉兜底定时器，仅派发一次 */
function emitPending() {
  if (pendingValue === null) return;
  if (delayTimer) {
    clearTimeout(delayTimer);
    delayTimer = null;
  }
  emit('update:value', pendingValue);
  pendingValue = null;
}

function handleTabChange(value: string | number) {
  // 左侧指示条立即高亮、开始动画
  activeTab.value = value;
  pendingValue = value;

  if (delayTimer) {
    clearTimeout(delayTimer);
    delayTimer = null;
  }
  // 兜底：若指示条过渡未触发 transitionend，仍按 contentDelay 切换
  if (props.contentDelay > 0) {
    delayTimer = setTimeout(emitPending, props.contentDelay);
  } else {
    emitPending();
  }
}

/** 左侧指示条过渡结束时立即切换右侧内容（比固定延时更跟手，且无多余等待） */
function onBarTransitionEnd(e: TransitionEvent) {
  const target = e.target as HTMLElement | null;
  if (!target?.classList?.contains('n-tabs-bar')) return;
  emitPending();
}
</script>

<template>
  <div class="h-full w-full flex overflow-hidden" @transitionend="onBarTransitionEnd">
    <!--
      左：页面名称 + 竖向 tab 栏（贴边、撑满高度、浅背景 + 右侧分割线）。
      外层 div 必须保留：naive .n-tabs 自带 width:100%，直接当 flex item 会占满整行
    -->
    <div
      class="h-full w-fit shrink-0 flex flex-col border-r border-#e5e7eb bg-container px-0 py-8px dark:border-#2a2a2a"
    >
      <div v-if="title" class="flex shrink-0 items-center gap-8px px-10px pt-4px pb-20px">
        <span class="h-16px w-3px rounded-2px bg-primary" />
        <span class="text-15px font-600">{{ title }}</span>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <NTabs placement="left" type="line" :value="activeTab" @update:value="handleTabChange">
          <NTab v-for="t in tabs" :key="t.value" :name="t.value">{{ t.label }}</NTab>
        </NTabs>
      </div>
    </div>
    <!--
      右：内容区（调用方通过默认插槽提供：表格、动态组件等任意内容）。
      调用方插槽内自带的 <KeepAlive> 负责缓存各 tab 组件（切回已访问过的 tab 直接复用实例，不再重新挂载/取数）；
      此处 <Transition> 直接紧贴插槽，使用主题配置里的页面过渡动画驱动 tab 内容切换效果（与 archive-switch 同构）
    -->
    <div class="min-w-0 min-h-0 flex-1 overflow-hidden p-10px">
      <Transition :name="transitionName" mode="out-in">
        <slot />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/*
  tab 列表撑满侧栏宽度：naive 的竖线指示条（.n-tabs-bar）是绝对定位吸附在 .n-tabs-nav 的右边缘，
  而侧栏是 w-fit（宽度由最宽的兄弟元素决定）—— tab 文案比标题行短时列表会窄于侧栏，
  蓝条就会"飘"在侧栏内部（个人中心：列表 88px / 侧栏 103px，差 15px）。
  强制撑满后蓝条贴侧栏右边缘，且各页表现一致（tab 行同时撑满、整行可点）。
*/
:deep(.n-tabs-nav) {
  width: 100%;
}
</style>
