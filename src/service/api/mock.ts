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
