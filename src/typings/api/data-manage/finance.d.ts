declare namespace Api {
  namespace DataManage {
    /** 财务资料：账户 */
    interface FinanceAccount extends MasterDataRow {
      code: string;
      name: string;
      accountType: string;
      bank: string;
      balance: number;
    }

    /** 财务资料：币种 */
    interface FinanceCurrency extends MasterDataRow {
      code: string;
      name: string;
      rate: number;
      symbol: string;
    }

    /** 财务资料：费用类型 */
    interface FinanceExpenseType extends MasterDataRow {
      code: string;
      name: string;
    }

    /** 财务资料：结算方式 */
    interface FinanceSettlement extends MasterDataRow {
      name: string;
      period: string;
    }
  }
}
