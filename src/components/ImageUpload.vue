<template>
  <div class="image-upload">
    <!-- 预览区 -->
    <div
      v-if="modelValue"
      class="relative mb-2 rounded-xl overflow-hidden border border-[#E8E8E8] bg-[#F9F9F9] group cursor-pointer"
      :style="{ height: height }"
      @click="triggerUpload"
    >
      <!-- 完整 URL → 正常预览 -->
      <img
        v-if="isUrl(modelValue)"
        :src="modelValue"
        class="w-full h-full object-cover"
        @error="(e:any) => { e.target.style.opacity = 0.3 }"
      />
      <!-- objectKey（无 ://）→ 已选择状态 -->
      <div
        v-else
        class="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#EFF6FF]"
      >
        <i class="ri-checkbox-circle-fill text-[#409EFF] text-3xl"></i>
        <span class="text-[12px] text-[#409EFF] font-medium">图片已选择</span>
        <span class="text-[10px] text-[#409EFF]/70 px-3 text-center truncate max-w-full">{{ modelValue }}</span>
      </div>

      <!-- hover 遮罩 -->
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <el-button size="small" plain @click.stop="triggerUpload">
          <i class="ri-upload-2-line mr-1"></i>重新上传
        </el-button>
        <el-button size="small" plain @click.stop="openLibrary">
          <i class="ri-image-line mr-1"></i>资源库
        </el-button>
        <el-button size="small" type="danger" plain @click.stop="emit('update:modelValue', '')">
          <i class="ri-delete-bin-line mr-1"></i>移除
        </el-button>
      </div>
    </div>

    <!-- 无图片时的占位 -->
    <div
      v-else
      class="mb-2 rounded-xl border-2 border-dashed border-[#E8E8E8] bg-[#FAFAFA] flex flex-col items-center justify-center cursor-pointer hover:border-[#409EFF] hover:bg-[#EFF6FF]/30 transition-colors"
      :style="{ height: height }"
      @click="triggerUpload"
    >
      <i class="ri-image-add-line text-3xl text-[#CCC]"></i>
      <span class="text-[12px] text-[#999] mt-1.5">点击上传图片</span>
    </div>

    <!-- 操作栏 -->
    <div class="flex gap-2 items-center">
      <!-- 隐藏的上传触发器 -->
      <el-upload
        ref="uploadRef"
        :show-file-list="false"
        :before-upload="handleUpload"
        accept="image/*"
        :disabled="uploading"
        class="flex-shrink-0"
      >
        <el-button size="small" :loading="uploading" plain>
          <i class="ri-upload-2-line mr-1"></i>{{ uploading ? '上传中…' : '上传图片' }}
        </el-button>
      </el-upload>

      <!-- 从资源库选择 -->
      <el-button size="small" plain @click="openLibrary">
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

    <!-- 资源库弹窗（内嵌 MediaPicker 逻辑，避免循环依赖） -->
    <el-dialog
      v-model="libraryVisible"
      title="选择图片"
      width="820px"
      :append-to-body="true"
      :destroy-on-close="false"
    >
      <div class="flex items-center gap-3 mb-4">
        <el-upload :show-file-list="false" :before-upload="handleLibraryUpload" accept="image/*">
          <el-button type="primary" size="small" :loading="libraryUploading">
            <i class="ri-upload-line mr-1"></i>上传图片
          </el-button>
        </el-upload>
        <el-select v-model="libraryBizType" placeholder="全部分类" class="!w-[120px]" clearable size="small" @change="loadLibrary(1)">
          <el-option label="商品图" value="product" />
          <el-option label="分类图" value="category" />
          <el-option label="营销素材" value="marketing" />
          <el-option label="通用" value="common" />
        </el-select>
        <span class="text-[12px] text-[#999] ml-auto">共 {{ libraryTotal }} 张，点击图片选择</span>
      </div>

      <div v-loading="libraryLoading" class="min-h-[260px]">
        <div v-if="libraryImages.length === 0 && !libraryLoading" class="flex flex-col items-center justify-center h-[260px] text-[#CCC]">
          <i class="ri-image-2-line text-[48px] mb-3"></i>
          <p class="text-[13px]">暂无图片，点击上方按钮上传</p>
        </div>
        <div v-else class="grid grid-cols-6 gap-2">
          <div
            v-for="img in libraryImages"
            :key="img.id"
            class="relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all"
            :class="librarySelected?.id === img.id
              ? 'border-[#409EFF] shadow-md'
              : 'border-transparent hover:border-[#409EFF]/50'"
            @click="librarySelected = img"
          >
            <img :src="img.fileUrl" class="w-full aspect-square object-cover" loading="lazy" />
            <div v-if="librarySelected?.id === img.id" class="absolute top-1 right-1 w-5 h-5 bg-[#409EFF] rounded-full flex items-center justify-center">
              <i class="ri-check-line text-white text-[11px]"></i>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {{ img.fileName }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center mt-3">
        <el-pagination
          v-model:current-page="libraryPage"
          :page-size="24"
          :total="libraryTotal"
          layout="prev, pager, next"
          small
          @current-change="loadLibrary"
        />
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <span class="text-[12px] text-[#999]">{{ librarySelected ? `已选：${librarySelected.fileName}` : '未选择' }}</span>
          <div class="flex gap-2">
            <el-button @click="libraryVisible = false">取消</el-button>
            <el-button type="primary" :disabled="!librarySelected" @click="confirmLibrary">
              确定选择
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { fileApi } from '@/utils/admin-api';

const props = withDefaults(defineProps<{
  modelValue?: string;
  height?: string;
  placeholder?: string;
  bizType?: string;
}>(), {
  modelValue: '',
  height: '130px',
  placeholder: '粘贴图片 URL',
  bizType: 'common',
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
}>();

const uploading = ref(false);
const urlInput = ref(props.modelValue || '');
const uploadRef = ref<any>(null);

watch(() => props.modelValue, (v) => {
  urlInput.value = v || '';
});

// 判断是否为完整 URL（含 ://）
const isUrl = (v: string) => !!(v && v.includes('://'));

const triggerUpload = () => {
  uploadRef.value?.$el?.querySelector('input')?.click();
};

/**
 * 上传图片 → 取 objectKey（持久化存储，不过期）
 * 之前取 url（预签名 URL，2小时过期）是 bug
 */
const handleUpload = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件');
    return false;
  }
  uploading.value = true;
  try {
    const res: any = await fileApi.upload(file, props.bizType);
    const data = res.data?.data || res.data || {};
    // 优先取 objectKey，回退到 url（兼容旧接口）
    const key = data.objectKey || data.url || '';
    if (key) {
      emit('update:modelValue', key);
      urlInput.value = key;
      ElMessage.success('上传成功');
    } else {
      ElMessage.error('上传成功但未获取到资源标识');
    }
  } catch {
    ElMessage.error('图片上传失败，请检查网络或改用 URL 输入');
  }
  uploading.value = false;
  return false;
};

