<template>
  <div class="coupon w-full h-full p-4 pb-32 overflow-y-auto">
    <div
      class="container w-full h-full mx-auto border-[.0625rem] rounded-md bg-white"
    >
      <Table
        :editButtonLabel="'编辑优惠券'"
        :columns="columns"
        :table-data="tableData"
        :search-list="searchList"
        :page="page"
        :add-button-label="'新增优惠券'"
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
interface Coupon {
  coupon_id: string;
  code: string;
  type_id: string;
  type_name?: string;
  discount_value: number;
  discount_point_value: number;
  start_date: string | Date;
  end_date: string | Date;
  usage_limit: number;
  used_count: number;
  coupon_status: number;
  min_purchase_amt: number;
  max_discount_amt: number;
  applicable_items: string;
  user_id: number;
  description: string;
  createTime: string;
  updateTime: string;
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
  prop: keyof Coupon;
  type: string;
  width?: string;
}

const http: HttpClient = inject("http") as HttpClient;

const dialogVisible = ref(false);
const dialogType = ref("");

// 对话框表单
const formFields = ref<FormField<any>[]>([
  {
    type: "select",
    label: "优惠券类型",
    prop: "type_name",
    placeholder: "请选择优惠券类型",
    group: "基本信息", // 添加 group 属性
    loading: false,
    show: true,
    rules: [{ required: true, message: "请选择优惠券类型", trigger: "blur" }],
    options: [],
    onFocus: async function (_value: any, field: FormField<any>) {
      field.loading = true;
      await http
        .get("/coupon-types/all")
        .then((res) => {
          const list = res.data.data;
          field.options = list.map((item: any) => {
            return {
              label: item.type_name,
              value: item.type_name,
              id: item.type_id,
            };
          });
        })
        .catch((e) => {
          if (e) {
            ElMessage.error("网络错误，请重试");
            field.options = [
              {
                label: "暂无数据",
                value: "",
                disabled: true,
              },
            ];
          }
        })
        .finally(() => {
          field.loading = false;
        });
    },
  },
  {
    type: "number",
    label: "优惠券面值(元)",
    prop: "discount_value",
    placeholder: "优惠券面值",
    show: true,
    min: 0,
    group: "基本信息",
    rules: [{ required: false, message: "请输入优惠券面值", trigger: "blur" }],
  },
  {
    type: "double",
    label: "折扣百分比",
    prop: "discount_point_value",
    tips: "小数乘100，换算打几折; 0.8表示8折",
    placeholder: "折扣百分比(%)",
    show: true,
    max: 1,
    min: 0,
    group: "基本信息",
    rules: [
      { required: false, message: "请输入折扣百分比(%)", trigger: "blur" },
    ],
  },
  {
    type: "datetime",
    label: "有效时间",
    prop: "start_date",
    placeholder: "请选择开始时间",
    show: true,
    rules: [{ required: true, message: "请选择开始时间", trigger: "blur" }],
    group: "使用规则", // 添加 group 属性
  },
  {
    type: "datetime",
    label: "过期时间",
    prop: "end_date",
    placeholder: "请选择结束时间",
    show: true,
    rules: [{ required: true, message: "请选择结束时间", trigger: "blur" }],
    group: "使用规则", // 添加 group 属性
  },
  {
    type: "number",
    label: "使用次数限制",
    prop: "usage_limit",
    placeholder: "使用次数限制",
    show: true,
    min: 0,
    rules: [{ required: true, message: "请输入使用次数限制", trigger: "blur" }],
    group: "使用规则", // 添加 group 属性
  },
  {
    type: "number",
    label: "已使用次数",
    prop: "used_count",
    placeholder: "已使用次数",
    show: true,
    min: 0,
    rules: [{ required: true, message: "请输入已使用次数", trigger: "blur" }],
    group: "使用规则", // 添加 group 属性
  },
  {
    type: "select",
    label: "优惠券状态",
    prop: "coupon_status",
    placeholder: "请选择优惠券状态",
    show: true,
    rules: [{ required: true, message: "请选择优惠券状态", trigger: "blur" }],
    options: [
      { label: "启用", value: 1 },
      { label: "禁用", value: 0 },
      // 其他状态...
    ],
    group: "使用规则", // 添加 group 属性
  },
  {
    type: "number",
    label: "最低消费金额",
    prop: "min_purchase_amt",
    tips: "最低消费金额为0时, 优惠券为无门槛立减券",
    placeholder: "最低消费金额",
    show: true,
    min: 0,
    rules: [
      { required: false, message: "请输入最低消费金额", trigger: "blur" },
    ],
    group: "商品与用户限制", // 添加 group 属性
  },
  {
    type: "number",
    label: "折扣上限金额",
    prop: "max_discount_amt",
    tips: "折扣上限金额为0时,折扣无上限",
    placeholder: "折扣上限金额",
    show: true,
    min: 0,
    rules: [
      { required: false, message: "请输入折扣上限金额", trigger: "blur" },
    ],
    group: "商品与用户限制", // 添加 group 属性
  },
  {
    type: "select",
    label: "适用商品",
    prop: "applicable_items",
    multiple: true,
    placeholder: "请选择适用商品",
    show: true,
    group: "商品与用户限制", // 添加 group 属性
    rules: [{ required: false, message: "请选择适用商品", trigger: "blur" }],
    options: [],
    onFocus: async function (_value: any, field: FormField<any>) {
      await http
        .get("/products/getProductPagination", {
          params: {
            pageNum: 1,
            pageSize: 10,
            product: "{}",
          },
        })
        .then((res) => {
          const list = res.data.data.list;
          field.options = list.map((item: any) => {
            return {
              label: item.product_name,
              value: item.product_id,
            };
          });
        });
    },
  },
  {
    type: "select",
    remote: true,
    label: "适用用户",
    prop: "user_id",
    placeholder: "请输入适用用户",
    show: true,
    rules: [{ required: false, message: "请输入适用用户", trigger: "blur" }],
    options: [],
    fetchOptions: function (query) {
      // 这里应该是一个异步请求来获取用户列表
      http.get("/users", { params: { query } }).then((response) => {
        this.options = response.data; // 更新 options
      });
    },
    group: "商品与用户限制", // 添加 group 属性
  },
  {
    type: "textarea",
    label: "优惠券描述",
    prop: "description",
    placeholder: "请输入优惠券描述",
    show: true,
    group: "描述", // 添加 group 属性
  },
]);

