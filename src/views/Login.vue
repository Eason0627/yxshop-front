<template>
  <div class="login-page min-h-screen flex items-center justify-center bg-[#F7F8FA] p-6">
    <div class="w-full max-w-[400px]">

      <!-- Logo -->
      <div class="text-center mb-8">
        <img src="/logo.png" alt="壹心商城" class="w-[88px] h-[88px] mx-auto object-contain mb-3" />
        <h1 class="text-[30px] font-bold tracking-wide" style="color: #FF6B00;">壹心商城</h1>
        <p class="text-[13px] text-[#999] mt-1.5 tracking-widest">— 壹心优选 · 品质生活 —</p>
      </div>

      <!-- 登录表单 -->
      <div class="bg-white rounded-2xl shadow-sm border border-[#F0F0F0] p-8">

        <!-- Tab 切换 -->
        <div class="flex bg-[#F7F8FA] rounded-xl p-1 mb-6 gap-1">
          <button
            class="flex-1 h-[36px] rounded-lg text-[13px] font-medium transition-all"
            :class="loginMode === 'password' ? 'bg-white text-[#333] shadow-sm' : 'text-[#999] hover:text-[#666]'"
            @click="loginMode = 'password'; errorMsg = ''"
          >账号密码登录</button>
          <button
            class="flex-1 h-[36px] rounded-lg text-[13px] font-medium transition-all"
            :class="loginMode === 'phone' ? 'bg-white text-[#333] shadow-sm' : 'text-[#999] hover:text-[#666]'"
            @click="loginMode = 'phone'; errorMsg = ''"
          >手机验证码登录</button>
        </div>

        <!-- ── 账号密码 ── -->
        <template v-if="loginMode === 'password'">
          <div class="mb-5">
            <label class="block text-[13px] font-medium text-[#333] mb-2">用户名</label>
            <div class="relative">
              <i class="ri-user-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[#BBB] text-base"></i>
              <input v-model="pwdForm.username" type="text" placeholder="请输入用户名"
                class="input-field pl-10 pr-4" @keyup.enter="handlePwdLogin" />
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-[13px] font-medium text-[#333] mb-2">密码</label>
            <div class="relative">
              <i class="ri-lock-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[#BBB] text-base"></i>
              <input v-model="pwdForm.password" :type="showPwd ? 'text' : 'password'" placeholder="请输入密码"
                class="input-field pl-10 pr-10" @keyup.enter="handlePwdLogin" />
              <button class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#BBB] hover:text-[#666]"
                @click="showPwd = !showPwd">
                <i :class="showPwd ? 'ri-eye-off-line' : 'ri-eye-line'" class="text-base"></i>
              </button>
            </div>
          </div>

          <!-- 记住密码 + 忘记密码（同一行） -->
          <div class="mb-5 flex items-center justify-between">
            <div class="flex items-center gap-1.5 cursor-pointer" @click="rememberPwd = !rememberPwd">
              <div class="w-[16px] h-[16px] rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 transition-all"
                :class="rememberPwd ? 'bg-[#FF6B00] border-[#FF6B00]' : 'bg-white border-[#D0D0D0]'">
                <i v-if="rememberPwd" class="ri-check-line text-white" style="font-size:10px;line-height:1"></i>
              </div>
              <span class="text-[12px] text-[#666] select-none">记住密码</span>
            </div>
            <button class="text-[12px] text-[#999] hover:text-[#FF6B00] transition-colors" @click="openForgotPwd">
              忘记密码？
            </button>
          </div>

          <button class="btn-primary w-full" :disabled="loading" @click="handlePwdLogin">
            <i v-if="loading" class="ri-loader-4-line animate-spin text-base"></i>
            <span>{{ loading ? '登录中...' : '登 录' }}</span>
          </button>
        </template>

        <!-- ── 手机验证码 ── -->
        <template v-else>
          <div class="mb-4 px-3 py-2 bg-[#FFFBE6] border border-[#FFE58F] rounded-xl text-[12px] text-[#AD6800] leading-relaxed">
            <i class="ri-information-line mr-1"></i>
            短信服务未配置时验证码不会下发，测试可使用固定码
            <strong class="font-mono tracking-widest">123456</strong>。
          </div>
          <div class="mb-5">
            <label class="block text-[13px] font-medium text-[#333] mb-2">手机号</label>
            <div class="relative">
              <i class="ri-smartphone-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[#BBB] text-base"></i>
              <input v-model="phoneForm.phone" type="tel" placeholder="请输入手机号" maxlength="11"
                class="input-field pl-10 pr-4" />
            </div>
          </div>
          <div class="mb-6">
            <label class="block text-[13px] font-medium text-[#333] mb-2">验证码</label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <i class="ri-shield-keyhole-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[#BBB] text-base"></i>
                <input v-model="phoneForm.code" type="text" placeholder="请输入验证码" maxlength="6"
                  class="input-field pl-10 pr-4 w-full" @keyup.enter="handlePhoneLogin" />
              </div>
              <button
                class="h-[46px] px-4 rounded-xl text-[13px] font-medium border transition-all flex-shrink-0"
                :class="canSendCode ? 'border-[#FF6B00] text-[#FF6B00] hover:bg-[#FFF4E6]' : 'border-[#E8E8E8] text-[#CCC] cursor-not-allowed'"
                :disabled="!canSendCode || sendingCode"
                @click="sendLoginCode"
              >
                <i v-if="sendingCode" class="ri-loader-4-line animate-spin"></i>
                <span v-else>{{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}</span>
              </button>
            </div>
          </div>
          <button class="btn-primary w-full" :disabled="loading" @click="handlePhoneLogin">
            <i v-if="loading" class="ri-loader-4-line animate-spin text-base"></i>
            <span>{{ loading ? '登录中...' : '登 录' }}</span>
          </button>
        </template>

        <p v-if="errorMsg" class="mt-4 text-[13px] text-center text-[#FF4D4F] bg-[#FFF1F0] py-2 rounded-lg">
          {{ errorMsg }}
        </p>
      </div>

      <div class="flex items-center justify-center gap-4 mt-6 text-[12px] text-[#999]">
        <span>还没有账号？</span>
        <router-link to="/register-shop" class="text-[#FF6B00] hover:underline">申请开店入驻</router-link>
      </div>
      <p class="text-center text-[12px] text-[#CCC] mt-3">YXShop Admin v1.0</p>
    </div>
  </div>

  <!-- ── 拼图验证弹窗 ── -->
  <div v-if="captchaVisible"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="captchaVisible = false"
  >
    <div class="bg-white rounded-2xl shadow-2xl p-6 w-[370px] mx-4">
      <div class="flex items-center justify-between mb-4">
        <span class="text-[15px] font-semibold text-[#333]">请完成安全验证</span>
        <button class="w-7 h-7 flex items-center justify-center rounded-lg text-[#BBB] hover:text-[#666] hover:bg-[#F5F5F5] transition-colors"
          @click="captchaVisible = false">
          <i class="ri-close-line text-base"></i>
        </button>
      </div>
      <SliderCaptcha ref="sliderRef" @verified="onSliderVerified" />
      <p class="mt-3 text-[11px] text-center text-[#CCC]">拖动滑块，使拼图图案正确对齐缺口</p>
      <div v-if="sliderRef?.loadFailed" class="mt-3 pt-3 border-t border-[#F5F5F5] text-center">
        <button
          class="text-[12px] text-[#BBB] hover:text-[#FF6B00] underline transition-colors"
          @click="onSliderVerified('')"
        >验证服务不可用，跳过验证直接登录</button>
      </div>
    </div>
  </div>

  <!-- ── 忘记密码弹窗 ── -->
  <div v-if="forgotVisible"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="closeForgotPwd"
  >
    <div class="bg-white rounded-2xl shadow-2xl p-6 w-[380px] mx-4">
      <!-- 标题 -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <span class="text-[15px] font-semibold text-[#333]">重置密码</span>
          <p class="text-[11px] text-[#999] mt-0.5">通过手机号或邮箱验证身份后重置</p>
        </div>
        <button class="w-7 h-7 flex items-center justify-center rounded-lg text-[#BBB] hover:text-[#666] hover:bg-[#F5F5F5]"
          @click="closeForgotPwd">
          <i class="ri-close-line text-base"></i>
        </button>
      </div>

      <!-- Admin 账号提示 -->
      <div class="mb-4 px-3 py-2 bg-[#F6F8FF] border border-[#D6E4FF] rounded-xl text-[12px] text-[#1D39C4] leading-relaxed">
        <i class="ri-information-line mr-1"></i>
        <strong>平台管理员（Admin）账号</strong>无法通过此页面重置，请联系系统运维人员操作。
      </div>

      <!-- 手机号 / 邮箱 -->
      <div class="mb-4">
        <label class="block text-[13px] font-medium text-[#333] mb-2">手机号 / 邮箱</label>
        <div class="flex gap-2">
          <div class="relative flex-1">
            <i class="ri-account-circle-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[#BBB] text-base"></i>
            <input v-model="forgotForm.account" type="text" placeholder="请输入手机号或注册邮箱"
              class="input-field pl-10 pr-4 w-full" :disabled="forgotCodeSent" />
          </div>
          <button
            class="h-[46px] px-3 rounded-xl text-[12px] font-medium border transition-all flex-shrink-0 whitespace-nowrap"
            :class="canSendForgotCode
              ? 'border-[#FF6B00] text-[#FF6B00] hover:bg-[#FFF4E6]'
              : 'border-[#E8E8E8] text-[#CCC] cursor-not-allowed'"
            :disabled="!canSendForgotCode || forgotSending"
            @click="sendForgotCode"
          >
            <i v-if="forgotSending" class="ri-loader-4-line animate-spin"></i>
            <span v-else>{{ forgotCountdown > 0 ? `${forgotCountdown}s` : (forgotCodeSent ? '重新发送' : '发送验证码') }}</span>
          </button>
        </div>
        <p class="mt-1 text-[11px] text-[#BBB]">
          手机号收短信验证码，邮箱收邮件验证码
        </p>
      </div>

      <!-- 验证码 -->
      <div class="mb-4">
        <label class="block text-[13px] font-medium text-[#333] mb-2">验证码</label>
        <div class="relative">
          <i class="ri-shield-keyhole-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[#BBB] text-base"></i>
          <input v-model="forgotForm.code" type="text" placeholder="请输入收到的验证码" maxlength="6"
            class="input-field pl-10 pr-4" />
        </div>
      </div>

      <!-- 新密码 -->
      <div class="mb-4">
        <label class="block text-[13px] font-medium text-[#333] mb-2">新密码</label>
        <div class="relative">
          <i class="ri-lock-password-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[#BBB] text-base"></i>
          <input v-model="forgotForm.newPwd" :type="showNewPwd ? 'text' : 'password'"
            placeholder="至少 6 位" class="input-field pl-10 pr-10" />
          <button class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#BBB] hover:text-[#666]"
            @click="showNewPwd = !showNewPwd">
            <i :class="showNewPwd ? 'ri-eye-off-line' : 'ri-eye-line'" class="text-base"></i>
          </button>
        </div>
      </div>

      <!-- 确认新密码 -->
      <div class="mb-5">
        <label class="block text-[13px] font-medium text-[#333] mb-2">确认新密码</label>
        <div class="relative">
          <i class="ri-lock-password-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[#BBB] text-base"></i>
          <input v-model="forgotForm.confirmPwd" :type="showNewPwd ? 'text' : 'password'"
            placeholder="再次输入新密码" class="input-field pl-10 pr-4" @keyup.enter="submitForgotPwd" />
        </div>
      </div>

      <!-- 错误提示 -->
      <p v-if="forgotError" class="mb-3 text-[12px] text-center text-[#FF4D4F] bg-[#FFF1F0] py-2 rounded-lg">
        {{ forgotError }}
      </p>

      <!-- 按钮 -->
      <div class="flex gap-2">
        <button class="flex-1 h-[42px] rounded-xl border border-[#E8E8E8] text-[13px] text-[#666] hover:bg-[#F7F8FA] transition-colors"
          @click="closeForgotPwd">取消</button>
        <button
          class="flex-1 h-[42px] rounded-xl text-[13px] font-medium text-white transition-all"
          :class="canSubmitForgot ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8A3D] hover:shadow-md' : 'bg-[#F0F0F0] text-[#CCC] cursor-not-allowed'"
          :disabled="!canSubmitForgot || forgotSubmitting"
          @click="submitForgotPwd"
        >
          <i v-if="forgotSubmitting" class="ri-loader-4-line animate-spin mr-1"></i>
          {{ forgotSubmitting ? '提交中...' : '确认重置' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import client from '@/utils/http';
import { getDefaultRoute } from '@/utils/permission';
import { useUserStore } from '@/store/user';
import { BASE_URL } from '@/utils/http';
import SliderCaptcha from '@/components/SliderCaptcha.vue';

const router    = useRouter();
const userStore = useUserStore();

const loginMode = ref<'password' | 'phone'>('password');
const loading   = ref(false);
const errorMsg  = ref('');
const showPwd   = ref(false);

// ── 账号密码表单 ──────────────────────────────────────────────────────────────
const pwdForm = reactive({
  username: localStorage.getItem('admin_username') || '',
  password: '',
});

// ── 记住密码 ──────────────────────────────────────────────────────────────────
const rememberPwd = ref(localStorage.getItem('admin_remember') === '1');

// 初始化时回填已保存的密码
if (rememberPwd.value) {
  try {
    const saved = localStorage.getItem('admin_saved_pwd');
    if (saved) pwdForm.password = decodeURIComponent(escape(atob(saved)));
  } catch { /* ignore */ }
}

const saveCredentials = () => {
  if (rememberPwd.value) {
    localStorage.setItem('admin_remember', '1');
    localStorage.setItem('admin_saved_pwd', btoa(unescape(encodeURIComponent(pwdForm.password))));
  } else {
    localStorage.removeItem('admin_remember');
    localStorage.removeItem('admin_saved_pwd');
  }
};

// ── 手机验证码表单 ─────────────────────────────────────────────────────────────
const phoneForm     = reactive({ phone: '', code: '' });
const sendingCode   = ref(false);
const codeCountdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const canSendCode = computed(() =>
  /^1[3-9]\d{9}$/.test(phoneForm.phone) && codeCountdown.value === 0
);

const sendLoginCode = async () => {
  if (!canSendCode.value) return;
  sendingCode.value = true;
  try {
    await fetch(`${BASE_URL}/app/auth/send-code`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ account: phoneForm.phone, scene: 'login' }),
    });
    codeCountdown.value = 60;
    countdownTimer = setInterval(() => {
      codeCountdown.value--;
      if (codeCountdown.value <= 0) { clearInterval(countdownTimer!); countdownTimer = null; }
    }, 1000);
  } catch {
    errorMsg.value = '验证码发送失败，请稍后重试';
  }
  sendingCode.value = false;
};

// ── 拼图验证弹窗 ──────────────────────────────────────────────────────────────
const captchaVisible = ref(false);
const sliderRef      = ref<InstanceType<typeof SliderCaptcha> | null>(null);

const handlePwdLogin = () => {
  errorMsg.value = '';
  if (!pwdForm.username.trim()) { errorMsg.value = '请输入用户名'; return; }
  if (!pwdForm.password)        { errorMsg.value = '请输入密码';   return; }
  captchaVisible.value = true;
};

const onSliderVerified = async (token: string) => {
  captchaVisible.value = false;
  loading.value = true;
  try {
    let data: any = null;

    // raw fetch 绕过全局 error toast（非 admin 账号时 4xx 会静默忽略）
    try {
      const adminRes = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: pwdForm.username.trim(), password: pwdForm.password }),
      });
      if (adminRes.ok) {
        const json = await adminRes.json();
        data = json?.data?.data || json?.data || json;
      }
    } catch { /* 网络异常，继续尝试 ShopOwner 登录 */ }

    if (!data?.token) {
      const r2: any = await (client as any).post('/app/auth/login', {
        account:            pwdForm.username.trim(),
        password:           pwdForm.password,
        captchaVerifyParam: token,
      });
      data = r2.data?.data || r2.data;
    }

    doSetUser(data);
  } catch (e: any) {
    errorMsg.value = e?.message || '登录失败，请重试';
  } finally {
    loading.value = false;
  }
};

