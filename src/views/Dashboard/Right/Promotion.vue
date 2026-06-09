<template>
  <div class="promotion relative flex flex-col px-8 py-4 mt-4 bg-white">
    <div class="title mb-4 text-left font-bold">
      全平台

      <el-tooltip class="box-item" effect="light" placement="top">
        <span
          class="mx-2 text-[--primary-color] cursor-pointer hover:underline"
          >{{ "夏日狂欢购" }}</span
        >
        <template #content>
          <!-- 报名时间 -->
          <div class="text-xs text-[--theme-color]">
            报名时间：2024.07.01 - 2024.07.31
          </div>
          <!-- 促销时间 -->
          <div class="text-xs text-[--theme-color]">
            促销时间：2024.08.01 - 2024.08.31
          </div>
        </template>
      </el-tooltip>
      邀您参与！！！
    </div>
    <div class="dec">
      <div class="item flex items-center text-sm mb-2">
        <div
          class="flex justify-center items-center w-3 h-3 mr-4 text-[8px] text-white rounded-full bg-[--primary-color]"
        >
          <el-icon><Select /></el-icon>
        </div>
        <div class="text">参与活动的商品将在首页显著位置展示</div>
      </div>
      <div class="item flex items-center text-sm mb-2">
        <div
          class="flex justify-center items-center w-3 h-3 mr-4 text-[8px] text-white rounded-full bg-[--primary-color]"
        >
          <el-icon><Select /></el-icon>
        </div>
        <div class="text">提供额外的广告位支持</div>
      </div>
    </div>
    <div
      class="join absolute bottom-4 right-8 px-4 py-1.5 text-white text-xs bg-[--primary-color] cursor-pointer hover:bg-[--primary-bg-hover-color] transition-all duration-300"
    >
      立即参与
    </div>
  </div>
</template>
<script setup lang="ts">
</script>
<style lang="scss" scoped></style>
