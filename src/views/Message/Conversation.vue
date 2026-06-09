<template>
  <div class="page">
    <div class="flex gap-4 h-[calc(100vh-120px)]">

      <!-- 左侧会话列表 -->
      <div class="w-[300px] flex-shrink-0 bg-white rounded-xl border border-[#F0F0F0] flex flex-col">
        <div class="p-3 border-b border-[#F5F5F5] flex gap-2">
          <el-input v-model="searchKeyword" placeholder="搜索用户名/消息" size="small" clearable>
            <template #prefix><i class="ri-search-line text-[#999]"></i></template>
          </el-input>
          <!-- 主动发起会话需调 Admin-only 用户搜索接口，仅 Admin 显示 -->
          <el-button v-if="isAdmin" size="small" type="primary" title="主动发起会话" @click="openNewDialog">
            <i class="ri-add-line"></i>
          </el-button>
        </div>

        <div class="flex-1 overflow-y-auto" v-loading="listLoading">
          <div
            v-for="conv in filteredConversations" :key="conv.id"
            class="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-[#F5F5F5] transition-colors border-b border-[#FAFAFA]"
            :class="{ 'bg-[#FFF4E6] hover:bg-[#FFF4E6]': activeConv?.id === conv.id }"
            @click="selectConversation(conv)"
          >
            <div class="relative flex-shrink-0">
              <img
                :src="conv.userAvatar || AVATAR_PLACEHOLDER"
                class="w-9 h-9 rounded-full object-cover"
              />
              <span v-if="conv.unreadCount > 0"
                class="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-[#FF4D4F] rounded-full flex items-center justify-center">
                <span class="text-white text-[9px] font-bold leading-none">
                  {{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}
                </span>
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <span class="text-[12px] font-medium text-[#333] truncate">{{ conv.username || ('用户 ' + conv.userId) }}</span>
                <span class="text-[10px] text-[#999] flex-shrink-0">{{ fmtShort(conv.lastTime) }}</span>
              </div>
              <div class="text-[11px] text-[#999] truncate mt-0.5">{{ conv.lastMessage || '暂无消息' }}</div>
            </div>
          </div>
          <div v-if="!listLoading && conversations.length === 0"
            class="p-8 text-center text-[#999] text-[12px]">暂无 IM 会话</div>
          <!-- 分页 -->
          <div v-if="convTotal > convPageSize" class="p-2 flex justify-center">
            <el-pagination
              v-model:current-page="convPageNum"
              :page-size="convPageSize"
              :total="convTotal"
              layout="prev, pager, next"
              small
              @change="loadConversations"
            />
          </div>
        </div>
      </div>

      <!-- 右侧聊天区 -->
      <div class="flex-1 bg-white rounded-xl border border-[#F0F0F0] flex flex-col min-w-0">

        <!-- 无会话提示 -->
        <div v-if="!activeConv" class="flex-1 flex flex-col items-center justify-center text-[#999]">
          <i class="ri-message-2-line text-5xl text-[#E0E0E0]"></i>
          <p class="mt-3 text-[14px]">选择一个会话开始回复</p>
          <el-button v-if="isAdmin" class="mt-4" type="primary" plain @click="openNewDialog">
            <i class="ri-add-line mr-1"></i>主动发起会话
          </el-button>
        </div>

        <template v-if="activeConv">
          <!-- 会话头部 -->
          <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#F5F5F5] flex-shrink-0">
            <div class="flex items-center gap-3">
              <img
                :src="activeConv.userAvatar || AVATAR_PLACEHOLDER"
                class="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <div class="text-[13px] font-medium text-[#333]">
                  {{ activeConv.username || ('用户 ' + activeConv.userId) }}
                </div>
                <div class="text-[11px] text-[#999]">IM 会话 · {{ activeConv.id }}</div>
              </div>
            </div>
            <div class="flex gap-2">
              <!-- 发通知：调 /app/notifications/admin/push，仅 Admin 可用 -->
              <el-button v-if="isAdmin" size="small" type="primary" plain @click="openNotifyDialog">
                <i class="ri-notification-3-line mr-1"></i>发通知
              </el-button>
              <el-button size="small" type="danger" plain @click="deleteConversation">
                <i class="ri-delete-bin-line mr-1"></i>删除会话
              </el-button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div ref="msgListEl" class="flex-1 overflow-y-auto p-4 space-y-3">
            <div v-if="msgLoading" class="text-center text-[#999] text-[12px] py-8">加载中...</div>
            <template v-if="!msgLoading">
              <div
                v-for="msg in messages" :key="msg.id || msg.createTime"
                class="flex"
                :class="msg.isAdmin ? 'justify-end' : 'justify-start'"
              >
                <div class="flex items-end gap-2 max-w-[75%]"
                  :class="msg.isAdmin ? 'flex-row-reverse' : 'flex-row'">
                  <img
                    :src="msg.isAdmin ? adminAvatar : (activeConv.userAvatar || AVATAR_PLACEHOLDER)"
                    class="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  />
                  <div>
                    <div class="rounded-2xl px-3 py-2 text-[13px] break-words"
                      :class="msg.isAdmin
                        ? 'bg-[#FF6B00] text-white rounded-br-sm'
                        : 'bg-[#F5F5F5] text-[#333] rounded-bl-sm'">
                      {{ msg.content }}
                    </div>
                    <div class="text-[10px] text-[#999] mt-1"
                      :class="msg.isAdmin ? 'text-right' : 'text-left'">
                      {{ fmtTime(msg.createTime || msg.sentAt) }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="messages.length === 0" class="text-center text-[#999] text-[12px] py-8">暂无消息</div>
            </template>
          </div>

          <!-- 回复输入框 -->
          <div class="border-t border-[#F5F5F5] flex-shrink-0">
            <!-- 快捷模板 -->
            <div class="flex gap-1.5 overflow-x-auto scrollbar-hide px-3 pt-2.5 pb-1">
              <button
                v-for="tpl in REPLY_TEMPLATES" :key="tpl.label"
                @click="inputMsg = tpl.content"
                class="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] border transition-colors whitespace-nowrap"
                :class="inputMsg === tpl.content
                  ? 'border-[#FF6B00] text-[#FF6B00] bg-[#FFF3E8]'
                  : 'border-[#E5E5E5] text-[#666] hover:border-[#FF6B00] hover:text-[#FF6B00]'">
                {{ tpl.label }}
              </button>
            </div>
            <div class="p-3 flex gap-2">
              <el-input
                v-model="inputMsg"
                placeholder="输入回复内容（Ctrl+回车发送）"
                :rows="2" type="textarea" resize="none" class="flex-1"
                @keydown.ctrl.enter="sendReply"
              />
              <div class="flex flex-col gap-2 flex-shrink-0">
                <el-button type="primary" @click="sendReply" :loading="sending">
                  <i class="ri-send-plane-line mr-1"></i>发送
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 主动发起会话对话框 -->
    <el-dialog :destroy-on-close="true" v-model="newDialogVisible" title="主动发起 IM 会话" width="440px">
      <el-form label-width="80px" label-position="left">
        <el-form-item label="目标用户">
          <el-select v-model="newForm.userId" filterable remote :remote-method="searchUsers"
            :loading="userSearchLoading" placeholder="输入用户名搜索" class="w-full">
            <el-option v-for="u in userOptions" :key="u.id" :label="u.label" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="初始消息">
          <el-input v-model="newForm.content" type="textarea" :rows="3" placeholder="发送给用户的第一条消息..." />
        </el-form-item>
        <el-form-item label="快捷模板">
          <div class="flex flex-wrap gap-1.5">
            <el-tag
              v-for="tpl in REPLY_TEMPLATES" :key="tpl.label"
              class="cursor-pointer" @click="newForm.content = tpl.content">
              {{ tpl.label }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newDialogVisible = false">取消</el-button>
        <el-button
          type="primary" :loading="newDialogSending"
          :disabled="!newForm.userId || !newForm.content.trim()"
          @click="startNewConversation">发起</el-button>
      </template>
    </el-dialog>

    <!-- 快捷发通知对话框 -->
    <el-dialog :destroy-on-close="true" v-model="notifyVisible" title="发送系统通知" width="440px">
      <el-form label-width="80px" label-position="left">
        <el-form-item label="目标用户">
          <div class="text-[13px] font-medium text-[#333]">
            {{ activeConv?.username }} (UID: {{ activeConv?.userId }})
          </div>
        </el-form-item>
        <el-form-item label="消息类型">
          <el-select v-model="notifyForm.bizType" class="w-full">
            <el-option label="系统通知" value="SYSTEM" />
            <el-option label="活动推荐" value="MARKETING" />
            <el-option label="平台公告" value="ANNOUNCE" />
          </el-select>
        </el-form-item>
        <el-form-item label="通知标题">
          <el-input v-model="notifyForm.title" placeholder="请输入通知标题" />
        </el-form-item>
        <el-form-item label="通知内容">
          <el-input v-model="notifyForm.content" type="textarea" :rows="3" placeholder="请输入通知内容" />
        </el-form-item>
        <el-form-item label="快捷模板">
          <div class="flex flex-wrap gap-1.5">
            <el-tag v-for="tpl in NOTIFY_TEMPLATES" :key="tpl.title"
              class="cursor-pointer" @click="applyNotifyTpl(tpl)">
              {{ tpl.title.slice(0, 8) }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="notifyVisible = false">取消</el-button>
        <el-button type="primary" :loading="notifySending"
          :disabled="!notifyForm.title.trim() || !notifyForm.content.trim()"
          @click="sendNotify">发送通知</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import client from '@/utils/http';
import emitter from '@/utils/event-bus';
import { AVATAR_PLACEHOLDER } from '@/utils/image';
import { useShopFilter } from '@/composables/useShopFilter';
import { usePermission } from '@/utils/permission';

const adminAvatar = AVATAR_PLACEHOLDER;
const { shopParam } = useShopFilter();
const { isAdmin } = usePermission();

// ── 常量 ────────────────────────────────────────────────────────────────────

const REPLY_TEMPLATES = [
  { label: '欢迎', content: '您好，欢迎来到壹心，请问有什么可以帮助您的？' },
  { label: '已处理', content: '您好，您的问题已处理完毕，如有其他疑问欢迎随时联系我们。' },
  { label: '处理中', content: '您好，您的反馈已记录，我们将在1-3个工作日内处理，感谢耐心等待。' },
  { label: '道歉', content: '非常抱歉给您带来不便，我们正在积极处理中。' },
  { label: '物流', content: '您的订单正在配送中，请注意查收。如有疑问请联系我们。' },
];

const NOTIFY_TEMPLATES = [
  { bizType: 'ANNOUNCE', title: '平台升级公告', content: '平台将于近期进行系统升级维护，敬请谅解。' },
  { bizType: 'MARKETING', title: '限时优惠活动', content: '平台为您准备了专属优惠，赶快去领取吧！' },
  { bizType: 'SYSTEM', title: '账户安全提醒', content: '为保障账户安全，建议您定期修改密码。' },
  { bizType: 'SYSTEM', title: '感谢您的支持', content: '感谢您长期以来对壹心平台的支持！' },
];

// ── 日期工具 ──────────────────────────────────────────────────────────────

function parseDt(val?: string): Date | null {
  if (!val) return null;
  const d = new Date(val.replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

function fmtShort(val?: string) {
  const d = parseDt(val);
  if (!d) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function fmtTime(val?: string) {
  const d = parseDt(val);
  if (!d) return val || '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ── 会话列表 ──────────────────────────────────────────────────────────────

const conversations = ref<any[]>([]);
const listLoading = ref(false);
const convTotal = ref(0);
const convPageNum = ref(1);
const convPageSize = 50;
const searchKeyword = ref('');

const filteredConversations = computed(() => {
  const kw = searchKeyword.value.toLowerCase().trim();
  if (!kw) return conversations.value;
  return conversations.value.filter((c: any) =>
    (c.username || '').toLowerCase().includes(kw) ||
    (c.lastMessage || '').toLowerCase().includes(kw),
  );
});

const loadConversations = async () => {
  listLoading.value = true;
  try {
    const res: any = await client.get('/app/support/conversations', {
      params: {
        pageNum: convPageNum.value,
        pageSize: convPageSize,
        shopId: (shopParam.value as any).shopId || undefined,
      },
    });
    const data = res.data?.data || res.data || {};
    conversations.value = data.records || [];
    convTotal.value = data.total || 0;
  } catch { /* interceptor handles */ } finally {
    listLoading.value = false;
  }
};

// ── 选中会话 ──────────────────────────────────────────────────────────────

const activeConv = ref<any>(null);
const messages = ref<any[]>([]);
const msgLoading = ref(false);
const msgListEl = ref<HTMLElement | null>(null);

const selectConversation = async (conv: any) => {
  activeConv.value = conv;
  sessionStorage.setItem(LAST_CONV_KEY, String(conv.id));
  messages.value = [];
  msgLoading.value = true;
  try {
    const res: any = await client.get(`/app/support/conversations/${conv.id}/messages`);
    const data = res.data?.data || res.data || {};
    messages.value = data.records || [];
    // Update local unread count to 0 visually + 通知铃铛更新
    const idx = conversations.value.findIndex((c: any) => c.id === conv.id);
    if (idx >= 0) conversations.value[idx].unreadCount = 0;
    emitter.emit('admin:conversationRead', { convId: conv.id });
  } catch { /* interceptor handles */ }
  msgLoading.value = false;
  await nextTick();
  scrollToBottom();
};

const scrollToBottom = () => {
  if (msgListEl.value) msgListEl.value.scrollTop = msgListEl.value.scrollHeight;
};

// ── 发送回复 ──────────────────────────────────────────────────────────────

const inputMsg = ref('');
const sending = ref(false);

const sendReply = async () => {
  const content = inputMsg.value.trim();
  if (!content || !activeConv.value) return;
  sending.value = true;
  try {
    const res: any = await client.post(`/app/support/conversations/${activeConv.value.id}/reply`, { content });
    const data = res.data?.data || res.data;
    // Backend returns the new message record
    messages.value.push(data || {
      content,
      isAdmin: true,
      createTime: new Date().toLocaleString(),
    });
    // Update conversation preview
    const idx = conversations.value.findIndex((c: any) => c.id === activeConv.value.id);
    if (idx >= 0) {
      conversations.value[idx].lastMessage = content;
      conversations.value[idx].lastTime = new Date().toISOString();
    }
    inputMsg.value = '';
    await nextTick();
    scrollToBottom();
    ElMessage.success('回复成功');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || '发送失败');
  }
  sending.value = false;
};

// ── 删除会话 ──────────────────────────────────────────────────────────────

const deleteConversation = async () => {
  if (!activeConv.value) return;
  try {
    await ElMessageBox.confirm(
      `确定删除与「${activeConv.value.username || activeConv.value.userId}」的全部 IM 会话记录？此操作不可撤销。`,
      '删除会话',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning', confirmButtonClass: 'el-button--danger' },
    );
    await client.delete(`/app/support/conversations/${activeConv.value.id}`);
    conversations.value = conversations.value.filter((c: any) => c.id !== activeConv.value.id);
    activeConv.value = null;
    messages.value = [];
    ElMessage.success('会话已删除');
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

// ── 主动发起会话 ──────────────────────────────────────────────────────────

const newDialogVisible = ref(false);
const newDialogSending = ref(false);
const newForm = reactive({ userId: null as number | null, content: '' });
const userSearchLoading = ref(false);
const userOptions = ref<{ id: number; label: string }[]>([]);

const openNewDialog = () => {
  newForm.userId = null;
  newForm.content = '';
  userOptions.value = [];
  newDialogVisible.value = true;
};

const searchUsers = async (query: string) => {
  if (!query) return;
  userSearchLoading.value = true;
  try {
    const res: any = await client.get('/app/users/admin/list', {
      params: { keyword: query, pageNum: 1, pageSize: 20 },
    });
    const data = res.data?.data || res.data || {};
    const list = Array.isArray(data) ? data : (data.records || []);
    userOptions.value = list.map((u: any) => ({
      id: u.userId || u.id,
      label: `${u.nick_name || u.nickname || u.username} (ID:${u.userId || u.id})`,
    }));
  } catch { /* interceptor handles */ }
  userSearchLoading.value = false;
};

const startNewConversation = async () => {
  if (!newForm.userId || !newForm.content.trim()) return;
  newDialogSending.value = true;
  try {
    const res: any = await client.post('/app/support/conversations/start', {
      userId: newForm.userId,
      content: newForm.content.trim(),
    });
    const data = res.data?.data || res.data;
    ElMessage.success('会话已发起，用户可在客服页面实时看到');
    newDialogVisible.value = false;
    await loadConversations();
    // Select the newly created/updated conversation
    if (data?.id) {
      const target = conversations.value.find((c: any) => String(c.id) === String(data.id));
      if (target) selectConversation(target);
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || '发起失败');
  }
  newDialogSending.value = false;
};

// ── 发送通知 ──────────────────────────────────────────────────────────────

const notifyVisible = ref(false);
const notifySending = ref(false);
const notifyForm = reactive({ bizType: 'SYSTEM', title: '', content: '' });

const openNotifyDialog = () => {
  notifyForm.bizType = 'SYSTEM';
  notifyForm.title = '';
  notifyForm.content = '';
  notifyVisible.value = true;
};

const applyNotifyTpl = (tpl: typeof NOTIFY_TEMPLATES[0]) => {
  notifyForm.bizType = tpl.bizType;
  notifyForm.title = tpl.title;
  notifyForm.content = tpl.content;
};

const sendNotify = async () => {
  if (!activeConv.value || !notifyForm.title.trim() || !notifyForm.content.trim()) return;
  notifySending.value = true;
  try {
    await client.post('/app/notifications/admin/push', {
      userIds: [activeConv.value.userId],
      bizType: notifyForm.bizType,
      title: notifyForm.title.trim(),
      content: notifyForm.content.trim(),
    });
    ElMessage.success('通知已发送');
    notifyVisible.value = false;
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || '发送失败');
  }
  notifySending.value = false;
};

// ── 实时接收用户发来的新消息 ─────────────────────────────────────
const handleAdminWs = (payload: any) => {
  if (payload.type === 'im.user.message.new') {
    const record = payload.data;
    if (!record) return;

    const convId = String(record.conversationId);

    // 若当前正在查看该会话 → 直接追加消息并滚动
    if (activeConv.value && String(activeConv.value.id) === convId) {
      // 避免重复插入
      const exists = messages.value.some((m: any) => String(m.id) === String(record.id));
      if (!exists) {
        messages.value.push(record);
        nextTick(() => scrollToBottom());
      }
    }

    // 更新左侧列表的最后一条消息预览
    const idx = conversations.value.findIndex((c: any) => String(c.id) === convId);
    if (idx >= 0) {
      conversations.value[idx].lastMessage = record.content || record.contentText || '';
      conversations.value[idx].lastTime    = record.createTime || record.sentAt || '';
      conversations.value[idx].unreadCount = (conversations.value[idx].unreadCount || 0) + 1;
      // 将该会话移到列表顶部
      const updated = conversations.value.splice(idx, 1)[0];
      conversations.value.unshift(updated);
    } else {
      // 新会话首次出现 → 重新拉取列表
      loadConversations();
    }
  }
};

const LAST_CONV_KEY = 'yx_admin_last_conv_id';

onMounted(async () => {
  await loadConversations();
  emitter.on('admin:ws', handleAdminWs);
  // 恢复上次打开的会话
  const lastId = sessionStorage.getItem(LAST_CONV_KEY);
  if (lastId) {
    const target = conversations.value.find((c: any) => String(c.id) === lastId);
    if (target) selectConversation(target);
  }
});

onUnmounted(() => {
  emitter.off('admin:ws', handleAdminWs);
});
</script>
