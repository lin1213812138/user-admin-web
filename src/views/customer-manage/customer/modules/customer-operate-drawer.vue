<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateCustomer, fetchUpdateCustomer } from '@/service/api/customer';
import GroupDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit' | 'detail';

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 抽屉模式：新增 / 编辑 / 详情 */
  mode?: DrawerMode;
  /** 编辑 / 详情行数据 */
  row?: Api.SystemManage.Customer | null;
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

const customerLevelOptions = computed<CommonType.Option<Api.SystemManage.CustomerLevel>[]>(() => [
  { label: $t('page.manage.customer.levelNormal'), value: 'normal' },
  { label: $t('page.manage.customer.levelImportant'), value: 'important' },
  { label: $t('page.manage.customer.levelVip'), value: 'vip' }
]);

const customerSourceOptions = computed<CommonType.Option<Api.SystemManage.CustomerSource>[]>(() => [
  { label: $t('page.manage.customer.sourceWebsite'), value: 'website' },
  { label: $t('page.manage.customer.sourceReferral'), value: 'referral' },
  { label: $t('page.manage.customer.sourceAd'), value: 'ad' }
]);

const model = reactive<Api.SystemManage.CustomerCreateParams>({
  customerCode: '',
  customerName: '',
  customerLevel: 'normal',
  customerSource: 'website',
  contactName: '',
  contactPhone: '',
  email: '',
  address: '',
  remark: '',
  status: 1
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'basic',
    label: $t('page.manage.customer.basicInfo'),
    type: 'section',
    span: 24
  },
  {
    key: 'customerCode',
    label: $t('page.manage.customer.customerCode'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.customer.form.customerCodePlaceholder')
  },
  {
    key: 'customerName',
    label: $t('page.manage.customer.customerName'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.customer.form.customerNamePlaceholder')
  },
  {
    key: 'customerLevel',
    label: $t('page.manage.customer.customerLevel'),
    type: 'select',
    span: 12,
    options: customerLevelOptions.value,
    placeholder: $t('page.manage.customer.form.customerLevelPlaceholder')
  },
  {
    key: 'customerSource',
    label: $t('page.manage.customer.customerSource'),
    type: 'select',
    span: 12,
    options: customerSourceOptions.value,
    placeholder: $t('page.manage.customer.form.customerSourcePlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.customer.status'),
    type: 'switch',
    span: 24,
    checkedText: $t('common.enable'),
    uncheckedText: $t('common.disable'),
    checkedValue: 1,
    uncheckedValue: 0
  },
  {
    key: 'contact',
    label: $t('page.manage.customer.contactInfo'),
    type: 'section',
    span: 24
  },
  {
    key: 'contactName',
    label: $t('page.manage.customer.contactName'),
    type: 'input',
    span: 12,
    placeholder: $t('page.manage.customer.form.contactNamePlaceholder')
  },
  {
    key: 'contactPhone',
    label: $t('page.manage.customer.contactPhone'),
    type: 'input',
    span: 12,
    placeholder: $t('page.manage.customer.form.contactPhonePlaceholder')
  },
  {
    key: 'email',
    label: $t('page.manage.customer.email'),
    type: 'input',
    span: 12,
    placeholder: $t('page.manage.customer.form.emailPlaceholder')
  },
  {
    key: 'address',
    label: $t('page.manage.customer.address'),
    type: 'textarea',
    span: 12,
    placeholder: $t('page.manage.customer.form.addressPlaceholder')
  },
  {
    key: 'remarkSection',
    label: $t('page.manage.customer.remark'),
    type: 'section',
    span: 24
  },
  {
    key: 'remark',
    label: $t('page.manage.customer.remark'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.manage.customer.form.remarkPlaceholder')
  }
]);

function fillFormByRow() {
  if (!props.row) return;
  model.customerCode = props.row.customerCode;
  model.customerName = props.row.customerName;
  model.customerLevel = props.row.customerLevel;
  model.customerSource = props.row.customerSource;
  model.contactName = props.row.contactName;
  model.contactPhone = props.row.contactPhone;
  model.email = props.row.email;
  model.address = props.row.address;
  model.remark = props.row.remark;
  model.status = props.row.status;
}

function resetForm() {
  model.customerCode = '';
  model.customerName = '';
  model.customerLevel = 'normal';
  model.customerSource = 'website';
  model.contactName = '';
  model.contactPhone = '';
  model.email = '';
  model.address = '';
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
      await fetchCreateCustomer({ ...model });
      window.$message?.success($t('common.addSuccess'));
    } else {
      await fetchUpdateCustomer({ id: props.row!.id, ...model });
      window.$message?.success($t('common.updateSuccess'));
    }

    drawerVisible.value = false;
    emit('submitted');
  } catch (error) {
    // 本地 mock 校验（如客户编号重复）会抛错需自行提示；真实接口错误已由 request 拦截器统一提示
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
  <GroupDrawer
    v-model:show="drawerVisible"
    :title="title"
    :loading="submitting"
    :footer="!isDetail"
    width="640"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" :mode="isDetail ? 'view' : 'edit'" />
  </GroupDrawer>
</template>

<style scoped></style>
