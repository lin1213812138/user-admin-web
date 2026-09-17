<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui';
import { NButton, NUpload, NUploadDragger } from 'naive-ui';
import { $t } from '@/locales';
import { fetchUpload } from '@/service/api';

defineOptions({
  name: 'Upload'
});

type Value = string | string[];

interface Props {
  /** 已上传文件地址：max=1 为字符串，max>1 为字符串数组 */
  value?: Value;
  /** 上传目录：1-用户 2-公司 3-打印格式 4-导出格式 5-服务商 6-工单 7-运单 8-交易 9-问题件 10-临时 */
  dest: Api.Upload.Dest;
  /** 展示形态：image-card 图片卡片 / file 文件列表（按钮触发）/ dragger 拖拽区 */
  listType?: 'image-card' | 'file' | 'dragger';
  /** 最大文件数（>1 时 value 为数组） */
  max?: number;
  /** 可选择的文件类型（默认 image-card 为 image/*，file / dragger 不限制） */
  accept?: string;
  /** 单文件大小上限（MB） */
  maxSize?: number;
  /** 允许拖入文件夹（仅 dragger 形态生效，透传 naive directory-dnd） */
  directoryDnd?: boolean;
  /** 禁用 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  listType: 'image-card',
  max: 1,
  accept: undefined,
  maxSize: undefined,
  directoryDnd: undefined,
  disabled: false
});

const emit = defineEmits<{
  'update:value': [value: Value];
  success: [result: Api.Upload.Result];
  remove: [url: string];
}>();

/** 形态判定：image-card 图片卡片 / dragger 拖拽区 / file 文件列表 */
const isImageCard = computed(() => props.listType === 'image-card');
const isDragger = computed(() => props.listType === 'dragger');

/** 多文件模式（max>1；naive 需显式开启 multiple 才允许一次多选） */
const multiple = computed(() => props.max > 1);

/** naive 列表形态：image-card 图片卡片 / text 文件列表（显式类型参数避免字面量拓宽为 string） */
const naiveListType = computed<'image-card' | 'text'>(() => (isImageCard.value ? 'image-card' : 'text'));

/** 实际文件类型限制（image-card 默认图片；file / dragger 默认不限制） */
const resolvedAccept = computed(() => props.accept ?? (isImageCard.value ? 'image/*' : undefined));

/** 从 URL 取展示文件名（后端文件名为 uuid.ext，仅作回显展示） */
function fileNameOf(url: string) {
  return url.split('/').pop() || url;
}

/** 由 v-model 值派生 naive 文件列表（受控回显） */
function toFileList(value: Value): UploadFileInfo[] {
  const urls = Array.isArray(value) ? value : value ? [value] : [];

  return urls.map(url => ({ id: url, name: fileNameOf(url), status: 'finished', url }));
}

/** 列表中的已完成地址（按列表顺序） */
function finishedUrls(list: UploadFileInfo[]): string[] {
  return list.filter(file => file.status === 'finished' && file.url).map(file => file.url as string);
}

/** 内部文件列表（上传中 / 失败项也在此，是列表渲染的唯一数据源） */
const fileList = ref<UploadFileInfo[]>(toFileList(props.value));

// 外部值变化时同步列表：与已完成项一致则跳过，避免覆盖上传中 / 失败项
watch(
  () => props.value,
  value => {
    const urls = Array.isArray(value) ? value : value ? [value] : [];
    const current = finishedUrls(fileList.value);

    if (current.length === urls.length && current.every((url, index) => url === urls[index])) return;

    fileList.value = toFileList(value);
  }
);

/** 把列表中的已完成项写回 v-model（值未变化不重复 emit；上传中 / 失败项不写，保证上传中提交不丢旧值） */
function syncValue(list: UploadFileInfo[]) {
  const urls = finishedUrls(list);
  const next: Value = multiple.value ? urls : (urls[0] ?? '');
  const current: Value = props.value ?? '';
  const same = Array.isArray(next)
    ? Array.isArray(current) && next.length === current.length && next.every((url, index) => url === current[index])
    : next === current;

  if (!same) emit('update:value', next);
}

/** 文件列表变更（添加 / 进度 / 完成 / 删除）：同步内部列表并回写 v-model */
function handleFileListUpdate(list: UploadFileInfo[]) {
  fileList.value = list;
  syncValue(list);
}

/** 选择文件前置校验：超过 maxSize 的文件不进入列表 */
function handleBeforeUpload({ file }: { file: UploadFileInfo }) {
  const maxSize = props.maxSize;

  if (!maxSize || (file.file?.size ?? 0) <= maxSize * 1024 * 1024) return true;

  window.$message?.warning($t('common.upload.exceedSize', { size: maxSize }));

  return false;
}

/** 移除前通知（仅前端解绑，不调后端删除接口） */
function handleRemove({ file }: { file: UploadFileInfo }) {
  if (file.url) emit('remove', file.url);

  return true;
}

/** 自定义上传：走通用 /upload 接口，进度写回列表项（失败提示由 request 层统一处理） */
async function handleCustomRequest({ file, onProgress, onFinish, onError }: UploadCustomRequestOptions) {
  if (!file.file) {
    onError();

    return;
  }

  const { data, error } = await fetchUpload(file.file, props.dest, percent => onProgress({ percent }));

  if (error || !data?.url) {
    onError();

    return;
  }

  // naive 的 onFinish 为无参（url 由文件项自身携带），故把地址写在 file 上再结束
  file.url = data.url;
  onFinish();
  emit('success', data);
}

/** NUpload 透传 props（两个形态分支共用；集中在 computed 里避免重复绑定） */
const uploadProps = computed(() => ({
  fileList: fileList.value,
  listType: naiveListType.value,
  multiple: multiple.value,
  max: props.max,
  accept: resolvedAccept.value,
  directoryDnd: props.directoryDnd,
  disabled: props.disabled,
  customRequest: handleCustomRequest,
  onBeforeUpload: handleBeforeUpload,
  onRemove: handleRemove,
  'onUpdate:fileList': handleFileListUpdate
}));
</script>

<template>
  <!-- image-card：不传默认插槽，保留 naive 原生「+」上传块 -->
  <NUpload v-if="isImageCard" v-bind="uploadProps" class="upload w-full" />
  <!-- file / dragger：naive 无内置触发内容，默认插槽提供触发区 -->
  <NUpload v-else v-bind="uploadProps" class="upload w-full">
    <template #default>
      <NUploadDragger v-if="isDragger">
        <div class="flex flex-col items-center">
          <icon-mdi-cloud-upload-outline class="mb-8px text-48px text-gray-400" />
          <span class="text-14px">{{ $t('common.upload.draggerText') }}</span>
        </div>
      </NUploadDragger>
      <NButton v-else size="small">
        <template #icon>
          <icon-mdi-upload class="text-icon" />
        </template>
        {{ $t('common.chooseFile') }}
      </NButton>
    </template>
  </NUpload>
</template>

<style scoped>
/* 图片卡片缩略图完整显示（不裁切非正方形图片，如公司 LOGO） */
.upload :deep(.n-upload-file img) {
  object-fit: contain !important;
}
</style>
