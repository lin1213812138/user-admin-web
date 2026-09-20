declare namespace Api {
  /** 发货资料（服务商 / 渠道类别 / 计泡规则 / 承运网络），对应 tms-user /provider、/channel-group、/weight-rule、/carrier */
  namespace DataManageShip {
    /** 通用查询参数（tms-user queryCommon 约定：page/size/keyword/where → {list,total}） */
    interface ShipQueryParams {
      page?: number;
      size?: number;
      keyword?: string;
      where?: Record<string, unknown>;
    }

    /** 通用查询返回 */
    interface ShipQueryResult<T> {
      list: T[];
      total: number;
    }

    /** 各模型公共行字段 */
    interface ShipBaseRow {
      _id: string;
      /** 创建人名称 */
      creator?: string;
      /** 修改人名称 */
      updateBy?: string;
      /** 创建时间（毫秒时间戳） */
      createDate?: number;
      /** 更新时间（毫秒时间戳） */
      updateDate?: number;
      note?: string;
    }

    /** 服务商（providerType：0-发货 1-派送 2-提单 3-杂支，本页仅管理 0/1/2） */
    interface Provider extends ShipBaseRow {
      code: string;
      name: string;
      providerType: 0 | 1 | 2 | 3;
      /** 结算方式 */
      billMode?: string;
      contact?: string;
      phone?: string;
      email?: string;
      web?: string;
      address?: string;
      balance?: number;
      /** 0-暂停 1-正常 */
      status: 0 | 1;
    }

    /** 渠道类别（后端模型无 status） */
    interface ChannelGroup extends ShipBaseRow {
      name: string;
      nameEn?: string;
      order?: number;
    }

    /** 计泡规则进位区间 */
    interface WeightRuleCarryItem {
      start?: number;
      end?: number;
      /** 计重单位 */
      unit?: number;
    }

    /** 计泡规则进位规则组 */
    interface WeightRuleCarry {
      /** 0-件实重和件体积重进位 1-件计费重进位 2-票总重和票总体积重进位 3-票计费重进位 */
      carry?: number;
      ruleList?: WeightRuleCarryItem[];
    }

    /** 计泡规则（mode：0-件实重之和 1-件体积重之和 2-票总重和票总体积重取大值 3-件计费重之和；unit：计费单位 0-公斤 1-方；weightToVolume：折方系数，unit=1 且 mode∈{0,1,2} 时必填） */
    interface WeightRule extends ShipBaseRow {
      name: string;
      order?: number;
      /** 计费单位 0-公斤 1-方 */
      unit?: number;
      mode?: number;
      carryList?: WeightRuleCarry[];
      /** 材积除 */
      cubicNum?: number;
      /** 计泡比率 0-100 */
      weightOff?: number;
      /** 折方系数（计费单位为方、计泡类型 0/1/2 时必填） */
      weightToVolume?: number;
    }

    /** 承运网络（trackConfigId 选项来自追踪网络=系统设置→轨迹抓取；remoteGroupId 数据源页面不存在，字段保留不展示） */
    interface Carrier extends ShipBaseRow {
      name: string;
      order?: number;
      weightRuleId?: string;
      trackConfigId?: string;
      remoteGroupId?: string;
      /** 燃油费率 */
      oilRate?: number;
      /** 报关费 */
      feeCustom?: number;
      cubicNum?: number;
      weightOff?: number;
    }

    /** 承运网络 → 渠道 可同步字段（Channel / ChannelOut 两个模型共有的字段） */
    type CarrierSyncField = 'oilRate' | 'feeCustom' | 'weightRuleId' | 'remoteGroupId';

    /** 承运网络同步到渠道的载荷（/carrier/sync；list 项 fields 为字段名，值取自该承运网络文档） */
    interface CarrierSyncParams {
      /** 承运网络 _id */
      _id: string;
      /** 0-收货渠道（Channel） 1-发货渠道（ChannelOut） */
      channelType: 0 | 1;
      /** 每项：渠道 _id + 需要同步过去的字段名 */
      list: { _id: string; fields: CarrierSyncField[] }[];
    }

    /** 同步弹窗渠道行（Channel / ChannelOut 归一后的最小结构；名称类字段由后端 scene=1 fillName 回填） */
    interface CarrierSyncChannel {
      _id: string;
      name: string;
      /** 燃油费率 */
      oilRate?: number | null;
      /** 报关费 */
      feeCustom?: number | null;
      /** 计泡规则 */
      weightRuleId?: string | null;
      /** 计泡规则名称（fillName 回填） */
      weightRuleName?: string;
      /** 计泡规则计泡比率（fillName 回填） */
      weightRuleWeightOff?: number;
      /** 关联偏远 */
      remoteGroupId?: string | null;
      /** 关联偏远名称（fillName 回填） */
      remoteGroup?: string;
    }
  }
}
