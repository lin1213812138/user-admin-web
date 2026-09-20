<script setup lang="ts">
import { computed, useSlots } from 'vue';
import type { CSSProperties } from 'vue';
import { useThemeVars } from 'naive-ui';

defineOptions({
  name: 'LCard'
});

interface Props {
  /** 标题文案（与 #title 插槽二选一） */
  title?: string;
  /**
   * 是否渲染头部
   *
   * 不传时按「有 title / #title / #header-extra」自动判断；显式传值以此为准（`show-header={false}` 强制隐藏）
   */
  showHeader?: boolean;
  /** 标题前竖条颜色，默认跟随主题主色 */
  barColor?: string;
  /** 头部内边距，默认较 NCard 收紧 */
  headerPadding?: string;
  /** 内容内边距：false 去掉内边距（便于放自带布局的表格/页签） */
  contentPadding?: string | number | false;
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  showHeader: undefined,
  barColor: undefined,
  headerPadding: '10px 16px',
  contentPadding: '16px'
});

const slots = useSlots();

/** 头部显隐：显式 showHeader 优先，未传时按有无标题 / 右侧插槽自动判断 */
const headerVisible = computed(
  () => props.showHeader ?? (Boolean(props.title) || Boolean(slots.title) || Boolean(slots['header-extra']))
);

const themeVars = useThemeVars();

/** 标题竖条：默认主题主色，随主题/暗色自动变化 */
const barStyle = computed(() => ({ backgroundColor: props.barColor ?? themeVars.value.primaryColor }));

/**
 * 卡片根的内联 flex：写成 style 而不只靠作用域 class，
 * 避免 NCard 内部结构 / 作用域样式命中问题导致内容区拿不到高度（表现为表格被压成"只有一个表头"）
 */
const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column'
};

const contentStyle = computed<CSSProperties>(() => {
  const padding =
    props.contentPadding === false
      ? '0'
      : typeof props.contentPadding === 'number'
        ? `${props.contentPadding}px`
        : props.contentPadding;

  return {
    padding,
    display: 'flex',
    flex: '1 1 0%',
    flexDirection: 'column',
    minHeight: '0'
  };
});
</script>

<template>
  <NCard
    :bordered="false"
    class="l-card shadow-sm"
    :style="cardStyle"
    :header-style="{ padding: headerPadding }"
    :content-style="contentStyle"
  >
    <template v-if="headerVisible" #header>
      <div class="flex-y-center justify-between gap-12px">
        <div class="flex-y-center gap-8px">
          <span class="l-card-bar" :style="barStyle"></span>
          <slot name="title">{{ title }}</slot>
        </div>
        <slot name="header-extra"></slot>
      </div>
    </template>

    <slot></slot>
  </NCard>
</template>

<style scoped>
/* 纵向 flex 链走 script 里的 cardStyle / contentStyle（内联样式，确保生效） */
.l-card-bar {
  width: 4px;
  height: 16px;
  flex-shrink: 0;
  border-radius: 2px;
}
</style>