// ── 手机验证码登录 ────────────────────────────────────────────────────────────
const handlePhoneLogin = async () => {
  errorMsg.value = '';
  if (!/^1[3-9]\d{9}$/.test(phoneForm.phone)) { errorMsg.value = '请输入正确的手机号'; return; }
  if (!phoneForm.code) { errorMsg.value = '请输入验证码'; return; }
  loading.value = true;
  try {
    const r: any = await (client as any).post('/app/auth/login', {
      account: phoneForm.phone,
      code:    phoneForm.code,
      scene:   'login',
    });
    doSetUser(r.data?.data || r.data);
  } catch (e: any) {
    errorMsg.value = e?.message || '登录失败，验证码可能已过期';
  } finally {
    loading.value = false;
  }
};

// ── 公共：写入用户信息并跳转 ──────────────────────────────────────────────────
const doSetUser = (data: any) => {
  if (!data?.token) { errorMsg.value = '账号或密码错误'; return; }
  const role: string = data.role || data.userType || 'Customer';
  if (role === 'Customer') { errorMsg.value = '您尚未开店，无法登录后台管理系统'; return; }
  saveCredentials();
  userStore.setUser({
    token: data.token, id: data.userId || data.id,
    username: data.username, realName: data.realName || data.username, role,
  });
  localStorage.setItem('admin_username', pwdForm.username.trim() || phoneForm.phone);
  router.push(getDefaultRoute(role));
};

