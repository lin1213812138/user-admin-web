<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import {
  fetchCreateUser,
  fetchGetGroupList,
  fetchGetRoleList,
  fetchGetSiteList,
  fetchUpdateUser
} from '@/service/api/system-manage';
import UserDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit' | 'detail';

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 抽屉模式：新增 / 编辑 / 详情 */
  mode?: DrawerMode;
  /** 编辑 / 详情行数据 */
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

/** 下拉选项：用户角色 / 所属站点 / 所属组别 */
const roleOptions = ref<CommonType.Option<number>[]>([]);
const siteOptions = ref<CommonType.Option<number>[]>([]);
const groupOptions = ref<CommonType.Option<number>[]>([]);

async function loadOptions() {
  const [roleList, siteList, groupList] = await Promise.all([
    fetchGetRoleList({ current: 1, size: 100 }) as Promise<Api.SystemManage.RoleList>,
    fetchGetSiteList({ current: 1, size: 100 }) as Promise<Api.SystemManage.SiteList>,
    fetchGetGroupList({ current: 1, size: 100 }) as Promise<Api.SystemManage.GroupList>
  ]);

  roleOptions.value = roleList.records.map(item => ({ label: item.roleName, value: item.id }));
  siteOptions.value = siteList.records.map(item => ({ label: item.siteName, value: item.id }));
  groupOptions.value = groupList.records.map(item => ({ label: item.groupName, value: item.id }));
}

onMounted(() => {
  loadOptions();
});

const genderOptions = computed<CommonType.Option<string>[]>(() => [
  { label: $t('page.manage.user.male'), value: '男' },
  { label: $t('page.manage.user.female'), value: '女' }
]);

const statusOptions = computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);

const model = reactive<Api.SystemManage.UserCreateParams>({
  userName: '',
  nickName: '',
  password: '',
  roleId: null,
  siteId: null,
  groupId: null,
  status: 1,
  realName: '',
  contactPhone: '',
  position: '',
  gender: '',
  email: '',
  hireDate: '',
  birthday: '',
  wechat: '',
  attachment: '',
  homeAddress: '',
  otherContact: '',
  remark: '',
  wechatQrcode: ''
});

const formItems = computed<FormItemConfig[]>(() => [
  { key: 'basicInfo', label: $t('page.manage.user.basicInfo'), type: 'section', span: 24 },
  {
    key: 'userName',
    label: $t('page.manage.user.userName'),
    type: 'input',
    required: true,
    span: 8,
    placeholder: $t('page.manage.user.form.userNamePlaceholder')
  },
  {
    key: 'nickName',
    label: $t('page.manage.user.nickName'),
    type: 'input',
    required: true,
    span: 8,
    placeholder: $t('page.manage.user.form.nickNamePlaceholder')
  },
  {
    key: 'roleId',
    label: $t('page.manage.user.roleName'),
    type: 'select',
    required: true,
    span: 8,
    options: roleOptions.value,
    placeholder: $t('page.manage.user.form.roleNamePlaceholder')
  },
  {
    key: 'password',
    label: $t('page.manage.user.password'),
    type: 'password',
    required: true,
    span: 8,
    placeholder: $t('page.manage.user.form.passwordPlaceholder')
  },
  {
    key: 'siteId',
    label: $t('page.manage.user.siteName'),
    type: 'select',
    required: true,
    span: 8,
    options: siteOptions.value,
    placeholder: $t('page.manage.user.form.siteNamePlaceholder')
  },
  {
    key: 'groupId',
    label: $t('page.manage.user.groupName'),
    type: 'select',
    span: 8,
    options: groupOptions.value,
    placeholder: $t('page.manage.user.form.groupNamePlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.user.status'),
    type: 'select',
    span: 8,
    options: statusOptions.value,
    placeholder: $t('page.manage.user.form.statusPlaceholder')
  },
  { key: 'profileInfo', label: $t('page.manage.user.profileInfo'), type: 'section', span: 24 },
  {
    key: 'realName',
    label: $t('page.manage.user.realName'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.realNamePlaceholder')
  },
  {
    key: 'contactPhone',
    label: $t('page.manage.user.contactPhone'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.contactPhonePlaceholder')
  },
  {
    key: 'position',
    label: $t('page.manage.user.position'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.positionPlaceholder')
  },
  {
    key: 'gender',
    label: $t('page.manage.user.gender'),
    type: 'select',
    span: 8,
    options: genderOptions.value,
    placeholder: $t('page.manage.user.form.genderPlaceholder')
  },
  {
    key: 'email',
    label: $t('page.manage.user.email'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.emailPlaceholder')
  },
  {
    key: 'hireDate',
    label: $t('page.manage.user.hireDate'),
    type: 'date',
    span: 8,
    placeholder: $t('page.manage.user.form.hireDatePlaceholder')
  },
  {
    key: 'birthday',
    label: $t('page.manage.user.birthday'),
    type: 'date',
    span: 8,
    placeholder: $t('page.manage.user.form.birthdayPlaceholder')
  },
  {
    key: 'wechat',
    label: $t('page.manage.user.wechat'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.wechatPlaceholder')
  },
  {
    key: 'attachment',
    label: $t('page.manage.user.attachment'),
    type: 'file',
    span: 8
  },
  {
    key: 'homeAddress',
    label: $t('page.manage.user.homeAddress'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.homeAddressPlaceholder')
  },
  {
    key: 'otherContact',
    label: $t('page.manage.user.otherContact'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.otherContactPlaceholder')
  },
  {
    key: 'remark',
    label: $t('page.manage.user.remark'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.remarkPlaceholder')
  },
  {
    key: 'wechatQrcode',
    label: $t('page.manage.user.wechatQrcode'),
    type: 'image',
    span: 8
  }
]);

function fillFormByRow() {
  if (!props.row) return;
  model.userName = props.row.userName;
  model.nickName = props.row.nickName;
  model.password = props.row.password;
  model.roleId = props.row.roleId;
  model.siteId = props.row.siteId;
  model.groupId = props.row.groupId;
  model.status = props.row.status;
  model.realName = props.row.realName;
  model.contactPhone = props.row.contactPhone;
  model.position = props.row.position;
  model.gender = props.row.gender;
  model.email = props.row.email;
  model.hireDate = props.row.hireDate;
  model.birthday = props.row.birthday;
  model.wechat = props.row.wechat;
  model.attachment = props.row.attachment;
  model.homeAddress = props.row.homeAddress;
  model.otherContact = props.row.otherContact;
  model.remark = props.row.remark;
  model.wechatQrcode = props.row.wechatQrcode;
}

function resetForm() {
  model.userName = '';
  model.nickName = '';
  model.password = '';
  model.roleId = null;
  model.siteId = null;
  model.groupId = null;
  model.status = 1;
  model.realName = '';
  model.contactPhone = '';
  model.position = '';
  model.gender = '';
  model.email = '';
  model.hireDate = '';
  model.birthday = '';
  model.wechat = '';
  model.attachment = '';
  model.homeAddress = '';
  model.otherContact = '';
  model.remark = '';
  model.wechatQrcode = '';
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

    // 每次打开刷新下拉选项，保证新增的角色 / 站点 / 组别可即时选中
    loadOptions();

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
    width="760"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" :disabled="isDetail" />
  </UserDrawer>
</template>

<style scoped></style>
