/** local mock data for system manage module (used in dev when backend api is absent) */

const MENU_TREE: Api.SystemManage.RoleMenuNode[] = [
  {
    id: 1,
    title: '首页',
    children: []
  },
  {
    id: 2,
    title: '系统管理',
    children: [
      { id: 21, title: '用户管理' },
      { id: 22, title: '角色管理' },
      { id: 23, title: '菜单管理' },
      { id: 25, title: '站点管理' },
      { id: 26, title: '组别管理' },
      { id: 27, title: '客户管理' }
    ]
  }
];

const ALL_MENU_IDS = [1, 21, 22, 23, 25, 26, 27];

/** mock role permission menu tree（角色已接真实接口，主键为 MongoId 字符串；权限树为演示数据） */
export function mockGetRoleMenuTree(_roleId: string): Api.SystemManage.RoleMenuTree {
  return {
    menus: MENU_TREE,
    checkedMenuIds: [...ALL_MENU_IDS]
  };
}

/** mock assign menus to role */
export function mockAssignRoleMenu(_params: Api.SystemManage.RoleAssignMenuParams): boolean {
  return true;
}

/** create menu mock record */

/** create menu mock record */
function createMenu(
  id: number,
  parentId: number,
  menuName: string,
  menuType: Api.SystemManage.MenuType,
  extra: Partial<Api.SystemManage.Menu> = {}
): Api.SystemManage.Menu {
  return {
    id,
    parentId,
    menuName,
    menuType,
    icon: menuType === 'catalog' ? 'mdi:menu' : 'mdi:file-document',
    routePath: menuType === 'catalog' ? `/${menuName}` : `/${menuName}/index`,
    componentPath: menuType === 'catalog' ? '' : 'layouts/base-layout/index.vue',
    permission: '',
    sort: id,
    status: 1,
    visible: 1,
    keepAlive: 1,
    isExternal: 2,
    redirect: '',
    createTime: '2026-08-28 10:00:00',
    ...extra
  };
}

/** mock menu data (flat, built to tree at frontend) */
const menus: Api.SystemManage.Menu[] = [
  createMenu(1, 0, 'home', 'menu', { menuName: '首页', routePath: '/home', icon: 'mdi:home' }),
  createMenu(2, 0, 'system-manage', 'catalog', { menuName: '系统管理', routePath: '/system-manage', icon: 'mdi:cog' }),
  createMenu(21, 2, 'user', 'menu', {
    menuName: '用户管理',
    routePath: '/system-manage/user',
    componentPath: 'views/system-manage/user/index.vue',
    permission: 'system:user:list'
  }),
  createMenu(22, 2, 'role', 'menu', {
    menuName: '角色管理',
    routePath: '/system-manage/role',
    componentPath: 'views/system-manage/role/index.vue',
    permission: 'system:role:list'
  }),
  createMenu(23, 2, 'menu', 'menu', {
    menuName: '菜单管理',
    routePath: '/system-manage/menu',
    componentPath: 'views/system-manage/menu/index.vue',
    permission: 'system:menu:list'
  }),
  createMenu(25, 2, 'site', 'menu', {
    menuName: '站点管理',
    routePath: '/system-manage/site',
    componentPath: 'views/system-manage/site/index.vue',
    permission: 'system:site:list'
  }),
  createMenu(26, 2, 'group', 'menu', {
    menuName: '组别管理',
    routePath: '/system-manage/group',
    componentPath: 'views/system-manage/group/index.vue',
    permission: 'system:group:list'
  }),
  createMenu(27, 2, 'customer', 'menu', {
    menuName: '客户管理',
    routePath: '/system-manage/customer',
    componentPath: 'views/system-manage/customer/index.vue',
    permission: 'system:customer:list'
  })
];

/** mock menu list (flat array) */
export function mockMenuList(_params: Api.SystemManage.MenuSearchParams): Api.SystemManage.MenuList {
  return [...menus];
}

