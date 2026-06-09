/**
 * 后台管理 API 服务
 * 统一封装对 /admin/* 和业务管理接口的调用
 */
import client from './http';

// ===== 管理员认证 =====
export const adminAuthApi = {
  login(username: string, password: string) {
    return client.post('/admin/login', { username, password });
  },
  logout() {
    return client.post('/admin/logout');
  },
  me() {
    return client.get('/admin/me');
  },
};

// ===== 管理员管理 =====
export const adminUserApi = {
  list(page = 1, size = 20, keyword?: string) {
    const params = { page, size, ...(keyword ? { keyword } : {}) };
    return client.get('/admin/users', { params });
  },
  create(data: any) {
    return client.post('/admin/users', data);
  },
  update(id: number, data: any) {
    return client.put(`/admin/users/${id}`, data);
  },
  delete(id: number) {
    return client.delete(`/admin/users/${id}`);
  },
};

// ===== 角色管理 =====
export const adminRoleApi = {
  list() { return client.get('/admin/roles'); },
  create(data: any) { return client.post('/admin/roles', data); },
  update(id: number, data: any) { return client.put(`/admin/roles/${id}`, data); },
  delete(id: number) { return client.delete(`/admin/roles/${id}`); },
  getPermissions(id: number) { return client.get(`/admin/roles/${id}/permissions`); },
  savePermissions(id: number, permissions: string[]) {
    return client.put(`/admin/roles/${id}/permissions`, { permissions });
  },
};

// ===== 系统配置 =====
export const systemConfigApi = {
  get() { return client.get('/admin/system/config'); },
  save(section: string, data: object) { return client.post('/admin/system/config', { section, ...data }); },
  getOss() { return client.get('/admin/system/oss-config'); },
  saveOss(data: object) { return client.put('/admin/system/oss-config', data); },
  // OSS 真实用量与 BSS 计费
  getOssStats() { return client.get('/admin/system/oss-stats'); },
  refreshOssStats() { return client.post('/admin/system/oss-stats/refresh', {}); },
  // 短信配置（阿里云 SMS）
  getSmsConfig() { return client.get('/admin/system/sms-config'); },
  saveSmsConfig(data: object) { return client.put('/admin/system/sms-config', data); },
  // SMTP 邮件配置
  getSmtpConfig() { return client.get('/admin/system/smtp-config'); },
  saveSmtpConfig(data: object) { return client.put('/admin/system/smtp-config', data); },
  // 阿里云验证码（CAPTCHA v2）
  getCaptchaConfig() { return client.get('/admin/system/captcha-config'); },
  saveCaptchaConfig(data: object) { return client.put('/admin/system/captcha-config', data); },
  // 删除服务配置（清空 Redis key）
  deleteServiceConfig(svcId: string) { return client.delete(`/admin/system/service-config/${svcId}`); },
  // 高德地图
  getAmapConfig()            { return client.get('/admin/system/amap-config'); },
  saveAmapConfig(data: object) { return client.put('/admin/system/amap-config', data); },
  // 快递查询 API
  getLogisticsConfig()             { return client.get('/admin/system/logistics-config'); },
  saveLogisticsConfig(data: object){ return client.put('/admin/system/logistics-config', data); },
  // 物流轨迹查询（快递100代理）
  trackPackage(company: string, trackingNo: string) {
    return client.get('/admin/system/logistics/track', { params: { company, trackingNo } });
  },
};

// ===== 菜单管理 =====
export const adminMenuApi = {
  tree() {
    return client.get('/admin/menus');
  },
};

// ===== 登录日志 =====
export const adminLogApi = {
  loginLogs(page = 1, size = 20, adminUserId?: number) {
    const params: any = { page, size };
    if (adminUserId) params.adminUserId = adminUserId;
    return client.get('/admin/login-logs', { params });
  },
};

