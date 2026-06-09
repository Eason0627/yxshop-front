<template>
  <div class="warning px-8 py-4 mt-4 bg-white">
    <div class="title flex item-center justify-between py-2">
      <div class="text py-1.5 font-bold">
        <span>库存预警</span>
      </div>
      <div
        class="more flex items-center px-4 py-1 text-sm border-[1px] border-solid border-[var(--info-border-color)] hover:bg-[var(--info-bg-color)] transition-all duration-300 cursor-pointer"
      >
        <span class="mr-2">查看库存</span>
        <el-icon><Right /></el-icon>
      </div>
    </div>
    <div class="content grid grid-cols-2 gap-4 mt-4">
      <div class="left">
        <div class="category grid grid-cols-3 gap-4">
          <div
            class="promptly p-4 bg-[--info-bg-color] cursor-pointer hover:bg-[--info-bg-hover-color] transition-all duration-300]"
          >
            <div class="text mb-2 text-sm">库存已空</div>
            <div class="num text-sm">
              <span class="mr-2 font-bold text-xl">{{ promptlyProduct }}</span>
              <span>件</span>
            </div>
          </div>
          <div
            class="soon p-4 bg-[--info-bg-color] cursor-pointer hover:bg-[--info-bg-hover-color] transition-all duration-300]"
          >
            <div class="text mb-2 text-sm">库存告急</div>
            <div class="num text-sm">
              <span class="mr-2 font-bold text-xl">{{ soonProduct }}</span>
              <span>件</span>
            </div>
          </div>
          <div
            class="warning p-4 bg-[--info-bg-color] cursor-pointer hover:bg-[--info-bg-hover-color] transition-all duration-300]"
          >
            <div class="text mb-2 text-sm">尽快补货</div>
            <div class="num text-sm">
              <span class="mr-2 font-bold text-xl">{{ warningProduct }}</span>
              <span>件</span>
            </div>
          </div>
        </div>
        <!-- 最紧急的三件 -->
        <div class="list mt-4">
          <div
            class="item flex mb-2 border-[1px] border-solid border-[var(--info-border-color)] hover:bg-[var(--info-bg-color)] transition-all duration-300 cursor-pointer"
            v-for="(item, index) in most_urgent_product"
            :key="index"
          >
            <div class="avatar w-12 h-12 mr-4 overflow-hidden">
              <img
                class="w-full h-full"
                :src="item ? item.main_image : ''"
                alt=""
              />
            </div>
            <div class="info flex-1 flex justify-between items-center text-sm">
              <span class="name mr-auto">
                {{ item ? item.product_name : "" }}
              </span>
              <span class="stock mr-4 text-xs">
                剩余库存:
                <span class="text-base font-bold">{{
                  item ? item.stock_quantity : ""
                }}</span>
              </span>
              <span
                class="px-2 py-1 mx-2 text-white text-xs hover:underline"
                :style="{
                  backgroundColor:
                    (item && item.stock_quantity) === 0
                      ? 'var(--error-color)'
                      : (item.stock_quantity as number) <
                      (item.safety_stock as number)
                      ? 'var(--warning-color)'
                      : 'var(--primary-color)',
                }"
                >{{
                  item.stock_quantity === 0
                    ? "立即补货"
                    : (item.stock_quantity as number) <
                      (item.safety_stock as number)
                    ? "库存告急"
                    : "尽快补货"
                }}</span
              >
            </div>
          </div>
        </div>
      </div>
      <div class="right">
        <div class="list">
          <div
            class="item flex mb-2 border-[1px] border-solid border-[var(--info-border-color)] hover:bg-[var(--info-bg-color)] transition-all duration-300 cursor-pointer"
            v-for="(item, index) in stock_warning"
            :key="index"
          >
            <div class="avatar w-12 h-12 mr-4 overflow-hidden">
              <img
                class="w-full h-full"
                :src="item ? item.main_image : ''"
                alt=""
              />
            </div>
            <div class="info flex-1 flex justify-between items-center text-sm">
              <span class="name mr-auto">
                {{ item ? item.product_name : "" }}
              </span>
              <span class="stock mr-4 text-xs">
                剩余库存:
                <span class="text-base font-bold">{{
                  item ? item.stock_quantity : ""
                }}</span>
              </span>
              <span
                class="px-2 py-1 mx-2 text-white text-xs hover:underline"
                :style="{
                  backgroundColor:
                    item.stock_quantity === 0
                      ? 'var(--error-color)'
                      : (item.stock_quantity as number) <
                      (item.safety_stock as number)
                      ? 'var(--warning-color)'
                      : 'var(--primary-color)',
                }"
                >{{
                  item.stock_quantity === 0
                    ? "立即补货"
                    : (item.stock_quantity as number) <
                      (item.safety_stock as number)
                    ? "库存告急"
                    : "尽快补货"
                }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import Product from "@/model/Product";
import { onBeforeMount } from "vue";
import { ref, reactive } from "vue";

// 立即补货商品
const promptlyProduct = ref(0);
// 尽快补货商品
const soonProduct = ref(0);
// 安排补货商品
const warningProduct = ref(0);

// 库存告急商品:
// 1. 商品库存为0，需立即补货 ( stock_quantity == 0)
// 2. 小于商品安全库存：需要尽快补货 ( stock_quantity < safety_stock)
// 3. 在商品安全库存数量边缘：需要安排补货 ( stock_quantity < safety_stock * 2)
const stock_warning = reactive<Product[]>([
  {
    product_id: 1, product_name: "波力海苔",
    main_image: "https://img.yzcdn.cn/vant/cat.jpeg",
    stock_quantity: 0, safety_stock: 20, sold_quantity: 88, product_status: 1,
  },
  {
    product_id: 2, product_name: "七度空间",
    main_image: "https://img.yzcdn.cn/vant/cat.jpeg",
    stock_quantity: 9, safety_stock: 20, sold_quantity: 21, product_status: 1,
  },
  {
    product_id: 3, product_name: "老干妈",
    main_image: "https://img.yzcdn.cn/vant/cat.jpeg",
    stock_quantity: 25, safety_stock: 20, sold_quantity: 32, product_status: 1,
  },
  {
    product_id: 4, product_name: "黄德友内裤",
    main_image: "https://img.yzcdn.cn/vant/cat.jpeg",
    stock_quantity: 0, safety_stock: 20, sold_quantity: 999, product_status: 1,
  },
]);

// 最紧急需要补货的三件
// 1. 24小时销量最高（大于0）
// 2. 库存为空
let most_urgent_product = reactive<Product[]>(new Array(3).fill(null));

// 比较销量并更新最紧急需要补货的商品列表
function compare_sold_quantity(product: Product, list: Product[]): Product[] {
  // 找到需要替换的位置
  let replaceIndex = -1;
  for (let i = 0; i < list.length; i++) {
    if (
      !list[i] ||
      (product.sold_quantity as number) > (list[i].sold_quantity as number)
    ) {
      replaceIndex = i;
      break;
    }
  }

  // 如果找到需要替换的位置
  if (replaceIndex !== -1) {
    // 如果数组已满，移除最后一个元素
    if (replaceIndex === 3) {
      return list.splice(replaceIndex, 1, product);
    }

    if (list.length === 3) {
      list.pop();
    }

    // 将后面的元素往后移动一位
    for (let i = list.length - 1; i > replaceIndex; i--) {
      list[i] = list[i - 1];
    }
    // 替换需要替换的位置
    list[replaceIndex] = product;
    // 删除原数组位置
    let index = stock_warning.findIndex(
      (item) => item.product_id == product.product_id
    );
    stock_warning.splice(index, 1);
  }

  list.filter((item) => item !== null);
  return list;
}

onBeforeMount(() => {
  // 处理库存告急商品, 获取最紧急的补货商品
  stock_warning.forEach((item: Product) => {
    if (
      item.stock_quantity !== undefined &&
      item.safety_stock !== undefined &&
      item.sold_quantity !== undefined
    ) {
      // 1. 初始化分类变量
      if (item.stock_quantity === 0) {
        promptlyProduct.value++;
        most_urgent_product = compare_sold_quantity(item, most_urgent_product);
      } else if (item.stock_quantity < item.safety_stock) {
        soonProduct.value++;
      } else if (item.stock_quantity < item.safety_stock * 2) {
        warningProduct.value++;
      }
    }
  });
  // 按库存升序排序
  stock_warning.sort((a, b) => {
    if (a.stock_quantity === undefined || b.stock_quantity === undefined) {
      return 0;
    }
    return a.stock_quantity - b.stock_quantity;
  });
});
</script>
<style lang="scss" scoped></style>
