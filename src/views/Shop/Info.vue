<template>
  <div class="page">
    <!-- 加载中 -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <el-icon class="is-loading text-[28px] text-[#FF6B00]"><i class="ri-loader-4-line"></i></el-icon>
    </div>

    <template v-else-if="shop">
      <!-- 店铺头部卡片 -->
      <div class="bg-white rounded-xl border border-[#F0F0F0] overflow-hidden mb-4">
        <!-- Banner -->
        <div class="relative h-[140px] bg-gradient-to-r from-[#FF6B00] to-[#FFAD5B] overflow-hidden">
          <img v-if="shop.banner || shop.shopImage"
            :src="shop.banner || shop.shopImage"
            class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-black/20"></div>
        </div>

        <!-- Logo + 基本信息 -->
        <div class="px-6 pb-5">
          <div class="flex items-end gap-4 -mt-9 mb-4">
            <div class="w-[72px] h-[72px] rounded-xl border-4 border-white bg-white shadow-md overflow-hidden flex-shrink-0">
              <img v-if="shop.logo || shop.avatar"
                :src="shop.logo || shop.avatar"
                class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center bg-[#FFF4E6]">
                <i class="ri-store-2-line text-[28px] text-[#FF6B00]"></i>
              </div>
            </div>
            <div class="flex-1 min-w-0 pt-9">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[17px] font-bold text-[#1A1A1A]">
                  {{ shop.displayName || shop.shopName }}
                </span>
                <el-tag v-if="shop.isBrandShop" type="warning" size="small" effect="plain">品牌店</el-tag>
                <el-tag :type="statusTagType(shop.status)" size="small" effect="plain">
                  {{ statusText(shop.status) }}
                </el-tag>
              </div>
              <div class="text-[13px] text-[#999] mt-1 line-clamp-1">
                {{ shop.shopDescription || '暂无简介' }}
              </div>
            </div>
            <el-button type="primary" @click="openEdit">
              <i class="ri-edit-2-line mr-1"></i>编辑店铺信息
            </el-button>
          </div>

          <!-- 统计数 -->
          <div class="grid grid-cols-4 gap-4 pt-4 border-t border-[#F5F5F5]">
            <div class="text-center">
              <div class="text-[20px] font-bold text-[#FF6B00]">{{ stats.productCount ?? '—' }}</div>
              <div class="text-[11px] text-[#999] mt-0.5">在售商品</div>
            </div>
            <div class="text-center">
              <div class="text-[20px] font-bold text-[#333]">{{ stats.orderCount ?? '—' }}</div>
              <div class="text-[11px] text-[#999] mt-0.5">历史订单</div>
            </div>
            <div class="text-center">
              <div class="text-[20px] font-bold text-[#333]">{{ stats.reviewCount ?? '—' }}</div>
              <div class="text-[11px] text-[#999] mt-0.5">累计评价</div>
            </div>
            <div class="text-center">
              <div class="text-[20px] font-bold text-[#52C41A]">{{ stats.reviewScore ?? '—' }}</div>
              <div class="text-[11px] text-[#999] mt-0.5">评分</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细信息 -->
      <div class="grid grid-cols-2 gap-4">
        <!-- 基本资料 -->
        <div class="bg-white rounded-xl border border-[#F0F0F0] p-5">
          <div class="flex items-center gap-2 mb-4">
            <i class="ri-store-line text-[#FF6B00]"></i>
            <span class="text-[14px] font-semibold text-[#333]">店铺资料</span>
          </div>
          <div class="space-y-3">
            <InfoRow label="店铺ID">{{ shop.shopId }}</InfoRow>
            <InfoRow label="店铺名称">{{ shop.shopName }}</InfoRow>
            <InfoRow label="显示名称">{{ shop.displayName || shop.shopName }}</InfoRow>
            <InfoRow label="联系手机">{{ shop.phone || '—' }}</InfoRow>
            <InfoRow label="所在地区">{{ shop.location || '—' }}</InfoRow>
            <InfoRow label="商家标签">
              <div class="flex flex-wrap gap-1">
                <template v-if="shop.tags">
                  <el-tag v-for="t in shop.tags.split(',')" :key="t" size="small" effect="plain">{{ t.trim() }}</el-tag>
                </template>
                <span v-else class="text-[#CCC]">—</span>
              </div>
            </InfoRow>
            <InfoRow label="店铺简介">
              <span class="text-[12px] text-[#666] leading-relaxed">{{ shop.shopDescription || '—' }}</span>
            </InfoRow>
          </div>
        </div>

        <!-- 账号信息 -->
        <div class="bg-white rounded-xl border border-[#F0F0F0] p-5">
          <div class="flex items-center gap-2 mb-4">
            <i class="ri-user-settings-line text-[#165DFF]"></i>
            <span class="text-[14px] font-semibold text-[#333]">账号信息</span>
          </div>
          <div class="space-y-3">
            <InfoRow label="店主账号">{{ shop.ownerName || '—' }}</InfoRow>
            <InfoRow label="店主用户ID">{{ shop.ownerUserId || '—' }}</InfoRow>
            <InfoRow label="店铺状态">
              <el-tag :type="statusTagType(shop.status)" size="small" effect="plain">
                {{ statusText(shop.status) }}
              </el-tag>
            </InfoRow>
            <InfoRow label="创建时间">{{ formatTime(shop.createTime) }}</InfoRow>
            <InfoRow label="最后更新">{{ formatTime(shop.updateTime) }}</InfoRow>
          </div>
        </div>
      </div>
    </template>

    <EmptyState v-else icon="ri-store-off-line" tip="店铺信息加载失败，请刷新重试" />

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editVisible" title="编辑店铺信息" width="600px" :destroy-on-close="true">
      <el-form :model="editForm" label-width="90px" size="default" class="space-y-1">
        <el-form-item label="店铺名称">
          <el-input v-model="editForm.shopName" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="显示名称">
          <el-input v-model="editForm.displayName" placeholder="留空则同店铺名称" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="联系手机">
          <el-input v-model="editForm.phone" maxlength="20" />
        </el-form-item>
        <el-form-item label="所在地区">
          <el-input v-model="editForm.location" maxlength="100" />
        </el-form-item>
        <el-form-item label="店铺简介">
          <el-input v-model="editForm.shopDescription" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="Logo">
          <MediaPicker v-model="editForm.logo" :preview-size="72" bizType="shop" />
        </el-form-item>
        <el-form-item label="Banner">
          <MediaPicker v-model="editForm.banner" :preview-size="100" bizType="shop" />
        </el-form-item>
        <el-form-item label="商家标签">
          <el-input v-model="editForm.tags" placeholder="多个标签用逗号分隔，如：正品保证,闪电发货" maxlength="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { userShopStore } from '@/store/index';
import { adminShopApi } from '@/utils/admin-api';
import { SHOP_STATUS } from '@/constants/status';
import { safeFormat } from '@/utils/dateFormat';
import MediaPicker from '@/components/MediaPicker/MediaPicker.vue';
import EmptyState from '@/components/EmptyState.vue';

// 简单的行内描述组件（inline 定义避免新建文件）
import { defineComponent, h } from 'vue';
const InfoRow = defineComponent({
  props: { label: String },
  setup(props, { slots }) {
    return () => h('div', { class: 'flex items-start gap-2 text-[13px]' }, [
      h('span', { class: 'text-[#999] flex-shrink-0 w-[68px] text-right' }, props.label + '：'),
      h('span', { class: 'text-[#333] flex-1 min-w-0' }, slots.default?.()),
    ]);
  },
});

const shopStore = userShopStore();
const loading = ref(false);
const saving = ref(false);
const shop = ref<any>(null);

const stats = reactive({
  productCount: null as number | null,
  orderCount: null as number | null,
  reviewCount: null as number | null,
  reviewScore: null as number | null,
});

const currentShopId = computed(() =>
  shopStore.currentShop?.shopId || shopStore.currentShop?.id
);

const loadShop = async () => {
  if (!currentShopId.value) return;
  loading.value = true;
  try {
    const res: any = await adminShopApi.detail(currentShopId.value);
    shop.value = res.data?.data || res.data || null;
  } catch { /* interceptor handles */ }
  finally { loading.value = false; }
};

const statusText = (s: string) => ({
  [SHOP_STATUS.ACTIVE]:   '正常营业',
  [SHOP_STATUS.INACTIVE]: '待审核',
  Closed: '已注销',
}[s] || s || '未知');

const statusTagType = (s: string): any => ({
  [SHOP_STATUS.ACTIVE]: 'success',
  [SHOP_STATUS.INACTIVE]: 'warning',
  Closed: 'danger',
}[s] || 'info');

const formatTime = (t: string) => safeFormat(t) || '—';

// ===== 编辑 =====
const editVisible = ref(false);
const editForm = reactive({
  shopName: '',
  displayName: '',
  phone: '',
  location: '',
  shopDescription: '',
  logo: '',
  banner: '',
  tags: '',
});

const openEdit = () => {
  const s = shop.value;
  editForm.shopName = s.shopName || '';
  editForm.displayName = s.displayName || '';
  editForm.phone = s.phone || '';
  editForm.location = s.location || '';
  editForm.shopDescription = s.shopDescription || '';
  editForm.logo = s.logo || s.avatar || '';
  editForm.banner = s.banner || '';
  editForm.tags = s.tags || '';
  editVisible.value = true;
};

const saveEdit = async () => {
  if (!editForm.shopName.trim()) { ElMessage.warning('店铺名称不能为空'); return; }
  saving.value = true;
  try {
    await adminShopApi.updateOwn(currentShopId.value, { ...editForm });
    ElMessage.success('店铺信息已更新');
    editVisible.value = false;
    await loadShop();
  } catch { /* interceptor handles */ }
  finally { saving.value = false; }
};

onMounted(loadShop);
</script>
