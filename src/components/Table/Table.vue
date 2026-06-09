<template>
  <div class="table-container flex flex-col w-full h-full overflow-y-auto">
    <div class="table-tools flex justify-between items-center p-4 mb-[-1px]">
      <div class="search flex flex-nowrap justify-start items-center">
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
          <el-button type="primary" class="ml-2" @click="search"
            >搜索</el-button
          >
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
        <div class="del" v-if="showBatchDeleteButton">
          <el-button type="danger" plain class="mr-2" @click="delData"
            >删除所选</el-button
          >
        </div>
        <div class="add" v-if="showAddButton">
          <el-button type="primary" @click="addData">{{
            addButtonLabel
          }}</el-button>
        </div>
      </div>
    </div>

    <div ref="tableBox" class="table-box flex-1">
      <el-table
        style="width: 100%"
        ref="multipleTableRef"
        :data="tableData"
        :empty-text="'暂无数据'"
        v-loading="loading"
        :height="tableBox?.scrollHeight"
        @select="handleSelect"
        @select-all="handleSelectAll"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column
          v-for="(column, columnIndex) in columns"
          :key="columnIndex"
          :prop="column.prop"
          :label="column.label"
          :width="column.width ? column.width : ''"
          align="center"
        >
          <template v-if="column.type === 'image'" #default="{ row }">
            <el-image
              :src="row[column.prop] ? row[column.prop] : ''"
              :zoom-rate="1.2"
              :max-scale="7"
              :min-scale="0.2"
              preview-teleported
              :preview-src-list="[row[column.prop] ? row[column.prop] : '']"
              fit="cover"
              style="width: 64px; height: 64px"
            />
          </template>
          <template v-if="column.type === 'tag'" #default="{ row }">
            <div>
              <el-tag>{{ row[column.prop] }}</el-tag>
            </div>
          </template>
          <template v-else-if="column.type === 'status'" #default="{ row }">
            <div>
              <el-tag :type="row[column.prop] ? 'success' : 'info'">{{
                row[column.prop] ? "有效" : "失效"
              }}</el-tag>
            </div>
          </template>
          <template v-else-if="column.type === 'sex'" #default="{ row }">
            <div>
              <el-tag type="primary">{{
                row[column.prop] == "Male" ? "男" : "女"
              }}</el-tag>
            </div>
          </template>
          <template v-else-if="column.type === 'role'" #default="{ row }">
            <div>
              <el-tag type="primary">{{
                row[column.prop] == "Admin"
                  ? "管理员"
                  : row[column.prop] == "ShopAdmin"
                  ? "商家"
                  : "普通用户"
              }}</el-tag>
            </div>
          </template>
          <template
            v-else-if="column.type === 'user_status'"
            #default="{ row }"
          >
            <div>
              <el-tag
                :type="
                  row[column.prop] == 'Active'
                    ? 'success'
                    : row[column.prop] == 'Inactive'
                    ? 'warning'
                    : 'info'
                "
                >{{
                  row[column.prop] == "Active"
                    ? "正常"
                    : row[column.prop] == "Inactive"
                    ? "封禁"
                    : "已注销"
                }}</el-tag
              >
            </div>
          </template>
          <template v-else-if="column.type === 'judge'" #default="{ row }">
            <div>
              <el-tag :type="row[column.prop] ? 'success' : 'info'">{{
                row[column.prop] ? "是" : "否"
              }}</el-tag>
            </div>
          </template>
          <template v-else-if="column.type === 'text'" #default="{ row }">
            <div>
              <el-tooltip
                class="box-item"
                effect="dark"
                :content="row[column.prop]"
                placement="top"
                v-if="row[column.prop]"
              >
                <div class="flex justify-center items-center truncate">
                  <span>{{ row[column.prop] }}</span>
                </div>
              </el-tooltip>
              <span v-else>暂无</span>
            </div>
          </template>
          <template #default="{ row }">
            <div>
              <span v-if="column.formatter">{{
                column.formatter(row[column.prop], row)
              }}</span>
              <span v-else>{{ row[column.prop] }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column fixed="right" label="操作" width="180">
          <template #default="{ row }">
            <div class="action flex">
              <el-button @click="editRow(row)" :type=" editButtonLabel?'success':'primary'" size="small"
                >{{editButtonLabel?editButtonLabel:'编辑'}}</el-button
              >
              <el-button v-if="showRowDeleteButton" @click="deleteRow(row)" type="danger" size="small"
                >删除</el-button
              >
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="table-foot flex justify-end p-4">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 50]"
        :total="page.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        layout="sizes, total, prev, pager, next, jumper"
        background
      />
    </div>
    <DialogForm
      :title="editButtonLabel?editButtonLabel:addButtonLabel"
      :dialogVisible="dialogVisible"
      :labelPosition="'left'"
      :fields="formFields"
      :form-data="formData"
      @uploadChange="handleUploadChange"
      @update:dialogVisible="dialogVisible = $event"
      @update:formData="formData = $event"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { FormField } from "../Dialog/FormField";
import DialogForm from "@/components/Dialog/DialogForm.vue";
import { formatDate } from "@/utils/formatDate";

