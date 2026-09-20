<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Component } from 'vue';
import { $t } from '@/locales';
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
import ProfileInfo from './modules/profile-info/index.vue';
import ChangePassword from './modules/change-password/index.vue';

defineOptions({
  name: 'PersonalCenter'
});

/** 个人中心两个 tab：基本信息 / 修改密码 */
const tabs = [
  { value: 'profile-info', label: $t('page.personalCenter.profileInfo') },
  { value: 'change-password', label: $t('page.personalCenter.changePassword') }
];

const activeKey = ref('profile-info');

const componentMap: Record<string, Component> = {
  'profile-info': ProfileInfo,
  'change-password': ChangePassword
};

const activeComponent = computed<Component>(() => componentMap[activeKey.value] ?? ProfileInfo);
</script>

<template>
  <VerticalTabLayout v-model:value="activeKey" :tabs="tabs" :title="$t('route.personal-center')">
    <!--
      ⚠️ 本注释必须在根组件内部：页面模板的「<template> 与根节点之间」不允许出现 HTML 注释 ——
      顶层注释会被编译成注释节点、使页面组件变成多根（Fragment），而布局层
      <Transition mode="out-in"> 的过渡钩子只能挂到单个根元素上，会导致离开本页时过渡无法收尾、
      之后所有页面内容区永久空白。详见 changelog/系统设置tab切换后跳转空白页.md
    -->
    <KeepAlive>
      <component :is="activeComponent" :key="activeKey" />
    </KeepAlive>
  </VerticalTabLayout>
</template>
