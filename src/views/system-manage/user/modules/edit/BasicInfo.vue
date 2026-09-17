<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

interface Props {
  /** 当前用户（编辑抽屉 /user/get 全量数据，「创建/最后更新」只读格也从这里取） */
  user?: Api.SystemManage.User | null;
  roleOptions?: CommonType.Option<string>[];
  siteOptions?: CommonType.Option<string>[];
  groupOptions?: CommonType.Option<string>[];
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
  roleOptions: () => [],
  siteOptions: () => [],
  groupOptions: () => []
});

const formRef = ref<InstanceType<typeof NFormWrap>>();

/** 基本信息表单模型：角色/组别为多选 id 列表 */
interface BasicModel {
  account: string;
  name: string;
  siteId: string;
  status: Api.Common.EnableStatus;
  roleIds: string[];
  groupIds: string[];
}

function createEmptyModel(): BasicModel {
  return {
    account: '',
    name: '',
    siteId: '',
    status: 1,
    roleIds: [],
    groupIds: []
  };
}

const model = reactive<BasicModel>(createEmptyModel());

const statusOptions = computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);

/** 三列网格对齐参考稿：账号/角色/创建、名称/站点/最后更新、状态/组别（创建与最后更新为只读格） */
const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'account',
    label: $t('page.manage.user.userName'),
    type: 'input',
    required: true,
    span: 8,
    placeholder: $t('page.manage.user.form.userNamePlaceholder')
  },
  { key: 'roleIds', label: $t('page.manage.user.roleName'), type: 'custom', span: 8 },
  {
    key: 'name',
    label: $t('page.manage.user.nickName'),
    type: 'input',
    required: true,
    span: 8,
    placeholder: $t('page.manage.user.form.nickNamePlaceholder')
  },
  {
    key: 'siteId',
    label: $t('page.manage.user.siteName'),
    type: 'select',
    required: true,
    span: 8,
    options: props.siteOptions,
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
  { key: 'groupIds', label: $t('page.manage.user.groupName'), type: 'custom', span: 8 }
]);

/** 用户数据变化时回填 */
watch(
  () => props.user,
  user => {
    Object.assign(model, createEmptyModel());
    if (!user) return;

    model.account = user.account ?? '';
    model.name = user.name ?? '';
    model.siteId = user.siteId ?? '';
    model.status = user.status;
    model.roleIds = user.roleIds ?? [];
    model.groupIds = user.groupIds ?? [];
  },
  { immediate: true }
);

/** 毫秒时间戳格式化为日期展示 */
function formatDate(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD') : '--';
}

/** 创建 / 最后更新展示为「操作人 - 日期」 */
function formatOperator(name?: string, ts?: number) {
  return `${name || '--'} - ${formatDate(ts)}`;
}

async function validate() {
  return (await formRef.value?.validate()) ?? false;
}

function collect() {
  return {
    account: model.account,
    name: model.name,
    siteId: model.siteId,
    status: model.status,
    roleIds: model.roleIds,
    groupIds: model.groupIds
  };
}

defineExpose({ validate, collect });
</script>

<template>
  <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16">
    <template #roleIds="{ model: formModel }">
      <NSelect
        v-model:value="formModel.roleIds as string[]"
        multiple
        clearable
        :options="roleOptions"
        :placeholder="$t('page.manage.user.form.roleNamePlaceholder')"
      />
    </template>

    <template #groupIds="{ model: formModel }">
      <NSelect
        v-model:value="formModel.groupIds as string[]"
        multiple
        clearable
        :options="groupOptions"
        :placeholder="$t('page.manage.user.form.groupNamePlaceholder')"
      />
    </template>

    <template #creatorInfo>
      <span class="leading-34px">{{ formatOperator(props.user?.creator, props.user?.createDate) }}</span>
    </template>

    <template #updateInfo>
      <span class="leading-34px">{{ formatOperator(props.user?.updateBy, props.user?.updateDate) }}</span>
    </template>
  </NFormWrap>
</template>

<style scoped></style>
