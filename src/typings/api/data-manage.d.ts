declare namespace Api {
  namespace DataManage {
    /** 主数据行基础字段（所有档案共有） */
    interface MasterDataRow {
      id: number;
      status: Api.Common.EnableStatus;
      remark: string;
      createTime: string;
    }

    type DataManageArchiveKey =
      | 'countryRegion'
      | 'postalRoute'
      | 'fbaWarehouse'
      | 'customerLevel'
      | 'customerSource'
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
      records: T[];
      total: number;
    }

    interface ArchiveSearchParams {
      current: number;
      size: number;
      keyword?: string;
      status?: Api.Common.EnableStatus | null;
    }

    interface BasicCountryRegion extends MasterDataRow {
      code: string;
      name: string;
      phoneCode: string;
    }
    interface BasicPostalRoute extends MasterDataRow {
      code: string;
      name: string;
      country: string;
    }
    interface BasicFbaWarehouse extends MasterDataRow {
      code: string;
      name: string;
      country: string;
      address: string;
    }
    interface BasicCustomerLevel extends MasterDataRow {
      code: string;
      name: string;
      discount: number;
    }
    interface BasicCustomerSource extends MasterDataRow {
      code: string;
      name: string;
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