// ===== 商品管理（后台） =====
export const adminProductApi = {
  /** 后台商品分页列表（含审核/下架等全状态） */
  list(params: any = {}) {
    return client.post('/app/products/admin/list', params);
  },
  /** 后台商品详情（不受上架/审核状态限制） */
  detail(id: number | string) {
    return client.get(`/app/products/admin/detail/${id}`);
  },
  create(data: any) {
    return client.post('/app/products', data);
  },
  update(id: number | string, data: any) {
    return client.put(`/app/products/${id}`, data);
  },
  updateStatus(id: number | string, status: number) {
    return client.put(`/app/products/${id}/status`, { status });
  },
  /** 提交审核 */
  submitReview(id: number | string) {
    return client.put(`/app/products/${id}/submit-review`);
  },
  /** 后台审核（Admin only） */
  review(data: { productId: number | string; approved: boolean; reason?: string }) {
    return client.post('/app/products/admin/review', {
      productId: data.productId,
      auditStatus: data.approved ? 'Approved' : 'Rejected',
      auditReason: data.reason || null,
    });
  },
  /** 删除商品 */
  delete(id: number | string) {
    return client.delete(`/app/products/${id}`);
  },
  /** 公开分类树（仅启用） */
  categories() {
    return client.get('/app/products/categories');
  },
  /** 后台分类树（含禁用） */
  adminCategories() {
    return client.get('/app/products/admin/categories');
  },
  /** 新增或修改分类 */
  saveCategory(data: any) {
    return client.post('/app/products/admin/categories/save', data);
  },
  /** 删除分类 */
  deleteCategory(categoryId: number | string) {
    return client.delete(`/app/products/admin/categories/${categoryId}`);
  },
  /** 修改分类状态 */
  updateCategoryStatus(categoryId: number | string, status: number) {
    return client.put(`/app/products/admin/categories/${categoryId}/status`, { status });
  },
};

// ===== 订单管理（后台） =====
export const adminOrderApi = {
  list(params: any = {}) {
    return client.post('/app/orders/list', params);
  },
  detail(orderId: number | string) {
    return client.get(`/app/orders/${orderId}`);
  },
  ship(orderId: number | string, data: { company: string; trackingNo: string; remark?: string }) {
    return client.put(`/app/orders/${orderId}/ship`, data);
  },
  cancel(orderId: number | string, reason?: string) {
    const params = reason ? { reason } : {};
    return client.put(`/app/orders/${orderId}/cancel`, undefined, { params });
  },
  delete(orderId: number | string) {
    return client.delete(`/app/orders/${orderId}`);
  },
  arbitrate(orderId: number | string, data: { remark: string }) {
    return client.post(`/app/orders/${orderId}/arbitrate`, data);
  },
  tracking(orderId: number | string) {
    return client.get(`/app/orders/${orderId}/tracking`);
  },
};

// ===== 店铺管理（后台） =====
export const adminShopApi = {
  /** 后台完整店铺列表（含所有状态，仅 Admin） */
  list(params: any = {}) {
    return client.post('/app/shops/admin/list', params);
  },
  /** 当前登录用户自己的店铺（ShopOwner 专用） */
  getMyShop() {
    return client.get('/app/shops/me');
  },
  detail(shopId: number | string) {
    return client.get(`/app/shops/detail/${shopId}`);
  },
  updateStatus(shopId: number | string, status: string) {
    return client.put(`/app/shops/${shopId}/status`, { status });
  },
  /** 管理员修改店铺基本信息（不校验所有权） */
  adminUpdate(shopId: number | string, data: any) {
    return client.post(`/app/shops/admin/update/${shopId}`, data);
  },
  /** ShopOwner 更新自己名下店铺信息（后端校验归属） */
  updateOwn(shopId: number | string, data: any) {
    return client.put(`/app/shops/${shopId}`, data);
  },
  review(shopId: number | string, data: any) {
    // Backend: POST /app/shops/admin/review  (ShopReviewDto: shopId, status, remark)
    return client.post('/app/shops/admin/review', { shopId, ...data });
  },
};

// ===== 用户管理（后台） =====
export const adminUserListApi = {
  list(params: any = {}) {
    return client.get('/app/users/admin/list', { params });
  },
  detail(userId: number) {
    return client.get(`/app/users/admin/${userId}`);
  },
  updateStatus(userId: number, status: number) {
    return client.put(`/app/users/admin/${userId}/status`, { status });
  },
  resetPassword(userId: number | string, password: string) {
    return client.put(`/app/users/admin/${userId}/reset-password`, { password });
  },
  create(data: { username: string; password: string; nickname?: string; phone?: string; email?: string; role?: string }) {
    return client.post('/app/users/admin/create', data);
  },
};

