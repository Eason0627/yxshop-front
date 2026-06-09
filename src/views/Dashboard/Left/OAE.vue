<template>
  <div class="order_and_evaluate grid grid-cols-2 gap-4 w-full mt-6">
    <div class="order px-8 py-4 bg-white">
      <div class="title flex item-center justify-between py-2">
        <div class="text py-1.5 font-bold">
          <span>订单总数</span>
        </div>
        <div
          class="more flex items-center px-4 py-1 text-sm border-[1px] border-solid border-[var(--info-border-color)] hover:bg-[var(--info-bg-color)] transition-all duration-300 cursor-pointer"
          @click="goToOrderList"
        >
          <span class="mr-2">查看订单</span>
          <el-icon><Right /></el-icon>
        </div>
      </div>
      <div class="content h-20 flex items-center justify-center">
        <div class="item flex flex-col items-start justify-between py-2">
          <div class="text mb-2 text-sm"><span>今日订单</span></div>
          <div class="num text-2xl font-medium"><span>{{ todayOrder }}</span></div>
        </div>
        <div
          class="divider w-[1px] h-[50%] mx-8 bg-[var(--info-border-color)]"
        ></div>
        <div class="item flex flex-col items-start justify-between py-2">
          <div class="text mb-2 text-sm"><span>总订单</span></div>
          <div class="num text-2xl font-medium"><span>{{ totalOrder }}</span></div>
        </div>
      </div>
      <div
        class="divider w-full h-4 my-4 mx-auto bg-[var(--info-border-color)]"
      ></div>
      <div class="category flex items-center justify-evenly w-full">
        <div class="item flex flex-col mr-3 cursor-pointer">
          <div class="text text-sm">
            <span
              class="circle inline-block w-2.5 h-2.5 mr-2 rounded-full bg-[var(--success-color)]"
            ></span>
            <span>确认收货</span>
          </div>
          <div class="num flex justify-center items-center text-xl font-medium">
            <span>{{ cancelledOrders }}</span>
          </div>
        </div>
        <div class="item flex flex-col mr-3 cursor-pointer">
          <div class="text text-sm">
            <span
              class="circle inline-block w-2.5 h-2.5 mr-2 rounded-full bg-[var(--warning-color)]"
            ></span>
            <span>待收货</span>
          </div>
          <div class="num flex justify-center items-center text-xl font-medium">
            <span>{{ pendingOrders }}</span>
          </div>
        </div>
        <div class="item flex flex-col mr-3 cursor-pointer">
          <div class="text text-sm">
            <span
              class="circle inline-block w-2.5 h-2.5 mr-2 rounded-full bg-[var(--primary-color)]"
            ></span>
            <span>未发货</span>
          </div>
          <div class="num flex justify-center items-center text-xl font-medium">
            <span>{{ confirmedOrders }}</span>
            
          </div>
        </div>
        <!-- <div class="item flex flex-col mr-3 cursor-pointer">
          <div class="text text-sm">
            <span
              class="circle inline-block w-2.5 h-2.5 mr-2 rounded-full bg-[var(--error-color)]"
            ></span>
            <span>售后服务</span>
          </div>
          <div class="num flex justify-center items-center text-xl font-medium">
            <span>0</span>
            <div
              class="divider w-[1px] h-6 mx-2 bg-[var(--info-border-color)]"
            ></div>
            <span>0</span>
          </div>
        </div> -->
      </div>
    </div>
    <div class="evaluate px-8 py-4 bg-white">
      <div class="title flex item-center justify-between py-2">
        <div class="text py-1 font-bold">
          <span>店铺评分</span>
        </div>
        <div
          class="more flex items-center px-4 py-1.5 text-sm border-[1px] border-solid border-[var(--info-border-color)] hover:bg-[var(--info-bg-color)] transition-all duration-300 cursor-pointer"
        >
          <span class="mr-2">查看更多</span>
          <el-icon><Right /></el-icon>
        </div>
      </div>
      <div class="content flex justify-between h-16 mt-4 overflow-hidden">
        <div class="left flex flex-col items-start">
          <div class="text my-2 text-sm">
            <span>您的店铺评分为</span>
            <el-tooltip placement="right">
              <span>
                <span
                  class="mx-2 cursor-pointer"
                  :style="{
                    color: `${
                      computedScore >= 90
                        ? 'var(--success-color)'
                        : score >= 80
                        ? 'var(--primary-color)'
                        : score >= 60
                        ? 'var(--warning-color)'
                        : 'var(--error-color)'
                    }`,
                  }"
                  >{{
                    computedScore >= 90
                      ? "优秀"
                      : score >= 80
                      ? "良好"
                      : score >= 60
                      ? "一般"
                      : "不合格"
                  }}
                </span>
                <el-icon><QuestionFilled /></el-icon>
              </span>
              <template #content>
                Tips: <br />
                优秀：90-100 <br />
                良好：80-90 <br />
                一般：60-80 <br />
                不合格：0-60
              </template>
            </el-tooltip>
          </div>
          <div class="score text-xl text-medium">{{ computedScore }}</div>
        </div>
        <div class="right relative">
          <div
            class="circle w-32 h-32 rounded-full border-8"
            :style="{
              borderColor: `${
                computedScore >= 90
                  ? 'var(--success-color)'
                  : score >= 80
                  ? 'var(--primary-color)'
                  : score >= 60
                  ? 'var(--warning-color)'
                  : 'var(--error-color)'
              }`,
            }"
          ></div>
          <div
            class="pointer"
            :style="{ transform: `rotate(-${180 - computedScore * 1.8}deg)` }"
          ></div>
        </div>
      </div>
      <div class="category flex mt-8">
        <div class="item flex flex-col items-start mr-8">
          <div class="text mb-2 text-sm">好评评价</div>
          <div class="num text-xl text-medium">{{goodReviews}}</div>
        </div>
        <div class="item flex flex-col items-start mr-8">
          <div class="text mb-2 text-sm">差评评价</div>
          <div class="num text-xl text-medium">{{ badReviews }}</div>
        </div>
        <div class="item flex flex-col items-start mr-8">
          <div class="text mb-2 text-sm">投诉订单</div>
          <div class="num text-xl text-medium">{{ complaints }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref,computed ,onMounted,inject} from "vue";
