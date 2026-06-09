<template>
  <div class="page">
    <!-- 快捷状态 Tab -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] mb-4 px-4 flex items-center gap-1 overflow-x-auto">
      <button
        v-for="tab in statusTabs" :key="tab.value"
        class="flex-shrink-0 px-4 py-3 text-[13px] border-b-2 transition-colors whitespace-nowrap"
        :class="search.orderStatus === tab.value
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
        <el-input v-model="search.keyword" placeholder="订单号 / 买家备注 / 店铺名" class="!w-[220px]"
          clearable @keyup.enter="doSearch" @clear="doSearch" />

        <!-- 金额区间 -->
        <div class="flex items-center gap-1">
          <el-input v-model="search.amountMin" placeholder="最低金额" class="!w-[95px]" clearable
            @keyup.enter="doSearch" @clear="doSearch">
            <template #prefix>¥</template>
          </el-input>
          <span class="text-[#CCC] text-sm">—</span>
          <el-input v-model="search.amountMax" placeholder="最高金额" class="!w-[95px]" clearable
            @keyup.enter="doSearch" @clear="doSearch">
            <template #prefix>¥</template>
          </el-input>
        </div>

        <!-- 下单日期 -->
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="下单开始"
          end-placeholder="下单结束"
          value-format="YYYY-MM-DD"
          size="default"
          class="!w-[260px]"
          @change="doSearch"
        />

        <!-- Admin：店铺筛选下拉 -->
        <ShopFilterSelect
          v-if="_can('order:filter-shop')"
          v-model="search.shopId"
          @change="doSearch"
        />

        <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <el-button @click="resetSearch"><i class="ri-refresh-line mr-1"></i>重置</el-button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <TableSkeleton v-if="loading && tableData.length === 0" />
      <EmptyState v-else-if="!loading && tableData.length === 0"
        icon="ri-shopping-bag-3-line" tip="暂无订单数据" />
      <el-table v-else :data="tableData" style="width: 100%" v-loading="loading" stripe>
        <el-table-column label="订单号" width="200">
          <template #default="{ row }">
            <span class="text-[12px] font-mono text-[#333]">{{ row.orderNumber }}</span>
          </template>
        </el-table-column>
        <el-table-column label="店铺" width="120">
          <template #default="{ row }">
            <span class="text-[13px] text-[#333]">{{ row.shopName || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="110">
          <template #default="{ row }">
            <span class="text-[#FF6B00] font-medium">¥{{ row.orderTotal || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.orderStatus)" size="small">{{ statusText(row.orderStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="售后" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.afterSalesStatus && row.afterSalesStatus !== 'None'" type="danger" size="small">
              {{ afterSalesText(row.afterSalesStatus) }}
            </el-tag>
            <span v-else class="text-[#CCC] text-[11px]">—</span>
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div class="text-[13px] text-[#666] truncate max-w-[300px]">
              {{ row.items?.map((i: any) => i.productName).join('、') || '—' }}
            </div>
            <div v-if="row.items?.length > 1" class="text-[11px] text-[#999]">共 {{ row.items.length }} 件</div>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="170">
          <template #default="{ row }">
            <span class="text-[12px]">{{ formatTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showDetail(row)">详情</el-button>
            <el-button v-if="row.orderStatus === 'Paid' && !isAdmin" type="success" link size="small" @click="openShipDialog(row)">发货</el-button>
            <el-button v-if="row.orderStatus === ORDER_STATUS.PENDING_PAY && _can('order:cancel')" type="danger" link size="small" @click="doCancelOrder(row)">取消</el-button>
            <el-button
              v-if="_can('order:arbitrate') && row.afterSalesStatus && row.afterSalesStatus !== 'None'"
              type="warning" link size="small"
              @click="openArbitrateDialog(row)"
            >仲裁</el-button>
            <el-button
              v-if="['Cancelled','Completed'].includes(row.orderStatus) && _can('order:delete')"
              type="danger" link size="small"
              @click="doDeleteOrder(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end p-4">
        <el-pagination
          v-model:current-page="pageNum" v-model:page-size="pageSize"
          :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next"
          @change="handlePageChange"
        />
      </div>
    </div>

    <!-- 订单详情抽屉 -->
    <el-drawer v-model="detailVisible" size="560px" :destroy-on-close="true" :with-header="false">
      <div v-if="detailLoading" class="flex items-center justify-center h-64">
        <i class="ri-loader-4-line text-[28px] text-[#FF6B00] animate-spin"></i>
      </div>

      <div v-else-if="currentOrder" class="h-full flex flex-col overflow-hidden">

        <!-- ── 顶部状态头 ── -->
        <div class="flex-shrink-0 px-6 pt-6 pb-5 border-b border-[#F0F0F0]">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[18px] font-bold text-[#1A1A1A]">订单详情</span>
                <el-tag :type="statusTag(currentOrder.orderStatus)" size="small" class="!text-[11px]">
                  {{ statusText(currentOrder.orderStatus) }}
                </el-tag>
                <el-tag v-if="currentOrder.afterSalesStatus && currentOrder.afterSalesStatus !== 'None'"
                  type="danger" size="small" class="!text-[11px]">
                  {{ afterSalesText(currentOrder.afterSalesStatus) }}
                </el-tag>
              </div>
              <div class="flex items-center gap-1.5 text-[12px] text-[#999]">
                <i class="ri-hashtag text-[11px]"></i>
                <span class="font-mono tracking-wide select-all">{{ currentOrder.orderNumber }}</span>
              </div>
            </div>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg text-[#999] hover:text-[#333] hover:bg-[#F5F5F5] transition-colors -mt-0.5 -mr-1"
              @click="detailVisible = false">
              <i class="ri-close-line text-lg"></i>
            </button>
          </div>

          <!-- 进度条 -->
          <div class="flex items-center mt-4 gap-0">
            <template v-for="(step, i) in ['待付款','待发货','待收货','待评价','已完成']" :key="step">
              <div class="flex flex-col items-center flex-shrink-0">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors"
                  :class="getStepActive(currentOrder.orderStatus) > i
                    ? 'bg-[#FF6B00] text-white'
                    : getStepActive(currentOrder.orderStatus) === i
                      ? 'bg-white border-2 border-[#FF6B00] text-[#FF6B00]'
                      : 'bg-[#F0F0F0] text-[#CCC]'">
                  <i v-if="getStepActive(currentOrder.orderStatus) > i" class="ri-check-line text-[11px]"></i>
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <span class="text-[10px] mt-1 whitespace-nowrap"
                  :class="getStepActive(currentOrder.orderStatus) >= i ? 'text-[#FF6B00] font-medium' : 'text-[#CCC]'">
                  {{ step }}
                </span>
              </div>
              <div v-if="i < 4" class="flex-1 h-[2px] mb-4 mx-1 rounded-full transition-colors"
                :class="getStepActive(currentOrder.orderStatus) > i ? 'bg-[#FF6B00]' : 'bg-[#F0F0F0]'"></div>
            </template>
          </div>
        </div>

        <!-- ── 滚动内容区 ── -->
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          <!-- 收货信息（有地址才显示） -->
          <div v-if="parsedAddress(currentOrder)" class="rounded-xl border border-[#F0F0F0] overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 bg-[#FFF8F3] border-b border-[#F0F0F0]">
              <i class="ri-map-pin-2-fill text-[#FF6B00] text-sm"></i>
              <span class="text-[12px] font-semibold text-[#333]">收货信息</span>
            </div>
            <div class="px-4 py-3">
              <div class="flex items-center gap-3 mb-1">
                <span class="text-[13px] font-semibold text-[#1A1A1A]">{{ parsedAddress(currentOrder)?.receiverName }}</span>
                <span class="text-[12px] text-[#666]">{{ parsedAddress(currentOrder)?.phone }}</span>
              </div>
              <div class="text-[12px] text-[#888] leading-relaxed">
                {{ parsedAddress(currentOrder)?.province }}{{ parsedAddress(currentOrder)?.city }}{{ parsedAddress(currentOrder)?.district }}{{ parsedAddress(currentOrder)?.detail }}
              </div>
            </div>
          </div>

          <!-- 商品明细 -->
          <div class="rounded-xl border border-[#F0F0F0] overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 bg-[#FAFAFA] border-b border-[#F0F0F0]">
              <i class="ri-shopping-bag-3-line text-[#FF6B00] text-sm"></i>
              <span class="text-[12px] font-semibold text-[#333]">商品明细</span>
              <span class="ml-auto text-[11px] text-[#999]">{{ currentOrder.items?.length || 0 }} 件</span>
            </div>
            <div class="divide-y divide-[#F5F5F5]">
              <div v-for="item in (currentOrder.items || [])" :key="item.id" class="flex items-center gap-3 px-4 py-3">
                <div class="w-[52px] h-[52px] rounded-lg overflow-hidden bg-[#F5F5F5] flex-shrink-0">
                  <img v-if="item.productImage" :src="item.productImage" class="w-full h-full object-cover object-top" />
                  <i v-else class="ri-image-line text-[#CCC] text-xl flex w-full h-full items-center justify-center"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] text-[#1A1A1A] font-medium truncate mb-0.5">{{ item.productName }}</p>
                  <span v-if="item.specsText" class="inline-block text-[11px] text-[#888] bg-[#F5F5F5] px-1.5 py-0.5 rounded">{{ item.specsText }}</span>
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="text-[13px] font-semibold text-[#1A1A1A]">¥{{ Number(item.price || 0).toFixed(2) }}</div>
                  <div class="text-[11px] text-[#999] mt-0.5">× {{ item.quantity }}</div>
                </div>
              </div>
            </div>
            <!-- 费用汇总内嵌到商品卡片底部 -->
            <div class="px-4 py-3 bg-[#FAFAFA] border-t border-[#F0F0F0] space-y-1.5">
              <div class="flex justify-between text-[12px]">
                <span class="text-[#888]">商品小计</span>
                <span class="text-[#333]">¥{{ Number(currentOrder.goodsAmount || 0).toFixed(2) }}</span>
              </div>
              <div v-if="Number(currentOrder.discountAmount) > 0" class="flex justify-between text-[12px]">
                <span class="text-[#888]">优惠折扣</span>
                <span class="text-[#52C41A] font-medium">-¥{{ Number(currentOrder.discountAmount).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between items-center pt-1.5 border-t border-[#ECECEC]">
                <span class="text-[13px] font-semibold text-[#333]">实付金额</span>
                <span class="text-[16px] font-bold text-[#FF6B00]">¥{{ Number(currentOrder.orderTotal || 0).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- 订单信息 -->
          <div class="rounded-xl border border-[#F0F0F0] overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 bg-[#FAFAFA] border-b border-[#F0F0F0]">
              <i class="ri-file-list-3-line text-[#999] text-sm"></i>
              <span class="text-[12px] font-semibold text-[#333]">订单信息</span>
            </div>
            <div class="px-4 py-3 space-y-2.5">
              <div class="flex items-start justify-between text-[12px]">
                <span class="text-[#999] flex-shrink-0 w-16">店铺</span>
                <span class="text-[#333] text-right">{{ currentOrder.shopName || '—' }}</span>
              </div>
              <div class="flex items-start justify-between text-[12px]">
                <span class="text-[#999] flex-shrink-0 w-16">下单时间</span>
                <span class="text-[#333] text-right">{{ formatTime(currentOrder.createTime) }}</span>
              </div>
              <div class="flex items-start justify-between text-[12px]">
                <span class="text-[#999] flex-shrink-0 w-16">支付时间</span>
                <span class="text-[#333] text-right">{{ formatTime(currentOrder.paidAt) || '—' }}</span>
              </div>
              <template v-if="currentOrder.trackingNo">
                <div class="flex items-start justify-between text-[12px]">
                  <span class="text-[#999] flex-shrink-0 w-16">快递公司</span>
                  <span class="text-[#333] text-right">{{ companyName(currentOrder.shippingCompany) }}</span>
                </div>
                <div class="flex items-start justify-between text-[12px]">
                  <span class="text-[#999] flex-shrink-0 w-16">快递单号</span>
                  <span class="text-[#333] font-mono text-right select-all">{{ currentOrder.trackingNo }}</span>
                </div>
                <div class="flex items-start justify-between text-[12px]">
                  <span class="text-[#999] flex-shrink-0 w-16">发货时间</span>
                  <span class="text-[#333] text-right">{{ formatTime(currentOrder.shippedAt) }}</span>
                </div>
              </template>
              <div v-if="currentOrder.buyerRemark" class="flex items-start justify-between text-[12px]">
                <span class="text-[#999] flex-shrink-0 w-16">买家备注</span>
                <span class="text-[#E6825A] text-right font-medium">{{ currentOrder.buyerRemark }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 底部操作栏 ── -->
        <div class="flex-shrink-0 px-6 py-4 border-t border-[#F0F0F0] flex items-center gap-3 bg-white">
          <el-button v-if="currentOrder.orderStatus === 'Paid' && !isAdmin" type="primary"
            @click="openShipDialog(currentOrder); detailVisible = false">
            <i class="ri-send-plane-line mr-1"></i>去发货
          </el-button>
          <el-button v-if="currentOrder.orderStatus === ORDER_STATUS.PENDING_PAY && _can('order:cancel')"
            type="danger" plain @click="doCancelOrder(currentOrder); detailVisible = false">
            取消订单
          </el-button>
          <el-button class="ml-auto" @click="detailVisible = false">关闭</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 发货弹窗 -->
    <el-dialog v-model="shipVisible" title="填写发货信息" width="440px">
      <el-form :model="shipForm" label-width="90px">
        <el-form-item label="快递公司" required>
          <el-select v-model="shipForm.company" placeholder="选择快递" class="w-full">
            <el-option v-for="c in companies" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号" required>
          <el-input v-model="shipForm.trackingNo" placeholder="请输入快递单号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="shipForm.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipLoading" @click="confirmShip">确认发货</el-button>
      </template>
    </el-dialog>
    <!-- 仲裁弹窗（Admin 专属）-->
    <el-dialog v-model="arbitrateVisible" title="平台仲裁" width="440px">
      <div class="text-[13px] text-[#666] mb-4">
        订单：<span class="font-mono text-[#333]">{{ arbitrateTarget?.orderNumber }}</span>
      </div>
      <el-form label-width="80px">
        <el-form-item label="仲裁意见">
          <el-input v-model="arbitrateRemark" type="textarea" :rows="3" placeholder="请填写仲裁处理意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="arbitrateVisible = false">取消</el-button>
        <el-button type="warning" :loading="arbitrateLoading" @click="submitArbitrate">提交仲裁</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminOrderApi } from '@/utils/admin-api';
import { usePermission } from '@/utils/permission';
import { useListPage } from '@/composables/useListPage';
import { useShopFilter } from '@/composables/useShopFilter';
import ShopFilterSelect from '@/components/ShopFilterSelect.vue';
import { ORDER_STATUS, ORDER_STATUS_LABEL, ORDER_STATUS_TAG, AFTER_SALES_STATUS_LABEL } from '@/constants/status';
import { safeFormat } from '@/utils/dateFormat';
import EmptyState from '@/components/EmptyState.vue';
import TableSkeleton from '@/components/TableSkeleton.vue';

const { can: _can, isAdmin } = usePermission();
const { shopParam } = useShopFilter();

// ── 列表（useListPage）──────────────────────────────────────────────────────
const {
  loading, tableData, total, pageNum, pageSize,
  search, dateRange, doSearch, resetSearch, handlePageChange,
} = useListPage(
  (p) => adminOrderApi.list({
    pageNum:      p.pageNum,
    pageSize:     p.pageSize,
    keyword:      p.keyword      || undefined,
    orderStatus:  p.orderStatus  || undefined,
    amountMin:    p.amountMin    ? Number(p.amountMin) : undefined,
    amountMax:    p.amountMax    ? Number(p.amountMax) : undefined,
    startDate:    p.startDate || undefined,
    endDate:      p.endDate   || undefined,
    // Admin：使用筛选下拉的 shopId；ShopOwner：自动注入本店 shopId
    shopId:       p.shopId || (shopParam.value as any).shopId || undefined,
  }),
  { keyword: '', orderStatus: '', amountMin: '', amountMax: '', shopId: null as string|null },
);

// ===== 快递公司 =====
const companies = [
  { label: '顺丰速运', value: 'SF' }, { label: '圆通速递', value: 'YTO' },
  { label: '中通快递', value: 'ZTO' }, { label: '韵达快递', value: 'YD' },
  { label: '申通快递', value: 'STO' }, { label: '京东快递', value: 'JD' },
  { label: '邮政EMS', value: 'EMS' },
];
const companyMap: Record<string, string> = Object.fromEntries(companies.map(c => [c.value, c.label]));
const companyName = (code: string) => companyMap[code] || code || '—';

// ===== 状态配置（使用常量文件）=====
const statusTabs = [
  { label: '全部',   value: '' },
  { label: '待付款', value: ORDER_STATUS.PENDING_PAY },
  { label: '待发货', value: 'Paid' },
  { label: '待收货', value: ORDER_STATUS.SHIPPED },
  { label: '待评价', value: 'PendingReview' },
  { label: '已完成', value: 'Completed' },
  { label: '已取消', value: ORDER_STATUS.CANCELLED },
];

// 扩充 ORDER_STATUS_LABEL 里没有的状态
const _extStatusLabel: Record<string, string> = {
  ...ORDER_STATUS_LABEL,
  PendingReview: '待评价', Closed: '已关闭',
};
const _extStatusTag: Record<string, string> = {
  ...ORDER_STATUS_TAG,
  PendingReview: '', Closed: 'info',
};
const stepMap: Record<string, number> = {
  PendingPay: 0, Paid: 1, Shipped: 2, PendingReview: 3, Completed: 4,
};

const statusText = (s: string) => _extStatusLabel[s] || s || '未知';
const statusTag  = (s: string): any => _extStatusTag[s] ?? 'info';
const getStepActive = (s: string) => stepMap[s] ?? 0;
const afterSalesText = (s: string) => AFTER_SALES_STATUS_LABEL[s] || s || '售后';

// formatTime 改用统一工具
const formatTime = (t: string) => safeFormat(t);

const parsedAddress = (order: any): Record<string, string> | null => {
  if (!order?.addressSnapshot) return null;
  try {
    return typeof order.addressSnapshot === 'string'
      ? JSON.parse(order.addressSnapshot)
      : order.addressSnapshot;
  } catch { return null; }
};

// Tab 切换
const switchTab = (status: string) => {
  search.orderStatus = status;
  doSearch();
};

// ===== 订单详情抽屉 =====
const detailVisible = ref(false);
const detailLoading = ref(false);
const currentOrder = ref<any>(null);

const showDetail = async (row: any) => {
  detailVisible.value = true;
  detailLoading.value = true;
  currentOrder.value = null;
  try {
    const res: any = await adminOrderApi.detail(row.orderId);
    currentOrder.value = res.data?.data || res.data || row;
  } catch {
    currentOrder.value = row;
  }
  detailLoading.value = false;
};

// ===== 发货 =====
const shipVisible = ref(false);
const shipLoading = ref(false);
const shipTargetOrder = ref<any>(null);
const shipForm = reactive({ company: '', trackingNo: '', remark: '' });

const openShipDialog = (row: any) => {
  shipTargetOrder.value = row;
  shipForm.company = '';
  shipForm.trackingNo = '';
  shipForm.remark = '';
  shipVisible.value = true;
};

const confirmShip = async () => {
  if (!shipForm.company || !shipForm.trackingNo) {
    ElMessage.warning('请填写快递公司和快递单号');
    return;
  }
  shipLoading.value = true;
  try {
    await adminOrderApi.ship(shipTargetOrder.value.orderId, { ...shipForm });
    ElMessage.success('发货成功');
    shipVisible.value = false;
    doSearch();
  } finally {
    shipLoading.value = false;
  }
};

// ===== 取消订单 =====
const doCancelOrder = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定取消订单 ${row.orderNumber}？`, '确认取消', { type: 'warning' });
    await adminOrderApi.cancel(row.orderId, '后台管理员取消');
    ElMessage.success('订单已取消');
    doSearch();
  } catch { /* user cancelled or error */ }
};

// ===== 删除订单 =====
const doDeleteOrder = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定删除订单 ${row.orderNumber}？此操作不可恢复。`,
      '删除订单',
      { type: 'error', confirmButtonText: '确认删除', confirmButtonClass: 'el-button--danger', cancelButtonText: '取消' }
    );
    await adminOrderApi.delete(row.orderId);
    ElMessage.success('订单已删除');
    doSearch();
  } catch { /* cancelled */ }
};

// ===== 仲裁 =====
const arbitrateVisible = ref(false);
const arbitrateLoading = ref(false);
const arbitrateTarget = ref<any>(null);
const arbitrateRemark = ref('');

const openArbitrateDialog = (row: any) => {
  arbitrateTarget.value = row;
  arbitrateRemark.value = '';
  arbitrateVisible.value = true;
};

const submitArbitrate = async () => {
  if (!arbitrateRemark.value.trim()) { ElMessage.warning('请填写仲裁意见'); return; }
  arbitrateLoading.value = true;
  try {
    await adminOrderApi.arbitrate(arbitrateTarget.value.orderId, { remark: arbitrateRemark.value });
    ElMessage.success('仲裁意见已提交');
    arbitrateVisible.value = false;
    doSearch();
  } catch { /* interceptor handles */ }
  finally { arbitrateLoading.value = false; }
};

// useListPage 已在 onMounted 自动加载，不需要重复调用
</script>