/** mock create menu */
export function mockCreateMenu(params: Api.SystemManage.MenuCreateParams): Api.SystemManage.Menu {
  const id = menus.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const newMenu: Api.SystemManage.Menu = {
    id,
    parentId: params.parentId,
    menuName: params.menuName,
    menuType: params.menuType,
    icon: params.icon,
    routePath: params.routePath,
    componentPath: params.componentPath,
    permission: params.permission,
    sort: params.sort,
    status: params.status,
    visible: params.visible,
    keepAlive: params.keepAlive,
    isExternal: params.isExternal,
    redirect: params.redirect,
    createTime: '2026-08-28 10:00:00'
  };
  menus.push(newMenu);

  return newMenu;
}

/** mock update menu */
export function mockUpdateMenu(params: Api.SystemManage.MenuUpdateParams): Api.SystemManage.Menu {
  const index = menus.findIndex(item => item.id === params.id);
  const updated: Api.SystemManage.Menu = {
    ...menus[index],
    parentId: params.parentId,
    menuName: params.menuName,
    menuType: params.menuType,
    icon: params.icon,
    routePath: params.routePath,
    componentPath: params.componentPath,
    permission: params.permission,
    sort: params.sort,
    status: params.status,
    visible: params.visible,
    keepAlive: params.keepAlive,
    isExternal: params.isExternal,
    redirect: params.redirect
  };
  menus.splice(index, 1, updated);

  return updated;
}

/** mock delete menu by ids (also remove descendants) */
export function mockDeleteMenu(ids: number[]): boolean {
  const toRemove = new Set<number>(ids);
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const item of menus) {
      if (!toRemove.has(item.id) && item.parentId !== 0 && toRemove.has(item.parentId)) {
        toRemove.add(item.id);
        expanded = true;
      }
    }
  }
  for (let i = menus.length - 1; i >= 0; i -= 1) {
    if (toRemove.has(menus[i].id)) {
      menus.splice(i, 1);
    }
  }

  return true;
}

/* ------------------------------ mock 公共辅助 ------------------------------ */

/** 当天日期（YYYY-MM-DD），用于「最后更新」 */
function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 模拟当前操作人（真实环境由后端记录最后更新人） */
const CURRENT_OPERATOR = '测试';

/* ------------------------------ customer ------------------------------ */

/** 创建客户 mock 记录 */
function createCustomer(
  id: number,
  customerCode: string,
  customerName: string,
  extra: Partial<Api.SystemManage.Customer> = {}
): Api.SystemManage.Customer {
  return {
    id,
    customerCode,
    customerName,
    customerLevel: 'normal',
    customerSource: 'website',
    contactName: '',
    contactPhone: '',
    email: '',
    address: '',
    remark: '',
    createByName: 'LINFLY',
    createTime: '2026-07-20',
    updateByName: 'LINFLY',
    updateTime: '2026-07-20',
    status: 1,
    ...extra
  };
}

/** 客户数据（样例） */
const customers: Api.SystemManage.Customer[] = [
  createCustomer(1, 'C001', '顺丰供应链', {
    customerLevel: 'vip',
    customerSource: 'referral',
    contactName: '王经理',
    contactPhone: '13800000001',
    email: 'sf@example.com',
    address: '深圳市南山区科技园'
  }),
  createCustomer(2, 'C002', '京东物流', {
    customerLevel: 'important',
    customerSource: 'website',
    contactName: '李经理',
    contactPhone: '13800000002',
    email: 'jd@example.com',
    address: '北京市大兴区'
  }),
  createCustomer(3, 'C003', '中通仓储', {
    customerLevel: 'normal',
    customerSource: 'ad',
    contactName: '张经理',
    contactPhone: '13800000003',
    address: '上海市青浦区'
  })
];

/** 客户编号是否已被占用（excludeId 用于编辑时排除自身） */
function customerCodeExists(customerCode: string, excludeId?: number): boolean {
  return customers.some(item => item.customerCode === customerCode && item.id !== excludeId);
}

/** mock customer list with pagination */
export function mockCustomerList(params: Api.SystemManage.CustomerSearchParams): Api.SystemManage.CustomerList {
  const { current = 1, size = 20, customerCode, customerName, customerLevel, status } = params;

  let filtered = customers;

  if (customerCode) {
    filtered = filtered.filter(item => item.customerCode.includes(customerCode));
  }

  if (customerName) {
    filtered = filtered.filter(item => item.customerName.includes(customerName));
  }

  if (customerLevel) {
    filtered = filtered.filter(item => item.customerLevel === customerLevel);
  }

  // 状态 0（禁用）也是有效筛选值，不能用真值判断
  if (status === 0 || status === 1) {
    filtered = filtered.filter(item => item.status === status);
  }

  const start = (current - 1) * size;
  const records = filtered.slice(start, start + size);

  return {
    records,
    current,
    size,
    total: filtered.length
  };
}

