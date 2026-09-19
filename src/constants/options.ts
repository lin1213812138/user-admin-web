import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';

/**
 * 全局选项注册表：以 key 登记「下拉选项工厂」，供 NFormWrap 的 optionsKey 与 useStatusOptions 组合式复用，
 * 避免每个界面重复声明同一组选项（如启用/禁用状态）。
 *
 * 工厂在解析时才调用（而非登记时），因此可安全使用 $t，语言切换后文案随调用方重建而更新。
 */
type OptionFactory = () => SelectOption[];

const registry = new Map<string, OptionFactory>();

/** 登记一组全局选项 */
export function registerGlobalOptions(key: string, factory: OptionFactory): void {
  registry.set(key, factory);
}

/** 按 key 解析全局选项；未登记时返回空数组 */
export function getGlobalOptions(key: string): SelectOption[] {
  return registry.get(key)?.() ?? [];
}

// ---- 预置：通用「启用 / 禁用」状态（值 1 / 0） ----
registerGlobalOptions('status', () => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);
