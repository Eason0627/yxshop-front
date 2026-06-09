<template>
  <div class="page">
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="优惠券名称" class="!w-[200px]" clearable @keyup.enter="doSearch" />
        <el-select v-model="search.type" placeholder="类型" class="!w-[140px]" clearable @change="doSearch">
          <el-option label="无门槛券" value="free_shipping" />
          <el-option label="满减券" value="reduce" />
          <el-option label="折扣券" value="discount" />
          <el-option label="赠品券" value="gift" />
        </el-select>
        <el-select v-model="search.status" placeholder="状态" class="!w-[120px]" clearable @change="doSearch">
          <el-option label="进行中" :value="1" />
          <el-option label="已失效" :value="0" />
        </el-select>
        <!-- Admin：店铺筛选下拉 -->
        <ShopFilterSelect
          v-if="can('coupon:filter-shop')"
          v-model="search.shopId"
          @change="doSearch"
        />

        <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <el-button @click="resetSearch"><i class="ri-refresh-line mr-1"></i>重置</el-button>
        <div class="flex-1"></div>
        <el-button type="primary" @click="openDialog(null)"><i class="ri-add-line mr-1"></i>新建优惠券</el-button>
      </div>
    </div>

    <!-- 优惠券卡片网格 -->
    <TableSkeleton v-if="loading && tableData.length === 0" />
    <EmptyState v-else-if="!loading && tableData.length === 0" icon="ri-coupon-line" tip="暂无优惠券，点击右上角「新建优惠券」" />
    <div v-else class="grid grid-cols-3 gap-4 mb-4">
      <div v-for="item in tableData" :key="item.id"
        class="bg-white rounded-xl border border-[#F0F0F0] overflow-hidden hover:shadow-md transition-shadow">
        <!-- 券头部 -->
        <div class="flex items-stretch">
          <div class="w-[80px] flex flex-col items-center justify-center py-4 flex-shrink-0"
            :style="{ background: couponBg(item.type) }">
            <div class="text-white font-bold text-xl leading-none">
              {{ couponValue(item) }}
            </div>
            <div class="text-white/80 text-[10px] mt-1">{{ couponUnit(item.type) }}</div>
          </div>
          <!-- 虚线分隔 -->
          <div class="flex flex-col items-center justify-around py-2 px-1">
            <div class="w-0 h-full border-l border-dashed border-[#F0F0F0]"></div>
          </div>
          <div class="flex-1 p-3 min-w-0">
            <div class="text-[13px] font-semibold text-[#333] truncate">{{ item.name }}</div>
            <div class="text-[11px] text-[#999] mt-0.5">{{ couponCondition(item) }}</div>
            <div class="text-[11px] text-[#999] mt-0.5">
              有效期：{{ item.validDays ? `领取后${item.validDays}天` : safeFormat(item.endTime) }}
            </div>
          </div>
        </div>
        <!-- 底部操作 -->
        <div class="flex items-center justify-between px-3 py-2 border-t border-[#F5F5F5] bg-[#FAFAFA]">
          <div class="flex items-center gap-2">
            <el-tag :type="item.status === 1 ? 'success' : 'info'" size="small">{{ item.status === 1 ? '进行中' : '已失效' }}</el-tag>
            <span class="text-[11px] text-[#999]">已领 {{ item.receivedCount || 0 }} / 发行 {{ item.totalCount || '∞' }}</span>
          </div>
          <div class="flex gap-1">
            <el-button size="small" plain @click="openDialog(item)">编辑</el-button>
            <el-button size="small" :type="item.status === 1 ? 'warning' : 'success'" plain @click="toggleStatus(item)">
              {{ item.status === 1 ? '停用' : '启用' }}
            </el-button>
            <el-button
              v-if="item.status !== 1 && !(item.receivedCount > 0)"
              size="small" type="danger" plain @click="deleteCoupon(item)"
            >删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end mt-2">
      <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
        :total="total" :page-sizes="[12, 24, 48]" layout="total, sizes, prev, pager, next" @change="handlePageChange" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑优惠券' : '新建优惠券'" width="560px" :destroy-on-close="true">
      <el-form :model="form" label-width="90px" size="default">
        <el-form-item label="券名称" required>
          <el-input v-model="form.name" placeholder="如：新人专享券、夏日满减券" />
        </el-form-item>
        <el-form-item label="券类型" required>
          <el-radio-group v-model="form.type">
            <el-radio-button label="reduce">满减券</el-radio-button>
            <el-radio-button label="discount">折扣券</el-radio-button>
            <el-radio-button label="free_shipping">无门槛券</el-radio-button>
            <el-radio-button label="gift">赠品券</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.type === 'reduce'" label="减免金额" required>
          <el-input-number v-model="form.discountValue" :min="1" :precision="0" placeholder="减免金额（元）" />
        </el-form-item>
        <el-form-item v-if="form.type === 'discount'" label="折扣比例" required>
          <el-input-number v-model="form.discountValue" :min="1" :max="99" :precision="0" placeholder="如：80 代表8折" />
          <span class="ml-2 text-[#999] text-[12px]">折（{{ form.discountValue || 0 }}% off）</span>
        </el-form-item>
        <el-form-item v-if="form.type === 'free_shipping'" label="免运费">
          <span class="text-[#999] text-[12px]">无门槛免运费</span>
        </el-form-item>
        <el-form-item v-if="form.type !== 'free_shipping'" label="使用门槛">
          <el-input-number v-model="form.minAmount" :min="0" :precision="0" placeholder="满X元可用，0=无门槛" />
          <span class="ml-2 text-[#999] text-[12px]">元</span>
        </el-form-item>
        <el-form-item label="发行总量">
          <el-input-number v-model="form.totalCount" :min="0" placeholder="0=不限量" />
          <span class="ml-2 text-[#999] text-[12px]">张（0=不限）</span>
        </el-form-item>
        <el-form-item label="每人限领">
          <el-input-number v-model="form.limitPerUser" :min="1" :max="99" />
          <span class="ml-2 text-[#999] text-[12px]">张</span>
        </el-form-item>
        <el-form-item label="有效期">
          <el-radio-group v-model="validType" class="mb-2">
            <el-radio :value="'days'">领取后有效天数</el-radio>
            <el-radio :value="'range'">固定日期范围</el-radio>
          </el-radio-group>
          <div v-if="validType === 'days'" class="flex items-center gap-2 mt-1">
            <el-input-number v-model="form.validDays" :min="1" :max="365" />
            <span class="text-[#999] text-[12px]">天</span>
          </div>
          <div v-else class="mt-1">
            <el-date-picker v-model="formDateRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
          </div>
        </el-form-item>
        <el-form-item label="使用范围">
          <el-select v-model="form.scope" class="w-full">
            <el-option label="全场通用" value="all" />
            <el-option label="指定分类" value="category" />
            <el-option label="指定店铺" value="shop" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="进行中" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminMarketingApi } from '@/utils/admin-api';
