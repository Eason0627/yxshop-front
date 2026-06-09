<template>
  <div class="page space-y-4">

    <!-- ══ 4 个 KPI 卡片（无重复） ═══════════════════════════════════════ -->
    <div class="grid grid-cols-4 gap-3">
      <div v-for="card in kpiCards" :key="card.label"
        class="bg-white rounded-xl border border-[#F0F0F0] px-4 py-4 flex items-center gap-3 cursor-pointer hover:shadow-sm hover:border-[#FFD6B0] transition-all"
        @click="card.route && router.push(card.route)">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          :style="{ background: card.lightBg }">
          <i :class="card.icon" class="text-xl" :style="{ color: card.color }"></i>
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[11px] text-[#999] leading-none mb-1.5">{{ card.label }}</div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-[20px] font-bold text-[#1A1A1A] leading-none">
              <span v-if="statsLoading" class="inline-block w-8 h-5 bg-[#F0F0F0] rounded animate-pulse align-middle"></span>
              <template v-else>
                <span v-if="card.prefix" class="text-[13px] font-normal text-[#999]">{{ card.prefix }}</span>{{ card.value }}
              </template>
            </span>
            <el-tag v-if="!statsLoading && card.badge" type="danger" size="small" effect="dark" round class="!text-[10px] !px-1.5">{{ card.badge }}</el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ 主内容：三列 ══════════════════════════════════════════════════ -->
    <div class="grid grid-cols-12 gap-4">

      <!-- ─── 左栏（5格）：最近订单 2×3 卡片 ─────────────────────────── -->
      <div class="col-span-5">
        <div class="bg-white rounded-xl border border-[#F0F0F0] h-full">
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-[#F5F5F5]">
            <div class="flex items-center gap-2">
              <i class="ri-file-list-3-line text-[#FF6B00]"></i>
              <span class="text-[13px] font-semibold text-[#1A1A1A]">最近订单</span>
              <span v-if="currentShopName" class="text-[11px] text-[#999] bg-[#F5F5F5] px-2 py-0.5 rounded-full">
                {{ currentShopName }}
              </span>
            </div>
            <el-button type="primary" link size="small" @click="router.push('/order/list')">
              全部 <i class="ri-arrow-right-line text-[11px]"></i>
            </el-button>
          </div>

          <div v-if="ordersLoading && !recentOrders.length" class="grid grid-cols-2 gap-2 p-3">
            <div v-for="i in 6" :key="i" class="rounded-lg border border-[#F5F5F5] p-3 animate-pulse space-y-2">
              <div class="h-3 bg-[#F0F0F0] rounded w-3/4"></div>
              <div class="h-4 bg-[#F0F0F0] rounded w-1/2"></div>
              <div class="h-3 bg-[#F0F0F0] rounded w-2/3"></div>
            </div>
          </div>

          <EmptyState v-else-if="!ordersLoading && !recentOrders.length"
            icon="ri-shopping-bag-3-line" tip="暂无订单数据" />

          <div v-else class="grid grid-cols-2 gap-2 p-3">
            <div v-for="order in recentOrders" :key="order.orderNumber"
              class="rounded-lg border border-[#F5F5F5] p-3 hover:border-[#FFD6B0] hover:shadow-sm transition-all cursor-pointer"
              @click="router.push('/order/list')">
              <div class="flex items-center justify-between mb-2">
                <el-tag :type="ORDER_STATUS_TAG[order.orderStatus] || 'info'" size="small">
                  {{ ORDER_STATUS_LABEL[order.orderStatus] || order.orderStatus || '未知' }}
                </el-tag>
                <span class="text-[14px] font-bold text-[#FF6B00]">¥{{ order.orderTotal || 0 }}</span>
              </div>
              <div class="text-[12px] text-[#333] font-medium truncate mb-1">
                {{ order.shopName || '—' }}
              </div>
              <div class="text-[11px] text-[#BBB] font-mono truncate">
                {{ (order.orderNumber || '').slice(-12) }}
              </div>
              <div class="text-[10px] text-[#CCC] mt-1">{{ safeFormat(order.createTime) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── 中栏（4格）：待处理事项 ─────────────────────────────────── -->
      <div class="col-span-4">
        <div class="bg-white rounded-xl border border-[#F0F0F0] h-full">
          <div class="px-5 py-3.5 border-b border-[#F5F5F5]">
            <span class="text-[13px] font-semibold text-[#1A1A1A]">
              <i class="ri-alarm-warning-line text-[#FF6B00] mr-1.5"></i>待处理事项
            </span>
          </div>
          <div class="grid grid-cols-2 gap-0">
            <div v-for="(task, i) in pendingTasks" :key="task.label"
              class="flex items-center gap-3 px-4 py-5 cursor-pointer hover:bg-[#FAFAFA] transition-colors"
              :class="{
                'border-r border-[#F5F5F5]': i % 2 === 0,
                'border-b border-[#F5F5F5]': i < 2,
              }"
              @click="router.push(task.route)">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                :style="{ background: task.lightBg }">
                <i :class="task.icon" class="text-xl" :style="{ color: task.color }"></i>
              </div>
              <div>
                <div class="text-[11px] text-[#999] mb-1">{{ task.label }}</div>
                <div class="flex items-center gap-1.5">
                  <span class="text-[22px] font-bold text-[#1A1A1A] leading-none">
                    <span v-if="statsLoading" class="inline-block w-6 h-5 bg-[#F0F0F0] rounded animate-pulse"></span>
                    <span v-else>{{ task.count }}</span>
                  </span>
                  <el-tag v-if="!statsLoading && task.count > 0" type="danger" size="small" effect="dark" round class="!text-[10px]">需处理</el-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- 我的店铺（内嵌在中栏下方） -->
          <div class="border-t border-[#F5F5F5] px-5 pt-3.5 pb-2">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[12px] font-semibold text-[#555]">
                <i class="ri-store-2-line text-[#FF6B00] mr-1"></i>当前店铺
              </span>
              <el-button type="primary" link size="small"
                @click="router.push(isAdmin ? '/shop/list' : '/shop/info')">
                {{ isAdmin ? '全部' : '详情' }}
              </el-button>
            </div>
            <div v-if="!currentShop" class="text-[12px] text-[#CCC] py-2">暂无店铺</div>
            <div v-else
              class="flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-[#FAFAFA] cursor-pointer"
              @click="router.push(isAdmin ? '/shop/list' : '/shop/info')">
              <img :src="currentShop.logo || currentShop.shop_image || defaultShopImage"
                class="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-[#F0F0F0]"
                @error="(e: any) => (e.target.src = defaultShopImage)" />
              <div class="flex-1 min-w-0">
                <div class="text-[12px] font-medium text-[#333] truncate">
                  {{ currentShop.shopName || currentShop.shop_name || '未命名' }}
                </div>
                <el-tag :type="currentShop.status === 'Active' ? 'success' : 'warning'"
                  size="small" class="!text-[10px]">
                  {{ currentShop.status === 'Active' ? '营业中' : '待审核' }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── 右栏（3格）：快捷入口（双角色）+ 热销商品(ShopOwner) / 常用功能(Admin) ─── -->
      <div class="col-span-3 space-y-4">

        <!-- 快捷入口（Admin + ShopOwner 均显示） -->
        <div class="bg-white rounded-xl border border-[#F0F0F0] p-4">
          <div class="text-[12px] font-semibold text-[#555] mb-3">
            <i class="ri-apps-2-line text-[#FF6B00] mr-1"></i>快捷入口
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div v-for="link in quickLinks" :key="link.path"
              class="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-[#F5F5F5] hover:border-[#FFD6B0] hover:bg-[#FFF9F5] cursor-pointer transition-all"
              @click="router.push(link.path)">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                :style="{ background: link.bg }">
                <i :class="link.icon" class="text-[15px]" :style="{ color: link.color }"></i>
              </div>
              <span class="text-[10px] text-[#666] text-center leading-tight">{{ link.name }}</span>
            </div>
          </div>
        </div>

        <!-- 热销商品排行（ShopOwner 专属） -->
        <div v-if="!isAdmin" class="bg-white rounded-xl border border-[#F0F0F0] p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="text-[12px] font-semibold text-[#555]">
              <i class="ri-fire-line text-[#FF6B00] mr-1"></i>热销商品
            </div>
            <el-button type="primary" link size="small" @click="router.push('/product/list')">
              全部 <i class="ri-arrow-right-line text-[11px]"></i>
            </el-button>
          </div>

          <div v-if="hotProductsLoading" class="space-y-2.5">
            <div v-for="i in 5" :key="i" class="flex items-center gap-2 animate-pulse">
              <div class="w-5 h-5 rounded bg-[#F0F0F0] flex-shrink-0"></div>
              <div class="w-8 h-8 rounded-lg bg-[#F0F0F0] flex-shrink-0"></div>
              <div class="flex-1 space-y-1">
                <div class="h-2.5 bg-[#F0F0F0] rounded w-3/4"></div>
                <div class="h-2 bg-[#F0F0F0] rounded w-1/2"></div>
              </div>
            </div>
          </div>

          <EmptyState v-else-if="!hotProducts.length"
            icon="ri-shopping-bag-3-line" tip="暂无商品数据" />

          <div v-else class="space-y-1">
            <div v-for="(product, index) in hotProducts" :key="product.id"
              class="flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-[#FAFAFA] cursor-pointer transition-colors"
              @click="router.push('/product/list')">
              <div class="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                :class="{
                  'bg-[#FFB800] text-white': index === 0,
                  'bg-[#B0B0B0] text-white': index === 1,
                  'bg-[#CD7F32] text-white': index === 2,
                  'bg-[#F0F0F0] text-[#AAA]': index >= 3,
                }">
                {{ index + 1 }}
              </div>
              <img :src="product.mainImage || ''"
                class="w-8 h-8 rounded-lg object-cover border border-[#F0F0F0] flex-shrink-0 bg-[#FAFAFA]"
                @error="(e: any) => (e.target as HTMLImageElement).src = ''" />
              <div class="flex-1 min-w-0">
                <div class="text-[11px] font-medium text-[#333] truncate">{{ product.name }}</div>
                <div class="text-[10px] text-[#999]">已售 {{ product.sales ?? 0 }} 件</div>
              </div>
              <div class="text-[11px] font-bold text-[#FF6B00] flex-shrink-0">¥{{ product.price }}</div>
            </div>
          </div>
        </div>

        <!-- 常用功能（Admin 专属） -->
        <div v-if="isAdmin" class="bg-white rounded-xl border border-[#F0F0F0] p-4">
          <div class="text-[12px] font-semibold text-[#555] mb-2">
            <i class="ri-bookmark-line text-[#FF6B00] mr-1"></i>常用功能
          </div>
          <div class="space-y-0.5">
            <div v-for="link in recentLinks" :key="link.path"
              class="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#FAFAFA] cursor-pointer transition-colors"
              @click="router.push(link.path)">
              <i :class="link.icon" class="text-[14px] flex-shrink-0" :style="{ color: link.color }"></i>
              <span class="text-[12px] text-[#555] flex-1">{{ link.name }}</span>
              <i class="ri-arrow-right-s-line text-[#DDD] text-[13px]"></i>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, inject, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { adminOrderApi, adminProductApi, adminShopApi } from '@/utils/admin-api';
import {
  ORDER_STATUS_LABEL, ORDER_STATUS_TAG,
  AFTER_SALES_STATUS, AUDIT_STATUS, SHOP_STATUS,
} from '@/constants/status';
import { safeFormat } from '@/utils/dateFormat';
import { parsePageResult } from '@/utils/apiHelper';
import { userShopStore } from '@/store/index';
import { usePermission } from '@/utils/permission';
import EmptyState from '@/components/EmptyState.vue';

const router = useRouter();
const defaultShopImage = inject<string>('defaultShopImage', '');
const { isAdmin } = usePermission();

// ── 当前店铺（Admin 无店铺上下文，ShopOwner 读 Pinia store）──────
const shopStore = userShopStore();
const currentShop = computed(() => isAdmin ? null : (shopStore.currentShop ?? null));
const currentShopId = computed<string | null>(() =>
  currentShop.value?.shopId || currentShop.value?.id || null
);
const currentShopName = computed<string>(() => {
  const shop = currentShop.value;
  if (!shop?.shopId) return ''; // 全平台模式不显示店铺名标签
  return shop.shopName || shop.shop_name || '';
});

// 切换店铺时自动刷新数据
watch(currentShopId, () => {
  loadStats();
  loadRecentOrders();
  if (!isAdmin) loadHotProducts();
});

// ── 状态 ────────────────────────────────────────────────────────────
const statsLoading       = ref(true);
const ordersLoading      = ref(true);
const hotProductsLoading = ref(false);
const recentOrders  = ref<any[]>([]);
const hotProducts   = ref<any[]>([]);

const kpi = reactive({
  pendingShip: 0, pendingAfterSales: 0, pendingProduct: 0, pendingShop: 0,
  todayOrders: 0, todayRevenue: 0, monthRevenue: 0,
});

// ── KPI 卡片（4个，与待处理事项无重叠）────────────────────────────
const kpiCards = computed(() => [
  {
    label: '今日新增订单', value: kpi.todayOrders,
    icon: 'ri-shopping-cart-line', color: '#FF6B00', lightBg: '#FFF4E6', route: '/order/list',
    badge: '',
  },
  {
    label: '今日营业额', value: kpi.todayRevenue, prefix: '¥',
    icon: 'ri-money-cny-circle-line', color: '#00B96B', lightBg: '#E8FAF2', route: '/order/list',
    badge: '',
  },
  {
    label: '本月营业额', value: kpi.monthRevenue, prefix: '¥',
    icon: 'ri-line-chart-line', color: '#165DFF', lightBg: '#EEF3FF', route: '/order/list',
    badge: '',
  },
  {
    label: '待处理合计', value: kpi.pendingShip + kpi.pendingAfterSales + kpi.pendingProduct + kpi.pendingShop,
    icon: 'ri-alarm-warning-line', color: '#FF4D4F', lightBg: '#FFF1F0', route: '/order/list',
    badge: (kpi.pendingShip + kpi.pendingAfterSales + kpi.pendingProduct + kpi.pendingShop) > 0 ? '需处理' : '',
  },
]);

// ── 待处理事项（中栏 2×2，按角色过滤）──────────────────────────
const allPendingTasks = computed(() => [
  { label: '待发货',   icon: 'ri-truck-line',                color: '#165DFF', lightBg: '#EEF3FF', count: kpi.pendingShip,       route: '/order/delivery',                           roles: ['ShopOwner'] },
  { label: '售后申请', icon: 'ri-customer-service-2-line',   color: '#FF4D4F', lightBg: '#FFF1F0', count: kpi.pendingAfterSales, route: '/order/after-sales',                        roles: ['Admin', 'ShopOwner'] },
  { label: '商品审核', icon: 'ri-checkbox-circle-line',      color: '#FAAD14', lightBg: '#FFFBE6', count: kpi.pendingProduct,    route: '/review/product',                           roles: ['Admin'] },
  { label: '店铺审核', icon: 'ri-store-2-line',              color: '#00B96B', lightBg: '#E8FAF2', count: kpi.pendingShop,       route: '/review/shop-apply',                        roles: ['Admin'] },
]);
const pendingTasks = computed(() => allPendingTasks.value.filter(t =>
  isAdmin ? true : t.roles.includes('ShopOwner')
));

// ── 快捷入口（按角色过滤）────────────────────────────────────────
const allQuickLinks = [
  { name: '订单',   path: '/order/list',        icon: 'ri-file-list-3-line',  color: '#165DFF', bg: '#EEF3FF', roles: ['Admin', 'ShopOwner'] },
  { name: '商品',   path: '/product/list',      icon: 'ri-shopping-bag-line', color: '#FF6B00', bg: '#FFF4E6', roles: ['Admin', 'ShopOwner'] },
  { name: '用户',   path: '/user/list',          icon: 'ri-user-3-line',       color: '#00B96B', bg: '#E8FAF2', roles: ['Admin'] },
  { name: '优惠券', path: '/marketing/coupon',  icon: 'ri-coupon-3-line',     color: '#FAAD14', bg: '#FFFBE6', roles: ['Admin', 'ShopOwner'] },
  { name: '积分',   path: '/points/records',    icon: 'ri-coin-line',         color: '#722ED1', bg: '#F9F0FF', roles: ['Admin'] },
  { name: '日志',   path: '/system/log',         icon: 'ri-file-chart-line',   color: '#13C2C2', bg: '#E6FFFB', roles: ['Admin'] },
  { name: '发布商品', path: '/product/publish', icon: 'ri-add-box-line',      color: '#FF6B00', bg: '#FFF4E6', roles: ['ShopOwner'] },
  { name: '活动',   path: '/marketing/activity', icon: 'ri-megaphone-line',    color: '#FAAD14', bg: '#FFFBE6', roles: ['ShopOwner'] },
  { name: '店铺信息', path: '/shop/info',        icon: 'ri-store-2-line',      color: '#165DFF', bg: '#EEF3FF', roles: ['ShopOwner'] },
];
const quickLinks = computed(() => allQuickLinks.filter(l =>
  isAdmin ? l.roles.includes('Admin') : l.roles.includes('ShopOwner')
).slice(0, 6));

const allRecentLinks = [
  { name: '商品分类管理', path: '/product/category',   icon: 'ri-folder-2-line',        color: '#FF6B00', roles: ['Admin'] },
  { name: '营销活动',     path: '/marketing/activity',  icon: 'ri-megaphone-line',        color: '#FAAD14', roles: ['Admin'] },
  { name: '售后处理',     path: '/order/after-sales',   icon: 'ri-customer-service-line', color: '#FF4D4F', roles: ['Admin'] },
  { name: '内容审核',     path: '/content/post',        icon: 'ri-article-line',          color: '#00B96B', roles: ['Admin'] },
  { name: '系统配置',     path: '/system/config',       icon: 'ri-settings-3-line',       color: '#999',    roles: ['Admin'] },
  { name: '订单管理',     path: '/order/list',          icon: 'ri-file-list-3-line',      color: '#165DFF', roles: ['ShopOwner'] },
  { name: '我的商品',     path: '/product/list',        icon: 'ri-shopping-bag-line',     color: '#FF6B00', roles: ['ShopOwner'] },
  { name: '发布商品',     path: '/product/publish',     icon: 'ri-add-box-line',          color: '#FF6B00', roles: ['ShopOwner'] },
  { name: '优惠券管理',   path: '/marketing/coupon',    icon: 'ri-coupon-3-line',         color: '#FAAD14', roles: ['ShopOwner'] },
  { name: '发货管理',     path: '/order/delivery',      icon: 'ri-truck-line',            color: '#165DFF', roles: ['ShopOwner'] },
  { name: '店铺信息',     path: '/shop/info',           icon: 'ri-store-2-line',          color: '#165DFF', roles: ['ShopOwner'] },
];
const recentLinks = computed(() => allRecentLinks.filter(l =>
  isAdmin ? l.roles.includes('Admin') : l.roles.includes('ShopOwner')
));

// ── 数据加载 ─────────────────────────────────────────────────────────
const loadStats = async () => {
  statsLoading.value = true;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const firstDay = new Date();
    firstDay.setDate(1);
    const firstDayStr = firstDay.toISOString().slice(0, 10);

    // 始终按当前选中的店铺过滤，无论角色
    const shopFilter = currentShopId.value
      ? { shopId: currentShopId.value }
      : {};

    // Admin 和 ShopOwner 公共请求
    const commonRequests = [
      adminOrderApi.list({ pageNum: 1, pageSize: 1, orderStatus: 'Paid', ...shopFilter }),
      adminOrderApi.list({ pageNum: 1, pageSize: 1, afterSalesStatus: AFTER_SALES_STATUS.REQUESTED, ...shopFilter }),
      adminOrderApi.list({ pageNum: 1, pageSize: 200, startDate: today, endDate: today, ...shopFilter }),
      adminOrderApi.list({ pageNum: 1, pageSize: 1000, startDate: firstDayStr, endDate: today, ...shopFilter }),
    ];

    if (isAdmin) {
      // Admin 额外请求平台级统计（不统计待发货，发货由各店自行处理）
      const [, afterSalesRes, todayRes, monthRes, productRes, shopRes] = await Promise.all([
        ...commonRequests,
        adminProductApi.list({ pageNum: 1, pageSize: 1, auditStatus: AUDIT_STATUS.PENDING }),
        adminShopApi.list({ pageNum: 1, pageSize: 1, status: SHOP_STATUS.PENDING }),
      ]);
      kpi.pendingShip       = 0;   // Admin 不负责发货
      kpi.pendingAfterSales = parsePageResult(afterSalesRes).total;
      kpi.pendingProduct    = parsePageResult(productRes).total;
      kpi.pendingShop       = parsePageResult(shopRes).total;
      const todayData = parsePageResult<any>(todayRes);
      kpi.todayOrders  = todayData.total;
      kpi.todayRevenue = todayData.records.reduce((s: number, o: any) => s + (o.orderTotal || 0), 0);
      kpi.monthRevenue = parsePageResult<any>(monthRes).records.reduce((s: number, o: any) => s + (o.orderTotal || 0), 0);
    } else {
      const [shipRes, afterSalesRes, todayRes, monthRes] = await Promise.all(commonRequests);
      kpi.pendingShip       = parsePageResult(shipRes).total;
      kpi.pendingAfterSales = parsePageResult(afterSalesRes).total;
      kpi.pendingProduct    = 0;
      kpi.pendingShop       = 0;
      const todayData = parsePageResult<any>(todayRes);
      kpi.todayOrders  = todayData.total;
      kpi.todayRevenue = todayData.records.reduce((s: number, o: any) => s + (o.orderTotal || 0), 0);
      kpi.monthRevenue = parsePageResult<any>(monthRes).records.reduce((s: number, o: any) => s + (o.orderTotal || 0), 0);
    }
  } catch { /* interceptor handles */ }
  finally { statsLoading.value = false; }
};

const loadRecentOrders = async () => {
  ordersLoading.value = true;
  try {
    const shopFilter = currentShopId.value
      ? { shopId: currentShopId.value }
      : {};
    const res = await adminOrderApi.list({ pageNum: 1, pageSize: 6, ...shopFilter });
    recentOrders.value = parsePageResult<any>(res).records;
  } catch { /* interceptor handles */ }
  finally { ordersLoading.value = false; }
};

const loadHotProducts = async () => {
  if (!currentShopId.value) { hotProducts.value = []; return; }
  hotProductsLoading.value = true;
  try {
    const res = await adminProductApi.list({ pageNum: 1, pageSize: 10, shopId: currentShopId.value });
    const records = parsePageResult<any>(res).records;
    hotProducts.value = records
      .sort((a: any, b: any) => (b.sales ?? 0) - (a.sales ?? 0))
      .slice(0, 5);
  } catch { /* interceptor handles */ }
  finally { hotProductsLoading.value = false; }
};

const refresh = () => {
  loadStats();
  loadRecentOrders();
  if (!isAdmin) loadHotProducts();
};

onMounted(refresh);
</script>
