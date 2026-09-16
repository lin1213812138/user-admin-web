<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateGroup, fetchGetSiteList, fetchUpdateGroup } from '@/service/api/system-manage';
import GroupDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit' | 'detail';

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 抽屉模式：新增 / 编辑 / 详情 */
  mode?: DrawerMode;
  /** 编辑 / 详情行数据 */
  row?: Api.SystemManage.Group | null;
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

/** 所属站点下拉选项（来自站点管理真实接口，站点主键为字符串 _id） */
const siteOptions = ref<CommonType.Option<string>[]>([]);

async function loadSiteOptions() {
  const { data } = await fetchGetSiteList({ page: 1, size: 100 });
  siteOptions.value = (data?.list ?? []).map(item => ({ label: item.name, value: item._id }));
}

onMounted(() => {
  loadSiteOptions();
});

const model = reactive<Api.SystemManage.GroupCreateParams>({
  groupName: '',
  siteId: null,
  remark: '',
  status: 1
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'groupName',
    label: $t('page.manage.group.groupName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.group.form.groupNamePlaceholder')
  },
  {
    key: 'siteId',
    label: $t('page.manage.group.siteName'),
    type: 'select',
    required: true,
    span: 24,
    options: siteOptions.value,
    placeholder: $t('page.manage.group.form.siteNamePlaceholder')
  },
  {
    key: 'remark',
    label: $t('page.manage.group.remark'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.manage.group.form.remarkPlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.group.status'),
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
  model.groupName = props.row.groupName;
  model.siteId = props.row.siteId;
  model.remark = props.row.remark;
  model.status = props.row.status;
}

function resetForm() {
  model.groupName = '';
  model.siteId = null;
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
      await fetchCreateGroup({ ...model });
      window.$message?.success($t('common.addSuccess'));
    } else {
      await fetchUpdateGroup({ id: props.row!.id, ...model });
      window.$message?.success($t('common.updateSuccess'));
    }

    drawerVisible.value = false;
    emit('submitted');
  } catch (error) {
    // 本地 mock 校验（如组别名称重复）会抛错需自行提示；真实接口错误已由 request 拦截器统一提示
    window.$message?.error(error instanceof Error ? error.message : String(error));
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.show,
  val => {
    if (!val) return;

    // 每次打开刷新站点选项，保证新建的站点可即时选中
    loadSiteOptions();

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
    width="520"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" :mode="isDetail ? 'view' : 'edit'" />
  </GroupDrawer>
</template>

<style scoped></style>
