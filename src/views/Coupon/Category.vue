<template>
  <div class="category w-full h-full p-4 pb-32 overflow-y-auto">
    <div
      class="container w-full h-full mx-auto border-[.0625rem] rounded-md bg-white"
    >
      <Table
        :edit-button-label="'编辑优惠券'"
        :columns="columns"
        :table-data="tableData"
        :search-list="searchList"
        :page="page"
        :add-button-label="'新增优惠券类型'"
        :form-fields="formFields"
        :loading="loading"
        :edit-method="editRow"
        :delete-method="deleteRow"
        :del-data="delData"
        :add-data="addData"
        @search="search"
        @reSet="reSet"
        @update-selection="updateSelection"
        @handle-submit="handleFormSubmit"
      ></Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, onBeforeMount, reactive, ref } from "vue";
import Table from "@/components/Table/Table.vue";
import { HttpClient } from '@/utils/http';
import { ElMessage } from "element-plus";
import { FormField } from "@/components/Dialog/FormField";

// 定义优惠券类型
interface CouponType {
  type_id: number;
  type_name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// 定义搜索参数
interface SearchParams {
  searchType?: string;
  searchText?: string;
  time?: [string, string];
}

// 定义分页信息
interface PageInfo {
  currentPage: number;
  pageSize: number;
  total: number;
}

// 定义表格列
interface TableColumn {
  label: string;
  prop: keyof CouponType;
  type: "default";
}

const http: HttpClient = inject("http") as HttpClient;

const dialogVisible = ref(false);
const dialogType = ref("");

// 对话框表单
const formFields: FormField<any>[] = [
  {
    type: "text",
    label: "优惠券类型名称",
    prop: "type_name",
    show: true,
    placeholder: "请输入优惠券类型名称",
    rules: [
      { required: true, message: "请输入优惠券类型名称", trigger: "blur" },
      {
        min: 2,
        max: 10,
        message: "长度至少为 2 到 10 个字符",
        trigger: "blur",
      },
    ],
  },
  {
    type: "textarea",
    label: "优惠券类型描述",
    prop: "description",
    show: true,
    placeholder: "请输入优惠券类型描述",
  },
];

// 搜索类型定义
const searchList = [
  {
    label: "优惠券类型名称",
    value: "type_name",
  },
  {
    label: "优惠券类型描述",
    value: "description",
  },
  {
    label: "优惠券类型创建时间",
    value: "created_at",
  },
];

// 示例数据
const tableData = ref<CouponType[]>([]);

// 表头定义
const columns: TableColumn[] = [
  {
    label: "优惠券类型名称",
    prop: "type_name",
    type: "default",
  },
  {
    label: "优惠券类型描述",
    prop: "description",
    type: "default",
  },
  {
    label: "优惠券类型创建时间",
    prop: "created_at",
    type: "default",
  },
];

// 分页信息
const page: PageInfo = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
});

// 勾选数据
const selectList = ref<CouponType[]>([]);

// 构造查询对象
const queryParams = ref<SearchParams>({});
const loading = ref(false); // 加载状态

// 编辑行的方法
const editRow = (_row: CouponType) => {
  dialogType.value = "edit";
  dialogVisible.value = true;
};

// 删除行的方法
const deleteRow = async (row: CouponType) => {
  try {
    await http.delete(`/coupon-types/${row.type_id}`).then(async (res) => {
      if (res.data.code === 200) {
        await getTableData();
        dialogVisible.value = false;
      }
    });
  } catch (e) {
    ElMessage.error("删除失败: " + e);
  }
};

// 删除所选行的方法
const delData = async () => {
  if (!selectList.value.length) {
    return ElMessage.warning("请先选择要删除的数据");
  }
  const ids = selectList.value.map((item) => item.type_id);
  try {
    await http.post("/coupon-types/batch", ids).then(async (res) => {
      if (res.data.code === 200) {
        ElMessage.success("删除成功");
        await getTableData();
        dialogVisible.value = false;
      }
    });
  } catch (e) {
    ElMessage.error("批量删除失败: " + e);
  }
};

// 新增行的方法
const addData = () => {
  dialogType.value = "add";
  dialogVisible.value = true;
};

// 监听搜索条件更新
const search = async (searchParams: SearchParams) => {
  if (!searchParams) {
    return ElMessage.warning("请先选择搜索条件");
  }
  if (searchParams.searchType && searchParams.searchText) {
    queryParams.value = {
      ...queryParams.value,
      [searchParams.searchType]: searchParams.searchText,
    };
  }
  if (searchParams.time && searchParams.time[0] && searchParams.time[1]) {
    const timeRange = `${searchParams.time[0]},${searchParams.time[1]}`;
    await getTableData(timeRange);
  } else {
    await getTableData();
  }
};

// 重置搜索数据
const reSet = async () => {
  queryParams.value = {};
  await getTableData();
};

// 监听选中数据更新
const updateSelection = (selectedRows: CouponType[]) => {
  selectList.value = selectedRows;
};

// 数据上传
const handleFormSubmit = async (data: CouponType) => {
  try {
    if (dialogType.value === "add") {
      await http.post("/coupon-types", data).then(async (res) => {
        if (res.data.code === 200) {
          ElMessage.success("添加成功");
          await getTableData();
          dialogVisible.value = false;
        }
      });
    } else if (dialogType.value === "edit") {
      await http.put("/coupon-types", data).then(async (res) => {
        if (res.data.code === 200) {
          ElMessage.success("更新完成");
          await getTableData();
          dialogVisible.value = false;
        }
      });
    }
  } catch (e) {
    ElMessage.error("提交失败: " + e);
    dialogVisible.value = false;
  }
};

// 获取数据
const getTableData = async (time?: string) => {
  loading.value = true;
  let params: {
    couponTypes: string;
    pageNum: number;
    pageSize: number;
    timeRange?: string; // 添加可选的 timeRange 属性
  } = {
    couponTypes:
      JSON.stringify(queryParams.value) === "{}"
        ? ""
        : JSON.stringify(queryParams.value),
    pageNum: page.currentPage,
    pageSize: page.pageSize,
  };

  if (time) {
    params = {
      ...params,
      timeRange: time,
    };
  }

  try {
    const response = await http.get("/coupon-types", { params });
    if (response.data.code === 200) {
      tableData.value = response.data.data.records;
      page.total = response.data.data.total;
    } else {
      tableData.value = [];
      page.total = 0;
    }
  } catch (e) {
    ElMessage.error("获取数据失败: " + e);
  } finally {
    loading.value = false;
  }
};

onBeforeMount(async () => {
  await getTableData();
});
</script>
