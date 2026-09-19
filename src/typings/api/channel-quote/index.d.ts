declare namespace Api {
  namespace ChannelQuote {
    /** 渠道报价基础字段（收货 / 发货渠道共有） */
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

    /** 收货渠道 */
    interface ReceiveChannel extends ChannelQuoteRow {
      code: string;
      name: string;
    }

    /** 发货渠道 */
    interface ShipChannel extends ChannelQuoteRow {
      code: string;
      name: string;
    }
  }
}
