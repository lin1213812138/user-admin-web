<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateSite, fetchUpdateSite } from '@/service/api/system-manage';
import SiteDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit' | 'detail';

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 抽屉模式：新增 / 编辑 / 详情 */
  mode?: DrawerMode;
  /** 编辑 / 详情行数据 */
  row?: Api.SystemManage.Site | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  mode: 'create',
  row: null
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  submitted: [];
}>();

const drawerVisible = computed({
  get: () => props.show,
  set: val => emit('update:show', val)
});

const isDetail = computed(() => props.mode === 'detail');
const isCreate = computed(() => props.mode === 'create');

const title = computed(() => {
  if (props.mode === 'edit') return $t('common.edit');
  if (props.mode === 'detail') return $t('common.detail');
  return $t('common.add');
});

const submitting = ref(false);

const formRef = ref<InstanceType<typeof NFormWrap>>();

const model = reactive<Api.SystemManage.SiteCreateParams>({
  siteCode: '',
  siteName: '',
  contactName: '',
  contactPhone: '',
  workTime: '',
  defaultOrigin: '',
  warehouseAddress: '',
  remark: '',
  status: 1
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'siteCode',
    label: $t('page.manage.site.siteCode'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.site.form.siteCodePlaceholder')
  },
  {
    key: 'siteName',
    label: $t('page.manage.site.siteName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.site.form.siteNamePlaceholder')
  },
  {
    key: 'contactName',
    label: $t('page.manage.site.contactName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.site.form.contactNamePlaceholder')
  },
  {
    key: 'contactPhone',
    label: $t('page.manage.site.contactPhone'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.site.form.contactPhonePlaceholder')
  },
  {
    key: 'workTime',
    label: $t('page.manage.site.workTime'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.site.form.workTimePlaceholder')
  },
  {
    key: 'defaultOrigin',
    label: $t('page.manage.site.defaultOrigin'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.site.form.defaultOriginPlaceholder')
  },
  {
    key: 'warehouseAddress',
    label: $t('page.manage.site.warehouseAddress'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.manage.site.form.warehouseAddressPlaceholder')
  },
  {
    key: 'remark',
    label: $t('page.manage.site.remark'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.manage.site.form.remarkPlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.site.status'),
    type: 'switch',
    span: 24,
    checkedText: $t('common.enable'),
    uncheckedText: $t('common.disable'),
    checkedValue: 1,
    uncheckedValue: 0
  }
]);

function fillFormByRow() {
  if (!props.row) return;
  model.siteCode = props.row.siteCode;
  model.siteName = props.row.siteName;
  model.contactName = props.row.contactName;
  model.contactPhone = props.row.contactPhone;
  model.workTime = props.row.workTime;
  model.defaultOrigin = props.row.defaultOrigin;
  model.warehouseAddress = props.row.warehouseAddress;
  model.remark = props.row.remark;
  model.status = props.row.status;
}

function resetForm() {
  model.siteCode = '';
  model.siteName = '';
  model.contactName = '';
  model.contactPhone = '';
  model.workTime = '';
  model.defaultOrigin = '';
  model.warehouseAddress = '';
  model.remark = '';
  model.status = 1;
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) {
    return;
  }

  submitting.value = true;

  try {
    if (isCreate.value) {
      await fetchCreateSite({ ...model });
      window.$message?.success($t('common.addSuccess'));
    } else {
      await fetchUpdateSite({ id: props.row!.id, ...model });
      window.$message?.success($t('common.updateSuccess'));
    }

    drawerVisible.value = false;
    emit('submitted');
  } catch (error) {
    // 本地 mock 校验（如站点编号重复）会抛错需自行提示；真实接口错误已由 request 拦截器统一提示
    window.$message?.error(error instanceof Error ? error.message : String(error));
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.show,
  val => {
    if (!val) return;

    if (isCreate.value) {
      resetForm();
    } else {
      fillFormByRow();
    }
  }
);
</script>

<template>
  <SiteDrawer
    v-model:show="drawerVisible"
    :title="title"
    :loading="submitting"
    :footer="!isDetail"
    width="520"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" :mode="isDetail ? 'view' : 'edit'" />
  </SiteDrawer>
</template>

<style scoped></style>