import { useRouter } from 'vue-router';
import type { HttpClient } from '@/utils/http';
import Shop from "@/model/Shop";
// 店铺评分
const score = ref(100);
// 订单数据
const todayOrder = ref(0); // 今日订单
const totalOrder = ref(0); // 总订单
const cancelledOrders = ref(0);
const pendingOrders = ref(0); 
const confirmedOrders = ref(0);
// 原始数据（可替换为props或API获取）
const goodReviews = ref(10)   // 好评数
const badReviews = ref(2)     // 差评数
const complaints = ref(0)     // 投诉数

// 权重配置（可抽离为外部配置文件）
const WEIGHTS = {
  GOOD: 10,    // 好评权重
  BAD: 5,      // 差评权重
  COMPLAINT: 20 // 投诉权重
}

// 计算综合评分
const computedScore = computed(() => {
  return Math.max(0, 
    (WEIGHTS.GOOD * goodReviews.value) - 
    (WEIGHTS.BAD * badReviews.value) - 
    (WEIGHTS.COMPLAINT * complaints.value)
  )
})
const http: HttpClient = inject("http") as HttpClient; /// http 实例
const shop_id = ref<string | null>(null);

const getOrderStatus = () => {
  if (shop_id.value) {
    http.get(`/orders/getOrderNumByStatus?shopId=${shop_id.value}`)
    .then(response => {
        const statusData = (response as any).data?.data;
        
        if(statusData.order_status === "确认收货") {
          cancelledOrders.value = statusData.statusNum;
        }
        if(statusData.order_status === "待收货") {
          pendingOrders.value = statusData.statusNum;
        }
        if(statusData.order_status === "待发货") {
          confirmedOrders.value = statusData.statusNum;
        }
        if(statusData.order_status === "Delivered") {
          cancelledOrders.value = statusData.statusNum;
        }
        if(statusData.order_status === "Shipped") {
          pendingOrders.value = statusData.statusNum;
        }
        if(statusData.order_status === "Confirmed") {
          confirmedOrders.value = statusData.statusNum;
        }
      
      })
      .catch(error => {
        console.error('获取订单状态失败:', error);
      });  
  }
}

const getTodayOrderNum = () => {
  if (shop_id.value) {
    http.get(`/orders/getTodayOrderNum?shopid=${shop_id.value}`)
    .then(response => {
        const orderData = (response as any).data?.data;
        // 更新今日订单和总订单数值
        todayOrder.value = orderData.todayOrders || 0;
        totalOrder.value = orderData.totalOrders || 0;
      })  
  }
}

onMounted(() => {
  // 从localStorage获取用户ID
  const shopinfo: Shop = JSON.parse(localStorage.getItem("currentShop") || "") as Shop; // 当前登录用户
// 为避免类型错误，先检查 shopinfo.shop_id 是否为 undefined，如果是则赋值为 null，否则转换为字符串
  shop_id.value = typeof shopinfo.shop_id === 'undefined' ? null : String(shopinfo.shop_id);

  // 获取今日订单数据
 
  getTodayOrderNum();
  getOrderStatus();
});


// 引入 useRouter 函数
const router = useRouter();
const goToOrderList = () => {
  router.push('/order/list');
};
</script>


<style lang="scss" scoped>
.pointer {
  position: absolute;
  bottom: 5px;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 2px 0 2px 64px; /* 上 左 下 右 */
  border-color: transparent transparent transparent var(--info-color);
  transform-origin: bottom left;
  transition: all 0.3s;
  transform: rotate(-180deg);
}
</style>
