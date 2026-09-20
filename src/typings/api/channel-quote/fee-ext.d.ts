declare namespace Api {
  namespace ChannelQuote {
    // ---- 渠道加收（tms-user ChannelFeeExt，/channel-fee-ext/*） ----

    /** 加收类型（对齐后端 strategy）0-按重量 1-按票 2-按件 3-按重量超出部分 */
    type FeeExtStrategy = 0 | 1 | 2 | 3;

    /** 条件变量类型（对齐后端 varType）0-重量 1-长度 2-体积 */
    type FeeExtVarType = 0 | 1 | 2;

    /** 条件区间**开始**端点运算符（对齐后端 start.op）0-大于 1-大于等于 */
    type FeeExtStartOp = 0 | 1;

    /** 条件区间**结束**端点运算符（对齐后端 end.op）2-小于 3-小于等于 */
    type FeeExtEndOp = 2 | 3;

    /** 条件区间端点 */
    interface FeeExtBound {
      /** 数值 */
      value?: number;
      /** 运算符（start 用 0/1；end 用 2/3） */
      op: FeeExtStartOp | FeeExtEndOp;
    }

    /**
     * 渠道加收行（tms-user ChannelFeeExt）
     *
     * 契约要点：
     * - `name` 为普通字符串（无外键），同渠道内唯一（后端 uniqField:'name' + uniqFilter:{refId}）；
     * - `expr` 仅作展示与「无条件加收」标记，后端计费只读 `varType` + `start`/`end`（区间判断）；
     * - `countryIds` 为空数组表示「不限目的地」；
     * - query 时后端无条件 fillName 回填 `country`（国家 nameCn 以「，」拼接）。
     */
    interface ChannelFeeExt {
      _id: string;
      /** 所属渠道 */
      refId: string;
      /** 加收名称（同渠道内唯一） */
      name: string;
      /** 加收类型 */
      strategy?: FeeExtStrategy;
      /** 加收费用 */
      price?: number;
      /** 加收目的地（国家/地区 _id 数组，空 = 不限） */
      countryIds?: string[];
      /** 条件变量（「无条件加收」时不传） */
      varType?: FeeExtVarType;
      /** 条件区间开始 */
      start?: FeeExtBound;
      /** 条件区间结束 */
      end?: FeeExtBound;
      /** 条件表达式（展示用，如「重量>10」「10≤重量<20」「无条件加收」） */
      expr?: string;
      /** 单位 */
      unit?: string;
      /** 状态 0-禁用 1-启用 */
      status?: Api.Common.EnableStatus;
      /** 备注 */
      note?: string;
      /** 创建人 */
      creator?: string;
      /** 创建时间（毫秒时间戳） */
      createDate?: number;
      /** 更新时间（毫秒时间戳） */
      updateDate?: number;

      // ---- 以下为 query 时后端 fillName 回填的名称，只读 ----
      /** 加收目的地名称（国家 nameCn 以「，」拼接） */
      country?: string;
    }

    /** 渠道加收查询参数（/channel-fee-ext/query；where.refId 过滤所属渠道） */
    interface ChannelFeeExtSearchParams {
      page: number;
      size: number;
      keyword?: string;
      where?: Record<string, unknown>;
    }

    /** 渠道加收列表返回（tms-user queryCommon：{ list, total }） */
    interface ChannelFeeExtList {
      list: ChannelFeeExt[];
      total: number;
    }

    /** 新增加收入参（/channel-fee-ext/create；校验 refId（36 位）+ name，同渠道内 name 唯一） */
    interface ChannelFeeExtSaveParams {
      /** 所属渠道 */
      refId: string;
      /** 加收名称 */
      name: string;
      /** 加收类型 */
      strategy?: FeeExtStrategy;
      /** 加收费用 */
      price?: number;
      /** 加收目的地（空数组 = 不限） */
      countryIds?: string[];
      /** 条件变量（无条件加收时不传） */
      varType?: FeeExtVarType;
      start?: FeeExtBound;
      end?: FeeExtBound;
      /** 条件表达式（展示用） */
      expr?: string;
      /** 单位 */
      unit?: string;
      /** 状态 0-禁用 1-启用 */
      status?: Api.Common.EnableStatus;
      /** 备注 */
      note?: string;
    }

    /** 同步加收到渠道（/channel-fee-ext/sync；ids = 源加收，refIds = 目标渠道） */
    interface ChannelFeeExtSyncParams {
      /** 要同步的加收 _id 列表（承运网络下的加收） */
      ids: string[];
      /** 目标渠道 _id 列表（收货渠道 / 发货渠道） */
      refIds: string[];
    }
  }
}