/** mock create customer（客户编号重复时抛错） */
export function mockCreateCustomer(params: Api.SystemManage.CustomerCreateParams): Api.SystemManage.Customer {
  if (customerCodeExists(params.customerCode)) {
    throw new Error('客户编号已存在');
  }

  const id = customers.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const newCustomer: Api.SystemManage.Customer = {
    id,
    ...params,
    createByName: CURRENT_OPERATOR,
    createTime: todayStr(),
    updateByName: CURRENT_OPERATOR,
    updateTime: todayStr()
  };
  customers.unshift(newCustomer);

  return newCustomer;
}

/** mock update customer（客户编号重复时抛错） */
export function mockUpdateCustomer(params: Api.SystemManage.CustomerUpdateParams): Api.SystemManage.Customer {
  if (customerCodeExists(params.customerCode, params.id)) {
    throw new Error('客户编号已存在');
  }

  const index = customers.findIndex(item => item.id === params.id);
  const updated: Api.SystemManage.Customer = {
    ...customers[index],
    ...params,
    updateByName: CURRENT_OPERATOR,
    updateTime: todayStr()
  };
  customers.splice(index, 1, updated);

  return updated;
}

/** mock delete customer by ids */
export function mockDeleteCustomer(ids: number[]): boolean {
  for (let i = customers.length - 1; i >= 0; i -= 1) {
    if (ids.includes(customers[i].id)) {
      customers.splice(i, 1);
    }
  }

  return true;
}

/* ------------------------------ init data ------------------------------ */

/** 创建初始化数据 mock 记录 */
function createInitData(
  id: number,
  category: Api.SystemManage.InitDataCategory,
  cnName: string,
  enName: string,
  remark: string,
  extra: Partial<Api.SystemManage.InitDataItem> = {}
): Api.SystemManage.InitDataItem {
  return {
    id,
    category,
    cnName,
    enName,
    remark,
    createByName: CURRENT_OPERATOR,
    createTime: '2026-08-20',
    updateByName: CURRENT_OPERATOR,
    updateTime: '2026-08-20',
    ...extra
  };
}

/** 初始化数据（按分类分四组） */
const initDataItems: Api.SystemManage.InitDataItem[] = [
  // 渠道类别 channel
  createInitData(1, 'channel', '空运', 'Air', '航空货运'),
  createInitData(2, 'channel', '海运', 'Sea', '海上集装箱运输'),
  createInitData(3, 'channel', '铁路', 'Rail', '中欧班列'),
  createInitData(4, 'channel', '陆运', 'Land', '公路运输'),
  createInitData(5, 'channel', '快递', 'Express', '商业快递'),
  // 承运网络 network
  createInitData(11, 'network', '自营网络', 'Self-operated', '自建干线'),
  createInitData(12, 'network', '代理网络', 'Agent', '第三方代理'),
  createInitData(13, 'network', '专线网络', 'Dedicated', '专线直达'),
  createInitData(14, 'network', '联运网络', 'Multimodal', '多式联运'),
  // 计泡规则 bubble
  createInitData(21, 'bubble', '体积重×1.0', 'Factor 1.0', '实重计费'),
  createInitData(22, 'bubble', '体积重×1.2', 'Factor 1.2', '轻抛货系数'),
  createInitData(23, 'bubble', '除6000', 'Divide 6000', '长×宽×高÷6000'),
  createInitData(24, 'bubble', '除5000', 'Divide 5000', '长×宽×高÷5000'),
  // 操作配置 operation
  createInitData(31, 'operation', '拣货', 'Picking', '订单拣货'),
  createInitData(32, 'operation', '称重', 'Weighing', '入库称重'),
  createInitData(33, 'operation', '打包', 'Packing', '出库打包'),
  createInitData(34, 'operation', '分拣', 'Sorting', '自动分拣')
];