// 接收来自父组件的属性
interface ColumnDefinition {
  prop: string;
  label: string;
  type: string;
  width?: string;
  sortable?: boolean;
  formatter?: (value: any, row: any) => string;
}

interface SearchField {
  value: string;
  label: string;
}

interface Page {
  currentPage: number;
  pageSize: number;
  total: number;
}

const props = defineProps<{
  columns: ColumnDefinition[];
  tableData: any[];
  searchList: SearchField[];
  page: Page;
  addButtonLabel?: string;
  editButtonLabel?: string;
  formFields?: FormField<any>[];
  loading?: boolean;
  editMethod?: (row: any) => void;
  deleteMethod?: (row: any) => void;
  addData?: () => void;
  delData?: () => void;
  actionButtons?: any[];
  showAddButton?: boolean;
  showBatchDeleteButton?: boolean;
  showRowDeleteButton?: boolean;
}>();

// 用于发送事件
const emit = defineEmits<{
  (e: "search", searchParams: any): void;
  (e: "reSet"): void;
  (e: "updateSelection", selectedRows: any[]): void;
  (e: "uploadChange", file: any, fileList: any[]): void;
  (e: "handleSubmit", response: any): void;
}>();

const tableData = ref<any[]>([]);
const columns = ref<ColumnDefinition[]>([]);
const searchList = ref<SearchField[]>([]);
const page = ref<Page>({
  currentPage: 1,
  pageSize: 10,
  total: 0,
});
const addButtonLabel = ref("");
const editButtonLabel = ref("");
const formFields = ref<FormField<any>[]>([]);
const formData = ref({});
const showAddButton = ref(true);
const showBatchDeleteButton = ref(true);
const showRowDeleteButton = ref(true);

// 受控的搜索表单
const searchText = ref("");
const searchType = ref("");
const time = ref<[string, string]>(["", ""]);
const selectData = ref<any[]>([]);

const tableBox = ref<HTMLElement>();
const loading = ref(false);
const dialogVisible = ref(false);

// 时间范围变更
const handleTimeChange = (value: [string, string]) => {
  if (!value) return;
  let [startTime, endTime] = value;
  startTime = formatDate(new Date(startTime), "yyyy-MM-dd hh:mm:ss");
  endTime = formatDate(new Date(endTime), "yyyy-MM-dd hh:mm:ss");
  time.value = [startTime, endTime];
};

// 搜索按钮点击事件
const search = () => {
  if (
    searchType.value === "" &&
    searchText.value === "" &&
    time.value[0] === ""
  ) {
    ElMessage.error("请选择搜索类型");
    return;
  }
  emit("search", {
    searchType: searchType.value,
    searchText: searchText.value,
    time: time.value,
  });
};

// 清除搜索条件
const reSet = () => {
  searchText.value = "";
  searchType.value = "";
  time.value = ["", ""];
  emit("reSet");
};

// 新增
const addData = () => {
  dialogVisible.value = true;
  props.addData?.();
};

// 编辑行
const editRow = (row: any) => {

  dialogVisible.value = true;
  formData.value = { ...row };
  props.editMethod?.(row);
};

// 删除行
const deleteRow = (row: any) => {
  ElMessageBox.confirm("此操作将永久删除该文件, 是否继续?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      props.deleteMethod?.(row);
      ElMessage({
        type: "success",
        message: "删除成功!",
      });
    })
    .catch(() => {
      ElMessage({
        type: "info",
        message: "已取消删除",
      });
    });
};

// 分页逻辑
const currentPage = ref(props.page.currentPage);
const pageSize = ref(props.page.pageSize);

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  // 实现分页逻辑
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  // 实现分页逻辑
};

// 选择数据行
const handleSelect = (rows: any[]) => {
  selectData.value = rows;
  emit("updateSelection", rows);
};

// 全选数据
const handleSelectAll = (rows: any[]) => {
  selectData.value = rows;
  emit("updateSelection", rows);
};

// 处理多选框变化
const handleSelectionChange = (rows: any[]) => {
  selectData.value = rows;
  emit("updateSelection", rows);
};

// 获取对话框上传数据
const handleFormSubmit = (data: any) => {
  emit("handleSubmit", data);
};

const handleUploadChange = (file: any, fileList: any) => {
  // 上传文件回调
  emit("uploadChange", file, fileList);
};

onMounted(() => {
  // 初始化操作
});

watchEffect(() => {
  columns.value = props.columns;
  tableData.value = props.tableData;
  searchList.value = props.searchList;
  addButtonLabel.value = props.addButtonLabel ?? '';
  editButtonLabel.value = props.editButtonLabel ?? '';

  formFields.value = props.formFields ?? [];
  loading.value = props.loading ?? false;
  page.value = props.page
  showAddButton.value = props.showAddButton ?? true;
  showBatchDeleteButton.value = props.showBatchDeleteButton ?? true;
  showRowDeleteButton.value = props.showRowDeleteButton ?? true;
});

defineExpose({
  formData,
  formFields,
});
</script>

<style lang="scss" scoped>
.table-container {
  .table-tools-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    margin-bottom: -1px;
  }

  .search {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .el-form-item {
    flex-grow: 1;
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
