declare namespace Api {
  namespace DataManage {
    /** 财务资料：银行账户（tms-user TradeAccount，真实接口 /trade-account/*） */
    interface FinanceTradeAccount {
      _id: string;
      /** 账户别名（必填，后端按 alias 唯一） */
      alias: string;
      /** 开户银行（必填） */
      bank: string;
      /** 开户名称 */
      name?: string;
      /** 银行账号 */
      no?: string;
      /** 账户余额（默认 0，后端经 fee2 保留 2 位） */
      balance: number;
      /** 状态 0-未启用 1-使用中 */
      status: Api.Common.EnableStatus;
      /** 系统内置 0-否 1-是（内置项不可停用，前端限停） */
      buildIn: Api.Common.EnableStatus;
      /** 备注 */
      note?: string;
      creatorId?: string;
      /** 创建人名称 */
      creator?: string;
      /** 创建时间（毫秒时间戳） */
      createDate?: number;
      /** 更新时间（毫秒时间戳） */
      updateDate?: number;
    }

    /** 银行账户列表查询参数（/trade-account/query；status 为 null 表示不过滤） */
    interface FinanceTradeAccountSearchParams {
      current: number;
      size: number;
      /** 关键字（后端 keywordFields 固定 ['alias','name']） */
      keyword?: string;
      /** 状态筛选（必须与 scene 一起传，否则后端强制 status=1） */
      status?: Api.Common.EnableStatus | null;
    }

    /** 银行账户新增/编辑入参（/trade-account/create|update，update 需 _id） */
    interface FinanceTradeAccountSaveParams {
      /** 账户别名（必填，唯一） */
      alias: string;
      /** 开户银行（必填） */
      bank: string;
      /** 开户名称 */
      name?: string;
      /** 银行账号 */
      no?: string;
      /** 账户余额（默认 0） */
      balance?: number;
      status: Api.Common.EnableStatus;
      /** 备注 */
      note?: string;
    }

    /** 银行账户列表返回（wms-user ret: { list, total }） */
    interface FinanceTradeAccountList {
      list: FinanceTradeAccount[];
      total: number;
    }

    /**
     * 财务资料：结算货币（tms-user Currency，真实接口 /currency/*）
     *
     * 与其它档案不同：无 delete 路由（只有 /currency/disable 批量停用）；
     * 查询必须传 scene，否则后端强制 where.status = 1（只能查到「已启用」的记录）；
     * code 唯一（uniqField:'code'），局部更新须随行回传 code 避免写脏字段。
     */
    interface FinanceCurrency {
      _id: string;
      /** 币种代码（必填，后端按 code 唯一） */
      code: string;
      /** 中文名称（必填） */
      name: string;
      /** 国家 _id（必填，列表用 useCountrySelect 反查中文名） */
      countryId: string;
      /** 是否本币 0-外币 1-本币（默认 0） */
      local: number;
      /** 汇率（默认 1） */
      rate: number;
      /** 状态 0-未启用 1-已启用（默认 1） */
      status: Api.Common.EnableStatus;
      creatorId?: string;
      /** 创建人名称 */
      creator?: string;
      /** 创建时间（毫秒时间戳） */
      createDate?: number;
      /** 更新时间（毫秒时间戳） */
      updateDate?: number;
      /** 列表展示用：createDate 格式化后的创建时间（前端 transform 生成） */
      createTime?: string;
    }

    /** 结算货币列表查询参数（/currency/query；status 为 null 表示不过滤） */
    interface FinanceCurrencySearchParams {
      current: number;
      size: number;
      /** 关键字（后端 keywordFields 固定 ['name','code']） */
      keyword?: string;
      /** 状态筛选（必须与 scene 一起传，否则后端强制 status=1） */
      status?: Api.Common.EnableStatus | null;
    }

    /** 结算货币新增/编辑入参（/currency/create|update，update 需 _id + 唯一 code） */
    interface FinanceCurrencySaveParams {
      /** 币种代码（必填，唯一） */
      code: string;
      /** 中文名称（必填） */
      name: string;
      /** 国家 _id（必填） */
      countryId: string;
      /** 是否本币 0-外币 1-本币（默认 0） */
      local: number;
      /** 汇率（默认 1） */
      rate: number;
      /** 状态 0-未启用 1-已启用（默认 1） */
      status: Api.Common.EnableStatus;
    }

    /** 结算货币列表返回（wms-user ret: { list, total }） */
    interface FinanceCurrencyList {
      list: FinanceCurrency[];
      total: number;
    }

    /**
     * 财务资料：费用类型（tms-user FeeType，真实接口 /fee-type/*）
     *
     * 与其它档案不同：无 code 字段、无 delete 路由（只有 /fee-type/disable 批量停用）；
     * 查询必须传 scene，否则后端强制 where.status = 1（只能查到「使用中」的记录）。
     */
    interface FinanceExpenseType {
      _id: string;
      /** 费用名称（必填，后端按 name 唯一） */
      name: string;
      /** 排序 */
      order: number;
      /** 使用范围 0-运单应收 1-运单应付 2-提单应付 3-杂支应付 4-杂支应收 */
      scope: number[];
      /** 状态 0-未启用 1-使用中 */
      status: Api.Common.EnableStatus;
      /** 系统内置 0-否 1-是（内置项不可停用，update 也只接受 scope/order/note） */
      buildIn: Api.Common.EnableStatus;
      /** 系统类型 1-基础运费 … 11-清关费（仅内置项有值，不在本页展示/编辑） */
      sysType?: number;
      /** 备注 */
      note?: string;
      creatorId?: string;
      /** 创建人名称 */
      creator?: string;
      /** 创建时间（毫秒时间戳） */
      createDate?: number;
      /** 更新时间（毫秒时间戳） */
      updateDate?: number;
      /** 列表展示用：createDate 格式化后的创建时间（前端 transform 生成） */
      createTime?: string;
    }

    /** 费用类型列表查询参数（/fee-type/query；status/scope 为 null 表示不过滤） */
    interface FinanceExpenseTypeSearchParams {
      current: number;
      size: number;
      /** 关键字（后端 keywordFields 固定 ['name']） */
      keyword?: string;
      /** 状态筛选（必须与 scene 一起传，否则后端强制 status=1） */
      status?: Api.Common.EnableStatus | null;
      /** 使用范围筛选（Mongo 数组字段精确匹配） */
      scope?: number | null;
    }

    /** 费用类型新增/编辑入参（/fee-type/create|update，update 需 _id） */
    interface FinanceExpenseTypeSaveParams {
      name: string;
      scope: number[];
      order: number;
      status: Api.Common.EnableStatus;
      note?: string;
    }

    /** 费用类型列表返回（wms-user ret: { list, total }） */
    interface FinanceExpenseTypeList {
      list: FinanceExpenseType[];
      total: number;
    }

    // 结算方式（BillMode）已改走真实接口 /bill-mode/*，类型复用 Api.SystemManage.BillModeItem
  }
}
