<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateUser, fetchUpdateUser } from '@/service/api/system-manage';
import UserDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit' | 'detail';

interface Props {
  /** drawer visibility, use v-model:show */
  show?: boolean;
  /** drawer mode: create / edit / detail */
  mode?: DrawerMode;
  /** row data for edit / detail */
  row?: Api.SystemManage.User | null;
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

const model = reactive<Api.SystemManage.UserCreateParams>({
  userName: '',
  nickName: '',
  userPhone: '',
  userEmail: '',
  status: '1'
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'userName',
    label: $t('page.manage.user.userName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.user.form.userNamePlaceholder')
  },
  {
    key: 'nickName',
    label: $t('page.manage.user.nickName'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.user.form.nickNamePlaceholder')
  },
  {
    key: 'userPhone',
    label: $t('page.manage.user.userPhone'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.user.form.userPhonePlaceholder')
  },
  {
    key: 'userEmail',
    label: $t('page.manage.user.userEmail'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.user.form.userEmailPlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.user.status'),
    type: 'switch',
    span: 24,
    checkedText: $t('common.enable'),
    uncheckedText: $t('common.disable')
  }
]);

function fillFormByRow() {
  if (!props.row) return;
  model.userName = props.row.userName;
  model.nickName = props.row.nickName;
  model.userPhone = props.row.userPhone;
  model.userEmail = props.row.userEmail;
  model.status = props.row.status;
}

function resetForm() {
  model.userName = '';
  model.nickName = '';
  model.userPhone = '';
  model.userEmail = '';
  model.status = '1';
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) {
    return;
  }
  submitting.value = true;
  try {
    if (isCreate.value) {
      await fetchCreateUser({ ...model });
      window.$message?.success($t('common.addSuccess'));
    } else {
      await fetchUpdateUser({ id: props.row!.id, ...model });
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
  <UserDrawer
    v-model:show="drawerVisible"
    :title="title"
    :loading="submitting"
    :footer="!isDetail"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" :disabled="isDetail" />
  </UserDrawer>
</template>
