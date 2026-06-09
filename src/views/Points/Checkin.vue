<template>
  <div class="page">
    <!-- 签到规则配置 -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="bg-white rounded-xl border border-[#F0F0F0] p-5">
        <h3 class="text-[14px] font-semibold text-[#333] mb-4 pb-3 border-b border-[#F5F5F5]">基础签到奖励</h3>
        <el-form :model="baseConfig" label-width="100px" size="default">
          <el-form-item label="每日积分">
            <el-input-number v-model="baseConfig.dailyPoints" :min="1" :max="100" />
            <span class="ml-2 text-[#999] text-[12px]">积分/天</span>
          </el-form-item>
          <el-form-item label="连续签到加成">
            <el-switch v-model="baseConfig.consecutiveBonus" active-text="开启" inactive-text="关闭" />
          </el-form-item>
          <el-form-item v-if="baseConfig.consecutiveBonus" label="加成积分">
            <el-input-number v-model="baseConfig.bonusPoints" :min="0" />
            <span class="ml-2 text-[#999] text-[12px]">积分（每连续7天叠加）</span>
          </el-form-item>
          <el-form-item label="最大连签天数">
            <el-input-number v-model="baseConfig.maxConsecutiveDays" :min="7" :max="365" :step="7" />
            <span class="ml-2 text-[#999] text-[12px]">天后重置</span>
          </el-form-item>
        </el-form>
        <el-button type="primary" @click="saveBaseConfig" :loading="saving">保存配置</el-button>
      </div>

      <div class="bg-white rounded-xl border border-[#F0F0F0] p-5">
        <h3 class="text-[14px] font-semibold text-[#333] mb-4 pb-3 border-b border-[#F5F5F5]">里程碑奖励</h3>
        <div class="space-y-2 mb-3">
          <div v-for="(m, idx) in milestones" :key="idx"
            class="flex items-center gap-2 p-2 bg-[#FAFAFA] rounded-lg">
            <span class="text-[12px] text-[#999] w-[60px] flex-shrink-0">第</span>
            <el-input-number v-model="m.days" :min="1" size="small" style="width: 90px" />
            <span class="text-[12px] text-[#999]">天奖励</span>
            <el-input-number v-model="m.points" :min="1" size="small" style="width: 90px" />
            <span class="text-[12px] text-[#999]">积分</span>
            <el-button type="danger" plain size="small" circle @click="milestones.splice(idx, 1)">
              <i class="ri-delete-bin-line text-[11px]"></i>
            </el-button>
          </div>
        </div>
        <el-button plain size="small" @click="milestones.push({ days: 7, points: 50 })">
          <i class="ri-add-line mr-1"></i>添加里程碑
        </el-button>
        <div class="mt-3">
          <el-button type="primary" @click="saveMilestones" :loading="saving2">保存里程碑</el-button>
        </div>
      </div>
    </div>

    <!-- 签到统计 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-[14px] font-semibold text-[#333]">签到统计</h3>
        <div class="flex gap-2">
          <el-date-picker v-model="statsDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" size="small" class="!w-[140px]" @change="loadStats" />
        </div>
      </div>
      <div class="grid grid-cols-4 gap-3">
        <div v-for="stat in statCards" :key="stat.label" class="bg-[#FAFAFA] rounded-xl p-4 text-center">
          <div class="text-2xl font-bold" :style="{ color: stat.color }">{{ stat.value }}</div>
          <div class="text-[12px] text-[#999] mt-1">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- 签到记录 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <div class="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5]">
        <h3 class="text-[13px] font-semibold text-[#333]">今日签到记录</h3>
        <el-button size="small" @click="loadRecords"><i class="ri-refresh-line mr-1"></i>刷新</el-button>
      </div>
      <el-table :data="records" style="width: 100%" v-loading="recordLoading" stripe>
        <el-table-column label="用户" width="160">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <img :src="row.userAvatar || AVATAR_PLACEHOLDER" class="w-7 h-7 rounded-full" />
              <span class="text-[13px]">{{ row.username || row.userId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="签到时间" width="170">
          <template #default="{ row }">{{ row.createTime || row.checkinTime }}</template>
        </el-table-column>
        <el-table-column label="连续天数" width="100">
          <template #default="{ row }">
            <span class="text-[#FF6B00] font-medium">{{ row.consecutiveDays || 1 }} 天</span>
          </template>
        </el-table-column>
        <el-table-column label="获得积分" width="100">
          <template #default="{ row }">
            <span class="text-[#00B96B] font-medium">+{{ row.points || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="设备" min-width="100">
          <template #default="{ row }">{{ row.device || '—' }}</template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end p-3">
        <el-pagination v-model:current-page="recordPage" :page-size="20" :total="recordTotal"
          layout="total, prev, pager, next" @current-change="loadRecords" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import client from '@/utils/http';
import { AVATAR_PLACEHOLDER } from '@/utils/image';
import { formatDate } from '@/utils/dateFormat';

// 基础配置
const saving = ref(false);
const saving2 = ref(false);
const baseConfig = reactive({ dailyPoints: 5, consecutiveBonus: true, bonusPoints: 5, maxConsecutiveDays: 30 });
const milestones = ref<Array<{ days: number; points: number }>>([
  { days: 7, points: 30 }, { days: 14, points: 50 }, { days: 30, points: 100 },
]);

const loadConfig = async () => {
  try {
    const res: any = await client.get('/app/points/checkin/config');
    const data = res.data?.data || res.data;
    if (data) {
      // Backend returns weeklyRules array; derive dailyPoints from Mon's rule
      const rules: any[] = data.weeklyRules || [];
      const monRule = rules.find((r: any) => r.dayOfWeek === 1);
      baseConfig.dailyPoints = monRule?.points || data.dailyPoints || 5;
      baseConfig.consecutiveBonus = data.consecutiveBonus ?? true;
      baseConfig.bonusPoints = data.bonusPoints || 5;
      baseConfig.maxConsecutiveDays = data.maxConsecutiveDays || 30;
      // Milestones from backend: [{days, rewardPoints, label, icon}] or [{days, points}]
      const rawMilestones: any[] = data.milestones || [];
      if (rawMilestones.length > 0) {
        milestones.value = rawMilestones.map((m: any) => ({
          days: m.days || 7,
          points: m.rewardPoints || m.points || 0,
        }));
      }
    }
  } catch { /* interceptor handles */ }
};

const saveBaseConfig = async () => {
  saving.value = true;
  try {
    // Convert milestones to backend format {days, rewardPoints, label, icon}
    const normalizedMilestones = milestones.value.map((m: any) => ({
      days: m.days,
      rewardPoints: m.points,
      label: `+${m.points}积分`,
      icon: 'ri-gift-line',
    }));
    await client.put('/app/points/checkin/config', {
      dailyPoints: baseConfig.dailyPoints,
      consecutiveBonus: baseConfig.consecutiveBonus,
      bonusPoints: baseConfig.bonusPoints,
      maxConsecutiveDays: baseConfig.maxConsecutiveDays,
      milestones: normalizedMilestones,
    });
    ElMessage.success('配置已保存');
  } catch { ElMessage.error('保存失败'); }
  saving.value = false;
};

const saveMilestones = async () => {
  saving2.value = true;
  try {
    const normalizedMilestones = milestones.value.map((m: any) => ({
      days: m.days,
      rewardPoints: m.points,
      label: `+${m.points}积分`,
      icon: 'ri-gift-line',
    }));
    await client.put('/app/points/checkin/milestones', { milestones: normalizedMilestones });
    ElMessage.success('里程碑已保存');
  } catch { ElMessage.error('保存失败'); }
  saving2.value = false;
};

// 统计
const statsDate = ref(formatDate(new Date().toISOString()));
const statCards = ref([
  { label: '今日签到人数', value: '—', color: '#FF6B00' },
  { label: '今日积分发放', value: '—', color: '#00B96B' },
  { label: '总签到人次', value: '—', color: '#165DFF' },
  { label: '连续签到7天', value: '—', color: '#722ED1' },
]);

const loadStats = async () => {
  try {
    const res: any = await client.get('/app/points/checkin/stats', { params: { date: statsDate.value } });
    const data = res.data?.data || res.data || {};
    statCards.value[0].value = String(data.todayCount || 0);
    statCards.value[1].value = String(data.todayPoints || 0);
    statCards.value[2].value = String(data.totalCount || 0);
    statCards.value[3].value = String(data.consecutiveCount || 0);
  } catch { /* interceptor handles */ }
};

// 签到记录
const records = ref<any[]>([]);
const recordLoading = ref(false);
const recordPage = ref(1);
const recordTotal = ref(0);

const loadRecords = async () => {
  recordLoading.value = true;
  try {
    const res: any = await client.get('/app/points/checkin/records', {
      params: { pageNum: recordPage.value, pageSize: 20, date: statsDate.value }
    });
    const data = res.data?.data || res.data || {};
    records.value = data.records || [];
    recordTotal.value = data.total || 0;
  } catch { /* interceptor handles */ }
  recordLoading.value = false;
};

onMounted(() => { loadConfig(); loadStats(); loadRecords(); });
</script>
