/**
 * 菜单权限配置（静态）
 * ------------------------------------------------------------------
 * 用途：在「角色管理 → 分配权限」抽屉中，按「一级菜单 / 二级菜单」列出可分配权限：
 *   - 按钮权限：该界面（二级菜单）可分配的操作按钮
 *   - 子模块权限：该界面内部的子模块（如「系统设置」的基础配置 / 录单格式…）
 *
 * 表格由本文件自动生成（见 getMenuPermissionTree）：新增菜单 / 调整按钮时只改本文件，
 * 无需改动页面代码；未配置按钮或子模块的菜单，表格中显示 --。
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

/** 子模块权限：二级菜单（界面）内部可分配的子模块 */
export interface SubMenuPermission {
  /** 子模块权限码 */
  code: string;
  /** 子模块展示名称 */
  label: string;
}

/** 二级菜单（「分配权限」表格中的一行 = 一个界面） */
export interface MenuPermissionItem {
  /** 菜单名称 */
  name: string;
  /** 菜单图标（iconify 名，与真实菜单保持一致） */
  icon?: string;
  /** 菜单路由地址 */
  routePath?: string;
  /** 菜单权限标识 */
  permission?: string;
  /** 该界面可分配的操作按钮（空数组 = 表格显示 --） */
  buttons: ButtonPermission[];
  /** 子模块权限：该界面的子模块（不传 / 空数组 = 表格显示 --） */
  subMenus?: SubMenuPermission[];
}

/** 一级菜单（「分配权限」表格中的分组行，本身不承载权限） */
export interface MenuPermissionGroup {
  /** 菜单名称 */
  name: string;
  /** 菜单图标（iconify 名，与真实菜单保持一致） */
  icon?: string;
  /** 子菜单；没有子菜单的一级菜单（如「首页」）视为必选菜单 */
  children: MenuPermissionItem[];
}

