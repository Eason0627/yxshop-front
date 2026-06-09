<template>
  <div class="page">
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="店铺名称/ID" class="!w-[220px]"
          clearable @keyup.enter="doSearch" @clear="doSearch" />

        <el-select v-model="search.status" placeholder="营业状态" class="!w-[120px]" clearable @change="doSearch">
          <el-option label="营业中" value="Active" />
          <el-option label="未激活" value="Inactive" />
          <el-option label="已关闭" value="Invalid" />
        </el-select>

        <el-select v-model="search.brandShop" placeholder="店铺类型" class="!w-[120px]" clearable @change="doSearch">
          <el-option label="品牌店铺" :value="true" />
          <el-option label="普通店铺" :value="false" />
        </el-select>

        <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <el-button @click="resetSearch"><i class="ri-refresh-line mr-1"></i>重置</el-button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <TableSkeleton v-if="loading && tableData.length === 0" />
      <EmptyState v-else-if="!loading && tableData.length === 0"
        icon="ri-store-2-line" tip="暂无店铺数据" />
      <el-table v-else :data="tableData" style="width: 100%" v-loading="loading" stripe>
        <el-table-column label="店铺" min-width="240">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg overflow-hidden bg-[#F5F5F5] flex-shrink-0 flex items-center justify-center">
                <img v-if="(row.avatar || row.shopImage) && !avatarErr[row.shopId]"
                  :src="row.avatar || row.shopImage"
                  class="w-full h-full object-cover"
                  @error="avatarErr[row.shopId] = true" />
                <span v-else class="text-[10px] text-[#CCC] font-bold">SHOP</span>
              </div>
              <div>
                <div class="text-[13px] font-medium text-[#333]">{{ row.displayName || row.shopName }}</div>
                <div class="text-[12px] text-[#999]">ID: {{ row.shopId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="综合评分" width="200">
          <template #default="{ row }">
            <div class="text-[12px] space-y-0.5">
              <div class="flex items-center gap-2">
                <span class="text-[#999] w-8">服务</span>
                <div class="flex-1 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden max-w-[60px]">
                  <div class="h-full bg-[#FF9500] rounded-full" :style="{ width: `${(Number(row.serviceScore) || 0) / 5 * 100}%` }"></div>
                </div>
                <span class="text-[#FF9500]">{{ row.serviceScore || '—' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[#999] w-8">物流</span>
                <div class="flex-1 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden max-w-[60px]">
                  <div class="h-full bg-[#FF9500] rounded-full" :style="{ width: `${(Number(row.logisticsScore) || 0) / 5 * 100}%` }"></div>
                </div>
                <span class="text-[#FF9500]">{{ row.logisticsScore || '—' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="店主" width="120">
          <template #default="{ row }">
            <span class="text-[13px] text-[#333]">{{ row.ownerName || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="商品数" width="80">
          <template #default="{ row }">{{ row.productCount ?? '—' }}</template>
        </el-table-column>

        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.brandShop ? 'warning' : 'info'" size="small">{{ row.brandShop ? '品牌' : '普通' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="入驻时间" width="170">
          <template #default="{ row }">
            <span class="text-[12px] text-[#999]">{{ safeFormat(row.createTime || row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button
              v-if="_can('shop:status')"
              :type="row.status === SHOP_STATUS.ACTIVE ? 'warning' : 'success'"
              link size="small"
              @click="toggleShopStatus(row)"
            >
              {{ row.status === SHOP_STATUS.ACTIVE ? '关店' : '启用' }}
            </el-button>
            <el-button
              v-if="_can('shop:delete') && row.status !== SHOP_STATUS.ACTIVE"
              type="danger" link size="small"
              @click="closeShop(row)"
            >注销</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end p-4">
        <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
          :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next" @change="handlePageChange" />
      </div>
    </div>

    <!-- 店铺编辑对话框 -->
    <el-dialog v-model="editVisible" title="编辑店铺信息" width="520px" :destroy-on-close="true">
      <el-form :model="editForm" label-width="90px" class="px-1">
        <el-form-item label="店铺名称">
          <el-input v-model="editForm.shopName" />
        </el-form-item>
        <el-form-item label="显示名称">
          <el-input v-model="editForm.displayName" placeholder="留空同店铺名称" />
        </el-form-item>
        <el-form-item label="店铺简介">
          <el-input v-model="editForm.shopDescription" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="联系手机">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="店铺地址">
          <el-input v-model="editForm.location" />
        </el-form-item>
        <el-form-item label="店铺 Logo">
          <MediaPicker v-model="editForm.logo" :preview-size="72" bizType="shop" />
        </el-form-item>
        <el-form-item label="店铺头像">
          <MediaPicker v-model="editForm.avatar" :preview-size="72" bizType="shop" />
        </el-form-item>
        <el-form-item label="Banner">
          <MediaPicker v-model="editForm.banner" :preview-size="100" bizType="shop" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="editForm.tags" placeholder="多个标签用逗号分隔" />
        </el-form-item>
        <el-form-item label="品牌店铺">
          <el-switch v-model="editForm.brandShop" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 店铺详情抽屉 -->
    <el-drawer v-model="detailVisible" title="店铺详情" size="540px" :destroy-on-close="true">
      <div v-if="detailLoading" class="flex items-center justify-center h-40 text-[#999]">加载中...</div>
      <div v-else-if="currentShop" class="px-1 space-y-4">
        <!-- 店铺头部 -->
        <div class="relative">
          <div class="h-28 rounded-xl overflow-hidden bg-gradient-to-r from-[#FF6B00] to-[#FF9500]">
            <img v-if="currentShop.banner || currentShop.shopImage"
              :src="currentShop.banner || currentShop.shopImage"
              class="w-full h-full object-cover" />
          </div>
          <div class="absolute -bottom-5 left-4 w-14 h-14 rounded-xl border-2 border-white bg-white overflow-hidden flex items-center justify-center">
            <img v-if="currentShop.avatar || currentShop.logo"
              :src="currentShop.avatar || currentShop.logo"
              class="w-full h-full object-cover" />
            <span v-else class="text-[10px] text-[#999] font-bold">SHOP</span>
          </div>
        </div>
        <div class="pt-6 pl-1">
          <div class="text-[15px] font-bold text-[#333]">{{ currentShop.displayName || currentShop.shopName }}</div>
          <div class="text-[12px] text-[#999] mt-0.5">{{ currentShop.shopDescription || '暂无简介' }}</div>
        </div>

        <!-- 店铺信息 -->
        <div class="bg-[#FAFAFA] rounded-xl p-4">
          <div class="text-[13px] font-semibold text-[#333] mb-3">基本信息</div>
          <div class="grid grid-cols-2 gap-y-2 text-[12px]">
            <div class="text-[#999]">店铺ID</div><div class="text-[#333]">{{ currentShop.shopId }}</div>
            <div class="text-[#999]">店主</div><div class="text-[#333]">{{ currentShop.ownerName || '—' }}</div>
            <div class="text-[#999]">店主ID</div><div class="text-[#333]">{{ currentShop.ownerUserId || '—' }}</div>
            <div class="text-[#999]">联系手机</div><div class="text-[#333]">{{ currentShop.phone || '—' }}</div>
            <div class="text-[#999]">品牌店铺</div><div>
              <el-tag :type="currentShop.brandShop ? 'warning' : 'info'" size="small">{{ currentShop.brandShop ? '是' : '否' }}</el-tag>
            </div>
            <div class="text-[#999]">当前状态</div><div>
              <el-tag :type="statusTag(currentShop.status)" size="small">{{ statusText(currentShop.status) }}</el-tag>
            </div>
          </div>
        </div>

        <!-- 评分 -->
        <div class="bg-[#FAFAFA] rounded-xl p-4">
          <div class="text-[13px] font-semibold text-[#333] mb-3">评分数据</div>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div>
              <div class="text-xl font-bold text-[#FF9500]">{{ currentShop.serviceScore || '—' }}</div>
              <div class="text-[11px] text-[#999] mt-0.5">服务态度</div>
            </div>
            <div>
              <div class="text-xl font-bold text-[#FF9500]">{{ currentShop.logisticsScore || '—' }}</div>
              <div class="text-[11px] text-[#999] mt-0.5">物流速度</div>
            </div>
            <div>
              <div class="text-xl font-bold text-[#FF9500]">{{ currentShop.qualityScore || '—' }}</div>
              <div class="text-[11px] text-[#999] mt-0.5">商品质量</div>
            </div>
          </div>
        </div>

        <!-- 操作 -->
        <div class="flex gap-3">
          <el-button
            v-if="_can('shop:status')"
            :type="currentShop.status === SHOP_STATUS.ACTIVE ? 'warning' : 'success'"
            class="flex-1"
            @click="toggleShopStatus(currentShop); detailVisible = false">
            {{ currentShop.status === SHOP_STATUS.ACTIVE ? '关闭店铺' : '启用店铺' }}
          </el-button>
          <el-button class="flex-1" @click="detailVisible = false">关闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminShopApi } from '@/utils/admin-api';
import { usePermission } from '@/utils/permission';
import { useListPage } from '@/composables/useListPage';
import { SHOP_STATUS, SHOP_STATUS_LABEL, SHOP_STATUS_TAG } from '@/constants/status';
import { safeFormat } from '@/utils/dateFormat';
import EmptyState from '@/components/EmptyState.vue';
import TableSkeleton from '@/components/TableSkeleton.vue';
import MediaPicker from '@/components/MediaPicker/MediaPicker.vue';

const { can: _can } = usePermission();
const avatarErr = reactive<Record<string, boolean>>({});

// ── 列表（useListPage）──────────────────────────────────────────────────────
const {
  loading, tableData, total, pageNum, pageSize,
  search, doSearch, resetSearch, handlePageChange,
} = useListPage(
  (p) => adminShopApi.list({
    pageNum: p.pageNum, pageSize: p.pageSize,
    keyword:   p.keyword   || undefined,
    status:    p.status    || undefined,
    brandShop: p.brandShop ?? undefined,
  }),
  { keyword: '', status: '' as string, brandShop: null as boolean | null },
);

// 使用常量替代局部 map
const statusText = (s: string) => SHOP_STATUS_LABEL[s] || s || '—';
const statusTag  = (s: string): any => SHOP_STATUS_TAG[s]  || 'info';

const toggleShopStatus = async (row: any) => {
  const newStatus = row.status === SHOP_STATUS.ACTIVE ? SHOP_STATUS.INACTIVE : SHOP_STATUS.ACTIVE;
  const action = newStatus === SHOP_STATUS.ACTIVE ? '启用' : '关闭';
  try {
    await ElMessageBox.confirm(
      `确定${action}「${row.displayName || row.shopName}」？`,
      '操作确认', { type: 'warning' }
    );
    await adminShopApi.updateStatus(row.shopId, newStatus);
    row.status = newStatus;
    ElMessage.success(`店铺已${action}`);
  } catch { /* 用户取消 */ }
};

// 注销店铺（逻辑删除：状态设为 Invalid，该操作不可逆）
const closeShop = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `注销「${row.displayName || row.shopName}」后不可恢复，确认操作？`,
      '注销确认', { type: 'error', confirmButtonText: '确认注销' }
    );
    await adminShopApi.updateStatus(row.shopId, SHOP_STATUS.INVALID);
    row.status = SHOP_STATUS.INVALID;
    ElMessage.success('店铺已注销');
  } catch { /* 用户取消 */ }
};

// 编辑抽屉
const editVisible = ref(false);
const editSaving = ref(false);
const editForm = reactive({
  shopId: null as any,
  shopName: '', displayName: '', shopDescription: '',
  phone: '', location: '', logo: '', avatar: '', banner: '', tags: '',
  brandShop: 0 as 0 | 1,
});

const openEdit = (row: any) => {
  Object.assign(editForm, {
    shopId: row.shopId,
    shopName: row.shopName || '',
    displayName: row.displayName || '',
    shopDescription: row.shopDescription || '',
    phone: row.phone || '',
    location: row.location || '',
    logo: row.logo || '',
    avatar: row.avatar || '',
    banner: row.banner || '',
    tags: row.tags || '',
    brandShop: row.brandShop ? 1 : 0,
  });
  editVisible.value = true;
};

const saveEdit = async () => {
  editSaving.value = true;
  try {
    await adminShopApi.adminUpdate(editForm.shopId, { ...editForm });
    ElMessage.success('保存成功');
    editVisible.value = false;
    doSearch();
  } finally {
    editSaving.value = false;
  }
};

// 详情抽屉
const detailVisible = ref(false);
const detailLoading = ref(false);
const currentShop = ref<any>(null);

const showDetail = async (row: any) => {
  detailVisible.value = true;
  detailLoading.value = true;
  currentShop.value = null;
  try {
    const res: any = await adminShopApi.detail(row.shopId);
    currentShop.value = res.data?.data || res.data || row;
  } catch {
    currentShop.value = row;  // 降级：用列表行数据兜底
  } finally {
    detailLoading.value = false;
  }
};
</script>
