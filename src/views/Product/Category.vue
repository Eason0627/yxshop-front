<template>
  <div class="page">
    <!-- 头部操作区 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4 flex items-center gap-3">
      <el-input v-model="searchKeyword" placeholder="搜索分类名称" class="!w-[220px]" clearable @clear="filterTree" @input="filterTree">
        <template #prefix><i class="ri-search-line text-[#CCC]"></i></template>
      </el-input>
      <el-select v-model="filterStatus" placeholder="启用状态" class="!w-[110px]" clearable @change="filterTree">
        <el-option label="已启用" :value="1" />
        <el-option label="已禁用" :value="0" />
      </el-select>
      <div class="flex-1"></div>
      <el-button v-if="can('category:edit')" type="primary" @click="openAdd(null)">
        <i class="ri-add-line mr-1"></i>新增顶级分类
      </el-button>
    </div>

    <!-- 分类树表格 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <TableSkeleton v-if="loading && allTree.length === 0" />
      <EmptyState v-else-if="!loading && filteredTree.length === 0"
        icon="ri-folder-line" tip="暂无分类数据" />
      <el-table
        v-else
        :data="filteredTree"
        row-key="categoryId"
        v-loading="loading"
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        style="width: 100%"
      >
        <el-table-column label="分类名称" min-width="220">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <!-- 图标 -->
              <div v-if="row.icon" class="w-7 h-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
                <i v-if="row.icon.startsWith('ri-')" :class="row.icon" class="text-[16px] text-[#666]"></i>
                <img v-else :src="row.icon" class="w-full h-full object-cover rounded-lg" />
              </div>
              <div v-else-if="row.imageUrl" class="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
                <img :src="row.imageUrl" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-7 h-7 rounded-lg bg-[#F0F0F0] flex items-center justify-center flex-shrink-0">
                <i class="ri-folder-line text-[14px] text-[#CCC]"></i>
              </div>
              <span class="text-[13px] font-medium text-[#333]">{{ row.categoryName }}</span>
              <el-tag v-if="row.level === 1" size="small" type="warning" class="ml-1">顶级</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="层级" width="70" align="center">
          <template #default="{ row }">
            <span class="text-[12px] text-[#999]">第{{ row.level || 1 }}级</span>
          </template>
        </el-table-column>

        <el-table-column label="商品数" width="80" align="center">
          <template #default="{ row }">
            <span class="text-[13px] text-[#333]">{{ row.productCount || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="排序" width="70" align="center">
          <template #default="{ row }">
            <span class="text-[12px] text-[#666]">{{ row.sort ?? 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              size="small"
              @change="(val: boolean) => toggleStatus(row, val)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right" align="right">
          <template #default="{ row }">
            <div class="flex items-center justify-end gap-1 flex-nowrap">
              <template v-if="can('category:edit')">
                <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
                <el-divider direction="vertical" class="!mx-0.5" />
                <el-button type="success" link size="small" @click="openAdd(row)">子类</el-button>
                <el-divider direction="vertical" class="!mx-0.5" />
                <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
              </template>
              <span v-else class="text-[12px] text-[#CCC]">只读</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑 Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" :destroy-on-close="true">
      <el-form :model="form" label-width="90px" size="default" ref="formRef">
        <el-form-item label="分类名称" required>
          <el-input v-model="form.categoryName" placeholder="请输入分类名称" maxlength="20" show-word-limit />
        </el-form-item>

        <el-form-item label="上级分类">
          <el-cascader
            v-model="form.parentCategoryId"
            :options="flatParentOptions"
            :props="{ value: 'categoryId', label: 'categoryName', checkStrictly: true, emitPath: false }"
            placeholder="不选则为顶级分类"
            clearable
            class="w-full"
          />
        </el-form-item>

        <div class="grid grid-cols-2 gap-3">
          <el-form-item label="图标">
            <el-input v-model="form.icon" placeholder="ri-xxx-line 或图片URL" />
            <div class="mt-1 flex items-center gap-2" v-if="form.icon">
              <div class="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center">
                <i v-if="form.icon.startsWith('ri-')" :class="form.icon" class="text-xl text-[#666]"></i>
                <img v-else :src="form.icon" class="w-full h-full object-cover rounded-lg" />
              </div>
              <span class="text-[11px] text-[#999]">预览</span>
            </div>
          </el-form-item>

          <el-form-item label="分类图片">
            <el-input v-model="form.imageUrl" placeholder="分类封面图URL" />
            <img v-if="form.imageUrl" :src="form.imageUrl" class="mt-1 w-12 h-12 object-cover rounded-lg border border-[#F0F0F0]" />
          </el-form-item>
        </div>

        <el-form-item label="Banner图">
          <el-input v-model="form.banner" placeholder="分类详情页顶部横幅图URL（建议750×200）" />
          <img v-if="form.banner" :src="form.banner" class="mt-1 w-full h-16 object-cover rounded-lg border border-[#F0F0F0]" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="分类简短描述（可选）" maxlength="100" />
        </el-form-item>

        <div class="grid grid-cols-2 gap-3">
          <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" :max="9999" class="w-full" />
            <div class="text-[11px] text-[#999] mt-0.5">数值越小越靠前</div>
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.statusBool" active-text="启用" inactive-text="禁用" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminProductApi } from '@/utils/admin-api';
import { usePermission } from '@/utils/permission';
import EmptyState from '@/components/EmptyState.vue';
import TableSkeleton from '@/components/TableSkeleton.vue';

const { can } = usePermission();

const loading = ref(false);
const saving = ref(false);
const allTree = ref<any[]>([]);
const searchKeyword = ref('');
const filterStatus = ref<number | null>(null);

// ===== 加载分类�?=====
const loadTree = async () => {
  loading.value = true;
  try {
    const res: any = await adminProductApi.adminCategories();
    allTree.value = res.data?.data || res.data || [];
  } catch { /* interceptor handles */ }
  finally { loading.value = false; }
};

// ===== 过滤�?=====
const matchNode = (node: any, kw: string, status: number | null): boolean => {
  const nameMatch = !kw || node.categoryName?.toLowerCase().includes(kw.toLowerCase());
  const statusMatch = status === null || node.status === status;
  const childMatch = (node.children || []).some((c: any) => matchNode(c, kw, status));
  return (nameMatch && statusMatch) || childMatch;
};

const filterTreeNodes = (nodes: any[], kw: string, status: number | null): any[] =>
  nodes
    .filter(n => matchNode(n, kw, status))
    .map(n => ({
      ...n,
      children: filterTreeNodes(n.children || [], kw, status),
    }));

const filteredTree = computed(() => {
  const kw = searchKeyword.value.trim();
  const st = filterStatus.value;
  if (!kw && st === null) return allTree.value;
  return filterTreeNodes(allTree.value, kw, st);
});

const filterTree = () => { /* computed 自动重算 */ };

// ===== 扁平化（用于 cascader 父级选择�?=====
const flattenForCascader = (nodes: any[], excludeId?: number | null): any[] =>
  nodes.flatMap(n => {
    if (excludeId && n.categoryId === excludeId) return [];
    return [
      { categoryId: n.categoryId, categoryName: n.categoryName },
      ...flattenForCascader(n.children || [], excludeId),
    ];
  });

const flatParentOptions = computed(() => flattenForCascader(allTree.value, editId.value));

// ===== 弹窗 =====
const dialogVisible = ref(false);
const dialogTitle = ref('新增分类');
const editId = ref<number | null>(null);
const formRef = ref<any>(null);

const DEFAULT_FORM = {
  categoryName: '',
  parentCategoryId: null as number | null,
  icon: '',
  imageUrl: '',
  banner: '',
  description: '',
  sort: 0,
  statusBool: true,
};
const form = reactive({ ...DEFAULT_FORM });

const resetForm = () => { Object.assign(form, DEFAULT_FORM); };

const openAdd = (parentRow: any) => {
  editId.value = null;
  resetForm();
  if (parentRow) form.parentCategoryId = parentRow.categoryId;
  dialogTitle.value = parentRow ? `新增子分类（${parentRow.categoryName}）` : '新增顶级分类';
  dialogVisible.value = true;
};

const openEdit = (row: any) => {
  editId.value = row.categoryId;
  form.categoryName = row.categoryName || '';
  form.parentCategoryId = row.parentCategoryId || null;
  form.icon = row.icon || '';
  form.imageUrl = row.imageUrl || '';
  form.banner = row.banner || '';
  form.description = row.description || '';
  form.sort = row.sort ?? 0;
  form.statusBool = row.status !== 0;
  dialogTitle.value = `编辑分类「${row.categoryName}」`;
  dialogVisible.value = true;
};

const handleSave = async () => {
  if (!form.categoryName.trim()) { ElMessage.warning('请填写分类名称'); return; }
  saving.value = true;
  try {
    const payload: any = {
      categoryName: form.categoryName,
      parentCategoryId: form.parentCategoryId || null,
      icon: form.icon || null,
      imageUrl: form.imageUrl || null,
      banner: form.banner || null,
      description: form.description || null,
      sort: form.sort,
      status: form.statusBool ? 1 : 0,
    };
    if (editId.value) payload.categoryId = editId.value;
    await adminProductApi.saveCategory(payload);
    ElMessage.success(editId.value ? '分类已更新' : '分类已创建');
    dialogVisible.value = false;
    loadTree();
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  }
  saving.value = false;
};

const toggleStatus = async (row: any, enabled: boolean) => {
  const newStatus = enabled ? 1 : 0;
  try {
    await adminProductApi.updateCategoryStatus(row.categoryId, newStatus);
    row.status = newStatus;
    ElMessage.success(enabled ? '分类已启用' : '分类已禁用');
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败');
  }
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定删除分类「${row.categoryName}」？此操作不可恢复。`,
      '删除确认',
      { type: 'warning' }
    );
    await adminProductApi.deleteCategory(row.categoryId);
    ElMessage.success('分类已删除');
    loadTree();
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败');
  }
};

onMounted(() => loadTree());
</script>
