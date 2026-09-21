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

    /**
     * 基础资料：偏远类别（tms-user `RemoteGroup`，`/remote-group/query`）
     * 注意：`status` / `remark` 继承自 MasterDataRow，后端实际字段为 `status` / `note`
     */
    interface BasicRemoteGroup extends MasterDataRow {
      _id: string;
      /** 类别名称（必填、唯一） */
      name: string;
      /** 偏远数据条数（后端在导入后回写） */
      remoteCount?: number;
      /** 备注（后端字段名为 note） */
      note?: string;
      creatorId?: string;
      /** 创建人名称（后端写入） */
      creator?: string;
      updateId?: string;
      /** 修改人名称（后端写入） */
      updateBy?: string;
      createDate?: number;
      updateDate?: number;
    }

    /**
     * 基础资料：偏远数据明细（tms-user `Remote`，`/remote/query`、`/file/parse?fileType=1`）
     * 导入解析结果里 `country` 为国家代码、`countryId` 由后端反查回填、`parseMsg` 为校验结果
     */
    interface BasicRemote {
      _id?: string;
      /** 所属偏远类别 _id（导入提交时前端逐行补齐） */
      remoteGroupId?: string;
      /** 国家 _id（后端由 country 代码反查回填） */
      countryId?: string;
      /** 国家代码（Excel 导入列「国家代码*」） */
      country?: string;
      state?: string;
      city?: string;
      area?: string;
      zipStart?: string;
      zipEnd?: string;
      /** 解析 / 校验结果（`通过` 表示合法） */
      parseMsg?: string;
    }
  }
}
