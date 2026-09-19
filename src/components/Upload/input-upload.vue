<script setup lang="ts">
import { computed, ref } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { NInput, NTooltip, NUpload } from 'naive-ui';
import { fetchUpload } from '@/service/api';

defineOptions({
  name: 'InputUpload'
});

/**
 * 「输入框 + 上传图标」形态的通用上传控件（与导出格式的 Excel 模板控件同交互，已抽为公共组件）。
 * - 只读输入框展示 value（通常取文件地址末段作为文件名），文件名过长截断并以 tooltip 展示完整名
 * - 右侧移除按钮可清空已选文件；上传图标按钮选择文件后立即上传
 * - 默认走通用 /upload?dest=<n>；传入 upload 则可替换为专用接口（如导出模板解析上传）
 * - v-model:value 保存上传返回的地址；success 事件携带原始返回，供调用方取额外字段（如解析结果）
 */

/** 自定义上传：取代默认 /upload，返回地址与原始结果（失败返回 null） */
type UploadFn = (file: File, onProgress?: (percent: number) => void) => Promise<{ url: string; raw?: unknown } | null>;

interface Props {
  /** 已上传文件地址（/upload 返回的 url），直接作为输入框展示值 */
  value?: string;
  /** 上传目录（默认 /upload?dest=1 用户；仅在未传 upload 时生效） */
  dest?: Api.Upload.Dest;
  /** 可选择的文件类型（如 .xlsx,.xls） */
  accept?: string;
  /** 禁用 */
  disabled?: boolean;
  /** 自定义上传：传入则替代默认 /upload 调用 */
  upload?: UploadFn;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  dest: 1,
  accept: undefined,
  disabled: false,
  upload: undefined
});

const emit = defineEmits<{
  'update:value': [value: string];
  /** 上传成功，携带原始返回（通用为 Api.Upload.Result，导出为解析结果），由调用方按需取字段 */
  success: [raw: unknown];
  /** 移除已选文件（清空值） */
  remove: [];
}>();

const uploading = ref(false);

/** 最近一次上传结果（地址 + 原始文件名）：仅 value 与其地址一致时用于展示原始名 */
const uploaded = ref<{ url: string; name: string } | null>(null);

/** 展示文件名：优先展示本次上传的原始文件名，编辑回填（只有 url）退化为地址末段 */
const displayName = computed(() => {
  if (uploaded.value && props.value === uploaded.value.url) return uploaded.value.name;

  return props.value.split('/').pop() || props.value;
});

/** 选择文件后立即上传（default-upload=false，由这里手动走接口） */
async function handleChange({ fileList }: { fileList: UploadFileInfo[] }) {
  const file = fileList[fileList.length - 1]?.file;
  if (!(file instanceof File)) return;

  uploading.value = true;
  try {
    const result = props.upload
      ? await props.upload(file)
      : await (async () => {
          const { data, error } = await fetchUpload(file, props.dest);

          return error || !data?.url ? null : { url: data.url, raw: data };
        })();

    if (!result) return;

    // 记录原始文件名用于回显（/upload 返回 name；自定义上传从 raw 上按调用方语义读取不到，统一从 name 取）
    const rawName = (result.raw as { name?: string } | undefined)?.name;
    uploaded.value = { url: result.url, name: rawName || file.name };

    emit('update:value', result.url);
    emit('success', result.raw ?? result.url);
  } finally {
    uploading.value = false;
  }
}

/** 移除已选文件 */
function handleRemove() {
  uploaded.value = null;

  emit('update:value', '');
  emit('remove');
}
</script>

<template>
  <NTooltip :disabled="!displayName" placement="top" trigger="hover">
    <template #trigger>
      <NInput :value="displayName" readonly :placeholder="$t('common.chooseFile')" :disabled="disabled">
        <template #suffix>
          <div class="flex items-center gap-4px">
            <LButton
              v-if="displayName && !disabled"
              text
              type="error"
              class="input-upload-remove"
              @click.stop="handleRemove"
            >
              <template #icon>
                <icon-mdi-close-circle class="text-16px" />
              </template>
            </LButton>
            <NUpload
              :accept="accept"
              :default-upload="false"
              :show-file-list="false"
              :disabled="disabled"
              @change="handleChange"
            >
              <LButton text :disabled="disabled" :loading="uploading">
                <template #icon>
                  <icon-mdi-upload class="text-16px" />
                </template>
              </LButton>
            </NUpload>
          </div>
        </template>
      </NInput>
    </template>
    {{ displayName }}
  </NTooltip>
</template>

<style scoped>
/**
 * 只读输入框文件名过长时截断（text-overflow: ellipsis），配合上方 tooltip 展示完整名。
 * NUpload 会多渲染 .n-upload / .n-upload-trigger 两层包裹，其中 .n-upload-trigger 是 inline-block
 * 且 line-height 为输入框高度（34px），内部 inline-flex 按钮因此按基线落位、比输入框垂直中心高 4px。
 * 把两层包裹改为 flex 居中，让上传按钮成为容器的居中 flex item。
 */
:deep(.n-input__input-el) {
  text-overflow: ellipsis;
}

:deep(.n-upload),
:deep(.n-upload-trigger) {
  display: flex;
  align-items: center;
}
</style>
