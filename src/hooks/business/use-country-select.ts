import { h, ref, type Ref, type VNodeChild } from 'vue';
import type { SelectOption } from 'naive-ui';
import { fetchGetCountryList } from '@/service/api/data-manage-basic';

type CountryItem = Api.DataManage.BasicCountryRegion;
type CountryOption = SelectOption & { name?: string; code2?: string };

let cachePromise: Promise<CountryItem[]> | null = null;

/** 模块级单例缓存：整个会话只请求一次 /country/query */
function ensureCountries(): Promise<CountryItem[]> {
  if (!cachePromise) {
    cachePromise = fetchGetCountryList({ page: 1, size: 1000 }).then(({ data, error }) =>
      !error && data ? data.list : []
    );
  }
  return cachePromise;
}

function buildName(item: CountryItem): string {
  return item.nameCn ?? item.name ?? item.nameEn ?? item.code ?? item._id ?? '';
}

/** 名称左对齐 + 二字码右对齐（NSelect 的 render-label 是 select 级 prop，也可被 FormWrap 从 option 上兜底取用） */
function renderCountryOptionLabel(option: SelectOption): VNodeChild {
  const { name, code2 } = option as CountryOption;

  // pr-9px：naive 下拉滚动条为覆盖式悬浮(rail 宽 5px 且距菜单右缘内缩 4px)，
  // 实测补偿后二字码与滚动条之间留白 = 选项左内边距 12px，视觉左右对称
  return h('div', { class: 'country-option-row flex items-center justify-between w-full pr-9px' }, [
    h('span', { class: 'truncate' }, String(name ?? '')),
    code2 ? h('span', { class: 'country-option-code2 text-12px text-gray-400 pl-8px' }, code2) : null
  ]);
}

function buildOptions(list: CountryItem[]): SelectOption[] {
  return list.map(item => {
    const name = buildName(item);
    const code2 = item.code2 ?? '';
    return {
      label: code2 ? `${name} (${code2})` : name,
      value: item._id as string,
      name,
      code2,
      renderLabel: renderCountryOptionLabel
    } as SelectOption;
  });
}

export function useCountrySelect() {
  const options: Ref<SelectOption[]> = ref([]);
  const loading: Ref<boolean> = ref(false);

  async function load(): Promise<void> {
    if (options.value.length) return;
    loading.value = true;
    try {
      const list = await ensureCountries();
      options.value = buildOptions(list);
    } finally {
      loading.value = false;
    }
  }

  /** 由 _id 反查中文名，供提交时回填 country 字段（避免存到带 (AE) 的整串） */
  function getName(id?: string): string {
    if (!id) return '';
    return (options.value.find(opt => opt.value === id)?.name as string) ?? '';
  }

  return { options, loading, load, getName, renderLabel: renderCountryOptionLabel };
}
