<template>
  <div class="page">
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="话题名称" class="!w-[200px]" clearable @keyup.enter="doSearch" />
        <el-select v-model="search.status" placeholder="状态" class="!w-[120px]" clearable @change="doSearch">
          <el-option label="展示中" :value="1" />
          <el-option label="已隐藏" :value="0" />
        </el-select>
        <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <div class="flex-1"></div>
        <el-button type="primary" @click="openDialog(null)"><i class="ri-add-line mr-1"></i>新增话题</el-button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe>
        <el-table-column label="话题" min-width="240">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <img v-if="row.image" :src="row.image" class="w-10 h-10 rounded-lg object-cover bg-[#F5F5F5]" />
              <div v-else class="w-10 h-10 rounded-lg bg-[#F0F0F0] flex items-center justify-center text-[#CCC]">
                <i class="ri-hashtag text-lg"></i>
              </div>
              <div>
                <div class="text-[13px] font-medium text-[#333]">#{{ row.name }}</div>
                <div class="text-[11px] text-[#999]">{{ row.description || '暂无描述' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="帖子数" width="90">
          <template #default="{ row }">{{ row.postCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="浏览量" width="90">
          <template #default="{ row }">{{ formatNum(row.viewCount || 0) }}</template>
        </el-table-column>
        <el-table-column label="是否热门" width="90">
          <template #default="{ row }">
            <el-switch v-model="row.isHot" :active-value="true" :inactive-value="false" size="small" @change="toggleHot(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '展示' : '隐藏' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button :type="row.status === 1 ? 'warning' : 'success'" link size="small" @click="toggleStatus(row)">
              {{ row.status === 1 ? '隐藏' : '显示' }}
            </el-button>
            <el-popconfirm
              title="确定删除该话题吗？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              confirm-button-type="danger"
              placement="top-end"
              :width="180"
              @confirm="deleteTopic(row)">
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end p-4">
        <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
          :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="doSearch" />
      </div>
    </div>

    <!-- 编辑弹窗：固定高度，内容区纵向滚动 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑话题' : '新增话题'"
      width="760px" :destroy-on-close="true" :close-on-click-modal="false">
      <div>
        <el-form :model="form" label-width="90px">
          <el-form-item label="话题名称" required>
            <el-input v-model="form.name" placeholder="话题名（不含#号）" />
          </el-form-item>
          <el-form-item label="话题描述">
            <el-input v-model="form.description" type="textarea" :rows="2" placeholder="话题简介（可选）" />
          </el-form-item>
          <el-form-item label="封面图">
            <MediaPicker v-model="form.image" variant="banner" height="130px" bizType="topic" />
          </el-form-item>
          <el-form-item label="话题内容">
            <div class="wang-editor-wrap">
              <Toolbar :editor="editorRef" :defaultConfig="toolbarConfig" mode="default" class="wang-toolbar" />
              <Editor v-model="form.contentBlocks" :defaultConfig="editorConfig" mode="default"
                class="wang-editor-body" @onCreated="handleCreated" />
            </div>
          </el-form-item>
          <el-form-item label="是否热门">
            <el-switch v-model="form.isHot" active-text="热门" inactive-text="普通" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" />
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="显示" inactive-text="隐藏" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, shallowRef } from 'vue';
import { ElMessage } from 'element-plus';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';
import client from '@/utils/http';
import { useListPage } from '@/composables/useListPage';
import MediaPicker from '@/components/MediaPicker/MediaPicker.vue';

// ── WangEditor ────────────────────────────────────────────────────────────────
const editorRef = shallowRef<any>(null);
const toolbarConfig = {};
const editorConfig = { placeholder: '请输入话题内容（选填）...' };

// 保存待初始化的 HTML，防止 WangEditor change 事件在 handleCreated 之前重置 form.contentBlocks
const _pendingHtml = ref('');

const handleCreated = (editor: any) => {
  editorRef.value = editor;
  // WangEditor 初始化后内容为空，必须手动调用 setHtml 推入内容。
  // 使用 _pendingHtml 而非 form.contentBlocks，避免被编辑器自身的 change 事件覆盖。
  const html = _pendingHtml.value;
  if (html) {
    setTimeout(() => {
      if (!editor.isDestroyed) {
        editor.setHtml(html);
      }
      _pendingHtml.value = '';
    }, 0);
  }
};

/**
 * 将旧版 content_blocks JSON 格式转换为 WangEditor HTML 格式。
 * 旧格式：[{"type":"text","content":"..."}, {"type":"image","url":"..."}]
 * 新格式：<p>...</p><p><img src="..." /></p>
 * 若已是 HTML 则原样返回。
 */
const convertBlocksToHtml = (raw: string): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  // 非 JSON 数组（已是 HTML 或空字符串）直接返回
  if (!trimmed.startsWith('[')) return raw;
  try {
    const blocks = JSON.parse(trimmed);
    if (!Array.isArray(blocks)) return raw;
    return blocks.map((block: any) => {
      if (block.type === 'text') {
        // 按换行拆分，每行生成一个 <p>
        return (block.content || '')
          .split('\n')
          .map((line: string) => {
            const escaped = line
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            return `<p>${escaped || '<br>'}</p>`;
          })
          .join('');
      }
      if (block.type === 'image' && block.url) {
        return `<p><img src="${block.url}" style="max-width:100%" /></p>`;
      }
      return '';
    }).join('');
  } catch {
    return raw; // 解析失败则返回原文
  }
};

