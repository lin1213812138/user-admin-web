/** 运单号规则数据模型（列表 + 新建/编辑表单共用，单一类型来源） */
export interface WaybillRule {
  id: number;
  /** 编号 */
  code: string;
  /** 名称 */
  name: string;
  /** 前缀 */
  prefix: string;
  /** 后缀 */
  suffix: string;
  /** 起始值 */
  startValue: number;
  /** 结束值 */
  endValue: number;
  /** 当前值 */
  currentValue: number;
  /** 数字位数 */
  digitLength: number;
  /** 验证位：open=开启，close=关闭 */
  checkDigit: 'open' | 'close';
  /** 备注 */
  remark?: string;
  status: Api.Common.EnableStatus;
  createTime: string;
}

/** 新建/编辑提交载荷（不含服务端生成的 id / status / createTime） */
export type WaybillRuleFormPayload = Omit<WaybillRule, 'id' | 'status' | 'createTime'>;
