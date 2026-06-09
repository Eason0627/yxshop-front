<template>
  <div class="list w-full h-full p-4 pb-24">
    <div class="container flex flex-col w-full h-full mx-auto border-[1px] border-[--info-border-color] rounded-md overflow-y-auto bg-white">
      <Query
        :tableData="WarehouseList"
        :selectData="selectData"
        :delData="delData"
        @update:Query="updateQuery"
        @getData="getData"
        @search="search"
        @reSet="reSet"
      />
      <div ref="tableBox" class="tableBox flex-1">
        <el-table
          class="mt-[-1]"
          ref="multipleTableRef"
          :data="searchList.length ? searchList : WarehouseList"
          :empty-text="'暂无数据'"
          v-loading="loading"
          :height="tableBox?.scrollHeight"
          border
          @select="handleSelect"
          @select-all="handleSelectAll"
        >
          <el-table-column
            v-for="item in tableHeader"
            :key="item.prop"
            :type="item.type"
            :prop="item.prop"
            :label="item.label"
            :width="item.width"
            :show-overflow-tooltip="item.type === 'text'"
            :fixed="item.type === 'operation' ? 'right' : false"
            align="center"
          >
            <template v-if="item.type === 'tags'" #default="scope">
              <el-tag
                :type="
                  scope.row.status === SHOP_STATUS.ACTIVE
                    ? 'success'
                    : 'danger'
                "
              >
                {{ scope.row.status === SHOP_STATUS.ACTIVE ? '启用' : '禁用' }}
              </el-tag>
            </template>

            <template v-if="item.type === 'operation'" #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="editRow( scope.row)"
                plain
              >编辑</el-button>
              <el-button
                type="danger"
                size="small"
                @click="deleteRow(scope.row)"
              >删除</el-button>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="暂无数据" />
          </template>
        </el-table>
      </div>

      <div class="tableFoot flex justify-end p-4 border-t-[1px] border-[--info-border-color] overflow-y-auto">
        <el-pagination
          v-model:current-page="page.currentPage"
          v-model:page-size="page.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="page.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="self-end"
          layout="sizes, total, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <Dialog
      :dialogVisible="dialogVisible"
      :dialogType="dialogType"
      :warehouse="warehouse"
      @getData="getData"
      @update:Dialog="updateDialog"
    >
    </Dialog>
  </div>
</template>


<script setup lang="ts">
import { ref, reactive, inject, markRaw, onMounted, onBeforeMount } from "vue";
import { SHOP_STATUS } from '@/constants/status';
import { ElMessage, ElMessageBox, ElTable } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import { HttpClient, HttpResponse } from '@/utils/http';
import  Warehouse  from "@/model/Warehouse";
import  User  from "@/model/User";
import Query from "./Query.vue";
import Dialog from "./Dialog.vue";

const http: HttpClient = inject("http") as HttpClient;
const loading = ref(false);
const dialogVisible = ref(false);
const dialogType = ref("");
  //获取当前用户信息
  const userInfo = JSON.parse(localStorage.getItem("user") || "{}") as User;
  
const warehouse = ref<Warehouse>({
  warehouse_id: "",
  warehouse_name: "",
  user_id: userInfo.id, // 新增 user_id 属性以匹配 Warehouse 类型
  address: "",
  contact_info: "",
  total_capacity: 0,
  current_capacity: 0,
  createTime: "",
  updateTime: "",
  status: "Active",
});

const WarehouseList = ref<Warehouse[]>([]);
const searchList = ref<Warehouse[]>([]);
const selectData = ref<any[]>([]);
const page = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
});

// 构建查询参数对象
const params: Record<string, any> = {};
const tableBox = ref<HTMLElement>();
const multipleTableRef = ref<InstanceType<typeof ElTable>>();

