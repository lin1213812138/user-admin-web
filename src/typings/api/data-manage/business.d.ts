declare namespace Api {
  namespace DataManage {
    /** 业务资料：地址簿 */
    interface BusinessAddress extends MasterDataRow {
      code: string;
      name: string;
    }

    /** 业务资料：申报物品 */
    interface BusinessDeclaredGoods extends MasterDataRow {
      code: string;
      name: string;
    }

    /** 业务资料：问题类别 */
    interface BusinessProblemCategory extends MasterDataRow {
      /** 类别名称（后端唯一字段，必填） */
      name: string;
      /** 详细描述 */
      desc?: string;
      /** 处理办法 */
      note?: string;
    }
    /**
     * 问题类别搜索栏状态（reactive searchParams 的显式类型）。
     * 用命名类型替代 Record<string, unknown>：避免 v-model 把字段推断成 unknown 导致 NInput 等组件类型报错；
     * 后续新增筛选字段直接在此追加即可，页面无需改动取数/重置逻辑。
     */
    type ProblemGroupSearchParams = {
      /** 关键字（后端 keywordFields 固定 ['name']） */
      keyword: string;
    };

    /** 业务资料：物品类别 */
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

    /** 业务资料：报关类型 */
    interface BusinessCustomsType extends MasterDataRow {
      /** 类型名称（后端唯一字段，必填） */
      name: string;
      /** 仅内部可用 0-否 1-是 */
      inner?: 0 | 1;
      /** 备注 */
      note?: string;
    }

    /** 业务资料：出口原因 */
    interface BusinessExportReason extends MasterDataRow {
      /** 名称（后端唯一字段，必填） */
      name: string;
      /** 备注 */
      note?: string;
    }

    /** 业务资料：清关方式 */
    interface BusinessClearanceMethod extends MasterDataRow {
      /** 类型名称（后端唯一字段，必填） */
      name: string;
      /** 备注 */
      note?: string;
    }

    /** 业务资料：销售条款 */
    interface BusinessSalesTerms extends MasterDataRow {
      /** 条款名称（后端唯一字段，必填） */
      name: string;
      /** 备注 */
      note?: string;
    }
  }
}
