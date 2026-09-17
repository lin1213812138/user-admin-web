<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateUser, fetchGetUser, fetchUpdateUser } from '@/service/api/user';
import { md5 } from '@/utils/crypto';
import { fetchGetRoleQueryList } from '@/service/api/role';
import { fetchGetSiteList } from '@/service/api/site';
import { fetchGetGroupList } from '@/service/api/group';
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

/** 下拉选项：用户角色（真实 /role/query）/ 所属站点 / 所属组别，主键均为字符串 _id */
const roleOptions = ref<CommonType.Option<string>[]>([]);
const siteOptions = ref<CommonType.Option<string>[]>([]);
const groupOptions = ref<CommonType.Option<string>[]>([]);

async function loadOptions() {
  const [roleRes, siteRes, groupRes] = await Promise.all([
    fetchGetRoleQueryList(),
    fetchGetSiteList({ page: 1, size: 100 }),
    fetchGetGroupList()
  ]);

  roleOptions.value = (roleRes.data?.list ?? []).map(item => ({ label: item.name, value: item._id }));
  siteOptions.value = (siteRes.data?.list ?? []).map(item => ({ label: item.name, value: item._id }));
  groupOptions.value = (groupRes.data?.list ?? []).map(item => ({ label: item.name, value: item._id }));
}

onMounted(() => {
  loadOptions();
});

const sexOptions = computed<CommonType.Option<Api.SystemManage.UserSex>[]>(() => [
  { label: $t('page.manage.user.unknown'), value: 0 },
  { label: $t('page.manage.user.male'), value: 1 },
  { label: $t('page.manage.user.female'), value: 2 }
]);

const statusOptions = computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);

/** 表单模型：日期/身份证按字符串编辑，提交时再转后端要求的毫秒时间戳 / Number */
interface UserFormModel {
  account: string;
  name: string;
  password: string;
  siteId: string;
  status: Api.Common.EnableStatus;
  roleIds: string[];
  groupIds: string[];
  fullName: string;
  sex: Api.SystemManage.UserSex;
  /** 'YYYY-MM-DD'，提交时转毫秒时间戳 */
  birthday: string;
  /** 字符串输入避免编辑期精度损失，提交时转 Number */
  idCard: string;
  address: string;
  phone: string;
  email: string;
  wx: string;
  contact: string;
  job: string;
  /** 'YYYY-MM-DD'，提交时转毫秒时间戳 */
  entryDate: string;
  qrCodeUrl: string;
  file: string;
  note: string;
}

function createEmptyModel(): UserFormModel {
  return {
    account: '',
    name: '',
    password: '',
    siteId: '',
    status: 1,
    roleIds: [],
    groupIds: [],
    fullName: '',
    sex: 0,
    birthday: '',
    idCard: '',
    address: '',
    phone: '',
    email: '',
    wx: '',
    contact: '',
    job: '',
    entryDate: '',
    qrCodeUrl: '',
    file: '',
    note: ''
  };
}

const model = reactive<UserFormModel>(createEmptyModel());

