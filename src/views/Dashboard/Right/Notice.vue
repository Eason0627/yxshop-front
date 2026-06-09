<template>
  <div class="notice p-8 mt-4 bg-white">
    <div class="head flex justify-between items-center">
      <div class="nav flex items-center">
        <div
          class="nav_item p-2 mx-2 border-b-2 border-b-transparent cursor-pointer hover:border-b-2 hover:border-b-[var(--theme-color)] transition-all duration-300"
          :style="{
            font: nav_active === 0 ? 'font-bold' : '',
            borderBottom:
              nav_active === 0 ? '2px solid var(--theme-color)' : '',
          }"
          @click="nav_active = 0"
        >
          <span>品牌动态</span>
        </div>
        <div
          class="nav_item p-2 mx-2 border-b-2 border-b-transparent cursor-pointer hover:border-b-2 hover:border-b-[var(--theme-color)] transition-all duration-300"
          :style="{
            font: nav_active === 1 ? 'font-bold' : '',
            borderBottom:
              nav_active === 1 ? '2px solid var(--theme-color)' : '',
          }"
          @click="nav_active = 1"
        >
          <span>最新公告</span>
        </div>
      </div>
      <div
        class="more flex items-center px-4 py-2 text-sm border-[1px] border-solid border-[var(--info-border-color)] hover:bg-[var(--info-bg-color)] transition-all duration-300 cursor-pointer"
      >
        <span class="mr-2">查看更多</span>
        <el-icon><Right /></el-icon>
      </div>
    </div>
    <div class="content w-full mt-4 overflow-hidden">
      <Transition name="brand">
        <div class="brand_content w-full h-full" v-show="nav_active === 0">
          <div
            class="empty flex justify-center items-center w-full min-h-24"
            v-if="!brand_list.length"
          >
            暂无品牌动态
          </div>
          <div class="list">
            <div
              class="item flex justify-between items-center p-4 border-b-[1px] border-solid border-[var(--info-border-color)] cursor-pointer hover:bg-[var(--info-bg-color)] transition-all duration-300"
              v-for="(item, index) in brand_list"
              :key="index"
            >
              <div class="left flex justify-center items-center mr-4">
                <div class="brand_img w-16 h-16 rounded-full overflow-hidden">
                  <img class="object-cover" :src="item.brandImg" alt="" />
                </div>
              </div>
              <div class="right flex-1 flex flex-col justify-between text-left">
                <div class="title flex justify-between items-center">
                  <span class="text-sm font-bold">
                    {{ item.title }}
                  </span>
                  <span class="time text-xs text-[var(--info-text-color)]">
                    {{ item.time }}
                  </span>
                </div>

                <div
                  class="desc max-h-10 mt-2 text-xs text-[var(--info-text-color)]"
                >
                  {{ item.content }}
                </div>
                <div class="more flex justify-end items-center">
                  <el-icon><Right /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
      <Transition name="notice">
        <div class="notice_content w-full h-full" v-show="nav_active === 1">
          <div
            class="empty flex justify-center items-center w-full min-h-24"
            v-if="!notice_list.length"
          >
            <span>暂无公告</span>
          </div>
          <div class="list">
            <div
              class="item flex flex-col p-4 text-left border-b-[1px] border-solid border-[var(--info-border-color)] cursor-pointer hover:bg-[var(--info-bg-color)] transition-all duration-300"
              v-for="item in notice_list"
            >
              <div class="title">
                <span
                  class="px-2 py-0.5 mr-2 text-xs text-[--primary-color] border-[1px] border-[--primary-color] bg-[--primary-bg-color]"
                  >壹心</span
                >
                <span class="text-sm">{{ item.title }}</span>
              </div>
              <div class="time mt-4 text-xs">{{ item.time }}</div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

const nav_active = ref(0);
const brand_list = ref([
  {
    brandID: 1,
    brand: "品牌1",
    brandImg: "https://picsum.photos/200/300",
    title: "2023年春季新品上市",
    content:
      "2023年春季新品上市2023年春季新品上市2023年春季新品上市2023年春季新品上市2023年春季新品上市2023年春季新品上市",
    time: "2023-01-01",
  },
  {
    brandID: 1,
    brand: "品牌1",
    brandImg: "https://picsum.photos/200/300",
    title: "2023年春季新品上市",
    content:
      "2023年春季新品上市2023年春季新品上市2023年春季新品上市2023年春季新品上市2023年春季新品上市2023年春季新品上市",
    time: "2023-01-01",
  },
  {
    brandID: 1,
    brand: "品牌1",
    brandImg: "https://picsum.photos/200/300",
    title: "2023年春季新品上市",
    content:
      "2023年春季新品上市2023年春季新品上市2023年春季新品上市2023年春季新品上市2023年春季新品上市2023年春季新品上市",
    time: "2023-01-01",
  },
]);
const notice_list = ref([
  {
    noticeID: 1,
    title: "2023年春季新品上市",
    time: "2023-01-01",
  },
]);
</script>
<style lang="scss" scoped>
.notice {
  .content {
    .desc {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }
}

.brand-enter-active,
.brand-leave-active {
  transition: all 0.5s ease;
}

.brand-enter-from,
.brand-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.brand-leave-to {
  display: none; // 解决过渡动画抖动
}

.notice-enter-active,
.notice-leave-active {
  transition: all 0.5s ease;
}

.notice-enter-from,
.notice-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.notice-leave-to {
  display: none;
}
</style>
