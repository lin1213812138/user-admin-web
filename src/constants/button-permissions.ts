/**
 * 前端按钮权限配置（静态）
 * ------------------------------------------------------------------
 * 用途：在「角色分配权限」抽屉中，按菜单（界面）展示该界面所需的操作按钮，
 *       供角色勾选细粒度的按钮权限。
 *
 * 匹配 key（二选一，命中即返回对应按钮）：
 *   - 菜单的 `permission`（如 `system:user:list`）
 *   - 菜单的 `routePath`（如 `/system-manage/user`）
 * 两者之一需与后端 `/system/menu/list` 返回的对应字段一致才能匹配上。
 *
 * 按钮 `code` 约定：system:{模块}:{操作}（如 system:user:add）。
 * 实际码值请以后端为准，可在此集中调整。
 */

export interface ButtonPermission {
  /** 按钮权限码，提交给后端 / 与前端 hasAuth 比对 */
  code: string;
  /** 按钮展示名称 */
  label: string;
}

interface MenuButtonConfig {
  permission?: string;
  routePath?: string;
  buttons: ButtonPermission[];
}

/** 按模块前缀批量生成常用操作按钮 */
const op = (module: string) => ({
  query: { code: `system:${module}:query`, label: '查询' },
  reset: { code: `system:${module}:reset`, label: '重置' },
  add: { code: `system:${module}:add`, label: '新增' },
  edit: { code: `system:${module}:edit`, label: '编辑' },
  delete: { code: `system:${module}:delete`, label: '删除' },
  export: { code: `system:${module}:export`, label: '导出' },
  import: { code: `system:${module}:import`, label: '导入' }
});

const user = op('user');
const role = op('role');
const menu = op('menu');
const dept = op('dept');
const dataBasic = op('dataBasic');
const dataBusiness = op('dataBusiness');
const dataFinance = op('dataFinance');
const setting = op('setting');

/** 各界面所需按钮权限清单（在此集中维护） */
const MENU_BUTTON_CONFIGS: MenuButtonConfig[] = [
  {
    permission: 'system:user:list',
    routePath: '/system-manage/user',
    buttons: [
      user.query,
      user.reset,
      user.add,
      user.edit,
      user.delete,
      user.export,
      user.import,
      { code: 'system:user:enableOrDisable', label: '启用/停用' },
      { code: 'system:user:resetPwd', label: '重置密码' },
      { code: 'system:user:assignRole', label: '分配角色' }
    ]
  },
  {
    permission: 'system:role:list',
    routePath: '/system-manage/role',
    buttons: [
      role.query,
      role.reset,
      role.add,
      role.edit,
      role.delete,
      { code: 'system:role:assign', label: '分配权限' },
      { code: 'system:role:dataScope', label: '分配数据权限' }
    ]
  },
  {
    permission: 'system:menu:list',
    routePath: '/system-manage/menu',
    buttons: [menu.add, menu.edit, menu.delete]
  },
  {
    permission: 'system:dept:list',
    routePath: '/system-manage/dept',
    buttons: [dept.add, dept.edit, dept.delete]
  },
  {
    routePath: '/system-manage/setting',
    buttons: [setting.reset, setting.edit, { code: 'system:setting:save', label: '保存' }]
  },
  {
    routePath: '/data-manage/basic',
    buttons: [
      dataBasic.query,
      dataBasic.reset,
      dataBasic.add,
      dataBasic.edit,
      dataBasic.delete,
      dataBasic.export,
      dataBasic.import
    ]
  },
  {
    routePath: '/data-manage/business',
    buttons: [
      dataBusiness.query,
      dataBusiness.reset,
      dataBusiness.add,
      dataBusiness.edit,
      dataBusiness.delete,
      dataBusiness.export,
      dataBusiness.import
    ]
  },
  {
    routePath: '/data-manage/finance',
    buttons: [
      dataFinance.query,
      dataFinance.reset,
      dataFinance.add,
      dataFinance.edit,
      dataFinance.delete,
      dataFinance.export,
      dataFinance.import
    ]
  }
];

const byPermission = new Map<string, ButtonPermission[]>();
const byRoutePath = new Map<string, ButtonPermission[]>();

MENU_BUTTON_CONFIGS.forEach(cfg => {
  if (cfg.permission) byPermission.set(cfg.permission, cfg.buttons);
  if (cfg.routePath) byRoutePath.set(cfg.routePath, cfg.buttons);
});

/** 根据菜单的 permission 或 routePath 获取该界面所需的按钮权限列表 */
export function getMenuButtons(params: { permission?: string; routePath?: string }): ButtonPermission[] {
  return (
    (params.permission && byPermission.get(params.permission)) ||
    (params.routePath && byRoutePath.get(params.routePath)) ||
    []
  );
}
