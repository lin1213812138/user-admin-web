<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateSite, fetchGetSite, fetchUpdateSite } from '@/service/api/system-manage';
import SiteDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit' | 'detail';

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 抽屉模式：新增 / 编辑 / 详情 */
  mode?: DrawerMode;
  /** 编辑 / 详情行数据 */
  row?: Api.SystemManage.Site | null;
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
const fetching = ref(false);

const formRef = ref<InstanceType<typeof NFormWrap>>();

const model = reactive<Api.SystemManage.SiteCreateParams>({
  code: '',
  name: '',
  concat: '',
  phone: '',
  workTime: '',
  startPlace: '',
  address: '',
  note: '',
  // 站点类型固定 0（分公司），表单不展示该字段；编辑时保留原值
  siteType: 0
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'code',
    label: $t('page.manage.site.code'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.site.form.codePlaceholder')
  },
  {
    key: 'name',
    label: $t('page.manage.site.name'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.site.form.namePlaceholder')
  },
  {
    key: 'concat',
    label: $t('page.manage.site.concat'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.site.form.concatPlaceholder')
  },
  {
    key: 'phone',
    label: $t('page.manage.site.phone'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.site.form.phonePlaceholder')
  },
  {
    key: 'workTime',
    label: $t('page.manage.site.workTime'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.site.form.workTimePlaceholder')
  },
  {
    key: 'startPlace',
    label: $t('page.manage.site.startPlace'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.site.form.startPlacePlaceholder')
  },
  {
    key: 'address',
    label: $t('page.manage.site.address'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.manage.site.form.addressPlaceholder')
  },
  {
    key: 'note',
    label: $t('page.manage.site.note'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.manage.site.form.notePlaceholder')
  }
]);

function fillFormByRow(row: Api.SystemManage.Site) {
  model.code = row.code;
  model.name = row.name;
  model.concat = row.concat ?? '';
  model.phone = row.phone ?? '';
  model.workTime = row.workTime ?? '';
  model.startPlace = row.startPlace ?? '';
  model.address = row.address ?? '';
  model.note = row.note ?? '';
  model.siteType = row.siteType;
}

function resetForm() {
  model.code = '';
  model.name = '';
  model.concat = '';
  model.phone = '';
  model.workTime = '';
  model.startPlace = '';
  model.address = '';
  model.note = '';
  model.siteType = 0;
}

/** 编辑时先调 /site/get 取最新数据再回填，保证不展示过期行数据 */
async function fillByLatest() {
  if (!props.row) return;

  fetching.value = true;
  try {
    const { data, error } = await fetchGetSite(props.row._id);
    if (!error && data) {
      fillFormByRow(data);
    }
  } finally {
    fetching.value = false;
  }
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) {
    return;
  }

  submitting.value = true;

  try {
    if (isCreate.value) {
      const { error } = await fetchCreateSite({ ...model });
      if (error) return;
      window.$message?.success($t('common.addSuccess'));
    } else {
      const { error } = await fetchUpdateSite({ _id: props.row!._id, ...model });
      if (error) return;
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
    } else if (props.mode === 'edit') {
      fillByLatest();
    } else if (props.row) {
      fillFormByRow(props.row);
    }
  }
);
</script>

<template>
  <SiteDrawer
    v-model:show="drawerVisible"
    :title="title"
    :loading="fetching || submitting"
    :footer="!isDetail"
    width="520"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" :mode="isDetail ? 'view' : 'edit'" />
  </SiteDrawer>
</template>

<style scoped></style>
