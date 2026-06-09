<template>
  <div class="page">
    <!-- 快捷状态 Tab -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] mb-4 px-4 flex items-center gap-1 overflow-x-auto">
      <button
        v-for="tab in statusTabs" :key="tab.label"
        class="flex-shrink-0 px-4 py-3 text-[13px] border-b-2 transition-colors whitespace-nowrap"
        :class="search.status === tab.value
          ? 'border-[#FF6B00] text-[#FF6B00] font-medium'
          : 'border-transparent text-[#666] hover:text-[#333]'"
        @click="switchTab(tab.value)"
      >{{ tab.label }}</button>
    </div>

    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="帖子内容/用户名" class="!w-[200px]"
          clearable @keyup.enter="doSearch" />
        <el-select v-model="search.topicId" placeholder="所属话题" class="!w-[150px]" clearable @change="doSearch">
          <el-option v-for="t in topics" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
        <el-select v-model="search.hasImages" placeholder="图片" class="!w-[110px]" clearable @change="doSearch">
          <el-option label="含图片" :value="true" />
          <el-option label="仅文字" :value="false" />
        </el-select>
        <el-date-picker
          v-model="dateRange" type="daterange" range-separator="至"
          start-placeholder="发帖开始" end-placeholder="发帖结束"
          value-format="YYYY-MM-DD" size="default" class="!w-[260px]" @change="doSearch"
        />
        <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <el-button @click="resetSearch"><i class="ri-refresh-line mr-1"></i>重置</el-button>
      </div>
    </div>

    <!-- 帖子列表 -->
    <div class="space-y-3">
      <div v-if="loading" class="bg-white rounded-xl border border-[#F0F0F0] p-8 text-center">
        <i class="ri-loader-4-line text-[#FF6B00] text-2xl animate-spin"></i>
      </div>

      <div v-for="item in tableData" :key="item.id"
        class="bg-white rounded-xl border border-[#F0F0F0] p-4 hover:shadow-sm transition-shadow">
        <div class="flex gap-3">
          <img :src="item.userAvatar || item.avatar || AVATAR_PLACEHOLDER"
            class="w-9 h-9 rounded-full flex-shrink-0 object-cover" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="text-[13px] font-medium text-[#333]">{{ item.username || item.userId }}</span>
              <el-tag :type="statusTag(item.status)" size="small">{{ statusText(item.status) }}</el-tag>
              <span v-if="item.topicName" class="text-[11px] bg-[#FFF4E6] text-[#FF6B00] px-1.5 py-0.5 rounded-full">#{{ item.topicName }}</span>
              <span v-if="item.images?.length" class="text-[11px] text-[#999]">
                <i class="ri-image-line"></i> {{ item.images.length }}张
              </span>
              <span class="text-[11px] text-[#999] ml-auto">{{ item.createTime || item.createdAt }}</span>
            </div>
            <!-- 内容截断 3 行 -->
            <p class="text-[13px] text-[#555] mb-2 line-clamp-3">{{ item.content }}</p>
            <!-- 图片缩略（含 coverImage 兜底） -->
            <div v-if="allImages(item).length" class="flex gap-2 mb-2 flex-wrap">
              <img v-for="(img, i) in allImages(item).slice(0, 4)" :key="i" :src="img"
                class="w-16 h-16 rounded-lg object-cover border border-[#F0F0F0]" />
              <div v-if="allImages(item).length > 4"
                class="w-16 h-16 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#999] text-[12px] cursor-pointer"
                @click="openDetail(item)">
                +{{ allImages(item).length - 4 }}
              </div>
            </div>
            <!-- 视频标识 -->
            <div v-else-if="item.videoUrl" class="flex items-center gap-1 mb-2 text-[11px] text-[#999]">
              <i class="ri-video-line text-[#FF6B00]"></i> 包含视频
            </div>
            <!-- 统计 -->
            <div class="flex items-center gap-4 text-[11px] text-[#999]">
              <span><i class="ri-heart-line mr-0.5"></i>{{ item.likeCount || 0 }}</span>
              <span><i class="ri-chat-1-line mr-0.5"></i>{{ item.commentCount || 0 }}</span>
              <span><i class="ri-eye-line mr-0.5"></i>{{ formatNum(item.viewCount || 0) }}</span>
            </div>
          </div>
          <!-- 操作 -->
          <div class="flex flex-col gap-1.5 flex-shrink-0">
            <el-button type="primary" link size="small" @click="openDetail(item)">
              <i class="ri-eye-line mr-0.5"></i>详情
            </el-button>
            <el-button v-if="item.status === 0" type="success" size="small" plain @click="approve(item)">通过</el-button>
            <el-button v-if="item.status === 0" type="danger" size="small" plain @click="reject(item)">拒绝</el-button>
            <el-button v-if="item.status === 1" type="warning" size="small" plain @click="hide(item)">隐藏</el-button>
            <el-button v-if="item.status === -1 || item.status === -2" size="small" plain @click="restore(item)">恢复</el-button>
            <el-button type="danger" size="small" plain @click="deletePost(item)">删除</el-button>
          </div>
        </div>
      </div>

      <div v-if="!loading && tableData.length === 0" class="bg-white rounded-xl border border-[#F0F0F0] p-12 text-center">
        <i class="ri-file-list-3-line text-4xl text-[#DDD]"></i>
        <p class="text-[#999] mt-2 text-[13px]">暂无内容</p>
      </div>
    </div>

    <div class="flex justify-end mt-4">
      <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="doSearch" />
    </div>

    <!-- 帖子详情抽屉 -->
    <el-drawer v-model="detailVisible" title="帖子详情" size="520px" direction="rtl" :destroy-on-close="true">
      <template v-if="detailItem">
        <!-- 用户信息 -->
        <div class="flex items-center gap-3 mb-4 pb-4 border-b border-[#F0F0F0]">
          <img :src="detailItem.userAvatar || AVATAR_PLACEHOLDER"
            class="w-11 h-11 rounded-full object-cover flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="text-[14px] font-medium text-[#333]">{{ detailItem.username || detailItem.userId }}</div>
            <div class="text-[12px] text-[#999] mt-0.5">{{ detailItem.createTime || detailItem.createdAt }}</div>
          </div>
          <el-tag :type="statusTag(detailItem.status)" size="small">{{ statusText(detailItem.status) }}</el-tag>
        </div>

        <!-- 话题 -->
        <div v-if="detailItem.topicName" class="mb-3">
          <span class="text-[12px] bg-[#FFF4E6] text-[#FF6B00] px-2 py-0.5 rounded-full font-medium">
            #{{ detailItem.topicName }}
          </span>
        </div>

        <!-- 完整文本内容 -->
        <p class="text-[14px] text-[#333] leading-relaxed whitespace-pre-line mb-4">{{ detailItem.content }}</p>

        <!-- 视频 -->
        <div v-if="detailItem.videoUrl" class="mb-4 rounded-xl overflow-hidden bg-black">
          <video :src="detailItem.videoUrl" controls class="w-full max-h-[320px] object-contain" />
        </div>

        <!-- 图片（后端已将 coverImage 合并进 images，直接展示） -->
        <div v-if="allImages(detailItem).length" class="mb-4">
          <div class="text-[12px] text-[#999] mb-2">图片（{{ allImages(detailItem).length }}张）</div>
          <div class="grid grid-cols-3 gap-2">
            <img v-for="(img, i) in allImages(detailItem)" :key="i" :src="img"
              class="w-full aspect-square rounded-lg object-cover border border-[#F0F0F0] cursor-pointer"
              @click="previewImg = img; previewVisible = true" />
          </div>
        </div>

        <!-- 统计 -->
        <div class="flex items-center gap-6 py-3 px-4 bg-[#FAFAFA] rounded-xl mb-4 text-[13px] text-[#666]">
          <span><i class="ri-heart-line mr-1 text-[#FF4D4F]"></i>{{ detailItem.likeCount || 0 }} 点赞</span>
          <span><i class="ri-chat-1-line mr-1 text-[#165DFF]"></i>{{ detailItem.commentCount || 0 }} 评论</span>
          <span><i class="ri-eye-line mr-1 text-[#999]"></i>{{ formatNum(detailItem.viewCount || 0) }} 浏览</span>
        </div>

        <!-- 操作 -->
        <div class="flex gap-2 flex-wrap pt-4 border-t border-[#F0F0F0]">
          <el-button v-if="detailItem.status === 0" type="success" @click="approve(detailItem); detailVisible = false">
            <i class="ri-check-line mr-1"></i>通过
          </el-button>
          <el-button v-if="detailItem.status === 0" type="danger" plain @click="reject(detailItem); detailVisible = false">
            <i class="ri-close-line mr-1"></i>拒绝
          </el-button>
          <el-button v-if="detailItem.status === 1" type="warning" plain @click="hide(detailItem); detailVisible = false">
            <i class="ri-eye-off-line mr-1"></i>隐藏
          </el-button>
          <el-button v-if="detailItem.status === -1 || detailItem.status === -2" plain @click="restore(detailItem); detailVisible = false">
            <i class="ri-refresh-line mr-1"></i>恢复
          </el-button>
          <el-button type="danger" plain @click="deletePost(detailItem); detailVisible = false">
            <i class="ri-delete-bin-line mr-1"></i>删除
          </el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 图片大图预览 -->
    <el-image-viewer v-if="previewVisible" :url-list="[previewImg]" @close="previewVisible = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import client from '@/utils/http';
import { AVATAR_PLACEHOLDER } from '@/utils/image';
import { useListPage } from '@/composables/useListPage';

const topics = ref<any[]>([]);

const { loading, tableData, total, pageNum, pageSize, search, dateRange, doSearch, resetSearch } =
  useListPage(
    (p) => client.get('/app/content/posts/admin', { params: {
      pageNum: p.pageNum, pageSize: p.pageSize,
      keyword:   p.keyword   || undefined,
      status:    p.status    ?? undefined,
      topicId:   p.topicId   ?? undefined,
      hasImages: p.hasImages ?? undefined,
      startDate: p.startDate || undefined,
      endDate:   p.endDate   || undefined,
    }}),
    { keyword: '', status: null as number | null, topicId: null as number | null, hasImages: null as boolean | null },
  );

// ── 详情抽屉 ───────────────────────────────────────────────────────────────────
const detailVisible = ref(false);
const detailItem = ref<any>(null);
const previewVisible = ref(false);
const previewImg = ref('');

const openDetail = (item: any) => {
  detailItem.value = item;
  detailVisible.value = true;
};

// ── 状态配置 ───────────────────────────────────────────────────────────────────
const statusTabs = [
  { label: '全部', value: null },
  { label: '待审核', value: 0 },
  { label: '已发布', value: 1 },
  { label: '已拒绝', value: -1 },
  { label: '已隐藏', value: -2 },
];

const statusText = (s: number) => ({ 1: '已发布', 0: '待审核', '-1': '已拒绝', '-2': '已隐藏' }[String(s)] || '未知');
const statusTag = (s: number): any => ({ 1: 'success', 0: 'warning', '-1': 'danger', '-2': 'info' }[String(s)] || 'info');
const formatNum = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + 'w' : String(n);

const allImages = (item: any): string[] => {
  const imgs: string[] = Array.isArray(item.images) ? item.images : [];
  if (item.coverImage && !imgs.includes(item.coverImage)) return [item.coverImage, ...imgs];
  return imgs;
};

const switchTab = (status: number | null) => {
  search.status = status;
  doSearch();
};

// ── 话题选项（独立加载，不走 useListPage）───────────────────────────────────────
const loadTopics = async () => {
  try {
    const res: any = await client.get('/app/content/topics', { params: { pageSize: 100 } });
    const data = (res as any).data?.data || (res as any).data || {};
    topics.value = Array.isArray(data) ? data : (data.records || []);
  } catch { /* ignore topics error */ }
};

// ── 审核操作 ───────────────────────────────────────────────────────────────────
const approve = async (item: any) => {
  try {
    await client.put(`/app/content/posts/${item.id}/approve`);
    item.status = 1;
    ElMessage.success('已通过');
  } catch { ElMessage.error('操作失败'); }
};

const reject = async (item: any) => {
  try {
    await client.put(`/app/content/posts/${item.id}/reject`);
    item.status = -1;
    ElMessage.success('已拒绝');
  } catch { ElMessage.error('操作失败'); }
};

const hide = async (item: any) => {
  try {
    await client.put(`/app/content/posts/${item.id}/hide`);
    item.status = -2;
    ElMessage.success('已隐藏');
  } catch { ElMessage.error('操作失败'); }
};

const restore = async (item: any) => {
  try {
    await client.put(`/app/content/posts/${item.id}/restore`);
    item.status = 1;
    ElMessage.success('已恢复');
  } catch { ElMessage.error('操作失败'); }
};

const deletePost = async (item: any) => {
  try {
    await ElMessageBox.confirm('确定删除该帖子？此操作不可恢复', '删除确认', { type: 'warning' });
    await client.delete(`/app/content/posts/${item.id}`);
    tableData.value = tableData.value.filter(p => p.id !== item.id);
    if (detailItem.value?.id === item.id) detailVisible.value = false;
    ElMessage.success('已删除');
  } catch { /* user cancelled */ }
};

onMounted(() => loadTopics()); // useListPage 已自动加载列表
</script>
