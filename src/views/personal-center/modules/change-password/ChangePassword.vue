<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { FormRules } from 'naive-ui';
import { $t } from '@/locales';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

defineOptions({
  name: 'PersonalChangePassword'
});

/**
 * 修改密码（暂未开放）
 *
 * 后端 /user/update 对「改自己密码」有 editPwdCtrl 校验，而该字段目前没有任何赋值来源
 * （角色合并里只有 editInfoCtrl），因此必然返回 100107「不允许修改密码」。
 * 本页先完整呈现 UI 并整体禁用；后端支持后：
 * 1. 去掉 NFormWrap / NButton 的 disabled；
 * 2. handleSubmit 提交 fetchUpdateSelfProfile({ _id, password: md5(md5(新密码) + 新密码) })（与登录同格式）；
 * 3. 成功提示后 resetStore()（后端会销毁会话，需重新登录）。
 */
const formRef = ref<InstanceType<typeof NFormWrap>>();

const model = reactive({
  newPassword: '',
  confirmPassword: ''
});

const items = computed<FormItemConfig[]>(() => [
  {
    key: 'newPassword',
    label: $t('page.personalCenter.newPassword'),
    type: 'password',
    required: true,
    span: 24,
    placeholder: $t('page.personalCenter.form.newPasswordPlaceholder')
  },
  {
    key: 'confirmPassword',
    label: $t('page.personalCenter.confirmPassword'),
    type: 'password',
    required: true,
    span: 24,
    placeholder: $t('page.personalCenter.form.confirmPasswordPlaceholder')
  }
]);

/** 给 confirmPassword 传自定义规则会覆盖 FormWrap 自动生成的必填规则，故 required 星号与空值校验一并手写 */
const rules = computed<FormRules>(() => ({
  confirmPassword: {
    required: true,
    message: $t('page.personalCenter.form.confirmPasswordPlaceholder'),
    trigger: ['input', 'blur', 'change'],
    validator: (_rule, value) => {
      if (!value) return new Error($t('page.personalCenter.form.confirmPasswordPlaceholder'));

      if (value !== model.newPassword) return new Error($t('page.personalCenter.passwordNotMatch'));

      return undefined;
    }
  }
}));

// 提交逻辑待后端开放后启用（当前按钮与表单整体禁用）
function handleSubmit() {
  formRef.value?.restoreValidation();
}
</script>

<template>
  <div class="h-full overflow-y-auto">
    <NCard :title="$t('page.personalCenter.changePassword')" :bordered="false" size="small">
      <NAlert type="warning" :show-icon="true" class="mb-16px">
        {{ $t('page.personalCenter.backendNotOpen') }}
      </NAlert>

      <NFormWrap ref="formRef" :model="model" :items="items" :rules="rules" :grid-x-gap="16" disabled />

      <div class="mt-16px flex justify-end">
        <LButton type="primary" disabled @click="handleSubmit">
          {{ $t('common.submitModify') }}
        </LButton>
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
