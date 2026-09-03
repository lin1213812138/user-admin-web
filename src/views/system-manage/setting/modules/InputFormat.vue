<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import MasterDetail from '../components/MasterDetail.vue';
import FieldMapping from '../components/FieldMapping.vue';

interface InputFormatItem {
  id: number;
  name: string;
  status: Api.Common.EnableStatus;
  scope: ('internal' | 'customer' | 'wechat')[];
  remark: string;
  fields: Record<string, string[]>;
}

const navGroups = [
  { key: 'waybill', title: '运单信息', fields: ['业务备注', '内部备注', '小计金额', '净重', '货物件数', '长', '宽'] },
  { key: 'receiver', title: '收件人信息', fields: ['收件人姓名', '电话', '地址', '公司'] },
  { key: 'sender', title: '发件人信息', fields: ['发件人姓名', '电话', '地址'] },
  { key: 'goods', title: '物品信息', fields: ['品名', '数量', '重量', '体积'] },
  { key: 'subItem', title: '子件信息', fields: ['单件材积', '计费重', '单件重量'] }
];

const extraFormatNames = [
  '顺丰录单',
  '京东录单',
  '菜鸟录单',
  '美团录单',
  '拼多多录单',
  '抖音录单',
  '小红书录单',
  '淘宝录单',
  '天猫录单',
  '唯品会录单',
  '苏宁录单',
  '国美录单',
  '网易考拉录单',
  '亚马逊录单',
  'eBay录单',
  '速卖通录单',
  'Wish录单',
  'Lazada录单',
  'Shopee录单',
  'Coupang录单',
  '俄向专线录单',
  '欧向专线录单',
  '美向专线录单',
  '东南亚专线录单',
  '中东专线录单',
  '非洲专线录单',
  '南美专线录单',
  '澳洲专线录单',
  '日韩专线录单',
  '港澳台录单'
];
const extraScopes: Array<Array<'internal' | 'customer' | 'wechat'>> = [
  ['internal'],
  ['internal', 'customer'],
  ['internal', 'customer', 'wechat'],
  ['customer', 'wechat'],
  ['wechat']
];

const formats = ref<InputFormatItem[]>([
  {
    id: 1,
    name: '代发录单',
    status: 1,
    scope: ['internal', 'customer', 'wechat'],
    remark: '',
    fields: {
      waybill: ['业务备注', '内部备注'],
      receiver: [],
      sender: [],
      goods: ['小计金额', '净重', '货物件数', '长', '宽'],
      subItem: ['单件材积', '计费重']
    }
  },
  {
    id: 2,
    name: '专线录单',
    status: 1,
    scope: ['internal', 'customer'],
    remark: '',
    fields: {
      waybill: ['业务备注'],
      receiver: ['收件人姓名'],
      sender: [],
      goods: ['净重', '货物件数'],
      subItem: []
    }
  },
  {
    id: 3,
    name: '国际快递录单',
    status: 1,
    scope: ['internal'],
    remark: '跨境电商专用，字段最全',
    fields: {
      waybill: ['业务备注', '内部备注', '小计金额', '净重', '货物件数', '长', '宽'],
      receiver: ['收件人姓名', '电话', '地址', '公司'],
      sender: ['发件人姓名', '电话', '地址'],
      goods: ['品名', '数量', '重量', '体积'],
      subItem: ['单件材积', '计费重', '单件重量']
    }
  },
  {
    id: 4,
    name: '同城速递录单',
    status: 1,
    scope: ['wechat'],
    remark: '微信小程序同城下单',
    fields: {
      waybill: ['业务备注'],
      receiver: ['收件人姓名', '电话', '地址'],
      sender: ['发件人姓名', '电话'],
      goods: ['品名', '数量'],
      subItem: []
    }
  },
  {
    id: 5,
    name: '冷链专线录单',
    status: 1,
    scope: ['internal', 'customer'],
    remark: '冷链运输，需记录体积与重量',
    fields: {
      waybill: ['业务备注', '内部备注', '净重', '货物件数'],
      receiver: ['收件人姓名', '电话', '地址'],
      sender: ['发件人姓名', '电话'],
      goods: ['品名', '数量', '重量', '体积'],
      subItem: ['单件材积', '单件重量']
    }
  },
  {
    id: 6,
    name: '到付录单',
    status: 0,
    scope: ['customer', 'wechat'],
    remark: '收件人付运费（暂时停用）',
    fields: {
      waybill: ['业务备注', '小计金额'],
      receiver: ['收件人姓名', '电话', '地址'],
      sender: ['发件人姓名'],
      goods: ['品名', '数量', '重量'],
      subItem: []
    }
  },
  {
    id: 7,
    name: '临时录单',
    status: 0,
    scope: ['internal'],
    remark: '内部临时使用，已废弃',
    fields: {
      waybill: ['业务备注'],
      receiver: ['收件人姓名'],
      sender: [],
      goods: ['品名'],
      subItem: []
    }
  },
  {
    id: 8,
    name: '大件物流录单',
    status: 1,
    scope: ['internal', 'customer', 'wechat'],
    remark: '大件/重货，需长宽与体积',
    fields: {
      waybill: ['业务备注', '内部备注', '小计金额', '净重', '货物件数', '长', '宽'],
      receiver: ['收件人姓名', '电话', '地址'],
      sender: ['发件人姓名', '电话', '地址'],
      goods: ['品名', '数量', '重量', '体积'],
      subItem: ['单件材积', '计费重']
    }
  },
  {
    id: 9,
    name: '电商专用录单',
    status: 1,
    scope: ['customer', 'wechat'],
    remark: '电商平台客户下单',
    fields: {
      waybill: ['业务备注'],
      receiver: ['收件人姓名', '电话', '地址', '公司'],
      sender: [],
      goods: ['品名', '数量', '重量'],
      subItem: []
    }
  },
  {
    id: 10,
    name: '测试模板',
    status: 1,
    scope: ['internal'],
    remark: '字段映射测试用',
    fields: {
      waybill: ['业务备注', '内部备注', '小计金额'],
      receiver: [],
      sender: [],
      goods: [],
      subItem: []
    }
  },
  ...Array.from({ length: 30 }, (_, i) => ({
    id: i + 11,
    name: extraFormatNames[i],
    status: (i % 4 === 0 ? 0 : 1) as Api.Common.EnableStatus,
    scope: extraScopes[i % extraScopes.length],
    remark: '',
    fields: {
      waybill: ['业务备注', '内部备注'],
      receiver: i % 2 === 0 ? ['收件人姓名', '电话', '地址'] : [],
      sender: i % 2 === 0 ? ['发件人姓名', '电话', '地址'] : [],
      goods: ['品名', '数量', '重量', '体积'],
      subItem: i % 3 === 0 ? ['单件材积', '计费重'] : []
    }
  }))
]);

