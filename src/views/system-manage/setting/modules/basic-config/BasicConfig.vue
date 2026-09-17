<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { NButton, NCard, NScrollbar } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import Upload from '@/components/Upload/index.vue';
import { fetchGetCompany, fetchSaveCompany } from '@/service/api';

/**
 * 基础配置表单模型：字段名对齐后端 Company 文档（/company/get、/company/save）。
 * 两个阈值字段允许为空（NInputNumber 清空写 null），提交时统一按 0 兜底。
 */
type CompanyFormModel = Omit<Api.Company.SaveParams, 'outWeightDiffNotify' | 'returnWeightDiffNotify'> & {
  outWeightDiffNotify: number | null;
  returnWeightDiffNotify: number | null;
};

const model = reactive<CompanyFormModel>({
  name: '',
  sysName: '',
  address: '',
  web: '',
  startPlace: '',
  phone: '',
  userWeb: '',
  customerWeb: '',
  logoUrl: '',
  feeTotalStrategy: 0,
  weightCtrl: 0,
  feeTotalCtrl: 0,
  noCtrl: 0,
  channelNoCtrl: 0,
  outInWeightDiffNotify: 0,
  outWeightDiffNotify: null,
  returnWeightDiffNotify: null
});

const loading = ref(false);
const saving = ref(false);

const infoFormRef = ref<InstanceType<typeof NFormWrap>>();
const ruleFormRef = ref<InstanceType<typeof NFormWrap>>();

/** LOGO 地址（通用 Upload 组件的 v-model 载荷为 string | string[]，单图场景收敛为字符串） */
const logoUrl = computed({
  get: () => model.logoUrl,
  set: value => {
    model.logoUrl = Array.isArray(value) ? (value[0] ?? '') : value;
  }
});

/** 下拉统一关闭搜索框（固定选项无需过滤） */
const NO_FILTER = { filterable: false };

/** 应收总费用取整规则 */
const feeTotalStrategyOptions = computed<SelectOption[]>(() => [
  { label: $t('page.manage.setting.basicConfig.option.notRound'), value: 0 },
  { label: $t('page.manage.setting.basicConfig.option.roundDown'), value: 1 },
  { label: $t('page.manage.setting.basicConfig.option.roundHalfUp'), value: 2 }
]);

/** 允许 / 不允许（weightCtrl、feeTotalCtrl、noCtrl、channelNoCtrl 共用） */
const allowOptions = computed<SelectOption[]>(() => [
  { label: $t('page.manage.setting.basicConfig.option.allow'), value: 1 },
  { label: $t('page.manage.setting.basicConfig.option.deny'), value: 0 }
]);

/** 提示 / 不提示（outInWeightDiffNotify） */
const notifyOptions = computed<SelectOption[]>(() => [
  { label: $t('page.manage.setting.basicConfig.option.notify'), value: 1 },
  { label: $t('page.manage.setting.basicConfig.option.notNotify'), value: 0 }
]);

/** 基本信息（后端 name/sysName/address/web/phone/startPlace/userWeb/customerWeb/logoUrl） */
const infoItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.setting.basicConfig.info.companyName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.basicConfig.info.companyName')
  },
  {
    key: 'address',
    label: $t('page.manage.setting.basicConfig.info.companyAddress'),
    type: 'textarea',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.basicConfig.info.companyAddress')
  },
  {
    key: 'web',
    label: $t('page.manage.setting.basicConfig.info.companyUrl'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.basicConfig.info.companyUrl')
  },
  {
    key: 'sysName',
    label: $t('page.manage.setting.basicConfig.info.systemName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.basicConfig.info.systemName')
  },
  {
    key: 'phone',
    label: $t('page.manage.setting.basicConfig.info.contactPhone'),
    type: 'input',
    span: 12,
    placeholder: $t('page.manage.setting.basicConfig.info.contactPhone')
  },
  {
    key: 'startPlace',
    label: $t('page.manage.setting.basicConfig.info.defaultOrigin'),
    type: 'input',
    span: 12,
    placeholder: $t('page.manage.setting.basicConfig.info.defaultOrigin')
  },
  {
    key: 'userWeb',
    label: $t('page.manage.setting.basicConfig.info.staffLogin'),
    type: 'input',
    span: 12,
    placeholder: $t('page.manage.setting.basicConfig.info.staffLogin')
  },
  {
    key: 'customerWeb',
    label: $t('page.manage.setting.basicConfig.info.customerLogin'),
    type: 'input',
    span: 12,
    placeholder: $t('page.manage.setting.basicConfig.info.customerLogin')
  },
  {
    key: 'logoUrl',
    label: $t('page.manage.setting.basicConfig.info.companyLogo'),
    type: 'custom',
    required: true,
    span: 24
  }
]);

