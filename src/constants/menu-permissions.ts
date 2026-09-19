/**
 * 菜单权限配置（静态）
 * ------------------------------------------------------------------
 * 用途：在「角色管理 → 分配权限」抽屉中，以树形列出可分配权限：
 *   - 一级菜单 → 二级菜单 → 子模块（如「单号资料」下的「单号规则」）
 *   - 按钮权限：任一菜单节点上可分配的操作按钮
 *
 * 子模块就是挂在二级菜单下的普通菜单节点（同 MenuPermissionItem 结构，同样可挂 buttons），
 * 只是业务层级更深一层，因此表格里它就是树上的一个可勾选行，而非独立的「子模块权限」列。
 *
 * 表格由本文件自动生成（见 getMenuPermissionTree）：新增菜单 / 子模块 / 按钮时只改本文件，
 * 无需改动页面代码；未配置按钮的菜单，按钮列显示 --。
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

/**
 * 菜单节点（一级 / 二级 / 子模块统一结构）
 * ------------------------------------------------------------------
 * 子模块（如「单号资料」下的「单号规则」）本质就是一个挂在二级菜单下的**普通菜单节点**，
 * 与二级菜单结构完全一致：同样拥有 name / icon / routePath / permission / buttons，
 * 同样作为树上的一行参与勾选、展开与权限提交。区别仅是业务层级更深一层。
 *
 * 因此不再区分 MenuPermissionGroup / SubMenuPermission，全部用本接口递归表达。
 */
export interface MenuPermissionItem {
  /** 菜单名称 */
  name: string;
  /** 菜单图标（iconify 名，与真实菜单保持一致） */
  icon?: string;
  /** 菜单路由地址 */
  routePath?: string;
  /** 菜单权限标识 */
  permission?: string;
  /** 该界面可分配的操作按钮（不传 / 空数组 = 表格按钮列显示 --） */
  buttons?: ButtonPermission[];
  /** 下级菜单 / 子模块；没有下级的一级菜单（如「首页」）视为必选菜单 */
  children?: MenuPermissionItem[];
}

/** 「分配权限」表格的树行（由配置自动生成） */
export interface MenuPermissionRow {
  /**
   * 行 id：由父 id 递归派生（子 id = 父 id * 100 + 序号），保证全树唯一。
   * 目前仅前端勾选 / 展开 / 提交使用；后端只认 permission 权限码。
   */
  id: number;
  title: string;
  icon?: string;
  routePath?: string;
  permission?: string;
  buttons: ButtonPermission[];
  /** 必选菜单（没有下级的一级菜单，如「首页」）：默认勾选且不可取消 */
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
  batchDelete: { code: `system:${module}:batchDelete`, label: '批量删除' },
  export: { code: `system:${module}:export`, label: '导出' },
  import: { code: `system:${module}:import`, label: '导入' },
  status: { code: `system:${module}:status`, label: '启用/停用' },
  permission: { code: `system:${module}:permission`, label: '分配权限' },
  refresh: { code: `system:${module}:refresh`, label: '刷新' },
  setting: { code: `system:${module}:setting`, label: '列设置' } // 表格配置
});

/**
 * 子模块就是挂在二级菜单 children 下的普通菜单节点（与二级菜单同构，同样可带 icon / routePath / permission / buttons）。
 * 权限码约定 system:{module}:{key}，与页面 ArchiveTabItem.permission 对齐（改动此规则会影响资料页 tab 显隐）。
 * 参考「发货资料」「单号资料」：children 内每个子模块都直接写成完整对象，不挂下级时省略 children 即可。
 */

const user = op('user');
const role = op('role');
const site = op('site');
const group = op('group');
const customer = op('customer');
const customerLevel = op('customerLevel');
const customerSource = op('customerSource');

