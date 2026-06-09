<template>
  <div class="page">
    <!-- 搜索�?-->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="订单号 / 买家备注" class="!w-[220px]"
          clearable @keyup.enter="doSearch" @clear="doSearch" />
        <el-select v-model="search.orderStatus" placeholder="发货状态" class="!w-[130px]" clearable @change="doSearch">
          <el-option label="待发货" value="Paid" />
          <el-option label="已发货" value="Shipped" />
          <el-option label="待评价" value="PendingReview" />
          <el-option label="已完成" value="Completed" />
        </el-select>
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
        <el-table-column label="收货人" width="130">
          <template #default="{ row }">
            <div v-if="parsedAddress(row)" class="text-[13px]">
              <div>{{ parsedAddress(row)?.receiverName }}</div>
              <div class="text-[11px] text-[#999]">{{ parsedAddress(row)?.phone }}</div>
            </div>
            <span v-else class="text-[#CCC] text-[12px]">—</span>
          </template>
        </el-table-column>
        <el-table-column label="收货地址" min-width="200">
          <template #default="{ row }">
            <div v-if="parsedAddress(row)" class="flex items-start gap-1">
              <span class="text-[12px] text-[#666] flex-1">
                {{ parsedAddress(row)?.province }}{{ parsedAddress(row)?.city }}{{ parsedAddress(row)?.district }}{{ parsedAddress(row)?.detail }}
              </span>
              <el-button size="small" text type="primary" class="!px-0 !py-0 flex-shrink-0"
                @click="openAddressMap(row)">
                <i class="ri-map-pin-line"></i>
              </el-button>
            </div>
            <span v-else class="text-[#CCC] text-[12px]">—</span>
          </template>
        </el-table-column>
        <el-table-column label="快递信息" width="220">
          <template #default="{ row }">
            <div v-if="row.trackingNo" class="text-[12px]">
              <div class="font-medium">{{ companyName(row.shippingCompany) }}</div>
              <div class="flex items-center gap-1">
                <span class="text-[#999] font-mono">{{ row.trackingNo }}</span>
                <el-button size="small" text type="primary" class="!px-0" @click="openLogistics(row)">
                  <i class="ri-map-pin-time-line"></i>轨迹
                </el-button>
              </div>
            </div>
            <el-tag v-else size="small" type="warning">待发货</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发货时间" width="160">
          <template #default="{ row }">{{ formatTime(row.shippedAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.orderStatus)" size="small">{{ statusText(row.orderStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.orderStatus === 'Paid'" type="success" link size="small" @click="openShipDialog(row, false)">发货</el-button>
            <el-button v-if="row.trackingNo" type="primary" link size="small" @click="openShipDialog(row, true)">修改快递</el-button>
            <el-button
              v-if="['Cancelled','Completed'].includes(row.orderStatus)"
              type="danger" link size="small"
              @click="doDeleteOrder(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end p-4">
        <el-pagination v-model:current-page="search.pageNum" v-model:page-size="search.pageSize"
          :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="loadData" />
      </div>
    </div>

    <!-- 物流轨迹弹窗 -->
    <LogisticsTrackDialog
      v-model="logisticsVisible"
      :order-id="logisticsRow.orderId"
      :carrier-name="logisticsRow.carrierName"
      :tracking-no="logisticsRow.trackingNo"
    />

    <!-- 地址地图 -->
    <AddressMapDialog
      v-model="mapVisible"
      :address="mapAddress"
      title="收货地址"
    />

    <!-- 发货 / 修改弹窗 -->
    <el-dialog :destroy-on-close="true" v-model="shipVisible" :title="editMode ? '修改快递信息' : '填写发货信息'" width="440px">
      <el-form :model="shipForm" label-width="90px">
        <el-form-item label="快递公司" required>
          <el-select v-model="shipForm.company" class="w-full">
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
        <el-button type="primary" :loading="saving" @click="confirmShip">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ORDER_STATUS } from '@/constants/status';
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminOrderApi } from '@/utils/admin-api';
import { safeFormat } from '@/utils/dateFormat';
import AddressMapDialog from '@/components/MapPicker/AddressMapDialog.vue';
import LogisticsTrackDialog from '@/components/Logistics/LogisticsTrackDialog.vue';

const loading = ref(false);
const saving = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const search = reactive({ keyword: '', orderStatus: '', pageNum: 1, pageSize: 20 });

