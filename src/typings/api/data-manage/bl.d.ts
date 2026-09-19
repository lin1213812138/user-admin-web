declare namespace Api {
  /** 提单资料（航线 / 港口 / 航名航次 / 地址簿 / 柜型 / 轨迹配置），对应 tms-user /bl-route、/bl-port、/bl-trip、/bl-address、/bl-unit、/track-config */
  namespace DataManageBl {
    /** 通用查询参数（tms-user queryCommon 约定：page/size/keyword/where → {list,total}） */
    interface BlQueryParams {
      page?: number;
      size?: number;
      keyword?: string;
      where?: Record<string, unknown>;
    }

    /** 通用查询返回 */
    interface BlQueryResult<T> {
      list: T[];
      total: number;
    }

    /** 各模型公共行字段 */
    interface BlBaseRow {
      _id: string;
      status?: 0 | 1;
      note?: string;
      creator?: string;
      createDate?: number;
      updateDate?: number;
    }

    /** 航线（bl-route，routeType：0-空运 1-海运） */
    interface BlRoute extends BlBaseRow {
      code: string;
      nameCn: string;
      nameEn: string;
      routeType: 0 | 1;
      order?: number;
    }

    /** 港口（bl-port） */
    interface BlPort extends BlBaseRow {
      code: string;
      nameCn: string;
      nameEn: string;
      countryId?: string;
      region?: string;
      order?: number;
    }

    /** 航名航次（bl-trip） */
    interface BlTrip extends BlBaseRow {
      code: string;
      routeId?: string;
      startPortId?: string;
      destPortId?: string;
      shipDate?: string;
      arrivalDate?: string;
      days?: number;
    }

    /** 提单地址簿（bl-address，addressType：BY/ST/CN/SE/MF/IM/BKP/CS/LG） */
    interface BlAddress extends BlBaseRow {
      addressType: string;
      name: string;
      countryId?: string;
      country?: string;
      company?: string;
      phone?: string;
      city?: string;
      state?: string;
      zip?: string;
      email?: string;
      address?: string;
      eori?: string;
      vat?: string;
      order?: number;
    }

    /** 柜型（bl-unit） */
    interface BlUnit extends BlBaseRow {
      name: string;
      length?: number;
      width?: number;
      height?: number;
      maxCbm?: number;
      maxKg?: number;
      maxLen?: number;
      order?: number;
    }

    /** 轨迹配置（track-config） */
    interface TrackConfig extends BlBaseRow {
      name: string;
      trackType?: string;
      url?: string;
      account?: string;
      password?: string;
      key?: string;
      web?: string;
      channel?: string;
      accountNo?: string;
    }
  }
}