/** 中文名称是否已存在（按分类隔离，excludeId 用于编辑时排除自身） */
function initDataCnNameExists(
  category: Api.SystemManage.InitDataCategory,
  cnName: string,
  excludeId?: number
): boolean {
  return initDataItems.some(item => item.category === category && item.cnName === cnName && item.id !== excludeId);
}

/** mock init data list（按 category 过滤 + 分页 + 可选中文名搜索） */
export function mockGetInitDataList(params: Api.SystemManage.InitDataSearchParams): Api.SystemManage.InitDataList {
  const { current = 1, size = 20, category, cnName } = params;

  let filtered = initDataItems.filter(item => item.category === category);

  if (cnName) {
    filtered = filtered.filter(item => item.cnName.includes(cnName));
  }

  const start = (current - 1) * size;
  const records = filtered.slice(start, start + size);

  return {
    records,
    current,
    size,
    total: filtered.length
  };
}

/** mock create init data（同分类中文名重复时抛错） */
export function mockCreateInitData(params: Api.SystemManage.InitDataCreateParams): Api.SystemManage.InitDataItem {
  if (initDataCnNameExists(params.category, params.cnName)) {
    throw new Error('中文名称已存在');
  }

  const id = initDataItems.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const newItem: Api.SystemManage.InitDataItem = {
    id,
    category: params.category,
    cnName: params.cnName,
    enName: params.enName,
    remark: params.remark,
    createByName: CURRENT_OPERATOR,
    createTime: todayStr(),
    updateByName: CURRENT_OPERATOR,
    updateTime: todayStr()
  };
  initDataItems.unshift(newItem);

  return newItem;
}

/** mock update init data（同分类中文名重复时抛错） */
export function mockUpdateInitData(params: Api.SystemManage.InitDataUpdateParams): Api.SystemManage.InitDataItem {
  if (initDataCnNameExists(params.category, params.cnName, params.id)) {
    throw new Error('中文名称已存在');
  }

  const index = initDataItems.findIndex(item => item.id === params.id);
  const updated: Api.SystemManage.InitDataItem = {
    ...initDataItems[index],
    category: params.category,
    cnName: params.cnName,
    enName: params.enName,
    remark: params.remark,
    updateByName: CURRENT_OPERATOR,
    updateTime: todayStr()
  };
  initDataItems.splice(index, 1, updated);

  return updated;
}

/** mock delete init data by ids */
export function mockDeleteInitData(ids: number[]): boolean {
  for (let i = initDataItems.length - 1; i >= 0; i -= 1) {
    if (ids.includes(initDataItems[i].id)) {
      initDataItems.splice(i, 1);
    }
  }

  return true;
}

// ---------- 轨迹抓取配置（前 4 个同构子 tab） ----------
const traceConfigItems: Api.SystemManage.TraceConfigItem[] = [
  {
    id: 1,
    category: 'track-network',
    name: '主追踪网络',
    serverAddress: '10.0.0.1:8080',
    systemType: 'WMS',
    lastEditor: CURRENT_OPERATOR,
    editTime: todayStr()
  },
  {
    id: 2,
    category: 'track-network',
    name: '备用追踪网络',
    serverAddress: '10.0.0.2:8080',
    systemType: 'OMS',
    lastEditor: CURRENT_OPERATOR,
    editTime: todayStr()
  },
  {
    id: 3,
    category: 'track-transform',
    name: '轨迹转换A',
    serverAddress: '10.0.1.1:9000',
    systemType: 'WMS',
    lastEditor: CURRENT_OPERATOR,
    editTime: todayStr()
  },
  {
    id: 4,
    category: 'track-keyword',
    name: '关键词匹配',
    serverAddress: '10.0.2.1:7000',
    systemType: 'RULE',
    lastEditor: CURRENT_OPERATOR,
    editTime: todayStr()
  },
  {
    id: 5,
    category: 'capture-time',
    name: '定时抓取',
    serverAddress: '10.0.3.1:6000',
    systemType: 'CRON',
    lastEditor: CURRENT_OPERATOR,
    editTime: todayStr()
  }
];

export function mockGetTraceConfigList(
  params: Api.SystemManage.TraceConfigSearchParams
): Api.SystemManage.TraceConfigList {
  const { current = 1, size = 20, category } = params;
  const filtered = traceConfigItems.filter(item => item.category === category);
  const start = (current - 1) * size;
  return {
    records: filtered.slice(start, start + size),
    current,
    size,
    total: filtered.length
  };
}

