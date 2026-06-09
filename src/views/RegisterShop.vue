<template>
  <div class="h-screen overflow-y-auto bg-[#F7F8FA] px-4 py-10">
    <div class="w-full max-w-[560px] mx-auto">

      <!-- 返回按钮 -->
      <div class="mb-4">
        <button
          class="flex items-center gap-1.5 text-[13px] text-[#999] hover:text-[#FF6B00] transition-colors"
          @click="router.push('/login')"
        >
          <i class="ri-arrow-left-line text-base"></i>返回登录
        </button>
      </div>

      <!-- 头部 Logo -->
      <div class="text-center mb-8">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF8A3D]
          flex items-center justify-center mx-auto mb-4 shadow-lg">
          <i class="ri-store-3-line text-white text-2xl"></i>
        </div>
        <h1 class="text-[22px] font-bold text-[#1A1A1A] mb-1">开店入驻申请</h1>
        <p class="text-[13px] text-[#999]">填写以下信息，提交后等待平台审核（通常 1-3 个工作日）</p>
      </div>

      <!-- 申请成功状态 -->
      <div v-if="submitted" class="bg-white rounded-2xl shadow-sm border border-[#F0F0F0] p-10 text-center">
        <i class="ri-checkbox-circle-line text-6xl text-[#52C41A] mb-4 block"></i>
        <h2 class="text-[18px] font-semibold text-[#1A1A1A] mb-2">申请已提交！</h2>
        <p class="text-[13px] text-[#666] mb-6">
          平台将在 1-3 个工作日内审核您的申请，审核结果将通过站内消息通知您。
        </p>
        <div class="text-[12px] text-[#999] mb-6">
          申请单号：<span class="font-mono text-[#333]">{{ submitOrderNo }}</span>
        </div>
        <button
          class="px-6 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A3D] text-white text-[14px]"
          @click="router.push('/login')"
        >返回登录</button>
      </div>

      <!-- 申请表单 -->
      <div v-else class="bg-white rounded-2xl shadow-sm border border-[#F0F0F0] p-8">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="default">

          <!-- 基本信息 -->
          <div class="text-[13px] font-semibold text-[#333] mb-4 pb-2 border-b border-[#F5F5F5]">
            <i class="ri-store-2-line text-[#FF6B00] mr-1.5"></i>店铺基本信息
          </div>

          <el-form-item label="店铺名称" prop="shopName">
            <el-input v-model="form.shopName" placeholder="3-50个字符，不可与已有店铺重复" maxlength="50" show-word-limit />
          </el-form-item>

          <el-form-item label="店铺类型" prop="shopType">
            <el-select v-model="form.shopType" placeholder="请选择店铺类型" class="w-full">
              <el-option label="服装服饰" value="clothing" />
              <el-option label="电子数码" value="electronics" />
              <el-option label="家居家具" value="furniture" />
              <el-option label="食品生鲜" value="food" />
              <el-option label="美妆个护" value="beauty" />
              <el-option label="运动户外" value="sports" />
              <el-option label="图书文具" value="books" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>

          <el-form-item label="店铺描述" prop="shopDescription">
            <el-input v-model="form.shopDescription" type="textarea" :rows="3"
              placeholder="简要描述您的店铺特色和主营商品（10-200字）"
              maxlength="200" show-word-limit />
          </el-form-item>

          <el-form-item label="店铺 Logo">
            <div class="flex items-center gap-4">
              <div v-if="form.shopImageUrl" class="relative">
                <img :src="form.shopImageUrl" class="w-20 h-20 rounded-xl object-cover border border-[#F0F0F0]" />
                <button class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#FF4D4F] rounded-full flex items-center justify-center"
                  @click="form.shopImageUrl = ''">
                  <i class="ri-close-line text-white text-[10px]"></i>
                </button>
              </div>
              <FileUpload v-else :action="uploadUrl" :auto="true" :limit="1" :multiple="false"
                accept="image/jpeg,image/png,image/webp"
                :before-upload="beforeUpload"
                @onSuccess="handleLogoSuccess"
                @onError="() => ElMessage.error('Logo 上传失败')"
              />
              <div class="text-[12px] text-[#999]">建议正方形图片，JPG/PNG，≤2MB</div>
            </div>
          </el-form-item>

          <!-- 联系信息 -->
          <div class="text-[13px] font-semibold text-[#333] mb-4 pb-2 border-b border-[#F5F5F5] mt-6">
            <i class="ri-contacts-line text-[#FF6B00] mr-1.5"></i>联系信息
          </div>

          <!-- 联系手机 + 发送验证码 -->
          <el-form-item label="联系手机" prop="contactNumber">
            <div class="flex gap-2 w-full">
              <el-input
                v-model="form.contactNumber"
                placeholder="用于接收审核通知"
                maxlength="11"
                class="flex-1"
                :disabled="phoneVerified"
              />
              <el-button
                :disabled="!isValidPhone || countdown > 0 || phoneVerified"
                :loading="sendingCode"
                class="!flex-shrink-0"
                @click="sendPhoneCode"
              >
                {{ phoneVerified ? '已验证 ✓' : countdown > 0 ? `${countdown}s 后重发` : '发送验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <!-- 手机验证码输入 -->
          <el-form-item v-if="codeSent && !phoneVerified" label="手机验证码" prop="phoneCode">
            <div class="flex gap-2 w-full">
              <el-input
                v-model="form.phoneCode"
                placeholder="请输入收到的 6 位验证码"
                maxlength="6"
                class="flex-1"
              />
              <el-button type="primary" :loading="verifyingCode" @click="verifyPhoneCode">
                验证
              </el-button>
            </div>
            <div class="text-[11px] text-[#999] mt-1">验证码 30 分钟内有效</div>
          </el-form-item>

          <el-form-item label="店铺地址" prop="location">
            <el-input v-model="form.location" placeholder="仓库/经营地址，用于发货" />
          </el-form-item>

          <!-- 承诺条款 -->
          <el-form-item prop="agreed">
            <el-checkbox v-model="form.agreed">
              我已阅读并同意
              <el-button type="primary" link size="small">《商家入驻协议》</el-button>
              和
              <el-button type="primary" link size="small">《平台规则》</el-button>
            </el-checkbox>
          </el-form-item>

          <el-button
            type="primary" class="w-full !h-[46px] !rounded-xl !text-[15px] mt-2"
            :loading="submitting"
            @click="handleSubmit"
          >
            {{ submitting ? '提交中...' : '提交申请' }}
          </el-button>

        </el-form>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, inject } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';
import type { HttpClient } from '@/utils/http';
import { UPLOAD_URL, BASE_URL } from '@/utils/http';
import FileUpload from '@/components/upload/FileUploader.vue';

const router   = useRouter();
const http: HttpClient = inject('http') as HttpClient;
const uploadUrl = UPLOAD_URL;

const formRef    = ref<FormInstance>();
const submitting = ref(false);
const submitted  = ref(false);
const submitOrderNo = ref('');

// 手机验证状态
const sendingCode   = ref(false);
const verifyingCode = ref(false);
const codeSent      = ref(false);
const phoneVerified = ref(false);
const countdown     = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const form = reactive({
  shopName:        '',
  shopType:        '',
  shopDescription: '',
  shopImageUrl:    '',
  contactNumber:   '',
  phoneCode:       '',
  location:        '',
  agreed:          false,
});

const isValidPhone = computed(() => /^1[3-9]\d{9}$/.test(form.contactNumber));

// ── 发送验证码 ────────────────────────────────────────────────────────────────
const sendPhoneCode = async () => {
  if (!isValidPhone.value) { ElMessage.warning('请先填写正确的手机号'); return; }
  sendingCode.value = true;
  try {
    await fetch(`${BASE_URL}/app/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: form.contactNumber, scene: 'register' }),
    });
    ElMessage.success('验证码已发送，请注意查收');
    codeSent.value = true;
    // 60 秒倒计时
    countdown.value = 60;
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) { clearInterval(countdownTimer!); countdownTimer = null; }
    }, 1000);
  } catch {
    ElMessage.error('验证码发送失败，请稍后重试');
  }
  sendingCode.value = false;
};

// ── 验证手机验证码 ────────────────────────────────────────────────────────────
const verifyPhoneCode = async () => {
  if (!form.phoneCode || form.phoneCode.length !== 6) {
    ElMessage.warning('请输入 6 位验证码'); return;
  }
  verifyingCode.value = true;
  try {
    const res = await fetch(`${BASE_URL}/app/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: form.contactNumber, code: form.phoneCode }),
    });
    const json = await res.json();
    const valid = json?.data?.valid ?? json?.valid ?? false;
    if (valid) {
      phoneVerified.value = true;
      ElMessage.success('手机号验证成功');
    } else {
      ElMessage.error('验证码错误或已过期，请重新发送');
    }
  } catch {
    ElMessage.error('验证失败，请稍后重试');
  }
  verifyingCode.value = false;
};

