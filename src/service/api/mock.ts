/** local mock data for system manage module (used in dev when backend api is absent) */

const STATUS: Api.Common.EnableStatus[] = [1, 0];

function createUser(i: number): Api.SystemManage.User {
  return {
    id: i,
    userName: `user_${i}`,
    nickName: `用户${i}`,
    password: '123456',
    roleId: (i % 3) + 1,
    roleName: '',
    siteId: (i % 6) + 1,
    siteName: '',
    groupId: (i % 5) + 1,
    groupName: '',
    status: STATUS[i % 2],
    realName: `姓名${i}`,
    contactPhone: `1380000${String(i).padStart(4, '0')}`,
    position: '操作员',
    gender: i % 2 === 0 ? '女' : '男',
    email: `user${i}@example.com`,
    hireDate: '2026-03-01',
    birthday: '1996-06-15',
    wechat: `wx_user_${i}`,
    attachment: '',
    homeAddress: `示例省示例市示例区示例路${i}号`,
    otherContact: '',
    remark: '',
    wechatQrcode: '',
    createTime: '2026-08-28 10:00:00'
  };
}

const users: Api.SystemManage.User[] = Array.from({ length: 57 }, (_, idx) => createUser(idx + 1));

/** 按 id 解析用户关联的角色 / 站点 / 组别名（改名后展示同步） */
function withUserNames(user: Api.SystemManage.User): Api.SystemManage.User {
  const role = roles.find(item => item.id === user.roleId);
  const site = sites.find(item => item.id === user.siteId);
  const group = groups.find(item => item.id === user.groupId);

  return {
    ...user,
    roleName: role?.roleName ?? '',
    siteName: site?.siteName ?? '',
    groupName: group?.groupName ?? ''
  };
}

/** mock user list with pagination */
export function mockUserList(params: Api.SystemManage.UserSearchParams): Api.SystemManage.UserList {
  const { current = 1, size = 20, userName, status } = params;

  let filtered = users;

  if (userName) {
    filtered = filtered.filter(item => item.userName.includes(userName));
  }

  if (status) {
    filtered = filtered.filter(item => item.status === status);
  }

  const start = (current - 1) * size;
  const records = filtered.slice(start, start + size).map(withUserNames);

  return {
    records,
    current,
    size,
    total: filtered.length
  };
}

/** create role mock data */
function createRole(id: number, roleName: string, roleCode: string, sort: number): Api.SystemManage.Role {
  return {
    id,
    roleName,
    roleCode,
    remark: `${roleName}的默认权限集合`,
    sort,
    status: id === 4 ? 0 : 1,
    createTime: '2026-08-28 10:00:00'
  };
}

const roles: Api.SystemManage.Role[] = [
  createRole(1, '超级管理员', 'ROLE_SUPER_ADMIN', 1),
  createRole(2, '系统管理员', 'ROLE_ADMIN', 2),
  createRole(3, '普通用户', 'ROLE_USER', 3),
  createRole(4, '访客', 'ROLE_GUEST', 4)
];

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

/** menu ids bound to each role */
const roleMenuMap = new Map<number, number[]>([
  [1, [...ALL_MENU_IDS, 2]],
  [2, [1, 2, 21, 22]],
  [3, [1, 21]],
  [4, [1]]
]);

