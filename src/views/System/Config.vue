<template>
  <div class="page space-y-4">

    <!-- 平台基本信息 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-6">
      <div class="flex items-center gap-2 mb-5">
        <i class="ri-store-2-line text-[#FF6B00] text-[16px]"></i>
        <h3 class="text-[14px] font-semibold text-[#333]">平台基本信息</h3>
      </div>
      <el-form :model="basic" label-width="100px" class="max-w-[640px]">
        <el-form-item label="平台名称"><el-input v-model="basic.platformName" placeholder="如：优选商城" /></el-form-item>
        <el-form-item label="平台英文名称"><el-input v-model="basic.platformNameEn" placeholder="如：YXShop" /></el-form-item>
        <el-form-item label="平台 Logo">
          <div class="flex items-start gap-4">
            <MediaPicker v-model="basic.platformLogo" :preview-size="72" bizType="config" />
            <div class="text-[11px] text-[#999] leading-relaxed mt-1">
              <p>推荐尺寸：200×60px</p>
              <p>支持 PNG / SVG，背景透明更佳</p>
              <p v-if="basic.platformLogo" class="text-[#409EFF] break-all mt-1 max-w-[300px] truncate">{{ basic.platformLogo }}</p>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="平台描述"><el-input v-model="basic.platformDesc" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="联系邮箱"><el-input v-model="basic.contactEmail" /></el-form-item>
        <el-form-item label="客服电话"><el-input v-model="basic.servicePhone" /></el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving.basic" @click="saveBasic">保存基本信息</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 注册与登录策略 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-6">
      <div class="flex items-center gap-2 mb-5">
        <i class="ri-shield-keyhole-line text-[#FF6B00] text-[16px]"></i>
        <h3 class="text-[14px] font-semibold text-[#333]">注册与登录策略</h3>
      </div>
      <el-form :model="auth" label-width="140px" class="max-w-[640px]">
        <el-form-item label="允许手机号注册">
          <el-switch v-model="auth.allowPhoneRegister" />
        </el-form-item>
        <el-form-item label="允许邮箱注册">
          <el-switch v-model="auth.allowEmailRegister" />
        </el-form-item>
        <el-form-item label="允许微信小程序登录">
          <el-switch v-model="auth.allowWechatLogin" />
        </el-form-item>
        <el-form-item label="新用户需审核">
          <el-switch v-model="auth.newUserNeedReview" />
        </el-form-item>
        <el-form-item label="登录失败锁定次数">
          <el-input-number v-model="auth.loginLockCount" :min="3" :max="20" />
          <span class="ml-2 text-[12px] text-[#999]">次后锁定账号</span>
        </el-form-item>
        <el-form-item label="Token有效期（小时）">
          <el-input-number v-model="auth.tokenExpireHours" :min="1" :max="720" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving.auth" @click="saveAuth">保存登录策略</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 店铺申请策略 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-6">
      <div class="flex items-center gap-2 mb-5">
        <i class="ri-store-line text-[#FF6B00] text-[16px]"></i>
        <h3 class="text-[14px] font-semibold text-[#333]">店铺申请策略</h3>
      </div>
      <el-form :model="shop" label-width="140px" class="max-w-[640px]">
        <el-form-item label="开放申请入驻">
          <el-switch v-model="shop.openApply" />
        </el-form-item>
        <el-form-item label="申请需人工审核">
          <el-switch v-model="shop.needReview" />
        </el-form-item>
        <el-form-item label="单用户最多开店数">
          <el-input-number v-model="shop.maxShopsPerUser" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="商品默认审核状态">
          <el-select v-model="shop.defaultProductAudit" class="!w-[180px]">
            <el-option label="自动通过" value="Approved" />
            <el-option label="待审核" value="Pending" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving.shop" @click="saveShop">保存店铺策略</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 内容安全策略 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-6">
      <div class="flex items-center gap-2 mb-5">
        <i class="ri-eye-2-line text-[#FF6B00] text-[16px]"></i>
        <h3 class="text-[14px] font-semibold text-[#333]">内容安全策略</h3>
      </div>
      <el-form :model="content" label-width="160px" class="max-w-[640px]">
        <el-form-item label="帖子发布需审核">
          <el-switch v-model="content.postNeedReview" />
        </el-form-item>
        <el-form-item label="评价发布需审核">
          <el-switch v-model="content.reviewNeedReview" />
        </el-form-item>
        <el-form-item label="单用户每日发帖上限">
          <el-input-number v-model="content.dailyPostLimit" :min="1" :max="100" />
          <span class="ml-2 text-[12px] text-[#999]">条</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving.content" @click="saveContent">保存内容策略</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 通知推送配置 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-6">
      <div class="flex items-center gap-2 mb-5">
        <i class="ri-notification-2-line text-[#FF6B00] text-[16px]"></i>
        <h3 class="text-[14px] font-semibold text-[#333]">通知推送配置</h3>
      </div>
      <el-form :model="notify" label-width="160px" class="max-w-[640px]">
        <el-form-item label="订单状态变更通知">
          <el-switch v-model="notify.orderStatusNotify" />
        </el-form-item>
        <el-form-item label="优惠券到期提醒">
          <el-switch v-model="notify.couponExpireNotify" />
        </el-form-item>
        <el-form-item label="积分变动通知">
          <el-switch v-model="notify.pointsChangeNotify" />
        </el-form-item>
        <el-form-item label="提前提醒天数">
          <el-input-number v-model="notify.remindDaysBefore" :min="1" :max="30" />
          <span class="ml-2 text-[12px] text-[#999]">天</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving.notify" @click="saveNotify">保存推送配置</el-button>
        </el-form-item>
      </el-form>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { systemConfigApi } from '@/utils/admin-api';