/** 各菜单的权限配置（一级 → 二级 → 子模块，任意层级都可挂 buttons），顺序与侧栏菜单一致 */
export const MENU_PERMISSION_TREE: MenuPermissionItem[] = [
  { name: '首页', icon: 'mdi:monitor-dashboard', buttons: [], children: [] },
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
      },
      {
        name: '客户等级',
        icon: 'ic:round-stars',
        routePath: '/customer-manage/customer-level',
        permission: 'system:customerLevel:list',
        buttons: [
          customerLevel.query,
          customerLevel.reset,
          customerLevel.add,
          customerLevel.edit,
          customerLevel.delete,
          customerLevel.export,
          customerLevel.status
        ]
      },
      {
        name: '客户来源',
        icon: 'ic:round-ads-click',
        routePath: '/customer-manage/customer-source',
        permission: 'system:customerSource:list',
        buttons: [
          customerSource.query,
          customerSource.reset,
          customerSource.add,
          customerSource.edit,
          customerSource.export,
          customerSource.status
        ]
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
        permission: 'system:channelQuote:receive:list'
      },
      {
        name: '发货渠道',
        icon: 'ic:baseline-local-shipping',
        routePath: '/channel-quote/ship',
        permission: 'system:channelQuote:ship:list'
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
        permission: 'system:ship:list',
        buttons: [],
        children: [
          {
            name: '服务商',
            icon: 'ic:baseline-local-shipping',
            permission: 'system:dataShip:provider',
            buttons: [customer.query, customer.reset, customer.add, customer.edit, customer.delete]
          },
          {
            name: '渠道类别',
            icon: 'ic:baseline-local-shipping',
            permission: 'system:dataShip:channelGroup',
            buttons: [customer.query, customer.reset, customer.add, customer.edit, customer.delete]
          },
          {
            name: '计泡规则',
            icon: 'ic:baseline-local-shipping',
            permission: 'system:dataShip:weightRule',
            buttons: [customer.query, customer.reset, customer.add, customer.edit, customer.delete]
          },
          {
            name: '承运网络',
            icon: 'ic:baseline-local-shipping',
            permission: 'system:dataShip:carrier',
            buttons: [customer.query, customer.reset, customer.add, customer.edit, customer.delete]
          }
        ]
      },
      {
        name: '单号资料',
        icon: 'ic:round-numbers',
        routePath: '/data-manage/no-rule',
        permission: 'system:noRule:list',
        children: [
          { name: '单号规则', icon: 'ic:round-numbers', permission: 'system:dataNoRule:noRule', buttons: [] },
          { name: '子单号规则', icon: 'ic:round-numbers', permission: 'system:dataNoRule:itemNoRule', buttons: [] },
          { name: '运单号码池', icon: 'ic:round-numbers', permission: 'system:dataNoRule:noPool', buttons: [] },
          { name: '长单号截短', icon: 'ic:round-numbers', permission: 'system:dataNoRule:longNoRule', buttons: [] }
        ]
      },
      {
        name: '运单资料',
        icon: 'ic:baseline-warehouse',
        routePath: '/data-manage/business',
        permission: 'system:business:list',
        children: [
          {
            name: '申报物品',
            icon: 'ic:baseline-warehouse',
            permission: 'system:dataBusiness:declaredGoods',
            buttons: []
          },
          { name: '地址簿', icon: 'ic:baseline-warehouse', permission: 'system:dataBusiness:address', buttons: [] },
          {
            name: '问题类别',
            icon: 'ic:baseline-warehouse',
            permission: 'system:dataBusiness:problemCategory',
            buttons: []
          },
          {
            name: '物品类别',
            icon: 'ic:baseline-warehouse',
            permission: 'system:dataBusiness:goodsCategory',
            buttons: []
          },
          {
            name: '报关类型',
            icon: 'ic:baseline-warehouse',
            permission: 'system:dataBusiness:customsType',
            buttons: []
          },
          {
            name: '出口原因',
            icon: 'ic:baseline-warehouse',
            permission: 'system:dataBusiness:exportReason',
            buttons: []
          },
          {
            name: '清关方式',
            icon: 'ic:baseline-warehouse',
            permission: 'system:dataBusiness:clearanceMethod',
            buttons: []
          },
          { name: '销售条款', icon: 'ic:baseline-warehouse', permission: 'system:dataBusiness:salesTerms', buttons: [] }
        ]
      },
      {
        name: '财务资料',
        icon: 'ic:baseline-account-balance-wallet',
        routePath: '/data-manage/finance',
        permission: 'system:finance:list',
        children: [
          {
            name: '费用类型',
            icon: 'ic:baseline-account-balance-wallet',
            permission: 'system:dataFinance:expenseType',
            buttons: []
          },
          {
            name: '结算方式',
            icon: 'ic:baseline-account-balance-wallet',
            permission: 'system:dataFinance:settlement',
            buttons: []
          },
          {
            name: '银行账户',
            icon: 'ic:baseline-account-balance-wallet',
            permission: 'system:dataFinance:account',
            buttons: []
          },
          {
            name: '结算货币',
            icon: 'ic:baseline-account-balance-wallet',
            permission: 'system:dataFinance:currency',
            buttons: []
          }
        ]
      },
      {
        name: '提单资料',
        icon: 'ic:baseline-receipt-long',
        routePath: '/data-manage/bl',
        permission: 'system:bl:list',
        children: [
          { name: '航线', icon: 'ic:baseline-receipt-long', permission: 'system:dataBl:blRoute', buttons: [] },
          { name: '港口', icon: 'ic:baseline-receipt-long', permission: 'system:dataBl:blPort', buttons: [] },
          { name: '航名航次', icon: 'ic:baseline-receipt-long', permission: 'system:dataBl:blTrip', buttons: [] },
          { name: '地址簿', icon: 'ic:baseline-receipt-long', permission: 'system:dataBl:blAddress', buttons: [] },
          { name: '柜型', icon: 'ic:baseline-receipt-long', permission: 'system:dataBl:blUnit', buttons: [] },
          { name: '轨迹配置', icon: 'ic:baseline-receipt-long', permission: 'system:dataBl:trackConfig', buttons: [] }
        ]
      },
      {
        name: '通用资料',
        icon: 'ic:baseline-inventory',
        routePath: '/data-manage/basic',
        permission: 'system:basic:list',
        children: [
          {
            name: '国家地区',
            icon: 'ic:baseline-inventory',
            permission: 'system:dataGeneral:countryRegion',
            buttons: []
          },
          { name: 'FBA仓库', icon: 'ic:baseline-inventory', permission: 'system:dataGeneral:fbaWarehouse', buttons: [] }
        ]
      }
    ]
  },
  {
    name: '系统管理',
    icon: 'ic:baseline-settings',
    buttons: [],
    children: [
      {
        name: '用户管理',
        icon: 'ic:round-person',
        routePath: '/system-manage/user',
        permission: 'system:user:list',
        buttons: [user.query, user.reset, user.add, user.edit, user.delete, user.export, user.import, user.status]
      },
      {
        name: '角色管理',
        icon: 'ic:round-supervisor-account',
        routePath: '/system-manage/role',
        permission: 'system:role:list',
        buttons: [role.query, role.reset, role.add, role.edit, role.delete, role.permission]
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
        permission: 'system:setting:list',
        children: [
          {
            name: '基础配置',
            icon: 'ic:baseline-settings-applications',
            permission: 'system:setting:basicConfig',
            buttons: []
          },
          {
            name: '录单格式',
            icon: 'ic:baseline-settings-applications',
            permission: 'system:setting:inputFormat',
            buttons: []
          },
          {
            name: '打印格式',
            icon: 'ic:baseline-settings-applications',
            permission: 'system:setting:printFormat',
            buttons: []
          },
          {
            name: '导出格式',
            icon: 'ic:baseline-settings-applications',
            permission: 'system:setting:exportFormat',
            buttons: []
          },
          {
            name: '轨迹抓取配置',
            icon: 'ic:baseline-settings-applications',
            permission: 'system:setting:traceCapture',
            buttons: []
          },
          {
            name: '操作轨迹配置',
            icon: 'ic:baseline-settings-applications',
            permission: 'system:setting:operationTrace',
            buttons: []
          }
        ]
      },
      {
        name: '系统日志',
        icon: 'ic:round-article',
        routePath: '/system-manage/log',
        permission: 'system:log:list',
        buttons: []
      }
    ]
  }
];

