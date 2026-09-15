<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { NButton, NScrollbar } from 'naive-ui';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

interface BasicInfoModel {
  companyName: string;
  companyAddress: string;
  companyUrl: string;
  systemName: string;
  contactPhone: string;
  defaultOrigin: string;
  staffLogin: boolean;
  customerLogin: boolean;
  companyLogo: string;
}

/** 基本信息默认值（DEV 下不接接口，后续接入后端可改 service 并回填） */
const model = reactive<BasicInfoModel>({
  companyName: 'LINFLY 国际物流',
  companyAddress: '深圳市宝安区福永街道福海工业区 A1 栋三层',
  companyUrl: 'https://www.linfly.com',
  systemName: 'CWMS 仓储管理系统',
  contactPhone: '400-888-0000',
  defaultOrigin: '深圳宝安',
  staffLogin: true,
  customerLogin: true,
  companyLogo: ''
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'companyName',
    label: $t('page.manage.setting.initData.info.companyName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.initData.info.companyName')
  },
  {
    key: 'companyAddress',
    label: $t('page.manage.setting.initData.info.companyAddress'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.manage.setting.initData.info.companyAddress')
  },
  {
    key: 'companyUrl',
    label: $t('page.manage.setting.initData.info.companyUrl'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.setting.initData.info.companyUrl')
  },
  {
    key: 'systemName',
    label: $t('page.manage.setting.initData.info.systemName'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.setting.initData.info.systemName')
  },
  {
    key: 'contactPhone',
    label: $t('page.manage.setting.initData.info.contactPhone'),
    type: 'input',
    span: 12,
    placeholder: $t('page.manage.setting.initData.info.contactPhone')
  },
  {
    key: 'defaultOrigin',
    label: $t('page.manage.setting.initData.info.defaultOrigin'),
    type: 'input',
    span: 12,
    placeholder: $t('page.manage.setting.initData.info.defaultOrigin')
  },
  {
    key: 'staffLogin',
    label: $t('page.manage.setting.initData.info.staffLogin'),
    type: 'switch',
    span: 12,
    checkedText: '支持',
    uncheckedText: '不支持'
  },
  {
    key: 'customerLogin',
    label: $t('page.manage.setting.initData.info.customerLogin'),
    type: 'switch',
    span: 12,
    checkedText: '支持',
    uncheckedText: '不支持'
  },
  {
    key: 'companyLogo',
    label: $t('page.manage.setting.initData.info.companyLogo'),
    type: 'image',
    span: 24
  }
]);

const saving = ref(false);
const formRef = ref<InstanceType<typeof NFormWrap>>();

async function handleSave() {
  if (!(await formRef.value?.validate())) {
    return;
  }

  saving.value = true;

  // 基本信息 DEV 下无后端接口，仅本地提示保存成功
  window.$message?.success($t('common.saveSuccess'));
  saving.value = false;
}
</script>

<template>
  <div class="flex h-full flex-col">
    <NScrollbar class="min-h-0 flex-1">
      <div class="pr-16px">
        <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" mode="edit" />
      </div>
    </NScrollbar>
    <div class="shrink-0 flex justify-end border-t border-#eee p-12px">
      <NButton type="primary" :loading="saving" @click="handleSave">{{ $t('common.save') }}</NButton>
    </div>
  </div>
</template>

<style scoped></style>