const onUrlChange = () => {
  const v = urlInput.value?.trim() || '';
  if (v !== props.modelValue) {
    emit('update:modelValue', v);
  }
};

// ── 资源库 ──────────────────────────────────────────────────────────────────
const libraryVisible = ref(false);
const libraryLoading = ref(false);
const libraryUploading = ref(false);
const libraryImages = ref<any[]>([]);
const libraryTotal = ref(0);
const libraryPage = ref(1);
const libraryBizType = ref('');
const librarySelected = ref<any>(null);

const loadLibrary = async (page = libraryPage.value) => {
  libraryLoading.value = true;
  libraryPage.value = page;
  try {
    const res: any = await fileApi.list(page, 24, libraryBizType.value || undefined);
    const data = res.data?.data || res.data || {};
    libraryImages.value = Array.isArray(data) ? data : (data.records || []);
    libraryTotal.value = data.total || libraryImages.value.length;
  } catch { /* ignore */ }
  libraryLoading.value = false;
};

const openLibrary = () => {
  librarySelected.value = null;
  libraryPage.value = 1;
  loadLibrary(1);
  libraryVisible.value = true;
};

const handleLibraryUpload = async (file: File) => {
  libraryUploading.value = true;
  try {
    await fileApi.upload(file, props.bizType || 'common');
    ElMessage.success('上传成功');
    await loadLibrary(1);
  } catch { ElMessage.error('上传失败'); }
  libraryUploading.value = false;
  return false;
};

const confirmLibrary = () => {
  if (!librarySelected.value) return;
  // 存 objectKey（持久化）
  const key = librarySelected.value.objectKey || librarySelected.value.fileUrl || '';
  emit('update:modelValue', key);
  urlInput.value = key;
  libraryVisible.value = false;
};
</script>
