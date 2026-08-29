<script setup lang="ts">
import { computed } from 'vue';
import { useThemeVars } from 'naive-ui';

defineOptions({
  name: 'Link',
  inheritAttrs: false
});

type LinkType = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type LinkUnderline = 'hover' | 'always' | 'never';
type LinkIconPosition = 'left' | 'right';

interface Props {
  /** 链接类型，对应文字颜色 */
  type?: LinkType;
  /** 下划线显示时机 */
  underline?: LinkUnderline;
  /** 是否禁用 */
  disabled?: boolean;
  /** 原生 href，存在时渲染为 <a> */
  href?: string;
  /** 配合 href 使用，如 _blank */
  target?: string;
  /** 图标位置 */
  iconPosition?: LinkIconPosition;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  underline: 'hover',
  disabled: false,
  href: '',
  target: '_self',
  iconPosition: 'left'
});

const emit = defineEmits<{
  (e: 'click', evt: MouseEvent): void;
}>();

const themeVars = useThemeVars();

const isAnchor = computed(() => Boolean(props.href) && !props.disabled);

const typeClass = computed(() => `link--${props.type}`);

const underlineClass = computed(() => {
  if (props.disabled) return 'link--underline-never';
  return `link--underline-${props.underline}`;
});

// 各类型对应的 naive-ui 主题色（基础色 / hover 色）
const typeColorMap = computed<Record<LinkType, { base: string; hover: string }>>(() => ({
  default: { base: themeVars.value.textColor1, hover: themeVars.value.textColor1 },
  primary: { base: themeVars.value.primaryColor, hover: themeVars.value.primaryColorHover },
  success: { base: themeVars.value.successColor, hover: themeVars.value.successColorHover },
  warning: { base: themeVars.value.warningColor, hover: themeVars.value.warningColorHover },
  danger: { base: themeVars.value.errorColor, hover: themeVars.value.errorColorHover },
  info: { base: themeVars.value.infoColor, hover: themeVars.value.infoColorHover }
}));

const linkColor = computed(() => typeColorMap.value[props.type].base);
const linkColorHover = computed(() => typeColorMap.value[props.type].hover);

function handleClick(evt: MouseEvent) {
  if (props.disabled) {
    evt.preventDefault();
    evt.stopPropagation();
    return;
  }
  emit('click', evt);
}
</script>

<template>
  <component
    :is="isAnchor ? 'a' : 'span'"
    v-bind="
      isAnchor
        ? { href, target, onClick: handleClick }
        : { role: 'link', tabindex: disabled ? -1 : 0, onClick: handleClick, onKeydown: (e: KeyboardEvent) => e.key === 'Enter' && handleClick(e as unknown as MouseEvent) }
    "
    class="link"
    :class="[typeClass, underlineClass, { 'link--disabled': disabled }]"
    :style="{ '--link-color': linkColor, '--link-color-hover': linkColorHover }"
  >
    <template v-if="props.iconPosition === 'left'">
      <span v-if="$slots.icon" class="link__icon">
        <slot name="icon" />
      </span>
      <span class="link__inner">
        <slot />
      </span>
    </template>
    <template v-else>
      <span class="link__inner">
        <slot />
      </span>
      <span v-if="$slots.icon" class="link__icon">
        <slot name="icon" />
      </span>
    </template>
  </component>
</template>

<style scoped>
.link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  line-height: 1.4;
  cursor: pointer;
  text-decoration: none;
  outline: none;
  transition: color 0.2s, opacity 0.2s;
  color: var(--link-color, #409eff);
}

/* 类型颜色通过 :style 注入的 --link-color / --link-color-hover（来自 naive-ui 主题色），不再写死 */

/* 下划线 */
.link--underline-hover:hover {
  text-decoration: underline;
  color: var(--link-color-hover);
}
.link--underline-always {
  text-decoration: underline;
}
.link--underline-never {
  text-decoration: none;
}

.link--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.link__icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}
</style>