const tableHeader = [
  { type: "selection", width: "55" },
  { label: "仓库ID", prop: "warehouse_id", type: "default" },
  { label: "仓库名称", prop: "warehouse_name", type: "default" },
  { label: "仓库地址", prop: "address", type: "text" },
  { label: "联系信息", prop: "contact_info", type: "text" },
  { label: "总容量", prop: "total_capacity", type: "default" },
  { label: "当前容量", prop: "current_capacity", type: "default" },
  { label: "创建时间", prop: "createTime", type: "default" },
  { label: "更新时间", prop: "updateTime", type: "default" },
  { label: "状态", prop: "status", type: "tags" },
  { label: "操作", prop: "operation", width: "160", type: "operation" },
];

const updateDialog = (formData: Warehouse | undefined, flag?: boolean) => {
  if (flag !== undefined) dialogVisible.value = flag;
  if (formData !== undefined) warehouse.value = { ...formData };
};

const updateQuery = (formData?: Warehouse, flag?: boolean, type?: string) => {
  if (formData !== undefined) warehouse.value = { ...formData };
  if (flag !== undefined) dialogVisible.value = flag;
  if (type !== undefined) dialogType.value = type;
};

const search = async (key?: string, value?: string) => {
  page.currentPage = 1;
  await getData(key, value);
};

const reSet = async () => {
  searchList.value = [];
  delete params.keyword;
  await getData();
};

// 由于 index 参数未被使用，将其移除，解决未使用声明变量的问题
const editRow = (row: Warehouse) => {
  dialogVisible.value = true;
  dialogType.value = "edit";
  warehouse.value = { ...row };
};

const deleteRow = async ( row: Warehouse) => {
  ElMessageBox.confirm("确认删除所选仓库？(无法恢复！)", "删除警告", {
    type: "warning",
    icon: markRaw(Delete),
  })
    .then(async () => {
      await delWarehouses([row.warehouse_id]);
    })
    .catch(() => {});
};

const handleSelect = (selection: any[]) => {
  selectData.value = selection;
};

const handleSelectAll = (selection: any[]) => {
  selectData.value = selection;
};

const delData = async () => {
  if (selectData.value.length === 0) {
    ElMessage.warning("请选择要删除的数据");
    return;
  }
  ElMessageBox.confirm("确认删除所选仓库？(无法恢复！)", "删除警告", {
    type: "warning",
    icon: markRaw(Delete),
  })
    .then(async () => {
      const selectId = selectData.value.map((item: Warehouse) => item.warehouse_id);
      await delWarehouses(selectId);
      selectData.value = [];
    })
    .catch(() => {});
};

const handleCurrentChange = async (val: number) => {
  page.currentPage = val;
  await getData();
};

const handleSizeChange = async (val: number) => {
  page.pageSize = val;
  page.currentPage = 1;
  await getData();
};

const getData = async (key?: string, value?: string) => {
  loading.value = true;
  //判断是否为管理员
  params.pageNum = page.currentPage;
  params.pageSize = page.pageSize;
  if (userInfo.role === "Admin") {
    // 如果是管理员，不携带user_id，并且如果key和value都存在，才添加到查询参数中
    if (key && value) {
      params.keyword = value; // 确保 key 是 Warehouse 类型的属性
    }
  }
  //如果不是管理员，必须要携带user_id
  else {
    params.user_id = userInfo.id; // 确保 user_id 始终存在，与 Warehouse 类型匹配
    if (key && value) {
      params.keyword = value; // 确保 key 是 Warehouse 类型的属性
    }
  }
  try {
    const res: HttpResponse<any> = await http.get("/warehouses/getWarehouse", {
      params
    });

    if (res.data?.data?.list) {
      const list = res.data.data.list || [];
      const total = res.data.data.total || 0;

      page.total = Number(total);
      WarehouseList.value = list;
      searchList.value = [];
    }
  } catch (error: any) {
    ElMessage.error(error.message || "获取数据失败");
  } finally {
    loading.value = false;
  }
};

const delWarehouses = async (ids: string[]) => {
  try {
    const res = await http.post("/warehouses/batch", ids);
    if (res.data.code == 200) {
      ElMessage.success("删除仓库成功！");
      await getData();
    }
  } catch (e: any) {
    ElMessage.error("删除失败！" + e.message);
  }
};

onBeforeMount(async () => {

  await getData();
});

onMounted(() => {
  
});
</script>