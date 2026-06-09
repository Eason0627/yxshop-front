/**
 * 图片工具 — 本地 fallback 占位，替换外部 dicebear.com 依赖
 */

// 内联 SVG data URI，不依赖任何外部资源
export const AVATAR_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%23F0F0F0" rx="20"/%3E%3Ccircle cx="20" cy="16" r="7" fill="%23C8C8C8"/%3E%3Cellipse cx="20" cy="36" rx="13" ry="9" fill="%23C8C8C8"/%3E%3C/svg%3E'

export const IMAGE_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"%3E%3Crect width="80" height="80" fill="%23F5F5F5" rx="4"/%3E%3Crect x="20" y="24" width="40" height="32" rx="2" fill="%23E0E0E0"/%3E%3Ccircle cx="30" cy="32" r="4" fill="%23C8C8C8"/%3E%3Cpath d="M20 48 l14-10 8 8 8-6 10 8" stroke="%23C8C8C8" stroke-width="2" fill="none"/%3E%3C/svg%3E'

export const SHOP_LOGO_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%23FFF3E8" rx="8"/%3E%3Cpath d="M8 14h24l-3 12H11L8 14z" fill="%23FFBB8A"/%3E%3Crect x="16" y="22" width="8" height="8" fill="%23FF6B00" rx="1"/%3E%3Cpath d="M10 14 L12 8h16l2 6" fill="%23FFBB8A"/%3E%3C/svg%3E'

/**
 * 为 img 元素绑定 onerror fallback
 * 用法：<img :src="url" v-img-fallback="AVATAR_PLACEHOLDER" />
 * 或直接：@error="onImgError($event, AVATAR_PLACEHOLDER)"
 */
export const onImgError = (e: Event, fallback = IMAGE_PLACEHOLDER) => {
  const img = e.target as HTMLImageElement
  if (img.src !== fallback) img.src = fallback
}

/**
 * Vue 指令：v-img-fallback
 * 注册后在 main.ts 使用：app.directive('img-fallback', imgFallbackDirective)
 */
export const imgFallbackDirective = {
  mounted(el: HTMLImageElement, binding: { value?: string }) {
    const fallback = binding.value ?? IMAGE_PLACEHOLDER
    el.addEventListener('error', () => { if (el.src !== fallback) el.src = fallback })
  },
}
