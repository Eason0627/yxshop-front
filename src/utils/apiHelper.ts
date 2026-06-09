/**
 * API 响应统一解析工具
 * 兼容后端三种分页格式：
 *   { records, total }  /  { list, total }  /  直接数组
 */

export interface PageData<T> {
  records: T[]
  total: number
  pageNum?: number
  pageSize?: number
}

/** 解析分页响应 */
export function parsePageResult<T>(response: any): PageData<T> {
  const data = response?.data?.data ?? response?.data ?? response ?? {}
  if (Array.isArray(data)) {
    return { records: data as T[], total: data.length }
  }
  return {
    records: data.records ?? data.list ?? data.rows ?? data.data ?? [],
    total: Number(data.total ?? data.totalCount ?? 0),
    pageNum: data.pageNum ?? data.current,
    pageSize: data.pageSize ?? data.size,
  }
}

/** 解析单条数据响应 */
export function parseDataResult<T>(response: any): T | null {
  return response?.data?.data ?? response?.data ?? null
}

/** 判断响应是否成功（code === 200 或 HTTP 2xx） */
export function isSuccess(response: any): boolean {
  const code = response?.data?.code ?? response?.code
  return code === undefined || code === 200 || code === 0
}
