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
      | 'customer'
      | 'supplier'
      | 'goods'
      | 'category'
      | 'account'
      | 'currency'
      | 'tax'
      | 'settlement'
      | 'warehouse'
      | 'location'
      | 'carrier'
      | 'store';

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

    interface BasicCustomer extends MasterDataRow {
      code: string;
      name: string;
      contact: string;
      phone: string;
      address: string;
    }
    interface BasicSupplier extends MasterDataRow {
      code: string;
      name: string;
      contact: string;
      phone: string;
      level: string;
    }
    interface BasicGoods extends MasterDataRow {
      code: string;
      name: string;
      spec: string;
      unit: string;
      categoryName: string;
    }
    interface BasicCategory extends MasterDataRow {
      code: string;
      name: string;
      sort: number;
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
    interface FinanceTax extends MasterDataRow {
      name: string;
      rate: number;
      taxType: string;
    }
    interface FinanceSettlement extends MasterDataRow {
      name: string;
      period: string;
    }
    interface BusinessWarehouse extends MasterDataRow {
      code: string;
      name: string;
      address: string;
      manager: string;
    }
    interface BusinessLocation extends MasterDataRow {
      code: string;
      name: string;
      warehouseName: string;
      capacity: number;
    }
    interface BusinessCarrier extends MasterDataRow {
      code: string;
      name: string;
      contact: string;
      phone: string;
    }
    interface BusinessStore extends MasterDataRow {
      code: string;
      name: string;
      address: string;
      owner: string;
    }
  }
}
