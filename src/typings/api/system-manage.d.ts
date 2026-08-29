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
  }
}
