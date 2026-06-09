<template>
  <div class="recently mt-2">
    <div class="title w-full py-2 text-left text-sm">最近访问</div>
    <div class="list grid grid-cols-5 gap-3">
      <div
        class="list_item px-4 py-1.5 text-sm text-left bg-[var(--info-bg-color)] hover:bg-[var(--info-bg-hover-color)] transition-all duration-300 cursor-pointer"
        v-for="item in recently_list"
        @click="handleNavigate(item.path)"
      >
        {{ item.name }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";
// 最近访问数组
const router = useRouter();
const recently_list = reactive([
  { name: "商品列表", path: "/product/list" },
  { name: "订单列表", path: "/order/list" },
  { name: "物流管理", path: "/order/delivery/preview" },
  { name: "销售数据", path: "/home/marketing" },
  { name: "促销活动", path: "/promotion" },
  { name: "店铺信息", path: "/shop/info" },
]);
// 处理导航跳转
const handleNavigate = (path: string) => {
  router.push(path);
}
</script>
<style lang="scss" scoped></style>