// ===== 物流轨迹（DB 轨迹，非第三方API） =====
export const fulfillmentApi = {
  /** 按订单ID查询发货记录（含所有手动轨迹） */
  getByOrder(orderId: number | string) {
    return client.get(`/app/fulfillment/orders/${orderId}`);
  },
  /** 手动追加一条物流轨迹 */
  addTrace(dto: {
    orderId:   number | string;
    status:    string;
    content:   string;
    location?: string;
    lat?:      number;    // 纬度（高德坐标系）
    lng?:      number;    // 经度
    traceTime?: string;   // ISO-8601, e.g. "2024-06-01T14:30:00"
  }) {
    return client.post('/app/fulfillment/traces', dto);
  },
};

// ===== 资源/文件管理 =====
export const fileApi = {
  /** 上传文件到 OSS，返回 { id, url, fileName, fileSize } */
  upload(file: File, bizType?: string) {
    const fd = new FormData();
    fd.append('file', file);
    if (bizType) fd.append('bizType', bizType);
    return client.post('/files/upload', fd);
  },
  /** 分页查询已上传文件（支持 bizType 筛选、文件名搜索、shopId 过滤） */
  list(page = 1, size = 30, bizType?: string, keyword?: string, shopId?: number | string | null) {
    const params: any = { page, size };
    if (bizType) params.bizType = bizType;
    if (keyword) params.keyword = keyword;
    if (shopId != null) params.shopId = shopId;
    return client.get('/files', { params });
  },
  /** Admin 专属：获取所有有图片的店铺（文件夹目录） */
  listShopFolders() {
    return client.get('/files/shops');
  },
  /** 软删除文件 */
  remove(id: number | string) {
    return client.delete(`/files/${id}`);
  },
  /** 从外部 URL 下载图片并转存到我们的 OSS，返回 { id, objectKey, url, fileName } */
  importFromUrl(url: string, bizType?: string) {
    return client.post('/files/import-url', { url, bizType: bizType || 'common' });
  },
};

// ===== 仓库管理 =====
export const warehouseApi = {
  list(shopId?: number | string) {
    return client.get('/app/warehouses', { params: shopId ? { shopId } : {} });
  },
  save(data: any) {
    return client.post('/app/warehouses', data);
  },
  remove(id: number | string) {
    return client.delete(`/app/warehouses/${id}`);
  },
  setDefault(id: number | string) {
    return client.put(`/app/warehouses/${id}/default`);
  },
};

// ===== 营销管理（后台） =====
export const adminMarketingApi = {
  // Banner
  banners() {
    return client.get('/app/marketing/admin/banners');
  },
  saveBanner(data: any) {
    return client.post('/app/marketing/admin/banners', data);
  },
  // 频道
  channels() {
    return client.get('/app/marketing/channels');
  },
  saveChannel(data: any) {
    return client.post('/app/marketing/admin/channels', data);
  },
  // 活动（分页，后台全状态）
  activities(params?: any) {
    return client.post('/app/marketing/admin/activities/list', params);
  },
  saveActivity(data: any) {
    return client.post('/app/marketing/admin/activities', data);
  },
  // 优惠券（分页，后台全状态）
  couponTemplates(params?: any) {
    return client.post('/app/marketing/admin/coupons/list', params);
  },
  saveCouponTemplate(data: any) {
    return client.post('/app/marketing/admin/coupons', data);
  },
  // 通用：更新状态（banners/channels/activities/coupons）
  updateStatus(type: string, id: number, status: number) {
    return client.put(`/app/marketing/admin/${type}/${id}/status`, { status });
  },
  // 榜单
  rankingLists() {
    return client.get('/app/marketing/admin/ranking-lists');
  },
  rankingProducts(listId: number | string) {
    return client.get(`/app/marketing/admin/ranking-lists/${listId}/products`);
  },
  addRankingProducts(listId: number | string, productIds: number[]) {
    return client.post(`/app/marketing/admin/ranking-lists/${listId}/products/batch`, { productIds });
  },
  removeRankingProduct(listId: number | string, productId: number | string) {
    return client.delete(`/app/marketing/admin/ranking-lists/${listId}/products/${productId}`);
  },
  // Ranking list CRUD
  createRankingList(data: any) {
    return client.post('/app/marketing/admin/ranking-lists', data);
  },
  updateRankingList(listId: number | string, data: any) {
    return client.put(`/app/marketing/admin/ranking-lists/${listId}`, data);
  },
  deleteRankingList(listId: number | string) {
    return client.delete(`/app/marketing/admin/ranking-lists/${listId}`);
  },
};
