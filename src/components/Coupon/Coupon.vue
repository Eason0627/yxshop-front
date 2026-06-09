<template>
  <div
    class="coupon flex font-mono bg-[var(--error-color)] cursor-pointer transition-all duration-300"
  >
    <div class="left flex flex-col justify-center p-2">
      <div class="type w-8 text-xl text-white">{{ coupon.type }}</div>
    </div>
    <div class="right flex-1 p-2">
      <div class="price text-white">
        <span class="num text-4xl font-medium">{{ coupon.price }}</span>
        <span class="unit text-md font-bold">元</span>
      </div>
      <div class="condition text-md text-white">{{ coupon.condition }}</div>
      <div class="timeRange text-xs text-white">
        活动日期：{{ coupon.timeRange }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watchEffect } from "vue";

const props = defineProps({
  coupon: {
    type: Object,
    default: () => ({}),
  },
});

const coupon = ref(props.coupon);

watchEffect(() => {
  coupon.value = props.coupon;
});
</script>
<style lang="scss" scoped>
.coupon {
  position: relative;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.3);
  &:hover {
    transform: translateY(-10px);
  }
  .left {
    position: relative;
    border-right: 2px dashed #fff;
    .type {
      writing-mode: vertical-lr;
    }
    &::before,
    &::after {
      content: "";
      position: absolute;
      right: -12px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #fff;
    }
    &::before {
      top: -12px;
    }
    &::after {
      bottom: -12px;
    }
  }
  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 0;
    width: 6px;
    height: 100%;
    background: radial-gradient(
        circle at left,
        transparent 6px,
        var(--error-color) 0
      )
      left / 6px 20px;
  }
  &::before {
    left: -6px;
    background: radial-gradient(
        circle at left,
        transparent 6px,
        var(--error-color) 0
      )
      left / 6px 20px;
    filter: drop-shadow(-4px 0 3px rgba(0, 0, 0, 0.3));
  }
  &::after {
    right: -6px;
    background: radial-gradient(
        circle at right,
        transparent 6px,
        var(--error-color) 0
      )
      right / 6px 20px;
    filter: drop-shadow(4px 0 3px rgba(0, 0, 0, 0.3));
  }
}
</style>
