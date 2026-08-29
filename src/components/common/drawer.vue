<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';

defineOptions({
  name: 'CommonDrawer'
});

interface Props {
  /** drawer visibility, use v-model:show */
  show?: boolean;
  /** drawer title */
  title?: string;
  /** drawer width, number = px, string = css value */
  width?: number | string;
  /** show footer with confirm/cancel buttons */
  footer?: boolean;
  /** confirm button loading state */
  loading?: boolean;
  /** confirm button text */
  confirmText?: string;
  /** cancel button text */
  cancelText?: string;
  /** whether to close on mask click / esc */
  closeOnMask?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  title: '',
  width: 420,
  footer: true,
  loading: false,
  confirmText: '',
  cancelText: '',
  closeOnMask: true
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  submit: [];
  close: [];
}>();

const drawerWidth = computed(() => (typeof props.width === 'number' ? `${props.width}px` : props.width));

function handleUpdateShow(value: boolean) {
  emit('update:show', value);
  if (!value) {
    emit('close');
  }
}

function handleSubmit() {
  emit('submit');
}
</script>

<template>
  <NDrawer
    :show="show"
    :width="drawerWidth"
    :mask-closable="closeOnMask"
    :close-on-esc="closeOnMask"
    display-directive="show"
    @update:show="handleUpdateShow"
  >
    <NDrawerContent :title="title || undefined" :native-scrollbar="false" closable>
      <slot />

      <template #footer>
        <slot name="footer">
          <NSpace v-if="footer" justify="end">
            <NButton :disabled="loading" @click="handleUpdateShow(false)">
              {{ cancelText || $t('common.cancel') }}
            </NButton>
            <NButton type="primary" :loading="loading" @click="handleSubmit">
              {{ confirmText || $t('common.confirm') }}
            </NButton>
          </NSpace>
        </slot>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
