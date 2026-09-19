declare namespace Api {
  namespace DataManage {
    /** 基础资料：国家/地区 */
    interface BasicCountryRegion extends MasterDataRow {
      /** 数据库主键（字符串），列表/编辑/删除均用此字段，而非 id */
      _id: string;
      code: string;
      nameCn: string;
      nameEn?: string;
      name?: string;
      code2?: string;
      code3?: string;
      /** 后端用 createDate（时间戳），非 createTime */
      createDate: number;
    }

    /** 基础资料：FBA 仓库 */
    interface BasicFbaWarehouse extends MasterDataRow {
      _id: string;
      code: string;
      warehouse?: string;
      name?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      countryId?: string;
      country?: string;
      createDate: number;
    }
  }
}