import { useListPage } from '@/composables/useListPage';
import { usePermission } from '@/utils/permission';
import { useShopFilter } from '@/composables/useShopFilter';
import ShopFilterSelect from '@/components/ShopFilterSelect.vue';
import { safeFormat } from '@/utils/dateFormat';
import EmptyState from '@/components/EmptyState.vue';
import TableSkeleton from '@/components/TableSkeleton.vue';

const { can } = usePermission();
const { shopParam } = useShopFilter();

const { loading, tableData, total, pageNum, pageSize, search, doSearch, resetSearch, handlePageChange } =
  useListPage(
    (p) => adminMarketingApi.couponTemplates({
      pageNum: p.pageNum,
      pageSize: p.pageSize,
      keyword: p.keyword || undefined,
      type: p.type || undefined,
      status: p.status !== null ? p.status : undefined,
      shopId:  p.shopId || (shopParam.value as any).shopId || undefined,
    }),
    { keyword: '', type: '', status: null as number | null, shopId: null as string|null },
    { pageSize: 12 },
  );

// Coupon display helpers
const couponBg = (type: string) => {
  const m: Record<string, string> = {
    reduce: 'linear-gradient(135deg, #FF6B00, #FF9500)',
    discount: 'linear-gradient(135deg, #165DFF, #4080FF)',
    free_shipping: 'linear-gradient(135deg, #00B96B, #36C96D)',
    gift: 'linear-gradient(135deg, #722ED1, #A855F7)',
  };
  return m[type] || m.reduce;
};
const couponValue = (item: any) => {
  if (item.type === 'discount') return `${item.discountValue || ''}`;
  if (item.type === 'free_shipping') return '免';
  if (item.type === 'gift') return '赠';
  return `${item.discountValue || ''}`;
};
const couponUnit = (type: string) => {
  const m: Record<string, string> = { reduce: '元', discount: '折', free_shipping: '运费', gift: '品' };
  return m[type] || '元';
};
const couponCondition = (item: any) => {
  if (item.type === 'free_shipping') return '无门槛免运费';
  if (item.type === 'gift') return '领取赠品';
  if (item.minAmount > 0) return `满¥${item.minAmount}可用`;
  return '无使用门槛';
};

