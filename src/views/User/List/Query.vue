<template>
  <div
    class="tools flex justify-between items-center p-4 mb-[-1px] border-[1px] border-[--info-border-color]"
  >
    <div class="search mt-2 flex flex-nowrap justify-start items-center">
      <div class="text-left">筛选条件：</div>

      <div class="option">
        <el-input
          v-model="searchText"
          style="max-width: 250px"
          placeholder="请输入内容"
          class="input-with-select"
        >
          <template #prepend>
            <el-select
              v-model="searchType"
              placeholder="搜索类型"
              style="width: 80px"
            >
              <el-option
                v-for="item in searchOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-input>
      </div>
      
      <div class="option flex items-center">
        <span class="label px-2">角色筛选: </span>
        <el-select
          v-model="roleFilter"
          placeholder="全部角色"
          clearable
          style="width: 80px"
        >
          <el-option
            v-for="role in roleOptions"
            :key="role.value"
            :label="role.label"
            :value="role.value"
          />
        </el-select>
      </div>
      
      <div class="option flex items-center">
        <span class="label px-2">状态筛选: </span>
        <el-select
          v-model="statusFilter"
          placeholder="全部状态"
          clearable
          style="width: 80px"
        >
          <el-option
            v-for="status in statusOptions"
            :key="status.value"
            :label="status.label"
            :value="status.value"
          />
        </el-select>
      </div>

      <div class="option flex items-center">
        <span class="label px-2"> 时间范围: </span>
        <el-date-picker
          v-model="timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          @change="handleTimeChange"
          style="width: 150px"
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
        已选<span>{{ selectData?.length ?? 0 }}</span
        >条数据
      </div>
      <div class="del">
        <el-button 
          type="danger" 
          plain 
          class="mr-2" 
          @click="delData"
          :disabled="!hasSelected"
        >
          批量{{ hasDeletedSelected ? '恢复' : '删除' }}
        </el-button>
      </div>
      <div class="add">
        <el-button type="primary" @click="addUser" disabled >新增用户</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { formatDate } from "@/utils/formatDate";
import User from "@/model/User";
import { ElMessage } from "element-plus";

interface Props {
  tableData?: User[] | undefined;
  selectData?: User[] | undefined;
  delData: () => void;
}

// 自定义事件
interface Emits {
  (e: "getData"): void;
  (e: "update:Query", formData?: User, flag?: boolean, type?: string): void;
  (
    e: "search",
    key?: string,
    value?: string,
    startTime?: string,
    endTime?: string,
    role?: string,
    status?: string
  ): void;
  (e: "reSet"): void;
}

const emit = defineEmits<Emits>();

// 参数默认值
const props = withDefaults(defineProps<Props>(), {
  tableData: undefined,
  selectData: undefined,
  delData: () => {},
});

// 搜索相关
const searchText = ref("");
const searchType = ref("username");
const timeRange = ref("");
const startTime = ref("");
const endTime = ref("");

// 筛选条件
const roleFilter = ref("");
const statusFilter = ref("");

// 搜索选项配置
const searchOptions = [
  { value: "username", label: "用户名" },
  { value: "nick_name", label: "昵称" },
  { value: "email", label: "邮箱" },
  { value: "phone", label: "手机号" },
  { value: "wechat_id", label: "微信ID" },
];

// 角色选项
const roleOptions = [
  { value: "Admin", label: "管理员" },
  { value: "ShopOwner", label: "商家" },
  { value: "Customer", label: "顾客" },
];

// 状态选项
const statusOptions = [
  { value: "Active", label: "活跃" },
  { value: "Inactive", label: "禁用" },
  { value: "Deleted", label: "已删除" },
];

// 计算属性
const hasSelected = computed(() => props.selectData && props.selectData.length > 0);
const hasDeletedSelected = computed(() => 
  props.selectData && props.selectData.some(user => user.status === 'Deleted')
);

// 时间范围变化处理
const handleTimeChange = (value: Array<Date>) => {
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

// 新增用户
const addUser = () => {
  emit("update:Query", undefined, true, "add");
};

// 搜索数据
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
    endTime.value,
    roleFilter.value,
    statusFilter.value
  );
};

// 重置数据
const reSet = () => {
  searchText.value = "";
  searchType.value = "username";
  timeRange.value = "";
  startTime.value = "";
  endTime.value = "";
  roleFilter.value = "";
  statusFilter.value = "";
  emit("reSet");
};
</script>

<style lang="scss" scoped>
// 可以根据需要添加自定义样式
.option {
  margin-left: 12px;
}

.label {
  white-space: nowrap;
}
</style>