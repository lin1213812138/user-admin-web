<script setup lang="ts">
import { computed, onActivated, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { $t } from '@/locales';
import { useTabStore } from '@/store/modules/tab';
import { sessionStg } from '@/utils/storage';
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
import CostPricePanel from './modules/cost-price/index.vue';
import CustomerPricePanel from './modules/customer-price/index.vue';
import FeeExtPanel from './modules/fee-ext/index.vue';
import PricePanel from './modules/price/index.vue';
import ZonePanel from './modules/zone/index.vue';

defineOptions({
  // 必须与路由 name 完全一致（含 kebab 写法）：本页位于 modules 内不参与 elegant-router 扫描，
  // 插件不会自动注入组件 name，而顶部页签的 keep-alive 用 routeStore.cacheRoutes（值为路由 name）
  // 去匹配「组件 name」，写成 PascalCase 会导致缓存不命中（切回页签时重新挂载）
  name: 'ChannelQuoteReceiveQuoteSetting'
});

const route = useRoute();
const router = useRouter();
const tabStore = useTabStore();

/** 子页签顺序：地址分区 → 渠道报价 → 渠道加收 → 客户报价 → 销售成本价（对齐老系统渠道详情页） */
const TAB_KEYS = ['zone', 'price', 'feeExt', 'customerPrice', 'costPrice'] as const;

type QuoteSettingTabKey = (typeof TAB_KEYS)[number];

/** 左侧竖向 tab 项（value/label 为 VerticalTabLayout 约定结构；顺序与文案不变） */
const tabs = computed<{ value: QuoteSettingTabKey; label: string }[]>(() => [
  { value: 'zone', label: $t('page.channelQuote.quoteSetting.tabs.zone') },
  { value: 'price', label: $t('page.channelQuote.quoteSetting.tabs.price') },
  { value: 'feeExt', label: $t('page.channelQuote.quoteSetting.tabs.feeExt') },
  { value: 'customerPrice', label: $t('page.channelQuote.quoteSetting.tabs.customerPrice') },
  { value: 'costPrice', label: $t('page.channelQuote.quoteSetting.tabs.costPrice') }
]);

const activeTab = ref<QuoteSettingTabKey>('zone');

/**
 * 当前渠道：由收货渠道列表跳转前写入 sessionStorage（列表页 `handleQuoteSetting` 传递）。
 * 不进 URL —— 避免渠道 id / 名称明文出现在地址栏、浏览器历史与分享链接中；
 * 未从列表进入（新标签页直开 / 书签 / 分享链接）时为空 → 走下方引导空态。
 */
const channelId = ref('');
/** 渠道名称（缺失时回落展示 channelId） */
const channelName = ref('');

/** 读取渠道上下文：首次挂载与每次 keep-alive 激活（从列表重新点入）都重读，保证展示的是当前渠道 */
function loadChannelContext() {
  const context = sessionStg.get('quoteSettingContext');
  channelId.value = context?.channelId ?? '';
  channelName.value = context?.channelName ?? '';
}

loadChannelContext();
onActivated(loadChannelContext);

/** 本页路径：keep-alive 缓存期间其它页面的 query 变化不应影响本页 activeTab */
const selfPath = route.path;

function resolveTabKey(raw: unknown): QuoteSettingTabKey | null {
  return typeof raw === 'string' && (TAB_KEYS as readonly string[]).includes(raw) ? (raw as QuoteSettingTabKey) : null;
}

/** URL → activeTab：初始进入 / 浏览器前进后退 / 外部跳转均走这里 */
function syncFromQuery() {
  if (route.path !== selfPath) return;

  const key = resolveTabKey(route.query.tab);
  if (key && key !== activeTab.value) {
    activeTab.value = key;
  }
}

/**
 * activeTab → URL：
 * - `replace` 不新增浏览器历史，后退仍直接离开本页
 * - 同步全局页签记录的 fullPath，否则点顶部页签切回会跳回旧 query、丢失最后所在分页
 */
function syncToQuery() {
  if (route.query.tab === activeTab.value) return;

  const query = { ...route.query, tab: activeTab.value };
  const { fullPath } = router.resolve({ path: route.path, query });

  tabStore.setTabFullPath(tabStore.getTabIdByRoute(route), fullPath);

  void router.replace({ path: route.path, query });
}

syncFromQuery();
watch(activeTab, syncToQuery);
watch(() => route.query.tab, syncFromQuery);

function handleTabChange(value: string | number) {
  const key = resolveTabKey(value);

  if (key) {
    activeTab.value = key;
  }
}
</script>

<template>
  <div class="h-full w-full">
    <!--
      未带渠道上下文（直接敲 URL）：给引导空态，不请求任何数据。
      ⚠️ 本注释必须位于根节点内部：「<template> 与根节点之间」的顶层注释会被编译成注释节点、
      使页面组件变成多根（Fragment），而布局层 <Transition mode="out-in"> 的过渡钩子只能挂到单个根元素上，
      会导致离开本页时之后所有页面内容区永久空白（同 views/system-manage/setting/index.vue 的踩坑口径）。
    -->
    <div v-if="!channelId" class="h-full w-full flex items-center justify-center">
      <NEmpty :description="$t('page.channelQuote.quoteSetting.noChannel')" />
    </div>

    <VerticalTabLayout
      v-else
      :value="activeTab"
      :tabs="tabs"
      :title="channelName || channelId"
      @update:value="handleTabChange"
    >
      <ZonePanel v-if="activeTab === 'zone'" />
      <PricePanel v-else-if="activeTab === 'price'" />
      <FeeExtPanel v-else-if="activeTab === 'feeExt'" :channel-id="channelId" />
      <CustomerPricePanel v-else-if="activeTab === 'customerPrice'" />
      <CostPricePanel v-else />
    </VerticalTabLayout>
  </div>
</template>

<style scoped></style>
