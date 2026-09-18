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
      code: string;
      name: string;
    }
    interface BusinessGoodsCategory extends MasterDataRow {
      code: string;
      name: string;
    }
    interface BusinessCustomsType extends MasterDataRow {
      code: string;
      name: string;
    }
    interface BusinessExportReason extends MasterDataRow {
      code: string;
      name: string;
    }
    interface BusinessClearanceMethod extends MasterDataRow {
      code: string;
      name: string;
    }
    interface BusinessSalesTerms extends MasterDataRow {
      code: string;
      name: string;
    }
  }
}
