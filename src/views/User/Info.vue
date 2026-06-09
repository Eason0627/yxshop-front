<template>
  <div class="page">
    <div v-if="loading" class="flex items-center justify-center h-64">
      <el-icon class="is-loading text-[28px] text-[#FF6B00]"><i class="ri-loader-4-line"></i></el-icon>
    </div>

    <template v-else>
      <div class="grid grid-cols-3 gap-4">

        <!-- 左：头像 + 角色卡 -->
        <div class="col-span-1">
          <div class="bg-white rounded-xl border border-[#F0F0F0] p-6 text-center">
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF9500] flex items-center justify-center mx-auto mb-4 shadow-md">
              <i class="ri-user-3-line text-white text-3xl"></i>
            </div>
            <div class="text-[16px] font-bold text-[#1A1A1A] mb-1">{{ form.realName || form.username || '—' }}</div>
            <div class="text-[12px] text-[#999] mb-3">@{{ form.username }}</div>
            <el-tag :type="roleTagType" size="default" effect="plain" class="!text-[13px]">
              {{ roleText }}
            </el-tag>
            <div class="mt-4 pt-4 border-t border-[#F5F5F5] text-left space-y-2">
              <div class="flex justify-between text-[12px]">
                <span class="text-[#999]">账号 ID</span>
                <span class="text-[#555] font-mono">{{ form.id || '—' }}</span>
              </div>
              <div class="flex justify-between text-[12px]">
                <span class="text-[#999]">账号状态</span>
                <el-tag type="success" size="small" effect="plain">正常</el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 右：编辑表单 -->
        <div class="col-span-2 space-y-4">

          <!-- 基本信息 -->
          <div class="bg-white rounded-xl border border-[#F0F0F0] p-5">
            <div class="flex items-center gap-2 mb-4">
              <i class="ri-user-line text-[#FF6B00]"></i>
              <span class="text-[14px] font-semibold text-[#333]">基本信息</span>
            </div>
            <el-form :model="form" label-width="80px" size="default">
              <div class="grid grid-cols-2 gap-x-4">
                <el-form-item label="用户名">
                  <el-input v-model="form.username" disabled />
                </el-form-item>
                <el-form-item label="显示名称">
                  <el-input v-model="form.realName" placeholder="昵称或真实姓名" maxlength="30" />
                </el-form-item>
                <el-form-item label="联系手机">
                  <el-input v-model="form.phone" maxlength="20" />
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input v-model="form.email" maxlength="100" />
                </el-form-item>
              </div>
            </el-form>
            <div class="flex justify-end">
              <el-button type="primary" :loading="saving" @click="saveProfile">保存修改</el-button>
            </div>
          </div>

          <!-- 修改密码 -->
          <div class="bg-white rounded-xl border border-[#F0F0F0] p-5">
            <div class="flex items-center gap-2 mb-4">
              <i class="ri-lock-line text-[#165DFF]"></i>
              <span class="text-[14px] font-semibold text-[#333]">修改密码</span>
            </div>
            <el-form :model="pwdForm" label-width="80px" size="default">
              <div class="grid grid-cols-2 gap-x-4">
                <el-form-item label="当前密码">
                  <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
                </el-form-item>
                <div></div>
                <el-form-item label="新密码">
                  <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="至少 6 位" />
                </el-form-item>
                <el-form-item label="确认密码">
                  <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
                </el-form-item>
              </div>
            </el-form>
            <div class="flex justify-end">
              <el-button type="primary" :loading="pwdSaving" @click="savePassword">修改密码</el-button>
            </div>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import client from '@/utils/http';
import { adminAuthApi } from '@/utils/admin-api';
import { useUserStore } from '@/store/user';
import { getRoleText } from '@/utils/permission';

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const pwdSaving = ref(false);

const form = reactive({
  id:       userStore.id as any,
  username: userStore.username,
  realName: userStore.realName,
  phone:    '',
  email:    '',
});

const pwdForm = reactive({
  oldPassword:     '',
  newPassword:     '',
  confirmPassword: '',
});

const roleText = computed(() => getRoleText(userStore.role));
const roleTagType = computed((): any => {
  const map: Record<string, string> = {
    Admin: 'warning', ShopOwner: 'success', ShopStaff: '', Customer: 'info',
  };
  return map[userStore.role] ?? 'info';
});

const loadProfile = async () => {
  loading.value = true;
  try {
    if (userStore.isAdmin) {
      const res: any = await adminAuthApi.me();
      const data = res.data?.data || res.data || {};
      form.username = data.username || userStore.username;
      form.realName = data.realName || data.nickname || userStore.realName;
      form.phone    = data.mobile || '';
      form.email    = data.email || '';
    } else {
      const res: any = await (client as any).get('/app/users/me');
      const data = res.data?.data || res.data || {};
      form.username = data.username || userStore.username;
      form.realName = data.realName || data.nickname || userStore.realName;
      form.phone    = data.phone || '';
      form.email    = '';
    }
  } catch { /* interceptor handles */ }
  finally { loading.value = false; }
};

const saveProfile = async () => {
  saving.value = true;
  try {
    if (userStore.isAdmin) {
      await (client as any).put(`/admin/users/${form.id}`, {
        realName: form.realName,
        mobile:   form.phone,
        email:    form.email,
      });
    } else {
      await (client as any).put('/app/users/me', {
        nickname: form.realName,
        phone:    form.phone,
      });
    }
    // 同步 store
    userStore.setUser({
      token:    userStore.token,
      id:       form.id,
      username: form.username,
      realName: form.realName,
      role:     userStore.role,
    });
    ElMessage.success('个人信息已更新');
  } catch { /* interceptor handles */ }
  finally { saving.value = false; }
};

const savePassword = async () => {
  if (!pwdForm.oldPassword) { ElMessage.warning('请输入当前密码'); return; }
  if (pwdForm.newPassword.length < 6) { ElMessage.warning('新密码至少 6 位'); return; }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) { ElMessage.warning('两次输入的新密码不一致'); return; }
  pwdSaving.value = true;
  try {
    const endpoint = userStore.isAdmin ? '/admin/change-password' : '/app/auth/change-password';
    await (client as any).put(endpoint, {
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
    });
    ElMessage.success('密码已修改，下次登录生效');
    pwdForm.oldPassword = '';
    pwdForm.newPassword = '';
    pwdForm.confirmPassword = '';
  } catch { /* interceptor handles */ }
  finally { pwdSaving.value = false; }
};

onMounted(loadProfile);
</script>
