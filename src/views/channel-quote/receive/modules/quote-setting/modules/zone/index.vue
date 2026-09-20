<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { Table } from '@/components/Table';
import type { VxeColumnRenderColumn } from '@/components/Table';

defineOptions({
  name: 'QuoteSettingZonePanel'
});

/** 搜索条件：国家 / 二字编码（本轮只渲染，取数后续迭代接入） */
// const keyword = ref('');

/** 列结构对齐老系统「地址分区」：分区 / 目的地 / 时效(天) / 特别提示（序号列由表格自带） */
const columns = computed<VxeColumnRenderColumn[]>(() => [
  { key: 'zone', title: $t('page.channelQuote.quoteSetting.zone.name'), minWidth: 160, sortable: false },
  { key: 'destination', title: $t('page.channelQuote.quoteSetting.zone.destination'), minWidth: 220, sortable: false },
  {
    key: 'aging',
    title: $t('page.channelQuote.quoteSetting.zone.aging'),
    width: 120,
    align: 'center',
    sortable: false
  },
  { key: 'tip', title: $t('page.channelQuote.quoteSetting.zone.tip'), minWidth: 220, sortable: false }
]);
</script>

<template>
  <Table :columns="columns" :data="[]" show-seq :search-action-flush="false">
    <!-- 快速搜索栏（表格组件自带 search-action 卡片）：国家 / 二字编码检索 -->
    <!--
 <template #search-action>
      <div class="flex flex-wrap items-center gap-12px">
        <NInput
          v-model:value="keyword"
          class="w-240px!"
          clearable
          :placeholder="$t('page.channelQuote.quoteSetting.search.zonePlaceholder')"
        />
        <LButton type="primary">
          <template #icon>
            <icon-ic-round-search class="text-icon" />
          </template>
          {{ $t('common.search') }}
        </LButton>
        <LButton>
          <template #icon>
            <icon-mdi-refresh class="text-icon" />
          </template>
          {{ $t('common.reset') }}
        </LButton>
      </div>
    </template>
-->

    <template #operation-left>
      <LButton type="primary">
        <template #icon>
          <icon-ic-round-edit class="text-icon" />
        </template>
        {{ $t('page.channelQuote.quoteSetting.actions.editZone') }}
      </LButton>
      <LButton type="primary">
        <template #icon>
          <icon-ic-round-file-upload class="text-icon" />
        </template>
        {{ $t('page.channelQuote.quoteSetting.actions.importZone') }}
      </LButton>
    </template>
  </Table>
</template>

<style scoped></style>
