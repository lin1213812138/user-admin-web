<script setup lang="ts">
import { computed, onActivated, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { Component } from 'vue';
import { $t } from '@/locales';
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
import InputFormat from './modules/input-format/InputFormat.vue';
import PrintFormat from './modules/print-format/PrintFormat.vue';
import ExportFormat from './modules/export-format/ExportFormat.vue';
import TraceCapture from './modules/trace-capture/TraceCapture.vue';
import OperationTrace from './modules/operation-trace/OperationTrace.vue';
import BasicConfig from './modules/basic-config/BasicConfig.vue';

const route = useRoute();

/** 各子模块平铺为左侧 tab（基础配置置顶） */
const tabs = [
  { value: 'basic-config', label: $t('page.manage.setting.basicConfig.title') },
  { value: 'input-format', label: $t('page.manage.setting.inputFormat.title') },
  { value: 'print-format', label: $t('page.manage.setting.printFormat.title') },
  { value: 'export-format', label: $t('page.manage.setting.exportFormat.title') },
  { value: 'trace-capture', label: $t('page.manage.setting.traceCapture.title') },
  { value: 'operation-trace', label: $t('page.manage.setting.operationTrace.title') }
];

const activeKey = ref('basic-config');

/** 从 URL query（如 ?tab=print-format，来自标签设计页「返回上一页」）切换到对应分页 */
function syncTabFromQuery() {
  const tab = route.query.tab;
  if (typeof tab === 'string' && tabs.some(t => t.value === tab)) {
    activeKey.value = tab;
  }
}

syncTabFromQuery();
onActivated(syncTabFromQuery);

const componentMap: Record<string, Component> = {
  'basic-config': BasicConfig,
  'input-format': InputFormat,
  'print-format': PrintFormat,
  'export-format': ExportFormat,
  'trace-capture': TraceCapture,
  'operation-trace': OperationTrace
};

const activeComponent = computed<Component>(() => componentMap[activeKey.value] ?? BasicConfig);
</script>

<template>
  <VerticalTabLayout v-model:value="activeKey" :tabs="tabs" :title="$t('route.system-manage_setting')">
    <!--
      左：页面名称 + 竖向 tab 栏；右：内容区（componentMap 动态渲染），均由公共组件承载。
      ⚠️ 本注释必须在根组件内部：页面模板的「<template> 与根节点之间」不允许出现 HTML 注释 ——
      顶层注释会被编译成注释节点、使页面组件变成多根（Fragment），而布局层
      <Transition mode="out-in"> 的过渡钩子只能挂到单个根元素上，会导致离开本页时过渡无法收尾、
      之后所有页面内容区永久空白。详见 changelog/系统设置tab切换后跳转空白页.md
    -->
    <component :is="activeComponent" />
  </VerticalTabLayout>
</template>
