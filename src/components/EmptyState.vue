<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
    <i :class="icon" class="text-[48px] text-[#D9D9D9] mb-3"></i>
    <p class="text-[14px] text-[#999]">{{ tip }}</p>
    <p v-if="subTip" class="text-[12px] text-[#CCC] mt-1.5">{{ subTip }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  /** Remix Icon 类名，如 ri-inbox-2-line */
  icon?: string
  /** 主提示文字 */
  tip?: string
  /** 次级提示文字 */
  subTip?: string
}>(), {
  icon:    'ri-inbox-2-line',
  tip:     '暂无数据',
  subTip:  '',
})
</script>
