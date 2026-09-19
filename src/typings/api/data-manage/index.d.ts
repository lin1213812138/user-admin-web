declare namespace Api {
  namespace DataManage {
    /** 主数据行基础字段（所有档案共有） */
    interface MasterDataRow {
      /** 数据库主键（mongo _id 字符串），列表/编辑/删除均用此字段 */
      _id: string;
      status: Api.Common.EnableStatus;
      remark: string;
      /** 后端返回 createDate（时间戳），前端统一映射为 createTime 展示 */
      createTime?: string;
      createDate?: number;
    }

    type DataManageArchiveKey =
      | 'countryRegion'
      | 'fbaWarehouse'
      | 'account'
      | 'currency'
      | 'address'
      | 'declaredGoods'
      | 'problemCategory'
      | 'goodsCategory'
      | 'customsType'
      | 'exportReason'
      | 'clearanceMethod'
      | 'salesTerms';

    interface ArchiveList<T> {
      list: T[];
      total: number;
    }

    interface ArchiveSearchParams {
      current: number;
      size: number;
      keyword?: string;
      status?: Api.Common.EnableStatus | null;
    }
  }
}
