declare namespace Api {
  namespace NoRule {
    /** 验证位：0-无验证位 1-加权验证 2-模7验证 */
    type CheckType = 0 | 1 | 2;

    /** 系统类型（表单可选项）：0-自定义 1-运单号 2-客户编号 */
    type SysType = 0 | 1 | 2;

    /** 单号规则记录（对齐 tms-user NoRuleSchema，lib/common/models/no-rule.js） */
    interface Item {
      _id: string;
      /** 名称（必填、全局唯一） */
      name: string;
      /** 起始值 */
      start?: string;
      /** 结束值 */
      end?: string;
      /** 数字位数 */
      len?: number;
      /** 当前值 */
      current?: string;
      /** 前缀（后端保存时自动转大写） */
      prefix?: string;
      /** 后缀（后端保存时自动转大写） */
      suffix?: string;
      /** 验证位 */
      checkType?: number;
      /** 系统内置 0-否 1-是（内置记录名称不可改） */
      buildIn?: number;
      /** 系统类型 1-运单号 2-客户编号（0 / 无值 = 自定义；有值不允许删除） */
      sysType?: number;
      /** 备注 */
      note?: string;
      /** 创建人 */
      creator?: string;
      /** 最后操作人 */
      updateBy?: string;
      /** 创建时间（毫秒时间戳） */
      createDate?: number;
      /** 更新时间（毫秒时间戳） */
      updateDate?: number;
    }

    /** 列表结构：/no-rule/query 返回 ret:{ list, total } */
    interface List {
      list: Item[];
      total: number;
    }

    interface SearchParams {
      page: number;
      size: number;
      /** 附加查询条件（如按系统类型筛选 { sysType: 1 }）；scene 非空时后端会写 where.sysType，故传 scene 时必须给 where（可传 {}） */
      where?: Record<string, unknown>;
      /** 业务场景：1-收货渠道转单号（内置前置「发货渠道获取」_id=2）2-收货渠道报关号（内置前置「号码池获取」_id=1）3-发货渠道 */
      scene?: number;
    }

    /** 新建提交载荷（后端 ajv 必填 name/start/end/current/len，name 唯一） */
    interface SaveParams {
      name: string;
      start: string;
      end: string;
      current: string;
      len: number;
      prefix?: string;
      suffix?: string;
      checkType?: CheckType;
      sysType?: SysType;
      note?: string;
    }

    /** 编辑提交载荷（后端 buildIn=1 时忽略 name；改 current 会同步取号当前值） */
    interface UpdateParams extends SaveParams {
      _id: string;
    }
  }

  /** 运单号码池（data-manage/no-rule 子页，对应 /no-pool/*） */
  namespace NoPool {
    /** 关联类型：0-收货渠道 1-发货渠道 2-派送渠道 */
    type RefType = 0 | 1 | 2;

    /** 运单号码池记录（对齐 tms-user lib/common/models/no-pool.js；列表列：运单号码 / 渠道名称 / 渠道类型 / 状态 / 提取者 / 提取时间 / 录入者 / 录入时间） */
    interface Item {
      _id: string;
      /** 运单号码 */
      no: string;
      /** 收发货渠道 id（refType 决定取自 /channel 或 /channel-out） */
      refId: string;
      /** 关联类型：0-收货渠道 1-发货渠道 2-派送渠道 */
      refType: RefType;
      /** 渠道名称（后端 query 的 fillRet 回填 refName；refType 为 2 时暂不回填） */
      refName?: string;
      /** 状态：0-未提取 1-已提取 */
      status?: Api.Common.EnableStatus;
      /** 提取者 id */
      pickId?: string;
      /** 提取者名称 */
      pickBy?: string;
      /** 提取时间（毫秒时间戳） */
      pickDate?: number;
      /** 录入者 id */
      creatorId?: string;
      /** 录入者名称 */
      creator?: string;
      /** 录入时间（毫秒时间戳） */
      createDate?: number;
      /** 更新时间（毫秒时间戳） */
      updateDate?: number;
      /** 是否已被运单占用（提取 / 回收时重置为 0） */
      shipOrder?: number;
    }

    /** 列表返回结构：/no-pool/query 返回 ret:{ list, total } */
    interface List {
      list: Item[];
      total: number;
    }

    /** 导入表单模型 */
    interface ImportForm {
      /** 关联类型 */
      refType: RefType;
      /** 具体渠道 id（未选为空） */
      channel: string | null;
      /** 多行单号文本（一行一个） */
      noText: string;
    }

    /** 批量导入条目（/no-pool/batch/create 的 body.list[]） */
    interface ImportItem {
      no: string;
      refId: string;
      refType: RefType;
    }
  }
}
