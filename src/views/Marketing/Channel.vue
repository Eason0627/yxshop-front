<template>
  <div class="page">
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-[14px] font-semibold text-[#333]">频道配置</h3>
          <p class="text-[12px] text-[#999] mt-0.5">管理首页频道入口，控制显示顺序与内容</p>
        </div>
        <el-button type="primary" size="small" @click="openDialog(null)">
          <i class="ri-add-line mr-1"></i>新增频道
        </el-button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe row-key="id">
        <el-table-column label="图标" width="70">
          <template #default="{ row }">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center"
              :style="{ background: row.bgColor || '#FFF4E6' }">
              <img v-if="row.icon && row.icon.startsWith('http')"
                :src="row.icon" class="w-5 h-5 rounded object-cover" />
              <i v-else :class="row.icon || 'ri-grid-line'" class="text-lg"
                :style="{ color: row.iconColor || '#FF6B00' }"></i>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="频道名称" width="140" />
        <el-table-column label="跳转路径" min-width="200">
          <template #default="{ row }">
            <span class="text-[12px] text-[#666]">{{ row.path || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button :type="row.status === 1 ? 'warning' : 'success'" link size="small" @click="toggleStatus(row)">
              {{ row.status === 1 ? '隐藏' : '显示' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑频道' : '新增频道'"
      width="540px" :destroy-on-close="true">
      <el-form :model="form" label-width="90px" size="default">
        <el-form-item label="频道名称" required>
          <el-input v-model="form.name" placeholder="如：精选好物、品牌特卖" maxlength="8" show-word-limit />
        </el-form-item>

        <el-form-item label="图标">
          <!-- 图标选择器 — 自定义折叠面板，避免 el-collapse 双边框问题 -->
          <div class="w-full border border-[#E8E8E8] rounded-xl overflow-hidden">
            <!-- 触发行 -->
            <div class="flex items-center justify-between px-3 py-2 bg-[#FAFAFA] cursor-pointer select-none"
              @click="showIconPicker = !showIconPicker">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  :style="{ background: form.bgColor || '#FFF4E6' }">
                  <i v-if="form.icon && !form.icon.startsWith('http')"
                    :class="form.icon" class="text-base"
                    :style="{ color: form.iconColor || '#FF6B00' }"></i>
                  <img v-else-if="form.icon" :src="form.icon" class="w-4 h-4 object-contain" />
                  <i v-else class="ri-image-line text-base text-[#CCC]"></i>
                </div>
                <span class="text-[13px] text-[#555]">{{ form.icon || '点击选择图标' }}</span>
              </div>
              <i :class="showIconPicker ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
                class="text-[#999] text-base transition-transform"></i>
            </div>
            <!-- 展开内容 -->
            <div v-if="showIconPicker" class="px-3 py-3 border-t border-[#F0F0F0]">
              <IconPicker v-model="form.icon" :preview-bg="form.bgColor" :preview-color="form.iconColor" />
            </div>
          </div>
        </el-form-item>

        <div class="grid grid-cols-2 gap-x-3">
          <el-form-item label="图标颜色">
            <div class="flex items-center gap-2 w-full">
              <input type="color" v-model="form.iconColor"
                class="w-8 h-8 rounded cursor-pointer border border-[#E8E8E8]" />
              <el-input v-model="form.iconColor" placeholder="#FF6B00" size="small" class="flex-1" />
            </div>
          </el-form-item>
          <el-form-item label="背景颜色">
            <div class="flex items-center gap-2 w-full">
              <input type="color" v-model="form.bgColor"
                class="w-8 h-8 rounded cursor-pointer border border-[#E8E8E8]" />
              <el-input v-model="form.bgColor" placeholder="#FFF4E6" size="small" class="flex-1" />
            </div>
          </el-form-item>
        </div>

        <!-- 预览 -->
        <el-form-item label="预览效果">
          <div class="flex items-center gap-3 p-3 bg-[#F9F9F9] rounded-xl w-full">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              :style="{ background: form.bgColor || '#FFF4E6' }">
              <i v-if="form.icon && !form.icon.startsWith('http')"
                :class="form.icon" class="text-2xl"
                :style="{ color: form.iconColor || '#FF6B00' }"></i>
              <img v-else-if="form.icon" :src="form.icon" class="w-7 h-7 object-contain" />
              <i v-else class="ri-grid-line text-2xl" :style="{ color: form.iconColor || '#FF6B00' }"></i>
            </div>
            <span class="text-[13px] font-medium text-[#333]">{{ form.name || '频道名称' }}</span>
          </div>
        </el-form-item>

        <el-form-item label="跳转路径">
          <el-input v-model="form.path" placeholder="如：/rank、/activity、/shop/101" />
          <div class="text-[11px] text-[#999] mt-1">点击频道后跳转的页面路径</div>
        </el-form-item>

        <el-form-item label="频道类型">
          <el-select v-model="form.type" class="w-full" clearable placeholder="（可选）频道内容类型">
            <el-option label="商品列表" value="product" />
            <el-option label="活动页" value="activity" />
            <el-option label="店铺" value="shop" />
            <el-option label="榜单" value="rank" />
            <el-option label="外部链接" value="external" />
          </el-select>
        </el-form-item>

        <div class="grid grid-cols-2 gap-x-3">
          <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" :max="999" class="w-full" />
          </el-form-item>
          <el-form-item label="是否显示">
            <el-switch v-model="form.status" :active-value="1" :inactive-value="0"
              active-text="显示" inactive-text="隐藏" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { adminMarketingApi } from '@/utils/admin-api';
import IconPicker from '@/components/IconPicker.vue';

const loading = ref(false);
const saving = ref(false);
const tableData = ref<any[]>([]);

const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await adminMarketingApi.channels();
    tableData.value = (res as any).data?.data || (res as any).data || [];
  } catch { /* interceptor shows error */ } finally { loading.value = false; }
};

const toggleStatus = async (row: any) => {
  try {
    const ns = row.status === 1 ? 0 : 1;
    await adminMarketingApi.updateStatus('channels', row.id, ns);
    row.status = ns;
    ElMessage.success(ns === 1 ? '已显示' : '已隐藏');
  } catch { ElMessage.error('操作失败'); }
};

const dialogVisible = ref(false);
const editId = ref<any>(null);
const showIconPicker = ref(false);
const form = reactive({
  name: '',
  icon: '',
  iconColor: '#FF6B00',
  bgColor: '#FFF4E6',
  path: '',
  type: '',
  sort: 0,
  status: 1,
});

const openDialog = (row: any) => {
  editId.value = row?.id || null;
  showIconPicker.value = false;
  if (row) {
    form.name = row.name || '';
    form.icon = row.icon || '';
    form.iconColor = row.iconColor || '#FF6B00';
    form.bgColor = row.bgColor || '#FFF4E6';
    form.path = row.path || '';
    form.type = row.type || '';
    form.sort = row.sort ?? 0;
    form.status = row.status ?? 1;
  } else {
    Object.assign(form, { name: '', icon: '', iconColor: '#FF6B00', bgColor: '#FFF4E6', path: '', type: '', sort: 0, status: 1 });
  }
  dialogVisible.value = true;
};

const save = async () => {
  if (!form.name) { ElMessage.warning('请填写频道名称'); return; }
  saving.value = true;
  try {
    await adminMarketingApi.saveChannel({ ...form, id: editId.value });
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    loadData();
  } finally { saving.value = false; }
};

onMounted(() => loadData());
</script>
