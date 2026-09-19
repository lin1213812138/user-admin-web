<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap from '@/components/Form/index.vue';
import { fetchCopyPrintTemplate, fetchCreatePrintTemplate } from '@/service/api/print-format';
import { buildPrintFormatFormItems } from './form-items';

const props = withDefaults(
  defineProps<{
    /** 抽屉显隐（v-model:show） */
    show?: boolean;
    /** 抽屉模式：create 新增 / copy 复制（design 由服务端复制）/ view 只读查看 */
    mode?: 'create' | 'copy' | 'view';
    /** 复制 / 查看时的源模板（列表行数据）；新增时传 null */
    row?: Api.PrintFormat.Template | null;
    /** 新增时的默认模板类型（跟随列表筛选，未筛选时为 0） */
    defaultTemplateType?: Api.PrintFormat.TemplateType;
  }>(),
  {
    show: false,
    mode: 'create',
    row: null,
    defaultTemplateType: 0
  }
);

const emit = defineEmits<{
  'update:show': [value: boolean];
  /** 新增/复制成功后通知父级刷新列表 */
  submitted: [];
}>();

function emptyForm(): Api.PrintFormat.SaveParams {
  return {
    name: '',
    templateType: props.defaultTemplateType,
    templateMode: 0,
    sizeType: 2,
    isDefault: 0,
    note: ''
  };
}

/** 复制模式的源模板 id（提交走 /print-template/copy/create 时需要） */
const copySourceId = ref('');
const formModel = ref<Api.PrintFormat.SaveParams>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);
const submitting = ref(false);

const drawerTitle = computed(() =>
  props.mode === 'create'
    ? $t('page.manage.setting.printFormat.newTitle')
    : props.mode === 'copy'
      ? $t('page.manage.setting.printFormat.copyTitle')
      : $t('page.manage.setting.printFormat.detailTitle')
);

/** 只读查看时隐藏底部保存按钮 */
const showFooter = computed(() => props.mode !== 'view');

/** 表单项：自定义尺寸（sizeType=5）时由 builder 追加宽高输入（mm） */
const formItems = computed(() => buildPrintFormatFormItems(formModel.value.sizeType));

/** 打开时按模式初始化表单：新增用默认值（类型跟随列表筛选），复制 / 查看回填源模板 */
watch(
  () => props.show,
  value => {
    if (!value) return;

    formRef.value?.restoreValidation();

    const row = props.row;

    if (row && props.mode !== 'create') {
      copySourceId.value = props.mode === 'copy' ? row._id : '';
      formModel.value = {
        name: row.name,
        templateType: row.templateType,
        templateMode: row.templateMode,
        sizeType: row.sizeType,
        width: row.width,
        height: row.height,
        // 复制不继承源模板的默认标记
        isDefault: props.mode === 'copy' ? 0 : row.isDefault,
        note: row.note ?? ''
      };
      return;
    }

    copySourceId.value = '';
    formModel.value = emptyForm();
  }
);

async function handleSubmit() {
  if (props.mode === 'view') {
    emit('update:show', false);
    return;
  }

  const ok = await formRef.value?.validate();
  if (!ok) return;

  const params: Api.PrintFormat.SaveParams = { ...formModel.value };
  // 非自定义尺寸时宽高由后端按固定档位回填，无需提交
  if (params.sizeType !== 5) {
    delete params.width;
    delete params.height;
  }

  submitting.value = true;
  try {
    const { error } =
      props.mode === 'create'
        ? await fetchCreatePrintTemplate(params)
        : await fetchCopyPrintTemplate({ copyId: copySourceId.value, pdfTemplate: params });

    // 后端错误（重名等）已由 request 拦截器统一提示，这里保持抽屉打开
    if (error) return;

    emit('update:show', false);
    emit('submitted');
    window.$message?.success($t('common.saveSuccess'));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Drawer
    :show="show"
    :title="drawerTitle"
    :footer="showFooter"
    :loading="submitting"
    @update:show="value => emit('update:show', value)"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" :mode="mode === 'view' ? 'view' : 'edit'" />
  </Drawer>
</template>
