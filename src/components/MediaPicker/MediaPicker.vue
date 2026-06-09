<template>
  <!-- ====== Banner Variant ====== -->
  <div v-if="variant === 'banner'" class="media-picker">
    <div
      class="relative mb-2 rounded-xl overflow-hidden border border-[#E8E8E8] bg-[#FAFAFA] group cursor-pointer"
      :style="{ height: height }"
      @click="openDialog"
    >
      <template v-if="singleValue">
        <img
          v-if="isFullUrl(singleValue)"
          :src="singleValue"
          class="w-full h-full object-cover"
          @error="(e: any) => { e.target.style.opacity = 0.3 }"
        />
        <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#EFF6FF]">
          <i class="ri-checkbox-circle-fill text-[#409EFF] text-3xl"></i>
          <span class="text-[12px] text-[#409EFF] font-medium">图片已选择</span>
          <span class="text-[10px] text-[#409EFF]/70 px-3 text-center truncate max-w-full">{{ singleValue }}</span>
        </div>
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <el-button size="small" plain @click.stop="openDialog">
            <i class="ri-image-line mr-1"></i>重新选择
          </el-button>
          <el-button v-if="clearable" size="small" type="danger" plain @click.stop="clearValue">
            <i class="ri-delete-bin-line mr-1"></i>移除
          </el-button>
        </div>
      </template>
      <template v-else>
        <div class="w-full h-full flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-[#E8E8E8] rounded-xl hover:border-[#409EFF] hover:bg-[#EFF6FF]/30 transition-colors">
          <i class="ri-image-add-line text-3xl text-[#CCC]"></i>
          <span class="text-[12px] text-[#999]">点击上传图片</span>
        </div>
      </template>
    </div>

    <!-- Button row -->
    <div class="flex gap-2 items-center">
      <el-upload
        :show-file-list="false"
        :before-upload="handleBannerUpload"
        accept="image/*"
        :disabled="bannerUploading"
        class="flex-shrink-0"
      >
        <el-button size="small" :loading="bannerUploading" plain>
          <i class="ri-upload-2-line mr-1"></i>{{ bannerUploading ? '上传中…' : '上传图片' }}
        </el-button>
      </el-upload>
      <el-button size="small" plain @click="openDialog">
        <i class="ri-image-2-line mr-1"></i>资源库
      </el-button>
      <span class="text-[#D0D0D0] text-[11px] flex-shrink-0">或</span>
      <el-input
        v-model="urlInput"
        :placeholder="placeholder"
        size="small"
        class="flex-1"
        @blur="onUrlChange"
        @keyup.enter="onUrlChange"
      />
    </div>
  </div>

  <!-- ====== Default Variant: Single ====== -->
  <div v-else-if="!multiple">
    <!-- 有图时：点击预览大图，hover 显示更换/移除按钮 -->
    <div v-if="singleValue" class="relative group inline-block">
      <el-image
        v-if="isFullUrl(singleValue)"
        :src="singleValue"
        :preview-src-list="[singleValue]"
        :initial-index="0"
        preview-teleported
        fit="cover"
        class="rounded-lg border border-[#E8E8E8] block"
        :style="{ width: previewSize + 'px', height: previewSize + 'px' }"
      />
      <div
        v-else
        class="rounded-lg border-2 border-[#409EFF] bg-[#F0F7FF] flex flex-col items-center justify-center cursor-pointer"
        :style="{ width: previewSize + 'px', height: previewSize + 'px' }"
        @click="openDialog"
      >
        <i class="ri-checkbox-circle-fill text-[#409EFF] text-[22px]"></i>
        <span class="text-[10px] text-[#409EFF] mt-0.5">已选择</span>
      </div>
      <!-- hover 操作层：更换 + 移除 -->
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto">
        <button class="px-2 py-1 bg-white/90 rounded text-[11px] text-[#333] hover:bg-white flex items-center gap-1" @click.stop="openDialog">
          <i class="ri-image-edit-line text-[12px]"></i>更换
        </button>
        <button v-if="clearable" class="px-2 py-1 bg-[#FF4D4F]/90 rounded text-[11px] text-white hover:bg-[#FF4D4F] flex items-center gap-1" @click.stop="clearValue">
          <i class="ri-delete-bin-line text-[12px]"></i>移除
        </button>
      </div>
    </div>
    <!-- 无图时：点击选择 -->
    <div
      v-else
      class="flex flex-col items-center justify-center border-2 border-dashed border-[#D9D9D9] rounded-lg hover:border-[#409EFF] transition-colors bg-[#FAFAFA] cursor-pointer"
      :style="{ width: previewSize + 'px', height: previewSize + 'px' }"
      @click="openDialog"
    >
      <i class="ri-image-add-line text-[24px] text-[#CCC]"></i>
      <span class="text-[11px] text-[#999] mt-1">选择图片</span>
    </div>
  </div>

  <!-- ====== Default Variant: Multiple ====== -->
  <div v-else class="flex flex-wrap gap-2">
    <div
      v-for="(url, idx) in (modelValue as string[])"
      :key="idx"
      class="relative group"
    >
      <!-- 已是完整 URL：点击预览，hover 显示更换/删除 -->
      <el-image
        v-if="url.includes('://')"
        :src="url"
        :preview-src-list="(modelValue as string[]).filter(u => u.includes('://'))"
        :initial-index="idx"
        preview-teleported
        fit="cover"
        class="rounded-lg border border-[#E8E8E8] block cursor-zoom-in"
        :style="{ width: previewSize + 'px', height: previewSize + 'px' }"
      />
      <div
        v-else
        class="rounded-lg border-2 border-[#409EFF] bg-[#F0F7FF] flex flex-col items-center justify-center cursor-pointer"
        :style="{ width: previewSize + 'px', height: previewSize + 'px' }"
        @click="openDialogForIndex(idx)"
      >
        <i class="ri-checkbox-circle-fill text-[#409EFF] text-[20px]"></i>
        <span class="text-[10px] text-[#409EFF] mt-0.5">已选择</span>
      </div>
      <!-- hover 操作层 -->
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto">
        <button class="px-1.5 py-0.5 bg-white/90 rounded text-[10px] text-[#333] hover:bg-white" @click.stop="openDialogForIndex(idx)">
          <i class="ri-image-edit-line"></i>
        </button>
        <button class="px-1.5 py-0.5 bg-[#FF4D4F]/90 rounded text-[10px] text-white hover:bg-[#FF4D4F]" @click.stop="removeAt(idx)">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    </div>
    <div
      class="flex flex-col items-center justify-center border-2 border-dashed border-[#D9D9D9] rounded-lg hover:border-[#409EFF] transition-colors bg-[#FAFAFA] cursor-pointer"
      :style="{ width: previewSize + 'px', height: previewSize + 'px' }"
      @click="openDialogForIndex(-1)"
    >
      <i class="ri-image-add-line text-[24px] text-[#CCC]"></i>
      <span class="text-[11px] text-[#999] mt-0.5">添加</span>
    </div>
  </div>

  <!-- ====== Shared Dialog (Redesigned) ====== -->
  <el-dialog
    v-model="dialogVisible"
    title="选择图片"
    width="840px"
    :destroy-on-close="false"
    :append-to-body="true"
  >
    <!-- Toolbar -->
    <div class="flex items-center gap-2 mb-2">
      <el-upload :show-file-list="false" :before-upload="handleDialogUpload" accept="image/*" :auto-upload="true">
        <el-button type="primary" size="small" :loading="dialogUploading">
          <i class="ri-upload-line mr-1"></i>上传图片
        </el-button>
      </el-upload>
      <el-select v-model="filterBizType" placeholder="全部分类" class="!w-[110px]" clearable size="small" @change="loadImages(1)">
        <el-option label="商品图" value="product" />
        <el-option label="分类图" value="category" />
        <el-option label="营销素材" value="marketing" />
        <el-option label="通用" value="common" />
      </el-select>
      <el-input v-model="searchKeyword" placeholder="搜索文件名" size="small" class="!w-[160px]" clearable>
        <template #prefix><i class="ri-search-line text-[#CCC]"></i></template>
      </el-input>
      <span class="text-[12px] text-[#999] ml-auto">共 {{ filteredImages.length }} 张</span>
    </div>

    <!-- URL import row -->
    <div class="flex items-center gap-2 mb-4 bg-[#F5F7FA] rounded-lg px-3 py-2">
      <i class="ri-links-line text-[#909399] text-[14px] flex-shrink-0"></i>
      <el-input
        v-model="importUrlInput"
        placeholder="粘贴外部图片 URL，服务端下载后转存到资源库（不支持直接使用外站链接）"
        size="small"
        class="flex-1"
        clearable
        :disabled="urlImporting"
        @keyup.enter="handleImportUrl"
      />
      <el-button size="small" :loading="urlImporting" :disabled="!importUrlInput.trim()" @click="handleImportUrl">
        <i v-if="!urlImporting" class="ri-download-cloud-line mr-1"></i>导入
      </el-button>
    </div>

    <!-- Image grid (4 columns) -->
    <div v-loading="listLoading" class="min-h-[320px]">
      <div v-if="filteredImages.length === 0 && !listLoading" class="flex flex-col items-center justify-center h-[320px] text-[#CCC]">
        <i class="ri-image-2-line text-[48px] mb-3"></i>
        <p class="text-[13px]">{{ searchKeyword ? '未找到匹配图片' : '暂无图片，点击上方按钮上传' }}</p>
      </div>
      <div v-else class="grid grid-cols-4 gap-3">
        <div
          v-for="img in filteredImages"
          :key="img.id"
          class="relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all"
          :class="isSelected(img) ? 'border-[#409EFF] shadow-md' : 'border-transparent hover:border-[#409EFF]/50'"
          @click="toggleSelect(img)"
        >
          <img :src="img.fileUrl" class="w-full aspect-square object-cover" loading="lazy" />
          <!-- Selected badge -->
          <div v-if="isSelected(img)" class="absolute top-1.5 right-1.5 w-5 h-5 bg-[#409EFF] rounded-full flex items-center justify-center shadow">
            <i class="ri-check-line text-white text-[11px]"></i>
          </div>
          <!-- File info bar -->
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
            <p class="text-white text-[10px] truncate leading-tight">{{ img.fileName }}</p>
            <p v-if="img.fileSize" class="text-white/70 text-[9px] leading-tight mt-0.5">{{ formatSize(img.fileSize) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="flex justify-center mt-4">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        small
        @current-change="loadImages"
      />
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <span class="text-[12px] text-[#999]">{{ selectedItems.length > 0 ? `已选 ${selectedItems.length} 张` : '未选择' }}</span>
        <div class="flex gap-2">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :disabled="selectedItems.length === 0" @click="confirm">确定选择</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { fileApi } from '@/utils/admin-api';

const props = withDefaults(defineProps<{
  modelValue?: string | string[];
  multiple?: boolean;
  previewSize?: number;
  clearable?: boolean;
  bizType?: string;
  variant?: 'default' | 'banner';
  height?: string;
  placeholder?: string;
}>(), {
  multiple: false,
  previewSize: 80,
  clearable: true,
  bizType: undefined,
  variant: 'default',
  height: '130px',
  placeholder: '粘贴图片 URL',
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | string[]): void;
}>();

// ===== Banner mode helpers =====
const singleValue = computed(() => props.multiple ? '' : (props.modelValue as string) || '');
const urlInput = ref(singleValue.value);
watch(singleValue, v => { urlInput.value = v; });

const isFullUrl = (v: string) => !!(v && v.includes('://'));

const clearValue = () => emit('update:modelValue', props.multiple ? [] : '');
const removeAt = (idx: number) => {
  const arr = [...(props.modelValue as string[])];
  arr.splice(idx, 1);
  emit('update:modelValue', arr);
};
const onUrlChange = () => {
  const v = urlInput.value?.trim() || '';
  if (v !== props.modelValue) emit('update:modelValue', v);
};

// ===== Dialog State =====
const dialogVisible = ref(false);
const listLoading = ref(false);
const dialogUploading = ref(false);
const bannerUploading = ref(false);
const urlImporting = ref(false);
const importUrlInput = ref('');
const images = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = 24;
const filterBizType = ref(props.bizType || '');
const searchKeyword = ref('');
const selectedItems = ref<any[]>([]);
let editingIndex = -1;

const filteredImages = computed(() => {
  if (!searchKeyword.value) return images.value;
  const kw = searchKeyword.value.toLowerCase();
  return images.value.filter(img => (img.fileName || '').toLowerCase().includes(kw));
});

// ===== Open / Load =====
const openDialog = () => {
  editingIndex = -1;
  selectedItems.value = [];
  loadImages(1);
  dialogVisible.value = true;
};

const openDialogForIndex = (idx: number) => {
  editingIndex = idx;
  selectedItems.value = [];
  loadImages(1);
  dialogVisible.value = true;
};

const loadImages = async (page = currentPage.value) => {
  listLoading.value = true;
  currentPage.value = page;
  try {
    const res: any = await fileApi.list(page, pageSize, filterBizType.value || undefined);
    const data = res.data?.data || res.data || {};
    images.value = Array.isArray(data) ? data : (data.records || []);
    total.value = Number(data.total) || images.value.length;
  } catch { /* interceptor handles */ }
  listLoading.value = false;
};

// ===== Selection =====
const isSelected = (img: any) => selectedItems.value.some(s => s.id === img.id);

const toggleSelect = (img: any) => {
  if (props.multiple && editingIndex === -1) {
    const idx = selectedItems.value.findIndex(s => s.id === img.id);
    if (idx >= 0) selectedItems.value.splice(idx, 1);
    else selectedItems.value.push(img);
  } else {
    selectedItems.value = [img];
  }
};

// ===== Confirm =====
const getKey = (item: any) => item.objectKey || item.fileUrl || '';

const confirm = () => {
  if (props.multiple) {
    const keys = selectedItems.value.map(getKey);
    if (editingIndex === -1) {
      emit('update:modelValue', [...((props.modelValue as string[]) || []), ...keys]);
    } else {
      const arr = [...(props.modelValue as string[])];
      arr[editingIndex] = keys[0];
      emit('update:modelValue', arr);
    }
  } else {
    const key = getKey(selectedItems.value[0]) || '';
    emit('update:modelValue', key);
    urlInput.value = key;
  }
  dialogVisible.value = false;
};

// ===== Import from URL =====
const handleImportUrl = async () => {
  const url = importUrlInput.value.trim();
  if (!url) return;
  urlImporting.value = true;
  try {
    const res: any = await fileApi.importFromUrl(url, filterBizType.value || props.bizType || 'common');
    const data = res.data?.data || res.data || {};
    ElMessage.success('导入成功');
    importUrlInput.value = '';
    await loadImages(1);
    const imported = images.value.find(img =>
      (data.objectKey && img.objectKey === data.objectKey) ||
      (data.id && String(img.id) === String(data.id))
    );
    if (imported) selectedItems.value = [imported];
  } catch (e: any) {
    ElMessage.error(e?.message || '导入失败，请检查 URL 是否有效且为图片链接');
  }
  urlImporting.value = false;
};

// ===== Upload: banner direct upload =====
const handleBannerUpload = async (file: File) => {
  bannerUploading.value = true;
  try {
    const res: any = await fileApi.upload(file, props.bizType || 'common');
    const data = res.data?.data || res.data || {};
    const key = data.objectKey || data.url || '';
    if (key) {
      emit('update:modelValue', key);
      urlInput.value = key;
      ElMessage.success('上传成功');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '上传失败');
  }
  bannerUploading.value = false;
  return false;
};

// ===== Upload: dialog upload (shows in grid) =====
const handleDialogUpload = async (file: File) => {
  dialogUploading.value = true;
  try {
    const res: any = await fileApi.upload(file, filterBizType.value || props.bizType || 'common');
    const data = res.data?.data || res.data || {};
    ElMessage.success('上传成功');
    await loadImages(1);
    const uploaded = images.value.find(img =>
      (data.objectKey && img.objectKey === data.objectKey) ||
      (data.id && String(img.id) === String(data.id))
    );
    if (uploaded) selectedItems.value = [uploaded];
  } catch (e: any) {
    ElMessage.error(e?.message || '上传失败');
  }
  dialogUploading.value = false;
  return false;
};

// ===== Helpers =====
const formatSize = (bytes: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
};
</script>
