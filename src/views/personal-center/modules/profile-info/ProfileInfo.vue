<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, onMounted, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { useAuthStore } from '@/store/modules/auth';
import { fetchGetUser, fetchUpdateSelfProfile } from '@/service/api/user';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

defineOptions({
  name: 'PersonalProfileInfo'
});

const authStore = useAuthStore();

const loading = ref(false);
const submitting = ref(false);
const formRef = ref<InstanceType<typeof NFormWrap>>();

/** 个人信息修改权限：后端在 editInfoCtrl=0 时拒绝保存（管理员恒为 1，普通用户由角色控制） */
const canEdit = computed(() => (authStore.userInfo.editInfoCtrl as number | undefined) !== 0);

/** 只读展示：账号 / 站点 / 角色 / 组别 / 状态 */
const readonlyModel = reactive({
  account: '',
  site: '',
  role: '',
  group: '',
  status: 1 as Api.Common.EnableStatus
});

const statusOptions = computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);

const readonlyItems = computed<FormItemConfig[]>(() => [
  { key: 'account', label: $t('page.manage.user.userName'), type: 'input', span: 8 },
  { key: 'site', label: $t('page.manage.user.siteName'), type: 'input', span: 8 },
  { key: 'role', label: $t('page.manage.user.roleName'), type: 'input', span: 8 },
  { key: 'group', label: $t('page.manage.user.groupName'), type: 'input', span: 8 },
  { key: 'status', label: $t('page.manage.user.status'), type: 'select', span: 8, options: statusOptions.value }
]);

const sexOptions = computed<CommonType.Option<Api.SystemManage.UserSex>[]>(() => [
  { label: $t('page.manage.user.unknown'), value: 0 },
  { label: $t('page.manage.user.male'), value: 1 },
  { label: $t('page.manage.user.female'), value: 2 }
]);

/** 可编辑表单模型：日期按字符串编辑（提交转毫秒时间戳），身份证按字符串编辑（提交转 Number） */
interface ProfileFormModel {
  name: string;
  fullName: string;
  sex: Api.SystemManage.UserSex;
  /** 'YYYY-MM-DD'，提交时转毫秒时间戳 */
  birthday: string;
  /** 字符串输入避免编辑期精度损失，提交时转 Number */
  idCard: string;
  phone: string;
  email: string;
  wx: string;
  contact: string;
  job: string;
  /** 'YYYY-MM-DD'，提交时转毫秒时间戳 */
  entryDate: string;
  address: string;
  file: string;
  qrCodeUrl: string;
  note: string;
}

function createEmptyModel(): ProfileFormModel {
  return {
    name: '',
    fullName: '',
    sex: 0,
    birthday: '',
    idCard: '',
    phone: '',
    email: '',
    wx: '',
    contact: '',
    job: '',
    entryDate: '',
    address: '',
    file: '',
    qrCodeUrl: '',
    note: ''
  };
}

const model = reactive<ProfileFormModel>(createEmptyModel());

const profileItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.user.nickName'),
    type: 'input',
    required: true,
    span: 8,
    placeholder: $t('page.manage.user.form.nickNamePlaceholder')
  },
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
  { key: 'file', label: $t('page.manage.user.attachment'), type: 'file', span: 8 },
  { key: 'qrCodeUrl', label: $t('page.manage.user.wechatQrcode'), type: 'image', span: 8 },
  {
    key: 'note',
    label: $t('page.manage.user.remark'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.remarkPlaceholder')
  }
]);

/** 取当前登录用户全量数据（/user/get 会回填站点/角色/组别名称） */
async function loadProfile() {
  loading.value = true;

  try {
    const { data, error } = await fetchGetUser(authStore.userInfo._id);
    if (error || !data) return;

    Object.assign(readonlyModel, {
      account: data.account ?? '',
      site: data.site ?? '',
      role: data.role ?? '',
      group: data.group ?? '',
      status: data.status
    });

    Object.assign(model, {
      name: data.name ?? '',
      fullName: data.fullName ?? '',
      sex: data.sex ?? 0,
      birthday: data.birthday ? dayjs(data.birthday).format('YYYY-MM-DD') : '',
      // 后端为 Number，长号码已有精度损失，仅尽力还原展示
      idCard: data.idCard === undefined || data.idCard === null ? '' : String(data.idCard),
      phone: data.phone ?? '',
      email: data.email ?? '',
      wx: data.wx ?? '',
      contact: data.contact ?? '',
      job: data.job ?? '',
      entryDate: data.entryDate ? dayjs(data.entryDate).format('YYYY-MM-DD') : '',
      address: data.address ?? '',
      file: data.file ?? '',
      qrCodeUrl: data.qrCodeUrl ?? '',
      note: data.note ?? ''
    });
  } finally {
    loading.value = false;
  }
}

onMounted(loadProfile);

async function handleSave() {
  if (!(await formRef.value?.validate())) {
    return;
  }

  submitting.value = true;

  try {
    const { error } = await fetchUpdateSelfProfile({
      _id: authStore.userInfo._id,
      name: model.name,
      fullName: model.fullName,
      sex: model.sex,
      birthday: model.birthday ? dayjs(model.birthday).valueOf() : undefined,
      idCard: model.idCard ? Number(model.idCard) : undefined,
      phone: model.phone,
      email: model.email,
      wx: model.wx,
      contact: model.contact,
      job: model.job,
      entryDate: model.entryDate ? dayjs(model.entryDate).valueOf() : undefined,
      address: model.address,
      file: model.file,
      qrCodeUrl: model.qrCodeUrl,
      note: model.note
    });

    // 真实接口错误已由 request 拦截器统一提示，这里只负责不再继续走成功流程
    if (error) return;

    window.$message?.success($t('common.updateSuccess'));

    // 刷新 authStore（侧栏用户名 / 本地缓存）与新数据保持一致
    await authStore.getUserInfo();
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="h-full overflow-y-auto">
    <NCard :title="$t('page.personalCenter.accountInfo')" :bordered="false" size="small">
      <NFormWrap :model="readonlyModel" :items="readonlyItems" mode="view" :grid-x-gap="16" />
    </NCard>

    <NCard :title="$t('page.personalCenter.profileForm')" :bordered="false" size="small" class="mt-16px">
      <NAlert v-if="!canEdit" type="warning" :show-icon="true" class="mb-16px">
        {{ $t('page.personalCenter.editInfoDisabled') }}
      </NAlert>

      <NFormWrap ref="formRef" :model="model" :items="profileItems" :grid-x-gap="16" :disabled="!canEdit || loading" />

      <div class="mt-16px flex justify-end">
        <LButton type="primary" :loading="submitting" :disabled="!canEdit || loading" @click="handleSave">
          {{ $t('common.submitModify') }}
        </LButton>
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