// ── 忘记密码 ──────────────────────────────────────────────────────────────────
const forgotVisible   = ref(false);
const forgotCodeSent  = ref(false);
const forgotSending   = ref(false);
const forgotSubmitting = ref(false);
const forgotCountdown = ref(0);
const showNewPwd      = ref(false);
const forgotError     = ref('');
let forgotTimer: ReturnType<typeof setInterval> | null = null;

const forgotForm = reactive({ account: '', code: '', newPwd: '', confirmPwd: '' });

const canSubmitForgot = computed(() =>
  forgotForm.code.length >= 4 && forgotForm.newPwd.length >= 6 && !!forgotForm.confirmPwd
);

const canSendForgotCode = computed(() => {
  const v = forgotForm.account.trim();
  const isPhone = /^1[3-9]\d{9}$/.test(v);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  return (isPhone || isEmail) && forgotCountdown.value === 0;
});

const openForgotPwd = () => {
  forgotError.value     = '';
  forgotCodeSent.value  = false;
  forgotCountdown.value = 0;
  Object.assign(forgotForm, { account: '', code: '', newPwd: '', confirmPwd: '' });
  forgotVisible.value   = true;
};

const closeForgotPwd = () => {
  forgotVisible.value = false;
  if (forgotTimer) { clearInterval(forgotTimer); forgotTimer = null; }
};