// 搜索类型定义
const searchList = [
  {
    label: "优惠券码",
    value: "code",
  },
  {
    label: "优惠券描述",
    value: "description",
  },
  {
    label: "优惠券创建时间",
    value: "created_at",
  },
];

// 示例数据
const tableData = ref<Coupon[]>([]);

// 表头定义
const columns: TableColumn[] = [
  {
    label: "优惠券码",
    prop: "code",
    type: "tag",
    width: "120px",
  },
  {
    label: "优惠券类型",
    prop: "type_name",
    type: "tag",
    width: "120px",
  },
  {
    label: "优惠券面值",
    prop: "discount_value",
    type: "tag",
    width: "120px",
  },
  {
    label: "生效时间",
    prop: "start_date",
    type: "default",
    width: "120px",
  },
  {
    label: "失效时间",
    prop: "end_date",
    type: "default",
    width: "120px",
  },
  {
    label: "使用次数限制",
    prop: "usage_limit",
    type: "default",
    width: "120px",
  },
  {
    label: "已使用次数",
    prop: "used_count",
    type: "default",
    width: "120px",
  },
  {
    label: "优惠券状态",
    prop: "coupon_status",
    type: "status",
    width: "120px",
  },
  {
    label: "最低消费金额(元)",
    prop: "min_purchase_amt",
    type: "default",
    width: "150px",
  },
  {
    label: "优惠券描述",
    prop: "description",
    type: "text",
    width: "200px",
  },
  {
    label: "创建时间",
    prop: "createTime",
    type: "default",
    width: "200px",
  },
  {
    label: "更新时间",
    prop: "updateTime",
    type: "default",
    width: "200px",
  },
];

// 分页信息
const page: PageInfo = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
});

// 勾选数据
const selectList = ref<Coupon[]>([]);
// 点击编辑的数据
const editData = ref<Coupon>();
// 构造查询对象
const queryParams = ref<SearchParams>({});
const loading = ref(false); // 加载状态

// 编辑行的方法
const editRow = (row: Coupon) => {
  dialogType.value = "edit";
  dialogVisible.value = true;
  editData.value = { ...row };
};

