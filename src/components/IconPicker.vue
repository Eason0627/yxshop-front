<template>
  <div class="icon-picker">
    <!-- 当前选择预览 -->
    <div class="flex items-center gap-3 mb-3 p-2.5 bg-[#F9F9F9] rounded-xl border border-[#F0F0F0]">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        :style="{ background: previewBg || '#FFF4E6' }">
        <i v-if="modelValue && !modelValue.startsWith('http')"
          :class="modelValue" class="text-xl"
          :style="{ color: previewColor || '#FF6B00' }"></i>
        <img v-else-if="modelValue" :src="modelValue" class="w-6 h-6 object-contain" />
        <i v-else class="ri-grid-line text-xl text-[#CCC]"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-[13px] text-[#333] font-medium truncate">{{ modelValue || '未选择图标' }}</div>
        <div class="text-[11px] text-[#999]">点击下方图标选择，或手动输入类名</div>
      </div>
      <el-button v-if="modelValue" size="small" text type="danger" @click="emit('update:modelValue', '')">清除</el-button>
    </div>

    <!-- 手动输入 -->
    <el-input v-model="manualInput" placeholder="手动输入图标类名，如 ri-fire-line" size="small" class="mb-2"
      clearable @change="onManualInput" @clear="emit('update:modelValue', '')">
      <template #prefix><i class="ri-keyboard-line text-[#999]"></i></template>
    </el-input>

    <!-- 搜索 -->
    <el-input v-model="iconSearch" placeholder="搜索图标..." size="small" class="mb-2" clearable>
      <template #prefix><i class="ri-search-line text-[#999]"></i></template>
    </el-input>

    <!-- 分类标签 -->
    <div class="flex gap-1 flex-wrap mb-2">
      <el-tag
        v-for="cat in categories" :key="cat.key"
        :type="activeCategory === cat.key ? undefined : 'info'"
        :effect="activeCategory === cat.key ? 'dark' : 'plain'"
        size="small" class="cursor-pointer"
        @click="activeCategory = cat.key">
        {{ cat.label }}
      </el-tag>
    </div>

    <!-- 图标网格 -->
    <div class="grid grid-cols-9 gap-1 max-h-[220px] overflow-y-auto p-1">
      <div v-for="icon in filteredIcons" :key="icon.class"
        class="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer text-[18px] transition-all"
        :class="modelValue === icon.class
          ? 'bg-[#FF6B00] text-white shadow-sm'
          : 'hover:bg-[#FFF4E6] hover:text-[#FF6B00] text-[#555]'"
        :title="icon.label"
        @click="select(icon.class)">
        <i :class="icon.class"></i>
      </div>
      <div v-if="filteredIcons.length === 0" class="col-span-9 text-center text-[#999] text-[12px] py-4">
        未找到匹配图标
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = withDefaults(defineProps<{
  modelValue?: string;
  previewBg?: string;
  previewColor?: string;
}>(), {
  modelValue: '',
  previewBg: '#FFF4E6',
  previewColor: '#FF6B00',
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
}>();

const iconSearch = ref('');
const manualInput = ref(props.modelValue || '');
const activeCategory = ref('all');

watch(() => props.modelValue, (v) => { manualInput.value = v || ''; });

const onManualInput = (v: string) => { emit('update:modelValue', v?.trim() || ''); };
const select = (cls: string) => { emit('update:modelValue', cls); manualInput.value = cls; };

const categories = [
  { key: 'all', label: '全部' },
  { key: 'shop', label: '购物' },
  { key: 'product', label: '商品' },
  { key: 'promo', label: '促销' },
  { key: 'nav', label: '导航' },
  { key: 'media', label: '媒体' },
  { key: 'logistics', label: '物流' },
];

const allIcons = [
  // 购物
  { class: 'ri-shopping-cart-line', label: '购物车', cat: 'shop' },
  { class: 'ri-shopping-bag-line', label: '购物袋', cat: 'shop' },
  { class: 'ri-shopping-basket-line', label: '购物篮', cat: 'shop' },
  { class: 'ri-store-line', label: '店铺', cat: 'shop' },
  { class: 'ri-store-2-line', label: '店铺2', cat: 'shop' },
  { class: 'ri-store-3-line', label: '店铺3', cat: 'shop' },
  { class: 'ri-coupon-line', label: '优惠券', cat: 'shop' },
  { class: 'ri-coupon-2-line', label: '优惠券2', cat: 'shop' },
  { class: 'ri-coupon-3-line', label: '优惠券3', cat: 'shop' },
  { class: 'ri-gift-line', label: '礼品', cat: 'shop' },
  { class: 'ri-gift-2-line', label: '礼品2', cat: 'shop' },
  { class: 'ri-price-tag-line', label: '价格标签', cat: 'shop' },
  { class: 'ri-price-tag-2-line', label: '价格标签2', cat: 'shop' },
  { class: 'ri-price-tag-3-line', label: '价格标签3', cat: 'shop' },
  { class: 'ri-money-cny-circle-line', label: '人民币', cat: 'shop' },
  { class: 'ri-money-cny-box-line', label: '人民币盒', cat: 'shop' },
  { class: 'ri-coin-line', label: '硬币', cat: 'shop' },
  { class: 'ri-cash-line', label: '现金', cat: 'shop' },
  { class: 'ri-wallet-line', label: '钱包', cat: 'shop' },
  { class: 'ri-wallet-2-line', label: '钱包2', cat: 'shop' },
  { class: 'ri-wallet-3-line', label: '钱包3', cat: 'shop' },
  { class: 'ri-safe-line', label: '保险箱', cat: 'shop' },
  { class: 'ri-bank-card-line', label: '银行卡', cat: 'shop' },
  // 商品
  { class: 'ri-t-shirt-line', label: 'T恤', cat: 'product' },
  { class: 'ri-shirt-line', label: '衬衫', cat: 'product' },
  { class: 'ri-handbag-line', label: '手提包', cat: 'product' },
  { class: 'ri-briefcase-line', label: '公文包', cat: 'product' },
  { class: 'ri-phone-line', label: '手机', cat: 'product' },
  { class: 'ri-smartphone-line', label: '智能手机', cat: 'product' },
  { class: 'ri-computer-line', label: '电脑', cat: 'product' },
  { class: 'ri-tv-2-line', label: '电视', cat: 'product' },
  { class: 'ri-headphone-line', label: '耳机', cat: 'product' },
  { class: 'ri-camera-line', label: '相机', cat: 'product' },
  { class: 'ri-camera-2-line', label: '相机2', cat: 'product' },
  { class: 'ri-book-line', label: '书籍', cat: 'product' },
  { class: 'ri-booklet-line', label: '小册子', cat: 'product' },
  { class: 'ri-umbrella-line', label: '雨伞', cat: 'product' },
  { class: 'ri-cup-line', label: '杯子', cat: 'product' },
  { class: 'ri-restaurant-line', label: '餐厅', cat: 'product' },
  { class: 'ri-medicine-bottle-line', label: '药瓶', cat: 'product' },
  { class: 'ri-seedling-line', label: '植物', cat: 'product' },
  { class: 'ri-toy-line', label: '玩具', cat: 'product' },
  { class: 'ri-hammer-line', label: '工具', cat: 'product' },
  { class: 'ri-car-line', label: '汽车', cat: 'product' },
  { class: 'ri-home-gear-line', label: '家居', cat: 'product' },
  { class: 'ri-sofa-line', label: '沙发', cat: 'product' },
  // 促销
  { class: 'ri-fire-line', label: '火', cat: 'promo' },
  { class: 'ri-fire-fill', label: '火(实)', cat: 'promo' },
  { class: 'ri-flashlight-line', label: '闪光灯', cat: 'promo' },
  { class: 'ri-flash-line', label: '闪电', cat: 'promo' },
  { class: 'ri-star-line', label: '星星', cat: 'promo' },
  { class: 'ri-star-fill', label: '星星(实)', cat: 'promo' },
  { class: 'ri-heart-line', label: '心', cat: 'promo' },
  { class: 'ri-heart-fill', label: '心(实)', cat: 'promo' },
  { class: 'ri-thumb-up-line', label: '点赞', cat: 'promo' },
  { class: 'ri-thumb-up-fill', label: '点赞(实)', cat: 'promo' },
  { class: 'ri-award-line', label: '奖杯', cat: 'promo' },
  { class: 'ri-award-fill', label: '奖杯(实)', cat: 'promo' },
  { class: 'ri-medal-line', label: '奖章', cat: 'promo' },
  { class: 'ri-medal-2-line', label: '奖章2', cat: 'promo' },
  { class: 'ri-vip-crown-line', label: 'VIP皇冠', cat: 'promo' },
  { class: 'ri-vip-crown-2-line', label: 'VIP皇冠2', cat: 'promo' },
  { class: 'ri-vip-diamond-line', label: 'VIP钻石', cat: 'promo' },
  { class: 'ri-vip-line', label: 'VIP', cat: 'promo' },
  { class: 'ri-percent-line', label: '百分比', cat: 'promo' },
  { class: 'ri-discount-percent-line', label: '折扣', cat: 'promo' },
  { class: 'ri-alarm-line', label: '闹钟', cat: 'promo' },
  { class: 'ri-timer-line', label: '计时器', cat: 'promo' },
  { class: 'ri-timer-2-line', label: '计时器2', cat: 'promo' },
  { class: 'ri-calendar-event-line', label: '日历活动', cat: 'promo' },
  { class: 'ri-megaphone-line', label: '扩音器', cat: 'promo' },
  { class: 'ri-megaphone-2-line', label: '扩音器2', cat: 'promo' },
  // 导航
  { class: 'ri-home-line', label: '首页', cat: 'nav' },
  { class: 'ri-home-2-line', label: '首页2', cat: 'nav' },
  { class: 'ri-home-3-line', label: '首页3', cat: 'nav' },
  { class: 'ri-search-line', label: '搜索', cat: 'nav' },
  { class: 'ri-search-2-line', label: '搜索2', cat: 'nav' },
  { class: 'ri-menu-line', label: '菜单', cat: 'nav' },
  { class: 'ri-menu-2-line', label: '菜单2', cat: 'nav' },
  { class: 'ri-apps-line', label: '应用', cat: 'nav' },
  { class: 'ri-apps-2-line', label: '应用2', cat: 'nav' },
  { class: 'ri-grid-line', label: '网格', cat: 'nav' },
  { class: 'ri-layout-grid-line', label: '布局网格', cat: 'nav' },
  { class: 'ri-user-line', label: '用户', cat: 'nav' },
  { class: 'ri-user-2-line', label: '用户2', cat: 'nav' },
  { class: 'ri-user-3-line', label: '用户3', cat: 'nav' },
  { class: 'ri-user-heart-line', label: '用户收藏', cat: 'nav' },
  { class: 'ri-customer-service-line', label: '客服', cat: 'nav' },
  { class: 'ri-customer-service-2-line', label: '客服2', cat: 'nav' },
  { class: 'ri-map-pin-line', label: '地图标记', cat: 'nav' },
  { class: 'ri-map-pin-2-line', label: '地图标记2', cat: 'nav' },
  { class: 'ri-navigation-line', label: '导航', cat: 'nav' },
  { class: 'ri-compass-line', label: '指南针', cat: 'nav' },
  // 媒体
  { class: 'ri-image-line', label: '图片', cat: 'media' },
  { class: 'ri-image-2-line', label: '图片2', cat: 'media' },
  { class: 'ri-video-line', label: '视频', cat: 'media' },
  { class: 'ri-video-2-line', label: '视频2', cat: 'media' },
  { class: 'ri-live-line', label: '直播', cat: 'media' },
  { class: 'ri-broadcast-line', label: '广播', cat: 'media' },
  { class: 'ri-notification-line', label: '通知', cat: 'media' },
  { class: 'ri-notification-3-line', label: '通知3', cat: 'media' },
  { class: 'ri-collage-line', label: '拼图', cat: 'media' },
  { class: 'ri-layout-masonry-line', label: '瀑布流', cat: 'media' },
  { class: 'ri-bubble-chart-line', label: '气泡图', cat: 'media' },
  { class: 'ri-bar-chart-line', label: '柱状图', cat: 'media' },
  { class: 'ri-line-chart-line', label: '折线图', cat: 'media' },
  // 物流
  { class: 'ri-truck-line', label: '卡车', cat: 'logistics' },
  { class: 'ri-truck-2-line', label: '卡车2', cat: 'logistics' },
  { class: 'ri-ship-line', label: '轮船', cat: 'logistics' },
  { class: 'ri-flight-takeoff-line', label: '飞机起飞', cat: 'logistics' },
  { class: 'ri-box-line', label: '箱子', cat: 'logistics' },
  { class: 'ri-inbox-line', label: '收件箱', cat: 'logistics' },
  { class: 'ri-inbox-2-line', label: '收件箱2', cat: 'logistics' },
  { class: 'ri-mail-line', label: '邮件', cat: 'logistics' },
  { class: 'ri-check-line', label: '完成', cat: 'logistics' },
  { class: 'ri-checkbox-circle-line', label: '完成(圆)', cat: 'logistics' },
  { class: 'ri-time-line', label: '时间', cat: 'logistics' },
  { class: 'ri-history-line', label: '历史', cat: 'logistics' },
];

const filteredIcons = computed(() => {
  let list = allIcons;
  if (activeCategory.value !== 'all') {
    list = list.filter(i => i.cat === activeCategory.value);
  }
  if (iconSearch.value.trim()) {
    const q = iconSearch.value.trim().toLowerCase();
    list = list.filter(i => i.label.includes(q) || i.class.includes(q));
  }
  return list;
});
</script>
