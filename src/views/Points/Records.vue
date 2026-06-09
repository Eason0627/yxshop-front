<template>
  <div class="page">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-4 gap-4 mb-4">
      <div v-for="card in statCards" :key="card.label" class="bg-white rounded-xl border border-[#F0F0F0] p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[12px] text-[#999]">{{ card.label }}</span>
          <div class="w-8 h-8 rounded-lg flex items-center justify-center" :style="{ background: card.lightBg }">
            <i :class="card.icon" class="text-base" :style="{ color: card.color }"></i>
          </div>
        </div>
        <div class="text-xl font-bold text-[#1A1A1A]">
          <span v-if="statsLoading" class="inline-block w-12 h-6 bg-[#F0F0F0] rounded animate-pulse"></span>
          <span v-else>{{ card.value }}</span>
        </div>
      </div>
    </div>

    <!-- 搜索 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="search.keyword" placeholder="用户ID/用户名" class="!w-[180px]" clearable @keyup.enter="doSearch" />
        <el-select v-model="search.type" placeholder="变动类型" class="!w-[150px]" clearable @change="doSearch">
          <el-option label="签到" value="checkin" />
          <el-option label="购物获得" value="purchase" />
          <el-option label="兑换消耗" value="redeem" />
          <el-option label="活动奖励" value="activity" />
          <el-option label="管理员调整" value="admin" />
          <el-option label="过期清零" value="expire" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
          start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD"
          size="default" class="!w-[260px]" @change="doSearch" />
        <el-button type="primary" @click="doSearch"><i class="ri-search-line mr-1"></i>搜索</el-button>
        <el-button @click="resetSearch"><i class="ri-refresh-line mr-1"></i>重置</el-button>
        <div class="flex-1"></div>
        <el-button type="primary" plain @click="openAdjustDialog">
          <i class="ri-equalizer-line mr-1"></i>手动调整积分
        </el-button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe>
        <el-table-column label="用户" width="160">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <img :src="row.userAvatar || AVATAR_PLACEHOLDER" class="w-7 h-7 rounded-full" />
              <span class="text-[13px]">{{ row.username || row.userId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="变动类型" width="120">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type)" size="small">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="积分变动" width="120">
          <template #default="{ row }">
            <span :class="row.points > 0 ? 'text-[#00B96B]' : 'text-[#FF4D4F]'" class="font-medium text-[14px]">
              {{ row.points > 0 ? '+' : '' }}{{ row.points }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="变动后余额" width="120">
          <template #default="{ row }">{{ row.balance || '—' }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180">
          <template #default="{ row }">{{ row.remark || row.description || '—' }}</template>
        </el-table-column>
        <el-table-column label="时间" width="170">
          <template #default="{ row }">
            <span class="text-[12px] text-[#999]">{{ safeFormat(row.createTime) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end p-4">
        <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
          :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="doSearch" />
      </div>
    </div>

    <!-- 手动调整弹窗 -->
    <el-dialog :destroy-on-close="true" v-model="adjustVisible" title="手动调整积分" width="440px">
      <el-form :model="adjustForm" label-width="80px">
        <el-form-item label="用户ID" required>
          <el-input v-model="adjustForm.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="调整积分" required>
          <el-input-number v-model="adjustForm.points" :min="-99999" :max="99999" placeholder="正数增加，负数减少" />
        </el-form-item>
        <el-form-item label="备注" required>
          <el-input v-model="adjustForm.remark" placeholder="请说明调整原因（必填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">取消</el-button>
        <el-button type="primary" :loading="adjusting" @click="confirmAdjust">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import client from '@/utils/http';
import { safeFormat } from '@/utils/dateFormat';
import { useListPage } from '@/composables/useListPage';
import { AVATAR_PLACEHOLDER } from '@/utils/image';

const { loading, tableData, total, pageNum, pageSize, search, dateRange, doSearch, resetSearch } =
  useListPage(
    (p) => client.get('/app/points/records/admin', { params: {
      pageNum: p.pageNum, pageSize: p.pageSize,
      keyword: p.keyword || undefined, type: p.type || undefined,
      startDate: p.startDate || undefined,
      endDate:   p.endDate   || undefined,
    }}),
    { keyword: '', type: '' },
  );

const typeText = (t: string) => ({
  checkin: '签到', purchase: '购物获得', redeem: '兑换消耗',
  activity: '活动奖励', admin: '管理员调整', expire: '过期清零',
}[t] || t || '其他');
const typeTag = (t: string): any => ({
  checkin: 'success', purchase: 'primary', redeem: 'warning',
  activity: '', admin: 'danger', expire: 'info',
}[t] || 'info');

const statCards = ref([
  { label: '今日发放积分', value: '—', icon: 'ri-coin-line', color: '#FF6B00', lightBg: '#FFF4E6' },
  { label: '今日消耗积分', value: '—', icon: 'ri-exchange-line', color: '#165DFF', lightBg: '#EEF3FF' },
  { label: '系统总积分余额', value: '—', icon: 'ri-bank-line', color: '#00B96B', lightBg: '#E8FAF2' },
  { label: '总用户积分人数', value: '—', icon: 'ri-user-star-line', color: '#722ED1', lightBg: '#F9F0FF' },
]);

const statsLoading = ref(true);
const loadStats = async () => {
  statsLoading.value = true;
  try {
    const res: any = await client.get('/app/points/stats');
    const data = res.data?.data || res.data || {};
    statCards.value[0].value = String(data.todayIssued ?? 0);
    statCards.value[1].value = String(data.todayConsumed ?? 0);
    statCards.value[2].value = String(data.totalBalance ?? 0);
    statCards.value[3].value = String(data.userCount ?? 0);
  } catch { /* interceptor handles */ }
  finally { statsLoading.value = false; }
};


// 调整积分
const adjustVisible = ref(false);
const adjusting = ref(false);
const adjustForm = reactive({ userId: '', points: 0, remark: '' });

const openAdjustDialog = () => {
  adjustForm.userId = ''; adjustForm.points = 0; adjustForm.remark = '';
  adjustVisible.value = true;
};

const confirmAdjust = async () => {
  if (!adjustForm.userId) { ElMessage.warning('请填写用户ID'); return; }
  if (adjustForm.points === 0) { ElMessage.warning('积分变动不能为0'); return; }
  if (!adjustForm.remark) { ElMessage.warning('请填写调整原因'); return; }
  adjusting.value = true;
  try {
    await client.post('/app/points/admin/adjust', { ...adjustForm });
    ElMessage.success('积分调整成功');
    adjustVisible.value = false;
    doSearch(); loadStats();
  } finally { adjusting.value = false; }
};

onMounted(() => loadStats()); // useListPage 已自动加载列表
</script>
