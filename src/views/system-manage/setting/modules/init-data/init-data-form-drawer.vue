<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateInitData, fetchUpdateInitData } from '@/service/api/system-manage';
import SiteDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit';

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 抽屉模式：新增 / 编辑 */
  mode?: DrawerMode;
  /** 所属分类（新增时由父级传入，决定 mock 数据落库分类） */
  category?: Api.SystemManage.InitDataCategory;
  /** 编辑行数据 */
  row?: Api.SystemManage.InitDataItem | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  mode: 'create',
  category: 'channel',
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

const isCreate = computed(() => props.mode === 'create');

const title = computed(() => (isCreate.value ? $t('common.add') : $t('common.edit')));

const submitting = ref(false);

const formRef = ref<InstanceType<typeof NFormWrap>>();

const model = reactive<Api.SystemManage.InitDataCreateParams>({
  category: 'channel',
  cnName: '',
  enName: '',
  remark: ''
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'cnName',
    label: $t('page.manage.setting.initData.cnName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.initData.cnNamePlaceholder')
  },
  {
    key: 'enName',
    label: $t('page.manage.setting.initData.enName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.initData.enNamePlaceholder')
  },
  {
    key: 'remark',
    label: $t('page.manage.setting.initData.remark'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.manage.setting.initData.remarkPlaceholder')
  }
]);

function fillFormByRow() {
  if (!props.row) return;
  model.category = props.row.category;
  model.cnName = props.row.cnName;
  model.enName = props.row.enName;
  model.remark = props.row.remark;
}

function resetForm() {
  model.category = props.category ?? 'channel';
  model.cnName = '';
  model.enName = '';
  model.remark = '';
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) {
    return;
  }

  submitting.value = true;

  try {
    if (isCreate.value) {
      await fetchCreateInitData({ ...model, category: props.category ?? 'channel' });
      window.$message?.success($t('common.addSuccess'));
    } else {
      await fetchUpdateInitData({ id: props.row!.id, ...model });
      window.$message?.success($t('common.updateSuccess'));
    }

    drawerVisible.value = false;
    emit('submitted');
  } catch (error) {
    // 本地 mock 校验（如中文名称重复）会抛错需自行提示；真实接口错误已由 request 拦截器统一提示
    window.$message?.error(error instanceof Error ? error.message : String(error));
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
  <SiteDrawer
    v-model:show="drawerVisible"
    :title="title"
    :loading="submitting"
    :footer="true"
    width="520"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" mode="edit" />
  </SiteDrawer>
</template>

<style scoped></style>
