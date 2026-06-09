<template>
  <div class="Post-Sale p-8 mt-4 bg-white">
    <div class="head">
      <div class="title font-bold text-lg text-left">售后服务</div>
    </div>
    <div class="content mt-4">
      <div class="list mx-4 grid grid-cols-2 gap-4 text-left">
        <div
          class="item px-8 py-4 bg-[--info-bg-color] cursor-pointer hover:bg-[--info-bg-hover-color] transition-all duration-300]"
        >
          <div class="text mb-2 text-sm">退货退款</div>
          <div class="num font-bold text-xl">{{ refundStats.returnAndRefund.count }}</div>
        </div>
        <div
          class="item px-8 py-4 bg-[--info-bg-color] cursor-pointer hover:bg-[--info-bg-hover-color] transition-all duration-300]"
        >
          <div class="text mb-2 text-sm">仅退货</div>
          <div class="num font-bold text-xl">{{ refundStats.returnOnly.count }}</div>
        </div>
        <div
          class="item px-8 py-4 bg-[--info-bg-color] cursor-pointer hover:bg-[--info-bg-hover-color] transition-all duration-300]"
        >
          <div class="text mb-2 text-sm">仅退款</div>
          <div class="num font-bold text-xl">{{ refundStats.refundOnly.count }}</div>
        </div>
        <div
          class="item px-8 py-4 bg-[--info-bg-color] cursor-pointer hover:bg-[--info-bg-hover-color] transition-all duration-300]"
        >
          <div class="text mb-2 text-sm">退换货</div>
          <div class="num font-bold text-xl">{{ refundStats.exchange.count }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, inject, reactive } from "vue";
import type { HttpClient } from '@/utils/http';

const http: HttpClient = inject("http") as HttpClient; /// http 实例
const shop_id = ref<string | null>(null);

const refundStats = reactive({
  returnAndRefund: { label: '退货退款', count: 0 }, // 左上角
  returnOnly: { label: '仅退货', count: 0 },        // 右上角
  refundOnly: { label: '仅退款', count: 0 },       // 左下角
  exchange: { label: '退换货', count: 0 }          // 右下角
})

const getAfterSaleCount = () => {
  if (shop_id.value) {
    http.get(`/process/getAfterSaleCount?shopId=${shop_id.value}`)  // 将shopid改为shopId
    .then(response => {
        const data = (response as any).data;
        const orderData = data.data;
        // 更新售后统计数据
        refundStats.returnAndRefund.count = orderData.returnAndRefund || 0;
        refundStats.returnOnly.count = orderData.returnOnly || 0;
        refundStats.refundOnly.count = orderData.refundOnly || 0;
        refundStats.exchange.count = orderData.exchange || 0;
      })
      .catch(error => {
        console.error('获取售后数据失败:', error);
      });  
  }
}

onMounted(() => {
  // 从localStorage获取用户ID
  const shopinfo: any = JSON.parse(localStorage.getItem("currentShop") || "{}"); // 当前登录用户
// 为避免类型错误，先检查 shopinfo.shop_id 是否为 undefined，如果是则赋值为 null，否则转换为字符串
  shop_id.value = typeof shopinfo.shop_id === 'undefined' ? null : String(shopinfo.shop_id);

  // 获取今日订单数据
 
  getAfterSaleCount();
});

</script>
<style lang="scss" scoped></style>
