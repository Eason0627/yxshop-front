/**
 * YXSHOP 后台权限控制工具
 *
 * 角色：Admin | ShopOwner | ShopStaff | Customer
 * 使用：
 *   import { usePermission } from '@/utils/permission'
 *   const { role, hasPermission, canAccess } = usePermission()
 */

export type UserRole = 'Admin' | 'ShopOwner' | 'ShopStaff' | 'Customer';

// ─────────────────────────────────────────────
// 菜单路径可见性：path → 允许访问的角色列表
// ─────────────────────────────────────────────
export const MENU_ACCESS: Record<string, UserRole[]> = {
  '/dashboard/overview':   ['Admin', 'ShopOwner', 'ShopStaff'],

  '/product/list':         ['Admin', 'ShopOwner', 'ShopStaff'],
  '/product/category':     ['Admin', 'ShopOwner', 'ShopStaff'],  // ShopOwner 只读，按钮由 ACTION_ACCESS 控制
  '/product/publish':      ['ShopOwner', 'ShopStaff'],           // Admin 不发布商品
  '/product/review':       ['Admin'],  // 旧路由保留，已迁入审核中心

  // 审核中心（全部仅 Admin）
  '/review/shop-apply':    ['Admin'],
  '/review/product':       ['Admin'],
  '/review/content':       ['Admin'],

  '/order/list':           ['Admin', 'ShopOwner', 'ShopStaff'],
  '/order/delivery':       ['ShopOwner', 'ShopStaff'],           // Admin 不做发货操作
  '/order/after-sales':    ['Admin', 'ShopOwner', 'ShopStaff'],

  '/shop/list':            ['Admin'],
  '/shop/info':            ['ShopOwner', 'ShopStaff'],
  '/shop/warehouse':       ['ShopOwner', 'ShopStaff'],
  '/shop/brand':           ['Admin', 'ShopOwner', 'ShopStaff'],
  '/review/comment':       ['Admin'],                            // 评价审核（已移入审核中心）

  '/marketing/banner':     ['Admin'],
  '/marketing/channel':    ['Admin'],
  '/marketing/activity':   ['Admin', 'ShopOwner'],
  '/marketing/coupon':     ['Admin', 'ShopOwner'],
  '/marketing/ranking':    ['Admin'],                            // 榜单为平台级，移除 ShopOwner

  '/user/list':            ['Admin'],

  '/content/topic':        ['Admin'],
  '/content/post':         ['Admin'],

  '/message/conversation': ['Admin', 'ShopOwner', 'ShopStaff'],
  '/message/ticket':       ['Admin', 'ShopOwner', 'ShopStaff'],
  '/message/notification': ['Admin'],                            // 通知推送仅 Admin

  '/points/goods':         ['Admin'],
  '/points/checkin':       ['Admin'],
  '/points/records':       ['Admin'],

  '/resource/center':      ['Admin', 'ShopOwner', 'ShopStaff'],
  '/resource/third-party': ['Admin'],                            // 第三方资源配置仅平台管理员

  '/system/admin':         ['Admin'],
  '/system/role':          ['Admin'],
  '/system/log':           ['Admin'],
  '/system/config':        ['Admin'],
};