import { AUDIT_STATUS } from '@/constants/status';
import MediaPicker from '@/components/MediaPicker/MediaPicker.vue';

// 各分区表单
const basic = reactive({
  platformName: 'YXShop 优选商城',
  platformNameEn: 'YXShop',
  platformLogo: '',
  platformDesc: '精选全球好物，品质生活首选',
  contactEmail: 'support@yxshop.local',
  servicePhone: '400-888-8888',
});

const auth = reactive({
  allowPhoneRegister: true,
  allowEmailRegister: true,
  allowWechatLogin: true,
  newUserNeedReview: false,
  loginLockCount: 5,
  tokenExpireHours: 72,
});

const shop = reactive({
  openApply: true,
  needReview: true,
  maxShopsPerUser: 3,
  defaultProductAudit: AUDIT_STATUS.PENDING,
});

const content = reactive({
  postNeedReview: true,
  reviewNeedReview: false,
  dailyPostLimit: 20,
});

const notify = reactive({
  orderStatusNotify: true,
  couponExpireNotify: true,
  pointsChangeNotify: true,
  remindDaysBefore: 3,
});

const saving = reactive({ basic: false, auth: false, shop: false, content: false, notify: false });

// 加载远端配置
onMounted(async () => {
  try {
    const res: any = await systemConfigApi.get();
    const cfg = res.data?.data || res.data || {};
    if (cfg.basic)   Object.assign(basic,   cfg.basic);
    if (cfg.auth)    Object.assign(auth,    cfg.auth);
    if (cfg.shop)    Object.assign(shop,    cfg.shop);
    if (cfg.content) Object.assign(content, cfg.content);
    if (cfg.notify)  Object.assign(notify,  cfg.notify);
  } catch { /* 使用默认值 */ }
});

async function saveSection(key: keyof typeof saving, payload: object) {
  saving[key] = true;
  try {
    await systemConfigApi.save(key, payload);
    ElMessage.success('保存成功');
  } catch { ElMessage.error('保存失败'); }
  finally { saving[key] = false; }
}

const saveBasic = () => saveSection('basic', basic);
const saveAuth = () => saveSection('auth', auth);
const saveShop = () => saveSection('shop', shop);
const saveContent = () => saveSection('content', content);
const saveNotify = () => saveSection('notify', notify);
</script>
