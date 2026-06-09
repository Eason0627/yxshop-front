<template>
  <div class="page">
    <div class="grid grid-cols-3 gap-4">
      <!-- 角色列表 -->
      <div class="col-span-1">
        <div class="bg-white rounded-xl border border-[#F0F0F0]">
          <div class="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5]">
            <h3 class="text-[13px] font-semibold text-[#333]">角色列表</h3>
            <el-button type="primary" size="small" @click="openCreateRole"><i class="ri-add-line mr-1"></i>新增</el-button>
          </div>
          <div class="divide-y divide-[#F5F5F5]">
            <div v-for="role in roles" :key="role.id"
              class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F5F5F5] transition-colors"
              :class="{ 'bg-[#FFF4E6]': selectedRole?.id === role.id }"
              @click="selectRole(role)">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                :style="{ background: role.color || '#FFF4E6' }">
                <i :class="role.icon || 'ri-shield-user-line'" class="text-[#FF6B00]"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[13px] font-medium text-[#333]">{{ role.name }}</div>
                <div class="text-[11px] text-[#999] truncate">{{ role.description || '暂无描述' }}</div>
              </div>
              <div class="flex items-center gap-1.5">
                <el-tag :type="role.status === 1 ? 'success' : 'info'" size="small">{{ role.status === 1 ? '启用' : '禁用' }}</el-tag>
                <el-button type="danger" link size="small" @click.stop="deleteRole(role)">
                  <i class="ri-delete-bin-line"></i>
                </el-button>
              </div>
            </div>
            <div v-if="roles.length === 0" class="p-8 text-center text-[#999] text-[12px]">暂无角色</div>
          </div>
        </div>
      </div>

      <!-- 权限配置 -->
      <div class="col-span-2">
        <div class="bg-white rounded-xl border border-[#F0F0F0]">
          <div class="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5]">
            <h3 class="text-[13px] font-semibold text-[#333]">
              {{ selectedRole ? `"${selectedRole.name}" 权限配置` : '选择角色查看权限' }}
            </h3>
            <div v-if="selectedRole" class="flex gap-2">
              <el-button size="small" @click="openEditRole(selectedRole)">编辑角色</el-button>
              <el-button type="primary" size="small" @click="savePermissions">保存权限</el-button>
            </div>
          </div>

          <div v-if="!selectedRole" class="p-12 text-center">
            <i class="ri-shield-user-line text-5xl text-[#E0E0E0]"></i>
            <p class="text-[#999] mt-3 text-[13px]">请先从左侧选择一个角色</p>
          </div>

          <div v-else class="p-4">
            <div v-for="module in permTree" :key="module.key" class="mb-4">
              <div class="flex items-center gap-2 mb-2">
                <el-checkbox
                  :model-value="isModuleChecked(module)"
                  :indeterminate="isModuleIndeterminate(module)"
                  @change="toggleModule(module, $event)">
                  <span class="text-[13px] font-semibold text-[#333]">{{ module.label }}</span>
                </el-checkbox>
              </div>
              <div class="grid grid-cols-4 gap-2 ml-6">
                <el-checkbox v-for="perm in module.perms" :key="perm.key"
                  v-model="selectedPerms[perm.key]">
                  <span class="text-[12px] text-[#555]">{{ perm.label }}</span>
                </el-checkbox>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑角色弹窗 -->
    <el-dialog v-model="roleDialogVisible" :title="editRoleId ? '编辑角色' : '新增角色'" width="440px" :destroy-on-close="true">
      <el-form :model="roleForm" label-width="80px">
        <el-form-item label="角色名称" required>
          <el-input v-model="roleForm.name" placeholder="角色名称" />
        </el-form-item>
        <el-form-item label="角色描述">
          <el-input v-model="roleForm.description" placeholder="角色用途说明" />
        </el-form-item>
        <el-form-item label="角色图标">
          <el-input v-model="roleForm.icon" placeholder="Remix Icon 类名，如 ri-user-line" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="roleForm.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { adminRoleApi } from '@/utils/admin-api';

const roles = ref<any[]>([]);
const selectedRole = ref<any>(null);
const selectedPerms = reactive<Record<string, boolean>>({});

// 权限树定义
const permTree = [
  { key: 'dashboard', label: '仪表盘', perms: [{ key: 'dashboard.view', label: '查看统计' }] },
  { key: 'product', label: '商品管理', perms: [
    { key: 'product.list', label: '商品列表' }, { key: 'product.publish', label: '发布商品' },
    { key: 'product.edit', label: '编辑商品' }, { key: 'product.status', label: '上下架' },
  ]},
  { key: 'order', label: '订单管理', perms: [
    { key: 'order.list', label: '订单列表' }, { key: 'order.detail', label: '订单详情' },
    { key: 'order.ship', label: '发货操作' }, { key: 'order.cancel', label: '取消订单' },
    { key: 'order.aftersales', label: '售后处理' },
  ]},
  { key: 'marketing', label: '营销管理', perms: [
    { key: 'marketing.banner', label: 'Banner管理' }, { key: 'marketing.activity', label: '活动管理' },
    { key: 'marketing.coupon', label: '优惠券管理' }, { key: 'marketing.rank', label: '榜单管理' },
  ]},
  { key: 'shop', label: '店铺管理', perms: [
    { key: 'shop.list', label: '店铺列表' }, { key: 'shop.brand', label: '品牌管理' },
    { key: 'shop.review', label: '评价管理' },
  ]},
  { key: 'user', label: '用户管理', perms: [
    { key: 'user.list', label: '用户列表' }, { key: 'user.detail', label: '用户详情' },
    { key: 'user.status', label: '封禁/恢复' },
  ]},
  { key: 'content', label: '内容管理', perms: [
    { key: 'content.topic', label: '话题管理' }, { key: 'content.post', label: '内容审核' },
  ]},
  { key: 'points', label: '积分管理', perms: [
    { key: 'points.goods', label: '积分商品' }, { key: 'points.checkin', label: '签到配置' },
    { key: 'points.records', label: '积分流水' }, { key: 'points.adjust', label: '手动调整' },
  ]},
  { key: 'system', label: '系统管理', perms: [
    { key: 'system.admin', label: '管理员' }, { key: 'system.role', label: '角色权限' },
    { key: 'system.log', label: '操作日志' },
  ]},
];

const isModuleChecked = (module: any) => module.perms.every((p: any) => selectedPerms[p.key]);
const isModuleIndeterminate = (module: any) => !isModuleChecked(module) && module.perms.some((p: any) => selectedPerms[p.key]);
const toggleModule = (module: any, checked: boolean) => {
  module.perms.forEach((p: any) => { selectedPerms[p.key] = checked; });
};

const loadRoles = async () => {
  try {
    const res: any = await adminRoleApi.list();
    roles.value = res.data?.data || res.data || [];
  } catch { /* interceptor handles */ }
};

const selectRole = async (role: any) => {
  selectedRole.value = role;
  permTree.forEach(m => m.perms.forEach(p => { selectedPerms[p.key] = false; }));
  try {
    const res: any = await adminRoleApi.getPermissions(role.id);
    const perms: string[] = res.data?.data || res.data || [];
    perms.forEach(p => { selectedPerms[p] = true; });
  } catch { /* use defaults */ }
};

const savePermissions = async () => {
  const perms = Object.entries(selectedPerms).filter(([, v]) => v).map(([k]) => k);
  try {
    await adminRoleApi.savePermissions(selectedRole.value.id, perms);
    ElMessage.success('权限保存成功');
  } catch { ElMessage.error('保存失败'); }
};

// 角色表单
const roleDialogVisible = ref(false);
const editRoleId = ref<any>(null);
const roleForm = reactive({ name: '', description: '', icon: '', status: 1 });

const openCreateRole = () => { editRoleId.value = null; Object.assign(roleForm, { name: '', description: '', icon: '', status: 1 }); roleDialogVisible.value = true; };
const openEditRole = (role: any) => {
  editRoleId.value = role.id;
  roleForm.name = role.name || ''; roleForm.description = role.description || '';
  roleForm.icon = role.icon || ''; roleForm.status = role.status ?? 1;
  roleDialogVisible.value = true;
};

const saveRole = async () => {
  if (!roleForm.name) { ElMessage.warning('请填写角色名称'); return; }
  try {
    if (editRoleId.value) {
      await adminRoleApi.update(editRoleId.value, { ...roleForm });
    } else {
      await adminRoleApi.create({ ...roleForm });
    }
    ElMessage.success('保存成功');
    roleDialogVisible.value = false;
    loadRoles();
  } catch { ElMessage.error('保存失败'); }
};

const deleteRole = async (role: any) => {
  try {
    await import('element-plus').then(({ ElMessageBox }) =>
      ElMessageBox.confirm(`确定删除角色「${role.name}」？删除后不可恢复`, '删除确认', { type: 'warning' })
    );
    await adminRoleApi.delete(role.id);
    ElMessage.success('删除成功');
    if (selectedRole.value?.id === role.id) selectedRole.value = null;
    loadRoles();
  } catch { /* cancelled */ }
};

onMounted(() => loadRoles());
</script>
