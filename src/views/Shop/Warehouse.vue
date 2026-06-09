<template>
  <div class="page">

    <!-- 工具栏 -->
    <div class="bg-white rounded-xl border border-[#F0F0F0] p-4 mb-4 flex items-center gap-3">
      <span class="text-[13px] text-[#333]">共 <b>{{ warehouses.length }}</b> 个仓库</span>
      <div class="flex-1"></div>
      <el-button type="primary" @click="openDialog(null)">
        <i class="ri-add-line mr-1"></i>新建仓库
      </el-button>
    </div>

    <!-- 仓库卡片列表 -->
    <div v-loading="loading" class="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
      <div v-for="w in warehouses" :key="w.id"
        class="bg-white rounded-xl border overflow-hidden transition-all"
        :class="w.isDefault === 1 ? 'border-[#FF6B00] shadow-[0_0_0_2px_rgba(255,107,0,0.12)]' : 'border-[#F0F0F0] hover:border-[#FF6B00]/40'">
        <!-- 卡片头 -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5]">
          <div class="flex items-center gap-2">
            <i class="ri-store-2-line text-[16px]" :class="w.isDefault === 1 ? 'text-[#FF6B00]' : 'text-[#999]'"></i>
            <span class="text-[14px] font-semibold text-[#1A1A1A]">{{ w.name }}</span>
          </div>
          <el-tag v-if="w.isDefault === 1" type="warning" size="small" effect="light">默认</el-tag>
        </div>
        <!-- 卡片内容 -->
        <div class="px-4 py-3 space-y-1.5 text-[12px] text-[#666]">
          <div v-if="w.fullAddress" class="flex items-start gap-1.5">
            <i class="ri-map-pin-line text-[#999] flex-shrink-0 mt-0.5"></i>
            <span>{{ w.fullAddress }}</span>
          </div>
          <div v-if="w.contact || w.phone" class="flex items-center gap-3">
            <span v-if="w.contact"><i class="ri-user-line mr-1 text-[#999]"></i>{{ w.contact }}</span>
            <span v-if="w.phone"><i class="ri-phone-line mr-1 text-[#999]"></i>{{ w.phone }}</span>
          </div>
        </div>
        <!-- 操作 -->
        <div class="flex items-center justify-end gap-1 px-4 pb-3">
          <el-button v-if="w.isDefault !== 1" size="small" text @click="handleSetDefault(w)">设为默认</el-button>
          <el-button size="small" text type="primary" @click="openDialog(w)">编辑</el-button>
          <el-button size="small" text type="danger" @click="handleDelete(w)" :disabled="w.isDefault === 1">删除</el-button>
        </div>
      </div>

      <!-- 新建入口 -->
      <div class="bg-white rounded-xl border border-dashed border-[#E0E0E0] flex flex-col items-center justify-center gap-2 py-8 cursor-pointer hover:border-[#FF6B00] hover:bg-[#FFF8F3] transition-colors min-h-[140px]"
        @click="openDialog(null)">
        <i class="ri-add-circle-line text-[28px] text-[#CCC]"></i>
        <span class="text-[13px] text-[#BBB]">添加发货仓库</span>
      </div>
    </div>

    <div v-if="!loading && warehouses.length === 0"
      class="mt-4 text-center py-12 text-[#BBB] text-[13px]">
      暂无仓库，点击右上角新建
    </div>

    <!-- 新建/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editId ? '编辑仓库' : '新建仓库'"
      width="500px"
      :destroy-on-close="true"
      class="warehouse-dialog"
    >
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="80px" size="default">

        <!-- 仓库名称 -->
        <el-form-item label="仓库名称" prop="name">
          <el-input v-model="form.name" placeholder="如：华南仓、北京总仓" maxlength="32" show-word-limit clearable />
        </el-form-item>

        <!-- 省市区级联 + 地图选址 -->
        <el-form-item label="所在地区" prop="region">
          <div class="flex items-center gap-2 w-full">
            <el-cascader
              :key="cascaderKey"
              v-model="form.region"
              :options="areaTree"
              :props="{ expandTrigger: 'hover', checkStrictly: false }"
              placeholder="请选择省 / 市 / 区"
              class="flex-1"
              clearable
              filterable
              @change="onRegionChange"
            />
            <el-button plain @click="mapPickerVisible = true">
              <i class="ri-map-pin-2-line mr-1 text-[#FF6B00]"></i>地图选址
            </el-button>
          </div>
          <div v-if="form.lng" class="text-[11px] text-[#BBB] mt-1">
            <i class="ri-focus-3-line mr-0.5"></i>已定位：{{ form.lng.toFixed(6) }}, {{ form.lat.toFixed(6) }}
          </div>
        </el-form-item>

        <!-- 详细地址 -->
        <el-form-item label="详细地址">
          <el-input
            v-model="form.detailAddress"
            placeholder="街道、楼栋、门牌号等"
            maxlength="100"
            clearable
          />
        </el-form-item>

        <!-- 联系人 + 联系电话 -->
        <div class="grid grid-cols-2 gap-x-4">
          <el-form-item label="联系人">
            <el-input v-model="form.contact" placeholder="发货联系人" maxlength="20" clearable />
          </el-form-item>
          <el-form-item label="联系电话" label-width="72px">
            <el-input v-model="form.phone" placeholder="手机 / 座机" maxlength="20" clearable />
          </el-form-item>
        </div>

        <!-- 设为默认 -->
        <el-form-item label="默认仓库">
          <div class="flex items-center gap-2">
            <el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" />
            <span class="text-[12px] text-[#999]">发布商品时自动选中此仓库</span>
          </div>
        </el-form-item>

      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 地图选址弹窗 -->
    <MapPicker v-model="mapPickerVisible" @select="onMapSelect" />

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { warehouseApi } from '@/utils/admin-api';
import { getAreaTree } from '@/utils/area';
import MapPicker, { type MapLocation } from '@/components/MapPicker/MapPicker.vue';

