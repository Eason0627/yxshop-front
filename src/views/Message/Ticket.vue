<template>
  <div class="page">
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="工单主题/用户" class="!w-[200px]" clearable @keyup.enter="doSearch" />
        <el-select v-model="search.status" placeholder="工单状态" class="!w-[140px]" clearable @change="doSearch">
          <el-option label="待处理" value="Open" />
          <el-option label="已回复" value="Replied" />
          <el-option label="已关闭" value="Closed" />
        </el-select>
        <el-select v-model="search.priority" placeholder="优先级" class="!w-[120px]" clearable @change="doSearch">
          <el-option label="高优先级" value="High" />
          <el-option label="普通" value="Normal" />
          <el-option label="低优先级" value="Low" />
        </el-select>
        <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <el-button @click="resetSearch"><i class="ri-refresh-line mr-1"></i>重置</el-button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe>
        <el-table-column label="工单号" width="180">
          <template #default="{ row }">
            <span class="text-[12px] font-mono text-[#333]">{{ row.ticketNo || row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="主题" min-width="220">
          <template #default="{ row }">
            <span class="text-[13px] font-medium text-[#333]">{{ row.subject }}</span>
          </template>
        </el-table-column>
        <el-table-column label="用户" width="120">
          <template #default="{ row }">{{ row.username || row.userId }}</template>
        </el-table-column>
        <el-table-column label="优先级" width="90">
          <template #default="{ row }">
            <el-tag :type="row.priority === 'High' ? 'danger' : row.priority === 'Normal' ? 'warning' : 'info'" size="small">
              {{ ({ High: '高', Normal: '普通', Low: '低' } as Record<string, string>)[row.priority] || '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'Open' ? 'warning' : row.status === 'Replied' ? 'primary' : 'info'" size="small">
              {{ ({ Open: '待处理', Replied: '已回复', Closed: '已关闭' } as Record<string, string>)[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">{{ fmtTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetail(row)">查看/回复</el-button>
            <el-button v-if="row.status !== 'Closed'" type="warning" link size="small" @click="closeTicket(row)">关闭</el-button>
            <el-button type="danger" link size="small" @click="deleteTicket(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end p-4">
        <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
          :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next" @change="doSearch" />
      </div>
    </div>

    <!-- 工单详情抽屉 -->
    <el-drawer v-model="detailVisible" title="工单详情" size="560px" :destroy-on-close="true">
      <div v-if="currentTicket" class="px-1 space-y-4">
        <!-- 工单头 -->
        <div class="bg-[#FAFAFA] rounded-xl p-4">
          <div class="flex items-start justify-between">
            <div>
              <div class="text-[14px] font-semibold text-[#333]">{{ currentTicket.subject }}</div>
              <div class="text-[11px] text-[#999] mt-1">工单号：{{ currentTicket.ticketNo || currentTicket.id }}</div>
            </div>
            <el-tag :type="currentTicket.status === 'Open' ? 'warning' : currentTicket.status === 'Replied' ? 'primary' : 'info'">
              {{ ({ Open: '待处理', Replied: '已回复', Closed: '已关闭' } as Record<string, string>)[currentTicket.status] || currentTicket.status }}
            </el-tag>
          </div>
          <div class="grid grid-cols-2 gap-y-1.5 mt-3 text-[12px]">
            <div class="text-[#999]">提交用户</div><div class="text-[#333]">{{ currentTicket.username || currentTicket.userId }}</div>
            <div class="text-[#999]">提交时间</div><div class="text-[#333]">{{ fmtTime(currentTicket.createdAt || currentTicket.createTime) }}</div>
            <div class="text-[#999]">优先级</div>
            <div>
              <el-tag :type="currentTicket.priority === 'High' ? 'danger' : 'info'" size="small">{{ currentTicket.priority || 'Normal' }}</el-tag>
            </div>
          </div>
        </div>

        <!-- 对话记录 -->
        <div ref="msgScrollEl" class="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          <div class="text-[12px] font-semibold text-[#999]">对话记录</div>
          <div v-if="!currentTicket.replies || currentTicket.replies.length === 0"
            class="text-center text-[12px] text-[#CCC] py-6">暂无消息</div>
          <!-- 所有消息（含用户第一条）统一在 replies 里，不再单独显示原始内容避免重复 -->
          <div v-for="(reply, idx) in (currentTicket.replies || [])" :key="idx"
            class="flex gap-3"
            :class="reply.isAdmin ? 'flex-row-reverse' : ''">
            <img
              :src="reply.isAdmin ? adminAvatar : (currentTicket.userAvatar || AVATAR_PLACEHOLDER)"
              class="w-8 h-8 rounded-full flex-shrink-0" />
            <div :class="reply.isAdmin ? 'items-end' : 'items-start'" class="flex-1 flex flex-col">
              <div class="text-[11px] text-[#999] mb-1">{{ reply.isAdmin ? '客服' : reply.username }} · {{ fmtTime(reply.createTime) }}</div>
              <div class="rounded-xl p-3 text-[13px] max-w-[85%]"
                :class="reply.isAdmin ? 'bg-[#FF6B00] text-white rounded-tr-sm' : 'bg-[#F5F5F5] text-[#333] rounded-tl-sm'">
                {{ reply.content }}
              </div>
            </div>
          </div>
        </div>

        <!-- 回复框 -->
        <div v-if="currentTicket.status !== 'Closed'">
          <div class="text-[12px] font-semibold text-[#999] mb-2">快捷回复</div>
          <div class="flex flex-wrap gap-1.5 mb-3">
            <el-tag
              v-for="tpl in REPLY_TEMPLATES"
              :key="tpl"
              class="cursor-pointer select-none"
              @click="replyContent = tpl"
            >{{ tpl.slice(0, 10) }}</el-tag>
          </div>
          <el-input v-model="replyContent" type="textarea" :rows="3" placeholder="输入回复内容..." />
          <div class="flex gap-2 mt-2">
            <el-button type="primary" :loading="replying" @click="submitReply">发送回复</el-button>
            <el-button type="danger" plain @click="closeTicket(currentTicket)">关闭工单</el-button>
          </div>
        </div>
        <div v-else class="bg-[#F5F5F5] rounded-xl p-3 text-center text-[12px] text-[#999]">
          <i class="ri-lock-2-line mr-1"></i>工单已关闭
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import client from '@/utils/http';
import { AVATAR_PLACEHOLDER } from '@/utils/image';
import { useListPage } from '@/composables/useListPage';
import { useShopFilter } from '@/composables/useShopFilter';
import { formatDateTime } from '@/utils/dateFormat';

const adminAvatar = AVATAR_PLACEHOLDER;
const fmtTime = formatDateTime;

const REPLY_TEMPLATES = [
  '您好，感谢您的反馈，我们会尽快处理！',
  '您的问题已记录，请耐心等待处理结果。',
  '该问题已解决，如有其他问题请随时联系。',
  '亲爱的用户，感谢您的支持，祝购物愉快！',
  '非常抱歉给您带来不便，我们正在积极处理。',
];

const { shopParam } = useShopFilter();

const { loading, tableData, total, pageNum, pageSize, search, doSearch, resetSearch } =
  useListPage(
    (p) => client.get('/app/support/tickets', { params: {
      pageNum: p.pageNum, pageSize: p.pageSize,
      keyword:  p.keyword  || undefined,
      status:   p.status   || undefined,
      priority: p.priority || undefined,
      shopId:   (shopParam.value as any).shopId || undefined,
    }}),
    { keyword: '', status: '', priority: '' },
  );

const closeTicket = async (row: any) => {
  try {
    await client.put(`/app/support/tickets/${row.id}/close`);
    row.status = 'Closed';
    if (currentTicket.value?.id === row.id) currentTicket.value.status = 'Closed';
    ElMessage.success('工单已关闭');
  } catch { /* interceptor handles */ }
};

const deleteTicket = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除工单「${row.subject}」？此操作不可撤销。`, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    });
    await client.delete(`/app/support/tickets/${row.id}`);
    ElMessage.success('工单已删除');
    if (detailVisible.value && currentTicket.value?.id === row.id) detailVisible.value = false;
    doSearch();
  } catch {
    // user cancelled or interceptor handled
  }
};

const detailVisible = ref(false);
const currentTicket = ref<any>(null);
const replyContent = ref('');
const replying = ref(false);
const msgScrollEl = ref<HTMLElement | null>(null);

const scrollToBottom = async () => {
  await nextTick();
  if (msgScrollEl.value) msgScrollEl.value.scrollTop = msgScrollEl.value.scrollHeight;
};

const openDetail = async (row: any) => {
  currentTicket.value = { ...row };
  replyContent.value = '';
  detailVisible.value = true;
  try {
    const res: any = await client.get(`/app/support/tickets/${row.id}`);
    const data = (res as any).data?.data || (res as any).data;
    if (data) currentTicket.value = data;
    scrollToBottom();
  } catch { /* use row data */ }
};

const submitReply = async () => {
  if (!replyContent.value.trim()) { ElMessage.warning('请输入回复内容'); return; }
  replying.value = true;
  try {
    await client.post(`/app/support/tickets/${currentTicket.value.id}/reply`, {
      content: replyContent.value.trim(),
    });
    if (!currentTicket.value.replies) currentTicket.value.replies = [];
    currentTicket.value.replies.push({
      content: replyContent.value.trim(),
      isAdmin: true,
      createTime: new Date().toLocaleString(),
    });
    currentTicket.value.status = 'Replied';
    const tableRow = tableData.value.find((r: any) => r.id === currentTicket.value.id);
    if (tableRow) tableRow.status = 'Replied';
    replyContent.value = '';
    ElMessage.success('回复成功');
    scrollToBottom();
  } catch { /* interceptor handles */ } finally { replying.value = false; }
};
</script>
