<template>
  <el-select
    :model-value="modelValue"
    placeholder="全部店铺"
    class="!w-[140px]"
    clearable
    filterable
    :loading="loading"
    @update:model-value="$emit('update:modelValue', $event)"
    @change="$emit('change', $event)"
  >
    <el-option
      v-for="s in shops"
      :key="s.shopId || s.id"
      :label="s.displayName || s.shopName"
      :value="s.shopId || s.id"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminShopApi } from '@/utils/admin-api';

defineProps<{
  modelValue: string | null;
}>();

defineEmits<{
  'update:modelValue': [val: string | null];
  'change': [val: string | null];
}>();

const shops = ref<any[]>([]);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    const res: any = await adminShopApi.list({ pageNum: 1, pageSize: 100 });
    const data = res.data?.data || res.data || {};
    shops.value = Array.isArray(data) ? data : (data.records || []);
  } catch { /* interceptor handles */ }
  finally { loading.value = false; }
});
</script>
