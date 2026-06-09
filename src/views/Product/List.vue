<template>
  <div class="page">
    <!-- 搜索栏 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input
          v-model="search.keyword"
          placeholder="搜索商品名称 / ID"
          class="!w-[220px]"
          clearable
          @clear="doSearch"
          @keyup.enter="doSearch"
        >
          <template #prefix><i class="ri-search-line text-[#CCC]"></i></template>
        </el-input>

        <el-cascader
          v-model="search.categoryId"
          :options="categoryTree"
          :props="{ value: 'categoryId', label: 'categoryName', children: 'children', checkStrictly: true, emitPath: false }"
          placeholder="全部分类"
          class="!w-[150px]"
          clearable
          @change="doSearch"
        />

        <el-select v-model="search.status" placeholder="上架状态" class="!w-[110px]" clearable @change="doSearch">
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
        </el-select>

        <el-select v-model="search.auditStatus" placeholder="审核状态" class="!w-[110px]" clearable @change="doSearch">
          <el-option label="草稿" value="Draft" />
          <el-option label="待审核" value="Pending" />
          <el-option label="已通过" value="Approved" />
          <el-option label="已拒绝" value="Rejected" />
        </el-select>

        <el-select v-model="search.sortBy" placeholder="排序" class="!w-[120px]" clearable @change="doSearch">
          <el-option label="最新上架" value="createTime_desc" />
          <el-option label="销量最高" value="sales_desc" />
          <el-option label="价格升序" value="price_asc" />
          <el-option label="价格降序" value="price_desc" />
        </el-select>

        <!-- Admin：店铺筛选下拉 -->
        <ShopFilterSelect
          v-if="can('product:filter-shop')"
          v-model="search.shopId"
          @change="doSearch"
        />

        <el-button @click="doResetSearch"><i class="ri-refresh-line"></i></el-button>
        <div class="flex-1"></div>
        <el-button type="primary" @click="$router.push('/product/publish')">
          <i class="ri-add-line mr-1"></i>发布商品
        </el-button>
      </div>

      <!-- ShopOwner：当前店铺提示 -->
      <div v-if="!isAdmin && currentShop" class="mt-3 flex items-center gap-1.5 text-[12px] text-[#666]">
        <i class="ri-store-2-line text-[#409EFF]"></i>
        当前展示店铺 <b class="text-[#409EFF]">{{ currentShop.displayName || currentShop.shopName }}</b>
        的商品
      </div>
    </div>

    <!-- 表格 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] overflow-hidden">
      <el-table
        :data="tableData"
        v-loading="loading"
        style="width: 100%"
        :header-cell-style="{ background: '#FAFAFA', color: '#666', fontSize: '12px', fontWeight: '500' }"
      >
        <el-table-column label="商品" min-width="260">
          <template #default="{ row }">
            <div class="flex items-center gap-3 py-1">
              <img :src="row.mainImage || row.image" class="w-11 h-11 rounded-lg object-cover bg-[#F5F5F5] flex-shrink-0" />
              <div class="min-w-0">
                <div class="text-[13px] font-medium text-[#222] leading-[1.4] line-clamp-2">{{ row.name }}</div>
                <div class="text-[11px] text-[#BFBFBF] mt-0.5">ID: {{ row.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分类" width="90" align="center">
          <template #default="{ row }">
            <span class="text-[12px] text-[#666]">{{ row.categoryName || getCategoryName(row.categoryId) || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="店铺" width="100" align="center">
          <template #default="{ row }">
            <span class="text-[12px] text-[#555]">{{ row.shopName || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="价格" width="110" align="center">
          <template #default="{ row }">
            <div class="text-[#FF6B00] font-semibold text-[13px]">¥{{ row.price }}</div>
            <div v-if="row.originalPrice && row.originalPrice > row.price" class="text-[11px] text-[#CCC] line-through">¥{{ row.originalPrice }}</div>
          </template>
        </el-table-column>

        <el-table-column label="库存" width="70" align="center">
          <template #default="{ row }">
            <span class="text-[13px] font-medium"
              :class="row.stock === 0 ? 'text-[#FF4D4F]' : row.stock <= 10 ? 'text-[#FA8C16]' : 'text-[#333]'">
              {{ row.stock }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="销量" width="70" align="center">
          <template #default="{ row }">
            <span class="text-[13px] text-[#555]">{{ row.sales || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <div class="flex flex-col items-center gap-1">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small" effect="plain">
                {{ row.status === 1 ? '上架' : '下架' }}
              </el-tag>
              <el-tag :type="auditTagType(row.auditStatus)" size="small" effect="plain">
                {{ auditText(row.auditStatus) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openViewDetail(row)">查看</el-button>
            <el-divider direction="vertical" class="!mx-0.5" />
            <el-button v-if="can('product:edit')" type="primary" link size="small" @click="$router.push(`/product/publish?id=${row.id}`)">编辑</el-button>
            <template v-if="can('product:edit')">
              <el-divider direction="vertical" class="!mx-0.5" />
            </template>
            <el-tooltip
              v-if="row.status !== 1 && !isAdmin && row.auditStatus !== 'Approved'"
              content="商品未审核通过，无法上架"
              placement="top"
            >
              <el-button type="info" link size="small" disabled>上架</el-button>
            </el-tooltip>
            <el-button v-else :type="row.status === 1 ? 'warning' : 'success'" link size="small" @click="toggleStatus(row)">
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <template v-if="can('product:force-delist')">
              <el-divider direction="vertical" class="!mx-0.5" />
              <el-button type="danger" link size="small" @click="forceDelistProduct(row)">强制下架</el-button>
            </template>
            <template v-if="can('product:delete')">
              <el-divider direction="vertical" class="!mx-0.5" />
              <el-button type="danger" link size="small" @click="deleteProduct(row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex items-center justify-between px-4 py-3 border-t border-[#F0F0F0]">
        <span class="text-[12px] text-[#999]">共 {{ total }} 件商品</span>
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next, jumper"
          background small
          @current-change="doSearch"
          @size-change="doSearch"
        />
      </div>
    </div>

    <!-- ===== 商品详情查看弹窗 ===== -->
    <el-dialog v-model="viewDetailVisible" title="商品详情" width="560px" :destroy-on-close="true">
      <div v-if="viewDetailLoading" class="flex items-center justify-center h-40 text-[#999]">加载中...</div>
      <div v-else-if="viewDetailProduct" class="space-y-3 max-h-[70vh] overflow-y-auto pr-1">

        <!-- 主图 -->
        <el-image
          :src="viewDetailProduct.mainImage || viewDetailProduct.image"
          class="w-full max-h-[220px] rounded-xl border border-[#F0F0F0] overflow-hidden"
          fit="cover"
          :preview-src-list="[viewDetailProduct.mainImage || viewDetailProduct.image, ...(viewDetailProduct.imagesArr || [])]"
          :initial-index="0"
          preview-teleported
        />

        <!-- 基本信息 -->
        <div class="bg-[#FAFAFA] rounded-xl p-4 space-y-2">
          <div class="text-[15px] font-bold text-[#333]">{{ viewDetailProduct.name }}</div>
          <div v-if="viewDetailProduct.subtitle" class="text-[12px] text-[#999]">{{ viewDetailProduct.subtitle }}</div>
          <div class="flex flex-wrap gap-2 pt-1">
            <el-tag v-if="viewDetailProduct.categoryName" size="small" effect="plain" type="info">
              <i class="ri-price-tag-3-line mr-0.5"></i>{{ viewDetailProduct.categoryName }}
            </el-tag>
            <el-tag v-if="viewDetailProduct.shopName" size="small" effect="plain" type="warning">
              <i class="ri-store-2-line mr-0.5"></i>{{ viewDetailProduct.shopName }}
            </el-tag>
          </div>
        </div>

        <!-- 价格/库存/状态 -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-[#FAFAFA] rounded-xl p-3 text-center">
            <div class="text-lg font-bold text-[#FF6B00]">¥{{ viewDetailProduct.price }}</div>
            <div class="text-[11px] text-[#999] mt-0.5">售价</div>
          </div>
          <div class="bg-[#FAFAFA] rounded-xl p-3 text-center">
            <div class="text-lg font-bold text-[#333]">{{ viewDetailProduct.stock }}</div>
            <div class="text-[11px] text-[#999] mt-0.5">库存</div>
          </div>
          <div class="bg-[#FAFAFA] rounded-xl p-3 text-center">
            <el-tag :type="auditTagType(viewDetailProduct.auditStatus)" size="small">{{ auditText(viewDetailProduct.auditStatus) }}</el-tag>
            <div class="text-[11px] text-[#999] mt-0.5">审核状态</div>
          </div>
        </div>

        <!-- 轮播图 -->
        <div v-if="viewDetailProduct.imagesArr?.length" class="bg-[#FAFAFA] rounded-xl p-4">
          <div class="text-[13px] font-semibold text-[#333] mb-3">
            商品轮播图（{{ viewDetailProduct.imagesArr.length }} 张）
          </div>
          <div class="grid grid-cols-4 gap-2">
            <el-image
              v-for="(img, i) in viewDetailProduct.imagesArr" :key="i"
              :src="img"
              class="w-full aspect-square rounded-lg border border-[#F0F0F0] overflow-hidden cursor-pointer"
              fit="cover"
              :preview-src-list="viewDetailProduct.imagesArr"
              :initial-index="i"
              preview-teleported
            />
          </div>
        </div>

        <!-- 商品规格 -->
        <div v-if="vdParsedSpecs" class="bg-[#FAFAFA] rounded-xl p-4">
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
              <tr v-for="sku in vdParsedSpecs" :key="sku.specKey || sku.specLabel"
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
        <div v-if="vdParsedFeatures.length" class="bg-[#FAFAFA] rounded-xl p-4">
          <div class="text-[13px] font-semibold text-[#333] mb-2">商品卖点</div>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="(feat, fi) in vdParsedFeatures" :key="fi"
              class="px-2 py-0.5 rounded-full bg-[#FFF3E0] text-[#FF6B00] text-[11px]">{{ feat }}</span>
          </div>
        </div>

        <!-- 详情内容：区分 JSON block 与 HTML 富文本 -->
        <template v-if="viewDetailProduct.description && viewDetailProduct.description.trim() !== '<p><br></p>'">
          <div v-if="!isHtmlDesc(viewDetailProduct.description)" class="bg-[#FAFAFA] rounded-xl p-4">
            <div class="text-[13px] font-semibold text-[#333] mb-2">商品详情</div>
            <div class="space-y-2">
              <template v-for="(block, bi) in parseDescBlocks(viewDetailProduct.description)" :key="bi">
                <p v-if="block.type === 'text'" class="text-[12px] text-[#555] leading-relaxed whitespace-pre-line">{{ block.content }}</p>
                <img v-else-if="block.type === 'image'" :src="block.content"
                  class="w-full rounded-lg bg-[#F5F5F5] block" loading="lazy" />
              </template>
            </div>
          </div>
          <div v-else class="bg-[#FAFAFA] rounded-xl p-4 product-detail-html">
            <div class="text-[12px] text-[#555] leading-relaxed" v-html="viewDetailProduct.description" />
          </div>
        </template>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <el-button v-if="can('product:edit')" link size="small"
            @click="viewDetailVisible = false; $router.push(`/product/publish?id=${viewDetailProduct?.id}`)">
            <i class="ri-edit-2-line mr-1"></i>进入编辑页
          </el-button>
          <div v-else></div>
          <el-button @click="viewDetailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ===== 编辑弹窗 ===== -->
    <el-dialog
      v-model="editVisible"
      :title="`编辑商品`"
      width="780px"
      :destroy-on-close="true"
      class="edit-dialog"
    >
      <div v-loading="editLoading" class="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

        <!-- 分组1：基本信息 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-information-line mr-1.5 text-[#409EFF]"></i>基本信息</span>
          </div>
          <div class="p-4">
            <el-form :model="editForm" label-width="80px" size="default">
              <el-form-item label="商品名称" required>
                <el-input v-model="editForm.name" maxlength="60" show-word-limit />
              </el-form-item>
              <div class="grid grid-cols-2 gap-3">
                <el-form-item label="商品分类" required>
                  <el-cascader
                    v-model="editForm.categoryId"
                    :options="categoryTree"
                    :props="{ value: 'categoryId', label: 'categoryName', children: 'children', checkStrictly: true, emitPath: false }"
                    class="w-full" clearable
                  />
                </el-form-item>
                <el-form-item label="所属店铺">
                  <el-select v-model="editForm.shopId" class="w-full" clearable filterable>
                    <el-option v-for="s in shops" :key="s.shopId || s.id" :label="s.displayName || s.shopName" :value="s.shopId || s.id" />
                  </el-select>
                </el-form-item>
              </div>
              <el-form-item label="商品简介">
                <el-input v-model="editForm.subtitle" type="textarea" :rows="2" maxlength="200" show-word-limit />
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 分组2：价�?& 库存 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-price-tag-3-line mr-1.5 text-[#52C41A]"></i>价格 & 库存</span>
          </div>
          <div class="p-4">
            <el-form :model="editForm" label-width="80px" size="default">
              <div class="grid grid-cols-3 gap-3">
                <el-form-item label="售价" required>
                  <el-input-number v-model="editForm.price" :min="0" :precision="2" class="w-full" />
                </el-form-item>
                <el-form-item label="原价">
                  <el-input-number v-model="editForm.originalPrice" :min="0" :precision="2" class="w-full" />
                </el-form-item>
                <el-form-item label="库存" required>
                  <el-input-number v-model="editForm.stock" :min="0" class="w-full" />
                </el-form-item>
              </div>
            </el-form>
          </div>
        </div>

        <!-- 分组3：商品图片 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-image-line mr-1.5 text-[#FA8C16]"></i>商品图片</span>
          </div>
          <div class="p-4">
            <el-form :model="editForm" label-width="80px" size="default">
              <el-form-item label="主图" required>
                <MediaPicker v-model="editForm.mainImage" :preview-size="88" bizType="product" />
              </el-form-item>
              <el-form-item label="轮播图">
                <MediaPicker v-model="editForm.images" :multiple="true" :preview-size="72" bizType="product" />
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 分组4：商品标签 & 发布设置 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-settings-3-line mr-1.5 text-[#722ED1]"></i>标签 & 设置</span>
          </div>
          <div class="p-4">
            <el-form :model="editForm" label-width="80px" size="default">
              <div class="grid grid-cols-2 gap-3">
                <el-form-item label="标签文字">
                  <el-input v-model="editForm.tag" placeholder="新品、热销等" maxlength="6" />
                </el-form-item>
                <el-form-item label="上架状态">
                  <el-switch v-model="editForm.status" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" />
                </el-form-item>
              </div>
              <div v-if="editForm.tag" class="grid grid-cols-2 gap-3">
                <el-form-item label="文字颜色">
                  <div class="flex items-center gap-2">
                    <el-color-picker v-model="editForm.tagColor" size="small" />
                    <el-input v-model="editForm.tagColor" class="flex-1" placeholder="#FFFFFF" />
                  </div>
                </el-form-item>
                <el-form-item label="背景颜色">
                  <div class="flex items-center gap-2">
                    <el-color-picker v-model="editForm.tagBg" size="small" />
                    <el-input v-model="editForm.tagBg" class="flex-1" placeholder="#FF4D4F" />
                  </div>
                </el-form-item>
              </div>
              <!-- 标签预览 -->
              <div v-if="editForm.tag" class="mt-1 flex items-center gap-2">
                <span class="text-[11px] text-[#999]">预览：</span>
                <span class="px-2 py-0.5 rounded text-[11px]"
                  :style="{ color: editForm.tagColor || '#fff', backgroundColor: editForm.tagBg || '#FF4D4F' }">
                  {{ editForm.tag }}
                </span>
              </div>
            </el-form>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <el-button link size="small" @click="$router.push(`/product/publish?id=${editForm.id}`)">
            <i class="ri-edit-2-line mr-1"></i>进入完整编辑页
          </el-button>
          <div class="flex gap-2">
            <el-button @click="editVisible = false">取消</el-button>
            <el-button type="primary" :loading="editSaving" @click="saveEdit">保存修改</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { adminProductApi, adminShopApi } from '@/utils/admin-api';
import { userShopStore } from '@/store/index';
import MediaPicker from '@/components/MediaPicker/MediaPicker.vue';
import ShopFilterSelect from '@/components/ShopFilterSelect.vue';
import { usePermission } from '@/utils/permission';
import { useListPage } from '@/composables/useListPage';

const { can, isAdmin } = usePermission();
const shopStore = userShopStore();
const currentShop = computed(() => shopStore.currentShop);

const categoryTree = ref<any[]>([]);
const flatCategories = ref<any[]>([]);
const shops = ref<any[]>([]);

// useListPage — immediate:false，由下方 watch 在 shopId 就绪后触发首次加载
const { loading, tableData, total, pageNum, pageSize, search, doSearch } =
  useListPage(
    (p) => adminProductApi.list({
      pageNum: p.pageNum, pageSize: p.pageSize,
      keyword:     p.keyword     || undefined,
      categoryId:  p.categoryId  || undefined,
      shopId:      p.shopId      || undefined,
      status:      p.status      ?? undefined,
      auditStatus: p.auditStatus || undefined,
      ...(p.sortBy ? (() => { const [f, o] = (p.sortBy as string).split('_'); return { sortField: f, sortOrder: o }; })() : {}),
    }),
    { keyword: '', categoryId: null as number|null, shopId: null as number|null,
      status: null as number|null, auditStatus: '', sortBy: '' },
    { immediate: false },
  );

// ShopOwner：监听全局店铺切换，自动注入 shopId；Admin：search.shopId 由筛选下拉手动控制
watch(() => shopStore.currentShop, (shop) => {
  if (!isAdmin) {
    search.shopId = shop?.shopId || shop?.id || null;
  }
  doSearch();
}, { immediate: true });

const flattenTree = (arr: any[]): any[] =>
  arr.flatMap(c => [
    { categoryId: c.categoryId, categoryName: c.categoryName },
    ...(c.children?.length ? flattenTree(c.children) : []),
  ]);

const loadCategories = async () => {
  try {
    const res: any = await adminProductApi.categories();
    const raw = res.data?.data || res.data || [];
    categoryTree.value = Array.isArray(raw) ? raw : [];
    flatCategories.value = flattenTree(categoryTree.value);
  } catch { /* interceptor handles */ }
};

const loadShops = async () => {
  try {
    const res: any = await adminShopApi.list({ pageNum: 1, pageSize: 100 });
    const data = res.data?.data || res.data || {};
    shops.value = Array.isArray(data) ? data : (data.records || []);
  } catch { /* interceptor handles */ }
};

const getCategoryName = (id: number) => {
  const c = flatCategories.value.find((c: any) => c.categoryId === id);
  return c?.categoryName || '';
};

const auditText = (s: string) =>
  ({ Draft: '草稿', Pending: '待审核', Approved: '已通过', Rejected: '已拒绝' }[s] || s || '—');
const auditTagType = (s: string): any =>
  ({ Draft: 'info', Pending: 'warning', Approved: 'success', Rejected: 'danger' }[s] || 'info');

// ===== 详情查看弹窗 =====
const viewDetailVisible = ref(false);
const viewDetailLoading = ref(false);
const viewDetailProduct = ref<any>(null);

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

const vdParsedFeatures = computed<string[]>(() => {
  const f = viewDetailProduct.value?.features;
  if (!f) return [];
  try { const arr = JSON.parse(f); return Array.isArray(arr) ? arr.filter(Boolean) : []; }
  catch { return String(f).split(',').map((s: string) => s.trim()).filter(Boolean); }
});

const vdParsedSpecs = computed<any[] | null>(() => {
  const s = viewDetailProduct.value?.specs;
  if (!s) return null;
  try {
    const obj = JSON.parse(s);
    if (obj?.skus?.length) return obj.skus.filter((sk: any) => sk.enabled !== false);
    return null;
  } catch { return null; }
});

const openViewDetail = async (row: any) => {
  viewDetailVisible.value = true;
  viewDetailLoading.value = true;
  viewDetailProduct.value = null;
  try {
    const res: any = await adminProductApi.detail(row.id);
    const p = res.data?.data || res.data || row;
    if (typeof p.images === 'string' && p.images) {
      p.imagesArr = p.images.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else {
      p.imagesArr = Array.isArray(p.images) ? p.images : [];
    }
    viewDetailProduct.value = p;
  } catch {
    const r = { ...row, imagesArr: [] };
    viewDetailProduct.value = r;
  }
  viewDetailLoading.value = false;
};

const toggleStatus = async (row: any) => {
  const newStatus = row.status === 1 ? 0 : 1;
  // 非管理员不能手动上架未审核通过的商品
  if (newStatus === 1 && !isAdmin && row.auditStatus !== 'Approved') {
    ElMessage.warning('商品尚未通过审核，无法上架。请等待管理员审核通过后再操作。');
    return;
  }
  try {
    await adminProductApi.updateStatus(row.id, newStatus);
    row.status = newStatus;
    ElMessage.success(newStatus === 1 ? '商品已上架' : '商品已下架');
  } catch { ElMessage.error('操作失败'); }
};

const deleteProduct = async (row: any) => {
  if (!can('product:delete')) { ElMessage.warning('无权删除'); return; }
  try {
    const { ElMessageBox } = await import('element-plus');
    await ElMessageBox.confirm(`确定删除商品「${row.name}」？此操作不可恢复。`, '删除确认', { type: 'warning' });
    await adminProductApi.delete(row.id);
    ElMessage.success('已删除');
    doSearch();
  } catch { /* cancelled or interceptor handles */ }
};

const forceDelistProduct = async (row: any) => {
  try {
    const { ElMessageBox } = await import('element-plus');
    await ElMessageBox.confirm(`强制下架商品「${row.name}」？商家将被通知。`, '强制下架', { type: 'warning', confirmButtonText: '确认下架' });
    await adminProductApi.updateStatus(row.id, 0);
    row.status = 0;
    ElMessage.success('已强制下架');
  } catch { /* cancelled or interceptor handles */ }
};

const doResetSearch = () => {
  search.keyword = '';
  search.categoryId = null;
  search.status = null;
  search.auditStatus = '';
  search.sortBy = '';
  // ShopOwner 重置后保留本店过滤；Admin 清空筛选
  search.shopId = isAdmin ? null : (currentShop.value?.shopId || currentShop.value?.id || null);
  doSearch();
};

// ===== 编辑弹窗 =====
const editVisible = ref(false);
const editLoading = ref(false);
const editSaving = ref(false);
const editForm = reactive({
  id: null as any,
  name: '',
  categoryId: null as number | null,
  shopId: null as number | null,
  subtitle: '',
  price: 0,
  originalPrice: 0,
  stock: 0,
  mainImage: '',
  images: [] as string[],
  tag: '',
  tagColor: '#FFFFFF',
  tagBg: '#FF4D4F',
  status: 1,
});

const openEdit = async (row: any) => {
  editLoading.value = true;
  editVisible.value = true;
  try {
    const res: any = await adminProductApi.detail(row.id);
    const p = res.data?.data || res.data || row;
    editForm.id = p.id || p.productId || row.id;
    editForm.name = p.name || '';
    editForm.categoryId = p.categoryId || null;
    editForm.shopId = p.shopId || null;
    editForm.subtitle = p.subtitle || '';
    editForm.price = p.price || 0;
    editForm.originalPrice = p.originalPrice || 0;
    editForm.stock = p.stock || 0;
    editForm.mainImage = p.mainImage || p.image || '';
    editForm.images = p.images
      ? (Array.isArray(p.images) ? p.images : String(p.images).split(',').filter(Boolean))
      : [];
    editForm.tag = p.tag || '';
    editForm.tagColor = p.tagColor || '#FFFFFF';
    editForm.tagBg = p.tagBg || '#FF4D4F';
    editForm.status = p.status ?? 1;
  } catch { /* interceptor handles */ }
  editLoading.value = false;
};

const saveEdit = async () => {
  if (!editForm.name) { ElMessage.warning('请填写商品名称'); return; }
  if (!editForm.categoryId) { ElMessage.warning('请选择商品分类'); return; }
  if (editForm.price <= 0) { ElMessage.warning('请设置商品价格'); return; }
  editSaving.value = true;
  try {
    await adminProductApi.update(editForm.id, {
      name: editForm.name,
      categoryId: editForm.categoryId,
      shopId: editForm.shopId,
      subtitle: editForm.subtitle,
      price: editForm.price,
      originalPrice: editForm.originalPrice || null,
      stock: editForm.stock,
      mainImage: editForm.mainImage,
      images: Array.isArray(editForm.images) ? editForm.images.filter(Boolean).join(',') : editForm.images,
      tag: editForm.tag || null,
      tagColor: editForm.tagColor || null,
      tagBg: editForm.tagBg || null,
      status: editForm.status,
    });
    ElMessage.success('修改成功');
    editVisible.value = false;
    doSearch();
  } catch { /* interceptor handles */ } finally { editSaving.value = false; }
};

onMounted(() => {
  loadCategories();
  loadShops();
  // doSearch 由 watch currentShop 触发，不需要重复调用
});
</script>
