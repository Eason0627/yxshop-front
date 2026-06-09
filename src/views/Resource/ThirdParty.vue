<template>
  <div class="page space-y-4">

    <!-- 统计概览 -->
    <div class="grid grid-cols-4 gap-4">
      <div v-for="stat in summaryStats" :key="stat.label"
        class="bg-white rounded-xl border border-[#F0F0F0] p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          :style="{ background: stat.bg }">
          <i :class="stat.icon" class="text-[16px]" :style="{ color: stat.color }"></i>
        </div>
        <div class="min-w-0">
          <div class="text-[18px] font-bold text-[#333] leading-tight">{{ stat.value }}</div>
          <div class="text-[11px] text-[#999] mt-0.5">{{ stat.label }}</div>
          <div v-if="stat.sub" class="text-[10px] text-[#CCC] mt-0.5 truncate">{{ stat.sub }}</div>
        </div>
      </div>
    </div>

    <!-- 接入的第三方服务 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0]">
      <div class="px-4 py-3 border-b border-[#F5F5F5]">
        <h3 class="text-[14px] font-semibold text-[#333]">接入的第三方服务</h3>
      </div>

      <div class="divide-y divide-[#F5F5F5]">
        <div v-for="svc in services" :key="svc.id"
          class="flex items-center gap-4 px-4 py-4 hover:bg-[#FAFAFA] transition-colors">

          <!-- 图标 -->
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            :style="{ background: svc.bg }">
            <i :class="svc.icon" class="text-[18px]" :style="{ color: svc.color }"></i>
          </div>

          <!-- 名称 + 描述 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[13px] font-medium text-[#333]">{{ svc.name }}</span>
              <el-tag :type="svc.configured ? 'success' : 'warning'" size="small">
                {{ svc.configured ? '已配置' : '待配置' }}
              </el-tag>
              <el-tag v-if="!svc.active" type="info" size="small">已停用</el-tag>
            </div>
            <div class="text-[11px] text-[#999] mt-0.5">{{ svc.desc }}</div>
          </div>

          <!-- OSS 真实用量条 -->
          <div v-if="svc.id === 'alioss'" class="w-[200px] flex-shrink-0">
            <template v-if="ossStats.storageOk">
              <div class="flex justify-between text-[11px] text-[#999] mb-1">
                <span>存储用量</span>
                <span>{{ ossStats.storageGB }} GB / {{ ossStats.objectCount }} 对象</span>
              </div>
              <el-progress :percentage="Math.min((ossStats.storageGB ?? 0) * 10, 100)"
                color="#FF6B00" :show-text="false" :stroke-width="6" />
            </template>
            <div v-else class="text-[11px] text-[#CCC]">{{ ossStats.storageError || '未配置' }}</div>
          </div>
          <div v-else class="w-[200px] flex-shrink-0 text-[11px] text-[#CCC]">{{ svc.remark }}</div>

          <!-- 费用 -->
          <div class="w-[110px] flex-shrink-0 text-right">
            <template v-if="svc.id === 'alioss'">
              <div class="text-[13px] font-semibold text-[#333]">
                {{ ossStats.billEstimated != null ? '≈¥' + Number(ossStats.billEstimated).toFixed(2) : '—' }}
              </div>
              <div class="text-[10px] text-[#999]">本月存储预估</div>
            </template>
            <template v-else>
              <div class="text-[13px] text-[#CCC]">{{ svc.billing }}</div>
              <div class="text-[10px] text-[#999]">计费参考</div>
            </template>
          </div>

          <!-- 操作 -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <el-button v-if="svc.id === 'alioss'" type="primary" link size="small" @click="ossDetailVisible = true">
              <i class="ri-bar-chart-2-line mr-0.5"></i>详情
            </el-button>
            <el-button link size="small" @click="openConfig(svc)">
              <i class="ri-settings-3-line mr-0.5"></i>配置
            </el-button>
            <el-switch :model-value="svc.active" size="small" @change="toggleService(svc)" />
            <el-popconfirm
              :title="`确定删除「${svc.name}」配置？此操作将清空已保存的配置信息。`"
              confirm-button-text="确认删除"
              cancel-button-text="取消"
              confirm-button-type="danger"
              width="260"
              @confirm="deleteService(svc)"
            >
              <template #reference>
                <el-button link size="small" class="!text-[#FF4D4F]">
                  <i class="ri-delete-bin-line"></i>
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </div>

    <!-- OSS 详情抽屉 -->
    <el-drawer v-model="ossDetailVisible" title="阿里云 OSS 用量详情" size="440px" direction="rtl">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-[#FAFAFA] rounded-xl p-3 text-center">
            <div class="text-[22px] font-bold text-[#333]">{{ ossStats.storageGB ?? '—' }} <span class="text-[13px] font-normal">GB</span></div>
            <div class="text-[11px] text-[#999]">当前存储量</div>
          </div>
          <div class="bg-[#FAFAFA] rounded-xl p-3 text-center">
            <div class="text-[22px] font-bold text-[#333]">{{ ossStats.objectCount ?? '—' }}</div>
            <div class="text-[11px] text-[#999]">对象数量</div>
          </div>
          <div class="bg-[#FAFAFA] rounded-xl p-3 text-center col-span-2">
            <div class="text-[22px] font-bold text-[#FF6B00]">
              {{ ossStats.billEstimated != null ? '≈¥' + Number(ossStats.billEstimated).toFixed(2) : '—' }}
            </div>
            <div class="text-[11px] text-[#999]">本月存储预估（¥0.12/GB）</div>
          </div>
        </div>
        <div class="bg-[#FFFBE6] border border-[#FFE58F] rounded-lg p-3 text-[12px] text-[#AD6800]">
          <i class="ri-information-line mr-1"></i>
          费用为存储量估算，不含请求次数与流量费。如需精确账单请前往
          <a href="https://usercenter2.aliyun.com/finance/bill-manage" target="_blank"
            class="underline">阿里云费用中心</a> 查看。
        </div>
        <div class="space-y-2 text-[12px]">
          <div class="flex justify-between py-2 border-b border-[#F5F5F5]">
            <span class="text-[#999] whitespace-nowrap">Endpoint</span>
            <span class="text-[#333] font-mono text-right max-w-[240px] truncate">{{ ossConfig.endpoint || '—' }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-[#F5F5F5]">
            <span class="text-[#999] whitespace-nowrap">Bucket</span>
            <span class="text-[#333]">{{ ossConfig.bucketName || '—' }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-[#F5F5F5]">
            <span class="text-[#999] whitespace-nowrap">AccessKey ID</span>
            <span class="text-[#333] font-mono">{{ ossConfig.accessKeyId || '—' }}</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-[#999] whitespace-nowrap">完整定价</span>
            <a href="https://www.aliyun.com/price/product#/oss/detail" target="_blank"
              class="text-[#409EFF] hover:underline">价格计算器 →</a>
          </div>
        </div>
        <div class="flex gap-2">
          <el-button size="small" plain :loading="ossStatsLoading" @click="refreshOssStats">
            <i class="ri-refresh-line mr-1"></i>刷新统计
          </el-button>
          <el-button size="small" plain @click="openConfig(services.find(s=>s.id==='alioss')!)">
            <i class="ri-settings-3-line mr-1"></i>修改配置
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 服务配置弹窗 -->
    <el-dialog v-model="configVisible" :title="configTitle" width="520px" :destroy-on-close="true" :append-to-body="true">
      <el-form :model="configForm" label-width="150px" class="config-form">

        <!-- OSS -->
        <template v-if="configSvcId === 'alioss'">
          <el-alert style="margin-bottom:24px" class="" type="info" :closable="false" show-icon
            description="配置保存到 Redis，立即生效。" />
          <el-form-item label="Endpoint">
            <el-input v-model="configForm.endpoint" placeholder="oss-cn-hangzhou.aliyuncs.com" />
          </el-form-item>
          <el-form-item label="Bucket">
            <el-input v-model="configForm.bucketName" placeholder="存储桶名称" />
          </el-form-item>
          <el-form-item label="AccessKey ID">
            <el-input v-model="configForm.accessKeyId" placeholder="RAM 账号 AccessKey ID" />
          </el-form-item>
          <el-form-item label="AccessKey Secret">
            <el-input v-model="configForm.accessKeySecret" type="password" show-password placeholder="留空不修改" />
          </el-form-item>
          <el-form-item label="计费参考">
            <span class="text-[12px] text-[#999]">¥0.12/GB/月 · GET ¥0.01/万次 · 流出 ¥0.50/GB</span>
          </el-form-item>
        </template>

        <!-- SMTP -->
        <template v-else-if="configSvcId === 'email'">
          <el-alert style="margin-bottom:24px" class="" type="info" :closable="false" show-icon
            description="配置保存到 Redis，立即生效，无需重启。" />
          <el-form-item label="SMTP 主机">
            <el-input v-model="configForm.host" placeholder="smtp.qq.com / smtpdm.aliyun.com" />
          </el-form-item>
          <el-form-item label="SMTP 端口">
            <el-input v-model="configForm.port" placeholder="465（SSL）或 587（TLS）" />
          </el-form-item>
          <el-form-item label="发件邮箱">
            <el-input v-model="configForm.username" placeholder="发件人邮箱地址" />
          </el-form-item>
          <el-form-item label="授权码 / 密码">
            <el-input v-model="configForm.password" type="password" show-password
              placeholder="QQ 邮箱请使用授权码（非登录密码）" />
          </el-form-item>
          <el-form-item label="服务推荐">
            <div class="text-[12px] text-[#999] space-y-0.5 leading-relaxed">
              <div>• <strong class="text-[#555]">QQ SMTP</strong> — 免费，适合开发测试</div>
              <div>• <strong class="text-[#555]">阿里云邮件推送</strong> smtpdm.aliyun.com — ¥0.033/封，生产推荐</div>
            </div>
          </el-form-item>
        </template>

        <!-- 短信服务 -->
        <template v-else-if="configSvcId === 'sms'">
          <el-alert style="margin-bottom:24px" type="success" :closable="false" show-icon>
            <template #default>
              AccessKey ID / Secret 与 <strong>阿里云 OSS 共用同一 RAM 账号</strong>，无需重复填写。
              仅需填入在
              <a href="https://dypns.console.aliyun.com/" target="_blank"
                class="text-[#409EFF] hover:underline">号码验证服务控制台</a>
              获取的签名和模板。
            </template>
          </el-alert>
          <el-form-item label="短信签名（SignName）">
            <el-input v-model="configForm.signName"
              placeholder="如「速通互联验证码」，在号码验证服务控制台获取" />
            <div class="text-[11px] text-[#999] mt-1">系统提供的签名，非普通短信自定义签名</div>
          </el-form-item>
          <el-form-item label="模板编号（TemplateCode）">
            <el-input v-model="configForm.templateCode"
              placeholder="如 100001，在号码验证服务控制台获取" />
          </el-form-item>
          <el-form-item label="使用场景">
            <div class="text-[12px] text-[#999] space-y-0.5 leading-relaxed">
              <div>• 开店入驻申请 — 联系手机号验证</div>
              <div>• 用户注册 — 手机验证码</div>
              <div>• 修改密码 / 换绑手机号</div>
              <div class="text-[#52C41A] font-medium">✓ 管理员登录使用自研滑块验证码，不消耗短信额度</div>
            </div>
          </el-form-item>
          <el-form-item label="计费参考">
            <div class="text-[12px] text-[#999] space-y-0.5">
              <div>≤1,000 次/月：<strong class="text-[#555]">¥0.06 / 次</strong></div>
              <div>1,000~10,000 次/月：¥0.05 / 次</div>
              <div>>10,000 次/月：¥0.04 / 次</div>
              <div>仅成功投递计费，发送失败不收费</div>
            </div>
          </el-form-item>
        </template>

        <!-- 高德地图 -->
        <template v-else-if="configSvcId === 'amap'">
          <el-alert style="margin-bottom:24px" type="info" :closable="false" show-icon
            description="Key 已通过前端环境变量 VITE_AMAP_KEY 注入，此处配置用于记录和展示。安全密钥（jscode）填入后重新部署生效。" />
          <el-form-item label="Web Key（JS API）">
            <el-input v-model="configForm.webKey" placeholder="控制台创建的 Web端(JS API) Key" />
          </el-form-item>
          <el-form-item label="安全密钥（jscode）">
            <el-input v-model="configForm.securityKey" type="password" show-password placeholder="留空不修改" />
          </el-form-item>
          <el-form-item label="计费参考">
            <div class="text-[12px] text-[#999] space-y-1 leading-relaxed">
              <div class="font-medium text-[#555]">个人认证开发者（免费配额）</div>
              <div>• 基础 LBS 服务：<strong>150,000 次/月</strong>（3 QPS）</div>
              <div>• 地图 JS API：<strong>150万次/月</strong>（10 QPS）</div>
              <div>• 搜索服务：<strong>5,000 次/月</strong>（3 QPS）</div>
              <div class="font-medium text-[#555] mt-1">超出计费（按量）</div>
              <div>• 基础 LBS：0~30万 ¥30/万次 · 30万~100万 ¥24/万次 · >100万 ¥18/万次</div>
              <div>• 搜索 / 地理编码：¥30/万次（无折扣）</div>
              <div class="mt-1">
                <a href="https://lbs.amap.com/pages/base_service_price" target="_blank"
                  class="text-[#409EFF] hover:underline">完整计费说明 →</a>
              </div>
            </div>
          </el-form-item>
        </template>

        <!-- 快递查询 API（快递100） -->
        <template v-else-if="configSvcId === 'logistics'">
          <el-alert style="margin-bottom:24px" type="info" :closable="false" show-icon>
            <template #default>
              前往
              <a href="https://www.kuaidi100.com/openapi/index.shtml" target="_blank"
                class="text-[#409EFF] hover:underline">快递100 开放平台</a>
              注册获取 Customer（客户编号）和 Key（密钥）。
              免费额度：<strong>100次/天</strong>，超出 ¥0.02/次。
            </template>
          </el-alert>
          <el-form-item label="服务商">
            <el-select v-model="configForm.provider" class="w-full">
              <el-option value="kuaidi100" label="快递100（推荐）" />
            </el-select>
          </el-form-item>
          <el-form-item label="Customer（编号）">
            <el-input v-model="configForm.customer" placeholder="快递100 控制台的 customer 编号" />
          </el-form-item>
          <el-form-item label="Key（密钥）">
            <el-input v-model="configForm.key" type="password" show-password placeholder="留空不修改" />
          </el-form-item>
          <el-form-item label="支持快递">
            <div class="text-[12px] text-[#999] flex flex-wrap gap-1">
              <el-tag size="small" effect="plain" v-for="c in ['顺丰','圆通','中通','韵达','申通','京东','EMS','德邦','百世']" :key="c">{{ c }}</el-tag>
              <span class="ml-1">等 1000+ 家快递</span>
            </div>
          </el-form-item>
          <el-form-item label="计费">
            <div class="text-[12px] text-[#999] space-y-0.5">
              <div>新账号注册后有少量<strong class="text-[#555]">试用额度</strong>（仅供测试，非持续免费）</div>
              <div>正式使用需购买套餐，实际价格以官网为准</div>
              <div class="mt-1">
                <a href="https://api.kuaidi100.com/manager/v2/myapi" target="_blank"
                  class="text-[#409EFF] hover:underline">查看官网套餐价格 →</a>
              </div>
              <div class="text-[#52C41A] mt-1">💡 如需每天 100 次持续免费额度，可改用<strong class="text-[#555]">聚合数据快递查询</strong>（juhe.cn）</div>
            </div>
          </el-form-item>
        </template>

        <!-- 阿里云验证码 2.0 -->
        <template v-else-if="configSvcId === 'captcha'">
          <el-alert style="margin-bottom:24px" type="success" :closable="false" show-icon>
            <template #default>
              AccessKey ID / Secret 与 OSS 共用同一 RAM 账号，<strong>无需重复填写</strong>。
              仅需填入在
              <a href="https://yundun.console.aliyun.com/?p=captcha" target="_blank"
                class="text-[#409EFF] hover:underline">阿里云验证码控制台</a>
              创建的场景 ID。
            </template>
          </el-alert>
          <el-form-item label="场景 ID（SceneId）">
            <el-input v-model="configForm.sceneId" placeholder="控制台「场景管理」中的 SceneId" />
          </el-form-item>
          <el-form-item label="前缀（prefix）">
            <el-input v-model="configForm.prefix" placeholder="控制台「场景管理」中的前缀标识" />
          </el-form-item>
          <el-form-item label="当前状态">
            <div class="text-[12px] text-[#999] space-y-0.5 leading-relaxed">
              <div>• 当前登录使用<strong class="text-[#555]">自研滑块验证码</strong>（无计费）</div>
              <div>• 配置 SceneId 后可在代码中切换为阿里云验证码 2.0</div>
              <div>• 按量计费：国内 <strong class="text-[#555]">¥0.005/次</strong>，国际 ¥0.007/次</div>
            </div>
          </el-form-item>
        </template>

      </el-form>
      <template #footer>
        <el-button @click="configVisible = false">取消</el-button>
        <el-button type="primary" :loading="configSaving" @click="saveConfig">保存配置</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { systemConfigApi } from '@/utils/admin-api';

// ── 服务列表 ────────────────────────────────────────────────────────────────
const services = ref([
  {
    id: 'alioss', name: '阿里云 OSS', provider: '阿里云',
    desc: '图片、文件存储，用于商品图、Banner、用户头像等资源托管',
    icon: 'ri-cloud-line', color: '#FF6A00', bg: '#FFF3E8',
    active: true, configured: false, remark: '', billing: '按量计费',
  },
  {
    id: 'email', name: 'SMTP 邮件服务', provider: 'QQ 邮箱',
    desc: '邮箱验证码、订单通知、密码重置等邮件发送',
    icon: 'ri-mail-send-line', color: '#00B2FF', bg: '#E6F9FF',
    active: true, configured: false, remark: '邮箱验证码触发', billing: '免费',
  },
  {
    id: 'sms', name: '阿里云号码验证短信', provider: '阿里云',
    desc: '注册/修改密码/开店入驻手机验证码 · dypnsapi · 验证码由服务端自动生成下发',
    icon: 'ri-message-2-line', color: '#13C2C2', bg: '#E6FFFB',
    active: true, configured: false, remark: '注册/改密/入驻触发', billing: '≤1000次 ¥0.06/次',
  },
  {
    id: 'captcha', name: '阿里云验证码 2.0（CAPTCHA）', provider: '阿里云',
    desc: '可选接入 · 登录人机验证拼图（当前使用自研滑块，配置后可切换为阿里云版）',
    icon: 'ri-shield-check-line', color: '#722ED1', bg: '#F9F0FF',
    active: true, configured: false, remark: '可选，登录页嵌入', billing: '按量 ¥0.005/次',
  },
  {
    id: 'amap', name: '高德地图 JS API', provider: '高德地图',
    desc: '仓库选址、收货地址展示、物流轨迹地图 · JS API 2.0 · Web 服务',
    icon: 'ri-map-2-line', color: '#009944', bg: '#F0FFF4',
    active: true, configured: false,
    remark: '地图展示 / 选址 / 地理编码',
    billing: '免费 150万次/月（个人）',
  },
  {
    id: 'logistics', name: '快递100 物流查询 API', provider: '快递100',
    desc: '快递单号实时查询 · 支持顺丰/圆通/中通/韵达/申通/京东/EMS 等 1000+ 家快递',
    icon: 'ri-truck-line', color: '#FF6B00', bg: '#FFF3E8',
    active: true, configured: false,
    remark: '物流轨迹查询触发',
    billing: '新账号试用额度，按量套餐起步',
  },
]);

// ── OSS 真实统计 ─────────────────────────────────────────────────────────────
const ossStats        = reactive<any>({});
const ossConfig       = reactive<any>({});
const ossStatsLoading = ref(false);
const ossDetailVisible = ref(false);

const loadOssConfig = async () => {
  try {
    const res: any = await systemConfigApi.getOss();
    const d = res.data?.data || res.data || {};
    Object.assign(ossConfig, d);
    const oss = services.value.find(s => s.id === 'alioss');
    if (oss) {
      oss.configured = !!(d.endpoint && d.accessKeyId);
      oss.desc = d.bucketName
        ? `Bucket: ${d.bucketName}  ·  AccessKey: ${d.accessKeyId || '—'}`
        : '图片、文件存储，用于商品图、Banner、用户头像等资源托管';
    }
  } catch { /* interceptor */ }
};

const loadOssStats = async () => {
  ossStatsLoading.value = true;
  try {
    const res: any = await systemConfigApi.getOssStats();
    Object.assign(ossStats, res.data?.data || res.data || {});
  } catch { /* ignore */ }
  ossStatsLoading.value = false;
};

const refreshOssStats = async () => {
  ossStatsLoading.value = true;
  try {
    const res: any = await systemConfigApi.refreshOssStats();
    Object.assign(ossStats, res.data?.data || res.data || {});
    ElMessage.success('统计数据已刷新');
  } catch { /* ignore */ }
  ossStatsLoading.value = false;
};

// ── 其他服务配置状态加载 ─────────────────────────────────────────────────────
const checkConfigured = async (svcId: string, api: () => Promise<any>) => {
  try {
    const res: any = await api();
    const d = res.data?.data || res.data || {};
    const svc = services.value.find(s => s.id === svcId);
    if (svc) svc.configured = !!d.configured;
  } catch { /* ignore */ }
};

// ── 汇总卡 ───────────────────────────────────────────────────────────────────
const summaryStats = computed(() => {
  const total      = services.value.length;
  const configured = services.value.filter(s => s.configured).length;
  const active     = services.value.filter(s => s.active).length;
  return [
    {
      label: '已配置服务',
      value: `${configured} / ${total}`,
      sub:   `${active} 个服务运行中`,
      icon: 'ri-links-line', color: '#165DFF', bg: '#E8F0FF',
    },
    {
      label: '服务运行状态',
      value: active === total ? '全部正常' : `${active} / ${total} 活跃`,
      sub:   configured < total ? `${total - configured} 个待配置` : '所有服务已配置',
      icon: 'ri-pulse-line', color: '#52C41A', bg: '#F6FFED',
    },
    {
      label: 'OSS 存储用量',
      value: ossStats.storageGB != null ? `${ossStats.storageGB} GB` : '—',
      sub:   ossStats.objectCount != null ? `${ossStats.objectCount} 个对象` : '暂无数据',
      icon: 'ri-hard-drive-2-line', color: '#FF6B00', bg: '#FFF3E8',
    },
    {
      label: '本月预估费用',
      value: ossStats.billEstimated != null ? `≈¥${Number(ossStats.billEstimated).toFixed(2)}` : '—',
      sub:   'OSS 存储估算（不含流量）',
      icon: 'ri-money-cny-circle-line', color: '#FF4D4F', bg: '#FFF1F0',
    },
  ];
});

// ── 配置弹窗 ─────────────────────────────────────────────────────────────────
const configVisible = ref(false);
const configSaving  = ref(false);
const configSvcId   = ref('');
const configForm    = reactive<any>({});

const configTitle = computed(() => {
  const s = services.value.find(s => s.id === configSvcId.value);
  return s ? `${s.name} — 配置` : '服务配置';
});

const openConfig = async (svc: any) => {
  if (!svc) return;
  configSvcId.value = svc.id;
  Object.keys(configForm).forEach(k => delete configForm[k]);

  try {
    if (svc.id === 'alioss') {
      const d = ((await systemConfigApi.getOss()) as any).data?.data || {};
      Object.assign(configForm, { endpoint: d.endpoint || '', bucketName: d.bucketName || '',
        accessKeyId: d.accessKeyId || '', accessKeySecret: '' });
    } else if (svc.id === 'email') {
      const d = ((await systemConfigApi.getSmtpConfig()) as any).data?.data || {};
      Object.assign(configForm, { host: d.host || 'smtp.qq.com', port: d.port || '465',
        username: d.username || '', password: '' });
    } else if (svc.id === 'sms') {
      const d = ((await systemConfigApi.getSmsConfig()) as any).data?.data || {};
      Object.assign(configForm, {
        signName:     d.signName     || '',
        templateCode: d.templateCode || '',
      });
    } else if (svc.id === 'captcha') {
      const d = ((await systemConfigApi.getCaptchaConfig()) as any).data?.data || {};
      Object.assign(configForm, { sceneId: d.sceneId || '', prefix: d.prefix || '' });
    } else if (svc.id === 'amap') {
      const d = ((await systemConfigApi.getAmapConfig()) as any).data?.data || {};
      Object.assign(configForm, { webKey: d.webKey || '', securityKey: '' });
    } else if (svc.id === 'logistics') {
      const d = ((await systemConfigApi.getLogisticsConfig()) as any).data?.data || {};
      Object.assign(configForm, { provider: d.provider || 'kuaidi100', customer: d.customer || '', key: '' });
    }
  } catch { /* ignore */ }
  configVisible.value = true;
};

const saveConfig = async () => {
  configSaving.value = true;
  try {
    if (configSvcId.value === 'alioss') {
      await systemConfigApi.saveOss(configForm);
      await loadOssConfig();
      Object.keys(ossStats).forEach(k => delete ossStats[k]);
      loadOssStats();
      ElMessage.success('OSS 配置已保存，重启服务后完全生效');
    } else if (configSvcId.value === 'email') {
      await systemConfigApi.saveSmtpConfig(configForm);
      await checkConfigured('email', systemConfigApi.getSmtpConfig);
      ElMessage.success('邮件配置已保存，立即生效');
    } else if (configSvcId.value === 'sms') {
      // AK 与 OSS 共用：一并写入 SMS config，兼容后端 isConfigured() 检查
      const ossRes = ((await systemConfigApi.getOss()) as any).data?.data || {};
      await systemConfigApi.saveSmsConfig({ ...configForm, accessKeyId: ossRes.accessKeyId || '' });
      await checkConfigured('sms', systemConfigApi.getSmsConfig);
      ElMessage.success('短信配置已保存，立即生效');
    } else if (configSvcId.value === 'captcha') {
      await systemConfigApi.saveCaptchaConfig(configForm);
      await checkConfigured('captcha', systemConfigApi.getCaptchaConfig);
      ElMessage.success('验证码配置已保存，立即生效');
    } else if (configSvcId.value === 'amap') {
      await systemConfigApi.saveAmapConfig(configForm);
      await checkConfigured('amap', systemConfigApi.getAmapConfig);
      ElMessage.success('高德地图配置已保存');
    } else if (configSvcId.value === 'logistics') {
      await systemConfigApi.saveLogisticsConfig(configForm);
      await checkConfigured('logistics', systemConfigApi.getLogisticsConfig);
      ElMessage.success('快递查询配置已保存，立即生效');
    }
    configVisible.value = false;
  } catch { ElMessage.error('保存失败'); }
  configSaving.value = false;
};

// ── 删除服务 ──────────────────────────────────────────────────────────────────
const deleteService = async (svc: any) => {
  try {
    await systemConfigApi.deleteServiceConfig(svc.id);
    // 从列表移除
    const idx = services.value.findIndex(s => s.id === svc.id);
    if (idx !== -1) services.value.splice(idx, 1);
    ElMessage.success(`「${svc.name}」已删除`);
    // OSS 删除后清空统计缓存
    if (svc.id === 'alioss') Object.keys(ossStats).forEach(k => delete ossStats[k]);
  } catch {
    ElMessage.error('删除失败');
  }
};

// ── 启用 / 停用 ───────────────────────────────────────────────────────────────
const toggleService = (svc: any) => {
  svc.active = !svc.active;
  ElMessage.success(svc.active ? `${svc.name} 已启用` : `${svc.name} 已停用`);
};

// ── 初始化 ───────────────────────────────────────────────────────────────────
onMounted(() => {
  loadOssConfig();
  loadOssStats();
  checkConfigured('email',     systemConfigApi.getSmtpConfig);
  checkConfigured('sms',       systemConfigApi.getSmsConfig);
  checkConfigured('captcha',   systemConfigApi.getCaptchaConfig);
  checkConfigured('amap',      systemConfigApi.getAmapConfig);
  checkConfigured('logistics', systemConfigApi.getLogisticsConfig);
});
</script>

<style scoped>
/* 防止表单标签换行，label-width 已留足空间，不裁切 */
.config-form :deep(.el-form-item__label) {
  white-space: nowrap;
}
</style>
