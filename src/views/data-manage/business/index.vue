<script setup lang="ts">
import { onMounted, reactive, ref, type Component } from 'vue';
import { $t } from '@/locales';
import WarehouseArchive from '@/components/MasterData/archives/business/warehouse/index.vue';
import LocationArchive from '@/components/MasterData/archives/business/location/index.vue';
import CarrierArchive from '@/components/MasterData/archives/business/carrier/index.vue';
import StoreArchive from '@/components/MasterData/archives/business/store/index.vue';

type ArchiveKey = 'warehouse' | 'location' | 'carrier' | 'store';

const archiveMap: Record<ArchiveKey, { labelKey: App.I18n.I18nKey; comp: Component }> = {
  warehouse: { labelKey: 'page.dataManage.business.warehouse.title', comp: WarehouseArchive },
  location: { labelKey: 'page.dataManage.business.location.title', comp: LocationArchive },
  carrier: { labelKey: 'page.dataManage.business.carrier.title', comp: CarrierArchive },
  store: { labelKey: 'page.dataManage.business.store.title', comp: StoreArchive }
};

const order: ArchiveKey[] = ['warehouse', 'location', 'carrier', 'store'];

const active = ref<ArchiveKey>('warehouse');

// 预挂载所有子档案：当前项立即构建，其余在浏览器空闲时后台构建，
// 这样首次点击任意子档案都无需现场初始化 VXE 表格，切换瞬时完成。
const prebuilt = reactive<Record<ArchiveKey, boolean>>(
  Object.fromEntries(order.map(k => [k, k === active.value])) as Record<ArchiveKey, boolean>
);

onMounted(() => {
  const buildRest = () => order.forEach(k => (prebuilt[k] = true));
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(buildRest);
  } else {
    setTimeout(buildRest, 0);
  }
});
</script>

<template>
  <div class="flex h-full w-full">
    <nav class="w-180px shrink-0 border-r border-#e5e7eb p-8px">
      <button
        v-for="key in order"
        :key="key"
        class="mb-4px w-full rounded px-12px py-8px text-left text-14px"
        :class="active === key ? 'bg-primary/10 font-medium text-primary' : 'text-#4b5563 hover:bg-#f3f4f6'"
        @click="active = key"
      >
        {{ $t(archiveMap[key].labelKey) }}
      </button>
    </nav>
    <div class="relative min-w-0 flex-1">
      <div
        v-for="key in order"
        :key="key"
        class="absolute inset-0"
        :style="{
          visibility: active === key ? 'visible' : 'hidden',
          pointerEvents: active === key ? 'auto' : 'none'
        }"
      >
        <component :is="archiveMap[key].comp" v-if="prebuilt[key]" />
      </div>
    </div>
  </div>
</template>
