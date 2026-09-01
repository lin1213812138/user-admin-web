import type { FormItemConfig } from '@/components/Form/index.vue';
import type { VxeColumnConfig } from '@/components/Table';

/** 主数据行基础字段（所有档案共有），定义见 Api.DataManage.MasterDataRow */
export type MasterDataRow = Api.DataManage.MasterDataRow;

/** 单个子档案的配置（驱动 MasterDataArchive 组件） */
export interface ArchiveConfig<T extends MasterDataRow = MasterDataRow> {
  /** 档案标识，对应 mock / 路由实体 key */
  archive: Api.DataManage.DataManageArchiveKey;
  /** 列配置持久化 cacheKey（useVxeTable） */
  cacheKey: string;
  /** 档案标题 i18n key（叶子字符串，如 'page.dataManage.basic.customer.title'） */
  titleI18nKey: App.I18n.I18nKey;
  /** 搜索栏配置（FormWrap items），末项通常为 { key:'actions', slot:'actions' } 的按钮区 */
  searchItems: FormItemConfig[];
  /** 业务列（status / createTime 由组件自动追加，勿在此声明） */
  columns: () => VxeColumnConfig[];
  /** 抽屉表单配置（FormWrap items） */
  formItems: FormItemConfig[];
  /** 新增时的默认模型 */
  createDefault: () => Partial<T>;
}
