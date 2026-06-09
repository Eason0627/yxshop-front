<template>
  <div class="page">
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="用户名/商品名" class="!w-[180px]"
          clearable @keyup.enter="doSearch" />

        <!-- 星级 -->
        <el-select v-model="search.rating" placeholder="星级筛选" class="!w-[120px]" clearable @change="doSearch">
          <el-option label="5星好评" :value="5" />
          <el-option label="4星" :value="4" />
          <el-option label="3星中评" :value="3" />
          <el-option label="2星" :value="2" />
          <el-option label="1星差评" :value="1" />
        </el-select>

        <!-- 审核状态 -->
        <el-select v-model="search.status" placeholder="审核状态" class="!w-[120px]" clearable @change="doSearch">
          <el-option label="已审核" :value="1" />
          <el-option label="待审核" :value="0" />
          <el-option label="已屏蔽" :value="-1" />
        </el-select>

        <!-- 是否有图 -->
        <el-select v-model="search.hasImages" placeholder="含图片" class="!w-[110px]" clearable @change="doSearch">
          <el-option label="含图片" :value="true" />
          <el-option label="仅文字" :value="false" />
        </el-select>

        <!-- 是否已回复 -->
        <el-select v-model="search.hasReply" placeholder="回复状态" class="!w-[120px]" clearable @change="doSearch">
          <el-option label="已回复" :value="true" />
          <el-option label="未回复" :value="false" />
        </el-select>

        <!-- 评价日期 -->
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="评价开始"
          end-placeholder="评价结束"
          value-format="YYYY-MM-DD"
          size="default"
          class="!w-[260px]"
          @change="doSearch"
        />

        <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <el-button @click="resetSearch"><i class="ri-refresh-line mr-1"></i>重置</el-button>
      </div>
    </div>

    <div class="space-y-3">
      <div v-if="loading" class="bg-white rounded-xl border border-[#F0F0F0] p-8 text-center">
        <i class="ri-loader-4-line text-[#FF6B00] text-2xl animate-spin"></i>
      </div>
      <div v-for="item in tableData" :key="item.id"
        class="bg-white rounded-xl border border-[#F0F0F0] p-4 hover:shadow-sm transition-shadow">
        <div class="flex items-start gap-4">
          <!-- 用户信息 -->
          <img :src="item.userAvatar || item.avatar || AVATAR_PLACEHOLDER"
            class="w-9 h-9 rounded-full object-cover flex-shrink-0"
            @error="(e: any) => (e.target.src = AVATAR_PLACEHOLDER)" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="text-[13px] font-medium text-[#333]">{{ item.username || item.userId }}</span>
              <!-- 星级 -->
              <span class="text-[#FF9500] text-[13px]">
                {{ '★'.repeat(item.rating || 5) }}{{ '☆'.repeat(5 - (item.rating || 5)) }}
              </span>
              <el-tag :type="statusTag(item.status)" size="small">{{ statusText(item.status) }}</el-tag>
              <el-tag v-if="item.reply" type="success" size="small" plain>已回复</el-tag>
              <span class="text-[11px] text-[#999] ml-auto">{{ safeFormat(item.createTime || item.createdAt) }}</span>
            </div>
            <!-- 商品信息 -->
            <div v-if="item.productName || item.productId" class="flex items-center gap-2 mb-2 bg-[#FAFAFA] rounded-lg px-2 py-1 w-fit">
              <img v-if="item.productImage" :src="item.productImage" class="w-6 h-6 rounded object-cover"
                @error="(e: any) => (e.target.style.display = 'none')" />
              <span class="text-[11px] text-[#999]">{{ item.productName || `商品 ${item.productId}` }}</span>
            </div>
            <!-- 评价内容 -->
            <p class="text-[13px] text-[#555] mb-2">{{ item.content || item.comment }}</p>
            <!-- 图片 -->
            <div v-if="item.images?.length" class="flex gap-2 mb-2">
              <img v-for="(img, i) in item.images.slice(0, 5)" :key="i" :src="img"
                class="w-16 h-16 rounded-lg object-cover border border-[#F0F0F0]"
                @error="(e: any) => (e.target.style.display = 'none')" />
              <div v-if="item.images.length > 5" class="w-16 h-16 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#999] text-[12px]">+{{ item.images.length - 5 }}</div>
            </div>
            <!-- 商家回复 -->
            <div v-if="item.reply" class="bg-[#F5F7FA] rounded-lg px-3 py-2 text-[12px] text-[#666]">
              <span class="text-[#FF6B00] font-medium mr-1">商家回复：</span>{{ item.reply }}
            </div>
          </div>
          <!-- 操作 -->
          <div class="flex flex-col gap-1.5 flex-shrink-0">
            <el-button v-if="can('review:audit') && item.status === 0" type="success" size="small" plain @click="approve(item)">通过</el-button>
            <el-button v-if="can('review:audit') && item.status !== -1" type="danger" size="small" plain @click="block(item)">屏蔽</el-button>
            <el-button v-if="can('review:audit') && item.status === -1" size="small" plain @click="restore(item)">恢复</el-button>
            <el-button v-if="can('review:reply')" size="small" @click="openReply(item)">
              <i :class="item.reply ? 'ri-edit-line' : 'ri-reply-line'" class="mr-1"></i>{{ item.reply ? '改回复' : '回复' }}
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="!loading && tableData.length === 0" class="bg-white rounded-xl border border-[#F0F0F0] p-12 text-center">
        <i class="ri-star-line text-4xl text-[#DDD]"></i>
        <p class="text-[#999] mt-2 text-[13px]">暂无评价数据</p>
      </div>
    </div>

    <div class="flex justify-end mt-4">
      <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="doSearch" />
    </div>

    <!-- 回复弹窗 -->
    <el-dialog :destroy-on-close="true" v-model="replyVisible" title="回复评价" width="460px">
      <div v-if="replyTarget" class="mb-3 p-3 bg-[#FAFAFA] rounded-lg text-[12px] text-[#666]">
        <span class="text-[#999]">评价内容：</span>{{ replyTarget.content || replyTarget.comment }}
      </div>
      <el-input v-model="replyContent" type="textarea" :rows="4" placeholder="请输入回复内容..." />
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" :loading="replying" @click="submitReply">发送回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import client from '@/utils/http';
import { usePermission } from '@/utils/permission';
import { AVATAR_PLACEHOLDER } from '@/utils/image';
import { userShopStore } from '@/store/index';
import { useListPage } from '@/composables/useListPage';
import { safeFormat } from '@/utils/dateFormat';

