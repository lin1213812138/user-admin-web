<script setup lang="ts">
import { $t } from '@/locales';
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
import { useArchiveTabs } from '@/views/data-manage/components/useArchiveTabs';
import InputFormat from './modules/input-format/index.vue';
import PrintFormat from './modules/print-format/index.vue';
import ExportFormat from './modules/export-format/index.vue';
import TraceCapture from './modules/trace-capture/index.vue';
import OperationTrace from './modules/operation-trace/index.vue';
import BasicConfig from './modules/basic-config/index.vue';

/**
 * 各子模块平铺为左侧 tab（基础配置置顶），按角色权限过滤后生成。
 * urlSync：分页状态与 URL（?tab=xxx）双向同步 —— 切 tab 写回地址栏（replace，不新增历史），
 * 刷新/分享可定位当前分页；标签设计页「返回」的 ?tab=print-format 定位也由它接管。
 */
const { tabs, activeKey, activeComponent } = useArchiveTabs(
  [
    {
      key: 'basic-config',
      labelKey: 'page.manage.setting.basicConfig.title',
      component: BasicConfig,
      permission: 'system:setting:basicConfig'
    },
    {
      key: 'input-format',
      labelKey: 'page.manage.setting.inputFormat.title',
      component: InputFormat,
      permission: 'system:setting:inputFormat'
    },
    {
      key: 'print-format',
      labelKey: 'page.manage.setting.printFormat.title',
      component: PrintFormat,
      permission: 'system:setting:printFormat'
    },
    {
      key: 'export-format',
      labelKey: 'page.manage.setting.exportFormat.title',
      component: ExportFormat,
      permission: 'system:setting:exportFormat'
    },
    {
      key: 'trace-capture',
      labelKey: 'page.manage.setting.traceCapture.title',
      component: TraceCapture,
      permission: 'system:setting:traceCapture'
    },
    {
      key: 'operation-trace',
      labelKey: 'page.manage.setting.operationTrace.title',
      component: OperationTrace,
      permission: 'system:setting:operationTrace'
    }
  ],
  { urlSync: true }
);
</script>

<template>
  <VerticalTabLayout v-model:value="activeKey" :tabs="tabs" :title="$t('route.system-manage_setting')">
    <!--
      左：页面名称 + 竖向 tab 栏；右：内容区（动态组件渲染），均由公共组件承载。
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
