<template>
  <el-dialog
    v-model="visible"
    title="物流轨迹"
    width="940px"
    :destroy-on-close="true"
    append-to-body
    @opened="onOpened"
    @closed="onClosed"
  >
    <!-- ── 顶部快递信息条 ─────────────────────────────────────────── -->
    <div class="logistics-header">
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          <i class="ri-truck-line text-[18px] text-[#FF6B00]"></i>
          <span class="text-[14px] font-semibold text-[#1A1A1A]">{{ carrierLabel }}</span>
        </div>
        <div v-if="trackingNo" class="flex items-center gap-1.5 bg-[#F5F5F5] rounded-lg px-3 py-1">
          <span class="text-[12px] text-[#999]">运单号</span>
          <span class="text-[13px] font-mono text-[#333] select-all">{{ trackingNo }}</span>
          <el-button size="small" text @click="copyNo"><i class="ri-file-copy-line text-[#999]"></i></el-button>
        </div>
        <el-tag :type="latestStatusTag.type" size="small" effect="light">{{ latestStatusTag.label }}</el-tag>
        <div class="ml-auto flex items-center gap-2">
          <el-button size="small" plain :loading="loadingDb" @click="loadDbTraces">
            <i class="ri-refresh-line mr-1"></i>刷新
          </el-button>
          <el-button size="small" type="primary" @click="showAddForm = !showAddForm">
            <i class="ri-add-line mr-1"></i>{{ showAddForm ? '收起' : '添加轨迹' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- ── 添加轨迹表单 ─────────────────────────────────────────── -->
    <transition name="el-fade-in">
      <div v-if="showAddForm" class="add-form-wrap">
        <div class="text-[13px] font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
          <i class="ri-edit-2-line text-[#FF6B00]"></i>手动录入轨迹节点
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- 物流状态 -->
          <div>
            <div class="form-label">物流状态 <span class="text-red-400">*</span></div>
            <el-select v-model="form.status" placeholder="选择状态" class="w-full" @change="onStatusChange">
              <el-option v-for="s in STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value">
                <div class="flex items-center gap-2">
                  <i :class="s.icon" :style="{ color: s.color }"></i>
                  <span>{{ s.label }}</span>
                </div>
              </el-option>
            </el-select>
          </div>

          <!-- 位置选择 -->
          <div>
            <div class="form-label flex items-center justify-between">
              <span>当前位置（地图选点可获取精确坐标）</span>
              <!-- Bug3: 揽收时显示仓库快选 -->
              <el-select
                v-if="form.status === 'Collected' && warehouses.length"
                v-model="selectedWarehouseId"
                placeholder="选仓库地址"
                size="small"
                class="!w-[140px]"
                clearable
                @change="onWarehouseSelect"
              >
                <el-option
                  v-for="w in warehouses"
                  :key="w.id"
                  :label="w.name"
                  :value="w.id"
                >
                  <div class="text-[12px]">
                    <div class="font-medium">{{ w.name }}</div>
                    <div class="text-[#999]">{{ w.address }}</div>
                  </div>
                </el-option>
              </el-select>
            </div>
            <div class="flex gap-2">
              <el-input
                v-model="form.location"
                placeholder="如：北京市朝阳区望京"
                clearable
                class="flex-1"
                @change="clearCoords"
              >
                <template #prefix><i class="ri-map-pin-line text-[#999]"></i></template>
              </el-input>
              <el-tooltip content="地图选点（含精确坐标）" placement="top">
                <el-button @click="mapPickerVisible = true" class="flex-shrink-0">
                  <i class="ri-map-pin-add-line text-[#FF6B00]"></i>
                </el-button>
              </el-tooltip>
            </div>
            <div v-if="form.lat" class="mt-1 text-[11px] text-[#00B96B] flex items-center gap-1">
              <i class="ri-crosshair-2-line"></i>
              已选精确坐标 ({{ form.lat!.toFixed(5) }}, {{ form.lng!.toFixed(5) }})
            </div>
          </div>

          <!-- 轨迹说明 -->
          <div class="col-span-2">
            <div class="form-label flex items-center justify-between">
              <span>轨迹说明 <span class="text-red-400">*</span></span>
              <span class="text-[11px] text-[#999]">点击下方模板快速填写</span>
            </div>
            <el-input v-model="form.content" placeholder="描述当前物流状态..." class="mb-2" />
            <div v-if="currentTemplates.length" class="flex flex-wrap gap-1.5">
              <button
                v-for="tpl in currentTemplates"
                :key="tpl"
                class="tpl-chip"
                @click="form.content = tpl"
              >
                {{ tpl }}
              </button>
            </div>
          </div>

          <!-- 时间 -->
          <div>
            <div class="form-label">发生时间（不填则使用当前时间）</div>
            <el-date-picker
              v-model="form.traceTime"
              type="datetime"
              placeholder="选择时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DDTHH:mm:ss"
              class="w-full"
            />
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-end gap-2">
            <el-button
              type="primary" :loading="saving"
              :disabled="!form.status || !form.content.trim()"
              @click="submitTrace"
            >
              <i class="ri-check-line mr-1"></i>保存轨迹
            </el-button>
            <el-button @click="resetForm">清空</el-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ── 主体：左时间轴 + 右地图 ──────────────────────────────── -->
    <div class="logistics-body" v-loading="loadingDb">
      <div v-if="!loadingDb && !dbTraces.length"
        class="flex flex-col items-center justify-center h-[420px] text-[#CCC] gap-3 w-full">
        <i class="ri-map-2-line text-[48px]"></i>
        <div class="text-[13px]">暂无物流轨迹，点击「添加轨迹」手动录入</div>
      </div>

      <template v-else-if="dbTraces.length">
        <!-- 时间轴 -->
        <div class="logistics-timeline custom-scrollbar">
          <div v-for="(tr, idx) in dbTraces" :key="tr.id" class="timeline-item">
            <div class="timeline-dot-wrap">
              <div class="timeline-dot" :class="idx === 0 ? 'dot-active' : 'dot-normal'">
                <i v-if="idx === 0" :class="statusIcon(tr.status)" class="text-white text-[10px]"></i>
              </div>
              <div v-if="idx < dbTraces.length - 1" class="timeline-line"></div>
            </div>
            <div class="timeline-content">
              <div class="text-[13px] leading-snug"
                :class="idx === 0 ? 'text-[#1A1A1A] font-medium' : 'text-[#555]'">
                {{ tr.content }}
              </div>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <span class="text-[11px] text-[#BBB]">{{ formatTraceTime(tr.traceTime) }}</span>
                <span v-if="tr.location" class="text-[11px] text-[#FF6B00] flex items-center gap-0.5">
                  <i class="ri-map-pin-line text-[10px]"></i>{{ tr.location }}
                </span>
                <span v-if="tr.lat" class="text-[10px] text-[#00B96B] flex items-center gap-0.5">
                  <i class="ri-crosshair-2-line text-[9px]"></i>精确定位
                </span>
                <el-tag :type="statusTagType(tr.status)" size="small" effect="plain" class="!text-[10px]">
                  {{ STATUS_OPTIONS.find(s => s.value === tr.status)?.label || tr.status }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 地图 -->
        <div class="logistics-map-wrap">
          <div ref="mapRef" class="logistics-map"></div>
          <div v-if="!mapReady" class="map-placeholder">
            <i class="ri-map-2-line text-[32px] text-[#DDD]"></i>
            <div class="text-[12px] text-[#CCC] mt-2 text-center px-4">
              {{ tracesWithCoords.length || tracesWithLocation.length
                  ? '地图加载中…'
                  : '添加含「位置」的轨迹节点以显示运输路径' }}
            </div>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>

  <MapPicker v-model="mapPickerVisible" @select="onMapSelect" />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { fulfillmentApi, adminOrderApi, warehouseApi } from '@/utils/admin-api';
import { loadAmap } from '@/composables/useAmap';
import MapPicker, { type MapLocation } from '@/components/MapPicker/MapPicker.vue';

// ── props / emits ────────────────────────────────────────────────────────────
const props = defineProps<{
  modelValue:   boolean;
  orderId:      number | string;
  carrierName?: string;
  trackingNo?:  string;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();
const visible = ref(props.modelValue);
watch(() => props.modelValue, v => { visible.value = v; });
watch(visible, v => emit('update:modelValue', v));

// ── 物流状态 & 模板 ──────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'Collected',      label: '已揽收',   icon: 'ri-hand-heart-fill',      color: '#14B8A6', tagType: 'info' },
  { value: 'Shipped',        label: '已发货',   icon: 'ri-store-2-fill',         color: '#F59E0B', tagType: 'warning' },
  { value: 'InTransit',      label: '运输中',   icon: 'ri-truck-fill',           color: '#3B82F6', tagType: 'primary' },
  { value: 'Arrived',        label: '到达站点', icon: 'ri-map-pin-fill',         color: '#8B5CF6', tagType: '' },
  { value: 'OutForDelivery', label: '派件中',   icon: 'ri-e-bike-2-fill',        color: '#FF6B00', tagType: 'warning' },
  { value: 'Received',       label: '已签收',   icon: 'ri-checkbox-circle-fill', color: '#00B96B', tagType: 'success' },
  { value: 'Exception',      label: '异常件',   icon: 'ri-error-warning-fill',   color: '#FF4D4F', tagType: 'danger' },
];

const TEMPLATES: Record<string, string[]> = {
  Collected:      ['快件已揽收，即将进入转运流程', '您的包裹已被快递员取走，请等待转运', '商品已从仓库发出，已完成揽收'],
  Shipped:        ['商家已发货，包裹正在途中', '订单商品已打包发出，请留意快递短信', '商品已通过顺丰速运发出，预计3天内送达'],
  InTransit:      ['快件正在运输途中', '包裹已离开上一站点，正在向目的地转运', '快件在高速公路运输中，预计明日到达中转站'],
  Arrived:        ['快件已到达当地分拣中心，正在分拣', '包裹已到达目的地城市，即将安排派送', '快件已到达派送站点，明日安排派件'],
  OutForDelivery: ['快件已交由派件员，今日送达', '快递员正在派件中，请保持手机畅通', '包裹正在派送，如有问题请联系快递员'],
  Received:       ['快件已由本人签收，感谢使用', '包裹已签收，如有问题请及时申请售后', '快件已放置快递柜，请尽快取件'],
  Exception:      ['快件疑难，快递员正在联系收件人', '包裹投递失败，快递员将再次尝试投递', '快件在途中发生异常，正在处理中'],
};

// ── state ────────────────────────────────────────────────────────────────────
const loadingDb      = ref(false);
const saving         = ref(false);
const showAddForm    = ref(false);
const mapPickerVisible = ref(false);
const dbTraces       = ref<any[]>([]);
const warehouses     = ref<any[]>([]);
const selectedWarehouseId = ref<number | null>(null);
const deliveryAddress = ref('');   // Bug2: 收货地址，用于在地图上标记终点

const mapRef   = ref<HTMLDivElement>();
const mapReady = ref(false);
let map:      any = null;
let markers:  any[] = [];
let polyline: any = null;

interface TraceForm {
  status: string; content: string; location: string;
  lat: number | null; lng: number | null; traceTime: string;
}
const form = ref<TraceForm>({ status: '', content: '', location: '', lat: null, lng: null, traceTime: '' });

// ── computed ─────────────────────────────────────────────────────────────────
const carrierLabel = computed(() => props.carrierName || '快递');
const tracesWithCoords   = computed(() => dbTraces.value.filter(t => t.lat && t.lng));
const tracesWithLocation = computed(() => dbTraces.value.filter(t => t.location?.trim() && !(t.lat && t.lng)));
const currentTemplates   = computed(() => TEMPLATES[form.value.status] || []);

const latestStatusTag = computed(() => {
  const latest = dbTraces.value[0]?.status;
  const opt = STATUS_OPTIONS.find(s => s.value === latest);
  return opt ? { label: opt.label, type: opt.tagType as any } : { label: '待处理', type: 'info' as any };
});

const statusIcon    = (s: string) => STATUS_OPTIONS.find(o => o.value === s)?.icon || 'ri-map-pin-fill';
const statusTagType = (s: string): any => STATUS_OPTIONS.find(o => o.value === s)?.tagType || 'info';

// ── lifecycle ─────────────────────────────────────────────────────────────────
async function onOpened() {
  await Promise.all([loadDbTraces(), loadWarehouses(), loadDeliveryAddress()]);
}
function onClosed() {
  destroyMap(); dbTraces.value = [];
  showAddForm.value = false; resetForm(); mapReady.value = false;
  deliveryAddress.value = ''; selectedWarehouseId.value = null;
}

// ── 加载数据 ──────────────────────────────────────────────────────────────────
async function loadDbTraces() {
  if (!props.orderId) return;
  loadingDb.value = true;
  try {
    const res: any = await fulfillmentApi.getByOrder(props.orderId);
    const raw: any[] = (res.data?.data || res.data || {}).traces || [];
    // Bug1: 前端再排一次，保证同时间戳时 id 大的在前（更晚插入 = 更新的记录）
    dbTraces.value = raw.sort((a, b) => {
      const tDiff = new Date(b.traceTime || 0).getTime() - new Date(a.traceTime || 0).getTime();
      if (tDiff !== 0) return tDiff;
      return Number(BigInt(b.id) - BigInt(a.id)) > 0 ? 1 : -1;
    });
    await nextTick();
    await renderMap();
  } catch (e: any) {
    const msg = e?.response?.data?.msg || '';
    if (!msg.includes('不存在')) ElMessage.error(msg || '加载失败');
    dbTraces.value = [];
  } finally { loadingDb.value = false; }
}

// Bug3: 加载仓库列表
async function loadWarehouses() {
  try {
    const res: any = await warehouseApi.list();
    warehouses.value = (res.data?.data || res.data || []);
  } catch { warehouses.value = []; }
}

// Bug2: 加载收货地址
async function loadDeliveryAddress() {
  if (!props.orderId) return;
  try {
    const res: any = await adminOrderApi.detail(props.orderId);
    const order = res.data?.data || res.data;
    if (order?.addressSnapshot) {
      const addr = typeof order.addressSnapshot === 'string'
        ? JSON.parse(order.addressSnapshot)
        : order.addressSnapshot;
      // addressSnapshot 字段可能是 fullAddress（完整地址）或 province+city+district+detail 拼合
      deliveryAddress.value = addr.fullAddress
        || `${addr.province || ''}${addr.city || ''}${addr.district || ''}${addr.detail || addr.address || ''}`;
    }
  } catch { deliveryAddress.value = ''; }
}

// ── 提交轨迹 ─────────────────────────────────────────────────────────────────
async function submitTrace() {
  if (!form.value.status || !form.value.content.trim()) return;
  saving.value = true;
  try {
    await fulfillmentApi.addTrace({
      orderId:   props.orderId,
      status:    form.value.status,
      content:   form.value.content.trim(),
      location:  form.value.location.trim() || undefined,
      lat:       form.value.lat ?? undefined,
      lng:       form.value.lng ?? undefined,
      traceTime: form.value.traceTime || undefined,
    });
    ElMessage.success('轨迹节点已保存');
    resetForm(); showAddForm.value = false;
    await loadDbTraces();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || '保存失败');
  } finally { saving.value = false; }
}

// Bug3: 选择仓库后填入地址
function onWarehouseSelect(id: number | null) {
  if (!id) return;
  const wh = warehouses.value.find(w => w.id === id);
  if (!wh) return;
  form.value.location = wh.address || wh.name;
  // 如果仓库有坐标直接用
  if (wh.lng && wh.lat) {
    form.value.lat = wh.lat;
    form.value.lng = wh.lng;
  } else {
    form.value.lat = null;
    form.value.lng = null;
  }
}

function onMapSelect(loc: MapLocation) {
  form.value.location = loc.address;
  form.value.lat = loc.lat;
  form.value.lng = loc.lng;
  mapPickerVisible.value = false;
}

function clearCoords() {
  form.value.lat = null;
  form.value.lng = null;
  selectedWarehouseId.value = null;
}

function onStatusChange() {
  selectedWarehouseId.value = null;
}

function resetForm() {
  form.value = { status: '', content: '', location: '', lat: null, lng: null, traceTime: '' };
  selectedWarehouseId.value = null;
}

// ── 时间格式化 ────────────────────────────────────────────────────────────────
function formatTraceTime(raw: string | undefined) {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  } catch { return raw; }
}

// ── 地图渲染 ──────────────────────────────────────────────────────────────────
async function renderMap() {
  destroyMap();
  const withCoords   = tracesWithCoords.value;
  const withLocation = tracesWithLocation.value;
  if (!withCoords.length && !withLocation.length && !deliveryAddress.value) return;
  if (!mapRef.value) return;

  try {
    const AMap = await loadAmap();
    if (!mapRef.value) return;

    map = new AMap.Map(mapRef.value, {
      zoom: 5, center: [108.9402, 34.3416], mapStyle: 'amap://styles/light',
    });
    mapReady.value = true;

    const geocoder = new AMap.Geocoder({ radius: 1000 });
    type CoordItem = { lng: number; lat: number; content?: string; isDestination?: boolean };
    const coordItems: CoordItem[] = [];

    // 轨迹节点（升序：老→新）
    const ordered = [...dbTraces.value].reverse();
    for (const tr of ordered) {
      if (tr.lat && tr.lng) {
        coordItems.push({ lng: tr.lng, lat: tr.lat, content: tr.content });
      } else if (tr.location?.trim()) {
        await new Promise<void>(resolve => {
          geocoder.getLocation(tr.location, (_: any, result: any) => {
            const loc = result?.geocodes?.[0]?.location;
            if (loc) coordItems.push({ lng: loc.lng, lat: loc.lat, content: tr.content });
            resolve();
          });
        });
      }
    }

    // Bug2: 收货地址作为终点
    let destCoord: CoordItem | null = null;
    if (deliveryAddress.value) {
      await new Promise<void>(resolve => {
        geocoder.getLocation(deliveryAddress.value, (_: any, result: any) => {
          const loc = result?.geocodes?.[0]?.location;
          if (loc) destCoord = { lng: loc.lng, lat: loc.lat, content: '收货地址', isDestination: true };
          resolve();
        });
      });
    }

    if (!coordItems.length && !destCoord) return;

    const path: [number, number][] = coordItems.map(c => [c.lng, c.lat]);

    // Bug2: 实线轨迹（替换虚线）
    if (path.length >= 2) {
      polyline = new AMap.Polyline({
        path,
        strokeColor: '#FF6B00',
        strokeWeight: 4,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',       // ← 实线
        lineJoin: 'round',
        lineCap: 'round',
        map,
      });
    }

    // 轨迹节点标记
    coordItems.forEach((c, i) => {
      const isLatest = i === coordItems.length - 1;
      const marker = new AMap.Marker({
        position: [c.lng, c.lat], map,
        content: isLatest
          ? `<div style="width:14px;height:14px;background:#FF6B00;border:2px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(255,107,0,0.25);"></div>`
          : `<div style="width:9px;height:9px;background:#bbb;border:2px solid white;border-radius:50%;"></div>`,
        offset: new AMap.Pixel(-7, -7),
        title: c.content || '',
      });
      markers.push(marker);
    });

    // Bug2: 收货地址终点标记（红色定位图标）
    if (destCoord) {
      const dest = destCoord as CoordItem;
      const destMarker = new AMap.Marker({
        position: [dest.lng, dest.lat], map,
        content: `<div style="display:flex;flex-direction:column;align-items:center;">
          <div style="width:28px;height:28px;background:#FF4D4F;border:2px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(255,77,79,0.4);display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <div style="font-size:10px;color:#FF4D4F;font-weight:600;white-space:nowrap;margin-top:2px;background:white;padding:1px 4px;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,0.15);">收货地址</div>
        </div>`,
        offset: new AMap.Pixel(-14, -32),
        title: '收货地址：' + deliveryAddress.value,
      });
      markers.push(destMarker);
    }

    map.setFitView(markers);
  } catch { /* 地图失败不影响文字轨迹 */ }
}

function destroyMap() {
  markers.forEach(m => map?.remove(m));
  markers = []; polyline && map?.remove(polyline);
  polyline = null; map?.destroy(); map = null; mapReady.value = false;
}

function copyNo() {
  if (!props.trackingNo) return;
  navigator.clipboard.writeText(props.trackingNo).then(() => ElMessage.success('已复制'));
}
</script>

<style scoped>
.logistics-header {
  padding: 12px 16px;
  background: #FAFAFA;
  border: 1px solid #F0F0F0;
  border-radius: 10px;
  margin-bottom: 12px;
}

.add-form-wrap {
  background: #FFF8F5;
  border: 1px solid #FFE0CC;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}

.form-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
}

.tpl-chip {
  font-size: 11px;
  color: #FF6B00;
  background: #FFF3E8;
  border: 1px solid #FFD9B3;
  border-radius: 20px;
  padding: 3px 10px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}
.tpl-chip:hover { background: #FF6B00; color: white; border-color: #FF6B00; }

.logistics-body { display: flex; gap: 16px; height: 400px; }

.logistics-timeline {
  width: 320px;
  flex-shrink: 0;
  overflow-y: auto;
  padding-right: 8px;
}

.timeline-item { display: flex; gap: 10px; }

.timeline-dot-wrap {
  display: flex; flex-direction: column;
  align-items: center; flex-shrink: 0;
}
.timeline-dot {
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 2px;
}
.dot-active { background: #FF6B00; box-shadow: 0 0 0 3px rgba(255,107,0,0.2); }
.dot-normal { background: #E0E0E0; }
.timeline-line {
  width: 2px; flex: 1; min-height: 20px;
  background: #F0F0F0; margin: 4px 0;
}
.timeline-content { padding-bottom: 18px; flex: 1; min-width: 0; }

.logistics-map-wrap {
  flex: 1; position: relative;
  border-radius: 10px; overflow: hidden; background: #F5F5F5;
}
.logistics-map { width: 100%; height: 100%; }
.map-placeholder {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #E0E0E0; border-radius: 2px; }
</style>
