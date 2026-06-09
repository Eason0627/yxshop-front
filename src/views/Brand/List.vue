<template>
  <div class="list w-full h-full p-4 pb-24">
    <div
      class="container flex flex-col w-full h-full mx-auto border-[1px] border-[--info-border-color] rounded-md overflow-y-auto bg-white"
    >
      <Query
        :tableData="brandList"
        :selectData="selectData"
        :delData="delData"
        @update:Query="updateQuery"
        @getData="getData"
        @search="search"
        @reSet="reSet"
      ></Query>
      <div ref="tableBox" class="tableBox flex-1">
        <el-table
          class="mt-[-1]"
          ref="multipleTableRef"
          :data="searchList.length !== 0 ? searchList : brandList"
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
            <template v-if="item.type === 'image'" #default="scope">
              <el-image
                :src="scope.row.logo_url"
                :preview-src-list="[scope.row.logo_url]"
                fit="cover"
                style="width: 64px; height: 64px"
              />
            </template>
            <template v-else-if="item.type === 'user'" #default="scope">
              {{ scope.row.owner_user?.nick_name || '暂无' }}
            </template>
            <template v-else-if="item.type === 'date'" #default="scope">
              {{ scope.row.status === BRAND_STATUS.ACTIVE ? scope.row.createTime : '待审核' }}
            </template>
            <template v-else-if="item.type === 'tags'" #default="scope">
              <el-tag :type="BRAND_STATUS_TAG[scope.row.status] || 'info'">
                {{ BRAND_STATUS_LABEL[scope.row.status] || scope.row.status }}
              </el-tag>
            </template>
            <template v-else-if="item.type === 'operation'" #default="scope">
              <el-button type="primary" size="small" @click="editRow(getIndex(scope.row), scope.row)" plain>编辑</el-button>
              <el-button type="danger" size="small" @click="deleteRow(getIndex(scope.row), scope.row)">删除</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无数据"></el-empty>
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
          layout="sizes, total, prev, pager, next, jumper "
          background
        />
      </div>
    </div>
    <Dialog
      :dialogVisible="dialogVisible"
      :dialogType="dialogType"
      :brand="brand"
      @getData="getData"
      @update:Dialog="updateDialog"
    ></Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, inject,  onBeforeMount, markRaw } from "vue";
import { ElMessage, ElMessageBox, ElTable } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import type { HttpClient } from '@/utils/http';
import { BRAND_STATUS, BRAND_STATUS_LABEL, BRAND_STATUS_TAG } from '@/constants/status';
import User, { Role } from "@/model/User";
import Brand from "@/model/Brand";
import Query from "./Query.vue";
import Dialog from "./Dialog.vue";
// import { log } from "console";

const http: HttpClient = inject("http") as HttpClient;
const storedUser = localStorage.getItem("user");
const user: User | null = storedUser ? JSON.parse(storedUser) as User : null;

const currentShop = localStorage.getItem("currentShop");
const currentShopId = currentShop ? JSON.parse(currentShop) : null;

const loading = ref(false);
const dialogVisible = ref(false);
const dialogType = ref("");
const brand = ref<Brand>({
  brand_id: "",
  shop_id: "",
  brand_name: "",
  description: "",
  logo_url: "",
});

// 请求参数对象，添加 shop_id
const requestJSON = reactive<Partial<Brand>>({
  shop_id: currentShopId?.shop_id// 假设 User 模型中有 shop_id 字段
});

const page = reactive({
  pageNum: 1,
  pageSize: 10,
  currentPage: 1,
  total: 0,
});

const brandList = ref<Brand[]>([]);
const searchList = ref<Brand[]>([]);
const selectData = ref<Brand[]>([]);
const tableBox = ref<HTMLElement | null>(null);

// 表格列配置
const tableHeader = [
  {
    type: "selection",
    width: "55",
  },
  {
    label: "品牌ID",
    prop: "brand_id",
    type: "default",
  },
  {
    label: "店铺ID",
    prop: "shop_id",
    type: "default",
  },
  {
    label: "品牌名称",
    prop: "brand_name",
    type: "default",
  },
  {
    label: "品牌描述",
    prop: "description",
    type: "text",
  },
  {
    label: "品牌Logo",
    prop: "logo_url",
    type: "image",
  },
  {
    label: "状态",
    prop: "status",
    type: "tags",
  },
  {
    label: "操作",
    prop: "operation",
    width: "160",
    type: "operation",
  },
];