// ─────────────────────────────────────────────
// 操作权限：action → 允许执行的角色列表
// ─────────────────────────────────────────────
export const ACTION_ACCESS: Record<string, UserRole[]> = {
  // 商品中心
  'product:delete':          ['ShopOwner'],               // Admin 不删商品
  'product:edit':            ['ShopOwner', 'ShopStaff'],  // Admin 不编辑商品
  'product:force-delist':    ['Admin'],                   // Admin 专属：强制下架违规商品
  'product:audit':           ['Admin'],
  'product:publish-direct':  ['Admin'],
  'product:filter-shop':     ['Admin'],                   // 商品列表店铺筛选下拉

  // 订单中心
  'order:cancel':            ['ShopOwner'],               // Admin 不代商家取消订单
  'order:arbitrate':         ['Admin'],
  'order:filter-shop':       ['Admin'],                   // 订单列表店铺筛选下拉

  // 发货管理
  'delivery:modify':         ['ShopOwner', 'ShopStaff'],  // Admin 不做发货

  // 售后处理
  'aftersales:approve':      ['ShopOwner'],               // 商家同意退款
  'aftersales:reject':       ['ShopOwner'],               // 商家拒绝退款
  'aftersales:arbitrate':    ['Admin'],                   // Admin 平台仲裁
  'aftersales:filter-shop':  ['Admin'],                   // 售后列表店铺筛选下拉

  // 店铺中心
  'shop:status':             ['Admin'],
  'shop:audit':              ['Admin'],
  'shop:edit-any':           ['Admin'],
  'shop:edit-own':           ['ShopOwner'],               // 移除 Admin（Admin 不经营店铺）
  'shop:delete':             ['Admin'],                   // 注销/删除店铺（Invalid/Rejected 状态才可操作）

  // 评价审核
  'review:audit':            ['Admin'],
  'review:reply':            ['Admin', 'ShopOwner', 'ShopStaff'],

  // 营销
  'coupon:create':           ['Admin', 'ShopOwner'],
  'coupon:filter-shop':      ['Admin'],                   // 优惠券列表店铺筛选下拉
  'activity:create':         ['Admin', 'ShopOwner'],
  'activity:filter-shop':    ['Admin'],                   // 活动列表店铺筛选下拉

  // 资源
  'resource:delete':         ['Admin', 'ShopOwner'],

  // 用户
  'user:ban':                ['Admin'],
  'user:create':             ['Admin'],

  // 商品分类（ShopOwner 只读，无编辑权）
  'category:edit':           ['Admin'],

  // 品牌（ShopOwner 只读）
  'brand:edit':              ['Admin'],

  // 系统
  'system:manage':           ['Admin'],
};

// ─────────────────────────────────────────────
// 角色文本映射
// ─────────────────────────────────────────────
export const ROLE_TEXT: Record<string, string> = {
  Admin:      '平台管理员',
  ShopOwner:  '店铺商家',
  ShopStaff:  '店铺运营',
  Customer:   '普通用户',
};

export function getRoleText(role: string): string {
  return ROLE_TEXT[role] || role || '未知角色';
}

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────

/** 检查角色是否有某操作权限 */
export function hasPermission(role: UserRole | string, action: string): boolean {
  const allowed = ACTION_ACCESS[action];
  if (!allowed) return false;
  return allowed.includes(role as UserRole);
}

/** 检查角色是否可访问某路由 */
export function canAccessRoute(role: UserRole | string, path: string): boolean {
  const allowed = MENU_ACCESS[path];
  if (!allowed) return true; // 未配置的路由不限制
  return allowed.includes(role as UserRole);
}

/** 获取某角色下可见的第一个有效路由（用于重定向） */
export function getDefaultRoute(role: UserRole | string): string {
  if (role === 'Customer') return '/register-shop';
  const first = Object.entries(MENU_ACCESS).find(([, roles]) =>
    roles.includes(role as UserRole)
  );
  return first?.[0] ?? '/dashboard/overview';
}

// ─────────────────────────────────────────────
// Composable（在 setup 中使用）
// ─────────────────────────────────────────────
export function usePermission() {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  const role: UserRole = user.role || 'Customer';

  return {
    role,
    user,
    isAdmin:     role === 'Admin',
    isShopOwner: role === 'ShopOwner',
    isShopStaff: role === 'ShopStaff',
    isCustomer:  role === 'Customer',
    /** 是否有某操作权限 */
    can: (action: string) => hasPermission(role, action),
    /** 是否可访问某路由 */
    canAccess: (path: string) => canAccessRoute(role, path),
    /** 角色显示文本 */
    roleText: getRoleText(role),
  };
}
