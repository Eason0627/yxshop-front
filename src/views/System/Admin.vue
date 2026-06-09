<template>
  <div class="page">
    <!-- 搜索栏 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3">
          <el-input v-model="search.keyword" placeholder="用户名/姓名/邮箱" class="!w-[220px]"
            clearable @keyup.enter="doSearch" @clear="doSearch" />
          <el-select v-model="filterStatus" placeholder="全部状态" class="!w-[110px]" clearable>
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
          <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        </div>
        <el-button type="primary" @click="openDialog()">
          <i class="ri-add-line mr-1"></i>新增管理员
        </el-button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <TableSkeleton v-if="loading && tableData.length === 0" />
      <EmptyState v-else-if="!loading && tableData.length === 0"
        icon="ri-admin-line" tip="暂无管理员账号" />
      <el-table v-else :data="filteredData()" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="username" label="用户名" min-width="130" />
        <el-table-column prop="realName" label="姓名" width="110" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="mobile" label="手机" width="130" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isSuperAdmin ? 'danger' : 'primary'" size="small">
              {{ row.isSuperAdmin ? '超级管理员' : '运营人员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="165">
          <template #default="{ row }">
            <span class="text-[12px] text-[#999]">{{ safeFormat(row.lastLoginAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">
              <i class="ri-edit-line mr-0.5"></i>编辑
            </el-button>
            <el-button :type="row.status === 1 ? 'warning' : 'success'" link size="small" @click="toggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" link size="small" @click="deleteAdmin(row)" v-if="!row.isSuperAdmin">
              <i class="ri-delete-bin-line mr-0.5"></i>删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="tableData.length > 0" class="flex justify-end p-4">
        <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
          :total="total" :page-sizes="[10,20,50]"
          layout="total, sizes, prev, pager, next" @change="handlePageChange" />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑管理员' : '新增管理员'" width="480px" :destroy-on-close="true">
      <el-form :model="form" label-width="90px">
        <el-form-item label="用户名" required>
          <el-input v-model="form.username" :disabled="!!editId" placeholder="登录用户名" />
        </el-form-item>
        <el-form-item label="密码" :required="!editId">
          <el-input v-model="form.password" type="password" show-password
            :placeholder="editId ? '留空则不修改密码' : '请输入密码（至少6位）'" />
        </el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.realName" placeholder="真实姓名" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" placeholder="邮箱地址" /></el-form-item>
        <el-form-item label="手机"><el-input v-model="form.mobile" placeholder="手机号" /></el-form-item>
        <el-form-item label="超级管理员">
          <el-switch v-model="form.isSuperAdmin" :active-value="1" :inactive-value="0"
            active-text="是" inactive-text="否" />
          <span class="ml-2 text-[11px] text-[#999]">超级管理员拥有全部权限</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveAdmin">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminUserApi } from '@/utils/admin-api';
import { useListPage } from '@/composables/useListPage';
import { useFormDialog } from '@/composables/useFormDialog';
import { ADMIN_STATUS } from '@/constants/status';
import { safeFormat } from '@/utils/dateFormat';
import EmptyState from '@/components/EmptyState.vue';
import TableSkeleton from '@/components/TableSkeleton.vue';

const filterStatus = ref<number | null>(null);

// ── 列表（useListPage）──────────────────────────────────────────────────────
const {
  loading, tableData, total, pageNum, pageSize,
  search, doSearch, handlePageChange,
} = useListPage(
  (p) => adminUserApi.list(p.pageNum, p.pageSize, p.keyword || undefined),
  { keyword: '' },
);


// 客户端按状态过滤（服务端后续可加 status 参数）
const filteredData = () => filterStatus.value === null
  ? tableData.value
  : tableData.value.filter((r: any) => r.status === filterStatus.value);

// ── 表单弹窗（useFormDialog）────────────────────────────────────────────────
const { visible: dialogVisible, saving, editId, form, open: openDialog, save: _save } =
  useFormDialog(
    { username: '', password: '', realName: '', email: '', mobile: '', isSuperAdmin: 0 },
    {
      createFn: adminUserApi.create,
      updateFn: (id, data) => adminUserApi.update(id, data),
      afterSave: () => doSearch(),
    },
  );

// 新增时校验密码
const saveAdmin = async () => {
  if (!editId.value && !form.password) { ElMessage.warning('请输入密码'); return; }
  await _save();
};

// ── 操作 ────────────────────────────────────────────────────────────────────
const toggleStatus = async (row: any) => {
  const newStatus = row.status === ADMIN_STATUS.ACTIVE ? ADMIN_STATUS.DISABLED : ADMIN_STATUS.ACTIVE;
  try {
    await adminUserApi.update(row.id, { status: newStatus });
    row.status = newStatus;
    ElMessage.success(newStatus === ADMIN_STATUS.ACTIVE ? '已启用' : '已禁用');
  } catch { /* 拦截器已处理 */ }
};

const deleteAdmin = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定删除管理员「${row.username}」？此操作不可撤销`,
      '删除确认', { type: 'warning' }
    );
    await adminUserApi.delete(row.id);
    ElMessage.success('已删除');
    doSearch();
  } catch { /* 用户取消 */ }
};
</script>
