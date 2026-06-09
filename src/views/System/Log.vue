<template>
  <div class="page">
    <!-- 搜索栏 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="管理员/操作内容" class="!w-[200px]"
          clearable @keyup.enter="doSearch" @clear="doSearch" />
        <el-select v-model="search.module" placeholder="模块" class="!w-[140px]" clearable @change="doSearch">
          <el-option v-for="(label, val) in MODULE_MAP" :key="val" :label="label" :value="val" />
        </el-select>
        <el-select v-model="search.action" placeholder="操作类型" class="!w-[120px]" clearable @change="doSearch">
          <el-option v-for="(label, val) in ACTION_MAP" :key="val" :label="label" :value="val" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
          start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD"
          size="default" class="!w-[260px]" @change="doSearch" />
        <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <el-button @click="resetSearch"><i class="ri-refresh-line mr-1"></i>重置</el-button>
        <div class="flex-1"></div>
        <el-tooltip :content="autoRefresh ? '关闭自动刷新' : '开启自动刷新（30秒）'" placement="top">
          <el-button :type="autoRefresh ? 'success' : 'default'" @click="toggleAutoRefresh">
            <i :class="autoRefresh ? 'ri-loader-4-line animate-spin' : 'ri-refresh-line'" class="mr-1"></i>
            {{ autoRefresh ? '自动刷新中' : '自动刷新' }}
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 数据区 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <TableSkeleton v-if="loading && tableData.length === 0" />
      <EmptyState v-else-if="!loading && tableData.length === 0"
        icon="ri-file-list-3-line" tip="暂无操作日志" sub-tip="执行管理操作后会自动记录" />

      <el-table v-else :data="tableData" style="width: 100%" v-loading="loading" stripe>
        <el-table-column label="管理员" width="140">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-[#FFF4E6] flex items-center justify-center flex-shrink-0">
                <i class="ri-user-line text-[#FF6B00] text-[12px]"></i>
              </div>
              <span class="text-[13px]">{{ row.adminName || row.adminId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="模块" width="90">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ MODULE_MAP[row.module] || row.module || '其他' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作类型" width="90">
          <template #default="{ row }">
            <el-tag :type="ACTION_TAG[row.action] as any" size="small">
              {{ ACTION_MAP[row.action] || row.action || '操作' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作说明" min-width="200">
          <template #default="{ row }">
            <span class="text-[12px] text-[#555]">{{ row.description || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="IP 地址" width="130">
          <template #default="{ row }">
            <span class="text-[12px] font-mono text-[#999]">{{ row.ip || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="80">
          <template #default="{ row }">
            <el-tag :type="row.success !== false ? 'success' : 'danger'" size="small">
              {{ row.success !== false ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="165">
          <template #default="{ row }">
            <span class="text-[12px] text-[#999]">{{ safeFormat(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="详情" width="70" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="tableData.length > 0" class="flex justify-end p-4">
        <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
          :total="total" :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @change="handlePageChange" />
      </div>
    </div>

    <!-- 详情 Drawer -->
    <el-drawer v-model="detailVisible" title="操作日志详情" size="520px"
      direction="rtl" :destroy-on-close="true">
      <div v-if="currentLog" class="space-y-3">
        <div class="grid grid-cols-2 gap-2 text-[12px]">
          <div class="bg-[#FAFAFA] rounded-lg p-3">
            <div class="text-[#999] mb-1">管理员</div>
            <div class="text-[#333] font-medium">{{ currentLog.adminName || currentLog.adminId }}</div>
          </div>
          <div class="bg-[#FAFAFA] rounded-lg p-3">
            <div class="text-[#999] mb-1">操作时间</div>
            <div class="text-[#333]">{{ safeFormat(currentLog.createTime) }}</div>
          </div>
          <div class="bg-[#FAFAFA] rounded-lg p-3">
            <div class="text-[#999] mb-1">IP 地址</div>
            <div class="text-[#333] font-mono">{{ currentLog.ip || '—' }}</div>
          </div>
          <div class="bg-[#FAFAFA] rounded-lg p-3">
            <div class="text-[#999] mb-1">耗时</div>
            <div :class="(currentLog.costTime > 2000) ? 'text-[#FF4D4F]' : 'text-[#333]'">
              {{ currentLog.costTime != null ? `${currentLog.costTime} ms` : '—' }}
            </div>
          </div>
        </div>

        <div class="bg-[#FAFAFA] rounded-lg p-3">
          <div class="text-[#999] mb-1 text-[12px]">请求路径</div>
          <div class="text-[12px] text-[#333] font-mono break-all">
            <el-tag type="info" size="small" class="mr-1">{{ currentLog.method || 'GET' }}</el-tag>
            {{ currentLog.requestPath || '—' }}
          </div>
        </div>

        <div v-if="currentLog.params" class="bg-[#FAFAFA] rounded-lg p-3">
          <div class="text-[#999] mb-1 text-[12px]">请求参数</div>
          <pre class="text-[11px] text-[#333] overflow-x-auto whitespace-pre-wrap">{{ formatJson(currentLog.params) }}</pre>
        </div>

        <div v-if="currentLog.success === false" class="bg-[#FFF2F0] rounded-lg p-3 border border-[#FFCCC7]">
          <div class="text-[#FF4D4F] mb-1 text-[12px] font-medium">错误信息</div>
          <div class="text-[12px] text-[#555]">{{ currentLog.errorMsg || '未知错误' }}</div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { useListPage } from '@/composables/useListPage';
import { safeFormat } from '@/utils/dateFormat';
import EmptyState from '@/components/EmptyState.vue';
import TableSkeleton from '@/components/TableSkeleton.vue';
import client from '@/utils/http';

// ── 常量（代替魔法字符串）────────────────────────────────────────────────────
const MODULE_MAP: Record<string, string> = {
  product: '商品', order: '订单', marketing: '营销',
  user: '用户', shop: '店铺', system: '系统', auth: '认证',
};
const ACTION_MAP: Record<string, string> = {
  create: '新增', update: '修改', delete: '删除',
  query: '查询', login: '登录', logout: '登出',
};
const ACTION_TAG: Record<string, string> = {
  create: 'success', update: 'primary', delete: 'danger',
  query: 'info', login: '', logout: 'info',
};

// ── 列表（useListPage 替代手写样板）──────────────────────────────────────────
const {
  loading, tableData, total, pageNum, pageSize,
  search, dateRange, doSearch, resetSearch, handlePageChange,
} = useListPage(
  (params) => client.get('/admin/operation-logs', { params: {
    pageNum:   params.pageNum,
    pageSize:  params.pageSize,
    keyword:   params.keyword   || undefined,
    module:    params.module    || undefined,
    action:    params.action    || undefined,
    startDate: params.startDate || undefined,
    endDate:   params.endDate   || undefined,
  }}),
  { keyword: '', module: '', action: '' },
);

// ── 详情 Drawer ───────────────────────────────────────────────────────────────
const detailVisible = ref(false);
const currentLog    = ref<any>(null);

// ── 自动刷新 ──────────────────────────────────────────────────────
const autoRefresh = ref(false);
let _refreshTimer: ReturnType<typeof setInterval> | null = null;
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;
  if (autoRefresh.value) {
    _refreshTimer = setInterval(() => doSearch(), 30_000);
  } else if (_refreshTimer) {
    clearInterval(_refreshTimer);
    _refreshTimer = null;
  }
};
onUnmounted(() => { if (_refreshTimer) clearInterval(_refreshTimer); });
const openDetail    = (row: any) => { currentLog.value = row; detailVisible.value = true; };

const formatJson = (s: string) => {
  try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; }
};
</script>
