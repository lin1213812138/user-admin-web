declare namespace Api {
  /**
   * namespace SystemManage
   *
   * backend api module: "system manage"
   */
  namespace SystemManage {
    /** user */
    interface User {
      id: number;
      /** 用户账号（系统登录用户名） */
      userName: string;
      /** 用户名称 */
      nickName: string;
      /** 用户密码（mock 阶段明文，仅演示） */
      password: string;
      /** 用户角色 id */
      roleId: number | null;
      /** 用户角色名称（由数据层按 roleId 解析） */
      roleName: string;
      /** 所属站点 id */
      siteId: number | null;
      /** 所属站点名称（由数据层按 siteId 解析） */
      siteName: string;
      /** 所属组别 id */
      groupId: number | null;
      /** 所属组别名称（由数据层按 groupId 解析） */
      groupName: string;
      /** user status */
      status: Api.Common.EnableStatus;
      /** 姓名 */
      realName: string;
      /** 联系电话 */
      contactPhone: string;
      /** 职位 */
      position: string;
      /** 性别 */
      gender: string;
      /** 邮箱 */
      email: string;
      /** 入职时间（YYYY-MM-DD） */
      hireDate: string;
      /** 出生日期（YYYY-MM-DD） */
      birthday: string;
      /** 微信 */
      wechat: string;
      /** 附件（文件名） */
      attachment: string;
      /** 家庭住址 */
      homeAddress: string;
      /** 其他联系方式 */
      otherContact: string;
      /** 备注 */
      remark: string;
      /** 微信二维码（文件名 / URL） */
      wechatQrcode: string;
      createTime: string;
    }

    /** user list */
    type UserList = Api.Common.PaginatingQueryRecord<User>;

    /** user search params */
    type UserSearchParams = Api.Common.CommonSearchParams & {
      userName?: string;
      status?: Api.Common.EnableStatus | null;
    };

    /** user create params */
    type UserCreateParams = {
      userName: string;
      nickName: string;
      password: string;
      roleId: number | null;
      siteId: number | null;
      groupId: number | null;
      status: Api.Common.EnableStatus;
      realName: string;
      contactPhone: string;
      position: string;
      gender: string;
      email: string;
      hireDate: string;
      birthday: string;
      wechat: string;
      attachment: string;
      homeAddress: string;
      otherContact: string;
      remark: string;
      wechatQrcode: string;
    };

    /** user update params */
    type UserUpdateParams = UserCreateParams & {
      id: number;
    };

    /** role */
    interface Role {
      id: number;
      /** role name */
      roleName: string;
      /** role code */
      roleCode: string;
      /** role remark */
      remark: string;
      /** role sort */
      sort: number;
      /** role status */
      status: Api.Common.EnableStatus;
      createTime: string;
    }

    /** role list */
    type RoleList = Api.Common.PaginatingQueryRecord<Role>;

    /** role search params */
    type RoleSearchParams = Api.Common.CommonSearchParams & {
      roleName?: string;
      roleCode?: string;
      status?: Api.Common.EnableStatus | null;
    };

    /** role create params */
    type RoleCreateParams = {
      roleName: string;
      roleCode: string;
      remark: string;
      sort: number;
      status: Api.Common.EnableStatus;
    };

    /** role update params */
    type RoleUpdateParams = RoleCreateParams & {
      id: number;
    };

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
      roleId: number;
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

    /** 组别 */
    interface Group {
      id: number;
      /** 组别名称，唯一 */
      groupName: string;
      /** 所属站点 id */
      siteId: number | null;
      /** 所属站点名称（由数据层按 siteId 解析，站点改名后同步） */
      siteName: string;
      /** 组别备注 */
      remark: string;
      /** 创建人 */
      createByName: string;
      /** 创建时间（YYYY-MM-DD） */
      createTime: string;
      /** 最后更新人 */
      updateByName: string;
      /** 最后更新时间（YYYY-MM-DD） */
      updateTime: string;
      /** 组别状态 */
      status: Api.Common.EnableStatus;
    }

    /** 组别列表 */
    type GroupList = Api.Common.PaginatingQueryRecord<Group>;

    /** 组别查询参数 */
    type GroupSearchParams = Api.Common.CommonSearchParams & {
      groupName?: string;
      siteId?: number | null;
      status?: Api.Common.EnableStatus | null;
    };

    /** 组别新增参数 */
    type GroupCreateParams = {
      groupName: string;
      siteId: number | null;
      remark: string;
      status: Api.Common.EnableStatus;
    };

    /** 组别更新参数 */
    type GroupUpdateParams = GroupCreateParams & {
      id: number;
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