const byPermission = new Map<string, ButtonPermission[]>();
const byRoutePath = new Map<string, ButtonPermission[]>();

/** 递归遍历所有层级（含子模块），建立 permission / routePath → 按钮的索引 */
function walkItems(items: MenuPermissionItem[], visit: (item: MenuPermissionItem) => void) {
  items.forEach(item => {
    visit(item);
    if (item.children?.length) {
      walkItems(item.children, visit);
    }
  });
}

walkItems(MENU_PERMISSION_TREE, item => {
  if (item.permission) byPermission.set(item.permission, item.buttons ?? []);
  if (item.routePath) byRoutePath.set(item.routePath, item.buttons ?? []);
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
 * 由配置递归生成「分配权限」表格的树行。
 * 子模块与二级菜单同构，所以一套递归即可覆盖全部层级；行 id = 父 id * 100 + 序号，保证全树唯一。
 */
function buildRow(item: MenuPermissionItem, id: number): MenuPermissionRow {
  const children = (item.children ?? []).map((child, index) => buildRow(child, id * 100 + index + 1));

  return {
    id,
    title: item.name,
    icon: item.icon,
    routePath: item.routePath,
    permission: item.permission,
    buttons: item.buttons ?? [],
    children: children.length ? children : undefined
  };
}

export function getMenuPermissionTree(): MenuPermissionRow[] {
  return MENU_PERMISSION_TREE.map((item, index) => {
    const row = buildRow(item, (index + 1) * 100);

    // 没有下级的一级菜单（如「首页」）为必选菜单：默认勾选且不可取消
    return { ...row, home: !row.children?.length };
  });
}