const saving = ref(false);

const toggleStatus = async (item: any) => {
  try {
    const ns = item.status === 1 ? 0 : 1;
    await adminMarketingApi.updateStatus('coupons', item.id, ns);
    item.status = ns;
    ElMessage.success(ns === 1 ? '已启用' : '已停用');
  } catch { ElMessage.error('操作失败'); }
};

// 删除优惠券（仅限停用且未发放的券，物理删除）
const deleteCoupon = async (item: any) => {
  try {
    await ElMessageBox.confirm(
      `确认删除优惠券「${item.name}」？`,
      '删除确认', { type: 'warning' }
    );
    await adminMarketingApi.updateStatus('coupons', item.id, -1);
    ElMessage.success('已删除');
    doSearch();
  } catch { /* 用户取消 */ }
};

// 弹窗
const dialogVisible = ref(false);
const editId = ref<any>(null);
const validType = ref<'days' | 'range'>('days');
const formDateRange = ref<string[]>([]);
const form = reactive({
  name: '', type: 'reduce', discountValue: 10, minAmount: 0,
  totalCount: 0, limitPerUser: 1, validDays: 30,
  startTime: '', endTime: '', scope: 'all', status: 1,
});

const openDialog = (row: any) => {
  editId.value = row?.id || null;
  if (row) {
    form.name = row.name || '';
    form.type = row.type || 'reduce';
    form.discountValue = row.discountValue || 10;
    form.minAmount = row.minAmount || 0;
    form.totalCount = row.totalCount || 0;
    form.limitPerUser = row.limitPerUser || 1;
    form.validDays = row.validDays || 30;
    form.startTime = row.startTime || '';
    form.endTime = row.endTime || '';
    form.scope = row.scope || 'all';
    form.status = row.status ?? 1;
    validType.value = row.validDays ? 'days' : 'range';
    formDateRange.value = row.startTime ? [row.startTime, row.endTime] : [];
  } else {
    Object.assign(form, { name: '', type: 'reduce', discountValue: 10, minAmount: 0, totalCount: 0, limitPerUser: 1, validDays: 30, startTime: '', endTime: '', scope: 'all', status: 1 });
    validType.value = 'days';
    formDateRange.value = [];
  }
  dialogVisible.value = true;
};

const save = async () => {
  if (!form.name) { ElMessage.warning('请填写优惠券名称'); return; }
  const payload: any = { ...form, id: editId.value };
  // Map frontend field names to backend DTO field names
  payload.value = form.discountValue;       // DTO uses 'value', not 'discountValue'
  payload.scopeType = form.scope;            // DTO uses 'scopeType', not 'scope'
  if (validType.value === 'range' && formDateRange.value.length === 2) {
    payload.startTime = formDateRange.value[0];
    payload.endTime = formDateRange.value[1];
    payload.validDays = 0;
  }
  saving.value = true;
  try {
    await adminMarketingApi.saveCouponTemplate(payload);
    ElMessage.success(editId.value ? '修改成功' : '创建成功');
    dialogVisible.value = false;
    doSearch();
  } catch { ElMessage.error('保存失败'); }
  saving.value = false;
};
</script>