const loading    = ref(false);
const saving     = ref(false);
const warehouses = ref<any[]>([]);
const areaTree   = getAreaTree();

// ── 加载 ─────────────────────────────────────────────────────────────────────
const loadWarehouses = async () => {
  loading.value = true;
  try {
    const res: any = await warehouseApi.list();
    const d = res.data?.data || res.data || [];
    warehouses.value = Array.isArray(d) ? d : [];
  } catch { /* interceptor */ }
  finally { loading.value = false; }
};

// ── 弹窗 ─────────────────────────────────────────────────────────────────────
const dialogVisible = ref(false);
const editId        = ref<number | null>(null);
const formRef       = ref<FormInstance>();

interface WarehouseForm {
  name:          string;
  region:        string[];   // [province, city, district]
  province:      string;
  city:          string;
  district:      string;
  detailAddress: string;
  contact:       string;
  phone:         string;
  isDefault:     0 | 1;
  lng:           number | null;
  lat:           number | null;
}

const DEFAULT_FORM: WarehouseForm = {
  name: '', region: [], province: '', city: '', district: '',
  detailAddress: '', contact: '', phone: '', isDefault: 0,
  lng: null, lat: null,
};

const form = reactive<WarehouseForm>({ ...DEFAULT_FORM });

const formRules = {
  name:   [{ required: true, message: '请输入仓库名称', trigger: 'blur' }],
  region: [{ required: false }],
};

const mapPickerVisible = ref(false);
const cascaderKey      = ref(0);

function onRegionChange(val: string[]) {
  form.province = val[0] ?? '';
  form.city     = val[1] ?? '';
  form.district = val[2] ?? '';
}

