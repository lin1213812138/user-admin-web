declare namespace Api {
  namespace Company {
    /** 应收总费用取整规则 0-不取整(2位小数) 1-取整(抹零) 2-取整(四舍五入) */
    type FeeTotalStrategy = 0 | 1 | 2;

    /** 公司基础配置保存入参（/company/save；后端 ajv 必填 name/sysName/address/web/logoUrl） */
    interface SaveParams {
      /** 公司名称，必填 */
      name: string;
      /** 系统名称，必填 */
      sysName: string;
      /** 公司地址，必填 */
      address: string;
      /** 公司网址，必填 */
      web: string;
      /** 默认出发地 */
      startPlace: string;
      /** 联系电话 */
      phone: string;
      /** 员工登录 */
      userWeb: string;
      /** 客户登录 */
      customerWeb: string;
      /** logo 地址，必填（/upload?dest=2 上传返回的 url） */
      logoUrl: string;
      /** 应收总费用取整规则 */
      feeTotalStrategy: FeeTotalStrategy;
      /** 重量允许为零 0-否 1-是 */
      weightCtrl: Api.Common.EnableStatus;
      /** 运费允许为负数 0-否 1-是 */
      feeTotalCtrl: Api.Common.EnableStatus;
      /** 内单号允许重复 0-否 1-是 */
      noCtrl: Api.Common.EnableStatus;
      /** 转单号允许重复 0-否 1-是 */
      channelNoCtrl: Api.Common.EnableStatus;
      /** 出库重小于入库重 0-不提示 1-提示 */
      outInWeightDiffNotify: Api.Common.EnableStatus;
      /** 出库时重量差大于多少弹出提示（KG） */
      outWeightDiffNotify: number;
      /** 退件时重量差大于多少弹出确认提示（KG） */
      returnWeightDiffNotify: number;
    }

    /**
     * 公司基础配置（后端 Company 文档，/company/get 返回）
     *
     * 数据库老文档字段可能缺省，故业务字段全部可选。
     * status/expireDate/authVersion/authModules/authApis 为授权管理字段：/company/save 会剔除
     * （只能走服务端 token 的 /admin/update），本页不展示。
     */
    interface Info extends Partial<SaveParams> {
      _id?: string;
      /** 状态 0-禁用 1-启用 */
      status?: Api.Common.EnableStatus;
      /** 到期时间（毫秒时间戳） */
      expireDate?: number;
      /** 授权版本 0-标准版 1-高级版 */
      authVersion?: number;
      /** 授权模块 */
      authModules?: number[];
      /** 授权接口 */
      authApis?: number[];
      creatorId?: string;
      creator?: string;
      /** 毫秒时间戳 */
      createDate?: number;
      updateDate?: number;
    }
  }
}
