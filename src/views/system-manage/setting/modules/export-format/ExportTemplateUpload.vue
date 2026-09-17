<script setup lang="ts">
import { ref } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { $t } from '@/locales';
import { fetchUploadExportTemplate } from '@/service/api/export-format';

/**
 * 导出格式专用「Excel 模板」控件（特殊上传组件，非通用上传控件的替代品）。
 * - 只读输入框展示后端返回的模板文件名，右侧上传图标按钮：选择文件 → 上传并解析
 * - 上传走 /export-template/upload?dest=4：后端保存 xlsx 并解析其中的标记（@信息 / #列表 / $子表 / %条码），
 *   回传 file/fileUrl 与字段清单（infoList/fieldList/subList/barcodeList...）
 */

interface Props {
  /** 模板文件名（后端 upload 返回的 file，编辑时回填列表行数据） */
  file?: string;
  disabled?: boolean;
}

// file 经 v-model:file 由父级持有、本组件只读展示；fileUrl 不声明 prop，上传结果通过 update:fileUrl 事件回传
withDefaults(defineProps<Props>(), {
  file: '',
  disabled: false
});

const emit = defineEmits<{
  'update:file': [value: string];
  'update:fileUrl': [value: string];
  /** 上传解析成功，携带后端返回的完整解析结果（调用方用于随保存提交） */
  parsed: [result: Api.ExportFormat.UploadResult];
}>();

const uploading = ref(false);

/** 选择文件后立即上传解析（default-upload=false，由这里手动走接口） */
async function handleChange({ fileList }: { fileList: UploadFileInfo[] }) {
  const file = fileList[fileList.length - 1]?.file;
  if (!(file instanceof File)) return;

  uploading.value = true;
  try {
    const { data, error } = await fetchUploadExportTemplate(file);
    if (error || !data) return;

    emit('update:file', data.file);
    emit('update:fileUrl', data.fileUrl);
    emit('parsed', data);
    window.$message?.success(
      $t('page.manage.setting.exportFormat.uploadParseSuccess', {
        info: data.infoList?.length ?? 0,
        list: data.fieldList?.length ?? 0
      })
    );
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <NInput :value="file" readonly placeholder="请输入">
    <template #suffix>
      <div class="flex items-center">
        <NUpload
          accept=".xlsx,.xls"
          :default-upload="false"
          :show-file-list="false"
          :disabled="disabled"
          @change="handleChange"
        >
          <NButton text :disabled="disabled" :loading="uploading">
            <template #icon>
              <icon-mdi-upload class="text-16px" />
            </template>
          </NButton>
        </NUpload>
      </div>
    </template>
  </NInput>
</template>

<style scoped>
/**
 * NUpload 会多渲染 .n-upload / .n-upload-trigger 两层包裹，其中 .n-upload-trigger 是 inline-block
 * 且 line-height 为输入框高度（34px），内部 inline-flex 按钮因此按基线落位、比输入框垂直中心高 4px。
 * 把两层包裹改为 flex 居中，让上传按钮成为容器的居中 flex item。
 */
:deep(.n-upload),
:deep(.n-upload-trigger) {
  display: flex;
  align-items: center;
}
</style>
