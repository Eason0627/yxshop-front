<template>
  <div class="page">
    <!-- 状态 Tab -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] mb-4 px-4 flex items-center gap-1 overflow-x-auto">
      <button
        v-for="tab in tabs" :key="tab.value"
        class="flex-shrink-0 px-4 py-3 text-[13px] border-b-2 transition-colors whitespace-nowrap"
        :class="search.afterSalesStatus === tab.value
          ? 'border-[#FF6B00] text-[#FF6B00] font-medium'
          : 'border-transparent text-[#666] hover:text-[#333]'"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 搜索栏 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="订单号 / 买家备注" class="!w-[220px]"
          clearable @keyup.enter="doSearch" @clear="doSearch" />

        <!-- Admin：店铺筛选下拉 -->
        <ShopFilterSelect
          v-if="_can('aftersales:filter-shop')"
          v-model="search.shopId"
          @change="doSearch"
        />

        <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <el-button @click="resetSearch"><i class="ri-refresh-line mr-1"></i>重置</el-button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe>
        <el-table-column label="订单号" width="200">
          <template #default="{ row }">
            <span class="text-[12px] font-mono">{{ row.orderNumber }}</span>
          </template>
        </el-table-column>
        <el-table-column label="店铺" width="120">
          <template #default="{ row }">
            <span class="text-[13px]">{{ row.shopName || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单金额" width="100">
          <template #default="{ row }">
            <span class="text-[#FF6B00] font-medium">¥{{ row.orderTotal || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="180">
          <template #default="{ row }">
            <div class="text-[13px] text-[#666] truncate max-w-[280px]">
              {{ row.items?.map((i: any) => i.productName).join('、') || '—' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="90">
          <template #default="{ row }">
            <el-tag :type="orderStatusTag(row.orderStatus)" size="small">{{ orderStatusText(row.orderStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="售后状态" width="100">
          <template #default="{ row }">
            <el-tag :type="afterSalesTag(row.afterSalesStatus)" size="small">
              {{ afterSalesText(row.afterSalesStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="160">
          <template #default="{ row }">
            <span class="text-[12px]">{{ formatTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showDetail(row)">查看详情</el-button>
            <el-button
              v-if="(row.afterSalesStatus === 'Requested' || row.afterSalesStatus === 'Processing') && _can('aftersales:approve')"
              type="success" link size="small"
              @click="handleAfterSales(row, 'approve')"
            >同意</el-button>
            <el-button
              v-if="(row.afterSalesStatus === 'Requested' || row.afterSalesStatus === 'Processing') && _can('aftersales:reject')"
              type="danger" link size="small"
              @click="handleAfterSales(row, 'reject')"
            >拒绝</el-button>
            <el-button
              v-if="_can('aftersales:arbitrate')"
              type="warning" link size="small"
              @click="handleAfterSales(row, 'arbitrate')"
            >仲裁</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end p-4">
        <el-pagination
          v-model:current-page="pageNum" v-model:page-size="pageSize"
          :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next"
          @change="doSearch"
        />
      </div>
    </div>

    <!-- 订单详情抽屉 -->
    <el-drawer v-model="detailVisible" title="售后订单详情" size="580px" :destroy-on-close="true">
      <div v-if="currentOrder" class="px-1 space-y-4">
        <!-- 售后状态卡片 -->
        <div class="rounded-xl border-2 p-4" :class="afterSalesBorderClass(currentOrder.afterSalesStatus)">
          <div class="flex items-center gap-3">
            <i :class="afterSalesIcon(currentOrder.afterSalesStatus)" class="text-2xl"></i>
            <div>
              <div class="text-[14px] font-semibold">{{ afterSalesText(currentOrder.afterSalesStatus) }}</div>
              <div class="text-[12px] text-[#999] mt-0.5">
                订单状态：{{ orderStatusText(currentOrder.orderStatus) }}
              </div>
            </div>
            <div class="ml-auto flex gap-2">
              <template v-if="currentOrder.afterSalesStatus === 'Requested' || currentOrder.afterSalesStatus === 'Processing'">
                <el-button v-if="_can('aftersales:approve')" type="success" size="small" @click="handleAfterSales(currentOrder, 'approve')">同意退款</el-button>
                <el-button v-if="_can('aftersales:reject')" type="danger" plain size="small" @click="handleAfterSales(currentOrder, 'reject')">拒绝申请</el-button>
              </template>
              <el-button v-if="_can('aftersales:arbitrate')" type="warning" plain size="small" @click="handleAfterSales(currentOrder, 'arbitrate')">平台仲裁</el-button>
            </div>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="bg-[#FAFAFA] rounded-xl p-4">
          <div class="text-[13px] font-semibold text-[#333] mb-3">订单信息</div>
          <div class="grid grid-cols-2 gap-y-2 text-[12px]">
            <div class="text-[#999]">订单号</div>
            <div class="text-[#333] font-mono">{{ currentOrder.orderNumber }}</div>
            <div class="text-[#999]">店铺</div>
            <div class="text-[#333]">{{ currentOrder.shopName || '—' }}</div>
            <div class="text-[#999]">下单时间</div>
            <div class="text-[#333]">{{ formatTime(currentOrder.createTime) }}</div>
            <div class="text-[#999]">支付时间</div>
            <div class="text-[#333]">{{ formatTime(currentOrder.paidAt) || '—' }}</div>
            <template v-if="currentOrder.buyerRemark">
              <div class="text-[#999]">买家备注</div>
              <div class="text-[#333]">{{ currentOrder.buyerRemark }}</div>
            </template>
          </div>
        </div>

        <!-- 收货地址 -->
        <div v-if="parsedAddress(currentOrder)" class="bg-[#FAFAFA] rounded-xl p-4">
          <div class="text-[13px] font-semibold text-[#333] mb-2">收货信息</div>
          <div class="text-[12px] text-[#333]">
            <span class="font-medium">{{ parsedAddress(currentOrder)?.name }}</span>
            <span class="ml-2 text-[#999]">{{ parsedAddress(currentOrder)?.phone }}</span>
          </div>
          <div class="text-[12px] text-[#999] mt-1">
            {{ parsedAddress(currentOrder)?.province }}{{ parsedAddress(currentOrder)?.city }}{{ parsedAddress(currentOrder)?.district }}{{ parsedAddress(currentOrder)?.detail }}
          </div>
        </div>

        <!-- 商品列表 -->
        <div class="bg-[#FAFAFA] rounded-xl p-4">
          <div class="text-[13px] font-semibold text-[#333] mb-3">商品明细</div>
          <div v-for="item in (currentOrder.items || [])" :key="item.id" class="flex items-center gap-3 mb-3 last:mb-0">
            <img :src="item.productImage" class="w-14 h-14 rounded-lg object-cover bg-[#F0F0F0] flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="text-[12px] text-[#333] truncate">{{ item.productName }}</div>
              <div class="text-[11px] text-[#999] mt-0.5">{{ item.specsText || '' }}</div>
              <div class="text-[11px] text-[#999]">售后状态：{{ itemAfterSalesText(item.afterSalesStatus) }}</div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-[12px] text-[#FF6B00] font-medium">¥{{ item.price }}</div>
              <div class="text-[11px] text-[#999]">x{{ item.quantity }}</div>
            </div>
          </div>
        </div>

        <!-- 费用汇总 -->
        <div class="bg-[#FAFAFA] rounded-xl p-4">
          <div class="text-[13px] font-semibold text-[#333] mb-3">费用汇总</div>
          <div class="space-y-1.5 text-[12px]">
            <div class="flex justify-between">
              <span class="text-[#999]">商品小计</span>
              <span>¥{{ currentOrder.goodsAmount || 0 }}</span>
            </div>
            <div v-if="Number(currentOrder.discountAmount) > 0" class="flex justify-between">
              <span class="text-[#999]">优惠折扣</span>
              <span class="text-[#52C41A]">-¥{{ currentOrder.discountAmount }}</span>
            </div>
            <div class="flex justify-between pt-1.5 border-t border-[#F0F0F0]">
              <span class="font-semibold text-[#333]">实付金额</span>
              <span class="text-[#FF6B00] font-bold text-[15px]">¥{{ currentOrder.orderTotal || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 处理售后弹窗 -->
    <el-dialog v-model="handleVisible" :title="handleAction === 'approve' ? '同意售后申请' : handleAction === 'reject' ? '拒绝售后申请' : '平台仲裁'" width="440px">
      <div class="text-[13px] text-[#666] mb-4">
        订单：<span class="font-mono text-[#333]">{{ handleTarget?.orderNumber }}</span>
      </div>
      <el-form label-width="80px">
        <el-form-item label="处理意见">
          <el-input v-model="handleRemark" type="textarea" :rows="3"
            :placeholder="handleAction === 'approve' ? '同意退款，款项将原路退回...' : '请填写拒绝原因'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleVisible = false">取消</el-button>
        <el-button
          :type="handleAction === 'approve' ? 'primary' : 'danger'"
          :loading="handling"
          @click="submitHandle"
        >确认{{ handleAction === 'approve' ? '同意' : '拒绝' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { adminOrderApi } from '@/utils/admin-api';
import client from '@/utils/http';
import { usePermission } from '@/utils/permission';
import { useListPage } from '@/composables/useListPage';
import { useShopFilter } from '@/composables/useShopFilter';
import ShopFilterSelect from '@/components/ShopFilterSelect.vue';
import { safeFormat } from '@/utils/dateFormat';
import {
  ORDER_STATUS_LABEL, ORDER_STATUS_TAG,
  AFTER_SALES_STATUS, AFTER_SALES_STATUS_LABEL, AFTER_SALES_STATUS_TAG,
} from '@/constants/status';

const { can: _can } = usePermission();
const { shopParam } = useShopFilter();

const { loading, tableData, total, pageNum, pageSize, search, doSearch, resetSearch } =
  useListPage(
    (p) => adminOrderApi.list({
      pageNum: p.pageNum, pageSize: p.pageSize,
      afterSalesStatus: p.afterSalesStatus,
      keyword: p.keyword || undefined,
      shopId: p.shopId || (shopParam.value as any).shopId || undefined,
    }),
    { keyword: '', afterSalesStatus: 'HasAfterSales', shopId: null as string|null },
  );

const tabs = [
  { label: '全部售后', value: 'HasAfterSales' },
  { label: '申请中', value: 'Requested' },
  { label: '处理中', value: 'Processing' },
  { label: '已同意', value: AFTER_SALES_STATUS.APPROVED },
  { label: '已拒绝', value: AFTER_SALES_STATUS.REJECTED },
  { label: '已完成', value: 'Completed' },
];

// ===== 状态映射（使用 status.ts 统一常量）=====
const orderStatusText = (s: string) => ORDER_STATUS_LABEL[s] || s || '—';
const orderStatusTag = (s: string): any => ORDER_STATUS_TAG[s] || 'info';
const afterSalesText = (s: string) => AFTER_SALES_STATUS_LABEL[s] || s || '售后';
const afterSalesTag = (s: string): any => AFTER_SALES_STATUS_TAG[s] || 'info';
const itemAfterSalesText = (s: string) => AFTER_SALES_STATUS_LABEL[s] || s || '—';

const afterSalesBorderClass = (s: string) => {
  if (s === AFTER_SALES_STATUS.REQUESTED || s === AFTER_SALES_STATUS.PROCESSING) return 'border-[#FFA500] bg-[#FFFBE6]';
  if (s === AFTER_SALES_STATUS.APPROVED || s === AFTER_SALES_STATUS.COMPLETED) return 'border-[#52C41A] bg-[#F6FFED]';
  if (s === AFTER_SALES_STATUS.REJECTED) return 'border-[#FF4D4F] bg-[#FFF2F0]';
  return 'border-[#D9D9D9] bg-[#FAFAFA]';
};

const afterSalesIcon = (s: string) => {
  if (s === 'Requested' || s === 'Processing') return 'ri-time-line text-[#FFA500]';
  if (s === AFTER_SALES_STATUS.APPROVED || s === AFTER_SALES_STATUS.COMPLETED) return 'ri-checkbox-circle-line text-[#52C41A]';
  if (s === AFTER_SALES_STATUS.REJECTED) return 'ri-close-circle-line text-[#FF4D4F]';
  return 'ri-service-line text-[#999]';
};

const formatTime = safeFormat;

const parsedAddress = (order: any): Record<string, string> | null => {
  if (!order?.addressSnapshot) return null;
  try {
    return typeof order.addressSnapshot === 'string'
      ? JSON.parse(order.addressSnapshot)
      : order.addressSnapshot;
  } catch { return null; }
};

// ===== 加载数据 =====
const switchTab = (status: string) => {
  search.afterSalesStatus = status;
  doSearch();
};

// ===== 详情抽屉 =====
const detailVisible = ref(false);
const currentOrder = ref<any>(null);

const showDetail = async (row: any) => {
  currentOrder.value = null;
  detailVisible.value = true;
  try {
    const res: any = await adminOrderApi.detail(row.orderId);
    currentOrder.value = res.data?.data || res.data || row;
  } catch {
    currentOrder.value = row;
  }
};

// ===== 处理售后（模拟：更新 afterSalesStatus 字段） =====
// 注：实际生产应有专属售后接口；此处通过直接更新订单 afterSalesStatus 演示流程
const handleVisible = ref(false);
const handleAction = ref<'approve' | 'reject' | 'arbitrate'>('approve');
const handleTarget = ref<any>(null);
const handleRemark = ref('');
const handling = ref(false);

const handleAfterSales = (row: any, action: 'approve' | 'reject' | 'arbitrate') => {
  handleTarget.value = row;
  handleAction.value = action;
  handleRemark.value = '';
  handleVisible.value = true;
};

const submitHandle = async () => {
  if (!handleTarget.value) return;
  handling.value = true;
  try {
    let newStatus: string;
    if (handleAction.value === 'approve') {
      newStatus = AFTER_SALES_STATUS.APPROVED;
    } else if (handleAction.value === 'reject') {
      newStatus = AFTER_SALES_STATUS.REJECTED;
    } else {
      // arbitrate：调用专属仲裁接口
      await adminOrderApi.arbitrate(handleTarget.value.orderId, { remark: handleRemark.value });
      ElMessage.success('仲裁意见已提交');
      handleVisible.value = false;
      doSearch();
      return;
    }
    await client.put(`/app/orders/${handleTarget.value.orderId}/after-sales`, {
      afterSalesStatus: newStatus,
      remark: handleRemark.value,
    });
    ElMessage.success(handleAction.value === 'approve' ? '已同意售后申请' : '已拒绝售后申请');
    handleVisible.value = false;
    if (detailVisible.value && currentOrder.value?.orderId === handleTarget.value.orderId) {
      currentOrder.value = { ...currentOrder.value, afterSalesStatus: newStatus };
    }
    doSearch();
  } catch {
    ElMessage.error('操作失败，请稍后重试');
  } finally { handling.value = false; }
};
// useListPage 已自动加载
</script>
