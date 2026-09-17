<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchResetCustomerPassword, fetchUpdateCustomerPartial } from '@/service/api/customer';
import { copyText } from '@/utils/common';

defineOptions({ name: 'ApiTab' });

interface Props {
  /** 详情客户（/customer/get 返回，appToken/appKey 为原文） */
  customer: Api.SystemManage.Customer;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  /** webStatus/apiStatus 保存成功后通知父级重新拉取客户详情 */
  refresh: [];
}>();

const statusOptions = [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
];

const model = reactive({
  webStatus: 1 as Api.Common.EnableStatus,
  apiStatus: 1 as Api.Common.EnableStatus
});

watch(
  () => props.customer,
  customer => {
    model.webStatus = customer.webStatus ?? 1;
    model.apiStatus = customer.apiStatus ?? 1;
  },
  { immediate: true, deep: true }
);

const webSaving = ref(false);
const apiSaving = ref(false);

/** 保存开通状态（webStatus/apiStatus 均为 /customer/update 可更新字段） */
async function handleSave(field: 'webStatus' | 'apiStatus') {
  const savingRef = field === 'webStatus' ? webSaving : apiSaving;
  savingRef.value = true;
  try {
    const { error } = await fetchUpdateCustomerPartial(
      field === 'webStatus'
        ? { _id: props.customer._id, webStatus: model.webStatus }
        : { _id: props.customer._id, apiStatus: model.apiStatus }
    );
    if (error) return;

    window.$message?.success($t('common.updateSuccess'));
    emit('refresh');
  } finally {
    savingRef.value = false;
  }
}

/** appToken/appKey 掩码展示（原文仅用于复制） */
function mask(value?: string) {
  if (!value) return '--';
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

async function handleCopy(value?: string) {
  if (!value) return;

  await copyText(value);
  window.$message?.success($t('page.manage.customer.detail.copySuccess'));
}

const resetting = ref(false);

/** 后端仅提供重置接口，固定重置为初始密码 pwd123456 */
async function handleResetPassword() {
  resetting.value = true;
  try {
    const { error } = await fetchResetCustomerPassword(props.customer._id);
    if (error) return;

    window.$message?.success($t('page.manage.customer.detail.resetPasswordSuccess'));
  } finally {
    resetting.value = false;
  }
}
</script>

<template>
  <div class="flex flex-wrap gap-16px">
    <!-- 网站下单 -->
    <NCard class="min-w-400px flex-1" content-style="padding-top: 12px;">
      <template #header>
        <span class="text-15px font-600">{{ $t('page.manage.customer.detail.webOrder') }}</span>
      </template>
      <template #header-extra>
        <span class="text-12px color-gray">{{ $t('page.manage.customer.detail.webOrderDesc') }}</span>
      </template>

      <div class="flex flex-col gap-16px">
        <div class="flex items-center">
          <span class="w-100px shrink-0 text-right pr-16px">{{ $t('page.manage.customer.detail.openStatus') }}</span>
          <NSelect
            v-model:value="model.webStatus"
            :options="statusOptions"
            :disabled="webSaving"
            class="w-180px"
            @update:value="handleSave('webStatus')"
          />
        </div>

        <div class="flex items-center">
          <span class="w-100px shrink-0 text-right pr-16px">{{ $t('page.manage.customer.detail.webAccount') }}</span>
          <span>{{ customer.account || '--' }}</span>
        </div>

        <div class="flex items-center">
          <span class="w-100px shrink-0 text-right pr-16px">{{ $t('page.manage.customer.detail.webPassword') }}</span>
          <NPopconfirm @positive-click="handleResetPassword">
            <template #trigger>
              <NButton size="small" type="warning" ghost :loading="resetting">
                {{ $t('page.manage.customer.detail.resetPassword') }}
              </NButton>
            </template>
            {{ $t('page.manage.customer.detail.resetPasswordTip') }}
          </NPopconfirm>
        </div>
      </div>
    </NCard>

    <!-- API下单 -->
    <NCard class="min-w-400px flex-1" content-style="padding-top: 12px;">
      <template #header>
        <span class="text-15px font-600">{{ $t('page.manage.customer.detail.apiOrder') }}</span>
      </template>
      <template #header-extra>
        <span class="text-12px color-gray">{{ $t('page.manage.customer.detail.apiOrderDesc') }}</span>
      </template>

      <div class="flex flex-col gap-16px">
        <div class="flex items-center">
          <span class="w-100px shrink-0 text-right pr-16px">{{ $t('page.manage.customer.detail.openStatus') }}</span>
          <NSelect
            v-model:value="model.apiStatus"
            :options="statusOptions"
            :disabled="apiSaving"
            class="w-180px"
            @update:value="handleSave('apiStatus')"
          />
        </div>

        <div class="flex items-center">
          <span class="w-100px shrink-0 text-right pr-16px">appToken</span>
          <span class="flex-1 truncate">{{ mask(customer.appToken) }}</span>
          <NButton size="tiny" :disabled="!customer.appToken" @click="handleCopy(customer.appToken)">
            <template #icon>
              <icon-mdi-content-copy class="text-icon" />
            </template>
            {{ $t('page.manage.customer.detail.copy') }}
          </NButton>
        </div>

        <div class="flex items-center">
          <span class="w-100px shrink-0 text-right pr-16px">appKey</span>
          <span class="flex-1 truncate">{{ mask(customer.appKey) }}</span>
          <NButton size="tiny" :disabled="!customer.appKey" @click="handleCopy(customer.appKey)">
            <template #icon>
              <icon-mdi-content-copy class="text-icon" />
            </template>
            {{ $t('page.manage.customer.detail.copy') }}
          </NButton>
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
