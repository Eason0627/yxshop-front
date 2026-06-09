<template>
  <div class="delivery-list h-full overflow-y-auto bg-[#f5f7fb] p-4">
    <section class="panel">
      <div class="toolbar">
        <div>
          <div class="text-sm text-slate-500">物流管理</div>
          <h1 class="text-xl font-semibold text-slate-900">物流货单</h1>
        </div>
        <div class="filters">
          <el-input v-model="keyword" placeholder="订单号/收件人" clearable />
          <el-select v-model="status" placeholder="物流状态" clearable>
            <el-option label="待发货" value="Pending" />
            <el-option label="已发货" value="Shipped" />
            <el-option label="已签收" value="Signed" />
            <el-option label="异常" value="Exception" />
          </el-select>
          <el-button type="primary">查询</el-button>
        </div>
      </div>
      <el-table :data="rows" height="620" empty-text="暂无物流货单">
        <el-table-column prop="orderId" label="订单号" min-width="140" />
        <el-table-column prop="receiver" label="收件人" width="120" />
        <el-table-column prop="carrier" label="物流公司" width="130" />
        <el-table-column prop="trackingNo" label="运单号" min-width="160" />
        <el-table-column prop="statusText" label="状态" width="120" />
        <el-table-column label="更新时间" width="180"><template #default="{ row }"><span class="text-[12px] text-[#999]">{{ safeFormat(row.updatedAt) }}</span></template></el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { safeFormat } from '@/utils/dateFormat';
import { ElMessage } from "element-plus";

const keyword = ref("");
const status = ref("");

const rows = ref([
  {
    orderId: "待接入",
    receiver: "-",
    carrier: "-",
    trackingNo: "-",
    statusText: "等待真实接口",
    updatedAt: "-",
  },
]);

const viewDetail = (row: { orderId: string }) => {
  ElMessage.info(`物流详情：${row.orderId}`);
};
</script>

<style scoped>
.panel {
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}
.filters {
  display: grid;
  grid-template-columns: 220px 160px auto;
  gap: 8px;
}
</style>
