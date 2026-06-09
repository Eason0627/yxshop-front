<template>
  <div class="page">
    <!-- 顶部操作�?-->
    <div class="flex gap-4 h-[calc(100vh-120px)]">

      <!-- 左侧：推送表�?-->
      <div class="w-[380px] flex-shrink-0 flex flex-col gap-4">
        <!-- 推送表�?-->
        <div class="bg-white rounded-xl border border-[#F0F0F0] p-5">
          <div class="text-[14px] font-semibold text-[#333] mb-4 flex items-center gap-2">
            <i class="ri-notification-3-line text-[#FF6B00]"></i>
            发送系统通知
          </div>

          <el-form :model="form" label-width="70px" label-position="left" size="default">
            <el-form-item label="消息类型">
              <el-select v-model="form.bizType" class="w-full">
                <el-option v-for="t in BIZ_TYPES" :key="t.value" :label="t.label" :value="t.value">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ background: t.color }"></span>
                    {{ t.label }}
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="推送对象">
              <div class="flex flex-col gap-2 w-full">
                <el-radio-group v-model="form.targetType" @change="onTargetTypeChange">
                  <el-radio value="all">全体用户</el-radio>
                  <el-radio value="specific">指定用户</el-radio>
                </el-radio-group>
                <el-select
                  v-if="form.targetType === 'specific'"
                  v-model="form.userIds"
                  multiple
                  filterable
                  remote
                  :remote-method="searchUsers"
                  :loading="userSearchLoading"
                  placeholder="搜索用户名 / 昵称"
                  class="w-full"
                >
                  <el-option v-for="u in userOptions" :key="u.id" :label="u.label" :value="u.id" />
                </el-select>
              </div>
            </el-form-item>

            <el-form-item label="通知标题">
              <el-input v-model="form.title" placeholder="请输入通知标题" maxlength="100" show-word-limit />
            </el-form-item>

            <el-form-item label="通知内容">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="4"
                placeholder="请输入通知内容"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <!-- 快捷模板 -->
            <el-form-item label="快捷模板">
              <div class="flex flex-wrap gap-1.5">
                <el-tag
                  v-for="tpl in QUICK_TEMPLATES"
                  :key="tpl.title"
                  class="cursor-pointer"
                  :class="{ 'border-[#FF6B00] text-[#FF6B00]': form.title === tpl.title }"
                  @click="applyTemplate(tpl)"
                >
                  {{ tpl.title.slice(0, 8) }}
                </el-tag>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :loading="sending"
                :disabled="!form.title.trim() || !form.content.trim()"
                class="w-full"
                @click="handleSend"
                style="background: linear-gradient(135deg, #FF8C00, #FF6B00); border: none;"
              >
                <i class="ri-send-plane-line mr-1"></i>
                {{ form.targetType === 'all' ? '广播给全体用户' : `推送给 ${form.userIds.length} 位用户` }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 消息模板管理 -->
        <div class="bg-white rounded-xl border border-[#F0F0F0] p-5 flex-1 flex flex-col min-h-0">
          <div class="flex items-center justify-between mb-3">
            <div class="text-[14px] font-semibold text-[#333] flex items-center gap-2">
              <i class="ri-file-list-3-line text-[#165DFF]"></i>
              消息模板
            </div>
            <el-button size="small" type="primary" plain @click="openTemplateDialog(null)">
              <i class="ri-add-line mr-1"></i>新增
            </el-button>
          </div>
          <div class="flex-1 overflow-y-auto space-y-2">
            <div
              v-for="tpl in templates"
              :key="tpl.id"
              class="border border-[#F0F0F0] rounded-xl p-3 cursor-pointer hover:border-[#FF6B00] transition-colors"
              @click="openTemplateDialog(tpl)"
            >
              <div class="flex items-center justify-between">
                <span class="text-[12px] font-medium text-[#333] truncate">{{ tpl.titleTemplate }}</span>
                <el-tag :type="tpl.status === 1 ? 'success' : 'info'" size="small">{{ tpl.status === 1 ? '启用' : '停用' }}</el-tag>
              </div>
              <div class="text-[11px] text-[#999] mt-1 truncate">{{ tpl.contentTemplate }}</div>
              <div class="text-[10px] text-[#CCC] mt-1">{{ tpl.code }} · {{ tpl.bizType }}</div>
            </div>
            <div v-if="templates.length === 0" class="text-center text-[#999] text-[12px] py-6">暂无模板</div>
          </div>
        </div>
      </div>

      <!-- 右侧：通知记录 -->
      <div class="flex-1 bg-white rounded-xl border border-[#F0F0F0] flex flex-col min-h-0">
        <div class="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5] flex-shrink-0">
          <div class="text-[14px] font-semibold text-[#333] flex items-center gap-2">
            <i class="ri-history-line text-[#165DFF]"></i>
            通知记录
          </div>
          <div class="flex items-center gap-2">
            <el-select v-model="recordFilter.bizType" placeholder="消息类型" class="!w-[120px]" clearable size="small" @change="loadRecords">
              <el-option v-for="t in BIZ_TYPES" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
            <el-input v-model="recordFilter.userIdStr" placeholder="用户ID" class="!w-[100px]" size="small" clearable @change="loadRecords" />
            <el-button size="small" @click="loadRecords"><i class="ri-refresh-line"></i></el-button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <el-table :data="records" style="width:100%" v-loading="recordLoading" stripe>
            <el-table-column label="用户" width="120">
              <template #default="{ row }">
                <div class="text-[12px]">
                  <div class="font-medium text-[#333] truncate">{{ row.username || row.userId }}</div>
                  <div class="text-[#999]">UID: {{ row.userId }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="160">
              <template #default="{ row }">
                <span class="text-[12px] font-medium text-[#333]">{{ row.title }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="text-[11px] text-[#666]">{{ row.content }}</span>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="90">
              <template #default="{ row }">
                <el-tag :type="getBizTagType(row.bizType)" size="small">{{ row.bizType || 'SYSTEM' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="已读" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.readStatus === 1 ? 'success' : 'warning'" size="small">{{ row.readStatus === 1 ? '已读' : '未读' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发送时间" width="150">
              <template #default="{ row }">
                <span class="text-[11px] text-[#999]">{{ formatTime(row.createdAt) }}</span>
              </template>
            </el-table-column>
          </el-table>
          <div class="flex justify-end p-3">
            <el-pagination
              v-model:current-page="recordPager.page"
              v-model:page-size="recordPager.size"
              :total="recordTotal"
              :page-sizes="[20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              @change="loadRecords"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 模板编辑对话�?-->
    <el-dialog :destroy-on-close="true" v-model="tplDialogVisible" :title="editingTpl?.id ? '编辑模板' : '新建模板'" width="480px">
      <el-form :model="tplForm" label-width="80px" label-position="left">
        <el-form-item label="模板编码">
          <el-input v-model="tplForm.code" placeholder="�?ORDER_PAID" />
        </el-form-item>
        <el-form-item label="消息类型">
          <el-select v-model="tplForm.bizType" class="w-full">
            <el-option v-for="t in BIZ_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题模板">
          <el-input v-model="tplForm.titleTemplate" placeholder="支持 ${变量名} 占位符" />
        </el-form-item>
        <el-form-item label="内容模板">
          <el-input v-model="tplForm.contentTemplate" type="textarea" :rows="3" placeholder="支持 ${变量名} 占位符" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="tplForm.statusBool" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tplDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="tplSaving" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import client from '@/utils/http';

// ── 业务类型配置 ──────────────────────────────────────────────
const BIZ_TYPES = [
  { value: 'SYSTEM',    label: '系统通知',  color: '#FF6B00' },
  { value: 'ORDER',     label: '订单消息',  color: '#1677FF' },
  { value: 'LOGISTICS', label: '物流通知',  color: '#00B578' },
  { value: 'MARKETING', label: '活动推荐',  color: '#FF4D88' },
  { value: 'ANNOUNCE',  label: '平台公告',  color: '#7B61FF' },
];

const QUICK_TEMPLATES = [
  { bizType: 'SYSTEM',    title: '账户登录提醒', content: '您的账户已在新设备登录，如非本人操作请及时修改密码。' },
  { bizType: 'ORDER',     title: '订单已确认',   content: '您的订单已确认，商家正在备货，请耐心等待发货。' },
  { bizType: 'LOGISTICS', title: '您的订单已发货', content: '您的订单已发货，快递公司正在配送中，预计3~5个工作日到达。' },
  { bizType: 'MARKETING', title: '限时优惠来了', content: '平台为您准备了专属优惠券，赶快去领取吧！' },
  { bizType: 'ANNOUNCE',  title: '平台升级公告',  content: '平台将于今晚00:00-02:00进行系统升级维护，届时服务暂时不可用，敬请谅解。' },
];

// ── 发送表�?──────────────────────────────────────────────────
const DEFAULT_PUSH_FORM = {
  bizType: 'SYSTEM',
  targetType: 'all',
  userIds: [] as number[],
  title: '',
  content: '',
};
const form = reactive({ ...DEFAULT_PUSH_FORM });

const sending = ref(false);
const userSearchLoading = ref(false);
const userOptions = ref<{ id: number; label: string }[]>([]);

const onTargetTypeChange = () => {
  form.userIds = [];
  userOptions.value = [];
};

const searchUsers = async (query: string) => {
  if (!query) return;
  userSearchLoading.value = true;
  try {
    const res: any = await client.get('/app/users/admin/list', { params: { keyword: query, pageNum: 1, pageSize: 20 } });
    const data = res.data?.data || res.data || {};
    const list = Array.isArray(data) ? data : (data.records || []);
    userOptions.value = list.map((u: any) => ({
      id: u.userId || u.id,
      label: `${u.nickname || u.nick_name || u.username} (${u.userId || u.id})`,
    }));
  } catch { /* interceptor handles */ }
  userSearchLoading.value = false;
};

const applyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
  form.bizType = tpl.bizType;
  form.title = tpl.title;
  form.content = tpl.content;
};

const handleSend = async () => {
  if (!form.title.trim() || !form.content.trim()) {
    ElMessage.warning('请填写标题和内容');
    return;
  }
  sending.value = true;
  try {
    const payload: any = {
      bizType: form.bizType,
      title: form.title.trim(),
      content: form.content.trim(),
    };
    if (form.targetType === 'specific') {
      if (form.userIds.length === 0) {
        ElMessage.warning('请选择推送用户');
        sending.value = false;
        return;
      }
      payload.userIds = form.userIds;
    }
    const res: any = await client.post('/app/notifications/admin/push', payload);
    const data = res.data?.data || res.data || {};
    ElMessage.success(`推送成功，共发送 ${data.sent ?? '-'} 条`);
    Object.assign(form, DEFAULT_PUSH_FORM, { userIds: [] });
    loadRecords();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || '推送失败');
  }
  sending.value = false;
};

// ── 模板管理 ─────────────────────────────────────────────────
const templates = ref<any[]>([]);
const tplDialogVisible = ref(false);
const editingTpl = ref<any>(null);
const tplSaving = ref(false);
const tplForm = reactive({
  code: '',
  bizType: 'SYSTEM',
  titleTemplate: '',
  contentTemplate: '',
  statusBool: true,
});

const loadTemplates = async () => {
  try {
    const res: any = await client.get('/app/notifications/admin/templates');
    templates.value = res.data?.data || res.data || [];
  } catch { /* interceptor handles */ }
};

const openTemplateDialog = (tpl: any) => {
  editingTpl.value = tpl;
  if (tpl) {
    tplForm.code = tpl.code || '';
    tplForm.bizType = tpl.bizType || 'SYSTEM';
    tplForm.titleTemplate = tpl.titleTemplate || '';
    tplForm.contentTemplate = tpl.contentTemplate || '';
    tplForm.statusBool = tpl.status === 1;
  } else {
    tplForm.code = '';
    tplForm.bizType = 'SYSTEM';
    tplForm.titleTemplate = '';
    tplForm.contentTemplate = '';
    tplForm.statusBool = true;
  }
  tplDialogVisible.value = true;
};

const saveTemplate = async () => {
  if (!tplForm.code.trim()) { ElMessage.warning('模板编码不能为空'); return; }
  tplSaving.value = true;
  try {
    await client.post('/app/notifications/admin/templates', {
      code: tplForm.code.trim(),
      bizType: tplForm.bizType,
      titleTemplate: tplForm.titleTemplate.trim(),
      contentTemplate: tplForm.contentTemplate.trim(),
      status: tplForm.statusBool ? 1 : 0,
    });
    ElMessage.success('保存成功');
    tplDialogVisible.value = false;
    loadTemplates();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || '保存失败');
  }
  tplSaving.value = false;
};

// ── 通知记录 ─────────────────────────────────────────────────
const records = ref<any[]>([]);
const recordTotal = ref(0);
const recordLoading = ref(false);
const recordFilter = reactive({ bizType: '', userIdStr: '' });
const recordPager = reactive({ page: 1, size: 20 });

const loadRecords = async () => {
  recordLoading.value = true;
  try {
    const params: any = { page: recordPager.page, size: recordPager.size };
    if (recordFilter.bizType) params.bizType = recordFilter.bizType;
    if (recordFilter.userIdStr) params.userId = recordFilter.userIdStr;
    const res: any = await client.get('/app/notifications/admin/records', { params });
    const data = res.data?.data || res.data || {};
    records.value = data.records || [];
    recordTotal.value = data.total || 0;
  } catch { /* interceptor handles */ }
  recordLoading.value = false;
};

// ── Utils ────────────────────────────────────────────────────
const getBizTagType = (bizType: string) => {
  const map: Record<string, string> = {
    SYSTEM: '', ORDER: 'primary', LOGISTICS: 'success', MARKETING: 'danger', ANNOUNCE: 'warning',
  };
  return map[bizType] ?? '';
};

const formatTime = (v: string) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

onMounted(() => {
  loadTemplates();
  loadRecords();
});
</script>
