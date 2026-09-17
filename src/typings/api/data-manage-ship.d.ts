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

    /** 计泡规则（mode：0-件实重之和 1-件体积重之和 2-票总重和票总体积重取大值 3-件计费重之和；calcMode：0-按公斤 1-按方，后端新增字段） */
    interface WeightRule extends ShipBaseRow {
      name: string;
      order?: number;
      mode?: number;
      calcMode?: number;
      carryList?: WeightRuleCarry[];
      /** 材积除 */
      cubicNum?: number;
      /** 计泡比率 0-100 */
      weightOff?: number;
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
  }
}