// 获取数据
const getData = async () => {
  loading.value = true;
  try {
    const response = await http.get("/brand/getBrandPagination", {
      params: {
        pageNum: page.pageNum,
        pageSize: page.pageSize,
        brand: JSON.stringify(requestJSON) // 参数名改为brand，与后端一致
      }
    });

    if (response.data.code === 200) {
      // 根据后端返回数据结构调整
      brandList.value = response.data.data.list || response.data.data.records || [];
      // 确保转换为数字
      page.total = Number(response.data.data.total) || 0;
    } else {
      ElMessage.warning(response.data.message || "获取品牌数据失败");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "请求品牌数据出错");
  } finally {
    loading.value = false;
  }
};


// 分页
async function handleCurrentChange(val: number) {
  page.pageNum = val;
  await getData();
}

async function handleSizeChange(val: number) {
  // 修正为 page.pageSize
  page.pageSize = val; 
  await getData();
}


// 对话框数据更新
const updateDialog = (formData: Brand | undefined, flag?: boolean) => {
  if (flag !== undefined) {
    dialogVisible.value = flag;
  }
  if (formData !== undefined) {
    brand.value = { ...formData };
  }
};

// 搜索栏数据更新
const updateQuery = (formData?: Brand, flag?: boolean, type?: string) => {
  if (formData !== undefined) {
    brand.value = { ...formData };
  }
  if (flag !== undefined) {
    dialogVisible.value = flag;
  }
  if (type !== undefined) {
    dialogType.value = type;
  }
};

// 搜索功能
const search = (key?: string, value?: string) => {
  if (!key || !value) {
    searchList.value = [];
    return;
  }

  searchList.value = brandList.value.filter((item: Brand) => {
    const itemValue = item[key as keyof Brand];
    return String(itemValue).toLowerCase().includes(value.toLowerCase());
  });
};

// 重置搜索
const reSet = async () => {
  searchList.value = [];
  await getData();
};

// 编辑行
const editRow = (_index: number, row: Brand) => {
  dialogVisible.value = true;
  dialogType.value = "edit";
  brand.value = { ...row };
};

// 删除行
const deleteRow = async (_index: number, row: Brand) => {
  try {
    await ElMessageBox.confirm("确认删除该品牌？(无法恢复)", "删除警告", {
      type: "warning",
      icon: markRaw(Delete),
    });
    
    const response = await http.delete(`/brand/delete/${row.brand_id}`);
    if (response.data.code === 200) {
      ElMessage.success("删除成功");
      await getData();
    }
  } catch (error) {
    // 用户取消删除不做处理
  }
};

// 批量删除
const delData = async () => {
  if (selectData.value.length === 0) {
    ElMessage.warning("请选择要删除的品牌");
    return;
  }

  try {
    await ElMessageBox.confirm("确认删除所选品牌？(无法恢复)", "删除警告", {
      type: "warning",
      icon: markRaw(Delete),
    });

    const ids = selectData.value.map(item => item.brand_id);
    const response = await http.post("/brand/batchDelete", ids);
    
    if (response.data.code === 200) {
      ElMessage.success("批量删除成功");
      selectData.value = [];
      await getData();
    }
  } catch (error) {
    // 用户取消删除不做处理
  }
};

// 选择行
const handleSelect = (selection: Brand[]) => {
  selectData.value = selection;
};

// 全选
const handleSelectAll = (selection: Brand[]) => {
  selectData.value = selection;
};





onBeforeMount(async () => {

  if (user && user.role) {
    if (([Role.Admin, Role.ShopOwner] as string[]).includes(user.role)) {

      await getData();

    }
  }
});
// 添加一个辅助函数来获取索引
const getIndex = (row: Brand): number => {
  const list = brandList.value;
  return list.indexOf(row);
};
</script>

<style lang="scss" scoped></style>



