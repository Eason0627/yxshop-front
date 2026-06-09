<template>
  <div class="search flex items-center w-full mt-4">
    <div class="input w-full">
      <input
        class="w-full py-2 text-sm border-b-[1px] border-b-[var(--info-bg-color)] focus-visible:outline-0 focus-visible:shadow-none focus-visible:border-b-[1px] focus-visible:border-b-[var(--theme-color)] transition-all duration-300"
        type="text"
        placeholder="请输入想要查找的功能"
      />
    </div>
    <div class="searchIcon ml-[-20px]">
      <el-icon><Search /></el-icon>
    </div>
  </div>
</template>
<script setup lang="ts"></script>
<style lang="scss" scoped></style>