export function mockCreateTraceConfig(
  params: Api.SystemManage.TraceConfigCreateParams
): Api.SystemManage.TraceConfigItem {
  const id = traceConfigItems.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const item: Api.SystemManage.TraceConfigItem = {
    id,
    lastEditor: CURRENT_OPERATOR,
    editTime: todayStr(),
    ...params
  };
  traceConfigItems.unshift(item);
  return item;
}

export function mockUpdateTraceConfig(
  params: Api.SystemManage.TraceConfigUpdateParams
): Api.SystemManage.TraceConfigItem {
  const index = traceConfigItems.findIndex(item => item.id === params.id);
  const updated: Api.SystemManage.TraceConfigItem = {
    ...traceConfigItems[index],
    ...params,
    editTime: todayStr()
  };
  traceConfigItems.splice(index, 1, updated);
  return updated;
}

// ---------- 轨迹改造（异常状态定义，独立于前 4 个同构子 tab） ----------
const traceTransformItems: Api.SystemManage.TraceTransformItem[] = [
  {
    id: 1,
    statusName: '航班延误',
    timeFormat: 'ymd-hm',
    location: '',
    description: '航班因不可抗拒原因延误',
    keywordDefinition: '航班延误'
  },
  {
    id: 2,
    statusName: '船期延误',
    timeFormat: 'ymd-hm',
    location: '',
    description: '船期延误，等待进一步操作通知',
    keywordDefinition: '船期延误'
  },
  {
    id: 3,
    statusName: '清关延误',
    timeFormat: 'ymd-hm',
    location: '',
    description: '清关出现延误，等待进一步通知',
    keywordDefinition: '清关延误'
  },
  {
    id: 4,
    statusName: '扣关',
    timeFormat: 'ymd-hm',
    location: '',
    description: '海关查验，等待放行通知',
    keywordDefinition: '海关查验，递交海关'
  },
  {
    id: 5,
    statusName: '派送失败',
    timeFormat: 'ymd-hm',
    location: '',
    description: '投递失败',
    keywordDefinition: '电话无人接听，联系不到'
  },
  {
    id: 6,
    statusName: '快件丢失',
    timeFormat: 'ymd-hm',
    location: '',
    description: '快件遗失',
    keywordDefinition: '丢失，遗失'
  },
  {
    id: 7,
    statusName: '快件破损',
    timeFormat: 'ymd-hm',
    location: '',
    description: '货物包装破损',
    keywordDefinition: '破损'
  },
  {
    id: 8,
    statusName: '其它异常',
    timeFormat: 'ymd-hm',
    location: '',
    description: '其它异常，具体联系客服处理',
    keywordDefinition: '异常'
  }
];

/** mock get trace transform list */
export function mockGetTraceTransformList(
  params: Api.SystemManage.TraceTransformSearchParams
): Api.SystemManage.TraceTransformList {
  const { current = 1, size = 20 } = params;
  const start = (current - 1) * size;

  return {
    records: traceTransformItems.slice(start, start + size),
    current,
    size,
    total: traceTransformItems.length
  };
}

/** mock create trace transform */
export function mockCreateTraceTransform(
  params: Api.SystemManage.TraceTransformCreateParams
): Api.SystemManage.TraceTransformItem {
  const id = traceTransformItems.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const item: Api.SystemManage.TraceTransformItem = { id, ...params };
  traceTransformItems.push(item);

  return item;
}

/** mock update trace transform */
export function mockUpdateTraceTransform(
  params: Api.SystemManage.TraceTransformUpdateParams
): Api.SystemManage.TraceTransformItem {
  const index = traceTransformItems.findIndex(item => item.id === params.id);
  const updated: Api.SystemManage.TraceTransformItem = { ...traceTransformItems[index], ...params };
  traceTransformItems.splice(index, 1, updated);

  return updated;
}

/** mock delete trace transform by ids */
export function mockDeleteTraceTransform(ids: number[]): boolean {
  for (let i = traceTransformItems.length - 1; i >= 0; i -= 1) {
    if (ids.includes(traceTransformItems[i].id)) {
      traceTransformItems.splice(i, 1);
    }
  }

  return true;
}

