<script setup lang="ts">
import { ref } from 'vue';
import type { Component } from 'vue';
import { $t } from '@/locales';
import { NCard, NTabPane, NTabs } from 'naive-ui';
import Product from './product/Product.vue';
import ProductCountry from './product-country/ProductCountry.vue';

type SubTabKey = 'product' | 'product-country';

const subTabs: { key: SubTabKey; label: string }[] = [
  { key: 'product', label: $t('page.dataManage.business.declaredGoods.library') },
  { key: 'product-country', label: $t('page.dataManage.business.declaredGoods.clearanceDestination') }
];

const active = ref<SubTabKey>('product');

function handleTabChange(value: string | number) {
  active.value = value as SubTabKey;
}

const tableMap: Record<SubTabKey, Component> = {
  product: Product,
  'product-country': ProductCountry
};
</script>

<template>
  <NCard class="h-full" :content-style="{ padding: '0', display: 'flex', flexDirection: 'column', minHeight: '0' }">
    <div class="min-w-0 flex-1 flex-col min-h-0 overflow-hidden px-10px py-10px">
      <NTabs :value="active" type="line" class="mb-5px" @update:value="handleTabChange">
        <NTabPane v-for="t in subTabs" :key="t.key" :name="t.key" :tab="t.label" />
      </NTabs>
      <KeepAlive>
        <component :is="tableMap[active]" :key="active" class="min-h-0 flex-1" />
      </KeepAlive>
    </div>
  </NCard>
</template>

<style scoped></style>
