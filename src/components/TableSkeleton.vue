<template>
  <div class="p-4 space-y-3">
    <div v-for="i in rows" :key="i" class="flex items-center gap-4 animate-pulse">
      <!-- 序号列 -->
      <div class="h-3.5 bg-[#F0F0F0] rounded w-8 flex-shrink-0"></div>
      <!-- 主要内容列（宽） -->
      <div class="h-3.5 bg-[#F0F0F0] rounded flex-1"></div>
      <!-- 次要列 -->
      <div class="h-3.5 bg-[#F0F0F0] rounded w-24 flex-shrink-0"></div>
      <div class="h-3.5 bg-[#F0F0F0] rounded w-20 flex-shrink-0"></div>
      <!-- 状态标签 -->
      <div class="h-5 bg-[#F0F0F0] rounded-full w-14 flex-shrink-0"></div>
      <!-- 操作列 -->
      <div class="h-3.5 bg-[#F0F0F0] rounded w-16 flex-shrink-0"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 6 })
</script>