/** 系统操作控制定义（后端业务规则字段，每行 3 列） */
const ruleItems = computed<FormItemConfig[]>(() => [
  {
    key: 'feeTotalStrategy',
    label: $t('page.manage.setting.basicConfig.rule.feeTotalStrategy'),
    type: 'select',
    options: feeTotalStrategyOptions.value,
    span: 8,
    ...NO_FILTER
  },
  {
    key: 'feeTotalCtrl',
    label: $t('page.manage.setting.basicConfig.rule.feeTotalCtrl'),
    type: 'select',
    options: allowOptions.value,
    span: 8,
    ...NO_FILTER
  },
  {
    key: 'weightCtrl',
    label: $t('page.manage.setting.basicConfig.rule.weightCtrl'),
    type: 'select',
    options: allowOptions.value,
    span: 8,
    ...NO_FILTER
  },
  {
    key: 'noCtrl',
    label: $t('page.manage.setting.basicConfig.rule.noCtrl'),
    type: 'select',
    options: allowOptions.value,
    span: 8,
    ...NO_FILTER
  },
  {
    key: 'channelNoCtrl',
    label: $t('page.manage.setting.basicConfig.rule.channelNoCtrl'),
    type: 'select',
    options: allowOptions.value,
    span: 8,
    ...NO_FILTER
  },
  {
    key: 'outInWeightDiffNotify',
    label: $t('page.manage.setting.basicConfig.rule.outInWeightDiffNotify'),
    type: 'select',
    options: notifyOptions.value,
    span: 8,
    ...NO_FILTER
  },
  {
    key: 'outWeightDiffNotify',
    label: $t('page.manage.setting.basicConfig.rule.outWeightDiffNotify'),
    type: 'number',
    span: 8
  },
  {
    key: 'returnWeightDiffNotify',
    label: $t('page.manage.setting.basicConfig.rule.returnWeightDiffNotify'),
    type: 'number',
    span: 8
  }
]);

/** 拉取公司配置并回填（后端老文档字段可能缺省，逐字段兜底） */
async function loadCompany() {
  loading.value = true;
  const { data, error } = await fetchGetCompany();
  loading.value = false;

  if (error || !data) return;

  Object.assign(model, {
    name: data.name ?? '',
    sysName: data.sysName ?? '',
    address: data.address ?? '',
    web: data.web ?? '',
    startPlace: data.startPlace ?? '',
    phone: data.phone ?? '',
    userWeb: data.userWeb ?? '',
    customerWeb: data.customerWeb ?? '',
    logoUrl: data.logoUrl ?? '',
    feeTotalStrategy: data.feeTotalStrategy ?? 0,
    weightCtrl: data.weightCtrl ?? 0,
    feeTotalCtrl: data.feeTotalCtrl ?? 0,
    noCtrl: data.noCtrl ?? 0,
    channelNoCtrl: data.channelNoCtrl ?? 0,
    outInWeightDiffNotify: data.outInWeightDiffNotify ?? 0,
    outWeightDiffNotify: data.outWeightDiffNotify ?? null,
    returnWeightDiffNotify: data.returnWeightDiffNotify ?? null
  });
}

onMounted(loadCompany);

/** 提交修改：两个表单（基本信息 / 系统操作控制定义）都校验通过才提交 */
async function handleSubmit() {
  const [infoValid, ruleValid] = await Promise.all([infoFormRef.value?.validate(), ruleFormRef.value?.validate()]);

  if (!infoValid || !ruleValid) return;

  saving.value = true;
  const { error } = await fetchSaveCompany({
    ...model,
    outWeightDiffNotify: model.outWeightDiffNotify ?? 0,
    returnWeightDiffNotify: model.returnWeightDiffNotify ?? 0
  });
  saving.value = false;

  if (error) return;

  window.$message?.success($t('common.saveSuccess'));
  loadCompany();
}
</script>

<template>
  <div class="flex h-full flex-col">
    <NScrollbar class="min-h-0 flex-1">
      <div class="pr-16px">
        <NCard class="mb-16px">
          <template #header>
            <div class="flex items-center gap-8px">
              <span class="h-16px w-3px rounded-2px bg-primary" />
              <span class="text-15px font-600">{{ $t('page.manage.setting.basicConfig.infoCard') }}</span>
            </div>
          </template>
          <NFormWrap
            ref="infoFormRef"
            :model="model"
            :items="infoItems"
            :grid-x-gap="16"
            :disabled="loading || saving"
            mode="edit"
          >
            <template #logoUrl>
              <Upload v-model:value="logoUrl" :dest="2" :disabled="loading || saving" />
            </template>
          </NFormWrap>
        </NCard>

        <NCard>
          <template #header>
            <div class="flex items-center gap-8px">
              <span class="h-16px w-3px rounded-2px bg-primary" />
              <span class="text-15px font-600">{{ $t('page.manage.setting.basicConfig.ruleCard') }}</span>
            </div>
          </template>
          <NFormWrap
            ref="ruleFormRef"
            :model="model"
            :items="ruleItems"
            :grid-x-gap="16"
            :disabled="loading || saving"
            mode="edit"
          />
        </NCard>
      </div>
    </NScrollbar>
    <div class="shrink-0 -mb-16px flex justify-center border-t border-#eee py-8px">
      <NButton type="primary" :loading="saving" :disabled="loading" @click="handleSubmit">
        {{ $t('common.submitModify') }}
      </NButton>
    </div>
  </div>
</template>
