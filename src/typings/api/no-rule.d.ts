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
      /** 附加查询条件（如按系统类型筛选 { sysType: 1 }） */
      where?: Record<string, unknown>;
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
}
