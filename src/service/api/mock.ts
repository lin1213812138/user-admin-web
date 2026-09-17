/** local mock data for system manage module (used in dev when backend api is absent) */

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