const selectedId = ref<number | null>(formats.value[0]?.id ?? null);
const isEditing = ref(false);
const prevSelectedId = ref<number | null>(null);

const current = computed(() => formats.value.find(f => f.id === selectedId.value) ?? null);

const formModel = ref<{
  name: string;
  status: Api.Common.EnableStatus;
  scope: ('internal' | 'customer' | 'wechat')[];
  remark: string;
}>({ name: '', status: 1, scope: [], remark: '' });

const fieldModel = ref<Record<string, string[]>>({});

function loadCurrent() {
  const c = current.value;
  if (!c) return;
  formModel.value = { name: c.name, status: c.status, scope: [...c.scope], remark: c.remark };
  fieldModel.value = JSON.parse(JSON.stringify(c.fields));
}
loadCurrent();

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.setting.inputFormat') + '名称',
    type: 'input',
    required: true,
    span: 6,
    placeholder: '请输入格式名称'
  },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'switch',
    span: 6,
    checkedText: $t('common.enable'),
    uncheckedText: $t('common.disable'),
    checkedValue: 1,
    uncheckedValue: 0
  },
  {
    key: 'scope',
    label: '适用范围',
    type: 'checkbox',
    span: 6,
    options: [
      { label: '内部系统', value: 'internal' },
      { label: '客户下单', value: 'customer' },
      { label: '微信下单', value: 'wechat' }
    ]
  },
  { key: 'remark', label: $t('common.remark'), type: 'input', span: 6, placeholder: '请输入备注' }
]);

function handleCreate() {
  prevSelectedId.value = selectedId.value;
  selectedId.value = null;
  isEditing.value = true;
  formModel.value = { name: '', status: 1, scope: [], remark: '' };
  fieldModel.value = {};
}
function handleEdit() {
  if (!current.value) return;
  isEditing.value = true;
}
function handleDelete() {
  if (selectedId.value === null) return;
  formats.value = formats.value.filter(f => f.id !== selectedId.value);
  selectedId.value = formats.value[0]?.id ?? null;
  loadCurrent();
}
function handleSave() {
  if (selectedId.value === null) {
    const id = Math.max(0, ...formats.value.map(f => f.id)) + 1;
    formats.value.push({
      id,
      name: formModel.value.name,
      status: formModel.value.status,
      scope: formModel.value.scope,
      remark: formModel.value.remark,
      fields: fieldModel.value
    });
    selectedId.value = id;
  } else {
    const idx = formats.value.findIndex(f => f.id === selectedId.value);
    if (idx >= 0) formats.value[idx] = { ...formats.value[idx], ...formModel.value, fields: fieldModel.value };
  }
  isEditing.value = false;
}
function handleCancel() {
  isEditing.value = false;
  if (selectedId.value === null) {
    selectedId.value = prevSelectedId.value ?? formats.value[0]?.id ?? null;
  }
  loadCurrent();
}
</script>

<template>
  <MasterDetail
    list-title="录单格式列表"
    search-placeholder="搜索列表"
    :items="formats"
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
