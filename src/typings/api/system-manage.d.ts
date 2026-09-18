declare namespace Api {
  /**
   * namespace SystemManage
   *
   * backend api module: "system manage"
   */
  namespace SystemManage {
    /** 用户性别：0-未知 1-男 2-女 */
    type UserSex = 0 | 1 | 2;

    /** 账号类型：0-用户 1-管理员 */
    type UserAccountType = 0 | 1;

    /** 用户（tms-user 真实实体，接口 /user/*；hashedPassword/salt 等后端域字段前端不使用） */
    interface User {
      /** 主键（MongoId 字符串） */
      _id: string;
      /** 用户账号，唯一，登录用 */
      account: string;
      /** 大写账号（后端按 account 自动生成，仅查询返回） */
      upperAccount?: string;
      /** 用户名称，唯一 */
      name: string;
      /** 所属站点 id（MongoId 字符串） */
      siteId: string;
      /** 用户角色 id 列表 */
      roleIds?: string[];
      /** 所属组别 id 列表 */
      groupIds?: string[];
      /** 姓名 */
      fullName?: string;
      /** 性别 0-未知 1-男 2-女 */
      sex?: Api.SystemManage.UserSex;
      /** 出生日期（毫秒时间戳） */
      birthday?: number;
      /** 身份证（后端为 Number，18 位长号码有精度损失） */
      idCard?: number;
      /** 家庭住址 */
      address?: string;
      /** 联系电话 */
      phone?: string;
      /** 邮箱 */
      email?: string;
      /** 微信 */
      wx?: string;
      /** 其他联系方式 */
      contact?: string;
      /** 职位 */
      job?: string;
      /** 入职时间（毫秒时间戳） */
      entryDate?: number;
      /** 微信二维码（URL） */
      qrCodeUrl?: string;
      /** 附件（文件名） */
      file?: string;
      /** 附件地址 */
      fileUrl?: string;
      /** 备注 */
      note?: string;
      /** 是否启用 0-否 1-是 */
      status: Api.Common.EnableStatus;
      /** 账号类型 0-用户 1-管理员 */
      accountType?: Api.SystemManage.UserAccountType;
      /** 所属站点名称（后端 fillName 回填） */
      site?: string;
      /** 所属组别名称（后端 fillName 回填，多个用「、」分隔） */
      group?: string;
      /** 用户角色名称（后端 fillName 回填，多个用「、」分隔） */
      role?: string;
      creatorId?: string;
      creator?: string;
      updateId?: string;
      updateBy?: string;
      /** 创建时间（毫秒时间戳） */
      createDate: number;
      /** 更新时间（毫秒时间戳） */
      updateDate: number;
    }

    /** user list（/user/query 返回 ret：{ list, total }） */
    type UserList = {
      list: User[];
      total: number;
    };

    /** user search params（/user/query，keyword 固定匹配 name/fullName/account） */
    type UserSearchParams = {
      page: number;
      size: number;
      keyword?: string;
      keywordFields?: string[];
      /** 其他查询条件（站点 / 角色 / 组别 / 状态精确过滤；roleIds、groupIds 走 MongoDB 数组成员匹配） */
      where?: {
        siteId?: string;
        roleIds?: string;
        groupIds?: string;
        status?: Api.Common.EnableStatus;
      };
    };

    /** user create params（/user/create，后端必填 account/password/siteId，account + name 唯一） */
    type UserCreateParams = {
      account: string;
      name: string;
      password: string;
      siteId: string;
      roleIds?: string[];
      groupIds?: string[];
      fullName?: string;
      sex?: Api.SystemManage.UserSex;
      birthday?: number;
      idCard?: number;
      address?: string;
      phone?: string;
      email?: string;
      wx?: string;
      contact?: string;
      job?: string;
      entryDate?: number;
      qrCodeUrl?: string;
      file?: string;
      fileUrl?: string;
      note?: string;
      status?: Api.Common.EnableStatus;
    };

    /** user update params（/user/update，password 缺省则不改密码；改自己密码后端会强制重新登录） */
    type UserUpdateParams = Omit<UserCreateParams, 'password'> & {
      _id: string;
      password?: string;
    };

    /** user self update params（个人中心 /user/update：仅提交可编辑字段，account/siteId/status/roleIds/groupIds 不可改） */
    type UserSelfUpdateParams = Pick<
      UserCreateParams,
      | 'name'
      | 'fullName'
      | 'sex'
      | 'birthday'
      | 'idCard'
      | 'address'
      | 'phone'
      | 'email'
      | 'wx'
      | 'contact'
      | 'job'
      | 'entryDate'
      | 'qrCodeUrl'
      | 'file'
      | 'fileUrl'
      | 'note'
    > & {
      _id: string;
    };

    /** 角色类型 0-客服 1-销售 2-操作 3-财务 4-经理 5-管理员 */
    type RoleType = 0 | 1 | 2 | 3 | 4 | 5;

    /** 角色数据权限 0-仅查看专属客户业务 1-仅查看所属组别客户业务 */
    type RoleDataAuth = 0 | 1;

    /** 角色开关类控制值 0-不允许/不启用 1-允许/启用 */
    type RoleCtrl = 0 | 1;

    /** 角色（tms-user 真实实体，字段名以后端 Role Schema 为准） */
    interface Role {
      /** 主键（MongoId 字符串） */
      _id: string;
      /** 角色名称，全局唯一 */
      name: string;
      /** 角色类型 */
      roleType?: Api.SystemManage.RoleType;
      /** 系统内置 0-否 1-是（内置角色不允许修改和删除） */
      buildIn?: Api.SystemManage.RoleCtrl;
      /** 角色描述 */
      desc?: string;
      /** 操作权限码 */
      auths?: string[];
      /** 权限套用（被套用角色的 MongoId） */
      refId?: string;
      /** 数据权限 */
      dataAuths?: Api.SystemManage.RoleDataAuth[];
      /** 可见的录单格式 id */
      orderTemplateIds?: string[];
      /** 出库后允许修改运单 0-不允许 1-允许 */
      sendOrderCtrl?: Api.SystemManage.RoleCtrl;
      /** 出库必须称重 0-不启用 1-启用 */
      sendCtrl?: Api.SystemManage.RoleCtrl;
      /** 允许设置运单列表字段 0-不允许 1-允许 */
      orderColCtrl?: Api.SystemManage.RoleCtrl;
      /** 允许修改个人信息 0-不允许 1-允许 */
      editInfoCtrl?: Api.SystemManage.RoleCtrl;
      /** 排序 */
      order?: number;
      creatorId?: string;
      /** 创建人名称 */
      creator?: string;
      updateId?: string;
      /** 编辑人名称 */
      updateBy?: string;
      /** 创建时间（毫秒时间戳） */
      createDate: number;
      /** 更新时间（毫秒时间戳） */
      updateDate: number;
    }

    /** 角色列表（/role/query 为 queryAllCommon 全量查询，无分页） */
    type RoleList = {
      list: Role[];
      total?: number;
    };

    /** 角色查询参数（keyword 对 keywordFields 正则模糊匹配，其余走 where 精确过滤） */
    type RoleSearchParams = {
      where?: {
        name?: string;
        roleType?: Api.SystemManage.RoleType;
      };
      keyword?: string;
      keywordFields?: string[];
    };

    /** 角色新增参数（审计字段由后端按登录用户填充；传 refId 时后端复制被套用角色的 auths） */
    type RoleCreateParams = {
      name: string;
      roleType?: Api.SystemManage.RoleType;
      desc?: string;
      refId?: string;
      dataAuths?: Api.SystemManage.RoleDataAuth[];
      orderTemplateIds?: string[];
      sendOrderCtrl?: Api.SystemManage.RoleCtrl;
      sendCtrl?: Api.SystemManage.RoleCtrl;
      orderColCtrl?: Api.SystemManage.RoleCtrl;
      editInfoCtrl?: Api.SystemManage.RoleCtrl;
      order?: number;
    };

    /** 角色更新参数 */
    type RoleUpdateParams = RoleCreateParams & {
      _id: string;
    };

    /** 角色查询项（与 Role 同构，保留别名兼容用户管理等模块） */
    type RoleQueryItem = Role;

    /** 角色查询列表（与 RoleList 同构） */
    type RoleQueryList = RoleList;

    /** 站点类型：0-分公司 1-总公司 */
    type SiteType = 0 | 1;

    /** 站点（wms-user 真实实体，字段名以后端 Schema 为准；联系人类字段可能缺省） */
    interface Site {
      /** 主键（字符串 uuid） */
      _id: string;
      /** 站点编号，唯一 */
      code: string;
      /** 站点名称 */
      name: string;
      /** 联系人（后端字段名为 concat） */
      concat?: string;
      /** 联系电话 */
      phone?: string;
      /** 工作时间，如「周一至周六 9:00-20:00」 */
      workTime?: string;
      /** 默认出发地 */
      startPlace?: string;
      /** 仓库地址 */
      address?: string;
      /** 站点备注 */
      note?: string;
      /** 站点类型 */
      siteType: Api.SystemManage.SiteType;
      /** 创建人 id */
      creatorId?: string;
      /** 创建人名称 */
      creator?: string;
      /** 修改人 id */
      updateId?: string;
      /** 修改人名称 */
      updateBy?: string;
      /** 创建时间（毫秒时间戳） */
      createDate: number;
      /** 更新时间（毫秒时间戳） */
      updateDate: number;
    }

    /** 站点列表（wms-user 返回 ret：{ list, total }） */
    type SiteList = {
      list: Site[];
      total: number;
    };

    /** 站点查询参数（/site/query） */
    type SiteSearchParams = {
      page: number;
      size: number;
      /** 关键字，按 code/name 模糊查询 */
      keyword?: string;
      /** 关键字匹配字段，缺省时后端按 code + name 查 */
      fields?: string[];
      /** 其他查询条件 */
      where?: Record<string, unknown>;
    };

    /** 站点新增参数 */
    type SiteCreateParams = {
      code: string;
      name: string;
      concat: string;
      phone: string;
      workTime: string;
      startPlace: string;
      address: string;
      note: string;
      siteType: Api.SystemManage.SiteType;
    };

    /** 站点更新参数 */
    type SiteUpdateParams = SiteCreateParams & {
      _id: string;
    };

    /** 站点关联客户（tms-user Customer 实体，/customer/query 返回；仅声明本功能使用字段） */
    interface SiteCustomer {
      /** 主键（MongoId 字符串） */
      _id: string;
      /** 客户编码，唯一 */
      code: string;
      /** 客户名称 */
      name: string;
      /** 网站账号 */
      account?: string;
      /** 所属站点 id */
      siteId?: string;
      /** 所属站点名称（后端冗余字段） */
      site?: string;
      /** 是否启用 0-否 1-是 */
      status: Api.Common.EnableStatus;
      /** 创建时间（毫秒时间戳） */
      createDate: number;
      /** 更新时间（毫秒时间戳） */
      updateDate: number;
    }

    /** 站点关联客户列表（/customer/query 返回 ret：{ list, total }） */
    type SiteCustomerList = {
      list: SiteCustomer[];
      total: number;
    };

    /** 操作端（tms-user OpLog.client） */
    type OpLogClient = 0 | 1 | 2 | 3; // 0-TMS 1-PC 2-PDA 3-OMS

    /** 操作类型（tms-user OpLog.opType） */
    type OpLogOpType = 0 | 1 | 2 | 3 | 4; // 0-登录 1-修改 2-删除 3-退出 4-追踪

    /** 操作日志变更明细（OpLog.logs 项） */
    interface OpLogDetail {
      /** 变更项名称，如「修改联系人」 */
      name: string;
      /** 旧值 */
      oldValue: string;
      /** 新值 */
      newValue: string;
      /** 旧值关联实体 id（值为关联实体时存在） */
      oldId?: string;
      /** 新值关联实体 id */
      newId?: string;
      /** 说明 */
      desc?: string;
    }

    /** 操作日志（tms-user 真实实体，POST /op-log/query） */
    interface OpLog {
      /** 主键 */
      _id: string;
      /** 操作名称（服务端拼好，如「登录系统」「修改用户」） */
      name: string;
      /** 关联实体 id 列表 */
      refIds?: string[];
      /** 关联实体名称列表 */
      refNames?: string[];
      /** 操作端 */
      client?: Api.SystemManage.OpLogClient;
      /** 操作类型 */
      opType?: Api.SystemManage.OpLogOpType;
      /** 变更明细 */
      logs?: Api.SystemManage.OpLogDetail[];
      /** 操作 IP */
      ip?: string;
      /** 日志摘要 */
      desc?: string;
      /** 操作人 id */
      creatorId?: string;
      /** 操作人名称 */
      creator?: string;
      /** 操作时间（毫秒时间戳） */
      createDate: number;
    }

    /** 操作日志列表（wms-user 返回 ret：{ list, total }） */
    type OpLogList = {
      list: OpLog[];
      total: number;
    };

    /** 操作日志查询参数（/op-log/query，keyword 只模糊匹配 refNames，时间按 createDate 毫秒时间戳过滤） */
    type OpLogSearchParams = {
      page: number;
      size: number;
      /** 关键字（后端 keywordFields 固定为 refNames） */
      keyword?: string;
      /** 开始时间（毫秒时间戳，缺省后端默认近 12 个月） */
      startDate?: number;
      /** 结束时间（毫秒时间戳） */
      endDate?: number;
      /** 其他查询条件（opType / client 精确匹配） */
      where?: {
        opType?: Api.SystemManage.OpLogOpType;
        client?: Api.SystemManage.OpLogClient;
      };
    };

    /** 组别（tms-user Group，后端接口 /group/*） */
    interface Group {
      /** MongoId 字符串 */
      _id: string;
      /** 组别名称，全局唯一 */
      name: string;
      /** 组别备注 */
      desc?: string;
      /** 所属站点 id（MongoId 字符串） */
      siteId: string;
      /** 所属站点名称（后端 fillName 回填） */
      site?: string;
      /** 创建人名称 */
      creator?: string;
      /** 创建时间（毫秒时间戳） */
      createDate: number;
      /** 编辑人名称 */
      updateBy?: string;
      /** 更新时间（毫秒时间戳） */
      updateDate: number;
      /** 组内用户数（仅 /group/get 返回） */
      userCount?: number;
      /** 组内客户数（仅 /group/get 返回） */
      customerCount?: number;
    }

    /** 组别列表（/group/query 为 queryAllCommon 全量查询，无分页） */
    type GroupList = {
      list: Group[];
      total?: number;
    };

    /** 组别查询参数（keyword 对 name 正则模糊匹配） */
    type GroupSearchParams = {
      where?: {
        name?: string;
        siteId?: string;
      };
      keyword?: string;
      keywordFields?: string[];
    };

    /** 组别新增参数（审计字段由后端按登录用户填充） */
    type GroupCreateParams = {
      name: string;
      siteId: string;
      desc?: string;
    };

    /** 组别更新参数 */
    type GroupUpdateParams = GroupCreateParams & {
      _id: string;
    };

    /** 客户扣货方式 0-不扣货 1-信用额度 2-结算周期 3-信用额度+结算周期 */
    type CustomerWithhold = 0 | 1 | 2 | 3;

    /** 账单生成方式 0-手工生成 1-按账单结算周期 */
    type CustomerBillGenMode = 0 | 1;

    /** 客户（tms-user Customer 实体，/customer/* 接口；hashedPassword/salt/appToken 等后端域字段前端不使用） */
    interface Customer {
      /** 主键（MongoId 字符串） */
      _id: string;
      /** 客户编码，唯一，不传由后端按单号规则生成 */
      code: string;
      /** 客户名称，必填，唯一 */
      name: string;
      /** 网站账号，必填，唯一 */
      account: string;
      /** 联系人 */
      contact?: string;
      /** 电话 */
      mobile?: string;
      /** 邮箱 */
      email?: string;
      /** 地址 */
      address?: string;
      /** 微信 */
      wx?: string;
      /** QQ */
      qq?: string;
      /** 标签 */
      tag?: string;
      /** 开票信息 */
      taxInfo?: string;
      /** 备注 */
      note?: string;
      /** 状态 0-停用 1-启用 */
      status: Api.Common.EnableStatus;
      /** 网站状态（网站下单开通状态） 0-停用 1-启用 */
      webStatus?: Api.Common.EnableStatus;
      /** API状态（API下单开通状态） 0-停用 1-启用 */
      apiStatus?: Api.Common.EnableStatus;
      /** API下单授权 id（详情页 API配置 tab 展示/复制） */
      appToken?: string;
      /** API下单授权秘钥 */
      appKey?: string;
      /** 扣货方式 */
      withhold?: Api.SystemManage.CustomerWithhold;
      /** 信用额度（最大发货额度） */
      creditLimit?: number;
      /** 结算对接人 */
      billPerson?: string;
      /** 合同开始日期（毫秒时间戳） */
      contractStartDate?: number;
      /** 合同结束日期（毫秒时间戳） */
      contractEndDate?: number;
      /** 结算方式 id */
      billModeId?: string;
      /** 结算方式名称（后端 fillName 回填） */
      billMode?: string;
      /** 账单生成方式 */
      billGenMode?: Api.SystemManage.CustomerBillGenMode;
      /** 客户来源 id */
      sourceId?: string;
      /** 客户来源名称（后端 fillName 回填） */
      source?: string;
      /** 客户等级 id */
      levelId?: string;
      /** 客户等级名称（后端 fillName 回填） */
      level?: string;
      /** 专属销售 id */
      salesmanId?: string;
      /** 专属销售名称 */
      salesman?: string;
      /** 专属客服 id */
      serviceId?: string;
      /** 专属客服名称 */
      service?: string;
      /** 专属财务 id */
      cashierId?: string;
      /** 专属财务名称 */
      cashier?: string;
      /** 专属取件 id */
      pickerId?: string;
      /** 专属取件名称 */
      picker?: string;
      /** 所属站点 id */
      siteId?: string;
      /** 所属站点名称 */
      site?: string;
      /** 所属组别 id */
      groupId?: string;
      /** 所属组别名称 */
      group?: string;
      /** 余额 */
      balance?: number;
      /** 欠款金额 */
      oweAmount?: number;
      creatorId?: string;
      creator?: string;
      /** 创建时间（毫秒时间戳） */
      createDate: number;
      /** 更新时间（毫秒时间戳） */
      updateDate: number;
    }

    /** 客户列表（/customer/query 返回 ret：{ list, total }） */
    type CustomerList = {
      list: Customer[];
      total: number;
    };

    /** 客户查询参数（/customer/query，scene=1 管理列表含停用；keyword 匹配 code/name/account） */
    type CustomerSearchParams = {
      page: number;
      size: number;
      /** 1-管理列表（不强制 status=1） */
      scene?: number;
      /** 关键字，按 code/name/account 模糊查询 */
      keyword?: string;
      /** 其他查询条件（精确过滤） */
      where?: {
        levelId?: string;
        sourceId?: string;
        siteId?: string;
        status?: Api.Common.EnableStatus;
      };
      sort?: Record<string, 1 | -1>;
    };

    /** 客户新增参数（/customer/create，code 不传后端自动生成；name/account 唯一） */
    type CustomerCreateParams = {
      code?: string;
      name: string;
      account: string;
      contact?: string;
      mobile?: string;
      email?: string;
      address?: string;
      wx?: string;
      qq?: string;
      tag?: string;
      taxInfo?: string;
      note?: string;
      status?: Api.Common.EnableStatus;
      /** 网站状态（网站下单开通状态，详情页 API配置 tab 可改） */
      webStatus?: Api.Common.EnableStatus;
      /** API状态（API下单开通状态，详情页 API配置 tab 可改） */
      apiStatus?: Api.Common.EnableStatus;
      withhold?: Api.SystemManage.CustomerWithhold;
      creditLimit?: number;
      billPerson?: string;
      contractStartDate?: number;
      contractEndDate?: number;
      billModeId?: string;
      billGenMode?: Api.SystemManage.CustomerBillGenMode;
      sourceId?: string;
      levelId?: string;
      siteId?: string;
      groupId?: string;
      salesmanId?: string;
      serviceId?: string;
      cashierId?: string;
      pickerId?: string;
    };

    /** 客户更新参数（/customer/update） */
    type CustomerUpdateParams = CustomerCreateParams & {
      _id: string;
    };

    /** 客户等级字典（/customer-level/query） */
    interface CustomerLevelItem {
      _id: string;
      /** 等级名称 */
      name: string;
      /** 等级序号 */
      num?: number;
      /** 状态 0-未启用 1-已启用 */
      status?: Api.Common.EnableStatus;
      createDate?: number;
      updateDate?: number;
    }

    /** 客户等级字典列表 */
    type CustomerLevelList = {
      list: CustomerLevelItem[];
      total: number;
    };

    /** 客户来源字典（/customer-source/query） */
    interface CustomerSourceItem {
      _id: string;
      /** 来源名称 */
      name: string;
      /** 排序 */
      order?: number;
      /** 状态 0-禁用 1-启用 */
      status?: Api.Common.EnableStatus;
      createDate?: number;
      updateDate?: number;
    }

    /** 客户来源字典列表 */
    type CustomerSourceList = {
      list: CustomerSourceItem[];
      total: number;
    };

    /** 结算方式字典（/bill-mode/query） */
    interface BillModeItem {
      _id: string;
      /** 结算名称 */
      name: string;
      /** 系统类型 1-天结 2-周结 3-月结 4-签收结 5-现结 6-到付 */
      sysType?: number;
      /** 结算周期 0-每天 1-每周 2-每月 */
      billPeriod?: number;
      /** 结算日期 每天-0-23 每周-1-7 每月-1-28（-1 为最后一天） */
      billDay?: number;
      /** 关联运单状态 0-已预报 1-已收货 2-已出库 3-转运中 4-已送达 */
      billGenStatus?: number[];
      /** 是否内置 0-否 1-是 */
      buildIn?: number;
      /** 状态 0-未启用 1-使用中 */
      status?: Api.Common.EnableStatus;
      createDate?: number;
      updateDate?: number;
    }

    /** 结算方式字典列表 */
    type BillModeList = {
      list: BillModeItem[];
      total: number;
    };

    /** 客户地址（tms-user ShipTo/Shipper 共有结构，/ship-to/*、/shipper/*；发件侧仅字段注释不同） */
    interface CustomerAddress {
      /** 主键（MongoId 字符串） */
      _id: string;
      /** 所属客户 id */
      customerId: string;
      /** 客户名称（后端 fillName 回填） */
      customer?: string;
      /** 目的地 id */
      countryId?: string;
      /** 目的地名称（后端 fillCountry 回填） */
      country?: string;
      /** 收(发)件人 */
      name?: string;
      /** 收(发)件公司 */
      company?: string;
      /** 收(发)件电话 */
      phone?: string;
      /** 收(发)件手机 */
      mobile?: string;
      /** 收(发)件邮箱 */
      email?: string;
      /** 地址 */
      address?: string;
      /** 地址2 */
      address2?: string;
      /** 地址3 */
      address3?: string;
      /** 省州 */
      state?: string;
      /** 城市 */
      city?: string;
      /** 邮编 */
      zip?: string;
      /** 税号 */
      taxNo?: string;
      /** FBA仓库代码（收件地址特有） */
      fbaCode?: string;
      /** 证照1（证件照正面） */
      imgUrl1?: string;
      /** 证照2（证件照反面） */
      imgUrl2?: string;
      /** 地址标签 */
      tag?: string;
      /** 是否默认 0-否 1-是 */
      isDefault?: Api.Common.EnableStatus;
      createDate?: number;
      updateDate?: number;
    }

    /** 客户地址列表（/ship-to/query、/shipper/query 返回 ret：{ list, total }） */
    type CustomerAddressList = {
      list: CustomerAddress[];
      total: number;
    };

    /** 客户地址查询参数（queryCommon；keyword 必须由前端显式传 keywordFields 才生效） */
    type CustomerAddressSearchParams = {
      page: number;
      size: number;
      /** 关键字（配合 keywordFields 匹配 name/phone/zip） */
      keyword?: string;
      /** keyword 匹配字段 */
      keywordFields?: string[];
      where?: {
        customerId?: string;
      };
      sort?: Record<string, 1 | -1>;
    };

    /** 客户地址新增/编辑参数（/ship-to/create|update、/shipper/create|update；customerId 必填） */
    type CustomerAddressSaveParams = {
      _id?: string;
      customerId: string;
      countryId?: string;
      /** 国家名称（老系统「收/发件国家」可手输，选目的地自动带出） */
      country?: string;
      name?: string;
      company?: string;
      phone?: string;
      mobile?: string;
      email?: string;
      address?: string;
      address2?: string;
      address3?: string;
      state?: string;
      city?: string;
      zip?: string;
      taxNo?: string;
      fbaCode?: string;
      tag?: string;
      isDefault?: Api.Common.EnableStatus;
      /** 证照1（证件照正面） */
      imgUrl1?: string;
      /** 证照2（证件照反面） */
      imgUrl2?: string;
    };

    /** 客户附件（tms-user File 模型，refId 关联客户 _id，/file/*） */
    interface CustomerFileItem {
      /** 主键 */
      _id: string;
      /** 文件名称 */
      name?: string;
      /** 关联 id（客户 _id） */
      refId?: string;
      /** 文件访问地址 */
      url?: string;
      /** 大小（字节） */
      size?: number;
      /** 上传人 */
      creator?: string;
      /** 上传时间（毫秒时间戳） */
      createDate?: number;
    }

    /** 客户附件列表（/file/query 走 queryAllCommon，仅返回 { list } 无 total） */
    type CustomerFileList = {
      list: CustomerFileItem[];
    };

    /** 国家地区（/country/query，客户地址目的地下拉用） */
    interface CountryItem {
      _id: string;
      /** 国家编码 */
      code?: string;
      /** 中文名称 */
      nameCn?: string;
      /** 英文名称 */
      nameEn?: string;
      /** 常用名称 */
      name?: string;
      /** 二字码 */
      code2?: string;
      /** 三字码 */
      code3?: string;
    }

    /** 国家地区列表 */
    type CountryList = {
      list: CountryItem[];
      total: number;
    };

    /** 轨迹抓取 - 前 4 个同构子 tab 分类 */
    type TraceCaptureCategory = 'track-network' | 'track-transform' | 'track-keyword' | 'capture-time';

    /** 追踪网络（系统设置 → 轨迹抓取 → 追踪网络，对应 tms-user /track-config/*，模型：轨迹抓取配置） */
    interface TraceConfigItem {
      _id: string;
      /** 网络名称（后端唯一） */
      name: string;
      /** 系统类型：ups-UPS fedex-FedEx kdzs-快递助手 sd-速递 hl-华磊 k5-K5 kjv5-跨境v5 nm-钮门 ry-睿云 ydd-易抵达 xzh-新智慧 t6-T6 zgyz-中国邮政 track17-17track */
      trackType?: string;
      /** 地址 */
      url?: string;
      /** 账号 */
      account?: string;
      /** 密码 */
      password?: string;
      /** 秘钥 */
      key?: string;
      /** 网址 */
      web?: string;
      /** 渠道名称 */
      channel?: string;
      /** 账户号码 */
      accountNo?: string;
      /** 创建人名称 */
      creator?: string;
      /** 修改人名称 */
      updateBy?: string;
      /** 创建时间（毫秒时间戳） */
      createDate?: number;
      /** 更新时间（毫秒时间戳） */
      updateDate?: number;
    }

    /** 追踪网络查询参数（tms-user queryCommon 契约，keyword 按 name 模糊匹配） */
    type TraceConfigSearchParams = {
      page?: number;
      size?: number;
      keyword?: string;
    };

    /** 追踪网络查询返回 */
    type TraceConfigList = {
      list: TraceConfigItem[];
      total: number;
    };

    type TraceConfigCreateParams = Partial<Omit<TraceConfigItem, '_id' | 'creator' | 'createDate'>> & {
      name: string;
    };

    type TraceConfigUpdateParams = TraceConfigCreateParams & { _id: string };

    /** 轨迹信息改造规则（track-replace 模型，按 configId 归属某个追踪网络；oriStr/replaceStr 均可空，保存时过滤空行） */
    interface TraceReplaceItem {
      /** 已有规则有；新增空行无 */
      _id?: string;
      /** 原始字符串 */
      oriStr?: string;
      /** 替换字符串（可空=删除原串） */
      replaceStr?: string;
      /** 创建人（来自后端，只读展示） */
      creator?: string;
    }

    /** 改造规则查询返回（/track-replace/query 全量返回，size 拉满） */
    type TraceReplaceList = { list: Api.SystemManage.TraceReplaceItem[] };

    /** 批量保存入参（与后端 /track-replace/batch/save 对齐） */
    type TraceReplaceBatchSaveParams = {
      /** 所属追踪网络 _id */
      configId: string;
      /** 规则列表（无 _id=新增，带 _id=更新；本地删除即从数组移除，后端按 _id 差集删除） */
      list: Api.SystemManage.TraceReplaceItem[];
    };

    /** 异常轨迹（track-err-config）- 时间格式 0-年月日 1-年月日时分 2-年月日时分秒 */
    type TraceTransformTimeType = 0 | 1 | 2;

    /** 异常轨迹 - 异常状态定义（按关键词判断映射的标准化轨迹状态） */
    interface TraceTransformItem {
      /** 主键 */
      _id: string;
      /** 状态名称 */
      name: string;
      /** 时间格式 */
      timeType: Api.SystemManage.TraceTransformTimeType;
      /** 服务地点 */
      place?: string;
      /** 详细描述 */
      desc?: string;
      /** 抓取轨迹关键词判断定义 */
      detectDesc?: string;
      /** 创建人 */
      creator?: string;
      /** 最后编辑 */
      updateBy?: string;
      /** 创建时间（毫秒时间戳） */
      createDate?: number;
      /** 更新时间（毫秒时间戳） */
      updateDate?: number;
    }

    /** 异常轨迹列表（/track-err-config/query 全量返回，无 total） */
    interface TraceTransformList {
      list: Api.SystemManage.TraceTransformItem[];
    }

    /** 异常轨迹新增参数 */
    type TraceTransformCreateParams = Pick<
      Api.SystemManage.TraceTransformItem,
      'name' | 'timeType' | 'place' | 'desc' | 'detectDesc'
    >;

    type TraceTransformUpdateParams = Api.SystemManage.TraceTransformCreateParams & { _id: string };

    /** 轨迹关键词 - 运单状态 50-转运中 60-已送达 70-异常件 80-已退件 */
    type TraceKeywordOrderStatus = 50 | 60 | 70 | 80;

    /** 轨迹关键词 - 匹配规则（命中关键词时把运单状态置为指定值） */
    interface TraceKeywordItem {
      /** 主键 */
      _id: string;
      /** 规则名称 */
      name: string;
      /** 全局通用 0-否 1-是 */
      common: Api.Common.EnableStatus;
      /** 关联追踪网络（track-config 的 _id 集合） */
      configIds: string[];
      /** 关键词 */
      detectEvents: string[];
      /** 运单状态 */
      orderStatus: Api.SystemManage.TraceKeywordOrderStatus;
      /** 创建人 */
      creator?: string;
      /** 最后编辑 */
      updateBy?: string;
      /** 创建时间（毫秒时间戳） */
      createDate?: number;
      /** 更新时间（毫秒时间戳） */
      updateDate?: number;
    }

    /** 轨迹关键词列表（/track-status-config/query 返回） */
    interface TraceKeywordList {
      list: Api.SystemManage.TraceKeywordItem[];
      total: number;
    }

    type TraceKeywordSearchParams = {
      page: number;
      size: number;
      keyword?: string;
      where?: Record<string, any>;
    };

    /** 轨迹关键词新增参数（审计字段由后端生成） */
    type TraceKeywordCreateParams = Pick<
      Api.SystemManage.TraceKeywordItem,
      'name' | 'common' | 'configIds' | 'detectEvents' | 'orderStatus'
    >;

    type TraceKeywordUpdateParams = Api.SystemManage.TraceKeywordCreateParams & { _id: string };

    interface OperationTraceItem {
      id: number;
      node: string;
      timeFormat: string;
      location: string;
      description: string;
      published: Api.Common.EnableStatus;
    }

    type OperationTraceList = Api.Common.PaginatingQueryRecord<OperationTraceItem>;

    type OperationTraceSearchParams = Api.Common.CommonSearchParams;

    type OperationTraceCreateParams = Omit<Api.SystemManage.OperationTraceItem, 'id'>;

    type OperationTraceUpdateParams = Api.SystemManage.OperationTraceItem;

    /** 操作轨迹配置项（track-op）：运单各操作节点的轨迹文案配置，节点固定 5 种，仅可整表批量编辑 */
    interface TrackOpItem {
      /** 主键 */
      _id: string;
      /** 操作节点 0-运单预报 1-运单揽收 2-运单入库 3-运单发货出库 4-运单派送出库 */
      opType: number;
      /** 时间格式 0-年月日 1-年月日时分 2-年月日时分秒 */
      timeType: number;
      /** 服务地点 */
      place: string;
      /** 详细描述 */
      desc: string;
      /** 是否发布 0-否 1-是 */
      status: number;
      /** 创建时间（毫秒时间戳） */
      createDate: number;
      /** 更新时间（毫秒时间戳） */
      updateDate: number;
    }

    /** 操作轨迹配置列表（/track-op/query 返回） */
    interface TrackOpList {
      list: Api.SystemManage.TrackOpItem[];
    }

    /** 抓取时间 - 每日自动抓取配置（/track-schedule/get 返回单文档或 null） */
    interface CaptureTimeConfig {
      /** 执行时间（0-23 小时数组） */
      exeTimes: number[];
      /** 最后编辑 */
      updateBy?: string;
      /** 更新时间（毫秒时间戳） */
      updateDate?: number;
    }

    type CaptureTimeConfigSaveParams = {
      exeTimes: number[];
    };
  }
}
