<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCheckRemote } from '@/service/api/remote';

defineOptions({ name: 'RemoteRowOperateDrawer' });

type BasicRemote = Api.DataManage.BasicRemote;

const emit = defineEmits<{
  /** 校验通过接口回传后被整行替换（含后端回填的 countryId），由父级替换预览列表中的对应行 */
  updated: [payload: { index: number; row: BasicRemote }];
}>();

const drawerVisible = ref(false);
const submitting = ref(false);
const formModel = ref<BasicRemote>({});
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);
/** 被编辑行在父级预览列表中的下标 */
const editingIndex = ref(-1);

/**
 * 字段与 Excel 列一一对应。
 * `国家代码` 保持文本输入而非国家下拉：后端按 `country`（代码）与 `country.code` 比对并回填 `countryId`，
 * 下拉只能给出 `_id`，语义不符。
 */
const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'country',
    label: $t('page.dataManage.basic.remote.countryCode'),
    type: 'input',
    required: true
  },
  { key: 'city', label: $t('page.dataManage.basic.remote.city'), type: 'input' },
  { key: 'zipStart', label: $t('page.dataManage.basic.remote.zipStart'), type: 'input' },
  { key: 'zipEnd', label: $t('page.dataManage.basic.remote.zipEnd'), type: 'input' }
]);

function open(row: BasicRemote, index: number) {
  editingIndex.value = index;
  formModel.value = { ...row };
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

/** 城市与邮编至少填写一项（后端 checkList 同样校验，前端先拦一层避免白跑接口） */
function validateCityOrZip() {
  const { city, zipStart, zipEnd } = formModel.value;

  if (city || zipStart || zipEnd) return true;

  window.$message?.warning($t('page.dataManage.basic.remote.cityOrZipTip'));

  return false;
}

async function handleSubmit() {
  // 「国家代码必填」由表单 required 覆盖（/remote/check 的 single=1 会跳过这条后端校验）
  const ok = await formRef.value?.validate();
  if (!ok) return;
  if (!validateCityOrZip()) return;

  submitting.value = true;
  try {
    const { data, error } = await fetchCheckRemote(formModel.value);
    if (error || !data) return;

    // 整行替换：接口会按国家代码回填 countryId，仅改 country 会导致落库归属错误
    emit('updated', { index: editingIndex.value, row: data.list?.[0] ?? formModel.value });
    drawerVisible.value = false;
    window.$message?.success($t('page.dataManage.basic.remote.editUpdated'));
  } finally {
    submitting.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Drawer
    v-model:show="drawerVisible"
    :title="$t('page.dataManage.basic.remote.editTitle')"
    :width="520"
    :loading="submitting"
    :confirm-text="$t('common.save')"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" />
  </Drawer>
</template>
