<template>
  <div
    class="page"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- 拖拽全屏覆盖�?-->
    <Transition name="fade">
      <div
        v-if="isDragging"
        class="fixed inset-0 z-50 bg-[#409EFF]/10 border-4 border-dashed border-[#409EFF] pointer-events-none flex flex-col items-center justify-center"
      >
        <i class="ri-upload-cloud-2-line text-[80px] text-[#409EFF]"></i>
        <p class="text-[22px] font-semibold text-[#409EFF] mt-3">松开鼠标即可上传</p>
        <p class="text-[13px] text-[#409EFF]/70 mt-1">支持同时拖入多张图片</p>
      </div>
    </Transition>

    <!-- 工具�?-->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4 flex items-center gap-3 flex-wrap">
      <!-- 搜索 -->
      <el-input
        v-model="searchKeyword"
        placeholder="搜索文件名称"
        class="!w-[200px]"
        clearable
        @input="debouncedSearch"
        @clear="doSearch"
      >
        <template #prefix><i class="ri-search-line text-[#999]"></i></template>
      </el-input>

      <!-- 分类筛选 -->
      <el-select v-model="filterBizType" placeholder="全部分类" class="!w-[130px]" clearable @change="doSearch">
        <el-option label="商品图" value="product" />
        <el-option label="分类图" value="category" />
        <el-option label="营销素材" value="marketing" />
        <el-option label="通用" value="common" />
      </el-select>

      <div class="w-px h-5 bg-[#F0F0F0]"></div>

      <!-- 上传分类 -->
      <el-select v-model="uploadBizType" class="!w-[110px]">
        <el-option label="商品图" value="product" />
        <el-option label="分类图" value="category" />
        <el-option label="营销素材" value="marketing" />
        <el-option label="通用" value="common" />
      </el-select>

      <el-upload :show-file-list="false" :before-upload="handleUpload" accept="image/*" multiple>
        <el-button type="primary">
          <i class="ri-upload-cloud-line mr-1"></i>上传图片
        </el-button>
      </el-upload>

      <el-upload :show-file-list="false" :before-upload="handleUpload" accept="video/*">
        <el-button plain>
          <i class="ri-video-upload-line mr-1"></i>上传视频
        </el-button>
      </el-upload>

      <div class="ml-auto flex items-center gap-1.5 text-[12px] text-[#CCC]">
        <i class="ri-drag-drop-line text-[15px]"></i>
        <span>支持拖拽上传</span>
      </div>
    </div>

    <!-- 上传进度队列 -->
    <Transition name="slide">
      <div v-if="uploadQueue.length > 0" class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-[13px] font-semibold text-[#333]">上传队列</span>
            <span class="text-[12px] text-[#999]">
              {{ uploadQueue.filter(f => f.status === 'done').length }}/{{ uploadQueue.length }} 完成
            </span>
          </div>
          <el-button
            v-if="!uploadQueue.some(f => f.status === 'uploading')"
            size="small"
            text
            @click="uploadQueue = []"
          >清空</el-button>
        </div>
        <div class="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
          <div
            v-for="item in uploadQueue"
            :key="item.name + item.size"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg border"
            :class="{
              'border-[#D1FAE5] bg-[#F0FFF4]': item.status === 'done',
              'border-[#FFE4E6] bg-[#FFF1F2]': item.status === 'error',
              'border-[#DBEAFE] bg-[#EFF6FF]': item.status === 'uploading',
            }"
          >
            <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="{
                'bg-[#00B578]/10': item.status === 'done',
                'bg-[#FF4D4F]/10': item.status === 'error',
                'bg-[#409EFF]/10': item.status === 'uploading',
              }">
              <i v-if="item.status === 'done'" class="ri-check-line text-[#00B578]"></i>
              <i v-else-if="item.status === 'error'" class="ri-close-line text-[#FF4D4F]"></i>
              <i v-else class="ri-loader-4-line text-[#409EFF] animate-spin"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] text-[#333] truncate">{{ item.name }}</p>
              <p class="text-[10px] leading-tight"
                :class="item.status === 'done' ? 'text-[#00B578]' : item.status === 'error' ? 'text-[#FF4D4F]' : 'text-[#999]'">
                {{ item.status === 'done' ? '✓ 上传成功' : item.status === 'error' ? (item.error || '上传失败') : '上传中...' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Admin 文件夹目录 ──────────────────────────────────────────────── -->
    <template v-if="isAdmin">
      <!-- 文件夹列表（未选中文件夹时展示） -->
      <div v-if="inFolderView" class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
        <div class="flex items-center gap-2 mb-4">
          <i class="ri-folder-open-line text-[#FF6B00] text-lg"></i>
          <span class="text-[13px] font-semibold text-[#333]">图片文件夹</span>
          <span class="text-[12px] text-[#999] ml-1">共 {{ folders.length }} 个文件夹</span>
        </div>
        <div v-if="folderLoading" class="grid grid-cols-4 gap-3">
          <div v-for="i in 4" :key="i" class="h-[72px] rounded-xl bg-[#F5F5F5] animate-pulse"></div>
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div
            v-for="folder in folders" :key="String(folder.shopId)"
            class="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[#F0F0F0] bg-[#FAFAFA] hover:border-[#FFD6B0] hover:bg-[#FFF9F5] cursor-pointer transition-all group"
            @click="enterFolder(folder)"
          >
            <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              :class="folder.shopId === null ? 'bg-[#EEF3FF]' : 'bg-[#FFF4E6]'">
              <i class="ri-folder-fill text-xl" :class="folder.shopId === null ? 'text-[#165DFF]' : 'text-[#FF6B00]'"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[13px] font-medium text-[#333] truncate group-hover:text-[#FF6B00] transition-colors">
                {{ folder.displayName || folder.shopName }}
              </div>
              <div class="text-[11px] text-[#999] mt-0.5">{{ folder.imageCount }} 张图片</div>
            </div>
            <i class="ri-arrow-right-s-line text-[#CCC] group-hover:text-[#FF6B00] transition-colors text-[15px]"></i>
          </div>
        </div>
      </div>

      <!-- 已进入某文件夹：显示返回按钮 + 面包屑 -->
      <div v-if="selectedFolder !== null" class="flex items-center gap-2 mb-3 bg-white rounded-xl border border-[#F0F0F0] px-4 py-2.5">
        <button class="flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#FF6B00] transition-colors" @click="backToFolders">
          <i class="ri-arrow-left-s-line text-base"></i>全部文件夹
        </button>
        <span class="text-[#E0E0E0]">/</span>
        <span class="text-[12px] font-medium text-[#333]">
          <i class="ri-folder-fill text-[#FF6B00] mr-1"></i>{{ selectedFolder.displayName }}
        </span>
      </div>
    </template>

    <!-- 操作区（文件夹首页时隐藏） -->
    <div v-if="!inFolderView" class="flex items-center justify-between mb-3 px-1">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5 cursor-pointer" @click="toggleSelectAll">
          <div
            class="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
            :class="
              selected.length > 0 && selected.length === images.length
                ? 'bg-[#409EFF] border-[#409EFF]'
                : selected.length > 0
                ? 'border-[#409EFF] bg-white'
                : 'border-[#D0D0D0] bg-white'
            "
          >
            <i v-if="selected.length === images.length && images.length > 0" class="ri-check-line text-white text-[10px]"></i>
            <div v-else-if="selected.length > 0" class="w-2 h-0.5 bg-[#409EFF] rounded-full"></div>
          </div>
          <span class="text-[12px] text-[#666]">全选当前页</span>
        </div>
        <span v-if="selected.length > 0" class="text-[12px] text-[#409EFF] font-medium">已选 {{ selected.length }} 项</span>
        <span v-else class="text-[13px] text-[#666]">共 <b class="text-[#333]">{{ total }}</b> 个资源</span>
      </div>
      <el-button v-if="selected.length > 0" type="danger" plain size="small" @click="batchDelete">
        <i class="ri-delete-bin-line mr-1"></i>删除所选 ({{ selected.length }})
      </el-button>
    </div>

    <!-- 图片网格（文件夹首页时隐藏） -->
    <div v-if="!inFolderView" class="bg-white rounded-xl border border-[#F0F0F0] p-4">
      <div v-loading="loading" class="min-h-[300px]">

        <!-- 空状态 -->
        <EmptyState
          v-if="images.length === 0 && !loading"
          icon="ri-image-2-line"
          :tip="searchKeyword || filterBizType ? '没有匹配的资源' : '暂无图片资源'"
          :sub-tip="searchKeyword || filterBizType ? '请尝试调整筛选条件' : '点击上方按钮或直接拖拽图片到此页面上传'"
        />

        <!-- 网格 -->
        <div
          v-else
          class="grid gap-3"
          style="grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));"
        >
          <div
            v-for="img in images"
            :key="img.id"
            class="group relative rounded-xl overflow-hidden border-2 transition-all duration-200"
            :class="isSelected(img)
              ? 'border-[#409EFF] shadow-[0_0_0_3px_rgba(64,158,255,0.15)]'
              : 'border-[#F0F0F0] hover:border-[#409EFF]/50 hover:shadow-sm'"
          >
            <!-- 图片主体：点�?�?预览 -->
            <div class="aspect-square bg-[#F5F5F5] cursor-pointer" @click="openPreview(img)">
              <img
                :src="img.fileUrl"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>

            <!-- bizType 标签 -->
            <div
              v-if="img.bizType"
              class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium leading-none shadow-sm"
              :class="bizTypeStyle(img.bizType)"
            >{{ bizTypeShort(img.bizType) }}</div>

            <!-- 复选框（左上角，点�?�?选择�?-->
            <div
              class="absolute top-1.5 left-1.5 w-[18px] h-[18px] rounded-full border-2 border-white shadow transition-all flex items-center justify-center cursor-pointer z-10"
              :class="isSelected(img) ? 'bg-[#409EFF]' : 'bg-black/30 opacity-0 group-hover:opacity-100'"
              @click.stop="toggleSelect(img)"
            >
              <i v-if="isSelected(img)" class="ri-check-line text-white text-[10px]"></i>
            </div>

            <!-- hover 操作�?-->
            <div class="absolute inset-x-0 bottom-[46px] flex items-end justify-between gap-1 px-1.5 pb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                class="flex-1 h-6 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] text-[#333] hover:bg-white hover:text-[#409EFF] transition-colors font-medium"
                @click.stop="copyUrl(img.fileUrl)"
              ><i class="ri-links-line mr-0.5"></i>复制链接</button>
              <button
                class="w-6 h-6 rounded-lg bg-[#FF4D4F]/90 backdrop-blur-sm text-white hover:bg-[#FF4D4F] transition-colors flex items-center justify-center"
                @click.stop="deleteOne(img)"
              ><i class="ri-delete-bin-line text-[11px]"></i></button>
            </div>

            <!-- 文件信息 -->
            <div class="px-2 py-1.5 bg-white border-t border-[#F0F0F0]">
              <p class="text-[10px] text-[#555] truncate leading-tight font-medium">{{ img.fileName }}</p>
              <p class="text-[10px] text-[#BBB] leading-tight mt-0.5">{{ formatSize(img.fileSize) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="flex justify-center mt-4 pt-4 border-t border-[#F5F5F5]">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, jumper, total"
          background
          @current-change="(p: number) => loadImages(p)"
        />
      </div>
    </div>

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="资源详情"
      width="700px"
      :append-to-body="true"
      :destroy-on-close="true"
    >
      <div v-if="previewItem" class="flex gap-5">
        <!-- 左：图片大图 -->
        <div
          class="w-[280px] h-[280px] flex-shrink-0 bg-[#F5F5F5] rounded-xl overflow-hidden flex items-center justify-center border border-[#F0F0F0]"
          style="background-image: repeating-conic-gradient(#e5e5e5 0% 25%, #f5f5f5 0% 50%) 0 0/16px 16px;"
        >
          <img :src="previewItem.fileUrl" class="max-w-full max-h-full object-contain" />
        </div>

        <!-- 右：文件信息 -->
        <div class="flex-1 min-w-0 flex flex-col gap-3">
          <div>
            <div class="text-[11px] text-[#999] mb-1">文件名</div>
            <div class="text-[13px] text-[#333] font-medium break-all leading-snug">{{ previewItem.fileName }}</div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <div class="text-[11px] text-[#999] mb-1">文件大小</div>
              <div class="text-[13px] text-[#333]">{{ formatSize(previewItem.fileSize) }}</div>
            </div>
            <div>
              <div class="text-[11px] text-[#999] mb-1">资源分类</div>
              <span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium" :class="bizTypeStyle(previewItem.bizType)">
                {{ bizTypeLabel(previewItem.bizType) }}
              </span>
            </div>
          </div>
          <div v-if="previewItem.createdAt">
            <div class="text-[11px] text-[#999] mb-1">上传时间</div>
            <div class="text-[13px] text-[#333]">{{ previewItem.createdAt }}</div>
          </div>

          <!-- objectKey -->
          <div>
            <div class="text-[11px] text-[#999] mb-1.5 flex items-center gap-1">
              对象键
              <el-tooltip content="持久化存储用，不会过期" placement="top">
                <i class="ri-information-line text-[#CCC] cursor-help"></i>
              </el-tooltip>
            </div>
            <div class="flex items-center gap-1.5 bg-[#F5F5F5] rounded-lg px-2.5 py-2">
              <code class="text-[11px] text-[#555] flex-1 break-all leading-relaxed select-all">{{ previewItem.objectKey }}</code>
              <button
                class="w-6 h-6 rounded flex items-center justify-center text-[#999] hover:text-[#409EFF] hover:bg-[#EFF6FF] transition-colors flex-shrink-0"
                @click="copyUrl(previewItem.objectKey)"
              ><i class="ri-file-copy-line text-[13px]"></i></button>
            </div>
          </div>

          <!-- 访问链接 -->
          <div>
            <div class="text-[11px] text-[#999] mb-1.5 flex items-center gap-1">
              访问链接
              <el-tooltip content="预签名URL，2小时内有效" placement="top">
                <i class="ri-information-line text-[#CCC] cursor-help"></i>
              </el-tooltip>
            </div>
            <div class="flex items-start gap-1.5 bg-[#F5F5F5] rounded-lg px-2.5 py-2">
              <span class="text-[11px] text-[#555] flex-1 break-all line-clamp-3 leading-relaxed">{{ previewItem.fileUrl }}</span>
              <button
                class="w-6 h-6 rounded flex items-center justify-center text-[#999] hover:text-[#409EFF] hover:bg-[#EFF6FF] transition-colors flex-shrink-0 mt-0.5"
                @click="copyUrl(previewItem.fileUrl)"
              ><i class="ri-file-copy-line text-[13px]"></i></button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <el-button type="danger" plain size="small" @click="() => { previewVisible = false; deleteOne(previewItem!) }">
            <i class="ri-delete-bin-line mr-1"></i>删除此资源
          </el-button>
          <el-button @click="previewVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { fileApi } from '@/utils/admin-api';
import { usePermission } from '@/utils/permission';
import EmptyState from '@/components/EmptyState.vue';

const { isAdmin } = usePermission();

// ── Admin 文件夹目录（按店铺分组）───────────────────────────────────────────
const folderLoading = ref(false);
const folders = ref<any[]>([]);
const selectedFolder = ref<{ shopId: number | null; displayName: string } | null>(null);
const inFolderView = computed(() => isAdmin && selectedFolder.value === null && folders.value.length > 0);

const loadFolders = async () => {
  if (!isAdmin) return;
  folderLoading.value = true;
  try {
    const res: any = await fileApi.listShopFolders();
    folders.value = res.data?.data || res.data || [];
  } catch { /* ignore */ }
  finally { folderLoading.value = false; }
};

const enterFolder = (folder: any) => {
  selectedFolder.value = { shopId: folder.shopId ?? null, displayName: folder.displayName || folder.shopName };
  loadImages(1);
};

const backToFolders = () => {
  selectedFolder.value = null;
  images.value = [];
  total.value = 0;
};

// ── 状态 ──────────────────────────────────────────────────────────────────────
const loading = ref(false);
const images = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = 40;

const filterBizType = ref('');
const searchKeyword = ref('');
const uploadBizType = ref('common');

const selected = ref<any[]>([]);
const isDragging = ref(false);

const previewVisible = ref(false);
const previewItem = ref<any>(null);

// 上传进度队列
interface QueueItem { name: string; size: number; status: 'uploading' | 'done' | 'error'; error?: string }
const uploadQueue = ref<QueueItem[]>([]);

// ── 加载 ──────────────────────────────────────────────────────────────────────
const loadImages = async (page = currentPage.value) => {
  loading.value = true;
  currentPage.value = page;
  try {
    const shopIdParam = isAdmin && selectedFolder.value !== undefined && selectedFolder.value !== null
      ? selectedFolder.value.shopId
      : undefined;
    const res: any = await fileApi.list(page, pageSize, filterBizType.value || undefined, searchKeyword.value || undefined, shopIdParam);
    const data = res.data?.data || res.data || {};
    images.value = Array.isArray(data) ? data : (data.records || []);
    total.value = Number(data.total) || images.value.length;
    // 当前页变化时清空选中
    selected.value = [];
  } catch { /* interceptor handles */ }
  finally { loading.value = false; }
};

const doSearch = () => loadImages(1);

// 防抖搜索
let searchTimer: ReturnType<typeof setTimeout> | null = null;
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => doSearch(), 400);
};

// ── 选择 ──────────────────────────────────────────────────────────────────────
const isSelected = (img: any) => selected.value.some(s => s.id === img.id);
const toggleSelect = (img: any) => {
  const idx = selected.value.findIndex(s => s.id === img.id);
  if (idx >= 0) selected.value.splice(idx, 1);
  else selected.value.push(img);
};
const toggleSelectAll = () => {
  if (selected.value.length === images.value.length) {
    selected.value = [];
  } else {
    selected.value = [...images.value];
  }
};

// ── 拖拽 ──────────────────────────────────────────────────────────────────────
const onDragLeave = (e: DragEvent) => {
  // 只有真正离开窗口时才重置
  if (e.relatedTarget === null) isDragging.value = false;
};

const handleDrop = async (e: DragEvent) => {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
  if (!files.length) { ElMessage.warning('仅支持图片文件'); return; }
  for (const file of files) {
    await handleUpload(file);
  }
};

// ── 上传 ──────────────────────────────────────────────────────────────────────
const handleUpload = async (file: File) => {
  const item: QueueItem = { name: file.name, size: file.size, status: 'uploading' };
  uploadQueue.value.push(item);
  try {
    await fileApi.upload(file, uploadBizType.value);
    item.status = 'done';
  } catch (e: any) {
    item.status = 'error';
    item.error = e?.response?.data?.msg || e?.message || '上传失败';
  }
  // 上传完后刷新（延迟一下，等所有文件上传完�?  await loadImages(1);
  return false;
};

// ── 预览 ──────────────────────────────────────────────────────────────────────
const openPreview = (img: any) => {
  previewItem.value = img;
  previewVisible.value = true;
};

// ── 复制 ──────────────────────────────────────────────────────────────────────
const copyUrl = (text: string) => {
  if (!text) return;
  navigator.clipboard.writeText(text)
    .then(() => ElMessage.success('已复制到剪贴板'))
    .catch(() => ElMessage.info(text));
};

// ── 删除 ──────────────────────────────────────────────────────────────────────
const deleteOne = async (img: any) => {
  if (!img) return;
  try {
    await ElMessageBox.confirm(`确定删除「${img.fileName}」？此操作不可撤销。`, '删除确认', {
      type: 'warning', confirmButtonText: '确定删除', confirmButtonClass: 'el-button--danger',
    });
    await fileApi.remove(img.id);
    ElMessage.success('已删除');
    images.value = images.value.filter(i => i.id !== img.id);
    selected.value = selected.value.filter(i => i.id !== img.id);
    total.value = Math.max(0, total.value - 1);
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败');
  }
};

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selected.value.length} 个资源？此操作不可撤销。`,
      '批量删除',
      { type: 'warning', confirmButtonText: '确定删除', confirmButtonClass: 'el-button--danger' },
    );
    let successCount = 0;
    for (const img of [...selected.value]) {
      try { await fileApi.remove(img.id); successCount++; } catch { /* interceptor handles */ }
    }
    ElMessage.success(`已删除 ${successCount} 个资源`);
    selected.value = [];
    await loadImages(1);
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '操作失败');
  }
};

// ── 工具函数 ──────────────────────────────────────────────────────────────────
const formatSize = (bytes: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const BIZ_CONFIG: Record<string, { label: string; short: string; style: string }> = {
  product:   { label: '商品图',   short: '商品', style: 'bg-[#EFF6FF] text-[#1677FF]' },
  category:  { label: '分类图',   short: '分类', style: 'bg-[#F0FFF4] text-[#00B578]' },
  marketing: { label: '营销素材', short: '营销', style: 'bg-[#FFF4E6] text-[#FF6B00]' },
  common:    { label: '通用',     short: '通用', style: 'bg-[#F5F5F5] text-[#666]' },
  banner:    { label: 'Banner',   short: 'BNR',  style: 'bg-[#FFF0F6] text-[#C41D7F]' },
};
const bizTypeLabel = (t: string) => BIZ_CONFIG[t]?.label || t || '未分类';
const bizTypeShort = (t: string) => BIZ_CONFIG[t]?.short || t?.slice(0, 2) || '?';
const bizTypeStyle = (t: string) => BIZ_CONFIG[t]?.style || 'bg-[#F5F5F5] text-[#999]';

onMounted(async () => {
  if (isAdmin) {
    await loadFolders();
    // 有文件夹则先展示目录，无文件夹则直接加载图片
    if (folders.value.length === 0) loadImages(1);
  } else {
    loadImages(1);
  }
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
