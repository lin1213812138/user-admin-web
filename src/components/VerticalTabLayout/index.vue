<script setup lang="ts">
defineOptions({
  name: 'VerticalTabLayout'
});

interface TabItem {
  /** tab 值（与 v-model:value 比对） */
  value: string | number;
  /** tab 文案 */
  label: string;
}

withDefaults(
  defineProps<{
    /** 当前激活的 tab（v-model:value） */
    value: string | number;
    /** tab 项列表 */
    tabs: TabItem[];
    /** 左栏顶部页面名称（不传则不渲染标题区） */
    title?: string;
  }>(),
  {
    title: ''
  }
);

const emit = defineEmits<{
  'update:value': [value: string | number];
}>();
</script>

<template>
  <div class="h-full w-full flex overflow-hidden">
    <!--
      左：页面名称 + 竖向 tab 栏（贴边、撑满高度、浅背景 + 右侧分割线）。
      外层 div 必须保留：naive .n-tabs 自带 width:100%，直接当 flex item 会占满整行
    -->
    <div
      class="h-full w-fit shrink-0 flex flex-col border-r border-#e5e7eb bg-container px-0 py-8px dark:border-#2a2a2a"
    >
      <div v-if="title" class="flex shrink-0 items-center gap-8px px-16px pt-4px pb-20px">
        <span class="h-16px w-3px rounded-2px bg-primary" />
        <span class="text-15px font-600">{{ title }}</span>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <NTabs placement="left" type="line" :value="value" @update:value="v => emit('update:value', v)">
          <NTab v-for="t in tabs" :key="t.value" :name="t.value">{{ t.label }}</NTab>
        </NTabs>
      </div>
    </div>
    <!-- 右：内容区（由调用方通过默认插槽提供：表格、动态组件等任意内容） -->
    <div class="min-w-0 min-h-0 flex-1 overflow-hidden p-16px">
      <slot />
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
