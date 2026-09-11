<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { $t } from '@/locales';
import { useLabelDesignStore } from '@/store/modules/label-design';
import {
  fetchGetPrintTemplateList,
  fetchGetPrintTemplateDetail,
  fetchSavePrintTemplateDesign
} from '@/service/api/print-format';
import ToolBar from './modules/tool-bar.vue';
import FieldPanel from './modules/field-panel.vue';
import DesignCanvas from './modules/design-canvas.vue';
import PropertyPanel from './modules/property-panel.vue';
import PreviewModal from './modules/preview-modal.vue';

const store = useLabelDesignStore();
const previewVisible = ref(false);

const templates = ref<{ label: string; value: number }[]>([]);
const currentId = ref<number | null>(null);
const loading = ref(false);

async function loadTemplates() {
  // DEV 下 print-format service 直接返回裸数据（与 prod 的 request 包裹形态不同），此处按裸数据消费
  const list = (await fetchGetPrintTemplateList({
    categoryId: 1,
    current: 1,
    size: 100
  })) as unknown as Api.PrintFormat.List;
  templates.value = list.records.map(r => ({ label: r.name, value: r.id }));
  if (templates.value.length > 0 && currentId.value === null) {
    currentId.value = templates.value[0].value;
    await loadTemplate(currentId.value);
  }
}

async function loadTemplate(id: number) {
  loading.value = true;
  try {
    const detail = (await fetchGetPrintTemplateDetail(id)) as unknown as Api.PrintFormat.Template;
    store.loadFromJson(detail.designJson || '');
    if (detail.paperSize) store.setPaper(detail.paperSize);
  } catch {
    window.$message?.error($t('page.manage.labelDesign.loadFailed'));
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (!currentId.value) return;
  loading.value = true;
  try {
    const ok = (await fetchSavePrintTemplateDesign({
      id: currentId.value,
      designJson: store.toJson(),
      paperSize: store.template.paperSize
    })) as unknown as boolean;
    if (ok) window.$message?.success($t('page.manage.labelDesign.saveSuccess'));
    else window.$message?.error($t('page.manage.labelDesign.saveFailed'));
  } catch {
    window.$message?.error($t('page.manage.labelDesign.saveFailed'));
  } finally {
    loading.value = false;
  }
}

function onTemplateChange(id: number) {
  currentId.value = id;
  loadTemplate(id);
}

function toggleBodyScroll(disable: boolean) {
  document.body.classList.toggle('label-designer-no-scroll', disable);
}

onMounted(() => {
  toggleBodyScroll(true);
  loadTemplates();
});
onBeforeUnmount(() => toggleBodyScroll(false));
</script>

<template>
  <div class="flex h-full w-full flex-col">
    <div class="flex items-center gap-12px border-b border-#e5e7eb px-12px py-8px dark:border-#2a2a2a">
      <span class="text-15px font-medium">{{ $t('page.manage.labelDesign.title') }}</span>
      <NSelect
        :value="currentId"
        :options="templates"
        :placeholder="$t('page.manage.labelDesign.selectTemplate')"
        style="width: 220px"
        @update:value="onTemplateChange"
      />
      <div class="flex-1" />
      <NButton type="primary" :loading="loading" @click="handleSave">{{ $t('page.manage.labelDesign.save') }}</NButton>
    </div>

    <ToolBar class="shrink-0" @preview="previewVisible = true" />

    <div class="flex flex-1 overflow-hidden">
      <div class="w-220px shrink-0 overflow-hidden border-r border-#e5e7eb dark:border-#2a2a2a">
        <FieldPanel />
      </div>
      <DesignCanvas class="flex-1" />
      <div class="w-300px shrink-0 overflow-hidden border-l border-#e5e7eb dark:border-#2a2a2a">
        <PropertyPanel />
      </div>
    </div>

    <PreviewModal v-model:show="previewVisible" />
  </div>
</template>

<style>
.label-designer-no-scroll {
  overflow: hidden;
}
</style>
