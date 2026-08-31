declare namespace Api {
  /**
   * namespace Auth
   *
   * backend api module: "auth"
   *
   * Note: wms-user keeps the session in an httpOnly cookie (no JWT/token is returned).
   * The login/session endpoints return a `user` object instead of a token.
   */
  namespace Auth {
    /** Detailed user entity returned by wms-user (login / session) */
    interface UserDetail {
      _id: string;
      account: string;
      originAccount?: string;
      name?: string;
      accountType?: number;
      status?: number;
      userRoleIds?: string[];
      authMap?: Record<string, boolean>;
      showOps?: unknown[];
      warehouseId?: string;
      warehouse?: string;
      [key: string]: unknown;
    }

    /** Login result: `{ user }` (wms-user returns no token, session is cookie based) */
    interface LoginResult {
      user: UserDetail;
    }

    /** Current session user (from `/user/session/get`) */
    interface SessionUser extends UserDetail {
      quickActions?: unknown[];
    }

    /** Normalized user info consumed by the frontend auth store.
     *  It keeps every field returned by the backend (`UserDetail`) plus the computed
     *  `userId` / `userName` aliases and `roles` / `buttons` derived from `authMap`. */
    interface UserInfo extends UserDetail {
      /** alias of `_id` */
      userId: string;
      /** alias of `name` / `account` */
      userName: string;
      /** derived from `authMap` keys */
      roles: string[];
      /** derived from `authMap` keys + `showOps` */
      buttons: string[];
    }
  }
}
