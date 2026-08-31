<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateRole, fetchUpdateRole } from '@/service/api/system-manage';
import CommonDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit' | 'detail';

interface Props {
  /** drawer visibility, use v-model:show */
  show?: boolean;
  /** drawer mode: create / edit / detail */
  mode?: DrawerMode;
  /** row data for edit / detail */
  row?: Api.SystemManage.Role | null;
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

const model = reactive<Api.SystemManage.RoleCreateParams>({
  roleName: '',
  roleCode: '',
  remark: '',
  sort: 1,
  status: '1'
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'roleName',
    label: $t('page.manage.role.roleName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.role.form.roleNamePlaceholder')
  },
  {
    key: 'roleCode',
    label: $t('page.manage.role.roleCode'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.role.form.roleCodePlaceholder')
  },
  {
    key: 'sort',
    label: $t('page.manage.role.sort'),
    type: 'number',
    required: true,
    span: 24,
    placeholder: $t('page.manage.role.form.sortPlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.role.status'),
    type: 'switch',
    span: 24,
    checkedText: $t('common.enable'),
    uncheckedText: $t('common.disable')
  },
  {
    key: 'remark',
    label: $t('page.manage.role.remark'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.manage.role.form.remarkPlaceholder')
  }
]);

function fillFormByRow() {
  if (!props.row) return;
  model.roleName = props.row.roleName;
  model.roleCode = props.row.roleCode;
  model.remark = props.row.remark;
  model.sort = props.row.sort;
  model.status = props.row.status;
}

function resetForm() {
  model.roleName = '';
  model.roleCode = '';
  model.remark = '';
  model.sort = 1;
  model.status = '1';
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) {
    return;
  }
  submitting.value = true;
  try {
    if (isCreate.value) {
      await fetchCreateRole({ ...model });
      window.$message?.success($t('common.addSuccess'));
    } else {
      await fetchUpdateRole({ id: props.row!.id, ...model });
      window.$message?.success($t('common.updateSuccess'));
    }
    drawerVisible.value = false;
    emit('submitted');
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
  <CommonDrawer
    v-model:show="drawerVisible"
    :title="title"
    :loading="submitting"
    :footer="!isDetail"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" :disabled="isDetail" />
  </CommonDrawer>
</template>
