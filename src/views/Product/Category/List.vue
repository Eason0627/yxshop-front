<template>
  <div class="list w-full h-full p-4 pb-24">
    <div
      class="container flex flex-col w-full h-full mx-auto border-[1px] border-[--info-border-color] rounded-md overflow-y-auto bg-white"
    >
      <Query
        :tableData="categoryList"
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
          :data="searchList.length ? searchList : categoryList"
          :empty-text="'暂无数据'"
          v-loading="loading"
          :height="tableBox?.scrollHeight"
          border
          @select="handleSelect"
          @select-all="handleSelectAll"
        >
          <el-table-column
            type="selection"
            width="55"
          />
          <el-table-column
            label="分类ID"
            prop="category_id"
            align="center"
          />
          <el-table-column
            label="店铺ID"
            prop="shop_id"
            align="center"
          />
          <el-table-column
            label="分类名称"
            prop="category_name"
            align="center"
          />
          <el-table-column
            label="分类描述"
            prop="description"
            align="center"
            show-overflow-tooltip
          />
          <el-table-column
            label="父分类"
            prop="parent_category_id"
            align="center"
          >
            <template #default="scope">
              {{ getParentCategoryName(scope.row.parent_category_id) }}
            </template>
          </el-table-column>
          <el-table-column
            label="分类图片"
            prop="image_url"
            width="120"
            align="center"
          >
            <template #default="scope">
              <el-image
                v-if="scope.row.image_url"
                style="width: 50px; height: 50px"
                :src="scope.row.image_url"
                :preview-src-list="[scope.row.image_url]"
                fit="cover"
              />
              <span v-else>暂无图片</span>
            </template>
          </el-table-column>
          <el-table-column
            label="创建时间"
            prop="createTime"
            align="center"
          >
            <template #default="scope">
              {{ formatDate(scope.row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column
            label="更新时间"
            prop="updateTime"
            align="center"
          >
            <template #default="scope">
              {{ formatDate(scope.row.updateTime) }}
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            prop="operation"
            width="160"
            align="center"
            fixed="right"
          >
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="editRow(scope.$index, scope.row)"
                plain
                >编辑</el-button
              >
              <el-button
                type="danger"
                size="small"
                @click="deleteRow(scope.$index, scope.row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无数据"></el-empty>
          </template>
        </el-table>
      </div>
      <div
        class="tableFoot flex justify-end p-4 border-t-[1px] border-[--info-border-color] overflow-y-auto"
      >
        <el-pagination
          v-model:current-page="page.currentPage"
          v-model:page-size="page.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="page.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="self-end"
          layout="sizes, total, prev, pager, next, jumper "
          background
        >
        </el-pagination>
      </div>
    </div>
    <Dialog
      :dialogVisible="dialogVisible"
      :dialogType="dialogType as 'add' | 'edit' | undefined"
      :categoryData="categoryData"
      @getData="getData"
      @update:Dialog="updateDialog"
    ></Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, inject, onMounted, markRaw, onBeforeMount } from "vue";
import { ElMessage, ElMessageBox, ElTable } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import { HttpClient, HttpResponse } from '@/utils/http';
import ProductCategory from "@/model/ProductCategory";
import User from "@/model/User";
import Query from "./Query.vue";
import Dialog from "./Dialog.vue";
import Shop from "@/model/Shop";

// 父级分类ID到中文名称的映射
const parentCategoryMap: Record<string, string> = {
  '1': '电子产品',
  '2': '服装服饰',
  '3': '家居用品',
  '4': '食品饮料',
  '5': '美妆个护',
  '6': '运动户外',
  '7': '图书音像',
  '8': '母婴用品',
  '9': '汽车配件',
  '10': '办公用品'
};

// 根据ID获取父级分类中文名称
const getParentCategoryName = (id: string) => {
  return parentCategoryMap[id] || id; // 如果找不到映射，返回原始ID
};

const http: HttpClient = inject("http") as HttpClient;
const user: User = JSON.parse(localStorage.getItem("user") || "") as User;
const loading = ref(false);
const dialogVisible = ref(false);
const dialogType = ref("");
const categoryData = ref<ProductCategory>({
  category_id: "",
  shop_id: "",
  category_name: "",
  description: "",
  parent_category_id: "",
  image_url: "",
  createTime: "",
  updateTime: "",
});

const currentShop = JSON.parse(localStorage.getItem("currentShop") || '{}') as Shop;
const requestJSON: Record<string, any> = {};



// 其余代码保持不变...
const categoryList = ref<ProductCategory[]>([]);
let searchList = ref<ProductCategory[]>([]);
const selectData = ref<any>([]);
const page = reactive({
  pageNum: 1,
  pageSize: 10,
  currentPage: 1,
  total: 0,
});
const tableBox = ref<HTMLElement>();
const multipleTableRef = ref<InstanceType<typeof ElTable>>();

// 其余方法保持不变...
const updateDialog = (formData: ProductCategory | undefined, flag?: boolean) => {
  if (flag !== undefined) {
    dialogVisible.value = flag;
  }
  if (formData !== undefined) {
    categoryData.value = { ...formData } as ProductCategory;
  }
};

const updateQuery = (formData?: ProductCategory, flag?: boolean, type?: string) => {
  if (formData !== undefined) {
    categoryData.value = { ...formData } as ProductCategory;
  }
  if (flag !== undefined) {
    dialogVisible.value = flag;
  }
  if (type !== undefined) {
    dialogType.value = type;
  }
};

const search = async (key?: string, value?: string, startTime?: string, endTime?: string) => {
  page.pageNum = 1;
  await getData(key, value, startTime, endTime);
};

const reSet = async () => {
  searchList.value = [];
  await getData();
};

const editRow = (_index: number, row: ProductCategory) => {
  dialogVisible.value = true;
  dialogType.value = "edit";
  categoryData.value = { ...row };
};

const deleteRow = async (_index: number, row: ProductCategory) => {
  ElMessageBox.confirm("确认删除该分类？(无法恢复！)", "删除警告", {
    type: "warning",
    icon: markRaw(Delete),
  })
    .then(async () => {
      await delCategories([row.category_id]);
    })
    .catch(() => {
      // catch error
    });
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
  ElMessageBox.confirm("确认删除所选分类？(无法恢复！)", "删除警告", {
    type: "warning",
    icon: markRaw(Delete),
  })
    .then(async () => {
      const selectId = selectData.value.map((item: ProductCategory) => {
        return item.category_id;
      });
      await delCategories(selectId);
      selectData.value = [];
    })
    .catch(() => {
      // catch error
    });
};

async function handleCurrentChange(val: number) {
  page.pageNum = val;
  await getData();
}

async function handleSizeChange(val: number) {
  page.currentPage = val;
  await getData();
}

function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString();
}

function sortByCreateTime(list: ProductCategory[]): ProductCategory[] {
  return [...list].sort((a: ProductCategory, b: ProductCategory) => {
    const timeA = a.createTime ? new Date(a.createTime).getTime() : 0;
    const timeB = b.createTime ? new Date(b.createTime).getTime() : 0;
    return timeB - timeA;
  });
}

const getData = async (key?: string, value?: string, startTime?: string, endTime?: string) => {
  loading.value = true;
  if(user.role === "ShopOwner") {
    requestJSON.shop_id = currentShop.shop_id;
  }
  
  if (key && value) {
    requestJSON[key] = value;
  }
  
  if (startTime && endTime) {
    requestJSON.start_time = startTime;
    requestJSON.end_time = endTime;
  }
  
  await http
    .get("/category/getCategoryPagination", {
      params: {
        pageNum: page.pageNum,
        pageSize: page.pageSize,
        category: JSON.stringify(requestJSON),
      },
    })
    .then(async (res: HttpResponse<any>) => {
      if (!res.data?.data?.list) {
        throw new Error("API返回数据结构异常");
      }

      const list = res.data.data.list || [];
      const total = res.data.data.total || "0";

      page.total = parseInt(total);
      categoryList.value = sortByCreateTime(list);
    })
    .catch((error) => {
      console.error("获取分类数据失败:", error);
      ElMessage.error(error.message || "获取分类数据失败");
    })
    .finally(() => {
      loading.value = false;
    });
};

const delCategories = async (list: any) => {
  await http
    .post("/category/delCategoryByIds", list)
    .then((res) => {
      if (res.data.code == 200) {
        ElMessage.success("删除分类成功！");
        getData();
      }
    })
    .catch((e) => {
      ElMessage.error("删除失败！" + e.message);
    });
};

onBeforeMount(async () => {
  const user: User = JSON.parse(localStorage.getItem("user") || "") as User;
  const role = user.role;
  switch (role) {
    case "Admin":
      await getData();
      break;
    case "ShopOwner":
      requestJSON.shop_id = currentShop.shop_id;
      await getData();
      break;
    case "Customer":
      break;
  }
});

onMounted(() => {});
</script>

<style scoped>
.list {
  background-color: #f5f7fa;
}
</style>

