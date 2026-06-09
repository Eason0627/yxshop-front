import { createRouter, createWebHistory } from 'vue-router';
import { canAccessRoute, getDefaultRoute } from '@/utils/permission';
import { useUserStore } from '@/store/user';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/redirect',
    component: () => import('@/views/Home.vue'),
    beforeEnter: (to: any) => {
      const target = (to.query.to as string) || '/dashboard/overview';
      window.location.href = target;
    },
  },
  // ===== 工作台 =====
  {
    path: '/dashboard',
    component: () => import('@/views/Home.vue'),
    redirect: '/dashboard/overview',
    children: [
      {
        path: 'overview',
        name: '数据概览',
        component: () => import('@/views/Dashboard/Dashboard.vue'),
        meta: { title: '数据概览' },
      },
    ],
  },
  // ===== 商品中心 =====
  {
    path: '/product',
    component: () => import('@/views/Home.vue'),
    redirect: '/product/list',
    children: [
      {
        path: 'list',
        name: '商品列表',
        component: () => import('@/views/Product/List.vue'),
        meta: { title: '商品列表' },
      },
      {
        path: 'category',
        name: '商品分类',
        component: () => import('@/views/Product/Category.vue'),
        meta: { title: '商品分类' },
      },
      {
        path: 'publish',
        name: '发布商品',
        component: () => import('@/views/Product/Publish.vue'),
        meta: { title: '发布商品' },
      },
      {
        path: 'review',
        name: '商品审核',
        component: () => import('@/views/Product/Review.vue'),
        meta: { title: '商品审核' },
      },
    ],
  },
  // ===== 订单中心 =====
  {
    path: '/order',
    component: () => import('@/views/Home.vue'),
    redirect: '/order/list',
    children: [
      {
        path: 'list',
        name: '订单列表',
        component: () => import('@/views/Order/List.vue'),
        meta: { title: '订单列表' },
      },
      {
        path: 'delivery',
        name: '发货管理',
        component: () => import('@/views/Order/Delivery.vue'),
        meta: { title: '发货管理' },
      },
      {
        path: 'after-sales',
        name: '售后处理',
        component: () => import('@/views/Order/AfterSales.vue'),
        meta: { title: '售后处理' },
      },
    ],
  },
  // ===== 店铺中心 =====
  {
    path: '/shop',
    component: () => import('@/views/Home.vue'),
    redirect: '/shop/list',
    children: [
      {
        path: 'list',
        name: '店铺列表',
        component: () => import('@/views/Shop/List.vue'),
        meta: { title: '店铺列表' },
      },
      {
        path: 'info',
        name: '店铺信息',
        component: () => import('@/views/Shop/Info.vue'),
        meta: { title: '店铺信息' },
      },
      {
        path: 'warehouse',
        name: '发货仓库',
        component: () => import('@/views/Shop/Warehouse.vue'),
        meta: { title: '发货仓库' },
      },
      {
        path: 'brand',
        name: '品牌管理',
        component: () => import('@/views/Shop/Brand.vue'),
        meta: { title: '品牌管理' },
      },
      {
        path: 'review',
        name: '审核管理',
        component: () => import('@/views/Shop/Review.vue'),
        meta: { title: '审核管理' },
      },
    ],
  },
  // ===== 营销中心 =====
  {
    path: '/marketing',
    component: () => import('@/views/Home.vue'),
    redirect: '/marketing/banner',
    children: [
      {
        path: 'banner',
        name: 'Banner管理',
        component: () => import('@/views/Marketing/Banner.vue'),
        meta: { title: 'Banner管理' },
      },
      {
        path: 'channel',
        name: '频道配置',
        component: () => import('@/views/Marketing/Channel.vue'),
        meta: { title: '频道配置' },
      },
      {
        path: 'activity',
        name: '活动管理',
        component: () => import('@/views/Marketing/Activity.vue'),
        meta: { title: '活动管理' },
      },
      {
        path: 'coupon',
        name: '优惠券管理',
        component: () => import('@/views/Marketing/Coupon.vue'),
        meta: { title: '优惠券管理' },
      },
      {
        path: 'ranking',
        name: '榜单管理',
        component: () => import('@/views/Marketing/Ranking.vue'),
        meta: { title: '榜单管理' },
      },
    ],
  },
  // ===== 用户中心 =====
  {
    path: '/user',
    component: () => import('@/views/Home.vue'),
    redirect: '/user/list',
    children: [
      {
        path: 'list',
        name: '用户列表',
        component: () => import('@/views/User/List.vue'),
        meta: { title: '用户列表' },
      },
    ],
  },
  // ===== 内容中心 =====
  {
    path: '/content',
    component: () => import('@/views/Home.vue'),
    redirect: '/content/topic',
    children: [
      {
        path: 'topic',
        name: '话题管理',
        component: () => import('@/views/Content/Topic.vue'),
        meta: { title: '话题管理' },
      },
      {
        path: 'post',
        name: '内容审核',
        component: () => import('@/views/Content/Post.vue'),
        meta: { title: '内容审核' },
      },
    ],
  },
  // ===== 消息中心 =====
  {
    path: '/message',
    component: () => import('@/views/Home.vue'),
    redirect: '/message/ticket',
    children: [
      {
        path: 'ticket',
        name: '客服工单',
        component: () => import('@/views/Message/Ticket.vue'),
        meta: { title: '客服工单' },
      },
      {
        path: 'conversation',
        name: '在线客服',
        component: () => import('@/views/Message/Conversation.vue'),
        meta: { title: '在线客服' },
      },
      {
        path: 'notification',
        name: '通知推送',
        component: () => import('@/views/Message/NotificationPush.vue'),
        meta: { title: '通知推送' },
      },
    ],
  },
  // ===== 积分中心 =====
  {
    path: '/points',
    component: () => import('@/views/Home.vue'),
    redirect: '/points/goods',
    children: [
      {
        path: 'goods',
        name: '积分商品',
        component: () => import('@/views/Points/Goods.vue'),
        meta: { title: '积分商品' },
      },
      {
        path: 'checkin',
        name: '签到活动',
        component: () => import('@/views/Points/Checkin.vue'),
        meta: { title: '签到活动' },
      },
      {
        path: 'records',
        name: '积分流水',
        component: () => import('@/views/Points/Records.vue'),
        meta: { title: '积分流水' },
      },
    ],
  },
  // ===== 资源中心 =====
  {
    path: '/resource',
    component: () => import('@/views/Home.vue'),
    redirect: '/resource/center',
    children: [
      {
        path: 'center',
        name: '资源中心',
        component: () => import('@/views/Resource/Center.vue'),
        meta: { title: '资源中心' },
      },
      {
        path: 'third-party',
        name: '第三方资源',
        component: () => import('@/views/Resource/ThirdParty.vue'),
        meta: { title: '第三方资源管理' },
      },
    ],
  },
  // ===== 系统管理 =====
  {
    path: '/system',
    component: () => import('@/views/Home.vue'),
    redirect: '/system/admin',
    children: [
      {
        path: 'admin',
        name: '管理员列表',
        component: () => import('@/views/System/Admin.vue'),
        meta: { title: '管理员列表' },
      },
      {
        path: 'role',
        name: '角色管理',
        component: () => import('@/views/System/Role.vue'),
        meta: { title: '角色管理' },
      },
      {
        path: 'log',
        name: '操作日志',
        component: () => import('@/views/System/Log.vue'),
        meta: { title: '操作日志' },
      },
      {
        path: 'config',
        name: '系统配置',
        component: () => import('@/views/System/Config.vue'),
        meta: { title: '系统配置' },
      },
    ],
  },
  // ===== 审核中心 =====
  {
    path: '/review',
    component: () => import('@/views/Home.vue'),
    redirect: '/review/shop-apply',
    children: [
      {
        path: 'shop-apply',
        name: '开店审核',
        component: () => import('@/views/Review/ShopApply.vue'),
        meta: { title: '开店审核' },
      },
      {
        path: 'product',
        name: '审核中心-商品',
        component: () => import('@/views/Product/Review.vue'),
        meta: { title: '商品审核' },
      },
      {
        path: 'content',
        name: '审核中心-内容',
        component: () => import('@/views/Content/Post.vue'),
        meta: { title: '内容审核' },
      },
      {
        path: 'comment',
        name: '评价审核',
        component: () => import('@/views/Shop/Review.vue'),
        meta: { title: '评价审核' },
      },
    ],
  },
  // ===== 我的账号 =====
  {
    path: '/account',
    component: () => import('@/views/Home.vue'),
    children: [
      {
        path: '',
        name: '我的账号',
        component: () => import('@/views/User/Info.vue'),
        meta: { title: '我的账号' },
      },
    ],
  },
  // ===== 注册店铺（Customer 专属引导页）=====
  {
    path: '/register-shop',
    name: '注册店铺',
    component: () => import('@/views/RegisterShop.vue'),
    meta: { title: '注册店铺' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard/overview' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

/** 无需登录即可访问的路径 */
const PUBLIC_PATHS = ['/login', '/register-shop'];

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore();
  const token = userStore.token || localStorage.getItem('token');
  const role: string = userStore.role || 'Customer';

  // 未登录 → 公开页直接放行，其余跳登录
  if (!token) {
    if (!PUBLIC_PATHS.includes(to.path)) { next('/login'); return; }
    next();
    return;
  }

  // 已登录访问登录页 → 跳首页
  if (to.path === '/login') {
    next(getDefaultRoute(role));
    return;
  }

  // Customer 只能访问注册店铺引导页
  if (role === 'Customer') {
    if (to.path !== '/register-shop') { next('/register-shop'); return; }
    next();
    return;
  }

  // 角色不满足该路由权限 → 跳首页
  if (!canAccessRoute(role, to.path)) {
    next(getDefaultRoute(role));
    return;
  }

  next();
});

export default router;