// ── 表单规则 ──────────────────────────────────────────────────────────────────
const rules = {
  shopName: [
    { required: true, message: '请填写店铺名称', trigger: 'blur' },
    { min: 2, max: 50, message: '2-50 个字符', trigger: 'blur' },
  ],
  shopType: [{ required: true, message: '请选择店铺类型', trigger: 'change' }],
  shopDescription: [
    { required: true, message: '请填写店铺描述', trigger: 'blur' },
    { min: 10, message: '描述至少 10 个字符', trigger: 'blur' },
  ],
  contactNumber: [
    { required: true, message: '请填写联系手机', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' },
  ],
  location: [{ required: true, message: '请填写店铺地址', trigger: 'blur' }],
  agreed: [{
    validator: (_: any, value: boolean, callback: any) =>
      value ? callback() : callback(new Error('请阅读并同意相关协议')),
    trigger: 'change',
  }],
};

// ── Logo 上传 ─────────────────────────────────────────────────────────────────
const beforeUpload = (file: { type: string; size: number }) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    ElMessage.error('请上传 JPG/PNG/WebP 格式图片'); return false;
  }
  if (file.size / 1024 / 1024 > 2) {
    ElMessage.error('图片大小不能超过 2MB'); return false;
  }
  return true;
};
const handleLogoSuccess = (response: any) => {
  form.shopImageUrl = response?.data?.url || response?.data || '';
};

// ── 提交申请 ──────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return;
    if (!phoneVerified.value) {
      ElMessage.warning('请先完成手机号验证'); return;
    }
    submitting.value = true;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const payload = {
        shopName:        form.shopName,
        shopDescription: form.shopDescription,
        shopType:        form.shopType,
        phone:           form.contactNumber,
        location:        form.location,
        shopImage:       form.shopImageUrl || undefined,
        ownerUserId:     user.id,
      };
      const res: any = await http.post('/app/shops/apply', payload);
      const data = res?.data?.data || res?.data || {};
      submitOrderNo.value = data.shopId || data.id || '—';
      submitted.value = true;
      ElMessage.success('申请提交成功，请等待审核！');
    } catch { /* 拦截器已处理 */ }
    finally { submitting.value = false; }
  });
};
</script>
