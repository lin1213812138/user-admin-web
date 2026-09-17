<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

interface Props {
  /** 当前用户（编辑抽屉 /user/get 全量数据） */
  user?: Api.SystemManage.User | null;
}

const props = withDefaults(defineProps<Props>(), {
  user: null
});

const formRef = ref<InstanceType<typeof NFormWrap>>();

const sexOptions = computed<CommonType.Option<Api.SystemManage.UserSex>[]>(() => [
  { label: $t('page.manage.user.unknown'), value: 0 },
  { label: $t('page.manage.user.male'), value: 1 },
  { label: $t('page.manage.user.female'), value: 2 }
]);

/** 表单模型：日期按字符串编辑，提交时转后端要求的毫秒时间戳 */
interface ProfileModel {
  fullName: string;
  phone: string;
  job: string;
  sex: Api.SystemManage.UserSex;
  wx: string;
  /** 'YYYY-MM-DD'，提交时转毫秒时间戳 */
  entryDate: string;
  /** 'YYYY-MM-DD'，提交时转毫秒时间戳 */
  birthday: string;
  email: string;
  /** 附件文件名（FormWrap file 控件受控回显） */
  file: string;
  address: string;
  contact: string;
  note: string;
}

function createEmptyModel(): ProfileModel {
  return {
    fullName: '',
    phone: '',
    job: '',
    sex: 0,
    wx: '',
    entryDate: '',
    birthday: '',
    email: '',
    file: '',
    address: '',
    contact: '',
    note: ''
  };
}

const model = reactive<ProfileModel>(createEmptyModel());

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'fullName',
    label: $t('page.manage.user.realName'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.realNamePlaceholder')
  },
  {
    key: 'phone',
    label: $t('page.manage.user.contactPhone'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.contactPhonePlaceholder')
  },
  {
    key: 'job',
    label: $t('page.manage.user.position'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.positionPlaceholder')
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
    key: 'wx',
    label: $t('page.manage.user.wechat'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.wechatPlaceholder')
  },
  {
    key: 'entryDate',
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
    key: 'email',
    label: $t('page.manage.user.email'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.emailPlaceholder')
  },
  {
    key: 'file',
    label: $t('page.manage.user.attachment'),
    type: 'file',
    span: 8
  },
  {
    key: 'address',
    label: $t('page.manage.user.homeAddress'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.homeAddressPlaceholder')
  },
  {
    key: 'contact',
    label: $t('page.manage.user.otherContact'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.otherContactPlaceholder')
  },
  {
    key: 'note',
    label: $t('page.manage.user.remark'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.remarkPlaceholder')
  }
]);

/** 用户数据变化时回填（日期转 'YYYY-MM-DD'） */
watch(
  () => props.user,
  user => {
    Object.assign(model, createEmptyModel());
    if (!user) return;

    model.fullName = user.fullName ?? '';
    model.phone = user.phone ?? '';
    model.job = user.job ?? '';
    model.sex = user.sex ?? 0;
    model.wx = user.wx ?? '';
    model.entryDate = user.entryDate ? dayjs(user.entryDate).format('YYYY-MM-DD') : '';
    model.birthday = user.birthday ? dayjs(user.birthday).format('YYYY-MM-DD') : '';
    model.email = user.email ?? '';
    model.file = user.file ?? '';
    model.address = user.address ?? '';
    model.contact = user.contact ?? '';
    model.note = user.note ?? '';
  },
  { immediate: true }
);

async function validate() {
  return (await formRef.value?.validate()) ?? false;
}

/** 收集档案字段：日期转毫秒时间戳 */
function collect() {
  return {
    fullName: model.fullName,
    sex: model.sex,
    birthday: model.birthday ? dayjs(model.birthday).valueOf() : undefined,
    address: model.address,
    phone: model.phone,
    email: model.email,
    wx: model.wx,
    contact: model.contact,
    job: model.job,
    entryDate: model.entryDate ? dayjs(model.entryDate).valueOf() : undefined,
    file: model.file,
    note: model.note
  };
}

defineExpose({ validate, collect });
</script>

<template>
  <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" />
</template>

<style scoped></style>
