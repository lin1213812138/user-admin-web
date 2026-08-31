/** local mock data for system manage module (used in dev when backend api is absent) */

const STATUS: Api.Common.EnableStatus[] = ['1', '2'];

function createUser(i: number): Api.SystemManage.User {
  return {
    id: i,
    userName: `user_${i}`,
    nickName: `用户${i}`,
    userPhone: `1380000${String(i).padStart(4, '0')}`,
    userEmail: `user${i}@example.com`,
    status: STATUS[i % 2],
    role: i % 3 === 0 ? 1 : null,
    createTime: '2026-08-28 10:00:00'
  };
}

const users: Api.SystemManage.User[] = Array.from({ length: 57 }, (_, idx) => createUser(idx + 1));

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
  const records = filtered.slice(start, start + size);

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
    status: id === 4 ? '2' : '1',
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
      { id: 24, title: '部门管理' }
    ]
  }
];

const ALL_MENU_IDS = [1, 21, 22, 23, 24];

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
  const id = users.length + 1;
  const newUser: Api.SystemManage.User = {
    id,
    userName: params.userName,
    nickName: params.nickName,
    userPhone: params.userPhone,
    userEmail: params.userEmail,
    status: params.status,
    role: null,
    createTime: '2026-08-28 10:00:00'
  };
  users.unshift(newUser);

  return newUser;
}
