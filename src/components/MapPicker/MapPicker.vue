<template>
  <el-dialog
    v-model="visible"
    title="地图选址"
    width="780px"
    :destroy-on-close="true"
    append-to-body
    class="map-picker-dialog"
    @opened="initMap"
    @closed="destroyMap"
  >
    <div class="map-picker-wrap">
      <!-- 搜索栏 -->
      <div class="map-search-bar">
        <div class="flex gap-2">
          <el-input
            ref="searchInputRef"
            v-model="keyword"
            placeholder="搜索地址、地点名称"
            clearable
            class="map-search-input flex-1"
            @input="onInput"
            @keydown.esc="hideSuggestions"
          >
            <template #prefix><i class="ri-search-line text-[#999]"></i></template>
          </el-input>
          <el-tooltip content="定位当前位置" placement="bottom">
            <el-button
              :loading="locating"
              class="locate-btn"
              @click="locateMe"
            >
              <i v-if="!locating" class="ri-focus-3-line text-[16px]"></i>
            </el-button>
          </el-tooltip>
        </div>
        <!-- 联想下拉 -->
        <div v-if="suggestions.length" class="map-suggestions">
          <div
            v-for="(s, i) in suggestions"
            :key="i"
            class="map-suggestion-item"
            @mousedown.prevent="selectSuggestion(s)"
          >
            <i class="ri-map-pin-2-line text-[#FF6B00] mr-2 flex-shrink-0"></i>
            <div class="flex-1 min-w-0">
              <div class="text-[13px] text-[#222] truncate">{{ s.name }}</div>
              <div v-if="s.district" class="text-[11px] text-[#999] truncate">{{ s.district }}{{ s.address }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 地图容器 -->
      <div ref="mapRef" class="map-container"></div>

      <!-- 当前选址信息 -->
      <div class="map-result">
        <template v-if="selected">
          <i class="ri-map-pin-fill text-[#FF6B00] text-[15px] flex-shrink-0"></i>
          <div class="flex-1 min-w-0">
            <span class="text-[13px] text-[#222]">{{ selected.address }}</span>
            <span v-if="selected.lng" class="ml-2 text-[11px] text-[#BBB]">{{ selected.lng.toFixed(6) }}, {{ selected.lat.toFixed(6) }}</span>
          </div>
        </template>
        <template v-else>
          <i class="ri-cursor-line text-[#CCC] text-[15px] flex-shrink-0"></i>
          <span class="text-[13px] text-[#BBB]">点击地图或搜索地点以选择地址</span>
        </template>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!selected" @click="confirm">确认选址</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { loadAmap } from '@/composables/useAmap';

export interface MapLocation {
  province:   string;
  city:       string;
  district:   string;
  address:    string;
  lng:        number;
  lat:        number;
}

const props = defineProps<{ modelValue: boolean }>();
const emit  = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'select', loc: MapLocation): void;
}>();

const visible = ref(props.modelValue);
watch(() => props.modelValue, v => { visible.value = v; });
watch(visible, v => emit('update:modelValue', v));

// ── refs ──────────────────────────────────────────────────────────────────────
const mapRef        = ref<HTMLDivElement>();
const keyword       = ref('');
const suggestions   = ref<any[]>([]);
const selected      = ref<MapLocation | null>(null);

const locating = ref(false);

let map:          any = null;
let marker:       any = null;
let geocoder:     any = null;
let autoComplete: any = null;

// ── lifecycle ─────────────────────────────────────────────────────────────────
async function initMap() {
  try {
    const AMap = await loadAmap();
    if (!mapRef.value) return;

    map = new AMap.Map(mapRef.value, {
      zoom: 12,
      center: [116.397428, 39.90923],
      mapStyle: 'amap://styles/light',
    });

    geocoder = new AMap.Geocoder({ radius: 500 });

    autoComplete = new AMap.AutoComplete({ city: '全国' });

    map.on('click', (e: any) => {
      const { lng, lat } = e.lnglat;
      placeMarker(lng, lat);
      reverseGeocode(lng, lat);
    });
  } catch (err: any) {
    ElMessage.error(err.message || '地图加载失败');
  }
}

