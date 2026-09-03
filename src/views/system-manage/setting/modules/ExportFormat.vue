<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import MasterDetail from '../components/MasterDetail.vue';
import FieldMapping from '../components/FieldMapping.vue';

interface Item {
  id: number;
  name: string;
  status: Api.Common.EnableStatus;
  scope: string[];
  remark: string;
  fields: Record<string, string[]>;
}

const navGroups = [
  { key: 'waybill', title: '运单信息', fields: ['业务备注', '内部备注', '小计金额', '净重'] },
  { key: 'goods', title: '物品信息', fields: ['品名', '数量', '重量'] }
];

const items = ref<Item[]>([
  {
    id: 1,
    name: '默认导出格式',
    status: 1,
    scope: ['internal'],
    remark: '',
    fields: { waybill: ['业务备注'], goods: ['品名'] }
  },
  { id: 2, name: '客户导出格式', status: 1, scope: ['customer'], remark: '', fields: { waybill: [], goods: [] } }
]);

const selectedId = ref<number | null>(items.value[0]?.id ?? null);
const isEditing = ref(false);
const current = computed(() => items.value.find(i => i.id === selectedId.value) ?? null);

const formModel = ref({ name: '', status: 1 as Api.Common.EnableStatus, scope: [] as string[], remark: '' });
const fieldModel = ref<Record<string, string[]>>({});

function loadCurrent() {
  const c = current.value;
  if (!c) return;
  formModel.value = { name: c.name, status: c.status, scope: [...c.scope], remark: c.remark };
  fieldModel.value = JSON.parse(JSON.stringify(c.fields));
}
loadCurrent();

const formItems = computed<FormItemConfig[]>(() => [
  { key: 'name', label: '格式名称', type: 'input', required: true, span: 24, placeholder: '请输入格式名称' },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'switch',
    span: 24,
    checkedText: $t('common.enable'),
    uncheckedText: $t('common.disable'),
    checkedValue: 1,
    uncheckedValue: 0
  },
  {
    key: 'scope',
    label: '适用范围',
    type: 'checkbox',
    span: 24,
    options: [
      { label: '内部系统', value: 'internal' },
      { label: '客户下单', value: 'customer' },
      { label: '微信下单', value: 'wechat' }
    ]
  },
  { key: 'remark', label: $t('common.remark'), type: 'input', span: 24, placeholder: '请输入备注' }
]);

function handleCreate() {
  selectedId.value = null;
  isEditing.value = true;
  formModel.value = { name: '', status: 1, scope: [], remark: '' };
  fieldModel.value = {};
}
function handleEdit() {
  if (current.value) isEditing.value = true;
}
function handleDelete() {
  if (selectedId.value === null) return;
  items.value = items.value.filter(i => i.id !== selectedId.value);
  selectedId.value = items.value[0]?.id ?? null;
  loadCurrent();
}
function handleSave() {
  if (selectedId.value === null) {
    const id = Math.max(0, ...items.value.map(i => i.id)) + 1;
    items.value.push({
      id,
      name: formModel.value.name,
      status: formModel.value.status,
      scope: formModel.value.scope,
      remark: formModel.value.remark,
      fields: fieldModel.value
    });
    selectedId.value = id;
  } else {
    const idx = items.value.findIndex(i => i.id === selectedId.value);
    if (idx >= 0) items.value[idx] = { ...items.value[idx], ...formModel.value, fields: fieldModel.value };
  }
  isEditing.value = false;
}
function handleCancel() {
  isEditing.value = false;
  loadCurrent();
}
</script>

<template>
  <MasterDetail
    list-title="导出格式列表"
    search-placeholder="搜索列表"
    :items="items"
    :show-status="true"
    :show-actions="true"
    :selected-id="selectedId"
    :editable="!isEditing"
    @update:selected-id="
      id => {
        selectedId = id;
        loadCurrent();
      }
    "
    @create="handleCreate"
    @edit="handleEdit"
    @delete="handleDelete"
  >
    <template #operation-extra>
      <NSpace v-if="isEditing">
        <NButton type="primary" size="small" @click="handleSave">保存</NButton>
        <NButton size="small" @click="handleCancel">取消</NButton>
      </NSpace>
    </template>
    <NFormWrap v-if="current || isEditing" :model="formModel" :items="formItems" :disabled="!isEditing" />
    <FieldMapping
      v-if="current || isEditing"
      :nav-groups="navGroups"
      :model-value="fieldModel"
      @update:model-value="fieldModel = $event"
    />
  </MasterDetail>
</template>
