<template>
  <div class="page">

    <!-- 搜索 + 状态 Tab -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input
          v-model="keyword" placeholder="搜索店铺名称"
          clearable class="!w-[200px]"
          @clear="load(1)" @keyup.enter="load(1)"
        >
          <template #prefix><i class="ri-search-line text-[#BBB]"></i></template>
        </el-input>

        <el-select v-model="shopType" placeholder="店铺类型" clearable class="!w-[140px]" @change="load(1)">
          <el-option v-for="t in SHOP_TYPES" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>

        <el-radio-group v-model="statusTab" @change="load(1)">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="Pending">
            待审核
            <el-badge v-if="pendingCount > 0" :value="pendingCount" class="ml-1" type="danger" />
          </el-radio-button>
          <el-radio-button value="Active">已通过</el-radio-button>
          <el-radio-button value="Rejected">已拒绝</el-radio-button>
        </el-radio-group>

        <el-button type="primary" @click="load(1)"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <el-button @click="reset"><i class="ri-refresh-line mr-1"></i>重置</el-button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <el-table :data="list" v-loading="loading" stripe style="width:100%">

        <!-- 店铺信息 -->
        <el-table-column label="店铺信息" min-width="240">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-[#F5F5F5] overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img v-if="row.logo || row.shopImage" :src="row.logo || row.shopImage"
                  class="w-full h-full object-cover" />
                <i v-else class="ri-store-2-line text-[#CCC] text-lg"></i>
              </div>
              <div class="min-w-0">
                <div class="text-[13px] font-medium text-[#333] truncate max-w-[160px]">
                  {{ row.displayName || row.shopName }}
                </div>
                <el-tag size="small" type="info" effect="plain" class="mt-0.5">
                  {{ typeLabel(row.shopType) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 联系方式 -->
        <el-table-column label="联系方式" min-width="130">
          <template #default="{ row }">
            <div class="text-[13px] text-[#555]">{{ row.contactNumber || row.phone || '—' }}</div>
            <div v-if="row.contactEmail || row.email" class="text-[11px] text-[#999] mt-0.5 truncate max-w-[120px]">
              {{ row.contactEmail || row.email }}
            </div>
          </template>
        </el-table-column>

        <!-- 申请地址 -->
        <el-table-column label="经营地址" min-width="140">
          <template #default="{ row }">
            <span class="text-[12px] text-[#666]">{{ row.location || row.address || '—' }}</span>
          </template>
        </el-table-column>

        <!-- 申请时间 -->
        <el-table-column label="申请时间" width="130">
          <template #default="{ row }">
            <span class="text-[12px] text-[#999]">{{ formatDate(row.createTime) }}</span>
          </template>
        </el-table-column>

        <!-- 状态 -->
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small" effect="light">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-1 flex-nowrap">
              <el-button link size="small" type="primary" @click="openDetail(row)">
                <i class="ri-eye-line mr-0.5"></i>详情
              </el-button>
              <template v-if="row.status === 'Pending'">
                <el-button link size="small" type="success" @click="quickApprove(row)">
                  <i class="ri-check-line mr-0.5"></i>通过
                </el-button>
                <el-button link size="small" type="danger" @click="openReject(row)">
                  <i class="ri-close-line mr-0.5"></i>拒绝
                </el-button>
              </template>
            </div>
          </template>
        </el-table-column>

      </el-table>

      <!-- 分页 -->
      <div class="flex justify-end px-4 py-3 border-t border-[#F5F5F5]">
        <el-pagination
          v-model:current-page="page" v-model:page-size="pageSize"
          :total="total" :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="load" @size-change="() => load(1)"
        />
      </div>
    </div>

    <!-- ── 详情弹窗 ── -->
    <el-dialog v-model="detailVisible" title="开店申请详情" width="600px" :append-to-body="true">
      <div v-if="current" class="space-y-4">

        <!-- 店铺基本信息 -->
        <div class="bg-[#FAFAFA] rounded-xl p-4">
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 rounded-xl bg-white border border-[#F0F0F0] overflow-hidden flex-shrink-0 flex items-center justify-center">
              <img v-if="current.logo || current.shopImage" :src="current.logo || current.shopImage" class="w-full h-full object-cover" />
              <i v-else class="ri-store-2-line text-[#CCC] text-2xl"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="text-[16px] font-bold text-[#1A1A1A]">{{ current.displayName || current.shopName }}</span>
                <el-tag size="small" type="info" effect="plain">{{ typeLabel(current.shopType) }}</el-tag>
                <el-tag :type="statusTag(current.status)" size="small" effect="light">{{ statusText(current.status) }}</el-tag>
              </div>
              <p class="text-[13px] text-[#666] line-clamp-2">{{ current.shopDescription || '暂无描述' }}</p>
            </div>
          </div>
        </div>

        <!-- 详细信息网格 -->
        <div class="grid grid-cols-2 gap-3">
          <InfoRow label="联系手机" :value="current.contactNumber || current.phone" icon="ri-smartphone-line" />
          <InfoRow label="联系邮箱" :value="current.contactEmail || current.email" icon="ri-mail-line" />
          <InfoRow label="经营地址" :value="current.location || current.address" icon="ri-map-pin-line" class="col-span-2" />
          <InfoRow label="申请时间" :value="formatDate(current.createTime)" icon="ri-time-line" />
          <InfoRow label="申请人 ID" :value="String(current.ownerId || '—')" icon="ri-user-line" />
        </div>

        <!-- 审核意见 -->
        <div v-if="current.remark || current.reviewRemark" class="bg-[#FFFBE6] border border-[#FFE58F] rounded-xl p-3">
          <div class="text-[12px] text-[#AD6800] font-medium mb-1">
            <i class="ri-feedback-line mr-1"></i>审核意见
          </div>
          <p class="text-[13px] text-[#555]">{{ current.remark || current.reviewRemark }}</p>
        </div>

        <!-- 待审核时显示审核表单 -->
        <div v-if="current.status === 'Pending'" class="border-t border-[#F5F5F5] pt-4">
          <div class="text-[13px] font-medium text-[#333] mb-2">审核操作</div>
          <el-input v-model="reviewRemark" type="textarea" :rows="2" placeholder="审核意见（选填）" />
          <div class="flex gap-2 mt-3">
            <el-button type="success" :loading="reviewing" class="flex-1" @click="doReview('Active')">
              <i class="ri-check-double-line mr-1"></i>审核通过
            </el-button>
            <el-button type="danger" :loading="reviewing" class="flex-1" @click="openReject(current)">
              <i class="ri-close-circle-line mr-1"></i>拒绝申请
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- ── 拒绝弹窗 ── -->
    <el-dialog v-model="rejectVisible" title="拒绝申请" width="400px" :append-to-body="true">
      <div class="mb-2 text-[13px] text-[#555]">
        请填写拒绝原因，将通知申请人（必填）
      </div>
      <el-input v-model="rejectReason" type="textarea" :rows="3"
        placeholder="请说明拒绝原因，如：营业执照不符、店铺名称违规等" maxlength="200" show-word-limit />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="reviewing" :disabled="!rejectReason.trim()" @click="doReview('Rejected')">
          确认拒绝
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineComponent } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminShopApi } from '@/utils/admin-api';
import { safeFormat } from '@/utils/dateFormat';

// ── 店铺类型映射 ─────────────────────────────────────────────────────────────
const SHOP_TYPES = [
  { label: '服装服饰', value: 'clothing' },
  { label: '电子数码', value: 'electronics' },
  { label: '家居家具', value: 'furniture' },
  { label: '食品生鲜', value: 'food' },
  { label: '美妆个护', value: 'beauty' },
  { label: '运动户外', value: 'sports' },
  { label: '图书文具', value: 'books' },
  { label: '其他',     value: 'other'  },
];
const TYPE_MAP: Record<string, string> = Object.fromEntries(SHOP_TYPES.map(t => [t.value, t.label]));
const typeLabel = (v: string) => TYPE_MAP[v] || v || '—';

// ── 状态映射 ─────────────────────────────────────────────────────────────────
const statusText = (s: string) => ({ Pending: '待审核', Active: '已通过', Rejected: '已拒绝', Inactive: '已停用' }[s] ?? s);
const statusTag  = (s: string): any => ({ Pending: 'warning', Active: 'success', Rejected: 'danger', Inactive: 'info' }[s] ?? '');

const formatDate = (v: any) => safeFormat(v, 'YYYY-MM-DD HH:mm');

// ── 数据 ─────────────────────────────────────────────────────────────────────
const list         = ref<any[]>([]);
const loading      = ref(false);
const total        = ref(0);
const pendingCount = ref(0);
const page         = ref(1);
const pageSize     = ref(20);
const keyword      = ref('');
const shopType     = ref('');
const statusTab    = ref('Pending'); // 默认显示待审核

const load = async (p?: number) => {
  if (p) page.value = p;
  loading.value = true;
  try {
    const params: any = {
      pageNum:  page.value,
      pageSize: pageSize.value,
    };
    if (statusTab.value) params.status = statusTab.value;
    if (keyword.value)   params.keyword = keyword.value;
    if (shopType.value)  params.shopType = shopType.value;

    const res: any = await adminShopApi.list(params);
    const data = res.data?.data || res.data || {};
    list.value  = Array.isArray(data) ? data : (data.records || []);
    total.value = data.total ?? list.value.length;
  } catch { /* interceptor */ }
  finally { loading.value = false; }
};

const loadPendingCount = async () => {
  try {
    const res: any = await adminShopApi.list({ pageNum: 1, pageSize: 1, status: 'Pending' });
    const data = res.data?.data || res.data || {};
    pendingCount.value = data.total ?? (Array.isArray(data) ? data.length : 0);
  } catch { /* ignore */ }
};

const reset = () => {
  keyword.value  = '';
  shopType.value = '';
  statusTab.value = 'Pending';
  load(1);
};

// ── 详情 ─────────────────────────────────────────────────────────────────────
const detailVisible = ref(false);
const current       = ref<any>(null);
const reviewRemark  = ref('');

const openDetail = (row: any) => {
  current.value     = row;
  reviewRemark.value = '';
  detailVisible.value = true;
};

// ── 审核 ─────────────────────────────────────────────────────────────────────
const reviewing    = ref(false);
const rejectVisible = ref(false);
const rejectReason  = ref('');
const rejectTarget  = ref<any>(null);

const openReject = (row: any) => {
  rejectTarget.value  = row;
  rejectReason.value  = '';
  rejectVisible.value = true;
};

const quickApprove = async (row: any) => {
  await ElMessageBox.confirm(
    `确认通过「${row.displayName || row.shopName}」的开店申请？`,
    '审核通过', { confirmButtonText: '确认通过', cancelButtonText: '取消', type: 'success' }
  );
  reviewing.value = true;
  try {
    await adminShopApi.review(row.shopId || row.id, { status: 'Active', remark: '' });
    ElMessage.success('审核通过');
    load();
    loadPendingCount();
  } catch { /* interceptor */ }
  finally { reviewing.value = false; }
};

const doReview = async (status: 'Active' | 'Rejected') => {
  const target = rejectTarget.value || current.value;
  if (!target) return;

  const remark = status === 'Rejected' ? rejectReason.value.trim() : reviewRemark.value.trim();
  if (status === 'Rejected' && !remark) {
    ElMessage.warning('请填写拒绝原因');
    return;
  }

  reviewing.value = true;
  try {
    await adminShopApi.review(target.shopId || target.id, { status, remark });
    ElMessage.success(status === 'Active' ? '已通过审核' : '已拒绝申请');
    rejectVisible.value  = false;
    detailVisible.value  = false;
    rejectTarget.value   = null;
    load();
    loadPendingCount();
    // 更新当前行状态
    if (current.value?.shopId === (target.shopId || target.id) ||
        current.value?.id === (target.shopId || target.id)) {
      current.value.status = status;
      current.value.remark = remark;
    }
  } catch { /* interceptor */ }
  finally { reviewing.value = false; }
};

onMounted(() => {
  load(1);
  loadPendingCount();
});
</script>

<!-- 内联 InfoRow 组件 -->
<script lang="ts">
import { h, defineComponent as dc } from 'vue';
const InfoRow = dc({
  props: { label: String, value: String, icon: String },
  setup(props) {
    return () => h('div', { class: 'flex items-start gap-2' }, [
      h('i', { class: `${props.icon} text-[#CCC] text-base mt-0.5 flex-shrink-0` }),
      h('div', {}, [
        h('div', { class: 'text-[11px] text-[#999]' }, props.label),
        h('div', { class: 'text-[13px] text-[#333] mt-0.5' }, props.value || '—'),
      ]),
    ]);
  },
});
export default { components: { InfoRow } };
</script>
