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

    /** 站点 */
    interface Site {
      id: number;
      /** 站点编号，唯一 */
      siteCode: string;
      /** 站点名称 */
      siteName: string;
      /** 联系人 */
      contactName: string;
      /** 联系电话 */
      contactPhone: string;
      /** 工作时间，如「周一至周六 9:00-20:00」 */
      workTime: string;
      /** 默认出发地 */
      defaultOrigin: string;
      /** 仓库地址 */
      warehouseAddress: string;
      /** 站点备注 */
      remark: string;
      /** 最后更新人 */
      updateByName: string;
      /** 最后更新时间（YYYY-MM-DD） */
      updateTime: string;
      /** 站点状态 */
      status: Api.Common.EnableStatus;
      createTime: string;
    }

    /** 站点列表 */
    type SiteList = Api.Common.PaginatingQueryRecord<Site>;

    /** 站点查询参数 */
    type SiteSearchParams = Api.Common.CommonSearchParams & {
      siteCode?: string;
      siteName?: string;
      status?: Api.Common.EnableStatus | null;
    };

    /** 站点新增参数 */
    type SiteCreateParams = {
      siteCode: string;
      siteName: string;
      contactName: string;
      contactPhone: string;
      workTime: string;
      defaultOrigin: string;
      warehouseAddress: string;
      remark: string;
      status: Api.Common.EnableStatus;
    };

    /** 站点更新参数 */
    type SiteUpdateParams = SiteCreateParams & {
      id: number;
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
