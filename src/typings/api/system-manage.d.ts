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
      userName: string;
      nickName: string;
      userPhone: string;
      userEmail: string;
      /** user status */
      status: Api.Common.EnableStatus;
      /** user role */
      role: number | null;
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
      userPhone: string;
      userEmail: string;
      status: Api.Common.EnableStatus;
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
    };
  }
}
