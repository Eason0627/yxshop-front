<template>
  <div class="page">
    <!-- 搜索栏 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="商品名称/ID" class="!w-[200px]"
          clearable @clear="doSearch" @keyup.enter="doSearch" />

        <!-- 审核状态 Tab -->
        <el-radio-group v-model="search.auditStatus" @change="doSearch">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="Pending">
            <span class="flex items-center gap-1">
              待审核
              <span v-if="pendingCount > 0"
                class="inline-flex items-center justify-center min-w-[16px] h-[16px] px-[3px] rounded-full bg-[#F56C6C] text-white text-[10px] font-medium leading-none">
                {{ pendingCount }}
              </span>
            </span>
          </el-radio-button>
          <el-radio-button value="Approved">已通过</el-radio-button>
          <el-radio-button value="Rejected">已拒绝</el-radio-button>
          <el-radio-button value="Draft">草稿</el-radio-button>
        </el-radio-group>

        <el-button type="primary" @click="doSearch">
          <i class="ri-search-line mr-1"></i>搜索
        </el-button>
        <el-button @click="resetSearch">
          <i class="ri-refresh-line mr-1"></i>重置
        </el-button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe>
        <el-table-column label="商品" min-width="240">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <img :src="row.mainImage || row.image" class="w-12 h-12 rounded-lg object-cover bg-[#F5F5F5] flex-shrink-0" />
              <div class="min-w-0">
                <div class="text-[13px] font-medium text-[#333] truncate max-w-[160px]">{{ row.name }}</div>
                <div class="text-[11px] text-[#999] mt-0.5">ID: {{ row.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="价格" width="100">
          <template #default="{ row }">
            <span class="text-[#FF6B00] font-medium">¥{{ row.price }}</span>
          </template>
        </el-table-column>

        <el-table-column label="库存" width="80">
          <template #default="{ row }">{{ row.stock }}</template>
        </el-table-column>

        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="auditTagType(row.auditStatus)" size="small">{{ auditText(row.auditStatus) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="审核意见" min-width="140">
          <template #default="{ row }">
            <span class="text-[12px] text-[#999]">{{ row.auditReason || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">
            <span class="text-[12px] text-[#666]">{{ safeFormat(row.updatedAt || row.createTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetail(row)">查看</el-button>
            <template v-if="row.auditStatus === AUDIT_STATUS.PENDING">
              <el-button type="success" link size="small" @click="doReview(row, true)">通过</el-button>
              <el-button type="danger" link size="small" @click="openReject(row)">拒绝</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end p-4">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="doSearch"
        />
      </div>
    </div>

    <!-- 拒绝弹窗 -->
    <el-dialog v-model="rejectVisible" title="拒绝理由" width="400px" :destroy-on-close="true">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        placeholder="请输入拒绝原因（将展示给商家）"
        maxlength="200"
        show-word-limit
      />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="reviewing" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>

    <!-- 商品详情抽屉 -->
    <el-drawer v-model="detailVisible" title="商品详情" size="540px" :destroy-on-close="true"
      :with-header="true" class="product-review-drawer">
      <!-- 可滚动内容区 -->
      <div class="h-full overflow-y-auto px-1 pb-4">
        <div v-if="detailLoading" class="flex items-center justify-center h-40 text-[#999]">加载中...</div>
        <div v-else-if="currentProduct" class="space-y-3">

          <!-- 主图（可点击预览） -->
          <el-image
            :src="currentProduct.mainImage || currentProduct.image"
            class="w-full max-h-[220px] rounded-xl border border-[#F0F0F0] overflow-hidden"
            fit="cover"
            :preview-src-list="[currentProduct.mainImage || currentProduct.image, ...(currentProduct.imagesArr || [])]"
            :initial-index="0"
            preview-teleported
          />

          <!-- 基本信息 -->
          <div class="bg-[#FAFAFA] rounded-xl p-4 space-y-2">
            <div class="text-[15px] font-bold text-[#333]">{{ currentProduct.name }}</div>
            <div v-if="currentProduct.subtitle" class="text-[12px] text-[#999]">{{ currentProduct.subtitle }}</div>
            <div class="flex flex-wrap gap-2 pt-1">
              <el-tag v-if="currentProduct.categoryName" size="small" effect="plain" type="info">
                <i class="ri-price-tag-3-line mr-0.5"></i>{{ currentProduct.categoryName }}
              </el-tag>
              <el-tag v-if="currentProduct.shopName" size="small" effect="plain" type="warning">
                <i class="ri-store-2-line mr-0.5"></i>{{ currentProduct.shopName }}
              </el-tag>
            </div>
          </div>

          <!-- 价格/库存/审核 -->
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-[#FAFAFA] rounded-xl p-3 text-center">
              <div class="text-lg font-bold text-[#FF6B00]">¥{{ currentProduct.price }}</div>
              <div class="text-[11px] text-[#999] mt-0.5">售价</div>
            </div>
            <div class="bg-[#FAFAFA] rounded-xl p-3 text-center">
              <div class="text-lg font-bold text-[#333]">{{ currentProduct.stock }}</div>
              <div class="text-[11px] text-[#999] mt-0.5">库存</div>
            </div>
            <div class="bg-[#FAFAFA] rounded-xl p-3 text-center">
              <el-tag :type="auditTagType(currentProduct.auditStatus)" size="small">{{ auditText(currentProduct.auditStatus) }}</el-tag>
              <div class="text-[11px] text-[#999] mt-0.5">审核状态</div>
            </div>
          </div>

          <!-- 轮播图（可点击预览） -->
          <div v-if="currentProduct.imagesArr?.length" class="bg-[#FAFAFA] rounded-xl p-4">
            <div class="text-[13px] font-semibold text-[#333] mb-3">
              商品轮播图（{{ currentProduct.imagesArr.length }} 张）
            </div>
            <div class="grid grid-cols-4 gap-2">
              <el-image
                v-for="(img, i) in currentProduct.imagesArr" :key="i"
                :src="img"
                class="w-full aspect-square rounded-lg border border-[#F0F0F0] overflow-hidden cursor-pointer"
                fit="cover"
                :preview-src-list="currentProduct.imagesArr"
                :initial-index="i"
                preview-teleported
                @error="(e: any) => e.target && (e.target.style.opacity = 0.3)"
              />
            </div>
          </div>

          <!-- 商品规格 SKU -->
          <div v-if="parsedSpecs(currentProduct.specs)" class="bg-[#FAFAFA] rounded-xl p-4">
            <div class="text-[13px] font-semibold text-[#333] mb-2">商品规格</div>
            <table class="w-full text-[12px]">
              <thead>
                <tr class="text-[#999] border-b border-[#ECECEC]">
                  <th class="text-left py-1.5 font-normal">规格</th>
                  <th class="text-right py-1.5 font-normal">售价</th>
                  <th class="text-right py-1.5 font-normal">原价</th>
                  <th class="text-right py-1.5 font-normal">库存</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sku in parsedSpecs(currentProduct.specs)" :key="sku.specKey || sku.specLabel"
                  class="border-b border-[#F5F5F5] last:border-0">
                  <td class="py-1.5 text-[#555]">{{ sku.specLabel || sku.specKey || '默认' }}</td>
                  <td class="py-1.5 text-right text-[#FF6B00] font-medium">¥{{ sku.price }}</td>
                  <td class="py-1.5 text-right text-[#CCC] line-through">{{ sku.originalPrice ? '¥'+sku.originalPrice : '—' }}</td>
                  <td class="py-1.5 text-right text-[#999]">{{ sku.stock }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 商品卖点 -->
          <div v-if="parsedFeatures(currentProduct.features).length" class="bg-[#FAFAFA] rounded-xl p-4">
            <div class="text-[13px] font-semibold text-[#333] mb-2">商品卖点</div>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="(feat, i) in parsedFeatures(currentProduct.features)" :key="i"
                class="px-2 py-0.5 rounded-full bg-[#FFF3E0] text-[#FF6B00] text-[11px]">{{ feat }}</span>
            </div>
          </div>

          <!-- 详情内容：区分 JSON block 格式与 HTML 富文本 -->
          <template v-if="currentProduct.description && currentProduct.description.trim() !== '<p><br></p>'">
            <!-- JSON block 格式（app 编辑器产出） -->
            <div v-if="!isHtmlDesc(currentProduct.description)" class="bg-[#FAFAFA] rounded-xl p-4">
              <div class="text-[13px] font-semibold text-[#333] mb-2">商品详情</div>
              <div class="space-y-2">
                <template v-for="(block, bi) in parseDescBlocks(currentProduct.description)" :key="bi">
                  <p v-if="block.type === 'text'" class="text-[12px] text-[#555] leading-relaxed whitespace-pre-line">{{ block.content }}</p>
                  <img v-else-if="block.type === 'image'" :src="block.content"
                    class="w-full rounded-lg bg-[#F5F5F5] block" loading="lazy" />
                </template>
              </div>
            </div>
            <!-- HTML 富文本格式（wangeditor 产出，自带结构与标题，直接渲染） -->
            <div v-else class="bg-[#FAFAFA] rounded-xl p-4 product-detail-html">
              <div class="text-[12px] text-[#555] leading-relaxed" v-html="currentProduct.description" />
            </div>
          </template>

        </div>
      </div>

      <!-- 固定底部操作 -->
      <template #footer>
        <div v-if="currentProduct?.auditStatus === AUDIT_STATUS.PENDING" class="flex gap-3">
          <el-button type="success" class="flex-1" :loading="reviewing"
            @click="doReview(currentProduct, true); detailVisible = false">
            <i class="ri-checkbox-circle-line mr-1"></i>通过审核
          </el-button>
          <el-button type="danger" class="flex-1"
            @click="detailVisible = false; openReject(currentProduct)">
            <i class="ri-close-circle-line mr-1"></i>拒绝
          </el-button>
        </div>
        <div v-else class="flex justify-end">
          <el-button @click="detailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { adminProductApi } from '@/utils/admin-api';
import { useListPage } from '@/composables/useListPage';
import { AUDIT_STATUS, AUDIT_STATUS_LABEL, AUDIT_STATUS_TAG } from '@/constants/status';
import { safeFormat } from '@/utils/dateFormat';

const reviewing = ref(false);
const pendingCount = ref(0);

const auditText = (s: string) => AUDIT_STATUS_LABEL[s] || s || '—';
const auditTagType = (s: string): any => AUDIT_STATUS_TAG[s] || 'info';

const isHtmlDesc = (desc: string): boolean => /<[a-z][\s\S]*>/i.test(desc);

const parseDescBlocks = (desc: string): Array<{type: 'text'|'image', content: string}> => {
  if (!desc) return [];
  try {
    const parsed = JSON.parse(desc);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].type === 'string') {
      return parsed.filter((b: any) => b.content).map((b: any) => ({
        type: b.type === 'image' ? 'image' : 'text',
        content: String(b.content),
      }));
    }
  } catch { /* not JSON */ }
  return desc.trim() ? [{ type: 'text', content: desc }] : [];
};

const parsedFeatures = (features: string | null): string[] => {
  if (!features) return [];
  try { const arr = JSON.parse(features); return Array.isArray(arr) ? arr.filter(Boolean) : []; }
  catch { return features.split(',').map((s: string) => s.trim()).filter(Boolean); }
};

const parsedSpecs = (specs: string | null): any[] | null => {
  if (!specs) return null;
  try {
    const obj = JSON.parse(specs);
    if (obj?.skus?.length) return obj.skus.filter((s: any) => s.enabled !== false);
    return null;
  } catch { return null; }
};

const { loading, tableData, total, pageNum, pageSize, search, doSearch, resetSearch } =
  useListPage(
    (p) => adminProductApi.list({
      pageNum: p.pageNum, pageSize: p.pageSize,
      keyword:     p.keyword     || undefined,
      auditStatus: p.auditStatus || undefined,
    }),
    { keyword: '', auditStatus: AUDIT_STATUS.PENDING },
  );

const loadPendingCount = async () => {
  try {
    const res: any = await adminProductApi.list({ pageNum: 1, pageSize: 1, auditStatus: AUDIT_STATUS.PENDING });
    const data = (res as any).data?.data || (res as any).data || {};
    pendingCount.value = data.total || 0;
  } catch { /* ignore pending badge on error */ }
};

// 审核
const rejectVisible = ref(false);
const rejectReason = ref('');
const rejectTarget = ref<any>(null);

const doReview = async (row: any, approved: boolean, reason?: string) => {
  reviewing.value = true;
  try {
    await adminProductApi.review({ productId: row.id, approved, reason });
    row.auditStatus = approved ? AUDIT_STATUS.APPROVED : AUDIT_STATUS.REJECTED;
    if (!approved) row.auditReason = reason;
    ElMessage.success(approved ? '已通过审核' : '已拒绝');
    if (approved) pendingCount.value = Math.max(0, pendingCount.value - 1);
  } catch { /* interceptor handles */ } finally { reviewing.value = false; }
};

const openReject = (row: any) => {
  rejectTarget.value = row;
  rejectReason.value = '';
  rejectVisible.value = true;
};

const confirmReject = async () => {
  if (!rejectReason.value.trim()) { ElMessage.warning('请填写拒绝原因'); return; }
  await doReview(rejectTarget.value, false, rejectReason.value);
  rejectVisible.value = false;
};

// 详情抽屉
const detailVisible = ref(false);
const detailLoading = ref(false);
const currentProduct = ref<any>(null);

const openDetail = async (row: any) => {
  detailVisible.value = true;
  detailLoading.value = true;
  currentProduct.value = null;
  try {
    const res: any = await adminProductApi.detail(row.id);
    const product = res.data?.data || res.data || row;
    // images 后端返回逗号分隔字符串，转成数组才能 v-for
    if (typeof product.images === 'string' && product.images) {
      product.imagesArr = product.images.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else {
      product.imagesArr = Array.isArray(product.images) ? product.images : [];
    }
    currentProduct.value = product;
  } catch {
    currentProduct.value = { ...row, imagesArr: [] };
  }
  detailLoading.value = false;
};

onMounted(() => loadPendingCount()); // useListPage 已自动加载列表
</script>