const formItems = computed<FormItemConfig[]>(() => [
  { key: 'basicInfo', label: $t('page.manage.user.basicInfo'), type: 'section', span: 24 },
  {
    key: 'account',
    label: $t('page.manage.user.userName'),
    type: 'input',
    required: true,
    span: 8,
    placeholder: $t('page.manage.user.form.userNamePlaceholder')
  },
  {
    key: 'name',
    label: $t('page.manage.user.nickName'),
    type: 'input',
    required: true,
    span: 8,
    placeholder: $t('page.manage.user.form.nickNamePlaceholder')
  },
  {
    key: 'password',
    label: $t('page.manage.user.password'),
    type: 'password',
    // 仅新增必填；编辑留空表示不修改密码（修改自己密码后端会强制重新登录）
    required: isCreate.value,
    span: 8,
    placeholder: isCreate.value
      ? $t('page.manage.user.form.passwordPlaceholder')
      : $t('page.manage.user.form.passwordEditPlaceholder')
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
    key: 'status',
    label: $t('page.manage.user.status'),
    type: 'select',
    span: 8,
    options: statusOptions.value,
    placeholder: $t('page.manage.user.form.statusPlaceholder')
  },
  // 多选下拉走 custom 插槽（FormWrap 的 select 不支持 multiple）
  { key: 'roleIds', label: $t('page.manage.user.roleName'), type: 'custom', span: 24 },
  { key: 'groupIds', label: $t('page.manage.user.groupName'), type: 'custom', span: 24 },
  { key: 'profileInfo', label: $t('page.manage.user.profileInfo'), type: 'section', span: 24 },
  {
    key: 'fullName',
    label: $t('page.manage.user.realName'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.realNamePlaceholder')
  },
  {
    key: 'sex',
    label: $t('page.manage.user.gender'),
    type: 'select',
    span: 8,
    options: sexOptions.value,
    placeholder: $t('page.manage.user.form.genderPlaceholder')
  },
  {
    key: 'birthday',
    label: $t('page.manage.user.birthday'),
    type: 'date',
    span: 8,
    placeholder: $t('page.manage.user.form.birthdayPlaceholder')
  },
  {
    key: 'idCard',
    label: $t('page.manage.user.idCard'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.idCardPlaceholder')
  },
  {
    key: 'phone',
    label: $t('page.manage.user.contactPhone'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.contactPhonePlaceholder')
  },
  {
    key: 'email',
    label: $t('page.manage.user.email'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.emailPlaceholder')
  },
  {
    key: 'wx',
    label: $t('page.manage.user.wechat'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.wechatPlaceholder')
  },
  {
    key: 'contact',
    label: $t('page.manage.user.otherContact'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.otherContactPlaceholder')
  },
  {
    key: 'job',
    label: $t('page.manage.user.position'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.positionPlaceholder')
  },
  {
    key: 'entryDate',
    label: $t('page.manage.user.hireDate'),
    type: 'date',
    span: 8,
    placeholder: $t('page.manage.user.form.hireDatePlaceholder')
  },
  {
    key: 'address',
    label: $t('page.manage.user.homeAddress'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.homeAddressPlaceholder')
  },
  {
    key: 'file',
    label: $t('page.manage.user.attachment'),
    type: 'file',
    span: 8
  },
  {
    key: 'qrCodeUrl',
    label: $t('page.manage.user.wechatQrcode'),
    type: 'image',
    span: 8
  },
  {
    key: 'note',
    label: $t('page.manage.user.remark'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.remarkPlaceholder')
  }
]);

/** 编辑 / 详情先 /user/get 取全量数据再回填（日期转 'YYYY-MM-DD'、身份证转字符串展示） */
async function fillFormByRow() {
  if (!props.row) return;

  const { data, error } = await fetchGetUser(props.row._id);
  if (error || !data) return;

  Object.assign(model, createEmptyModel());
  model.account = data.account ?? '';
  model.name = data.name ?? '';
  model.siteId = data.siteId ?? '';
  model.status = data.status;
  model.roleIds = data.roleIds ?? [];
  model.groupIds = data.groupIds ?? [];
  model.fullName = data.fullName ?? '';
  model.sex = data.sex ?? 0;
  model.birthday = data.birthday ? dayjs(data.birthday).format('YYYY-MM-DD') : '';
  // 后端为 Number，长号码已有精度损失，仅尽力还原展示
  model.idCard = data.idCard === undefined || data.idCard === null ? '' : String(data.idCard);
  model.address = data.address ?? '';
  model.phone = data.phone ?? '';
  model.email = data.email ?? '';
  model.wx = data.wx ?? '';
  model.contact = data.contact ?? '';
  model.job = data.job ?? '';
  model.entryDate = data.entryDate ? dayjs(data.entryDate).format('YYYY-MM-DD') : '';
  model.qrCodeUrl = data.qrCodeUrl ?? '';
  model.file = data.file ?? '';
  model.note = data.note ?? '';
}

function resetForm() {
  Object.assign(model, createEmptyModel());
}

/** 组装提交参数：日期转毫秒时间戳、身份证转 Number（长号码有精度损失，待后端改 String） */
function buildSubmitParams() {
  return {
    account: model.account,
    name: model.name,
    siteId: model.siteId,
    status: model.status,
    roleIds: model.roleIds,
    groupIds: model.groupIds,
    fullName: model.fullName,
    sex: model.sex,
    birthday: model.birthday ? dayjs(model.birthday).valueOf() : undefined,
    idCard: model.idCard ? Number(model.idCard) : undefined,
    address: model.address,
    phone: model.phone,
    email: model.email,
    wx: model.wx,
    contact: model.contact,
    job: model.job,
    entryDate: model.entryDate ? dayjs(model.entryDate).valueOf() : undefined,
    qrCodeUrl: model.qrCodeUrl,
    file: model.file,
    note: model.note
  };
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) {
    return;
  }

  submitting.value = true;

  try {
    const { error } = isCreate.value
      ? await fetchCreateUser({
          ...buildSubmitParams(),
          // 与登录同格式：MD5(MD5(明文) + 明文)
          password: md5(md5(model.password) + model.password)
        })
      : await fetchUpdateUser({
          _id: props.row!._id,
          ...buildSubmitParams(),
          // 编辑时密码留空表示不修改；填写则按登录同格式加密后提交
          ...(model.password ? { password: md5(md5(model.password) + model.password) } : {})
        });

    // 真实接口错误已由 request 拦截器统一提示，这里只负责不再继续走成功流程
    if (error) return;

    if (isCreate.value) {
      window.$message?.success($t('common.addSuccess'));
    } else {
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
    width="50%"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" :mode="isDetail ? 'view' : 'edit'">
      <template #roleIds="{ model: formModel }">
        <NSelect
          v-model:value="formModel.roleIds as string[]"
          multiple
          clearable
          :options="roleOptions"
          :disabled="isDetail"
          :placeholder="$t('page.manage.user.form.roleNamePlaceholder')"
        />
      </template>

      <template #groupIds="{ model: formModel }">
        <NSelect
          v-model:value="formModel.groupIds as string[]"
          multiple
          clearable
          :options="groupOptions"
          :disabled="isDetail"
          :placeholder="$t('page.manage.user.form.groupNamePlaceholder')"
        />
      </template>
    </NFormWrap>
  </UserDrawer>
</template>

<style scoped></style>