// 在 areaTree 中按名称（规范化后）查找最匹配的 [province, city, district] 路径
function findRegionInTree(province: string, city: string, district: string): string[] {
  const strip = (s: string) =>
    s.replace(/省|市|区|县|自治州|自治区|特别行政区|回族|维吾尔|壮族/g, '').toLowerCase();

  const pn = strip(province);
  const cn = strip(city || province);
  const dn = strip(district);

  // china-area-data 直辖市中间层固定叫这些，不代表真实城市名，直接透传
  const PASS_THROUGH_CITIES = new Set(['市辖区', '县', '省直辖县级行政区划']);

  for (const pNode of areaTree) {
    if (!strip(pNode.label).includes(pn) && !pn.includes(strip(pNode.label))) continue;
    for (const cNode of (pNode.children ?? [])) {
      const cStrip = strip(cNode.label);
      const cityMatches = cStrip.includes(cn) || cn.includes(cStrip) || PASS_THROUGH_CITIES.has(cNode.label);
      if (!cityMatches) continue;
      if (!dn) return [pNode.value, cNode.value];
      for (const dNode of (cNode.children ?? [])) {
        if (strip(dNode.label).includes(dn) || dn.includes(strip(dNode.label))) {
          return [pNode.value, cNode.value, dNode.value];
        }
      }
      // 区级没找到，但城市层已匹配，继续试其他城市节点（如重庆有"市辖区"和"县"两个节点）
    }
    // 所有城市节点都没找到区，退回到第一个通过的城市
    for (const cNode of (pNode.children ?? [])) {
      const cStrip = strip(cNode.label);
      if (cStrip.includes(cn) || cn.includes(cStrip) || PASS_THROUGH_CITIES.has(cNode.label)) {
        return [pNode.value, cNode.value];
      }
    }
    return [pNode.value];
  }
  return [];
}

function onMapSelect(loc: MapLocation) {
  const matched = findRegionInTree(loc.province, loc.city, loc.district);

  form.province = matched[0] ?? loc.province;
  form.city     = matched[1] ?? loc.city;
  form.district = matched[2] ?? loc.district;
  form.region   = matched;
  form.lng      = loc.lng;
  form.lat      = loc.lat;
  cascaderKey.value++; // 强制 el-cascader 卸载重挂，以新 model 值完整初始化

  let detail = loc.address;
  if (form.province && detail.startsWith(form.province)) detail = detail.slice(form.province.length);
  if (form.city     && detail.startsWith(form.city))     detail = detail.slice(form.city.length);
  if (form.district && detail.startsWith(form.district)) detail = detail.slice(form.district.length);
  if (detail.trim()) form.detailAddress = detail.trim();
}

function openDialog(row: any) {
  editId.value = row?.id ?? null;
  const region: string[] = [];
  if (row?.province) region.push(row.province);
  if (row?.city)     region.push(row.city);
  if (row?.district) region.push(row.district);
  Object.assign(form, DEFAULT_FORM, row ? {
    name:          row.name          || '',
    region,
    province:      row.province      || '',
    city:          row.city          || '',
    district:      row.district      || '',
    detailAddress: row.detailAddress || '',
    contact:       row.contact       || '',
    phone:         row.phone         || '',
    isDefault:     row.isDefault     || 0,
    lng:           row.lng           ?? null,
    lat:           row.lat           ?? null,
  } : { region: [], lng: null, lat: null });
  dialogVisible.value = true;
}

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const payload = {
      id:            editId.value,
      name:          form.name,
      province:      form.province,
      city:          form.city,
      district:      form.district,
      detailAddress: form.detailAddress,
      contact:       form.contact,
      phone:         form.phone,
      isDefault:     form.isDefault,
      lng:           form.lng,
      lat:           form.lat,
    };
    await warehouseApi.save(payload);
    ElMessage.success(editId.value ? '修改成功' : '创建成功');
    dialogVisible.value = false;
    await loadWarehouses();
  } catch { /* interceptor */ }
  finally { saving.value = false; }
};

// ── 操作 ─────────────────────────────────────────────────────────────────────
const handleSetDefault = async (w: any) => {
  try {
    await warehouseApi.setDefault(w.id);
    ElMessage.success(`「${w.name}」已设为默认发货仓库`);
    await loadWarehouses();
  } catch { /* interceptor */ }
};

const handleDelete = async (w: any) => {
  try {
    await ElMessageBox.confirm(`确定删除仓库「${w.name}」？`, '删除确认', {
      type: 'warning', confirmButtonText: '确定删除', confirmButtonClass: 'el-button--danger',
    });
    await warehouseApi.remove(w.id);
    ElMessage.success('已删除');
    await loadWarehouses();
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

onMounted(loadWarehouses);
</script>

<style scoped>
:deep(.el-cascader) { width: 100%; }
:deep(.el-cascader .el-input) { width: 100%; }
</style>
