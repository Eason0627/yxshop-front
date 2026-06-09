<template>
  <div class="page">
    <!-- 顶部工具�?-->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h3 class="text-[14px] font-semibold text-[#333]">榜单管理</h3>
          <p class="text-[12px] text-[#999] mt-0.5">选择榜单查看并管理其中商品</p>
        </div>
        <div class="flex gap-2">
          <el-button @click="openListDialog(null)">
            <i class="ri-list-settings-line mr-1"></i>管理榜单
          </el-button>
          <el-button type="primary" :disabled="!selectedList" @click="openAddDialog">
            <i class="ri-add-line mr-1"></i>添加商品
          </el-button>
        </div>
      </div>

      <!-- 榜单 Tab 选择 -->
      <div v-if="listsLoading" class="text-[#999] text-[13px] py-2">加载中...</div>
      <div v-else class="flex gap-2 flex-wrap">
        <div v-for="list in rankingLists" :key="list.id"
          class="cursor-pointer rounded-lg px-4 py-1.5 border transition-all select-none text-[13px]"
          :class="selectedList?.id === list.id
            ? 'border-[#FF6B00] bg-[#FFF4E6] text-[#FF6B00] font-medium'
            : 'border-[#E8E8E8] text-[#555] hover:border-[#FF6B00] hover:text-[#FF6B00]'"
          @click="selectList(list)">
          <i class="ri-list-check-2 mr-1"></i>
          {{ list.name }}
          <span class="text-[11px] ml-1 opacity-70">{{ list.productCount ?? 0 }}件</span>
          <el-tag v-if="list.status === 0" size="small" type="info" class="ml-1">隐藏</el-tag>
        </div>
        <div v-if="!rankingLists.length"
          class="text-[#999] text-[13px] py-1 flex items-center gap-2">
          <i class="ri-information-line"></i>
          暂无榜单，点击「管理榜单」新建
        </div>
      </div>
    </div>

    <!-- 商品列表 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <div v-if="!selectedList" class="p-12 text-center">
        <i class="ri-list-check-3 text-5xl text-[#DDD] block mb-2"></i>
        <p class="text-[#999] text-[13px]">请从上方选择一个榜单</p>
      </div>
      <template v-else>
        <div class="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
          <span class="text-[13px] font-medium text-[#333]">
            {{ selectedList.name }}
            <span class="text-[#999] font-normal ml-2">共 {{ tableData.length }} 件商品</span>
          </span>
        </div>
        <el-table :data="tableData" v-loading="loading" style="width: 100%" stripe>
          <el-table-column label="排名" width="70">
            <template #default="{ $index }">
              <div v-if="$index < 3"
                class="w-6 h-6 rounded-md flex items-center justify-center text-white text-[12px] font-bold"
                :style="{ background: ['#FF4D4F','#FF7A45','#FFA940'][$index] }">
                {{ $index + 1 }}
              </div>
              <span v-else class="text-[14px] text-[#999] font-medium">{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="商品" min-width="260">
            <template #default="{ row }">
              <div class="flex items-center gap-3">
                <img :src="row.mainImage" class="w-12 h-12 rounded-lg object-cover bg-[#F5F5F5]"
                  @error="(e:any) => e.target.style.display='none'" />
                <div>
                  <div class="text-[13px] font-medium text-[#333] truncate max-w-[200px]">{{ row.name }}</div>
                  <div class="text-[12px] text-[#FF6B00] mt-0.5">¥{{ row.price }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="sales" label="销量" width="100" />
          <el-table-column label="评分" width="80">
            <template #default="{ row }">
              <span v-if="row.score" class="text-[#FF9500]">★ {{ row.score }}</span>
              <span v-else class="text-[#CCC]">—</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="danger" link size="small" @click="removeFromRank(row)">移出榜单</el-button>
            </template>
          </el-table-column>
        </el-table>
        <EmptyState v-if="!loading && tableData.length === 0"
          icon="ri-trophy-line" tip="该榜单暂无商品" sub-tip="点击「添加商品」开始配置" />
      </template>
    </div>

    <!-- ===== 管理榜单 对话�?===== -->
    <el-dialog v-model="listDialogVisible" title="管理榜单" width="680px" :destroy-on-close="true">
      <div class="flex justify-end mb-3">
        <el-button type="primary" size="small" @click="openListDialog(null, true)">
          <i class="ri-add-line mr-1"></i>新建榜单
        </el-button>
      </div>
      <el-table :data="rankingLists" style="width: 100%" stripe v-loading="listsLoading">
        <el-table-column prop="name" label="榜单名称" min-width="140" />
        <el-table-column prop="categoryName" label="分类" width="140">
          <template #default="{ row }">{{ row.categoryName || '—' }}</template>
        </el-table-column>
        <el-table-column label="商品数" width="80">
          <template #default="{ row }">{{ row.productCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openListDialog(row, true)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteList(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- ===== 新建/编辑榜单 对话框 ===== -->
    <el-dialog v-model="listFormVisible" :title="listEditId ? '编辑榜单' : '新建榜单'"
      width="420px" :destroy-on-close="true" :append-to-body="true">
      <el-form :model="listForm" label-width="80px" size="default">
        <el-form-item label="榜单名称" required>
          <el-input v-model="listForm.name" placeholder="如：热销榜、新品榜" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="分类标签">
          <el-input v-model="listForm.categoryName" placeholder="如：全场热销、女装新品（可选）" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="listForm.status" :active-value="1" :inactive-value="0"
            active-text="显示" inactive-text="隐藏" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="listFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="listSaving" @click="saveList">保存</el-button>
      </template>
    </el-dialog>

    <!-- ===== 添加商品 对话框 ===== -->
    <el-dialog v-model="addVisible" title="添加商品到榜单" width="620px" :destroy-on-close="true">
      <div class="mb-3 flex gap-2">
        <el-input v-model="addSearch" placeholder="搜索商品名称或ID" class="flex-1" clearable
          @keyup.enter="searchProducts" @clear="searchProducts" />
        <el-button type="primary" @click="searchProducts">搜索</el-button>
      </div>
      <div class="max-h-[360px] overflow-y-auto space-y-2">
        <div v-if="addLoading" class="text-center py-8 text-[#999] text-[13px]">
          <i class="ri-loader-4-line animate-spin mr-1"></i>加载�?..
        </div>
        <div v-else-if="productList.length === 0" class="text-center py-8 text-[#999] text-[13px]">暂无商品</div>
        <div v-for="p in productList" :key="p.id"
          class="flex items-center gap-3 p-2 rounded-lg border transition-colors cursor-pointer"
          :class="selectedIds.has(p.id)
            ? 'border-[#FF6B00] bg-[#FFF4E6]'
            : 'border-[#F0F0F0] hover:border-[#FF6B00]'"
          @click="toggleSelect(p.id)">
          <img :src="p.mainImage || p.image" class="w-10 h-10 rounded-lg object-cover bg-[#F5F5F5]"
            @error="(e:any) => e.target.style.display='none'" />
          <div class="flex-1 min-w-0">
            <div class="text-[13px] truncate">{{ p.name }}</div>
            <div class="text-[12px] text-[#FF6B00]">¥{{ p.price }}</div>
          </div>
          <el-checkbox :model-value="selectedIds.has(p.id)" @change="toggleSelect(p.id)" @click.stop />
        </div>
      </div>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" :disabled="selectedIds.size === 0" :loading="addSaving" @click="confirmAdd">
          添加 {{ selectedIds.size }} 件商�?        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminMarketingApi, adminProductApi } from '@/utils/admin-api';
import EmptyState from '@/components/EmptyState.vue';

// ====== Ranking list state ======
const listsLoading = ref(false);
const rankingLists = ref<any[]>([]);
const selectedList = ref<any>(null);
const loading = ref(false);
const tableData = ref<any[]>([]);

const loadLists = async () => {
  listsLoading.value = true;
  try {
    const res: any = await adminMarketingApi.rankingLists();
    rankingLists.value = res.data?.data || res.data || [];
    if (rankingLists.value.length && !selectedList.value) {
      selectList(rankingLists.value[0]);
    }
  } catch { /* interceptor handles */ }
  finally { listsLoading.value = false; }
};

const selectList = async (list: any) => {
  selectedList.value = list;
  loading.value = true;
  try {
    const res: any = await adminMarketingApi.rankingProducts(list.id);
    tableData.value = res.data?.data || res.data || [];
  } catch { /* interceptor handles */ }
  finally { loading.value = false; }
};

const removeFromRank = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确认将「${row.name}」移出榜单？`, '移除确认', {
      confirmButtonText: '移除', cancelButtonText: '取消', type: 'warning',
    });
    await adminMarketingApi.removeRankingProduct(selectedList.value.id, row.id);
    tableData.value = tableData.value.filter((r: any) => r.id !== row.id);
    const found = rankingLists.value.find((l: any) => l.id === selectedList.value.id);
    if (found && found.productCount > 0) found.productCount--;
    ElMessage.success('已移出榜单');
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('操作失败');
  }
};

// ====== Ranking list CRUD ======
const listDialogVisible = ref(false);
const listFormVisible = ref(false);
const listEditId = ref<any>(null);
const listSaving = ref(false);
const listForm = reactive({ name: '', categoryName: '', status: 1 });

const openListDialog = (row: any, openForm = false) => {
  if (!openForm) {
    // Open the management table dialog
    listDialogVisible.value = true;
    return;
  }
  // Open create/edit form
  listEditId.value = row?.id || null;
  if (row) {
    listForm.name = row.name || '';
    listForm.categoryName = row.categoryName || '';
    listForm.status = row.status ?? 1;
  } else {
    Object.assign(listForm, { name: '', categoryName: '', status: 1 });
  }
  listFormVisible.value = true;
};

const saveList = async () => {
  if (!listForm.name) { ElMessage.warning('请填写榜单名称'); return; }
  listSaving.value = true;
  try {
    if (listEditId.value) {
      await adminMarketingApi.updateRankingList(listEditId.value, { ...listForm });
      const idx = rankingLists.value.findIndex((l: any) => l.id === listEditId.value);
      if (idx !== -1) Object.assign(rankingLists.value[idx], listForm);
      ElMessage.success('修改成功');
    } else {
      const res: any = await adminMarketingApi.createRankingList({ ...listForm });
      const newList = res.data?.data || res.data;
      if (newList) rankingLists.value.push({ ...newList, productCount: 0 });
      ElMessage.success('创建成功');
    }
    listFormVisible.value = false;
  } catch { ElMessage.error('保存失败'); }
  listSaving.value = false;
};

const deleteList = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确认删除榜单「${row.name}」？删除后榜单中的商品配置将一并清除。`, '删除确认', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning', confirmButtonClass: 'el-button--danger',
    });
    await adminMarketingApi.deleteRankingList(row.id);
    rankingLists.value = rankingLists.value.filter((l: any) => l.id !== row.id);
    if (selectedList.value?.id === row.id) {
      selectedList.value = null;
      tableData.value = [];
    }
    ElMessage.success('已删除');
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

