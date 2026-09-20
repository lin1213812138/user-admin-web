<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({
  name: 'QuoteSettingPricePanel'
});
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <div class="mb-10px flex-y-center gap-8px">
      <LButton type="primary">
        <template #icon>
          <icon-ic-round-edit class="text-icon" />
        </template>
        {{ $t('page.channelQuote.quoteSetting.actions.editPrice') }}
      </LButton>
      <LButton type="primary">
        <template #icon>
          <icon-ic-round-file-upload class="text-icon" />
        </template>
        {{ $t('page.channelQuote.quoteSetting.actions.importPrice') }}
      </LButton>
    </div>

    <!-- 渠道报价的列由分区动态决定，无数据时不渲染表头（对齐老系统） -->
    <div class="min-h-0 flex flex-1 items-center justify-center bg-white">
      <span class="text-14px text-#909399">{{ $t('page.channelQuote.quoteSetting.empty.noChannelPrice') }}</span>
    </div>
  </div>
</template>

<style scoped></style>
