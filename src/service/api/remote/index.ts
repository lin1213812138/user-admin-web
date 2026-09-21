import { request } from '../../request';

/**
 * 偏远数据明细接口（tms-user，/remote/* 与 /file/parse）。
 *
 * - 查询：`/remote/query`，地区条件（countryId / city / zip）为**顶层字段**（后端 buildParams 读取），
 *   另可透传 `where`；`zip` 为精确命中（后端按 zipStart<=zip<=zipEnd 区间匹配）。
 * - 解析：`/file/parse?fileType=1`（1 = 偏远数据），multipart 字段名 `file`；
 *   表头须逐字等于 `国家代码*` / `城市` / `起始邮编` / `结束邮编`，非法行由后端直接丢弃，
 *   返回的 list 只含合法行，并已回填 `countryId`、`parseMsg='通过'`。
 * - 导入：`/remote/batch/create`，**先按 remoteGroupId 全删再插入（覆盖语义）**，
 *   同时回写该类别的 remoteCount；后端只校验 list[0].remoteGroupId，逐行需前端补齐。
 */

export interface RemoteQueryParams {
  page?: number;
  size?: number;
  where?: Record<string, unknown>;
  /** 国家 _id */
  countryId?: string;
  /** 城市（后端按 lowerCity 精确匹配） */
  city?: string;
  /** 邮编（后端按 zipStart / zipEnd 区间匹配） */
  zip?: string;
  remoteGroupId?: string;
}

export interface RemoteQueryResult {
  list: Api.DataManage.BasicRemote[];
  total: number;
}

/** 偏远数据明细列表（/remote/query） */
export function fetchGetRemoteList(params: RemoteQueryParams) {
  return request<RemoteQueryResult>({
    url: '/remote/query',
    method: 'post',
    data: { ...params, where: params.where ?? {} }
  });
}

/**
 * 解析偏远数据 Excel（/file/parse），仅解析不落库。
 *
 * - `dest` **必传**：该路由先经过通用上传中间件（`fileService.file`），
 *   缺失 `dest` 会直接抛 `100030 上传目录不能为空`；解析完成后后端会 `fs.unlink` 删除文件，
 *   故用 `10-临时`（destMap: 10 → temp）。
 * - `fileType=1` 对应 `fileParseService.serviceMap[1] = remoteService`。
 */
export function fetchParseRemoteFile(file: File) {
  const data = new FormData();
  data.append('file', file);

  return request<{ list: Api.DataManage.BasicRemote[] }>({
    url: '/file/parse',
    method: 'post',
    params: { dest: 10, fileType: 1 },
    data
  });
}

/**
 * 单行校验（/remote/check）：预览行编辑保存后重新校验用。
 *
 * - 后端 `ctrl.check` 会 `omit(body, 'parseMsg')` 后按 `single: 1` 校验，返回 `{ list: [{ ...remote, parseMsg }] }`；
 * - **会按 `country`（国家代码）反查并回填 `countryId`** ⇒ 改了国家代码必须用返回结果整行替换，否则落库归属错误；
 * - `single: 1` 会**跳过「国家代码必填」**这条（`services/remote.js` 的 `if (!single)` 分支），前端需自行补该必填校验。
 */
export function fetchCheckRemote(remote: Api.DataManage.BasicRemote) {
  return request<{ list: Api.DataManage.BasicRemote[] }>({
    url: '/remote/check',
    method: 'post',
    data: { ...remote }
  });
}

/** 导入偏远数据（/remote/batch/create，覆盖该类别全部明细），提交前逐行补齐 remoteGroupId */
export function fetchBatchCreateRemote(remoteGroupId: string, list: Api.DataManage.BasicRemote[]) {
  return request<unknown>({
    url: '/remote/batch/create',
    method: 'post',
    data: { list: list.map(item => ({ ...item, remoteGroupId })) }
  });
}