// ── Table / search ────────────────────────────────────────────────────────────
const saving = ref(false);
const formatNum = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + 'w' : String(n);

const { loading, tableData, total, pageNum, pageSize, search, doSearch } =
  useListPage(
    (p) => client.get('/app/content/topics/admin', { params: {
      pageNum: p.pageNum, pageSize: p.pageSize,
      keyword: p.keyword   || undefined,
      status:  p.status    ?? undefined,
    }}),
    { keyword: '', status: null as number | null },
  );

// ── Row actions ───────────────────────────────────────────────────────────────
const toggleStatus = async (row: any) => {
  try {
    const ns = row.status === 1 ? 0 : 1;
    await client.put(`/app/content/topics/${row.id}/status`, { status: ns });
    row.status = ns;
  } catch { ElMessage.error('操作失败'); }
};

const toggleHot = async (row: any) => {
  try {
    await client.put(`/app/content/topics/${row.id}/hot`, { isHot: row.isHot });
  } catch { ElMessage.error('操作失败'); }
};

const deleteTopic = async (row: any) => {
  try {
    await client.delete(`/app/content/topics/${row.id}`);
    ElMessage.success('删除成功');
    doSearch();
  } catch { ElMessage.error('删除失败'); }
};

// ── Dialog / form ─────────────────────────────────────────────────────────────
const dialogVisible = ref(false);
const editId = ref<any>(null);
const DEFAULT_FORM = { name: '', description: '', image: '', contentBlocks: '', isHot: false, sort: 0, status: 1 };
const form = reactive({ ...DEFAULT_FORM });

const openDialog = (row: any) => {
  editId.value = row?.id || null;
  if (row) {
    Object.assign(form, DEFAULT_FORM, {
      name:        row.name        || '',
      description: row.description || '',
      image:       row.image       || '',
      isHot:       row.isHot       ?? false,
      sort:        row.sort        || 0,
      status:      row.status      ?? 1,
      contentBlocks: '',   // 编辑器内容由 _pendingHtml 驱动，置空避免 change 干扰
    });
    _pendingHtml.value = convertBlocksToHtml(row.contentBlocks || '');
  } else {
    _pendingHtml.value = '';
    Object.assign(form, { name: '', description: '', image: '', contentBlocks: '', isHot: false, sort: 0, status: 1 });
  }
  dialogVisible.value = true;
};

const save = async () => {
  if (!form.name) { ElMessage.warning('请填写话题名称'); return; }
  saving.value = true;
  try {
    if (editId.value) {
      await client.put(`/app/content/topics/${editId.value}`, form);
    } else {
      await client.post('/app/content/topics', form);
    }
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    doSearch();
  } finally { saving.value = false; }
};
// useListPage 已在 onMounted 自动加载
</script>

<style scoped>
/* ── WangEditor ────────────────────────────────────────────────────────────── */
.wang-editor-wrap {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  width: 100%;
}

.wang-toolbar {
  border-bottom: 1px solid #dcdfe6;
}

.wang-editor-body {
  height: 260px;
  overflow-y: hidden;
}
</style>