const sendForgotCode = async () => {
  if (!canSendForgotCode.value) return;
  forgotSending.value = true;
  forgotError.value   = '';
  try {
    await fetch(`${BASE_URL}/app/auth/send-code`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ account: forgotForm.account.trim(), scene: 'resetPwd' }),
    });
    forgotCodeSent.value  = true;
    forgotCountdown.value = 60;
    forgotTimer = setInterval(() => {
      forgotCountdown.value--;
      if (forgotCountdown.value <= 0) { clearInterval(forgotTimer!); forgotTimer = null; }
    }, 1000);
  } catch {
    forgotError.value = '验证码发送失败，请稍后重试';
  }
  forgotSending.value = false;
};

const submitForgotPwd = async () => {
  forgotError.value = '';
  if (!forgotForm.code)                          { forgotError.value = '请输入验证码';       return; }
  if (!forgotForm.newPwd)                        { forgotError.value = '请输入新密码';       return; }
  if (forgotForm.newPwd.length < 6)              { forgotError.value = '密码至少 6 位';      return; }
  if (forgotForm.newPwd !== forgotForm.confirmPwd) { forgotError.value = '两次密码输入不一致'; return; }

  forgotSubmitting.value = true;
  try {
    await (client as any).put('/app/auth/reset-password', {
      account:     forgotForm.account.trim(),
      code:        forgotForm.code,
      newPassword: forgotForm.newPwd,
      scene:       'resetPwd',
    });
    closeForgotPwd();
    localStorage.removeItem('admin_saved_pwd');
    localStorage.removeItem('admin_remember');
    rememberPwd.value = false;
    alert('密码重置成功，请使用新密码登录');
  } catch (e: any) {
    forgotError.value = e?.message || '重置失败，验证码可能已过期';
  } finally {
    forgotSubmitting.value = false;
  }
};

