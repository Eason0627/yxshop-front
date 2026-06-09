<template>
  <div
    class="tools flex justify-between items-center p-4 mb-[-1px] border-[1px] border-[--info-border-color]"
  >
    <div class="search mt-2 flex flex-nowrap justify-start items-center">
      <div class="text-left">筛选条件：</div>

      <div class="option">
        <el-input
          v-model="searchText"
          style="max-width: 300px"
          placeholder="请输入内容"
          class="input-with-select"
        >
          <template #prepend>
            <el-select
              v-model="searchType"
              placeholder="搜索类型"
              style="width: 120px"
            >
              <el-option
                v-for="item in searchList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-input>
      </div>
      <div class="option flex items-center">
        <span class="label px-2"> 时间范围: </span>
        <el-date-picker
          v-model="time"
          type="daterange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          @change="handleTimeChange"
          style="width: 300px"
        />
      </div>
      <div class="option">
        <el-button type="primary" class="ml-2" @click="search">搜索</el-button>
        <el-button type="danger" plain @click="reSet">清除</el-button>
      </div>
    </div>
    <div class="action flex items-center">
      <div
        class="tip mr-2 self-end text-sm text-[--error-color] underline cursor-pointer"
      >
        已选<span>{{ selectData.length }}</span
        >条数据
      </div>
      <div class="del">
        <el-button type="danger" plain class="mr-2" @click="delData"
          >删除所选</el-button
        >
      </div>
      <div class="add">
        <el-button type="primary" @click="addCategory">新增分类</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { formatDate } from "@/utils/formatDate";
import  ProductCategory  from "@/model/ProductCategory";
import { ElMessage } from "element-plus";

interface Props {
  tableData?: ProductCategory[] | undefined;
  selectData?: ProductCategory[] | undefined;
  delData: () => void;
}

interface Emits {
  (e: "getData"): void;
  (e: "update:Query", formData?: ProductCategory, flag?: boolean, type?: string): void;
  (
    e: "search",
    key?: string,
    value?: string,
    startTime?: string,
    endTime?: string
  ): void;
  (e: "reSet"): void;
}

const emit = defineEmits<Emits>();

const props = withDefaults(defineProps<Props>(), {
  tableData: undefined,
  selectData: undefined,
  delData: () => {},
});

const searchText = ref("");
const searchType = ref("");
const time = ref("");
const searchList = [
  
  {
    value: "category_name",
    label: "分类名称",
  },
  {
    value: "description",
    label: "分类描述",
  },
  {
    value: "parent_category_id",  // 这里修改为parent_category_id
    label: "父分类ID",
  }
];
const startTime = ref("");
const endTime = ref("");
const selectData = ref<ProductCategory[]>([]);
const tableData = ref<ProductCategory[]>([]);

// 其余方法保持不变
const handleTimeChange = (value: Array<Date>) => {
  if (!value) return;
  startTime.value = formatDate(value[0], "yyyy-MM-dd hh:mm:ss");
  endTime.value = formatDate(
    new Date(value[1].getTime() + (1000 * 60 * 60 * 24 - 1000)),
    "yyyy-MM-dd hh:mm:ss"
  );
};

const addCategory = () => {
  emit("update:Query", undefined, true, "add");
};

const search = async () => {
  if (searchType.value === "" && searchText.value) {
    ElMessage.error("请选择搜索类型");
    return;
  }
  emit(
    "search",
    searchType.value,
    searchText.value,
    startTime.value,
    endTime.value
  );
};

const reSet = () => {
  searchText.value = "";
  searchType.value = "";
  time.value = "";
  startTime.value = "";
  endTime.value = "";
  emit("reSet");
};

watchEffect(() => {
  selectData.value = props.selectData as ProductCategory[];
  tableData.value = props.tableData as ProductCategory[];
});
</script>

<style lang="scss" scoped>

</style>