const { can } = usePermission();
const shopStore = userShopStore();

const statusText = (s: number) => s === 1 ? '已审核' : s === -1 ? '已屏蔽' : '待审核';
const statusTag = (s: number): any => s === 1 ? 'success' : s === -1 ? 'danger' : 'warning';

const { loading, tableData, total, pageNum, pageSize, search, dateRange, doSearch, resetSearch } =
  useListPage(
    (p) => {
      const shopId = shopStore.currentShop?.shopId || shopStore.currentShop?.id;
      return client.get('/app/reviews/admin', { params: {
        pageNum: p.pageNum, pageSize: p.pageSize, shopId: shopId || undefined,
        keyword:   p.keyword    || undefined,
        rating:    p.rating     ?? undefined,
        status:    p.status     ?? undefined,
        hasImages: p.hasImages  ?? undefined,
        hasReply:  p.hasReply   ?? undefined,
        startDate: p.startDate || undefined,
        endDate:   p.endDate   || undefined,
      }});
    },
    { keyword: '', rating: null as number|null, status: null as number|null,
      hasImages: null as boolean|null, hasReply: null as boolean|null },
  );

// 店铺切换时刷新列表
watch(() => shopStore.currentShop, () => { doSearch(); }, { deep: true });

const approve = async (item: any) => {
  try {
    await client.put(`/app/reviews/${item.id}/approve`);
    item.status = 1;
    ElMessage.success('已通过审核');
  } catch { ElMessage.error('操作失败'); }
};

const block = async (item: any) => {
  try {
    await client.put(`/app/reviews/${item.id}/block`);
    item.status = -1;
    ElMessage.success('已屏蔽');
  } catch { ElMessage.error('操作失败'); }
};

const restore = async (item: any) => {
  try {
    await client.put(`/app/reviews/${item.id}/restore`);
    item.status = 1;
    ElMessage.success('已恢复');
  } catch { ElMessage.error('操作失败'); }
};

// 回复
const replyVisible = ref(false);
const replyContent = ref('');
const replyTarget = ref<any>(null);
const replying = ref(false);

const openReply = (item: any) => {
  replyTarget.value = item;
  replyContent.value = item.reply || '';
  replyVisible.value = true;
};

const submitReply = async () => {
  if (!replyContent.value.trim()) { ElMessage.warning('请输入回复内容'); return; }
  replying.value = true;
  try {
    await client.put(`/app/reviews/${replyTarget.value.id}/reply`, { reply: replyContent.value });
    replyTarget.value.reply = replyContent.value;
    ElMessage.success('回复成功');
    replyVisible.value = false;
  } catch { ElMessage.error('回复失败'); } finally { replying.value = false; }
};
</script>
