<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateRole, fetchGetRoleQueryList, fetchUpdateRole } from '@/service/api/role';
import CommonDrawer from '@/components/common/drawer.vue';
import NForm, { type FormItemConfig } from '@/components/Form/index.vue';

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

const formRef = ref<InstanceType<typeof NForm>>();

/** 权限套用下拉选项（真实 /role/query 全量，编辑时排除自身） */
const refRoleOptions = ref<CommonType.Option<string>[]>([]);

async function loadRefRoleOptions() {
  const { data } = await fetchGetRoleQueryList();
  refRoleOptions.value = (data?.list ?? [])
    .filter(item => item._id !== props.row?._id)
    .map(item => ({ label: item.name, value: item._id }));
}

/** 角色类型下拉选项（后端 RoleType：0-客服 1-销售 2-操作 3-财务 4-经理 5-管理员） */
const roleTypeOptions = computed<CommonType.Option<Api.SystemManage.RoleType>[]>(() => [
  { label: $t('page.manage.role.roleTypes.service'), value: 0 },
  { label: $t('page.manage.role.roleTypes.sales'), value: 1 },
  { label: $t('page.manage.role.roleTypes.operation'), value: 2 },
  { label: $t('page.manage.role.roleTypes.finance'), value: 3 },
  { label: $t('page.manage.role.roleTypes.manager'), value: 4 },
  { label: $t('page.manage.role.roleTypes.admin'), value: 5 }
]);

const model = reactive<Api.SystemManage.RoleCreateParams>({
  name: '',
  roleType: 0,
  desc: '',
  refId: undefined,
  dataAuths: [],
  sendOrderCtrl: 1,
  sendCtrl: 0,
  orderColCtrl: 1,
  editInfoCtrl: 1,
  order: 0
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.role.roleName'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.role.form.roleNamePlaceholder')
  },
  {
    key: 'roleType',
    label: $t('page.manage.role.roleType'),
    type: 'select',
    span: 12,
    options: roleTypeOptions.value,
    placeholder: $t('page.manage.role.form.roleTypePlaceholder')
  },
  {
    key: 'refId',
    label: $t('page.manage.role.refId'),
    type: 'select',
    span: 12,
    clearable: true,
    options: refRoleOptions.value,
    placeholder: $t('page.manage.role.form.refIdPlaceholder')
  },
  {
    key: 'order',
    label: $t('page.manage.role.order'),
    type: 'number',
    span: 12,
    placeholder: $t('page.manage.role.form.orderPlaceholder')
  },
  {
    key: 'dataAuths',
    label: $t('page.manage.role.dataAuths'),
    slot: 'dataAuths',
    span: 24
  },
  {
    key: 'sendOrderCtrl',
    label: $t('page.manage.role.ctrls.sendOrder'),
    type: 'switch',
    span: 12,
    checkedValue: 1,
    uncheckedValue: 0
  },
  {
    key: 'sendCtrl',
    label: $t('page.manage.role.ctrls.sendCtrl'),
    type: 'switch',
    span: 12,
    checkedValue: 1,
    uncheckedValue: 0
  },
  {
    key: 'orderColCtrl',
    label: $t('page.manage.role.ctrls.orderCol'),
    type: 'switch',
    span: 12,
    checkedValue: 1,
    uncheckedValue: 0
  },
  {
    key: 'editInfoCtrl',
    label: $t('page.manage.role.ctrls.editInfo'),
    type: 'switch',
    span: 12,
    checkedValue: 1,
    uncheckedValue: 0
  },
  {
    key: 'desc',
    label: $t('page.manage.role.desc'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.manage.role.form.descPlaceholder')
  }
]);

function fillFormByRow() {
  if (!props.row) return;
  model.name = props.row.name;
  model.roleType = props.row.roleType ?? 0;
  model.desc = props.row.desc ?? '';
  model.refId = props.row.refId || undefined;
  model.dataAuths = props.row.dataAuths ? [...props.row.dataAuths] : [];
  model.sendOrderCtrl = props.row.sendOrderCtrl ?? 1;
  model.sendCtrl = props.row.sendCtrl ?? 0;
  model.orderColCtrl = props.row.orderColCtrl ?? 1;
  model.editInfoCtrl = props.row.editInfoCtrl ?? 1;
  model.order = props.row.order ?? 0;
}

function resetForm() {
  model.name = '';
  model.roleType = 0;
  model.desc = '';
  model.refId = undefined;
  model.dataAuths = [];
  model.sendOrderCtrl = 1;
  model.sendCtrl = 0;
  model.orderColCtrl = 1;
  model.editInfoCtrl = 1;
  model.order = 0;
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
      await fetchUpdateRole({ _id: props.row!._id, ...model });
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
    loadRefRoleOptions();
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
    <NForm ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" :mode="isDetail ? 'view' : 'edit'">
      <template #dataAuths>
        <NCheckboxGroup v-model:value="model.dataAuths" :disabled="isDetail">
          <NSpace :size="16" wrap>
            <NCheckbox :value="0">{{ $t('page.manage.role.dataAuthOptions.user') }}</NCheckbox>
            <NCheckbox :value="1">{{ $t('page.manage.role.dataAuthOptions.group') }}</NCheckbox>
          </NSpace>
        </NCheckboxGroup>
      </template>
    </NForm>
  </CommonDrawer>
</template>