/** mock role list with pagination */
export function mockRoleList(params: Api.SystemManage.RoleSearchParams): Api.SystemManage.RoleList {
  const { current = 1, size = 20, roleName, roleCode, status } = params;

  let filtered = roles;

  if (roleName) {
    filtered = filtered.filter(item => item.roleName.includes(roleName));
  }

  if (roleCode) {
    filtered = filtered.filter(item => item.roleCode.includes(roleCode));
  }

  if (status) {
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

/** mock create role */
export function mockCreateRole(params: Api.SystemManage.RoleCreateParams): Api.SystemManage.Role {
  const id = roles.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const newRole: Api.SystemManage.Role = {
    id,
    roleName: params.roleName,
    roleCode: params.roleCode,
    remark: params.remark,
    sort: params.sort,
    status: params.status,
    createTime: '2026-08-28 10:00:00'
  };
  roles.push(newRole);

  return newRole;
}

/** mock update role */
export function mockUpdateRole(params: Api.SystemManage.RoleUpdateParams): Api.SystemManage.Role {
  const index = roles.findIndex(item => item.id === params.id);
  const updated: Api.SystemManage.Role = {
    ...roles[index],
    roleName: params.roleName,
    roleCode: params.roleCode,
    remark: params.remark,
    sort: params.sort,
    status: params.status
  };
  roles.splice(index, 1, updated);

  return updated;
}

/** mock delete role by ids */
export function mockDeleteRole(ids: number[]): boolean {
  for (let i = roles.length - 1; i >= 0; i -= 1) {
    const { id } = roles[i];
    if (ids.includes(id)) {
      roles.splice(i, 1);
      roleMenuMap.delete(id);
    }
  }

  return true;
}

/** mock role permission menu tree */
export function mockGetRoleMenuTree(roleId: number): Api.SystemManage.RoleMenuTree {
  return {
    menus: MENU_TREE,
    checkedMenuIds: roleMenuMap.get(roleId) ?? []
  };
}

/** mock assign menus to role */
export function mockAssignRoleMenu(params: Api.SystemManage.RoleAssignMenuParams): boolean {
  roleMenuMap.set(params.roleId, [...params.menuIds]);

  return true;
}

/** mock create user */
export function mockCreateUser(params: Api.SystemManage.UserCreateParams): Api.SystemManage.User {
  const id = users.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const newUser: Api.SystemManage.User = {
    id,
    ...params,
    roleName: '',
    siteName: '',
    groupName: '',
    createTime: todayStr()
  };
  users.unshift(newUser);

  return withUserNames(newUser);
}

/** mock update user（角色 / 站点 / 组别名由 withUserNames 解析） */
export function mockUpdateUser(params: Api.SystemManage.UserUpdateParams): Api.SystemManage.User {
  const index = users.findIndex(item => item.id === params.id);
  const updated: Api.SystemManage.User = {
    ...users[index],
    ...params
  };
  users.splice(index, 1, updated);

  return withUserNames(updated);
}

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

/* ------------------------------ site ------------------------------ */

/** 当天日期（YYYY-MM-DD），用于「最后更新」 */
function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 模拟当前操作人（真实环境由后端记录最后更新人） */
const CURRENT_OPERATOR = '王恒';

/** 创建站点 mock 记录 */
function createSite(
  id: number,
  siteCode: string,
  siteName: string,
  contactName: string,
  extra: Partial<Api.SystemManage.Site> = {}
): Api.SystemManage.Site {
  return {
    id,
    siteCode,
    siteName,
    contactName,
    contactPhone: `1862166${String(3100 + id)}`,
    workTime: '周一至周六 9:00-20:00',
    defaultOrigin: siteName,
    warehouseAddress: `${siteName}市示例仓库地址`,
    remark: '--',
    updateByName: contactName,
    updateTime: '2026-07-04',
    status: id === 5 ? 0 : 1,
    createTime: '2026-07-04 10:00:00',
    ...extra
  };
}

/** 站点数据（首条为用户提供的样例） */
const sites: Api.SystemManage.Site[] = [
  createSite(1, '75501', '深圳', 'LINFLY', {
    contactPhone: '18621663103',
    defaultOrigin: '深圳宝安',
    warehouseAddress: '深圳市宝安区福永街道福永社区福海工业区A1栋三层',
    status: 1
  }),
  createSite(2, '75502', '广州', '陈志强', {
    defaultOrigin: '广州白云',
    warehouseAddress: '广州市白云区太和镇物流园B栋101'
  }),
  createSite(3, '75503', '东莞', '李明', {
    defaultOrigin: '东莞虎门',
    warehouseAddress: '东莞市虎门镇北栅社区工业大道88号'
  }),
  createSite(4, '75504', '上海', '赵雅', {
    defaultOrigin: '上海嘉定',
    warehouseAddress: '上海市嘉定区南翔镇沪宜公路1234号'
  }),
  createSite(5, '75505', '北京', '周涛', {
    defaultOrigin: '北京大兴',
    warehouseAddress: '北京市大兴区黄村镇物流基地A区'
  }),
  createSite(6, '75506', '杭州', '孙倩', {
    defaultOrigin: '杭州萧山',
    warehouseAddress: '杭州市萧山区宁围街道物流园3号库'
  })
];

/** 站点编号是否已被占用（excludeId 用于编辑时排除自身） */
function siteCodeExists(siteCode: string, excludeId?: number): boolean {
  return sites.some(item => item.siteCode === siteCode && item.id !== excludeId);
}

/** mock site list with pagination */
export function mockSiteList(params: Api.SystemManage.SiteSearchParams): Api.SystemManage.SiteList {
  const { current = 1, size = 20, siteCode, siteName, status } = params;

  let filtered = sites;

  if (siteCode) {
    filtered = filtered.filter(item => item.siteCode.includes(siteCode));
  }

  if (siteName) {
    filtered = filtered.filter(item => item.siteName.includes(siteName));
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

/** mock create site（站点编号重复时抛错） */
export function mockCreateSite(params: Api.SystemManage.SiteCreateParams): Api.SystemManage.Site {
  if (siteCodeExists(params.siteCode)) {
    throw new Error('站点编号已存在');
  }

  const id = sites.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const newSite: Api.SystemManage.Site = {
    id,
    ...params,
    updateByName: CURRENT_OPERATOR,
    updateTime: todayStr(),
    createTime: todayStr()
  };
  sites.unshift(newSite);

  return newSite;
}

/** mock update site（站点编号重复时抛错） */
export function mockUpdateSite(params: Api.SystemManage.SiteUpdateParams): Api.SystemManage.Site {
  if (siteCodeExists(params.siteCode, params.id)) {
    throw new Error('站点编号已存在');
  }

  const index = sites.findIndex(item => item.id === params.id);
  const updated: Api.SystemManage.Site = {
    ...sites[index],
    ...params,
    updateByName: CURRENT_OPERATOR,
    updateTime: todayStr()
  };
  sites.splice(index, 1, updated);

  return updated;
}

/** mock delete site by ids */
export function mockDeleteSite(ids: number[]): boolean {
  for (let i = sites.length - 1; i >= 0; i -= 1) {
    if (ids.includes(sites[i].id)) {
      sites.splice(i, 1);
    }
  }

  return true;
}

/* ------------------------------ group ------------------------------ */

/** 按 siteId 解析站点名（站点改名后组别展示同步） */
function withSiteName(group: Api.SystemManage.Group): Api.SystemManage.Group {
  const site = sites.find(item => item.id === group.siteId);

  return { ...group, siteName: site?.siteName ?? '' };
}

/** 创建组别 mock 记录 */
function createGroup(
  id: number,
  groupName: string,
  siteId: number,
  remark: string,
  extra: Partial<Api.SystemManage.Group> = {}
): Api.SystemManage.Group {
  return {
    id,
    groupName,
    siteId,
    siteName: '',
    remark,
    createByName: 'LINFLY',
    createTime: '2026-07-15',
    updateByName: 'LINFLY',
    updateTime: '2026-07-15',
    status: 1,
    ...extra
  };
}

/** 组别数据（首条为用户提供的样例：岳阳 / 上海销售二组 / 所属站点上海） */
const groups: Api.SystemManage.Group[] = [
  createGroup(1, 'LINFLY', 4, '上海销售二组'),
  createGroup(2, '深圳南山', 1, '深圳销售一组'),
  createGroup(3, '广州天河', 2, '广州销售一组'),
  createGroup(4, '东莞虎门', 3, '东莞销售组', { status: 0 }),
  createGroup(5, '北京朝阳', 5, '北京销售一组')
];

/** 组别名称是否已被占用（excludeId 用于编辑时排除自身） */
function groupNameExists(groupName: string, excludeId?: number): boolean {
  return groups.some(item => item.groupName === groupName && item.id !== excludeId);
}

/** mock group list with pagination（siteName 按 siteId 实时解析） */
export function mockGroupList(params: Api.SystemManage.GroupSearchParams): Api.SystemManage.GroupList {
  const { current = 1, size = 20, groupName, siteId, status } = params;

  let filtered = groups;

  if (groupName) {
    filtered = filtered.filter(item => item.groupName.includes(groupName));
  }

  // 站点 id 用非空判断（0 不合法但保持与 status 一致的严谨写法）
  if (siteId !== undefined && siteId !== null) {
    filtered = filtered.filter(item => item.siteId === siteId);
  }

  // 状态 0（禁用）也是有效筛选值，不能用真值判断
  if (status === 0 || status === 1) {
    filtered = filtered.filter(item => item.status === status);
  }

  const start = (current - 1) * size;
  const records = filtered.slice(start, start + size).map(withSiteName);

  return {
    records,
    current,
    size,
    total: filtered.length
  };
}

/** mock create group（组别名称重复时抛错） */
export function mockCreateGroup(params: Api.SystemManage.GroupCreateParams): Api.SystemManage.Group {
  if (groupNameExists(params.groupName)) {
    throw new Error('组别名称已存在');
  }

  const id = groups.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const newGroup: Api.SystemManage.Group = {
    id,
    ...params,
    siteName: '',
    createByName: CURRENT_OPERATOR,
    createTime: todayStr(),
    updateByName: CURRENT_OPERATOR,
    updateTime: todayStr()
  };
  groups.unshift(newGroup);

  return withSiteName(newGroup);
}

/** mock update group（组别名称重复时抛错） */
export function mockUpdateGroup(params: Api.SystemManage.GroupUpdateParams): Api.SystemManage.Group {
  if (groupNameExists(params.groupName, params.id)) {
    throw new Error('组别名称已存在');
  }

  const index = groups.findIndex(item => item.id === params.id);
  const updated: Api.SystemManage.Group = {
    ...groups[index],
    ...params,
    updateByName: CURRENT_OPERATOR,
    updateTime: todayStr()
  };
  groups.splice(index, 1, updated);

  return withSiteName(updated);
}

/** mock delete group by ids */
export function mockDeleteGroup(ids: number[]): boolean {
  for (let i = groups.length - 1; i >= 0; i -= 1) {
    if (ids.includes(groups[i].id)) {
      groups.splice(i, 1);
    }
  }

  return true;
}

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
