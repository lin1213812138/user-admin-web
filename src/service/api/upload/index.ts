import { request } from '../../request';

/**
 * 通用文件上传（真实接口；form-data 字段名 file）
 *
 * - 不传 refId：走 /upload?dest=<n>，仅上传返回地址，不入附件库
 * - 传 refId：走 /upload/file?dest=<n>&refId=<id>，上传同时写入 File 附件库（refId 关联业务 id，如客户附件）
 *
 * @param file 待上传文件
 * @param dest 上传目录（1-用户 2-公司 3-打印格式 4-导出格式 5-服务商 6-工单 7-运单 8-交易 9-问题件 10-临时）
 * @param onProgress 上传进度回调（0..100）
 * @param refId 关联业务 id（传入则上传并入库 File 表）
 */
export function fetchUpload(file: File, dest: Api.Upload.Dest, onProgress?: (percent: number) => void, refId?: string) {
  const data = new FormData();
  data.append('file', file);

  return request<Api.Upload.Result>({
    url: refId ? '/upload/file' : '/upload',
    method: 'post',
    params: refId ? { dest, refId } : { dest },
    data,
    onUploadProgress: onProgress
      ? event => {
          if (!event.total) return;
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      : undefined
  });
}
