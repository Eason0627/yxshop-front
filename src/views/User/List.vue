<template>
  <div class="page">
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="用户名/昵称/手机/邮箱" class="!w-[220px]"
          clearable @keyup.enter="doSearch" @clear="doSearch" />

        <!-- 角色 -->
        <el-select v-model="search.role" placeholder="角色" class="!w-[120px]" clearable @change="doSearch">
          <el-option label="普通用户" value="Customer" />
          <el-option label="店主" value="ShopOwner" />
          <el-option label="店铺运营" value="ShopStaff" />
          <el-option label="管理员" value="Admin" />
        </el-select>

        <!-- 状态 -->
        <el-select v-model="search.status" placeholder="账号状态" class="!w-[110px]" clearable @change="doSearch">
          <el-option label="正常" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>

        <!-- 积分区间 -->
        <div class="flex items-center gap-1">
          <el-input v-model="search.pointsMin" placeholder="最低积分" class="!w-[95px]" clearable
            @keyup.enter="doSearch" @clear="doSearch" />
          <span class="text-[#CCC] text-sm">—</span>
          <el-input v-model="search.pointsMax" placeholder="最高积分" class="!w-[95px]" clearable
            @keyup.enter="doSearch" @clear="doSearch" />
        </div>

        <!-- 注册日期 -->
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="注册开始"
          end-placeholder="注册结束"
          value-format="YYYY-MM-DD"
          size="default"
          class="!w-[260px]"
          @change="doSearch"
        />

        <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <el-button @click="resetSearch"><i class="ri-refresh-line mr-1"></i>重置</el-button>
        <el-button v-if="_can('user:create')" type="success" @click="openCreate">
          <i class="ri-user-add-line mr-1"></i>新增用户
        </el-button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe>
        <el-table-column label="用户" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <img :src="row.avatar || AVATAR_PLACEHOLDER" class="w-8 h-8 rounded-full object-cover flex-shrink-0"
                @error="(e: any) => (e.target.src = AVATAR_PLACEHOLDER)" />
              <div>
                <div class="text-[13px] font-medium text-[#333]">{{ row.nickname || row.username }}</div>
                <div class="text-[11px] text-[#999]">@{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机" width="130" />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'Admin' ? 'danger' : row.role === 'ShopOwner' ? 'warning' : row.role === 'ShopStaff' ? 'success' : 'info'" size="small">{{ roleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="积分" width="90">
          <template #default="{ row }">
            <span class="text-[#FF6B00] font-medium">{{ row.points || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单数" width="80">
          <template #default="{ row }">{{ row.orderCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '正常' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="170">
          <template #default="{ row }">
            <span class="text-[12px] text-[#999]">{{ safeFormat(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showDetail(row)">详情</el-button>
            <el-button link size="small" @click="openResetPwd(row)">重置密码</el-button>
            <el-button v-if="_can('user:ban')" :type="row.status === 1 ? 'danger' : 'success'" link size="small" @click="toggleUserStatus(row)">
              {{ row.status === 1 ? '封禁' : '恢复' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end p-4">
        <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
          :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next" @change="handlePageChange" />
      </div>
    </div>

    <!-- 新增用户对话框 -->
    <el-dialog v-model="createVisible" title="新增用户" width="460px" :close-on-click-modal="false">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="80px" class="pr-4">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" placeholder="登录账号，不可重复" clearable />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="createForm.nickname" placeholder="昵称（可选，默认同用户名）" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" placeholder="至少6位" show-password clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="createForm.phone" placeholder="可选" clearable />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="createForm.email" placeholder="可选" clearable />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="createForm.role" class="w-full">
            <el-option label="普通用户" value="Customer" />
            <el-option label="店主" value="ShopOwner" />
            <el-option label="店铺运营" value="ShopStaff" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreate">确认创建</el-button>
      </template>
    </el-dialog>

    <!-- 用户详情抽屉 -->
    <el-drawer v-model="detailVisible" title="用户详情" size="480px" :destroy-on-close="true">
      <div v-if="detailLoading" class="flex items-center justify-center h-40 text-[#999]">加载中...</div>
      <div v-else-if="currentUser" class="px-1 space-y-4">
        <!-- 用户头像卡 -->
        <div class="flex items-center gap-4 p-4 bg-[#FAFAFA] rounded-xl">
          <img :src="currentUser.avatar || AVATAR_PLACEHOLDER"
            class="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
            @error="(e: any) => (e.target.src = AVATAR_PLACEHOLDER)" />
          <div>
            <div class="text-[15px] font-bold text-[#333]">{{ currentUser.nickname || currentUser.username }}</div>
            <div class="text-[12px] text-[#999] mt-0.5">@{{ currentUser.username }}</div>
            <el-tag :type="currentUser.role === 'Admin' ? 'danger' : currentUser.role === 'ShopOwner' ? 'warning' : currentUser.role === 'ShopStaff' ? 'success' : 'info'" size="small" class="mt-1">{{ roleText(currentUser.role) }}</el-tag>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="bg-[#FAFAFA] rounded-xl p-4">
          <div class="text-[13px] font-semibold text-[#333] mb-3">账号信息</div>
          <div class="grid grid-cols-2 gap-y-2 text-[12px]">
            <div class="text-[#999]">用户ID</div><div class="text-[#333] font-mono text-[11px]">{{ currentUser.id }}</div>
            <div class="text-[#999]">手机</div><div class="text-[#333]">{{ currentUser.phone || '—' }}</div>
            <div class="text-[#999]">邮箱</div><div class="text-[#333]">{{ currentUser.email || '—' }}</div>
            <div class="text-[#999]">注册时间</div><div class="text-[#333]">{{ currentUser.createTime || '—' }}</div>
            <div class="text-[#999]">最后登录</div><div class="text-[#333]">{{ currentUser.lastLoginAt || '—' }}</div>
            <div class="text-[#999]">状态</div>
            <div><el-tag :type="currentUser.status === 1 ? 'success' : 'danger'" size="small">{{ currentUser.status === 1 ? '正常' : '禁用' }}</el-tag></div>
          </div>
        </div>

        <!-- 积分&订单 -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-[#FAFAFA] rounded-xl p-3 text-center">
            <div class="text-xl font-bold text-[#FF6B00]">{{ currentUser.points || 0 }}</div>
            <div class="text-[11px] text-[#999] mt-0.5">当前积分</div>
          </div>
          <div class="bg-[#FAFAFA] rounded-xl p-3 text-center">
            <div class="text-xl font-bold text-[#165DFF]">{{ currentUser.orderCount || 0 }}</div>
            <div class="text-[11px] text-[#999] mt-0.5">订单数</div>
          </div>
          <div class="bg-[#FAFAFA] rounded-xl p-3 text-center">
            <div class="text-xl font-bold text-[#00B96B]">{{ currentUser.reviewCount || 0 }}</div>
            <div class="text-[11px] text-[#999] mt-0.5">评价数</div>
          </div>
        </div>

        <!-- 操作 -->
        <div class="flex gap-3">
          <el-button v-if="_can('user:ban')" :type="currentUser.status === 1 ? 'danger' : 'success'" class="flex-1"
            @click="toggleUserStatus(currentUser); detailVisible = false">
            {{ currentUser.status === 1 ? '封禁账号' : '恢复账号' }}
          </el-button>
          <el-button class="flex-1" plain @click="openResetPwd(currentUser); detailVisible = false">
            <i class="ri-lock-password-line mr-1"></i>重置密码
          </el-button>
          <el-button class="flex-1" @click="detailVisible = false">关闭</el-button>
        </div>
      </div>
    </el-drawer>
  <!-- 重置密码弹窗 -->
  <el-dialog v-model="resetPwdVisible" title="重置用户密码" width="400px" :close-on-click-modal="false" :destroy-on-close="true">
    <div class="mb-4 flex items-center gap-3 px-1 py-2 bg-[#FFF7F0] rounded-lg text-[13px] text-[#AD6800]">
      <i class="ri-user-line text-[16px] flex-shrink-0"></i>
      <span>为 <b>{{ resetPwdTarget?.nickname || resetPwdTarget?.username }}</b> 设置新密码</span>
    </div>
    <el-form :model="resetPwdForm" :rules="resetPwdRules" ref="resetPwdFormRef" label-width="90px">
      <el-form-item label="新密码" prop="password">
        <el-input v-model="resetPwdForm.password" type="password" show-password
          placeholder="至少6位" clearable />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirm">
        <el-input v-model="resetPwdForm.confirm" type="password" show-password
          placeholder="再次输入新密码" clearable />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="resetPwdVisible = false">取消</el-button>
      <el-button type="primary" :loading="resetPwdLoading" @click="submitResetPwd">确认重置</el-button>
    </template>
  </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { adminUserListApi } from '@/utils/admin-api';
import { usePermission } from '@/utils/permission';
import { useListPage } from '@/composables/useListPage';
import { AVATAR_PLACEHOLDER } from '@/utils/image';
import { safeFormat } from '@/utils/dateFormat';

const { can: _can } = usePermission();

// ── 列表（useListPage）──────────────────────────────────────────────────────
const {
  loading, tableData, total, pageNum, pageSize,
  search, doSearch, resetSearch, handlePageChange, dateRange,
} = useListPage(
  (p) => adminUserListApi.list({
    pageNum:   p.pageNum,
    pageSize:  p.pageSize,
    keyword:   p.keyword   || undefined,
    role:      p.role      || undefined,
    status:    p.status    ?? undefined,
    pointsMin: p.pointsMin || undefined,
    pointsMax: p.pointsMax || undefined,
    startDate: p.startDate || undefined,
    endDate:   p.endDate   || undefined,
  }),
  {
    keyword: '', role: '', status: null as number | null,
    pointsMin: '', pointsMax: '',
  },
);

const roleText = (r: string) => (
  { Admin: '管理员', ShopOwner: '店主', ShopStaff: '店铺运营', User: '普通用户', Customer: '普通用户' }[r]
  || r || '用户'
);

const toggleUserStatus = async (row: any) => {
  const ns = row.status === 1 ? 0 : 1;
  const action = ns === 0 ? '封禁' : '恢复';
  try {
    await ElMessageBox.confirm(
      `确定${action}用户「${row.nickname || row.username}」？`,
      '操作确认', { type: 'warning' }
    );
    await adminUserListApi.updateStatus(row.id, ns);
    row.status = ns;
    ElMessage.success(`用户已${action}`);
  } catch { /* 用户取消 */ }
};

// 新增用户
const createVisible = ref(false);
const creating = ref(false);
const createFormRef = ref<FormInstance>();
const createForm = reactive({
  username: '',
  nickname: '',
  password: '',
  phone: '',
  email: '',
  role: 'Customer',
});
const createRules: FormRules = {
  username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
};

const openCreate = () => {
  createForm.username = '';
  createForm.nickname = '';
  createForm.password = '';
  createForm.phone = '';
  createForm.email = '';
  createForm.role = 'Customer';
  createFormRef.value?.clearValidate();
  createVisible.value = true;
};

const submitCreate = async () => {
  const valid = await createFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  creating.value = true;
  try {
    const payload: any = {
      username: createForm.username.trim(),
      password: createForm.password,
      role: createForm.role,
    };
    if (createForm.nickname.trim()) payload.nickname = createForm.nickname.trim();
    if (createForm.phone.trim())    payload.phone    = createForm.phone.trim();
    if (createForm.email.trim())    payload.email    = createForm.email.trim();
    const res: any = await adminUserListApi.create(payload);
    const newUser = res.data?.data || res.data;
    if (newUser) tableData.value.unshift(newUser);
    total.value++;
    ElMessage.success('用户创建成功');
    createVisible.value = false;
  } finally {
    creating.value = false;
  }
};

// 重置密码
const resetPwdVisible  = ref(false);
const resetPwdLoading  = ref(false);
const resetPwdTarget   = ref<any>(null);
const resetPwdFormRef  = ref<FormInstance>();
const resetPwdForm     = reactive({ password: '', confirm: '' });
const resetPwdRules: FormRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  confirm: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_: any, v: string, cb: any) => {
        v !== resetPwdForm.password ? cb(new Error('两次密码不一致')) : cb();
      },
      trigger: 'blur',
    },
  ],
};

const openResetPwd = (row: any) => {
  resetPwdTarget.value = row;
  resetPwdForm.password = '';
  resetPwdForm.confirm  = '';
  resetPwdFormRef.value?.clearValidate();
  resetPwdVisible.value = true;
};

const submitResetPwd = async () => {
  const valid = await resetPwdFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  resetPwdLoading.value = true;
  try {
    await adminUserListApi.resetPassword(resetPwdTarget.value.id, resetPwdForm.password);
    ElMessage.success(`已重置「${resetPwdTarget.value.nickname || resetPwdTarget.value.username}」的密码`);
    resetPwdVisible.value = false;
  } catch { /* interceptor */ }
  finally { resetPwdLoading.value = false; }
};

// 详情抽屉
const detailVisible = ref(false);
const detailLoading = ref(false);
const currentUser = ref<any>(null);

const showDetail = async (row: any) => {
  detailVisible.value = true;
  detailLoading.value = true;
  currentUser.value = null;
  try {
    const res: any = await adminUserListApi.detail(row.id);
    currentUser.value = res.data?.data || res.data || row;
  } catch {
    currentUser.value = row;  // 降级兜底
  } finally {
    detailLoading.value = false;
  }
};
</script>
