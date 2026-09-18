/**
 * 前端认定的超级管理员角色类型，与后端 `ROLE_TYPE.ADMIN`（100）对齐。
 *
 * 后端 `lib/services/role.js:77` 注入会话 `user.roleType = max(map(roleList, 'roleType'))`；
 * `lib/services/role.js:50` 的删除保护只对 `roleType == 100` 生效；`lib/services/role.js:89`
 * 用 `roleType == 100` 放宽改密/改资料权限。接口层 `auth.js:22` 仍只认 `accountType == 1`，
 * 因此即使 `roleType == 100`，仍需「管理员角色权限树强制全选」确保后端 `authMap` 校验通过。
 * 注意：前端 `isSuperAdmin` 仅判 `roleType === 100`，不再依赖 `accountType`（与 `auth.js:22` 后端口径解耦）。
 */
export const SUPER_ROLE_TYPE = 100;
