/**
 * useListPage — 列表页通用可组合函数
 *
 * 封装：分页状态、搜索对象、日期范围、加载/重置/翻页
 * 消除全站 ~35 个列表页的重复样板代码
 *
 * 用法：
 *   const { loading, tableData, total, pageNum, pageSize,
 *           search, dateRange, loadData, resetSearch } =
 *     useListPage(adminOrderApi.list, { keyword: '', status: null })
 */
import { ref, reactive, onMounted } from 'vue'
import { parsePageResult } from '@/utils/apiHelper'

type FetchFn<S> = (params: S & { pageNum: number; pageSize: number; startDate?: string; endDate?: string }) => Promise<any>

interface ListPageOptions {
  /** 初始每页条数，默认 20 */
  pageSize?: number
  /** 挂载后自动请求，默认 true */
  immediate?: boolean
}

export function useListPage<T = any, S extends Record<string, any> = Record<string, any>>(
  fetchFn: FetchFn<S>,
  defaultSearch: S,
  options: ListPageOptions = {},
) {
  const { pageSize: initPageSize = 20, immediate = true } = options

  const loading   = ref(false)
  const tableData = ref<T[]>([])
  const total     = ref(0)
  const pageNum   = ref(1)
  const pageSize  = ref(initPageSize)
  const dateRange = ref<string[]>([])

  // 深拷贝初始值，用于 reset
  const _defaults = JSON.parse(JSON.stringify(defaultSearch)) as S
  const search    = reactive<S>({ ..._defaults })

  const loadData = async () => {
    loading.value = true
    try {
      const params = {
        ...search,
        pageNum:  pageNum.value,
        pageSize: pageSize.value,
        ...(dateRange.value[0] ? { startDate: dateRange.value[0] } : {}),
        ...(dateRange.value[1] ? { endDate:   dateRange.value[1] } : {}),
      } as S & { pageNum: number; pageSize: number; startDate?: string; endDate?: string }

      const res = await fetchFn(params)
      const { records, total: t } = parsePageResult<T>(res)
      tableData.value = records as any
      total.value     = t
    } catch {
      // 错误已由 fetch 客户端拦截器统一弹出，这里不重复处理
    } finally {
      loading.value = false
    }
  }

  /** 重置所有搜索条件并重新加载 */
  const resetSearch = () => {
    Object.assign(search, _defaults)
    dateRange.value = []
    pageNum.value   = 1
    loadData()
  }

  /** 搜索按钮触发（重置到第1页）*/
  const doSearch = () => {
    pageNum.value = 1
    loadData()
  }

  /** 分页变更 */
  const handlePageChange = () => loadData()

  if (immediate) onMounted(loadData)

  return {
    loading,
    tableData,
    total,
    pageNum,
    pageSize,
    search,
    dateRange,
    loadData,
    resetSearch,
    doSearch,
    handlePageChange,
  }
}
