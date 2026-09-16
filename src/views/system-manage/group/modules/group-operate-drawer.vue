<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateGroup, fetchUpdateGroup } from '@/service/api/group';
import { fetchGetSiteList } from '@/service/api/site';
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
  name: '',
  siteId: '',
  desc: ''
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
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
    key: 'desc',
    label: $t('page.manage.group.remark'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.manage.group.form.remarkPlaceholder')
  }
]);

function fillFormByRow() {
  if (!props.row) return;
  model.name = props.row.name;
  model.siteId = props.row.siteId;
  model.desc = props.row.desc ?? '';
}

function resetForm() {
  model.name = '';
  model.siteId = '';
  model.desc = '';
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) {
    return;
  }

  submitting.value = true;

  try {
    const { error } = isCreate.value
      ? await fetchCreateGroup({ ...model })
      : await fetchUpdateGroup({ _id: props.row!._id, ...model });

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
