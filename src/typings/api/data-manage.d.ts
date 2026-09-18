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
      | 'expense-type'
      | 'settlement'
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

    interface BasicCountryRegion extends MasterDataRow {
      /** 数据库主键（字符串），列表/编辑/删除均用此字段，而非 id */
      _id: string;
      code: string;
      nameCn: string;
      nameEn?: string;
      name?: string;
      code2?: string;
      code3?: string;
      /** 后端用 createDate（时间戳），非 createTime */
      createDate: number;
    }
    interface BasicFbaWarehouse extends MasterDataRow {
      _id: string;
      code: string;
      warehouse?: string;
      name?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      countryId?: string;
      country?: string;
      createDate: number;
    }
    interface FinanceAccount extends MasterDataRow {
      code: string;
      name: string;
      accountType: string;
      bank: string;
      balance: number;
    }
    interface FinanceCurrency extends MasterDataRow {
      code: string;
      name: string;
      rate: number;
      symbol: string;
    }
    interface FinanceExpenseType extends MasterDataRow {
      code: string;
      name: string;
    }
    interface FinanceSettlement extends MasterDataRow {
      name: string;
      period: string;
    }
    interface BusinessAddress extends MasterDataRow {
      code: string;
      name: string;
    }
    interface BusinessDeclaredGoods extends MasterDataRow {
      code: string;
      name: string;
    }
    interface BusinessProblemCategory extends MasterDataRow {
      /** 类别名称（后端唯一字段，必填） */
      name: string;
      /** 详细描述 */
      desc?: string;
      /** 处理办法 */
      note?: string;
    }
    interface BusinessGoodsCategory extends MasterDataRow {
      /** 类别名称（后端唯一字段，必填） */
      name: string;
      /** 是否敏感货 0-否 1-是 */
      sensitive?: 0 | 1;
      /** 是否带电 0-否 1-是 */
      charged?: 0 | 1;
      /** 是否危险品 0-否 1-是 */
      danger?: 0 | 1;
      /** 说明 */
      note?: string;
      /** 是否默认 0-否 1-是（设 1 时后端自动清其他默认） */
      isDefault?: 0 | 1;
    }
    interface BusinessCustomsType extends MasterDataRow {
      /** 类型名称（后端唯一字段，必填） */
      name: string;
      /** 仅内部可用 0-否 1-是 */
      inner?: 0 | 1;
      /** 备注 */
      note?: string;
    }
    interface BusinessExportReason extends MasterDataRow {
      /** 名称（后端唯一字段，必填） */
      name: string;
      /** 备注 */
      note?: string;
    }
    interface BusinessClearanceMethod extends MasterDataRow {
      /** 类型名称（后端唯一字段，必填） */
      name: string;
      /** 备注 */
      note?: string;
    }
    interface BusinessSalesTerms extends MasterDataRow {
      /** 条款名称（后端唯一字段，必填） */
      name: string;
      /** 备注 */
      note?: string;
    }
  }
}