// ---------- 轨迹关键词（匹配规则，独立于同构子 tab） ----------
const traceKeywordItems: Api.SystemManage.TraceKeywordItem[] = [
  {
    id: 1,
    ruleName: '安达配送完成',
    scope: 'global',
    keywordGroup: '配送完成',
    waybillStatus: 'delivered',
    enabled: 1,
    lastEditor: '测试',
    editTime: '2026-09-04 16:42:34'
  },
  {
    id: 2,
    ruleName: '规则',
    scope: 'global',
    keywordGroup: 'した',
    waybillStatus: 'exception',
    enabled: 1,
    lastEditor: '超管员',
    editTime: '2026-08-31 10:02:53'
  }
];

/** mock get trace keyword list */
export function mockGetTraceKeywordList(
  params: Api.SystemManage.TraceKeywordSearchParams
): Api.SystemManage.TraceKeywordList {
  const { current = 1, size = 20 } = params;
  const start = (current - 1) * size;

  return {
    records: traceKeywordItems.slice(start, start + size),
    current,
    size,
    total: traceKeywordItems.length
  };
}

/** mock create trace keyword */
export function mockCreateTraceKeyword(
  params: Api.SystemManage.TraceKeywordCreateParams
): Api.SystemManage.TraceKeywordItem {
  const id = traceKeywordItems.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const item: Api.SystemManage.TraceKeywordItem = {
    id,
    lastEditor: CURRENT_OPERATOR,
    editTime: todayStr(),
    ...params
  };
  traceKeywordItems.push(item);

  return item;
}

/** mock update trace keyword */
export function mockUpdateTraceKeyword(
  params: Api.SystemManage.TraceKeywordUpdateParams
): Api.SystemManage.TraceKeywordItem {
  const index = traceKeywordItems.findIndex(item => item.id === params.id);
  const updated: Api.SystemManage.TraceKeywordItem = {
    ...traceKeywordItems[index],
    ...params,
    lastEditor: CURRENT_OPERATOR,
    editTime: todayStr()
  };
  traceKeywordItems.splice(index, 1, updated);

  return updated;
}

/** mock delete trace keyword by ids */
export function mockDeleteTraceKeyword(ids: number[]): boolean {
  for (let i = traceKeywordItems.length - 1; i >= 0; i -= 1) {
    if (ids.includes(traceKeywordItems[i].id)) {
      traceKeywordItems.splice(i, 1);
    }
  }

  return true;
}

// ---------- 操作轨迹 ----------
const operationTraceItems: Api.SystemManage.OperationTraceItem[] = [
  { id: 1, node: '揽收', timeFormat: 'YYYY-MM-DD HH:mm', location: '深圳', description: '包裹揽收入库', published: 1 },
  {
    id: 2,
    node: '分拣',
    timeFormat: 'YYYY-MM-DD HH:mm',
    location: '广州',
    description: '按目的地进行分拣',
    published: 1
  },
  { id: 3, node: '出库', timeFormat: 'YYYY-MM-DD', location: '上海', description: '装车出库', published: 0 }
];

export function mockGetOperationTraceList(
  params: Api.SystemManage.OperationTraceSearchParams
): Api.SystemManage.OperationTraceList {
  const { current = 1, size = 20 } = params;
  const start = (current - 1) * size;
  return {
    records: operationTraceItems.slice(start, start + size),
    current,
    size,
    total: operationTraceItems.length
  };
}

export function mockCreateOperationTrace(
  params: Api.SystemManage.OperationTraceCreateParams
): Api.SystemManage.OperationTraceItem {
  const id = operationTraceItems.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const item: Api.SystemManage.OperationTraceItem = { id, ...params };
  operationTraceItems.unshift(item);
  return item;
}

export function mockUpdateOperationTrace(
  params: Api.SystemManage.OperationTraceUpdateParams
): Api.SystemManage.OperationTraceItem {
  const index = operationTraceItems.findIndex(item => item.id === params.id);
  const updated: Api.SystemManage.OperationTraceItem = { ...operationTraceItems[index], ...params };
  operationTraceItems.splice(index, 1, updated);
  return updated;
}
