<template>
  <div class="page">
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="商品名称" class="!w-[200px]" clearable @keyup.enter="doSearch" />
        <el-select v-model="search.status" placeholder="状态" class="!w-[120px]" clearable @change="doSearch">
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
        </el-select>
        <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <div class="flex-1"></div>
        <el-button type="primary" @click="openDialog(null)"><i class="ri-add-line mr-1"></i>新增商品</el-button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe>
        <el-table-column label="商品" min-width="280">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <img :src="row.image" class="w-12 h-12 rounded-lg object-cover bg-[#F5F5F5]" />
              <div class="min-w-0">
                <div class="text-[13px] font-medium text-[#333] truncate max-w-[180px]">{{ row.name }}</div>
                <div class="text-[12px] text-[#999]">{{ row.categoryName || row.type || '—' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="所需积分" width="110">
          <template #default="{ row }">
            <span class="text-[#FF6B00] font-bold text-[15px]">{{ row.pointsCost || row.pointsPrice || row.points }}</span>
            <span class="text-[11px] text-[#999] ml-0.5">积分</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column label="已兑换" width="80">
          <template #default="{ row }">{{ row.exchangeCount || 0 }}</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            <span class="text-[12px] text-[#999]">{{ safeFormat(row.createTime || row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button :type="row.status === 1 ? 'warning' : 'success'" link size="small" @click="toggleStatus(row)">
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button type="danger" link size="small" @click="deleteGoods(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end p-4">
        <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
          :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next" @change="doSearch" />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑积分商品' : '新增积分商品'" width="520px" :destroy-on-close="true">
      <el-form :model="form" label-width="90px" size="default">
        <el-form-item label="商品名称" required>
          <el-input v-model="form.name" placeholder="积分商品名称" />
        </el-form-item>
        <el-form-item label="商品图片" required>
          <MediaPicker v-model="form.image" :preview-size="120" :clearable="true" biz-type="points" />
        </el-form-item>
        <el-form-item label="所需积分" required>
          <el-input-number v-model="form.pointsCost" :min="1" />
          <span class="ml-2 text-[#999] text-[12px]">积分</span>
        </el-form-item>
        <el-form-item label="库存" required>
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="每人限兑">
          <el-input-number v-model="form.limitPerUser" :min="1" />
          <span class="ml-2 text-[#999] text-[12px]">次</span>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
          <span class="ml-2 text-[#999] text-[12px]">数值越大越靠前</span>
        </el-form-item>
        <el-form-item label="商品说明">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="商品详细说明（可选）" />
        </el-form-item>
        <el-form-item label="上架状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" />
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
import client from '@/utils/http';
import { safeFormat } from '@/utils/dateFormat';
import MediaPicker from '@/components/MediaPicker/MediaPicker.vue';
import { useListPage } from '@/composables/useListPage';

const saving = ref(false);
const { loading, tableData, total, pageNum, pageSize, search, doSearch } =
  useListPage(
    (p) => client.get('/app/points/goods/admin', { params: {
      pageNum: p.pageNum, pageSize: p.pageSize,
      keyword: p.keyword || undefined, status: p.status ?? undefined,
    }}),
    { keyword: '', status: null as number | null },
  );

const toggleStatus = async (row: any) => {
  const ns = row.status === 1 ? 0 : 1;
  try {
    await client.put(`/app/points/goods/${row.id}/status`, { status: ns });
    row.status = ns;
    ElMessage.success(ns === 1 ? '已上架' : '已下架');
  } catch { ElMessage.error('操作失败'); }
};

const dialogVisible = ref(false);
const editId = ref<any>(null);
const form = reactive({ name: '', image: '', pointsCost: 100, stock: 99, limitPerUser: 1, sort: 0, description: '', status: 1 });

const openDialog = (row: any) => {
  editId.value = row?.id || null;
  if (row) {
    form.name = row.name || '';
    form.image = row.image || '';
    form.pointsCost = row.pointsCost || row.pointsPrice || row.points || 100;
    form.stock = row.stock || 0;
    form.limitPerUser = row.limitPerUser || 1;
    form.sort = row.sort || 0;
    form.description = row.description || '';
    form.status = row.status ?? 1;
  } else {
    Object.assign(form, { name: '', image: '', pointsCost: 100, stock: 99, limitPerUser: 1, sort: 0, description: '', status: 1 });
  }
  dialogVisible.value = true;
};

// 删除积分商品（物理删除，需要下架状态）
const deleteGoods = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确认删除「${row.name}」？该操作不可恢复。`,
      '删除确认', { type: 'warning' }
    );
    await client.delete(`/app/points/goods/${row.id || row.goodsId}`);
    ElMessage.success('删除成功');
    doSearch();
  } catch { /* 用户取消 */ }
};

const save = async () => {
  if (!form.name) { ElMessage.warning('请填写商品名称'); return; }
  if (!form.image) { ElMessage.warning('请填写商品图片'); return; }
  saving.value = true;
  try {
    if (editId.value) {
      await client.put(`/app/points/goods/${editId.value}`, form);
    } else {
      await client.post('/app/points/goods', form);
    }
    ElMessage.success(editId.value ? '修改成功' : '创建成功');
    dialogVisible.value = false;
    doSearch();
  } finally { saving.value = false; }
};
</script>