/** 「分配权限」表格的树行（由配置自动生成） */
export interface MenuPermissionRow {
  /**
   * 行 id：一级菜单 (i+1)*100，二级菜单 (i+1)*100+(j+1)
   * 目前仅前端勾选 / 提交使用；后端权限接口对接真实菜单 id 时改 getMenuPermissionTree 即可
   */
  id: number;
  title: string;
  icon?: string;
  routePath?: string;
  permission?: string;
  buttons: ButtonPermission[];
  subMenus: SubMenuPermission[];
  /** 必选菜单（没有子菜单的一级菜单，如「首页」）：默认勾选且不可取消 */
  home?: boolean;
  /** vxe 树表勾选回填字段，配合 checkbox-config.checkField 使用 */
  checked?: boolean;
  children?: MenuPermissionRow[];
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

/** 按模块批量生成「子模块权限」（key 用于拼权限码，label 为展示名） */
const sub = (module: string, items: [string, string][]): SubMenuPermission[] =>
  items.map(([key, label]) => ({ code: `system:${module}:${key}`, label }));

const user = op('user');
const role = op('role');
const site = op('site');
const group = op('group');
const customer = op('customer');
const dataGeneral = op('dataGeneral');
const dataBusiness = op('dataBusiness');
const dataFinance = op('dataFinance');
const dataNoRule = op('dataNoRule');
const dataShip = op('dataShip');
const dataBl = op('dataBl');
const setting = op('setting');

/** 各菜单的权限配置（一级菜单 → 二级菜单 → 按钮权限 / 子模块权限），顺序与侧栏菜单一致 */
export const MENU_PERMISSION_TREE: MenuPermissionGroup[] = [
  { name: '首页', icon: 'mdi:monitor-dashboard', children: [] },
  {
    name: '客户管理',
    icon: 'ic:round-business',
    children: [
      {
        name: '客户列表',
        icon: 'ic:round-contacts',
        routePath: '/customer-manage/customer',
        permission: 'system:customer:list',
        buttons: [customer.query, customer.reset, customer.add, customer.edit, customer.delete]
      }
    ]
  },
  {
    name: '渠道报价',
    icon: 'ic:baseline-sell',
    children: [
      {
        name: '收货渠道',
        icon: 'ic:baseline-move-to-inbox',
        routePath: '/channel-quote/receive',
        buttons: []
      },
      {
        name: '发货渠道',
        icon: 'ic:baseline-local-shipping',
        routePath: '/channel-quote/ship',
        buttons: []
      }
    ]
  },
  {
    name: '资料管理',
    icon: 'ic:baseline-folder',
    children: [
      {
        name: '发货资料',
        icon: 'ic:baseline-local-shipping',
        routePath: '/data-manage/ship',
        buttons: [
          dataShip.query,
          dataShip.reset,
          dataShip.add,
          dataShip.edit,
          dataShip.delete,
          dataShip.export,
          dataShip.import
        ],
        subMenus: sub('dataShip', [
          ['provider', '服务商'],
          ['channelGroup', '渠道类别'],
          ['weightRule', '计泡规则'],
          ['carrier', '承运网络']
        ])
      },
      {
        name: '单号资料',
        icon: 'ic:round-numbers',
        routePath: '/data-manage/no-rule',
        buttons: [
          dataNoRule.query,
          dataNoRule.reset,
          dataNoRule.add,
          dataNoRule.edit,
          dataNoRule.delete,
          dataNoRule.export,
          dataNoRule.import
        ],
        subMenus: sub('dataNoRule', [
          ['noRule', '单号规则'],
          ['itemNoRule', '子单号规则'],
          ['noPool', '运单号码池'],
          ['longNoRule', '长单号截短']
        ])
      },
      {
        name: '运单资料',
        icon: 'ic:baseline-warehouse',
        routePath: '/data-manage/business',
        buttons: [
          dataBusiness.query,
          dataBusiness.reset,
          dataBusiness.add,
          dataBusiness.edit,
          dataBusiness.delete,
          dataBusiness.export,
          dataBusiness.import
        ],
        subMenus: sub('dataBusiness', [
          ['declaredGoods', '申报物品'],
          ['address', '地址簿'],
          ['problemCategory', '问题类别'],
          ['goodsCategory', '物品类别'],
          ['customsType', '报关类型'],
          ['exportReason', '出口原因'],
          ['clearanceMethod', '清关方式'],
          ['salesTerms', '销售条款']
        ])
      },
      {
        name: '财务资料',
        icon: 'ic:baseline-account-balance-wallet',
        routePath: '/data-manage/finance',
        buttons: [
          dataFinance.query,
          dataFinance.reset,
          dataFinance.add,
          dataFinance.edit,
          dataFinance.delete,
          dataFinance.export,
          dataFinance.import
        ],
        subMenus: sub('dataFinance', [
          ['expenseType', '费用类型'],
          ['settlement', '结算方式'],
          ['account', '银行账户'],
          ['currency', '结算货币']
        ])
      },
      {
        name: '提单资料',
        icon: 'ic:baseline-receipt-long',
        routePath: '/data-manage/bl',
        buttons: [dataBl.query, dataBl.reset, dataBl.add, dataBl.edit, dataBl.delete, dataBl.export, dataBl.import],
        subMenus: sub('dataBl', [
          ['blRoute', '航线'],
          ['blPort', '港口'],
          ['blTrip', '航名航次'],
          ['blAddress', '地址簿'],
          ['blUnit', '柜型'],
          ['trackConfig', '轨迹配置']
        ])
      },
      {
        name: '通用资料',
        icon: 'ic:baseline-inventory',
        routePath: '/data-manage/basic',
        buttons: [
          dataGeneral.query,
          dataGeneral.reset,
          dataGeneral.add,
          dataGeneral.edit,
          dataGeneral.delete,
          dataGeneral.export,
          dataGeneral.import
        ],
        subMenus: sub('dataGeneral', [
          ['countryRegion', '国家地区'],
          ['fbaWarehouse', 'FBA仓库']
        ])
      }
    ]
  },
  {
    name: '系统管理',
    icon: 'ic:baseline-settings',
    children: [
      {
        name: '用户管理',
        icon: 'ic:round-person',
        routePath: '/system-manage/user',
        permission: 'system:user:list',
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
        name: '角色管理',
        icon: 'ic:round-supervisor-account',
        routePath: '/system-manage/role',
        permission: 'system:role:list',
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
        name: '组别管理',
        icon: 'ic:round-groups',
        routePath: '/system-manage/group',
        permission: 'system:group:list',
        buttons: [group.query, group.reset, group.add, group.edit, group.delete]
      },
      {
        name: '站点管理',
        icon: 'ic:round-place',
        routePath: '/system-manage/site',
        permission: 'system:site:list',
        buttons: [site.query, site.reset, site.add, site.edit, site.delete]
      },
      {
        name: '系统设置',
        icon: 'ic:baseline-settings-applications',
        routePath: '/system-manage/setting',
        buttons: [setting.reset, setting.edit, { code: 'system:setting:save', label: '保存' }],
        subMenus: sub('setting', [
          ['basicConfig', '基础配置'],
          ['inputFormat', '录单格式'],
          ['printFormat', '打印格式'],
          ['exportFormat', '导出格式'],
          ['traceCapture', '轨迹抓取配置'],
          ['operationTrace', '操作轨迹配置']
        ])
      },
      {
        name: '系统日志',
        icon: 'ic:round-article',
        routePath: '/system-manage/log',
        buttons: []
      }
    ]
  }
];

const byPermission = new Map<string, ButtonPermission[]>();
const byRoutePath = new Map<string, ButtonPermission[]>();

MENU_PERMISSION_TREE.forEach(groupItem => {
  groupItem.children.forEach(item => {
    if (item.permission) byPermission.set(item.permission, item.buttons);
    if (item.routePath) byRoutePath.set(item.routePath, item.buttons);
  });
});

/** 根据菜单的 permission 或 routePath 获取该界面所需的按钮权限列表 */
export function getMenuButtons(params: { permission?: string; routePath?: string }): ButtonPermission[] {
  return (
    (params.permission && byPermission.get(params.permission)) ||
    (params.routePath && byRoutePath.get(params.routePath)) ||
    []
  );
}

/**
 * 由配置生成「分配权限」表格的树行。
 * 行 id：一级菜单 (i+1)*100、二级菜单 (i+1)*100+(j+1)。
 */
export function getMenuPermissionTree(): MenuPermissionRow[] {
  return MENU_PERMISSION_TREE.map((groupItem, groupIndex) => {
    const groupId = (groupIndex + 1) * 100;
    const children = groupItem.children.map<MenuPermissionRow>((item, itemIndex) => ({
      id: groupId + itemIndex + 1,
      title: item.name,
      icon: item.icon,
      routePath: item.routePath,
      permission: item.permission,
      buttons: item.buttons,
      subMenus: item.subMenus ?? []
    }));

    return {
      id: groupId,
      title: groupItem.name,
      icon: groupItem.icon,
      buttons: [],
      subMenus: [],
      // 没有子菜单的一级菜单（如「首页」）为必选菜单
      home: children.length === 0,
      children: children.length ? children : undefined
    };
  });
}
