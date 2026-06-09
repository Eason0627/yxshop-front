<template>
  <!-- 使用 Drawer 代替 Dialog，给充足宽度展示完整表单 -->
  <el-drawer
    v-model="visible"
    :title="'编辑商品'"
    size="80%"
    direction="rtl"
    :destroy-on-close="true"
    @close="emit('update:modelValue', false)"
  >
    <div v-loading="pageLoading" class="flex gap-4 items-start p-1">

      <!-- 左列 -->
      <div class="flex-1 min-w-0 space-y-4">

        <!-- 基本信息 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden bg-white">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-information-line mr-1.5 text-[#409EFF]"></i>基本信息</span>
          </div>
          <div class="p-4">
            <el-form :model="form" :rules="rules" ref="formRef" label-width="80px" size="default" @submit.prevent>
              <div class="grid grid-cols-[1fr_180px] gap-4">
                <el-form-item label="商品名称" prop="name">
                  <el-input v-model="form.name" placeholder="请输入商品名称" maxlength="60" show-word-limit />
                </el-form-item>
                <el-form-item label="货号">
                  <el-input v-model="form.productCode" placeholder="商家自定义货号" maxlength="32" clearable />
                </el-form-item>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <el-form-item label="商品分类" prop="categoryId">
                  <el-cascader v-model="form.categoryId" :options="categoryTree"
                    :props="{ value: 'categoryId', label: 'categoryName', children: 'children', checkStrictly: true, emitPath: false }"
                    placeholder="请选择分类" class="w-full" clearable />
                </el-form-item>
                <el-form-item label="所属店铺">
                  <el-select v-model="form.shopId" class="w-full" placeholder="请选择店铺" clearable filterable :disabled="!isAdmin">
                    <el-option v-for="s in shops" :key="s.shopId || s.id" :label="s.displayName || s.shopName" :value="s.shopId || s.id" />
                  </el-select>
                </el-form-item>
              </div>
              <el-form-item label="商品简介">
                <el-input v-model="form.subtitle" type="textarea" :rows="2" placeholder="简短描述" maxlength="200" show-word-limit />
              </el-form-item>
              <el-form-item label="品牌">
                <el-select v-model="form.brandId" class="w-full" clearable filterable placeholder="请选择品牌（可选）">
                  <el-option v-for="b in brands" :key="b.id || b.brandId" :label="b.brandName" :value="b.id || b.brandId" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 商品图片 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden bg-white">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-image-line mr-1.5 text-[#FA8C16]"></i>商品图片</span>
          </div>
          <div class="p-4 flex gap-6">
            <div class="flex-shrink-0">
              <div class="text-[12px] text-[#555] font-medium mb-2">主图 <span class="text-[#FF4D4F]">*</span></div>
              <MediaPicker v-model="form.mainImage" :preview-size="100" bizType="product" />
            </div>
            <div class="w-px bg-[#F0F0F0] self-stretch"></div>
            <div class="flex-1 min-w-0">
              <div class="text-[12px] text-[#555] font-medium mb-2">轮播图</div>
              <MediaPicker v-model="form.images" :multiple="true" :max-count="9" :preview-size="72" bizType="product" />
            </div>
          </div>
        </div>

        <!-- 商品规格 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden bg-white">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-list-settings-line mr-1.5 text-[#FF6B00]"></i>商品规格</span>
            <span v-if="hasSpecs" class="ml-2 text-[11px] text-[#BBB]">{{ skuRows.length }} 个 SKU</span>
          </div>
          <div class="p-4 space-y-3">
            <!-- 规格维度 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[12px] font-medium text-[#555]">规格维度</span>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[11px] text-[#BBB]">快捷：</span>
                  <el-button v-for="tpl in SPEC_TEMPLATES" :key="tpl.label" size="small" plain @click="applySpecTemplate(tpl)">{{ tpl.label }}</el-button>
                  <el-button v-if="specGroups.length > 0" size="small" text type="danger" @click="clearSpecGroups">清空</el-button>
                </div>
              </div>
              <div class="space-y-2">
                <div v-for="(group, gi) in specGroups" :key="gi"
                  class="grid grid-cols-[110px_1fr_32px] gap-3 items-start p-3 bg-[#FAFAFA] rounded-lg border border-[#F0F0F0]">
                  <el-input v-model="group.name" placeholder="规格名" size="small" maxlength="8" @blur="rebuildSkus" />
                  <div class="flex flex-wrap gap-1.5 items-center">
                    <el-tag v-for="(val, vi) in group.values" :key="vi" closable size="small" @close="removeSpecValue(gi, vi)">{{ val }}</el-tag>
                    <el-input v-model="group.inputVal" placeholder="回车添加" size="small" class="!w-[140px]"
                      maxlength="20" @keyup.enter.stop="addSpecValue(gi)" />
                  </div>
                  <el-button type="danger" link size="small" @click="removeSpecGroup(gi)"><i class="ri-delete-bin-line"></i></el-button>
                </div>
              </div>
              <el-button plain size="small" class="mt-2" @click="addSpecGroup" :disabled="specGroups.length >= 3">
                <i class="ri-add-line mr-1"></i>添加规格维度（最多 3 个）
              </el-button>
            </div>
            <!-- SKU 表格 -->
            <div class="border border-[#F0F0F0] rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-[12px] border-collapse">
                  <thead>
                    <tr class="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                      <th v-if="!hasSpecs" class="px-3 py-2 text-left font-semibold text-[#555] border-r border-[#F0F0F0]" style="width:130px">规格名称</th>
                      <th v-for="g in validSpecGroups" :key="g.name" class="px-3 py-2 text-left font-semibold text-[#555] whitespace-nowrap border-r border-[#F0F0F0]">{{ g.name }}</th>
                      <th class="px-3 py-2 text-left font-semibold text-[#555] border-r border-[#F0F0F0]" style="width:90px">图片</th>
                      <th class="px-3 py-2 text-left font-semibold text-[#555] border-r border-[#F0F0F0]" style="width:110px">SKU编码</th>
                      <th class="px-3 py-2 text-left font-semibold text-[#555] border-r border-[#F0F0F0]" style="width:120px"><span class="text-[#FF4D4F]">*</span> 售价（元）</th>
                      <th class="px-3 py-2 text-left font-semibold text-[#555] border-r border-[#F0F0F0]" style="width:120px">原价（元）</th>
                      <th class="px-3 py-2 text-left font-semibold text-[#555] border-r border-[#F0F0F0]" style="width:100px"><span class="text-[#FF4D4F]">*</span> 库存</th>
                      <th class="px-3 py-2 text-left font-semibold text-[#555] border-r border-[#F0F0F0]" style="width:100px">重量(kg)</th>
                      <th class="px-3 py-2 text-center font-semibold text-[#555]" style="width:52px">启用</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(sku, si) in skuRows" :key="sku.specKey"
                      class="border-b border-[#F5F5F5] last:border-b-0"
                      :class="sku.enabled ? 'bg-white' : 'bg-[#FAFAFA] opacity-60'">
                      <td v-if="!hasSpecs" class="px-2 py-1.5 border-r border-[#F5F5F5]">
                        <el-input v-model="sku.specLabel" size="small" placeholder="如：默认款" :disabled="!sku.enabled" />
                      </td>
                      <template v-for="(g, gi) in validSpecGroups" :key="g.name">
                        <td v-if="si % skuBlockSize(gi) === 0" :rowspan="skuBlockSize(gi)"
                          class="px-3 py-2 border-r border-[#F0F0F0] whitespace-nowrap font-medium text-[#333] align-middle"
                          :class="{ 'border-b border-[#F0F0F0]': si + skuBlockSize(gi) < skuRows.length }">
                          {{ sku.specs[g.name] }}
                        </td>
                      </template>
                      <td class="px-2 py-1.5 border-r border-[#F5F5F5]">
                        <MediaPicker v-model="sku.image" :preview-size="64" bizType="product" />
                      </td>
                      <td class="px-2 py-1.5 border-r border-[#F5F5F5]">
                        <el-input v-model="sku.skuCode" size="small" placeholder="货号" :disabled="!sku.enabled" />
                      </td>
                      <td class="px-2 py-1.5 border-r border-[#F5F5F5]">
                        <el-input-number v-model="sku.price" :min="0" :precision="2" size="small" class="!w-full" controls-position="right" :disabled="!sku.enabled" />
                      </td>
                      <td class="px-2 py-1.5 border-r border-[#F5F5F5]">
                        <el-input-number v-model="sku.originalPrice" :min="0" :precision="2" size="small" class="!w-full" controls-position="right" :disabled="!sku.enabled" />
                      </td>
                      <td class="px-2 py-1.5 border-r border-[#F5F5F5]">
                        <el-input-number v-model="sku.stock" :min="0" size="small" class="!w-full" controls-position="right" :disabled="!sku.enabled" />
                      </td>
                      <td class="px-2 py-1.5 border-r border-[#F5F5F5]">
                        <el-input-number v-model="sku.weight" :min="0" :precision="3" :step="0.1" size="small" class="!w-full" controls-position="right" :disabled="!sku.enabled" />
                      </td>
                      <td class="px-2 py-1.5 text-center">
                        <el-switch v-model="sku.enabled" size="small" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-if="hasSpecs" class="flex items-center gap-3 text-[11px]">
              <el-button size="small" text type="primary" @click="autoGenSkuCodes">自动生成编码</el-button>
              <el-button size="small" text type="primary" @click="batchFillPrice">批量填价格</el-button>
              <el-button size="small" text type="primary" @click="batchFillStock">批量填库存</el-button>
            </div>
          </div>
        </div>

        <!-- 商品详情 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden bg-white">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-file-text-line mr-1.5 text-[#13C2C2]"></i>商品详情</span>
          </div>
          <div>
            <Toolbar :editor="editorRef" :defaultConfig="toolbarConfig" class="border-b border-[#F0F0F0]" />
            <Editor v-model="form.description" :defaultConfig="editorConfig"
              style="min-height:280px;overflow-y:hidden" @onCreated="handleEditorCreated" />
          </div>
        </div>

      </div>

      <!-- 右列（sticky） -->
      <div class="w-[260px] flex-shrink-0 space-y-3 sticky top-0 self-start">

        <!-- 物流 & 限购 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden bg-white">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-truck-line mr-1.5 text-[#1677FF]"></i>物流 & 限购</span>
          </div>
          <div class="p-3">
            <el-form :model="form" label-width="64px" size="small">
              <el-form-item label="运费">
                <div class="flex items-center gap-2 w-full">
                  <el-radio-group v-model="form.shippingType" size="small">
                    <el-radio-button value="free">包邮</el-radio-button>
                    <el-radio-button value="fixed">固定</el-radio-button>
                  </el-radio-group>
                  <el-input-number v-if="form.shippingType === 'fixed'" v-model="form.shippingFee"
                    :min="0" :precision="2" size="small" class="flex-1" controls-position="right" />
                </div>
              </el-form-item>
              <el-form-item label="发货地">
                <el-input v-model="form.shipFrom" placeholder="如：广东深圳" clearable />
              </el-form-item>
              <el-form-item label="发货时效">
                <el-select v-model="form.shippingDays" class="w-full">
                  <el-option :value="1" label="24小时内" /><el-option :value="2" label="48小时内" />
                  <el-option :value="7" label="7天内" /><el-option :value="15" label="15天内" />
                  <el-option :value="0" label="预售另约" />
                </el-select>
              </el-form-item>
              <el-form-item label="每人限购">
                <div class="flex items-center gap-1 w-full">
                  <el-input-number v-model="form.purchaseLimit" :min="0" class="flex-1" controls-position="right" />
                  <span class="text-[11px] text-[#999] flex-shrink-0 ml-1">0=不限</span>
                </div>
              </el-form-item>
              <el-form-item label="最小起订">
                <el-input-number v-model="form.moq" :min="1" class="w-full" controls-position="right" />
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 标签 & 设置 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden bg-white">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-settings-3-line mr-1.5 text-[#722ED1]"></i>标签 & 设置</span>
          </div>
          <div class="p-3">
            <el-form :model="form" label-width="64px" size="small">
              <el-form-item label="上架状态">
                <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" />
              </el-form-item>
              <el-form-item label="标签文字">
                <el-input v-model="form.tag" placeholder="新品、热销等" maxlength="6" clearable />
              </el-form-item>
              <template v-if="form.tag">
                <el-form-item label="文字颜色">
                  <div class="flex items-center gap-1.5 w-full">
                    <el-color-picker v-model="form.tagColor" size="small" />
                    <el-input v-model="form.tagColor" class="flex-1" />
                  </div>
                </el-form-item>
                <el-form-item label="背景颜色">
                  <div class="flex items-center gap-1.5 w-full">
                    <el-color-picker v-model="form.tagBg" size="small" />
                    <el-input v-model="form.tagBg" class="flex-1" />
                  </div>
                </el-form-item>
                <div class="flex gap-1 mb-2 flex-wrap">
                  <button v-for="c in TAG_PRESETS" :key="c.bg" class="w-5 h-5 rounded-full border-2 transition-all"
                    :class="form.tagBg === c.bg ? 'border-[#333] scale-110' : 'border-transparent'"
                    :style="{ backgroundColor: c.bg }" @click="form.tagColor = c.text; form.tagBg = c.bg" />
                </div>
              </template>
            </el-form>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-col gap-2">
          <el-button type="primary" size="large" :loading="saving" @click="submit" class="!w-full !m-0">
            <i class="ri-save-line mr-1"></i>保存修改
          </el-button>
          <el-button size="large" @click="emit('update:modelValue', false)" class="!w-full !m-0">取消</el-button>
        </div>

      </div>
    </div>

    <!-- 批量填写 -->
    <el-dialog v-model="batchPriceVisible" title="批量填写价格" width="280px" append-to-body>
      <el-input-number v-model="batchPriceVal" :min="0" :precision="2" class="w-full" controls-position="right" />
      <template #footer>
        <el-button @click="batchPriceVisible = false">取消</el-button>
        <el-button type="primary" @click="applyBatchPrice">确定</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="batchStockVisible" title="批量填写库存" width="280px" append-to-body>
      <el-input-number v-model="batchStockVal" :min="0" class="w-full" controls-position="right" />
      <template #footer>
        <el-button @click="batchStockVisible = false">取消</el-button>
        <el-button type="primary" @click="applyBatchStock">确定</el-button>
      </template>
    </el-dialog>

  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, shallowRef, watch, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import { adminProductApi, adminShopApi } from '@/utils/admin-api';
import { usePermission } from '@/utils/permission';
import { BASE_URL } from '@/utils/http';
import MediaPicker from '@/components/MediaPicker/MediaPicker.vue';

// ── Props / Emits ─────────────────────────────────────────────────────────────
const props = defineProps<{
  modelValue: boolean;   // v-model:visible
  productId:  string | number;
}>();
const emit = defineEmits<{
  'update:modelValue': [v: boolean];
  'saved': [];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const { isAdmin } = usePermission();

// ── WangEditor ────────────────────────────────────────────────────────────────
const editorRef = shallowRef<IDomEditor | null>(null);
const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ['fontFamily','lineHeight','todo','emotion','insertFormula','codeBlock','code','group-video','fullScreen','insertTable','indent','delIndent'],
};
const editorConfig: Partial<IEditorConfig> = {
  placeholder: '商品详情...',
  MENU_CONF: {
    uploadImage: {
      server: `${BASE_URL}/files/upload`, fieldName: 'file',
      headers: { Authorization: localStorage.getItem('token') || '' },
      customInsert(res: any, insertFn: (url:string, alt:string, href:string) => void) {
        const url = res.data?.url || res.data?.objectKey || '';
        if (url) insertFn(url, '', url);
      },
    },
  },
};
function handleEditorCreated(editor: IDomEditor) { editorRef.value = editor; }
onUnmounted(() => editorRef.value?.destroy());

// ── 常量 ─────────────────────────────────────────────────────────────────────
const TAG_PRESETS = [
  { bg: '#FF4D4F', text: '#FFFFFF' }, { bg: '#FF6B00', text: '#FFFFFF' },
  { bg: '#52C41A', text: '#FFFFFF' }, { bg: '#1677FF', text: '#FFFFFF' },
  { bg: '#722ED1', text: '#FFFFFF' }, { bg: '#555555', text: '#FFFFFF' },
];
const SPEC_TEMPLATES = [
  { label: '颜色+尺码', groups: [{ name: '颜色', values: ['黑色','白色','红色','蓝色'] }, { name: '尺码', values: ['S','M','L','XL','XXL'] }] },
  { label: '版本+存储', groups: [{ name: '版本', values: ['标准版','Pro版','Ultra版'] }, { name: '存储', values: ['128GB','256GB','512GB','1TB'] }] },
  { label: '颜色+容量', groups: [{ name: '颜色', values: ['黑色','白色','蓝色'] }, { name: '容量', values: ['250ml','500ml','1L'] }] },
  { label: '颜色+规格', groups: [{ name: '颜色', values: ['黑色','白色'] }, { name: '规格', values: ['标准款','升级款','旗舰款'] }] },
];

// ── 表单 ─────────────────────────────────────────────────────────────────────
const formRef     = ref<FormInstance>();
const pageLoading = ref(false);
const saving      = ref(false);

const form = reactive({
  name:'', productCode:'', categoryId:null as number|null, shopId:null as number|null, brandId:null as number|null,
  subtitle:'', description:'',
  shippingType:'free', shippingFee:null as number|null, shipFrom:'', shippingDays:1 as number|null,
  purchaseLimit:0 as number|null, moq:1 as number|null, videoUrl:'',
  mainImage:'', images:[] as string[],
  featureList:[] as string[],
  tag:'', tagColor:'#FFFFFF', tagBg:'#FF4D4F', status:1, auditStatus:'', auditReason:'',
});
const rules = {
  name:       [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  mainImage:  [{ required: true, message: '请上传商品主图', trigger: 'change' }],
};

// ── 规格 & SKU ────────────────────────────────────────────────────────────────
interface SpecGroup { name: string; values: string[]; inputVal: string; }
interface SkuRow { specKey:string; specs:Record<string,string>; specLabel:string; skuCode:string; price:number|null; originalPrice:number|null; stock:number|null; weight:number|null; image:string; enabled:boolean; }
const DEFAULT_SKU_KEY = '__default__';
function emptySkuRow(o: Partial<SkuRow> = {}): SkuRow {
  return { specKey:'', specs:{}, specLabel:'默认', skuCode:'', price:null, originalPrice:null, stock:null, weight:null, image:'', enabled:true, ...o };
}
const specGroups    = ref<SpecGroup[]>([]);
const skuRows       = ref<SkuRow[]>([emptySkuRow({ specKey: DEFAULT_SKU_KEY })]);
const validSpecGroups = computed(() => specGroups.value.filter(g => g.name.trim() && g.values.length > 0));
const hasSpecs        = computed(() => validSpecGroups.value.length > 0);
function skuBlockSize(gi: number) { return validSpecGroups.value.slice(gi+1).reduce((a,g)=>a*g.values.length,1); }
function cartesian(groups: SpecGroup[]) {
  const valid = groups.filter(g=>g.name&&g.values.length>0);
  if (!valid.length) return [];
  return valid.reduce<Record<string,string>[]>((acc,g)=>{
    if (!acc.length) return g.values.map(v=>({[g.name]:v}));
    return acc.flatMap(prev=>g.values.map(v=>({...prev,[g.name]:v})));
  },[]);
}
function specKeyOf(s: Record<string,string>) { return Object.values(s).join('/'); }
function rebuildSkus() {
  const combos = cartesian(specGroups.value);
  if (!combos.length) { const prev=skuRows.value[0]; skuRows.value=[emptySkuRow({specKey:DEFAULT_SKU_KEY,...(prev?prev:{})})]; return; }
  const existing = new Map(skuRows.value.map(s=>[s.specKey,s]));
  skuRows.value = combos.map(specs=>{ const key=specKeyOf(specs); const prev=existing.get(key); return prev?{...prev,specs}:emptySkuRow({specKey:key,specs}); });
}
function addSpecGroup()  { if (specGroups.value.length<3) specGroups.value.push({name:'',values:[],inputVal:''}); }
function removeSpecGroup(gi: number) { specGroups.value.splice(gi,1); rebuildSkus(); }
function addSpecValue(gi: number) { const v=specGroups.value[gi].inputVal.trim(); if(!v) return; if(!specGroups.value[gi].values.includes(v)){specGroups.value[gi].values.push(v);rebuildSkus();} specGroups.value[gi].inputVal=''; }
function removeSpecValue(gi: number, vi: number) { specGroups.value[gi].values.splice(vi,1); rebuildSkus(); }
function applySpecTemplate(tpl: typeof SPEC_TEMPLATES[0]) { specGroups.value=tpl.groups.map(g=>({name:g.name,values:[...g.values],inputVal:''})); rebuildSkus(); }
function clearSpecGroups() { specGroups.value=[]; skuRows.value=[emptySkuRow({specKey:DEFAULT_SKU_KEY})]; }
function autoGenSkuCodes() { skuRows.value.forEach(s=>{if(!s.skuCode&&s.specKey!==DEFAULT_SKU_KEY) s.skuCode=Object.values(s.specs).join('-').toUpperCase().replace(/\s+/g,'');}); ElMessage.success('编码已自动生成'); }

const batchPriceVisible=ref(false); const batchPriceVal=ref<number|null>(null);
const batchStockVisible=ref(false); const batchStockVal=ref<number|null>(null);
function batchFillPrice(){batchPriceVal.value=null;batchPriceVisible.value=true;}
function applyBatchPrice(){if(batchPriceVal.value!=null)skuRows.value.forEach(s=>{if(s.enabled)s.price=batchPriceVal.value;});batchPriceVisible.value=false;}
function batchFillStock(){batchStockVal.value=null;batchStockVisible.value=true;}
function applyBatchStock(){if(batchStockVal.value!=null)skuRows.value.forEach(s=>{if(s.enabled)s.stock=batchStockVal.value;});batchStockVisible.value=false;}

// ── 辅助数据 ─────────────────────────────────────────────────────────────────
const categoryTree=ref<any[]>([]); const shops=ref<any[]>([]); const brands=ref<any[]>([]);
async function loadAuxData() {
  const [catRes,shopRes,brandRes]=await Promise.allSettled([
    adminProductApi.adminCategories(),
    isAdmin ? adminShopApi.list({pageNum:1,pageSize:200}) : adminShopApi.getMyShop(),
    fetch(`${BASE_URL}/app/brands?pageNum=1&pageSize=200`).then(r=>r.json()),
  ]);
  if(catRes.status==='fulfilled'){const d=(catRes.value as any).data?.data||(catRes.value as any).data||[];categoryTree.value=Array.isArray(d)?d:[];}
  if(shopRes.status==='fulfilled'){const d=(shopRes.value as any).data?.data||(shopRes.value as any).data||{};shops.value=Array.isArray(d)?d:(d.records||(d?[d]:[])); }
  if(brandRes.status==='fulfilled'){const d=(brandRes.value as any)?.data?.records||(brandRes.value as any)?.data||[];brands.value=Array.isArray(d)?d:[];}
}

// ── 加载商品 ─────────────────────────────────────────────────────────────────
async function loadProduct() {
  if (!props.productId) return;
  pageLoading.value = true;
  try {
    const res: any = await adminProductApi.detail(String(props.productId));
    const p = res.data?.data || res.data;
    if (!p) return;
    Object.assign(form, {
      name:p.name||'', productCode:p.productCode||'', categoryId:p.categoryId||null, shopId:p.shopId||null,
      brandId:p.brandShopId||null, subtitle:p.subtitle||'', description:p.description||'',
      shippingType:p.shippingType||'free', shippingFee:p.shippingFee??null, shipFrom:p.shipFrom||'',
      shippingDays:p.shippingDays??1, purchaseLimit:p.purchaseLimit??0, moq:p.moq??1, videoUrl:p.videoUrl||'',
      mainImage:p.mainImage||p.image||'',
      images:p.images?(Array.isArray(p.images)?p.images:String(p.images).split(',').filter(Boolean)):[],
      tag:p.tag||'', tagColor:p.tagColor||'#FFFFFF', tagBg:p.tagBg||'#FF4D4F',
      status:p.status??1, auditStatus:p.auditStatus||'', auditReason:p.auditReason||'',
    });
    if (p.features) { try { form.featureList = JSON.parse(p.features); } catch { form.featureList = []; } }
    if (p.specs) {
      try {
        const parsed = typeof p.specs==='string' ? JSON.parse(p.specs) : p.specs;
        if (parsed?.groups) {
          specGroups.value = parsed.groups.map((g: any) => ({name:g.name||'',values:g.values||[],inputVal:''}));
          if (parsed.skus) skuRows.value = parsed.skus.map((s: any) => emptySkuRow({
            specKey:s.specKey||'', specs:s.specs||{}, specLabel:s.specLabel||'默认', skuCode:s.skuCode||'',
            price:s.price??null, originalPrice:s.originalPrice??null, stock:s.stock??null, weight:s.weight??null,
            image:s.image||'', enabled:s.enabled!==false,
          }));
        } else if (Array.isArray(parsed) && parsed[0]?.label) {
          specGroups.value = parsed.map((g: any) => ({name:g.label||'',values:g.values||[],inputVal:''}));
          rebuildSkus();
        }
      } catch { /* ignore */ }
    } else {
      skuRows.value = [emptySkuRow({ specKey:DEFAULT_SKU_KEY, price:p.price??null, originalPrice:p.originalPrice??null, stock:p.stock??null, weight:p.weight??null })];
    }
  } finally { pageLoading.value = false; }
}

// 每次 Drawer 打开时加载
watch(() => props.modelValue, async (open) => {
  if (open && props.productId) {
    specGroups.value = [];
    skuRows.value = [emptySkuRow({ specKey: DEFAULT_SKU_KEY })];
    await loadAuxData();
    await loadProduct();
  }
}, { immediate: false });

// ── 保存 ─────────────────────────────────────────────────────────────────────
async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (!form.mainImage) { ElMessage.warning('请上传商品主图'); return; }
  const enabledSkus = skuRows.value.filter(s => s.enabled);
  if (!enabledSkus.length) { ElMessage.warning('请至少启用一行 SKU'); return; }
  if (enabledSkus.some(s => !s.price || s.price <= 0)) { ElMessage.warning('请为所有启用的 SKU 设置售价'); return; }

  saving.value = true;
  try {
    const prices = enabledSkus.map(s=>s.price||0).filter(p=>p>0);
    const finalPrice    = prices.length ? Math.min(...prices) : 0;
    const finalStock    = enabledSkus.reduce((sum,s)=>sum+(s.stock||0),0);
    const finalWeight   = enabledSkus[0]?.weight ?? null;
    const finalOriginal = enabledSkus[0]?.originalPrice ?? null;
    const specsJson = hasSpecs.value ? JSON.stringify({
      groups: specGroups.value.map(g=>({name:g.name,values:g.values})),
      skus:   skuRows.value.map(s=>({specKey:s.specKey,specs:s.specs,specLabel:s.specLabel,skuCode:s.skuCode,price:s.price,originalPrice:s.originalPrice,stock:s.stock,weight:s.weight,image:s.image,enabled:s.enabled})),
    }) : null;

    await adminProductApi.update(String(props.productId), {
      name:form.name.trim(), productCode:form.productCode||null, categoryId:form.categoryId, shopId:form.shopId,
      brandShopId:form.brandId??null, subtitle:form.subtitle||null, description:form.description||null,
      features:form.featureList.length ? JSON.stringify(form.featureList) : null,
      price:finalPrice, originalPrice:finalOriginal, stock:finalStock, weight:finalWeight,
      shippingType:form.shippingType, shippingFee:form.shippingType==='fixed'?(form.shippingFee??null):null,
      shipFrom:form.shipFrom||null, shippingDays:form.shippingDays??1, purchaseLimit:form.purchaseLimit??0, moq:form.moq??1,
      videoUrl:form.videoUrl||null, mainImage:form.mainImage,
      images:Array.isArray(form.images)?form.images.filter(Boolean).join(','):form.images,
      tag:form.tag||null, tagColor:form.tag?(form.tagColor||'#FFFFFF'):null, tagBg:form.tag?(form.tagBg||'#FF4D4F'):null,
      status:form.status, specs:specsJson,
    });
    ElMessage.success('修改已保存');
    emit('saved');
    emit('update:modelValue', false);
  } finally { saving.value = false; }
}
</script>
