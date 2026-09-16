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
      /** 其他查询条件（站点 / 状态精确过滤） */
      where?: {
        siteId?: string;
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

    /** menu type */
    type MenuType = 'catalog' | 'menu';

    /** menu record */
    interface Menu {
      id: number;
      /** parent menu id, 0 means top level */
      parentId: number;
      /** menu name */
      menuName: string;
      /** menu type: catalog or menu */
      menuType: MenuType;
      /** menu icon */
      icon: string;
      /** route path */
      routePath: string;
      /** component path */
      componentPath: string;
      /** permission code */
      permission: string;
      /** sort order */
      sort: number;
      /** menu status */
      status: Api.Common.EnableStatus;
      /** whether visible */
      visible: 1 | 2;
      /** whether keep alive */
      keepAlive: 1 | 2;
      /** whether external link */
      isExternal: 1 | 2;
      /** redirect path */
      redirect: string;
      createTime: string;
      /** children menus (built at frontend) */
      children?: Menu[];
    }

    /** menu list (flat array, built to tree at frontend) */
    type MenuList = Menu[];

    /** menu search params */
    type MenuSearchParams = {
      menuName?: string;
      status?: Api.Common.EnableStatus | null;
    };

    /** menu create params */
    type MenuCreateParams = Pick<
      Menu,
      | 'parentId'
      | 'menuName'
      | 'menuType'
      | 'icon'
      | 'routePath'
      | 'componentPath'
      | 'permission'
      | 'sort'
      | 'status'
      | 'visible'
      | 'keepAlive'
      | 'isExternal'
      | 'redirect'
    >;

    /** menu update params */
    type MenuUpdateParams = MenuCreateParams & {
      id: number;
    };

    /** menu node of role permission tree */
    interface RoleMenuNode {
      id: number;
      /** menu title */
      title: string;
      children?: RoleMenuNode[];
    }

    /** role permission tree, contains all menus and the checked menus of the role */
    type RoleMenuTree = {
      menus: RoleMenuNode[];
      checkedMenuIds: number[];
    };

    /** role assign menu params */
    type RoleAssignMenuParams = {
      /** 角色 MongoId */
      roleId: string;
      menuIds: number[];
      /** 角色分配的按钮权限码（前端按菜单勾选，需后端支持接收） */
      buttonCodes?: string[];
    };

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

    /** 操作端（tms-user OpLog.client） */
    type OpLogClient = 0 | 1 | 2 | 3; // 0-TMS 1-PC 2-PDA 3-OMS

    /** 操作类型（tms-user OpLog.opType） */
    type OpLogOpType = 0 | 1 | 2 | 3; // 0-登录 1-修改 2-删除 3-退出

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

    /** 客户等级：普通 / 重要 / VIP */
    type CustomerLevel = 'normal' | 'important' | 'vip';

    /** 客户来源：官网 / 转介绍 / 广告 */
    type CustomerSource = 'website' | 'referral' | 'ad';

    /** 客户 */
    interface Customer {
      id: number;
      /** 客户编号，唯一 */
      customerCode: string;
      /** 客户名称 */
      customerName: string;
      /** 客户等级：普通 / 重要 / VIP */
      customerLevel: Api.SystemManage.CustomerLevel;
      /** 客户来源：官网 / 转介绍 / 广告 */
      customerSource: Api.SystemManage.CustomerSource;
      /** 联系人 */
      contactName: string;
      /** 联系电话 */
      contactPhone: string;
      /** 邮箱 */
      email: string;
      /** 地址 */
      address: string;
      /** 客户状态 */
      status: Api.Common.EnableStatus;
      /** 备注 */
      remark: string;
      /** 创建人 */
      createByName: string;
      /** 创建时间（YYYY-MM-DD） */
      createTime: string;
      /** 最后更新人 */
      updateByName: string;
      /** 最后更新时间（YYYY-MM-DD） */
      updateTime: string;
    }

    /** 客户列表 */
    type CustomerList = Api.Common.PaginatingQueryRecord<Customer>;

    /** 客户查询参数 */
    type CustomerSearchParams = Api.Common.CommonSearchParams & {
      customerCode?: string;
      customerName?: string;
      customerLevel?: Api.SystemManage.CustomerLevel | null;
      status?: Api.Common.EnableStatus | null;
    };

    /** 客户新增参数 */
    type CustomerCreateParams = {
      customerCode: string;
      customerName: string;
      customerLevel: Api.SystemManage.CustomerLevel;
      customerSource: Api.SystemManage.CustomerSource;
      contactName: string;
      contactPhone: string;
      email: string;
      address: string;
      remark: string;
      status: Api.Common.EnableStatus;
    };

    /** 客户更新参数 */
    type CustomerUpdateParams = CustomerCreateParams & {
      id: number;
    };

    /** 初始化数据分类：渠道类别 / 承运网络 / 计泡规则 / 操作配置 */
    type InitDataCategory = 'channel' | 'network' | 'bubble' | 'operation';

    /** 初始化数据项 */
    interface InitDataItem {
      id: number;
      /** 所属分类 */
      category: Api.SystemManage.InitDataCategory;
      /** 中文名称 */
      cnName: string;
      /** 英文名称 */
      enName: string;
      /** 备注 */
      remark: string;
      /** 创建人 */
      createByName: string;
      /** 创建时间（YYYY-MM-DD） */
      createTime: string;
      /** 最后更新人 */
      updateByName: string;
      /** 最后更新时间（YYYY-MM-DD） */
      updateTime: string;
    }

    /** 初始化数据列表 */
    type InitDataList = Api.Common.PaginatingQueryRecord<InitDataItem>;

    /** 初始化数据查询参数 */
    type InitDataSearchParams = Api.Common.CommonSearchParams & {
      category: Api.SystemManage.InitDataCategory;
      cnName?: string;
    };

    /** 初始化数据新增参数 */
    type InitDataCreateParams = {
      category: Api.SystemManage.InitDataCategory;
      cnName: string;
      enName: string;
      remark: string;
    };

    /** 初始化数据更新参数 */
    type InitDataUpdateParams = InitDataCreateParams & {
      id: number;
    };

    /** 轨迹抓取 - 前 4 个同构子 tab 分类 */
    type TraceCaptureCategory = 'track-network' | 'track-transform' | 'track-keyword' | 'capture-time';

    interface TraceConfigItem {
      id: number;
      category: Api.SystemManage.TraceCaptureCategory;
      name: string;
      serverAddress: string;
      systemType: string;
      lastEditor: string;
      editTime: string;
    }

    type TraceConfigList = Api.Common.PaginatingQueryRecord<TraceConfigItem>;

    type TraceConfigSearchParams = Api.Common.CommonSearchParams & {
      category: Api.SystemManage.TraceCaptureCategory;
    };

    type TraceConfigCreateParams = {
      category: Api.SystemManage.TraceCaptureCategory;
      name: string;
      serverAddress: string;
      systemType: string;
    };

    type TraceConfigUpdateParams = TraceConfigCreateParams & { id: number };

    /** 轨迹改造 - 时间格式预设：年月日 / 年-月-日 时分 / 年-月-日 时分:秒 */
    type TraceTransformTimeFormat = 'ymd' | 'ymd-hm' | 'ymd-hms';

    /** 轨迹改造 - 异常状态定义（按关键词判断映射的标准化轨迹状态） */
    interface TraceTransformItem {
      id: number;
      /** 状态名称 */
      statusName: string;
      /** 时间格式 */
      timeFormat: Api.SystemManage.TraceTransformTimeFormat;
      /** 服务地点 */
      location: string;
      /** 详细描述 */
      description: string;
      /** 抓取轨迹关键词判断定义（多个关键词用中文逗号分隔） */
      keywordDefinition: string;
    }

    type TraceTransformList = Api.Common.PaginatingQueryRecord<TraceTransformItem>;

    type TraceTransformSearchParams = Api.Common.CommonSearchParams;

    type TraceTransformCreateParams = Omit<Api.SystemManage.TraceTransformItem, 'id'>;

    type TraceTransformUpdateParams = Api.SystemManage.TraceTransformItem;

    /** 轨迹关键词 - 使用范围 */
    type TraceKeywordScope = 'global' | 'site' | 'customer';

    /** 轨迹关键词 - 运单状态 */
    type TraceKeywordWaybillStatus = 'in-transit' | 'delivered' | 'exception' | 'returned';

    /** 轨迹关键词 - 匹配规则（命中关键词组时把运单状态置为指定值） */
    interface TraceKeywordItem {
      id: number;
      /** 规则名称 */
      ruleName: string;
      /** 使用范围 */
      scope: Api.SystemManage.TraceKeywordScope;
      /** 关键词组（多个关键词用中文逗号分隔） */
      keywordGroup: string;
      /** 运单状态 */
      waybillStatus: Api.SystemManage.TraceKeywordWaybillStatus;
      /** 启用状态：1 启用 / 0 禁用 */
      enabled: Api.Common.EnableStatus;
      /** 最后编辑 */
      lastEditor: string;
      /** 编辑时间 */
      editTime: string;
    }

    type TraceKeywordList = Api.Common.PaginatingQueryRecord<TraceKeywordItem>;

    type TraceKeywordSearchParams = Api.Common.CommonSearchParams;

    /** 轨迹关键词新增参数（审计字段由数据层生成） */
    type TraceKeywordCreateParams = {
      ruleName: string;
      scope: Api.SystemManage.TraceKeywordScope;
      keywordGroup: string;
      waybillStatus: Api.SystemManage.TraceKeywordWaybillStatus;
      enabled: Api.Common.EnableStatus;
    };

    type TraceKeywordUpdateParams = Api.SystemManage.TraceKeywordCreateParams & { id: number };

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
  }
}
