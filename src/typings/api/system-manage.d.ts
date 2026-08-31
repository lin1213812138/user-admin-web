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
