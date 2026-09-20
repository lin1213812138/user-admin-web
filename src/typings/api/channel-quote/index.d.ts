declare namespace Api {
  namespace ChannelQuote {
    /** 渠道报价基础字段（发货渠道页 mock 骨架仍在用） */
    interface ChannelQuoteRow {
      id: number;
      status: Api.Common.EnableStatus;
      remark: string;
      createTime: string;
    }

    type ChannelQuoteArchiveKey = 'receive' | 'ship';

    interface ChannelQuoteList<T> {
      records: T[];
      total: number;
    }

    interface ChannelQuoteSearchParams {
      current: number;
      size: number;
      keyword?: string;
      status?: Api.Common.EnableStatus | null;
    }

    /**
     * 收货渠道（对齐 tms-user ChannelSchema，lib/common/models/channel.js；/channel/query 传 scene=1 时回填下列名称）
     */
    interface ReceiveChannel {
      /** 主键（字符串 uuid） */
      _id: string;
      /** 渠道代码（后端唯一；新建留空时后端按序号自动生成） */
      code?: string;
      /** 渠道名称（必填、唯一） */
      name: string;
      /** 承运网络 */
      carrierId?: string | null;
      /** 渠道类别 */
      channelGroupId?: string | null;
      /** 发货渠道（转单号规则=「发货渠道获取」时有效） */
      channelOutId?: string | null;
      /** 单号规则（scene=2：内单号规则） */
      noRuleId?: string | null;
      /** 子单号规则 */
      itemNoRuleId?: string | null;
      /** 转单号规则（scene=1；'2'=发货渠道获取） */
      channelNoRuleId?: string | null;
      /** 报关号规则（scene=2） */
      customsNoRuleId?: string | null;
      /** 标签模板（templateType=0 收货标签） */
      labelTemplateId?: string | null;
      /** 会员下单 0-关闭 1-允许 */
      customerEnable?: 0 | 1;
      /** 计泡规则 */
      weightRuleId?: string | null;
      /** 关联偏远 */
      remoteGroupId?: string | null;
      /** 燃油费率 0-100 */
      oilRate?: number | null;
      /** 报关费 */
      feeCustom?: number | null;
      /** 所属站点（多选） */
      siteIds?: string[];
      /** 承运物品类别（物品类别 _id 数组，对齐后端 Channel.productGroupIds） */
      productGroupIds?: string[];
      /** 关联路由码 */
      routeGroupId?: string | null;
      /** 渠道标签 */
      tag?: string | null;
      /** 渠道备注 */
      note?: string | null;
      /** 状态 0-停用 1-启用 */
      status?: Api.Common.EnableStatus;
      /** 创建时间（毫秒时间戳） */
      createDate?: number;
      /** 更新时间（毫秒时间戳） */
      updateDate?: number;

      // ---- 以下为 /channel/query 传 scene=1（或 /channel/get）时后端 fillName 回填的名称，只读 ----
      /** 承运网络名称 */
      carrier?: string;
      /** 渠道类别名称 */
      channelGroup?: string;
      /** 所属站点名称（多站点以「、」拼接） */
      site?: string;
      /** 内单号规则名称 */
      noRule?: string;
      /** 子单号规则名称 */
      itemNoRule?: string;
      /** 标签模板名称 */
      labelTemplate?: string;
      /** 计泡规则名称（fillContent 展开为 weightRuleName / weightRuleWeightOff） */
      weightRuleName?: string;
      /** 计泡规则计泡比率 */
      weightRuleWeightOff?: number;
      /** 关联偏远名称 */
      remoteGroup?: string;
      /** 关联路由码名称 */
      routeGroup?: string;
    }

    /** 收货渠道查询参数（/channel/query，scene 由 service 固定为 1） */
    interface ReceiveChannelSearchParams {
      page: number;
      size: number;
      keyword?: string;
      status?: number | null;
      where?: Record<string, unknown>;
    }

    /** 收货渠道列表返回（tms-user queryCommon：{ list, total }） */
    interface ReceiveChannelList {
      list: ReceiveChannel[];
      total: number;
    }

    /**
     * 收货渠道新增 / 更新载荷。
     * 更新走 uniqField:['name','code']，故必须随行回传 name + code；空值统一不传（不传空字符串）。
     */
    interface ReceiveChannelSaveParams {
      _id?: string;
      code?: string;
      name: string;
      /** 状态 0-停用 1-启用（列表启停的部分更新同样走本载荷） */
      status?: Api.Common.EnableStatus;
      carrierId?: string;
      channelGroupId?: string;
      channelOutId?: string;
      noRuleId?: string;
      itemNoRuleId?: string;
      channelNoRuleId?: string;
      customsNoRuleId?: string;
      labelTemplateId?: string;
      customerEnable?: 0 | 1;
      weightRuleId?: string;
      remoteGroupId?: string;
      oilRate?: number;
      feeCustom?: number;
      siteIds?: string[];
      productGroupIds?: string[];
      routeGroupId?: string;
      tag?: string;
      note?: string;
    }

    /** 发货渠道（占位，发货渠道页仍用 mock 骨架，未对接真实接口） */
    interface ShipChannel extends ChannelQuoteRow {
      code: string;
      name: string;
    }
  }
}