// ====== Add products ======
const addVisible = ref(false);
const addSearch = ref('');
const addLoading = ref(false);
const addSaving = ref(false);
const productList = ref<any[]>([]);
const selectedIds = reactive(new Set<number>());

const openAddDialog = () => {
  addSearch.value = '';
  productList.value = [];
  selectedIds.clear();
  addVisible.value = true;
  searchProducts();
};

const searchProducts = async () => {
  addLoading.value = true;
  try {
    const res: any = await adminProductApi.list({
      keyword: addSearch.value || undefined,
      pageNum: 1,
      pageSize: 30,
    });
    const data = res.data?.data || res.data || {};
    productList.value = data.records || (Array.isArray(data) ? data : []);
  } catch { /* interceptor handles */ }
  addLoading.value = false;
};

const toggleSelect = (id: number) => {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
};

const confirmAdd = async () => {
  if (selectedIds.size === 0) { ElMessage.warning('请选择商品'); return; }
  addSaving.value = true;
  try {
    await adminMarketingApi.addRankingProducts(selectedList.value.id, [...selectedIds]);
    ElMessage.success(`已添�?${selectedIds.size} 件商品`);
    addVisible.value = false;
    await selectList(selectedList.value);
    const found = rankingLists.value.find((l: any) => l.id === selectedList.value.id);
    if (found) found.productCount = tableData.value.length;
  } catch { ElMessage.error('添加失败'); }
  addSaving.value = false;
};

onMounted(() => loadLists());
</script>
