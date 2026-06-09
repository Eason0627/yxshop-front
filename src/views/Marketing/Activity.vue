<template>
  <div class="page">
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="活动名称" class="!w-[200px]"
          clearable @keyup.enter="doSearch" />

        <!-- 活动类型 -->
        <el-select v-model="search.type" placeholder="活动类型" class="!w-[130px]" clearable @change="doSearch">
          <el-option label="限时折扣" value="discount" />
          <el-option label="满减活动" value="reduce" />
          <el-option label="买赠活动" value="gift" />
          <el-option label="秒杀活动" value="seckill" />
          <el-option label="品牌特卖" value="brand" />
        </el-select>

        <!-- 活动状态 -->
        <el-select v-model="search.status" placeholder="活动状态" class="!w-[120px]" clearable @change="doSearch">
          <el-option label="进行中" :value="1" />
          <el-option label="已结束" :value="0" />
        </el-select>

        <!-- 活动时间 -->
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="活动开始"
          end-placeholder="活动结束"
          value-format="YYYY-MM-DD"
          size="default"
          class="!w-[260px]"
          @change="doSearch"
        />

        <!-- Admin：店铺筛选下拉 -->
        <ShopFilterSelect
          v-if="can('activity:filter-shop')"
          v-model="search.shopId"
          @change="doSearch"
        />

        <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <el-button @click="resetSearch"><i class="ri-refresh-line mr-1"></i>重置</el-button>
        <div class="flex-1"></div>
        <el-button type="primary" @click="openDialog(null)"><i class="ri-add-line mr-1"></i>新增活动</el-button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <TableSkeleton v-if="loading && tableData.length === 0" />
      <EmptyState v-else-if="!loading && tableData.length === 0" icon="ri-calendar-event-line" tip="暂无活动数据" />
      <el-table v-else :data="tableData" style="width: 100%" v-loading="loading" stripe>
        <el-table-column label="活动" min-width="240">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <img :src="row.image" class="w-14 h-10 rounded-lg object-cover bg-[#F5F5F5] flex-shrink-0" />
              <div class="min-w-0">
                <div class="text-[13px] font-medium text-[#333] truncate">{{ row.title }}</div>
                <div class="text-[11px] text-[#999] mt-0.5">{{ row.subtitle || row.discountText || '—' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="typeTag(row.type)">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="优惠内容" width="130">
          <template #default="{ row }">
            <span class="text-[12px] text-[#FF6B00]">{{ row.discountText || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="时间" width="220">
          <template #default="{ row }">
            <div class="text-[12px]">
              <div>开始：{{ safeFormat(row.startTime || row.startAt) }}</div>
              <div class="text-[#999]">结束：{{ safeFormat(row.endTime || row.endAt) }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="热度" width="110">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <div class="flex-1 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                <div class="h-full bg-[#FF4D4F] rounded-full" :style="{ width: `${row.hotPercent || 0}%` }"></div>
              </div>
              <span class="text-[11px] text-[#999]">{{ row.participants || 0 }}人</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '进行中' : '已结束' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            <span class="text-[12px] text-[#999]">{{ safeFormat(row.createTime || row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="175" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button :type="row.status === 1 ? 'warning' : 'success'" link size="small" @click="toggleStatus(row)">
              {{ row.status === 1 ? '结束' : '启用' }}
            </el-button>
            <el-button v-if="row.status !== 1" type="danger" link size="small" @click="deleteActivity(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end p-4">
        <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
          :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="handlePageChange" />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑活动' : '新增活动'" width="600px" :destroy-on-close="true">
      <el-form :model="form" label-width="90px" size="default">
        <el-form-item label="活动名称" required>
          <el-input v-model="form.title" placeholder="活动标题" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.subtitle" placeholder="活动副标题或简短描述" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-3">
          <el-form-item label="活动类型">
            <el-select v-model="form.type" class="w-full">
              <el-option label="限时折扣" value="discount" />
              <el-option label="满减活动" value="reduce" />
              <el-option label="买赠活动" value="gift" />
              <el-option label="秒杀活动" value="seckill" />
              <el-option label="品牌特卖" value="brand" />
            </el-select>
          </el-form-item>
          <el-form-item label="标签文字">
            <el-input v-model="form.tag" placeholder="如：限时、爆款" maxlength="6" />
          </el-form-item>
        </div>
        <el-form-item label="优惠文案">
          <el-input v-model="form.discountText" placeholder="如：全场8折、满100减20" />
        </el-form-item>
        <el-form-item label="活动图片">
          <MediaPicker v-model="form.image" variant="banner" height="120px" biz-type="activity" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-3">
          <el-form-item label="开始时间">
            <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择开始时间" class="w-full" value-format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item label="结束时间">
            <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间" class="w-full" value-format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
        </div>
        <el-form-item label="上架状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="进行中" inactive-text="已结束" />
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
import MediaPicker from '@/components/MediaPicker/MediaPicker.vue';
import { safeFormat } from '@/utils/dateFormat';
import { useListPage } from '@/composables/useListPage';
import { usePermission } from '@/utils/permission';
import { useShopFilter } from '@/composables/useShopFilter';
import ShopFilterSelect from '@/components/ShopFilterSelect.vue';
import EmptyState from '@/components/EmptyState.vue';
import TableSkeleton from '@/components/TableSkeleton.vue';

const { can } = usePermission();
const { shopParam } = useShopFilter();

const { loading, tableData, total, pageNum, pageSize, search, dateRange, doSearch, resetSearch, handlePageChange } =
  useListPage(
    (p) => adminMarketingApi.activities({
      pageNum: p.pageNum,
      pageSize: p.pageSize,
      keyword: p.keyword || undefined,
      type: p.type || undefined,
      status: p.status !== null ? p.status : undefined,
      startDate: p.startDate || undefined,
      endDate:   p.endDate   || undefined,
      shopId:    p.shopId || (shopParam.value as any).shopId || undefined,
    }),
    { keyword: '', type: '', status: null as number | null, shopId: null as string|null },
  );

const saving = ref(false);

const typeMap: Record<string, string> = { discount: '限时折扣', reduce: '满减活动', gift: '买赠活动', seckill: '秒杀', brand: '品牌特卖' };
const typeTagMap: Record<string, string> = { discount: 'danger', reduce: 'warning', gift: 'success', seckill: 'danger', brand: 'primary' };
const typeText = (t: string) => typeMap[t] || t || '活动';
const typeTag = (t: string): any => typeTagMap[t] || 'info';

const toggleStatus = async (row: any) => {
  try {
    const ns = row.status === 1 ? 0 : 1;
    await adminMarketingApi.updateStatus('activities', row.id, ns);
    row.status = ns;
    ElMessage.success(ns === 1 ? '活动已启用' : '活动已结束');
  } catch { ElMessage.error('操作失败'); }
};

// 删除活动（只允许删除已结束/停用的活动，逻辑删除）
const deleteActivity = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确认删除活动「${row.title}」？已发放优惠券不受影响。`,
      '删除确认', { type: 'warning' }
    );
    await adminMarketingApi.updateStatus('activities', row.id, -1);
    ElMessage.success('活动已删除');
    doSearch();
  } catch { /* 用户取消 */ }
};

// 弹窗
const dialogVisible = ref(false);
const editId = ref<any>(null);
const DEFAULT_FORM = {
  title: '', subtitle: '', type: 'discount', discountText: '',
  image: '', startTime: '', endTime: '', tag: '', status: 1,
};
const form = reactive({ ...DEFAULT_FORM });

const openDialog = (row?: any) => {
  editId.value = row?.id || null;
  Object.assign(form, DEFAULT_FORM, row ? {
    title:       row.title       || '',
    subtitle:    row.subtitle    || '',
    type:        row.type        || 'discount',
    discountText:row.discountText|| '',
    image:       row.image       || '',
    startTime:   row.startTime   || row.startAt || '',
    endTime:     row.endTime     || row.endAt   || '',
    tag:         row.tag         || '',
    status:      row.status      ?? 1,
  } : {});
  dialogVisible.value = true;
};

const save = async () => {
  if (!form.title) { ElMessage.warning('请填写活动名称'); return; }
  saving.value = true;
  try {
    await adminMarketingApi.saveActivity({ ...form, id: editId.value });
    ElMessage.success(editId.value ? '修改成功' : '创建成功');
    dialogVisible.value = false;
    doSearch();
  } catch { ElMessage.error('保存失败'); }
  saving.value = false;
};
</script>
