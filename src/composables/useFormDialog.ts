/**
 * useFormDialog — 表单对话框通用可组合函数
 *
 * 封装：弹窗状态、编辑/新增模式、表单重置、保存逻辑、loading 状态
 * 消除全站 ~20 个表单对话框的重复样板代码
 *
 * 用法：
 *   const { visible, saving, editId, form, open, close, save } = useFormDialog(
 *     { username: '', email: '' },              // 默认值（同时用于重置）
 *     {
 *       createFn: adminUserApi.create,
 *       updateFn: (id, data) => adminUserApi.update(id, data),
 *       afterSave: loadData,
 *     }
 *   )
 */
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

interface FormDialogOptions<T> {
  /** 新增时调用 */
  createFn?: (form: T) => Promise<any>
  /** 编辑时调用，第一参数为 editId */
  updateFn?: (id: any, form: T) => Promise<any>
  /** 保存成功后的回调（如刷新列表）*/
  afterSave?: () => void
  /** 自定义成功提示，默认"保存成功" */
  successMsg?: string
}

export function useFormDialog<T extends Record<string, any>>(
  defaultForm: T,
  options: FormDialogOptions<T> = {},
) {
  const { createFn, updateFn, afterSave, successMsg = '保存成功' } = options

  const visible = ref(false)
  const saving  = ref(false)
  const editId  = ref<any>(null)

  // 深拷贝默认值，确保 reset 不受引用影响
  const _defaults = JSON.parse(JSON.stringify(defaultForm)) as T
  const form      = reactive<T>({ ..._defaults })

  /**
   * 打开弹窗
   * @param row 传入时为编辑模式，不传为新增模式
   *            row 的字段会合并到 form（多余字段忽略，少的字段用默认值）
   */
  const open = (row?: (Partial<T> & { id?: any }) | null) => {
    editId.value = row?.id ?? null
    // 先重置为默认值，再覆盖传入的字段
    Object.assign(form, _defaults, row ?? {})
    visible.value = true
  }

  const close = () => { visible.value = false }

  const save = async () => {
    saving.value = true
    try {
      const payload = { ...form } as T
      if (editId.value != null && updateFn) {
        await updateFn(editId.value, payload)
      } else if (createFn) {
        await createFn(payload)
      }
      ElMessage.success(successMsg)
      visible.value = false
      afterSave?.()
    } catch {
      // 错误已由 fetch 客户端拦截器统一弹出
    } finally {
      saving.value = false
    }
  }

  return { visible, saving, editId, form, open, close, save }
}
