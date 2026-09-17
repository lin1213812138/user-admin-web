<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchGetCustomer } from '@/service/api/customer';
import Drawer from '@/components/common/drawer.vue';
import BizTab from './customer-detail/biz-tab.vue';
import AddressTab from './customer-detail/address-tab.vue';
import FileTab from './customer-detail/file-tab.vue';
import ApiTab from './customer-detail/api-tab.vue';
import OpLogTab from './customer-detail/oplog-tab.vue';

defineOptions({ name: 'CustomerDetailDrawer' });

interface Props {
  /** 弹窗显隐，v-model:show */
  show?: boolean;
  /** 客户 _id（列表编码列点击时传入） */
  customerId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  customerId: ''
});

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const drawerVisible = computed({
  get: () => props.show,
  set: val => emit('update:show', val)
});

const customer = ref<Api.SystemManage.Customer | null>(null);
const loading = ref(false);

async function loadCustomer() {
  if (!props.customerId) return;

  loading.value = true;
  try {
    const { data, error } = await fetchGetCustomer(props.customerId);
    if (!error && data) customer.value = data;
  } finally {
    loading.value = false;
  }
}

/** 空值统一展示 '--'（对齐老系统详情页） */
function text(value?: string | number | null) {
  return value === undefined || value === null || value === '' ? '--' : value;
}

const statusText = computed(() => {
  if (!customer.value) return '--';
  return customer.value.status === 1 ? $t('common.enable') : $t('common.disable');
});

watch(
  () => props.show,
  val => {
    if (val) loadCustomer();
  }
);
</script>

<template>
  <Drawer v-model:show="drawerVisible" :title="$t('page.manage.customer.detail.title')" :footer="false" width="80%">
    <!-- 高度链：视口定高 → NSpin/NCard flex 拉伸 → tabs pane 100%（见 scoped 样式），表格 height:100% 才能自适应填满剩余空间 -->
    <div class="flex h-[calc(100vh-120px)] flex-col gap-16px overflow-hidden">
      <NSpin :show="loading" class="flex min-h-0 flex-1 flex-col" content-class="flex min-h-0 flex-1 flex-col gap-16px">
        <!-- 基本信息 -->
        <NCard flex-shrink-0 content-style="padding-top: 12px;">
          <template #header>
            <div class="flex items-center gap-8px">
              <span class="h-16px w-3px rounded-2px bg-primary" />
              <span class="text-15px font-600">{{ $t('page.manage.customer.basicInfo') }}</span>
            </div>
          </template>
          <NDescriptions v-if="customer" label-placement="left" :column="3">
            <NDescriptionsItem :label="$t('page.manage.customer.customerCode')">
              {{ text(customer.code) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.customer.customerName')">
              {{ text(customer.name) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.customer.account')">
              {{ text(customer.account) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.customer.contactName')">
              {{ text(customer.contact) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.customer.contactPhone')">
              {{ text(customer.mobile) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.customer.email')">
              {{ text(customer.email) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.customer.address')">
              {{ text(customer.address) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.customer.wx')">{{ text(customer.wx) }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.customer.qq')">{{ text(customer.qq) }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.customer.customerLevel')">
              {{ text(customer.level) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.customer.status')">
              <NTag v-if="customer.status === 1" type="warning" size="small">{{ statusText }}</NTag>
              <NTag v-else type="error" size="small">{{ statusText }}</NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.customer.tag')">{{ text(customer.tag) }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.customer.taxInfo')">
              {{ text(customer.taxInfo) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.customer.remark')">{{ text(customer.note) }}</NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <!-- 业务 tabs -->
        <NCard
          class="min-h-0 flex flex-1 flex-col overflow-hidden"
          content-style="flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; padding-top: 12px;"
        >
          <NTabs type="line" animated class="customer-detail-tabs h-full min-h-0 flex-1">
            <NTabPane name="biz" :tab="$t('page.manage.customer.detail.bizFinance')">
              <BizTab v-if="customer" :customer="customer" />
            </NTabPane>
            <NTabPane name="ship-to" :tab="$t('page.manage.customer.detail.shipTo')">
              <AddressTab v-if="customer" type="ship-to" :customer-id="customer._id" :customer-name="customer.name" />
            </NTabPane>
            <NTabPane name="shipper" :tab="$t('page.manage.customer.detail.shipper')">
              <AddressTab v-if="customer" type="shipper" :customer-id="customer._id" :customer-name="customer.name" />
            </NTabPane>
            <NTabPane name="file" :tab="$t('page.manage.customer.detail.fileManage')">
              <FileTab v-if="customer" :customer-id="customer._id" />
            </NTabPane>
            <NTabPane name="api" :tab="$t('page.manage.customer.detail.apiConfig')">
              <ApiTab v-if="customer" :customer="customer" @refresh="loadCustomer" />
            </NTabPane>
            <NTabPane name="oplog" :tab="$t('page.manage.customer.detail.opLog')">
              <OpLogTab v-if="customer" :customer="customer" />
            </NTabPane>
          </NTabs>
        </NCard>
      </NSpin>
    </div>
  </Drawer>
</template>

<style scoped>
/* tabs → pane → 内容 100% 高度链，让表格 tab 自适应填满卡片剩余空间 */
.customer-detail-tabs :deep(.n-tabs-pane-wrapper),
.customer-detail-tabs :deep(.n-tab-pane) {
  height: 100%;
  padding-bottom: 0;
}
</style>
