<template>
  <div class="page">
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center justify-between">
        <h3 class="text-[14px] font-semibold text-[#333]">Banner 列表</h3>
        <el-button type="primary" size="small" @click="openDialog(null)">
          <i class="ri-add-line mr-1"></i>新增Banner
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-xl border border-[#F0F0F0] p-8 text-center">
      <i class="ri-loader-4-line text-[#FF6B00] text-2xl animate-spin"></i>
    </div>

    <div v-else-if="!loading && banners.length === 0" class="bg-white rounded-xl border border-[#F0F0F0]">
      <EmptyState icon="ri-image-2-line" tip="暂无 Banner，点击右上角新增" />
    </div>

    <div v-else class="grid grid-cols-3 gap-4 mb-4">
      <div v-for="item in banners" :key="item.id"
        class="bg-white rounded-xl border border-[#F0F0F0] overflow-hidden hover:shadow-md transition-shadow">
        <div class="relative h-[140px] bg-[#F5F5F5]">
          <img v-if="item.image" :src="item.image" class="w-full h-full object-cover"
            @error="(e:any) => e.target.style.display='none'" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <i class="ri-image-line text-4xl text-[#CCC]"></i>
          </div>
          <el-tag class="absolute top-2 right-2" :type="item.status === 1 ? 'success' : 'info'" size="small" effect="dark">
            {{ item.status === 1 ? '启用' : '禁用' }}
          </el-tag>
          <div v-if="item.sort != null" class="absolute top-2 left-2 bg-black/50 text-white text-[11px] px-1.5 py-0.5 rounded">
            排序 {{ item.sort }}
          </div>
        </div>
        <div class="p-3">
          <div class="text-[13px] font-medium text-[#333] mb-1 truncate">{{ item.title || '（无标题）' }}</div>
          <div class="text-[11px] text-[#999] mb-3 truncate flex items-center gap-1">
            <el-tag v-if="item.linkType" size="small" type="warning" plain class="flex-shrink-0">{{ linkTypeLabel(item.linkType) }}</el-tag>
            <span v-if="item.linkTarget" class="truncate">{{ item.linkTarget }}</span>
          </div>
          <div class="flex gap-2">
            <el-button size="small" class="flex-1" @click="openDialog(item)">
              <i class="ri-edit-line mr-1"></i>编辑
            </el-button>
            <el-button size="small" :type="item.status === 1 ? 'warning' : 'success'" @click="toggleStatus(item)">
              {{ item.status === 1 ? '禁用' : '启用' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑 Banner' : '新增 Banner'"
      width="560px" :destroy-on-close="true">
      <el-form :model="form" label-width="90px" size="default">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="Banner 展示标题（可为空）" />
        </el-form-item>

        <el-form-item label="图片" required>
          <MediaPicker v-model="form.image" variant="banner" height="140px" biz-type="banner" />
        </el-form-item>

        <el-form-item label="跳转类型">
          <el-select v-model="form.linkType" class="w-full" clearable placeholder="选择跳转类型"
            @change="onLinkTypeChange">
            <el-option label="无跳转" value="none" />
            <el-option label="商品详情" value="product" />
            <el-option label="店铺主页" value="shop" />
            <el-option label="活动页" value="activity" />
            <el-option label="商品分类" value="category" />
            <el-option label="自定义路径" value="path" />
            <el-option label="外部链接" value="external" />
          </el-select>
        </el-form-item>

        <!-- 跳转目标：动态渲染 -->
        <el-form-item v-if="form.linkType && form.linkType !== 'none'" label="跳转目标">
          <!-- 商品选择 -->
          <el-select v-if="form.linkType === 'product'"
            v-model="form.linkTarget" filterable remote placeholder="搜索商品名称"
            :remote-method="(q:string) => searchTarget('product', q)"
            :loading="targetLoading" class="w-full" clearable>
            <el-option v-for="p in targetOptions" :key="p.id"
              :label="`${p.name}  ¥${p.price}`" :value="String(p.id)">
              <div class="flex items-center gap-2 py-1">
                <img :src="p.mainImage" class="w-8 h-8 rounded object-cover bg-[#F5F5F5] flex-shrink-0" />
                <div class="min-w-0">
                  <div class="text-[13px] truncate max-w-[220px]">{{ p.name }}</div>
                  <div class="text-[11px] text-[#FF6B00]">¥{{ p.price }}</div>
                </div>
              </div>
            </el-option>
          </el-select>

          <!-- 店铺选择 -->
          <el-select v-else-if="form.linkType === 'shop'"
            v-model="form.linkTarget" filterable remote placeholder="搜索店铺名称"
            :remote-method="(q:string) => searchTarget('shop', q)"
            :loading="targetLoading" class="w-full" clearable>
            <el-option v-for="s in targetOptions" :key="s.shopId"
              :label="s.shopName || s.displayName" :value="String(s.shopId)" />
          </el-select>

          <!-- 活动选择 -->
          <el-select v-else-if="form.linkType === 'activity'"
            v-model="form.linkTarget" filterable remote placeholder="搜索活动标题"
            :remote-method="(q:string) => searchTarget('activity', q)"
            :loading="targetLoading" class="w-full" clearable>
            <el-option v-for="a in targetOptions" :key="a.id"
              :label="a.title" :value="String(a.id)" />
          </el-select>

          <!-- 分类选择 -->
          <el-select v-else-if="form.linkType === 'category'"
            v-model="form.linkTarget" class="w-full" placeholder="选择商品分类" clearable filterable>
            <el-option v-for="c in categoryOptions" :key="c.categoryId"
              :label="c._displayName" :value="String(c.categoryId)" />
          </el-select>

          <!-- 自定义路径或外部链接 -->
          <el-input v-else v-model="form.linkTarget"
            :placeholder="form.linkType === 'external' ? 'https://example.com/...' : '/activity/618 或 /shop/101'" />
        </el-form-item>

        <div class="grid grid-cols-2 gap-3">
          <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" :max="999" class="w-full" />
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.status" :active-value="1" :inactive-value="0"
              active-text="启用" inactive-text="禁用" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveBanner">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { adminMarketingApi, adminProductApi, adminShopApi } from '@/utils/admin-api';
import MediaPicker from '@/components/MediaPicker/MediaPicker.vue';
import EmptyState from '@/components/EmptyState.vue';

const banners = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editId = ref<any>(null);

const DEFAULT_FORM = { title: '', image: '', linkType: '', linkTarget: '', sort: 1, status: 1 };
const form = reactive({ ...DEFAULT_FORM });

// Link type label mapping
const linkTypeMap: Record<string, string> = {
  none: '无跳转', product: '商品', shop: '店铺',
  activity: '活动', category: '分类', path: '路径', external: '外链',
};
const linkTypeLabel = (t: string) => linkTypeMap[t] || t;

// Remote target search
const targetLoading = ref(false);
const targetOptions = ref<any[]>([]);
const categoryOptions = ref<any[]>([]);

const onLinkTypeChange = async (type: string) => {
  form.linkTarget = '';
  targetOptions.value = [];
  if (type === 'product') {
    searchTarget('product', '');
  } else if (type === 'shop') {
    searchTarget('shop', '');
  } else if (type === 'activity') {
    searchTarget('activity', '');
  } else if (type === 'category') {
    loadCategories();
  }
};

const searchTarget = async (type: string, keyword: string) => {
  targetLoading.value = true;
  try {
    if (type === 'product') {
      const res: any = await adminProductApi.list({ keyword: keyword || undefined, pageNum: 1, pageSize: 20 });
      const data = res.data?.data || res.data || {};
      targetOptions.value = data.records || (Array.isArray(data) ? data : []);
    } else if (type === 'shop') {
      const res: any = await adminShopApi.list({ keyword: keyword || undefined, pageNum: 1, pageSize: 20 });
      const data = res.data?.data || res.data || {};
      targetOptions.value = data.records || (Array.isArray(data) ? data : []);
    } else if (type === 'activity') {
      const res: any = await adminMarketingApi.activities({ keyword: keyword || undefined, pageNum: 1, pageSize: 20 });
      const data = res.data?.data || res.data || {};
      targetOptions.value = data.records || (Array.isArray(data) ? data : []);
    }
  } catch { /* interceptor handles */ }
  targetLoading.value = false;
};

// Flatten nested category tree �?flat list with indented display names
const flattenCategoryTree = (nodes: any[], depth = 0): any[] => {
  const result: any[] = [];
  for (const node of (nodes || [])) {
    result.push({ ...node, _displayName: '　'.repeat(depth) + (node.categoryName || node.name || '—') });
    if (node.children?.length) result.push(...flattenCategoryTree(node.children, depth + 1));
  }
  return result;
};

const loadCategories = async () => {
  try {
    const res: any = await adminProductApi.adminCategories();
    const tree = res.data?.data || res.data || [];
    categoryOptions.value = flattenCategoryTree(Array.isArray(tree) ? tree : [tree]);
  } catch { /* interceptor handles */ }
};

const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await adminMarketingApi.banners();
    banners.value = res.data?.data || res.data || [];
  } catch { /* interceptor handles */ }
  finally { loading.value = false; }
};

const openDialog = (item?: any) => {
  editId.value = item?.id || null;
  targetOptions.value = [];
  Object.assign(form, DEFAULT_FORM, item ? {
    title:      item.title      || '',
    image:      item.image      || '',
    linkType:   item.linkType   || '',
    linkTarget: item.linkTarget || item.link || '',
    sort:       item.sort       ?? 1,
    status:     item.status     ?? 1,
  } : {});
  if (item?.linkType === 'category') loadCategories();
  dialogVisible.value = true;
};

const saveBanner = async () => {
  if (!form.image) { ElMessage.warning('请上传或填写图片'); return; }
  saving.value = true;
  try {
    await adminMarketingApi.saveBanner({ ...form, id: editId.value });
    ElMessage.success(editId.value ? '修改成功' : '创建成功');
    dialogVisible.value = false;
    loadData();
  } catch { ElMessage.error('保存失败'); }
  saving.value = false;
};

const toggleStatus = async (item: any) => {
  try {
    const ns = item.status === 1 ? 0 : 1;
    await adminMarketingApi.updateStatus('banners', item.id, ns);
    item.status = ns;
    ElMessage.success(ns === 1 ? '已启用' : '已禁用');
  } catch { ElMessage.error('操作失败'); }
};

onMounted(() => loadData());
</script>