const companies = [
  { label: '顺丰速运', value: 'SF' }, { label: '圆通速递', value: 'YTO' },
  { label: '中通快递', value: 'ZTO' }, { label: '韵达快递', value: 'YD' },
  { label: '申通快递', value: 'STO' }, { label: '京东快递', value: 'JD' },
  { label: '邮政EMS', value: 'EMS' },
];
const companyMap: Record<string, string> = Object.fromEntries(companies.map(c => [c.value, c.label]));
const companyName = (code: string) => companyMap[code] || code || '—';

const statusMap: Record<string, string> = {
  Paid: '待发货', Shipped: '运输中', PendingReview: '待评价', Completed: '已完成',
};
const statusTagMap: Record<string, string> = {
  Paid: 'warning', Shipped: 'primary', PendingReview: '', Completed: 'success',
};
const statusText = (s: string) => statusMap[s] || s || '—';
const statusTag = (s: string): any => statusTagMap[s] || 'info';

const formatTime = safeFormat;

const parsedAddress = (row: any): Record<string, string> | null => {
  if (!row?.addressSnapshot) return null;
  try {
    return typeof row.addressSnapshot === 'string'
      ? JSON.parse(row.addressSnapshot)
      : row.addressSnapshot;
  } catch { return null; }
};

const loadData = async () => {
  loading.value = true;
  try {
    // 物流管理页：默认展示待发货、已发货、待评价、已完成的订单
    const params: any = {
      pageNum: search.pageNum,
      pageSize: search.pageSize,
    };
    if (search.keyword) params.keyword = search.keyword;
    if (search.orderStatus) {
      params.orderStatus = search.orderStatus;
    } else {
      // 不传 orderStatus 时，后端默认返回全部（物流相关的过滤在此通过分类解决）
    }
    const res: any = await adminOrderApi.list(params);
    const data = res.data?.data || res.data || {};
    // 前端过滤出物流相关状态（Paid/Shipped/PendingReview/Completed）
    const all = data.records || [];
    tableData.value = search.orderStatus
      ? all
      : all.filter((o: any) => [ORDER_STATUS.PAID, ORDER_STATUS.SHIPPED, 'PendingReview', ORDER_STATUS.COMPLETED].includes(o.orderStatus));
    total.value = data.total || 0;
  } catch { /* interceptor handles */ } finally { loading.value = false; }
};

const doSearch = () => { search.pageNum = 1; loadData(); };
const resetSearch = () => { search.keyword = ''; search.orderStatus = ''; search.pageNum = 1; loadData(); };

// 发货 / 修改弹窗
const shipVisible = ref(false);
const editMode = ref(false);
const shipTarget = ref<any>(null);
const shipForm = reactive({ company: '', trackingNo: '', remark: '' });

const openShipDialog = (row: any, edit: boolean) => {
  editMode.value = edit;
  shipTarget.value = row;
  shipForm.company = edit ? (row.shippingCompany || '') : '';
  shipForm.trackingNo = edit ? (row.trackingNo || '') : '';
  shipForm.remark = edit ? (row.shippingRemark || '') : '';
  shipVisible.value = true;
};

const confirmShip = async () => {
  if (!shipForm.company || !shipForm.trackingNo) {
    ElMessage.warning('请填写快递公司和单号');
    return;
  }
  saving.value = true;
  try {
    await adminOrderApi.ship(shipTarget.value.orderId, { ...shipForm });
    ElMessage.success(editMode.value ? '修改成功' : '发货成功');
    shipVisible.value = false;
    loadData();
  } catch { /* interceptor handles */ } finally { saving.value = false; }
};

// 物流轨迹
const logisticsVisible = ref(false);
const logisticsRow = ref({ orderId: 0 as number | string, carrierName: '', trackingNo: '' });
function openLogistics(row: any) {
  logisticsRow.value = {
    orderId:     row.orderId,
    carrierName: companyName(row.shippingCompany),
    trackingNo:  row.trackingNo || '',
  };
  logisticsVisible.value = true;
}

// 地址地图
const mapVisible = ref(false);
const mapAddress = ref('');

function openAddressMap(row: any) {
  const addr = parsedAddress(row);
  if (!addr) return;
  mapAddress.value = `${addr.province || ''}${addr.city || ''}${addr.district || ''}${addr.detail || ''}`;
  mapVisible.value = true;
}

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
    loadData();
  } catch { /* cancelled */ }
};

onMounted(() => loadData());
</script>