function destroyMap() {
  map?.destroy();
  map = null;
  marker = null;
  geocoder = null;
  autoComplete = null;
  keyword.value = '';
  suggestions.value = [];
  selected.value = null;
  locating.value = false;
}

// ── geolocation ───────────────────────────────────────────────────────────────
function locateMe() {
  const AMap = (window as any).AMap;
  if (!AMap || !map) return;
  locating.value = true;
  const geo = new AMap.Geolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    buttonOffset: new AMap.Pixel(10, 20),
    zoomToAccuracy: true,
    showButton: false,
  });
  geo.getCurrentPosition((status: string, result: any) => {
    locating.value = false;
    if (status === 'complete') {
      const { lng, lat } = result.position;
      map.setCenter([lng, lat]);
      map.setZoom(16);
      placeMarker(lng, lat);
      reverseGeocode(lng, lat);
    } else {
      ElMessage.warning('定位失败，请检查浏览器定位权限或手动搜索地址');
    }
  });
}

// ── search ────────────────────────────────────────────────────────────────────
let _debounceTimer: ReturnType<typeof setTimeout>;

function onInput() {
  clearTimeout(_debounceTimer);
  if (!keyword.value.trim()) { suggestions.value = []; return; }
  _debounceTimer = setTimeout(() => {
    autoComplete?.search(keyword.value, (_: any, result: any) => {
      suggestions.value = result?.tips?.filter((t: any) => t.location) ?? [];
    });
  }, 300);
}

function hideSuggestions() { suggestions.value = []; }

function selectSuggestion(s: any) {
  hideSuggestions();
  keyword.value = s.name;
  const lng = s.location.lng;
  const lat = s.location.lat;
  map?.setCenter([lng, lat]);
  map?.setZoom(15);
  placeMarker(lng, lat);
  reverseGeocode(lng, lat);
}

// ── marker & geocode ──────────────────────────────────────────────────────────
function placeMarker(lng: number, lat: number) {
  const AMap = (window as any).AMap;
  if (!AMap) return;
  if (marker) { marker.setPosition([lng, lat]); }
  else {
    marker = new AMap.Marker({ position: [lng, lat], map });
  }
}

function reverseGeocode(lng: number, lat: number) {
  geocoder?.getAddress([lng, lat], (_: any, result: any) => {
    if (result?.regeocode) {
      const rc    = result.regeocode;
      const comp  = rc.addressComponent;
      const addr  = rc.formattedAddress || '';
      selected.value = {
        province: comp.province  || '',
        city:     comp.city      || comp.province || '',
        district: comp.district  || '',
        address:  addr,
        lng,
        lat,
      };
    }
  });
}

// ── confirm ───────────────────────────────────────────────────────────────────
function confirm() {
  if (selected.value) {
    emit('select', selected.value);
    visible.value = false;
  }
}
</script>

<style scoped>
.map-picker-wrap {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.map-search-bar {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  width: 280px;
}

.map-search-input {
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  border-radius: 8px;
  background: white;
}

.locate-btn {
  background: white;
  border-color: #E0E0E0;
  color: #FF6B00;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  flex-shrink: 0;
  width: 36px;
  padding: 0;
}
.locate-btn:hover { border-color: #FF6B00; background: #FFF8F3; }

.map-suggestions {
  background: white;
  border: 1px solid #F0F0F0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  margin-top: 4px;
  overflow: hidden;
  max-height: 240px;
  overflow-y: auto;
}

.map-suggestion-item {
  display: flex;
  align-items: flex-start;
  padding: 9px 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.map-suggestion-item:hover { background: #FFF8F3; }

.map-container {
  width: 100%;
  height: 420px;
  border-radius: 8px;
  overflow: hidden;
}

.map-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #FAFAFA;
  border: 1px solid #F0F0F0;
  border-radius: 8px;
  margin-top: 10px;
  min-height: 40px;
}
</style>

<style>
.map-picker-dialog .el-dialog__body { padding: 16px 20px 8px; }
</style>