// 删除行的方法
const deleteRow = async (row: Coupon) => {
  try {
    await http.delete(`/coupon/${row.coupon_id}`).then(async (res) => {
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
  const ids = selectList.value.map((item) => item.coupon_id);
  try {
    await http.post("/coupon/batch", ids).then(async (res) => {
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
const updateSelection = (selectedRows: Coupon[]) => {
  selectList.value = selectedRows;
};

// 数据上传
const handleFormSubmit = async (data: Coupon) => {
  // 最低消费金额为空设为0
  if (!data.min_purchase_amt) {
    data.min_purchase_amt = 0;
  }
  // 获取type_id
  if (!data.type_id) {
    let option = formFields.value[0].options?.find((item) => {
      return item.value === data.type_name;
    });
    data.type_id = option?.id as string;
  }
  
  // 比较原始数据与新数据
const hasChanges = editData.value ? compareObjects(editData.value, data) : true;
  // 将适用商品数组转换为字符串
  data.applicable_items = JSON.stringify(data.applicable_items);

  try {
    data.start_date = convertToCustomFormat(data.start_date)
    data.end_date = convertToCustomFormat(data.end_date)
    if (dialogType.value === "add") {
      
      await http.post("/coupon", data).then(async (res) => {
        if (res.data.code === 200) {
          ElMessage.success("添加成功");
          await getTableData();
          dialogVisible.value = false;
        }
      });
    } else if (dialogType.value === "edit") {
      if (hasChanges) return ElMessage.warning("数据未发生改变");
      data.start_date = convertToCustomFormat2(data.start_date);
      data.end_date = convertToCustomFormat2(data.end_date);
      delete data.type_name;
      await http.put("/coupon", data).then(async (res) => {
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

const getTableData = async (time?: string) => {
  loading.value = true;
  tableData.value = [];
  let params: {
    coupon: string;
    pageNum: number;
    pageSize: number;
    timeRange?: string; // 添加可选的 timeRange 属性
  } = {
    coupon:
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
    const response = await http.get("/coupon", { params });
    if (response.data.code === 200) {
      const records = response.data.data.records;
      // 使用 Promise.all 等待所有异步请求完成
      await Promise.all(
        records.map(async (item: Coupon) => {
          try {
            const res = await http.get(`/coupon-types/${item.type_id}`);
            item.type_name = res.data.data.type_name;
          } catch (e) {
            // 处理单个请求的错误
            console.error(
              `Failed to fetch type_name for type_id ${item.type_id}:`,
              e
            );
            item.type_name = ""; // 或者设置一个默认值
          }
          // 格式化日期
          item.start_date = item.start_date.toString().split("T")[0];
          item.end_date = item.end_date.toString().split("T")[0];
          // 将applicable_items 字符串转换为数组
          item.applicable_items = JSON.parse(item.applicable_items);
        })
      );

      tableData.value = records;
      page.total = response.data.data.total;
      loading.value = false;
    } else {
      tableData.value = [];
      page.total = 0;
      loading.value = false;
    }
  } catch (e: any) {
    ElMessage.error("获取数据失败 :"+e);
    
    loading.value = false;
  }
};

onBeforeMount(async () => {
  await getTableData();
});

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  return a === b;
}
// 比较两个对象是否相同
function compareObjects(obj1: Record<string, any>, obj2: Record<string, any>): boolean {
  if (obj1 === null || obj1 === undefined || obj2 === null || obj2 === undefined) {
    return obj1 === obj2;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  const allKeys = new Set([...keys1, ...keys2]);

  for (const key of allKeys) {
    if (!deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

function convertToCustomFormat(dateString: string | number | Date) {
    // 创建一个 Date 对象
    const date = new Date(dateString);

    // 获取年、月、日、时、分、秒
    const year = date.getUTCFullYear();
    const month = ('0' + (date.getUTCMonth() + 1)).slice(-2); // 月份是从0开始的，所以加1
    const day = ('0' + date.getUTCDate()).slice(-2);
    const hours = ('0' + date.getUTCHours()).slice(-2);
    const minutes = ('0' + date.getUTCMinutes()).slice(-2);
    const seconds = ('0' + date.getUTCSeconds()).slice(-2);

    // 构造新的日期时间字符串
    const formattedString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    return formattedString;
}

function convertToCustomFormat2(isoString: string | number | Date) {
    // 创建一个 Date 对象
    const date = new Date(isoString);

    // 获取年、月、日、时、分、秒
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // 月份是从0开始的，所以加1
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);

    // 构造新的日期时间字符串
    const formattedString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    return formattedString;
}
</script>
