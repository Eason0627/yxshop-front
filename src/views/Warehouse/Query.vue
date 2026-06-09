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
        <el-button type="primary" @click="addWarehouse">新增仓库</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { formatDate } from "@/utils/formatDate";
import  Warehouse  from "@/model/Warehouse"; // 更新导入
import { ElMessage } from "element-plus";

interface Props {
  tableData?: Warehouse[] | undefined; // 类型改为Warehouse
  selectData?: Warehouse[] | undefined;
  delData: () => void;
}

interface Emits {
  (e: "getData"): void;
  (e: "update:Query", formData?: Warehouse, flag?: boolean, type?: string): void; // 类型改为Warehouse
  (
    e: "search",
    key?: keyof Warehouse, // 使用keyof确保类型安全
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
const searchType = ref(""); // 限制为Warehouse的key
const time = ref("");
const searchList = [

  { value: "warehouse_name", label: "仓库名称" },
  { value: "address", label: "仓库地址" },
 
  // { value: "status", label: "仓库状态" }
] as const; // 确保类型安全
const startTime = ref("");
const endTime = ref("");
const selectData = ref<Warehouse[]>([]); // 类型改为Warehouse
const tableData = ref<Warehouse[]>([]);

const handleTimeChange = (value: [Date, Date] | null) => {
  if (!value) {
    startTime.value = "";
    endTime.value = "";
    return;
  }
  startTime.value = formatDate(value[0], "yyyy-MM-dd hh:mm:ss");
  endTime.value = formatDate(
    new Date(value[1].getTime() + (1000 * 60 * 60 * 24 - 1000)),
    "yyyy-MM-dd hh:mm:ss"
  );
};

const addWarehouse = () => { // 更名以符合语义
  emit("update:Query", undefined, true, "add");
};

const search = async () => {
  if (searchType.value === "" && searchText.value) {
    ElMessage.error("请选择搜索类型");
    return;
  }
  emit(
    "search",
    searchType.value as keyof Warehouse,
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
  selectData.value = props.selectData as Warehouse[];
  tableData.value = props.tableData as Warehouse[];
});
</script>

<style lang="scss" scoped></style>