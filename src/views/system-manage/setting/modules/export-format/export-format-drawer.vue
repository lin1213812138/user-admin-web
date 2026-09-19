<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap from '@/components/Form/index.vue';
import InputUpload from '@/components/Upload/input-upload.vue';
import {
  fetchCreateExportTemplate,
  fetchUpdateExportTemplate,
  fetchUploadExportTemplate
} from '@/service/api/export-format';
import { buildExportFormatFormItems } from './form-items';

const props = withDefaults(
  defineProps<{
    /** 抽屉显隐（v-model:show） */
    show?: boolean;
    /** 编辑时的行数据（列表 query 已含表单 6 字段，直接回填无需 /get）；新增时传 null */
    row?: Api.ExportFormat.Template | null;
    /** 新增时的默认模板类别（跟随列表筛选，未筛选时为 0） */
    defaultTemplateType?: number;
  }>(),
  {
    show: false,
    row: null,
    defaultTemplateType: 0
  }
);

const emit = defineEmits<{
  'update:show': [value: boolean];
  /** 新增/编辑成功后通知父级刷新列表 */
  submitted: [];
}>();

function emptyForm(): Api.ExportFormat.SaveParams {
  return {
    name: '',
    templateType: props.defaultTemplateType,
    file: '',
    fileUrl: '',
    thPos: '',
    tdPos: '',
    note: ''
  };
}

/** 上传解析出的字段清单；未重新上传时保持 null ⇒ 提交体不含这些字段 ⇒ 后端不覆盖库中既有值 */
const parsedFields = ref<Api.ExportFormat.ParsedFields | null>(null);
const formModel = ref<Api.ExportFormat.SaveParams>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);
const submitting = ref(false);

const drawerTitle = computed(() =>
  props.row ? $t('page.manage.setting.exportFormat.editTitle') : $t('page.manage.setting.exportFormat.newTitle')
);

/** 表单项（模板类别选项由 builder 内部取当前语言） */
const formItems = computed(() => buildExportFormatFormItems());

/** 打开时初始化：编辑以列表行数据回填（query 未 omit 这 6 个字段），新增用默认值（类别跟随列表筛选） */
watch(
  () => props.show,
  value => {
    if (!value) return;

    parsedFields.value = null;
    formRef.value?.restoreValidation();

    const row = props.row;

    formModel.value = row
      ? {
          _id: row._id,
          name: row.name,
          templateType: row.templateType,
          file: row.file,
          fileUrl: row.fileUrl,
          thPos: row.thPos ?? '',
          tdPos: row.tdPos ?? '',
          note: row.note ?? ''
        }
      : emptyForm();
  }
);

/** 模板上传：走导出格式专用解析接口，返回地址与解析结果 */
async function uploadExportTemplate(file: File) {
  const { data: uploadData, error } = await fetchUploadExportTemplate(file);

  return error || !uploadData ? null : { url: uploadData.fileUrl, raw: uploadData };
}

/** 上传解析成功：回填文件地址，并暂存字段清单随保存一起提交 */
function handleParsed(raw: unknown) {
  const result = raw as Api.ExportFormat.UploadResult;

  formModel.value.file = result.file;
  formModel.value.fileUrl = result.fileUrl;

  parsedFields.value = {
    fieldRow: result.fieldRow,
    infoList: result.infoList,
    fieldList: result.fieldList,
    subFieldList: result.subFieldList,
    subList: result.subList,
    barcodeList: result.barcodeList,
    subBarcodeList: result.subBarcodeList
  };
}

async function handleSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  submitting.value = true;
  try {
    // 未重新上传时 parsedFields 为 null：提交体不含字段清单，后端保持库中原值
    const extraFields = parsedFields.value ?? {};
    const payload: Api.ExportFormat.SaveParams = { ...formModel.value, ...extraFields };
    const { error } = props.row ? await fetchUpdateExportTemplate(payload) : await fetchCreateExportTemplate(payload);

    if (error) return;

    emit('update:show', false);
    emit('submitted');
    window.$message?.success($t(props.row ? 'common.saveSuccess' : 'common.createSuccess'));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Drawer
    :show="show"
    :title="drawerTitle"
    :loading="submitting"
    :confirm-text="$t('common.save')"
    @update:show="value => emit('update:show', value)"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems">
      <template #file>
        <InputUpload
          :value="formModel.file"
          :upload="uploadExportTemplate"
          @success="handleParsed"
          @remove="
            formModel.file = '';
            formModel.fileUrl = '';
          "
        />
      </template>
    </NFormWrap>
  </Drawer>
</template>