// ── 初始化：恢复记住的密码 ────────────────────────────────────────────────────
onMounted(() => {
  if (rememberPwd.value) {
    const saved = localStorage.getItem('admin_saved_pwd');
    if (saved) {
      try {
        pwdForm.password = decodeURIComponent(escape(atob(saved)));
      } catch { /* 解码失败则忽略 */ }
    }
  }
});

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
  if (forgotTimer)    clearInterval(forgotTimer);
});
</script>

<style scoped>
.login-page { min-height: 100vh; }
.input-field {
  width: 100%; height: 46px; background: #F7F8FA;
  border: 1px solid #F0F0F0; border-radius: 12px;
  font-size: 14px; color: #333; outline: none;
  transition: border-color 0.2s, background 0.2s; padding-right: 16px;
}
.input-field:focus { border-color: #FF6B00; background: white; }
.input-field:disabled { opacity: 0.6; cursor: not-allowed; }
.input-field::placeholder { color: #C0C0C0; }
.btn-primary {
  height: 46px; border-radius: 12px;
  background: linear-gradient(to right, #FF6B00, #FF8A3D);
  color: white; font-size: 14px; font-weight: 500;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: box-shadow 0.2s, transform 0.1s;
}
.btn-primary:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(255,107,0,.35); }
.btn-primary:active:not(:disabled) { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
