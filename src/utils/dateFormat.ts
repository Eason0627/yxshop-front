/**
 * 统一时间格式化工具
 * 不依赖任何第三方库，仅用原生 Intl API
 */

const zh = 'zh-CN'

/** 完整时间：2026-05-31 14:30:00 */
export const formatDateTime = (v?: string | number | null): string => {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d.getTime())) return String(v)
    return d.toLocaleString(zh, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).replace(/\//g, '-')
  } catch { return String(v) }
}

/** 仅日期：2026-05-31 */
export const formatDate = (v?: string | number | null): string => {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d.getTime())) return String(v)
    return d.toLocaleDateString(zh, { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-')
  } catch { return String(v) }
}

/** 短格式：5月31日 14:30 */
export const formatShort = (v?: string | number | null): string => {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d.getTime())) return String(v)
    return d.toLocaleString(zh, { month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return String(v) }
}

/** 相对时间：3分钟前 / 2小时前 / 昨天 / 3天前 */
export const fromNow = (v?: string | number | null): string => {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d.getTime())) return String(v)
    const diff = Date.now() - d.getTime()
    const abs = Math.abs(diff)
    if (abs < 60_000)           return '刚刚'
    if (abs < 3_600_000)        return `${Math.floor(abs / 60_000)}分钟前`
    if (abs < 86_400_000)       return `${Math.floor(abs / 3_600_000)}小时前`
    if (abs < 2 * 86_400_000)   return '昨天'
    if (abs < 7 * 86_400_000)   return `${Math.floor(abs / 86_400_000)}天前`
    return formatDate(v)
  } catch { return String(v) }
}

/** 从 ISO / LocalDateTime 字符串安全截取 YYYY-MM-DD HH:mm:ss（不依赖 Date 解析）*/
export const safeFormat = (v?: string | null): string => {
  if (!v) return '—'
  // 替换 T 分隔符，截取前 19 位
  return v.replace('T', ' ').substring(0, 19)
}
