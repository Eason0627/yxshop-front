<template>
  <div class="salesInfo p-8 mt-4 bg-white">
    <div class="head flex justify-between items-center">
      <div class="title font-bold text-lg text-left">销售统计</div>
      <div class="category flex text-xs">
        <div class="item cursor-pointer hover:underline">店铺订单</div>
        <el-divider direction="vertical" />
        <div class="item cursor-pointer hover:underline">收支明细</div>
        <el-divider direction="vertical" />
        <div class="item cursor-pointer hover:underline">进货单</div>
        <el-divider direction="vertical" />
        <div class="item cursor-pointer hover:underline">成本管理</div>
      </div>
    </div>
    <div class="content mt-8">
      <div class="balance flex justify-between items-end">
        <div class="text text-left">
          <div class="balance-title text-sm mb-2">店铺余额(元)</div>
          <div class="num font-semibold text-xl">0.00</div>
        </div>
        <div
          class="withdrawal p-8 py-2 text-sm text-white bg-[--primary-color] cursor-pointer hover:bg-[--primary-bg-hover-color] transition-all duration-300"
        >
          提现
        </div>
      </div>
      <div class="coupon_and_invoice flex mt-8">
        <div
          class="coupon flex-1 p-8 mr-4 text-left bg-[--info-bg-color] cursor-pointer hover:bg-[--info-bg-hover-color] transition-all duration-300]"
        >
          <div class="coupon-title text-xs mb-2">优惠券</div>
          <div class="coupon-num text-sm">
            <span class="mr-2 font-semibold text-xl">{{ 0 }}</span
            >张
          </div>
        </div>
        <div
          class="invoice flex-1 p-8 text-left bg-[--info-bg-color] cursor-pointer hover:bg-[--info-bg-hover-color] transition-all duration-300]"
        >
          <div class="invoice-title text-xs mb-2">可开发票金额</div>
          <div class="invoice-num text-sm">
            <span class="mr-2 font-semibold text-xl">{{ 0 }}</span
            >张
          </div>
        </div>
      </div>
      <div class="list flex flex-col mt-6">
        <div
          class="item flex items-center py-3 px-8 mb-4 text-xs border-[1px] border-[--info-border-color] cursor-pointer hover:bg-[--info-bg-color] transition-all duration-300"
        >
          <div class="text">
            <span class="title">店铺品牌</span>
            <span class="num ml-2">({{ 0 }})</span>
          </div>
          <div class="ml-auto text-[--theme-color]">查看详情</div>
        </div>
        <div
          class="item flex items-center py-3 px-8 mb-4 text-xs border-[1px] border-[--info-border-color] cursor-pointer hover:bg-[--info-bg-color] transition-all duration-300"
        >
          <div class="text">
            <span class="title">商品种类</span>
            <span class="num ml-2">({{ 0 }})</span>
          </div>
          <div class="ml-auto text-[--theme-color]">查看详情</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts"></script>
<style lang="scss" scoped>
.salesInfo {
  .content {
    .list {
      .item {
        position: relative;
        &::before {
          position: absolute;
          left: 20px;
          content: "";
          display: block;
          width: 2px;
          height: 1rem;
          background-color: var(--info-color);
        }
      }
    }
  }
}
</style>
