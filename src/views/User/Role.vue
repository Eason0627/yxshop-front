<template>
  <div class="role-page h-full overflow-y-auto bg-[#f5f7fb] p-4">
    <div class="mx-auto max-w-[1440px]">
      <div class="page-head">
        <div>
          <div class="text-sm text-slate-500">用户权限</div>
          <h1 class="text-xl font-semibold text-slate-900">角色管理</h1>
        </div>
        <el-button type="primary" @click="saveRoles">保存配置</el-button>
      </div>

      <div class="role-grid">
        <section v-for="role in roles" :key="role.key" class="role-card">
          <div class="role-head">
            <div>
              <div class="role-name">{{ role.name }}</div>
              <div class="role-desc">{{ role.description }}</div>
            </div>
            <el-tag>{{ role.key }}</el-tag>
          </div>
          <el-checkbox-group v-model="role.permissions">
            <div v-for="permission in permissions" :key="permission.key" class="permission-row">
              <div>
                <div class="permission-name">{{ permission.name }}</div>
                <div class="permission-desc">{{ permission.description }}</div>
              </div>
              <el-checkbox :label="permission.key" />
            </div>
          </el-checkbox-group>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { ElMessage } from "element-plus";

const permissions = [
  { key: "dashboard:view", name: "查看数据看板", description: "访问运营统计和店铺工作台" },
  { key: "shop:manage", name: "管理店铺", description: "查看和维护店铺基础信息" },
  { key: "product:manage", name: "管理商品", description: "维护商品、分类、库存关联" },
  { key: "order:manage", name: "处理订单", description: "查看订单、发货和售后联动" },
  { key: "promotion:manage", name: "管理营销", description: "维护活动、优惠券和营销配置" },
  { key: "process:review", name: "审核流程", description: "处理开店、售后等审核事项" },
  { key: "user:manage", name: "管理用户", description: "查看用户状态并调整权限" },
];

const roles = reactive([
  {
    key: "Admin",
    name: "平台管理员",
    description: "平台全局管理角色",
    permissions: permissions.map((item) => item.key),
  },
  {
    key: "ShopOwner",
    name: "商家",
    description: "店铺经营和订单处理角色",
    permissions: ["dashboard:view", "shop:manage", "product:manage", "order:manage", "promotion:manage"],
  },
  {
    key: "Customer",
    name: "普通用户",
    description: "个人信息和开店申请角色",
    permissions: ["dashboard:view"],
  },
]);

const saveRoles = () => {
  localStorage.setItem("role_permission_draft", JSON.stringify(roles));
  ElMessage.success("角色配置草稿已保存");
};
</script>

<style scoped>
.page-head,
.role-card {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
}
.role-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.role-card {
  padding: 16px;
}
.role-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.role-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}
.role-desc,
.permission-desc {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}
.permission-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid #f1f5f9;
}
.permission-name {
  font-weight: 600;
  color: #334155;
}
</style>
