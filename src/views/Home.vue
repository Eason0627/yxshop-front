<template>
  <div class="home flex w-full h-full bg-[#F7F8FA]">
    <Aside :navigation="navigation" :collapsed="sidebarCollapsed" @logout="handleLogout"></Aside>
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- 顶栏 -->
      <div class="topbar flex items-center justify-between h-[56px] px-4 bg-white border-b border-[#F0F0F0] flex-shrink-0">
        <div class="flex items-center gap-3">
          <!-- 侧边栏折叠按钮 -->
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg text-[#999] hover:text-[#333] hover:bg-[#F5F5F5] transition-colors flex-shrink-0"
            :title="sidebarCollapsed ? '展开侧边栏' : '收缩侧边栏'"
            @click="sidebarCollapsed = !sidebarCollapsed"
          >
            <i :class="sidebarCollapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'" class="text-base"></i>
          </button>
          <h2 class="text-[15px] font-semibold text-[#1A1A1A]">{{ pageTitle }}</h2>
          <span class="text-[12px] text-[#CCC]">|</span>
          <span class="text-[12px] text-[#999]">{{ currentTime }}</span>
        </div>

        <div class="flex items-center gap-2">

          <!-- Admin：只显示角色标签，无店铺选择器 -->
          <div v-if="isAdmin"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFF4E6] border border-[#FFD6B0]">
            <i class="ri-shield-star-line text-[#FF6B00] text-sm"></i>
            <span class="text-[12px] text-[#FF6B00] font-medium whitespace-nowrap">平台管理</span>
          </div>

          <!-- ShopOwner / ShopStaff：显示本店名称（无需切换） -->
          <div v-if="!isAdmin"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F0F7FF] border border-[#BEDAFF]">
            <i class="ri-store-2-line text-[#165DFF] text-sm"></i>
            <span v-if="shopsLoading" class="text-[12px] text-[#165DFF]">加载中...</span>
            <span v-else class="text-[12px] text-[#165DFF] font-medium whitespace-nowrap max-w-[140px] truncate">
              {{ shopStore.currentShop?.displayName || shopStore.currentShop?.shopName || '本店' }}
            </span>
          </div>

          <div class="w-px h-5 bg-[#F0F0F0] mx-1"></div>

          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg text-[#999] hover:text-[#333] hover:bg-[#F5F5F5] transition-colors"
            @click="toggleFullscreen"
            title="全屏"
          >
            <i class="ri-fullscreen-line text-base"></i>
          </button>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg text-[#999] hover:text-[#333] hover:bg-[#F5F5F5] transition-colors"
            @click="refreshPage"
            title="刷新"
          >
            <i class="ri-refresh-line text-base"></i>
          </button>

          <!-- IM 消息通知铃铛 -->
          <el-popover
            v-model:visible="imPanelVisible"
            placement="bottom-end"
            :width="320"
            trigger="click"
            popper-class="!p-0 !rounded-xl !overflow-hidden"
            @show="loadImUnread"
          >
            <template #reference>
              <button
                class="relative w-8 h-8 flex items-center justify-center rounded-lg text-[#999] hover:text-[#333] hover:bg-[#F5F5F5] transition-colors"
                title="消息通知"
              >
                <i class="ri-message-2-line text-base"></i>
                <span v-if="imTotalUnread > 0"
                  class="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-[2px] bg-[#FF4D4F] rounded-full flex items-center justify-center pointer-events-none">
                  <span class="text-white text-[9px] font-bold leading-none">{{ imTotalUnread > 99 ? '99+' : imTotalUnread }}</span>
                </span>
              </button>
            </template>

            <!-- 面板内容 -->
            <div class="flex flex-col" style="max-height: 380px">
              <div class="flex items-center justify-between px-4 py-2.5 border-b border-[#F5F5F5]">
                <span class="text-[13px] font-semibold text-[#333]">IM 消息</span>
                <el-button link size="small" @click="$router.push('/message/conversation'); imPanelVisible = false">
                  查看全部 <i class="ri-arrow-right-line ml-0.5 text-xs"></i>
                </el-button>
              </div>
              <div class="overflow-y-auto flex-1">
                <div v-if="imConvLoading" class="flex items-center justify-center py-8 text-[#999] text-[12px]">
                  <i class="ri-loader-4-line animate-spin mr-1.5"></i>加载中...
                </div>
                <div v-else-if="imUnreadConvs.length === 0" class="flex flex-col items-center justify-center py-8 text-[#999]">
                  <i class="ri-chat-check-line text-2xl text-[#DDD] mb-2"></i>
                  <span class="text-[12px]">暂无未读消息</span>
                </div>
                <div
                  v-for="conv in imUnreadConvs" :key="conv.id"
                  class="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F8FA] cursor-pointer transition-colors border-b border-[#FAFAFA] last:border-0"
                  @click="$router.push('/message/conversation'); imPanelVisible = false"
                >
                  <div class="relative flex-shrink-0">
                    <div class="w-9 h-9 rounded-full bg-gradient-to-br from-[#165DFF] to-[#3B82F6] flex items-center justify-center">
                      <i class="ri-user-3-line text-white text-sm"></i>
                    </div>
                    <span class="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-[2px] bg-[#FF4D4F] rounded-full flex items-center justify-center">
                      <span class="text-white text-[9px] font-bold leading-none">{{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}</span>
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-1">
                      <span class="text-[12px] font-medium text-[#333] truncate">{{ conv.username || ('用户 ' + conv.userId) }}</span>
                      <span class="text-[10px] text-[#999] flex-shrink-0">{{ fmtImTime(conv.lastTime) }}</span>
                    </div>
                    <div class="text-[11px] text-[#999] truncate mt-0.5">{{ conv.lastMessage || '暂无消息' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-popover>

          <div class="w-px h-5 bg-[#F0F0F0] mx-1"></div>

          <!-- 用户下拉菜单（含角色 + 退出，替代侧边栏底部的用户区） -->
          <el-dropdown trigger="click" @command="handleUserCmd">
            <div class="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-lg hover:bg-[#F5F5F5] transition-colors select-none">
              <div class="w-7 h-7 rounded-full bg-gradient-to-br from-[#165DFF] to-[#3B82F6] flex items-center justify-center flex-shrink-0">
                <i class="ri-user-3-line text-white text-xs"></i>
              </div>
              <div class="flex flex-col items-start leading-none">
                <span class="text-[13px] text-[#333] font-medium">{{ username }}</span>
                <span class="text-[10px] text-[#999] mt-0.5">{{ roleText }}</span>
              </div>
              <i class="ri-arrow-down-s-line text-[#BBB] text-sm ml-0.5"></i>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled class="!cursor-default">
                  <span class="text-[12px] text-[#999]">{{ username }} · {{ roleText }}</span>
                </el-dropdown-item>
                <el-dropdown-item command="account">
                  <i class="ri-user-settings-line mr-1.5 text-[#666]"></i>
                  <span>我的账号</span>
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <i class="ri-logout-box-r-line mr-1.5 text-[#FF4D4F]"></i>
                  <span class="text-[#FF4D4F]">退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

        </div>
      </div>

      <!-- 内容区 -->
      <div class="content flex-1 overflow-auto p-6 scrollbar-none" ref="contentRef">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide">
            <component :is="Component" :key="$route.fullPath" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Aside from '@/components/Aside/Aside.vue';
import type { NavItem } from '@/components/Aside/Aside.vue';
import { userShopStore } from '@/store/index';
import { useUserStore } from '@/store/user';
import { adminShopApi } from '@/utils/admin-api';
import { usePermission, MENU_ACCESS } from '@/utils/permission';
import emitter from '@/utils/event-bus';
import { connectAdminWs, disconnectAdminWs } from '@/utils/adminWs';
import client from '@/utils/http';

const router = useRouter();
const route = useRoute();

const sidebarCollapsed = ref(false);
const userStore = useUserStore();
const { role, isAdmin, roleText } = usePermission();
const username = computed(() => userStore.displayName);

// ===== 当前店铺 =====
const shopStore = userShopStore();
const shops = ref<any[]>([]);
const shopsLoading = ref(false);

// v-model for el-select（ShopOwner / ShopStaff 使用；Admin 无选择器）
const currentShopSelectId = computed({
  get: () => shopStore.currentShop?.shopId || shopStore.currentShop?.id || '',
  set: (id: any) => {
    const shop = shops.value.find((s: any) => (s.shopId || s.id) === id);
    if (shop) shopStore.setCurrentShop(shop);
  },
});

const loadShops = async () => {
  if (isAdmin) return;
  shopsLoading.value = true;
  try {
    // ShopOwner 只获取自己名下的店铺，不使用 Admin 专属的全量列表接口
    const res: any = await adminShopApi.getMyShop();
    const data = res.data?.data || res.data;
    const list: any[] = Array.isArray(data) ? data : (data ? [data] : []);
    shops.value = list;
    if (list.length > 0) {
      // 始终以自己的第一个店铺为上下文（ShopOwner 通常只有一家店）
      shopStore.setCurrentShop(list[0]);
    }
  } catch { /* ignore */ }
  finally { shopsLoading.value = false; }
};

const now = ref(new Date());
let timer: ReturnType<typeof setInterval>;

onMounted(async () => {
  timer = setInterval(() => { now.value = new Date(); }, 30000);
  loadShops();
  connectAdminWs((payload) => {
    emitter.emit('admin:ws', payload);
    handleImBadge(payload);
  });

  // IM 未读数初始加载 + 每 60s 轮询一次
  loadImUnread();
  imPollTimer = setInterval(loadImUnread, 60000);
  emitter.on('admin:ws', handleImBadge);
  emitter.on('admin:conversationRead', handleConvRead);

  // 静默刷新用户角色（检测服务端角色变更）
  const serverRole = await userStore.refreshFromServer();
  if (serverRole && serverRole !== role) {
    // 角色已变更，重定向到新角色的默认页
    const { getDefaultRoute } = await import('@/utils/permission');
    router.replace(getDefaultRoute(serverRole));
  }
});
onUnmounted(() => {
  clearInterval(timer);
  if (imPollTimer) clearInterval(imPollTimer);
  emitter.off('admin:ws', handleImBadge);
  emitter.off('admin:conversationRead', handleConvRead);
  disconnectAdminWs();
});

const currentTime = computed(() => {
  const d = now.value;
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 周${weekdays[d.getDay()]}`;
});

const pageTitle = computed(() => {
  const matched = route.matched;
  if (matched.length > 0) {
    const last = matched[matched.length - 1];
    return (last.meta?.title as string) || (last.name as string) || '工作台';
  }
  return '工作台';
});

const toggleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
};

const refreshPage = () => {
  router.replace({ path: '/redirect', query: { to: route.fullPath } });
};

const handleLogout = () => {
  userStore.clearUser();
  router.push('/login');
};

const handleUserCmd = (cmd: string) => {
  if (cmd === 'logout') handleLogout();
  else if (cmd === 'account') router.push('/account');
};

// ===== IM 消息通知铃铛 =====
const imPanelVisible = ref(false);
const imTotalUnread = ref(0);
const imUnreadConvs = ref<any[]>([]);
const imConvLoading = ref(false);
let imPollTimer: ReturnType<typeof setInterval> | undefined;

function fmtImTime(val?: string) {
  if (!val) return '';
  const d = new Date(val.replace(' ', 'T'));
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  return `${d.getMonth()+1}/${d.getDate()}`;
}

const loadImUnread = async () => {
  if (!isAdmin) return; // 仅 Admin 需要监控全部会话未读
  imConvLoading.value = true;
  try {
    const res: any = await client.get('/app/support/conversations', { params: { pageNum: 1, pageSize: 50 } });
    const data = res.data?.data || res.data || {};
    const convs: any[] = data.records || [];
    const unread = convs.filter((c: any) => (c.unreadCount || 0) > 0);
    imUnreadConvs.value = unread;
    imTotalUnread.value = unread.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
  } catch { /* ignore */ }
  imConvLoading.value = false;
};

// 收到新 IM 用户消息时立即更新铃铛
const handleImBadge = (payload: any) => {
  if (payload?.type === 'im.user.message.new') loadImUnread();
};

// 客服页面管理员读完某会话时，从铃铛列表移除该会话的未读徽标
const handleConvRead = (payload: any) => {
  if (payload?.convId == null) return;
  const id = String(payload.convId);
  imUnreadConvs.value = imUnreadConvs.value.filter((c: any) => String(c.id) !== id);
  imTotalUnread.value = imUnreadConvs.value.reduce((s: number, c: any) => s + (c.unreadCount || 0), 0);
};

// ===== 侧边导航（按角色过滤）=====
const ALL_NAV: NavItem[] = [
  {
    url: '/dashboard', name: '工作台', icon: 'ri-dashboard-line',
    children: [
      { url: '/dashboard/overview', name: '数据概览', active: false },
    ],
  },
  {
    url: '/product', name: '商品中心', icon: 'ri-shopping-bag-line',
    children: [
      { url: '/product/list',     name: '商品列表', active: false },
      { url: '/product/category', name: '商品分类', active: false },
      { url: '/product/publish',  name: '发布商品', active: false },
    ],
  },
  {
    url: '/order', name: '订单中心', icon: 'ri-file-list-3-line',
    children: [
      { url: '/order/list',        name: '订单列表', active: false },
      { url: '/order/delivery',    name: '发货管理', active: false },
      { url: '/order/after-sales', name: '售后处理', active: false },
    ],
  },
  {
    url: '/shop', name: '店铺中心', icon: 'ri-store-line',
    children: [
      { url: '/shop/list',      name: '店铺列表', active: false },  // Admin only
      { url: '/shop/info',      name: '店铺信息', active: false },
      { url: '/shop/warehouse', name: '发货仓库', active: false },
      { url: '/shop/brand',     name: '品牌管理', active: false },
    ],
  },
  {
    url: '/marketing', name: '营销中心', icon: 'ri-megaphone-line',
    children: [
      { url: '/marketing/banner',   name: 'Banner管理', active: false },
      { url: '/marketing/channel',  name: '频道配置',   active: false },
      { url: '/marketing/activity', name: '活动管理',   active: false },
      { url: '/marketing/coupon',   name: '优惠券管理', active: false },
      { url: '/marketing/ranking',  name: '榜单管理',   active: false },
    ],
  },
  {
    url: '/user', name: '用户中心', icon: 'ri-user-line',
    children: [
      { url: '/user/list', name: '用户列表', active: false },
    ],
  },
  {
    url: '/content', name: '内容中心', icon: 'ri-article-line',
    children: [
      { url: '/content/topic', name: '话题管理', active: false },
    ],
  },
  {
    url: '/message', name: '消息中心', icon: 'ri-message-2-line',
    children: [
      { url: '/message/conversation',  name: '在线客服', active: false },
      { url: '/message/ticket',        name: '客服工单', active: false },
      { url: '/message/notification',  name: '通知推送', active: false },
    ],
  },
  {
    url: '/points', name: '积分中心', icon: 'ri-coin-line',
    children: [
      { url: '/points/goods',   name: '积分商品', active: false },
      { url: '/points/checkin', name: '签到活动', active: false },
      { url: '/points/records', name: '积分流水', active: false },
    ],
  },
  {
    url: '/review', name: '审核中心', icon: 'ri-shield-check-line',
    children: [
      { url: '/review/shop-apply', name: '开店审核', active: false },
      { url: '/review/product',    name: '商品审核', active: false },
      { url: '/review/content',    name: '内容审核', active: false },
      { url: '/review/comment',    name: '评价审核', active: false },
    ],
  },
  {
    url: '/resource', name: '资源中心', icon: 'ri-image-2-line',
    children: [
      { url: '/resource/center',      name: '图片管理',   active: false },
      { url: '/resource/third-party', name: '第三方资源', active: false },
    ],
  },
  {
    url: '/system', name: '系统管理', icon: 'ri-settings-3-line',
    children: [
      { url: '/system/admin',  name: '管理员列表', active: false },
      { url: '/system/role',   name: '角色管理',   active: false },
      { url: '/system/log',    name: '操作日志',   active: false },
      { url: '/system/config', name: '系统配置',   active: false },
    ],
  },
];

const navigation = computed<NavItem[]>(() => {
  return ALL_NAV
    .map(group => ({
      ...group,
      children: (group.children || []).filter(child => {
        const allowed = MENU_ACCESS[child.url];
        return !allowed || allowed.includes(role as any);
      }),
    }))
    .filter(group => (group.children?.length ?? 0) > 0);
});
</script>

<style scoped>
.home {
  user-select: none;
}

/* 内容区允许文字选中（表格数据、订单号等需要复制） */
.content {
  user-select: text;
}

.shop-select :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent;
  padding: 0 4px;
}
.shop-select :deep(.el-input__inner) {
  color: #165DFF;
  font-size: 13px;
  font-weight: 500;
}

.content {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.content::-webkit-scrollbar {
  display: none;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(8px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
