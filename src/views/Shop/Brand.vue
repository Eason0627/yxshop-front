<template>
  <div class="page">
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="品牌名称" class="!w-[200px]"
          clearable @keyup.enter="doSearch" />
        <el-select v-model="search.status" placeholder="状态" class="!w-[120px]" clearable @change="doSearch">
          <el-option label="展示中" value="Active" />
          <el-option label="已隐藏" value="Inactive" />
        </el-select>
        <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <div class="flex-1"></div>
        <el-button v-if="can('brand:edit')" type="primary" @click="openDialog(null)"><i class="ri-add-line mr-1"></i>新增品牌</el-button>
      </div>
    </div>

    <!-- 品牌卡片 -->
    <div class="grid grid-cols-4 gap-4 mb-4" v-loading="loading">
      <div v-for="item in tableData" :key="item.shopId"
        class="bg-white rounded-xl border border-[#F0F0F0] overflow-hidden hover:shadow-md transition-shadow">
        <!-- 封面图 -->
        <div class="relative h-[100px] overflow-hidden">
          <!-- 有封面图片（带错误回退） -->
          <img
            v-if="hasCoverImg(item) && !imgError[item.shopId]"
            :src="item.banner || item.shopImage"
            class="w-full h-full object-cover"
            @error="imgError[item.shopId] = true"
          />
          <!-- 无封面图或图片加载失败 → 渐变占位 -->
          <div
            v-else
            class="w-full h-full flex flex-col justify-center px-4 relative overflow-hidden"
            :style="{ background: shopGradient(item) }"
          >
            <!-- 平台自营：YX SVG logo -->
            <template v-if="isPlatformShop(item)">
              <svg viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg" class="w-28 opacity-95">
                <text x="4" y="46" font-family="Arial Black, Arial, sans-serif" font-size="48" font-weight="900"
                  fill="white" letter-spacing="-2" opacity="0.95">YX</text>
                <rect x="4" y="50" width="72" height="3" rx="1.5" fill="rgba(255,255,255,0.6)" />
                <text x="80" y="58" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.7)">PLATFORM</text>
              </svg>
              <div class="text-white text-[11px] opacity-60 mt-1">平台官方自营</div>
            </template>
            <!-- 其他店铺：显示首字母 -->
            <template v-else>
              <div class="text-white font-bold text-[22px] tracking-wide opacity-90 leading-tight">{{ shopInitials(item) }}</div>
              <div class="text-white text-[11px] opacity-60 truncate mt-0.5">{{ item.displayName || item.shopName }}</div>
            </template>
            <!-- 装饰圆 -->
            <div class="absolute right-[-20px] top-[-20px] w-24 h-24 rounded-full bg-white/10 pointer-events-none"></div>
            <div class="absolute right-[30px] bottom-[-30px] w-16 h-16 rounded-full bg-white/[0.08] pointer-events-none"></div>
          </div>
          <el-tag v-if="item.brandShop" size="small" type="warning" class="absolute top-2 right-2">官方品牌</el-tag>
        </div>

        <!-- 品牌信息行 -->
        <div class="p-3 flex items-center gap-2">
          <div class="w-9 h-9 rounded-full border border-[#F0F0F0] bg-white overflow-hidden flex items-center justify-center flex-shrink-0">
            <img v-if="(item.avatar || item.logo) && !avatarError[item.shopId]"
              :src="item.avatar || item.logo"
              class="w-full h-full object-cover"
              @error="avatarError[item.shopId] = true" />
            <span v-else class="text-[10px] font-bold text-[#FF6B00]">{{ shopInitials(item).charAt(0) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[13px] font-semibold text-[#333] truncate">{{ item.displayName || item.shopName }}</div>
            <div class="text-[11px] text-[#999]">ID {{ item.shopId }} · {{ item.productCount || 0 }} 件商品</div>
          </div>
        </div>

        <!-- 操作按钮（仅 Admin 可见） -->
        <div v-if="can('brand:edit')" class="flex border-t border-[#F5F5F5]">
          <button class="flex-1 py-2 text-[12px] text-[#FF6B00] hover:bg-[#FFF4E6] transition-colors" @click="openDialog(item)">编辑</button>
          <div class="w-px bg-[#F5F5F5]"></div>
          <button class="flex-1 py-2 text-[12px] hover:bg-[#F5F5F5] transition-colors"
            :class="item.status === BRAND_STATUS.ACTIVE ? 'text-[#999]' : 'text-[#52C41A]'"
            @click="toggleStatus(item)">
            {{ item.status === BRAND_STATUS.ACTIVE ? '隐藏' : '显示' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="!loading && tableData.length === 0" class="bg-white rounded-xl border border-[#F0F0F0] p-12 text-center">
      <i class="ri-vip-crown-line text-4xl text-[#DDD]"></i>
      <p class="text-[#999] mt-2 text-[13px]">暂无品牌数据</p>
    </div>

    <div class="flex justify-end">
      <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
        :total="total" :page-sizes="[12, 24, 48]" layout="total, sizes, prev, pager, next" @change="doSearch" />
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑品牌' : '新增品牌'" width="560px" :destroy-on-close="true">
      <el-form :model="form" label-width="90px">
        <el-form-item label="品牌名称" required>
          <el-input v-model="form.name" placeholder="品牌/店铺名称" />
        </el-form-item>

        <!-- Logo 使用 MediaPicker -->
        <el-form-item label="品牌 Logo">
          <div class="flex items-center gap-4">
            <MediaPicker v-model="form.logo" :preview-size="72" :clearable="true" bizType="common" />
            <div class="text-[12px] text-[#999]">建议正方形图片，将显示在品牌头像处</div>
          </div>
        </el-form-item>

        <!-- 封面图 使用 MediaPicker -->
        <el-form-item label="封面图">
          <div class="space-y-2 w-full">
            <MediaPicker v-model="form.banner" :preview-size="120" :clearable="true" bizType="common" />
            <div class="text-[12px] text-[#999]">建议 750×300 横幅图，将显示在品牌卡片顶部</div>
          </div>
        </el-form-item>

        <el-form-item label="品牌描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="品牌简介" />
        </el-form-item>
        <el-form-item label="官方品牌">
          <el-switch v-model="form.isBrandShop" active-text="是" inactive-text="否" />
        </el-form-item>
        <el-form-item label="显示状态">
          <el-switch v-model="form.status" active-value="Active" inactive-value="Inactive" active-text="展示" inactive-text="隐藏" />
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
import { BRAND_STATUS } from '@/constants/status';
import { ElMessage } from 'element-plus';
import { adminShopApi } from '@/utils/admin-api';
import { usePermission } from '@/utils/permission';
import MediaPicker from '@/components/MediaPicker/MediaPicker.vue';
import { useListPage } from '@/composables/useListPage';

const { can } = usePermission();
const saving = ref(false);
// 图片加载失败记录（shopId → true）
const imgError = reactive<Record<string, boolean>>({});
const avatarError = reactive<Record<string, boolean>>({});

// ===== 辅助函数 =====
const hasCoverImg = (item: any) =>
  (item.banner && item.banner.includes('://')) || (item.shopImage && item.shopImage.includes('://'));

const isPlatformShop = (item: any) => {
  const name: string = (item.displayName || item.shopName || '').toLowerCase();
  return name.includes('平台') || name.includes('自营') || name.includes('platform');
};

const shopInitials = (item: any) => {
  const name: string = item.displayName || item.shopName || '';
  // 英文取首字母；中文取前2个汉字
  const en = name.match(/[A-Za-z]+/)?.[0] || '';
  if (en.length >= 2) return en.substring(0, 2).toUpperCase();
  const cn = name.replace(/[^一-鿿]/g, '').substring(0, 2);
  return cn || name.substring(0, 2) || 'YX';
};

// 根据 shopId 哈希决定卡片背景渐变色（CSS gradient）
const bgPalette = [
  ['#FF6B00', '#FF9500'],
  ['#667eea', '#764ba2'],
  ['#11998e', '#38ef7d'],
  ['#f7971e', '#ffd200'],
  ['#c0392b', '#e74c3c'],
  ['#1a1a2e', '#16213e'],
  ['#0f3460', '#533483'],
];
const shopGradient = (item: any) => {
  const idx = Number(item.shopId || 0) % bgPalette.length;
  const [c1, c2] = bgPalette[idx];
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
};

// ===== 加载数据 =====
const { loading, tableData, total, pageNum, pageSize, search, doSearch } =
  useListPage(
    (p) => adminShopApi.list({
      pageNum: p.pageNum, pageSize: p.pageSize,
      brandShop: true,
      keyword: p.keyword || undefined,
      status:  p.status  || undefined,
    }),
    { keyword: '', status: '' },
    { pageSize: 12 },
  );

const toggleStatus = async (row: any) => {
  try {
    const newStatus = row.status === BRAND_STATUS.ACTIVE ? 'Inactive' : 'Active';
    await adminShopApi.updateStatus(row.shopId, newStatus);
    row.status = newStatus;
  } catch { ElMessage.error('操作失败'); }
};

// ===== 编辑弹窗 =====
const dialogVisible = ref(false);
const editId = ref<any>(null);
const form = reactive({
  name: '',
  logo: '',
  banner: '',
  description: '',
  isBrandShop: true,
  status: BRAND_STATUS.ACTIVE as string,
});

const openDialog = (row: any) => {
  editId.value = row?.shopId || null;
  if (row) {
    form.name = row.displayName || row.shopName || '';
    form.logo = row.avatar || row.logo || '';
    form.banner = row.banner || row.shopImage || '';
    form.description = row.shopDescription || row.description || '';
    form.isBrandShop = row.brandShop ?? true;
    form.status = row.status ?? 'Active';
  } else {
    Object.assign(form, { name: '', logo: '', banner: '', description: '', isBrandShop: true, status: BRAND_STATUS.ACTIVE });
  }
  dialogVisible.value = true;
};

const save = async () => {
  if (!form.name) { ElMessage.warning('请填写品牌名称'); return; }
  saving.value = true;
  try {
    if (editId.value) {
      // 管理员修改店铺信息（不校验所有权）
      await adminShopApi.adminUpdate(editId.value, {
        displayName: form.name,
        shopName: form.name,
        avatar: form.logo,
        logo: form.logo,
        banner: form.banner,
        shopImage: form.banner,
        shopDescription: form.description,
      });
      // 状态单独更新
      await adminShopApi.updateStatus(editId.value, form.status);
    } else {
      // 暂无创建接口，提示用户通过开店审核流程创建
      ElMessage.info('新品牌请通过开店审核流程创建后在此管理');
      dialogVisible.value = false;
      saving.value = false;
      return;
    }
    ElMessage.success('修改成功');
    dialogVisible.value = false;
    doSearch();
  } finally { saving.value = false; }
};
// useListPage 已在 onMounted 自动加载
</script>
