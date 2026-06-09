<template>
  <el-dialog
    v-model="visible"
    :title="title || '查看地图位置'"
    width="680px"
    :destroy-on-close="true"
    append-to-body
    @opened="initMap"
    @closed="destroyMap"
  >
    <div>
      <div ref="mapRef" style="width:100%;height:400px;border-radius:8px;overflow:hidden;"></div>
      <div v-if="address" class="flex items-center gap-2 mt-3 px-3 py-2 bg-[#FAFAFA] rounded-lg text-[13px] text-[#555]">
        <i class="ri-map-pin-fill text-[#FF6B00]"></i>
        {{ address }}
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { loadAmap } from '@/composables/useAmap';

const props = defineProps<{
  modelValue: boolean;
  address?:   string;
  title?:     string;
  lng?:       number | null;
  lat?:       number | null;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

const visible = ref(props.modelValue);
watch(() => props.modelValue, v => { visible.value = v; });
watch(visible, v => emit('update:modelValue', v));

const mapRef = ref<HTMLDivElement>();
let map:    any = null;
let marker: any = null;

async function initMap() {
  try {
    const AMap = await loadAmap();
    if (!mapRef.value) return;

    map = new AMap.Map(mapRef.value, {
      zoom: 14,
      mapStyle: 'amap://styles/light',
    });

    if (props.lng && props.lat) {
      // 已有坐标，直接定位
      placePin(AMap, props.lng, props.lat);
    } else if (props.address) {
      // 通过地址文字正向 Geocode
      const geocoder = new AMap.Geocoder({ radius: 1000 });
      geocoder.getLocation(props.address, (_: any, result: any) => {
        const loc = result?.geocodes?.[0]?.location;
        if (loc) {
          map.setCenter([loc.lng, loc.lat]);
          placePin(AMap, loc.lng, loc.lat);
        } else {
          ElMessage.warning('地址解析失败，请检查地址是否正确');
        }
      });
    }
  } catch (err: any) {
    ElMessage.error(err.message || '地图加载失败');
  }
}

function placePin(AMap: any, lng: number, lat: number) {
  map.setCenter([lng, lat]);
  marker = new AMap.Marker({
    position: [lng, lat],
    map,
  });
}

function destroyMap() {
  map?.destroy();
  map = null;
  marker = null;
}
</script>
