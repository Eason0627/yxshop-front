<template>
  <div class="list w-full h-full p-3 pb-24">
    <div
      class="content flex flex-col w-full h-full border-[1px] border-[--info-border-color] rounded-md overflow-y-auto bg-white"
    >
      <div class="tools p-4 mb-4 flex justify-between">
        <div class="search mt-2 flex flex-nowrap justify-start items-center">
          <p class="text-left">搜索商品：</p>
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
              start-placeholder="创建时间"
              end-placeholder="更新时间"
              style="width: 300px"
            />
          </div>
          <div class="option">
            <el-button type="primary" class="ml-2" @click="handleGetProductList"
              >搜索</el-button
            >
            <el-button type="danger" plain @click="resetSearch">清除</el-button>
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
        </div>
      </div>
      <div class="tableBox flex-1">
        <el-table
          class="border-t-[1px] border-[--info-border-color]"
          ref="multipleTableRef"
          :data="tableData"
          style="width: 100%"
          height="600"
          max-height="600"
          :cell-style="{ textAlign: 'center' }"
          :header-cell-style="{ 'text-align': 'center' }"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />

          <el-table-column label="商品图片" width="88">
            <template #default="scope">
              <el-image
                :src="JSON.parse(scope.row.main_image)[0]"
                :zoom-rate="1.2"
                :max-scale="7"
                :min-scale="0.2"
                preview-teleported
                :preview-src-list="JSON.parse(scope.row.main_image)"
                fit="cover"
                style="width: 64px; height: 64px"
              />
            </template>
          </el-table-column>

          <el-table-column
            property="product_name"
            label="商品名称"
            width="120"
          />

          <el-table-column property="brand_name" label="品牌" width="120" />

          <el-table-column property="price" label="价格/元" width="120" />

          <el-table-column
            property="cost_price"
            label="成本价格/元"
            width="120"
          />

          <el-table-column property="stock_quantity" label="库存" width="120" />

          <el-table-column
            prop="updateTime"
            label="修改日期"
            sortable
            width="160"
          >
            <template #default="scope">{{ scope.row.updateTime }}</template>
          </el-table-column>

          <el-table-column label="分类" width="120" sortable>
            <template #default="{ row }">
              {{ row.category_name }}
            </template>
          </el-table-column>

          <el-table-column
            property="product_status"
            label="上/下架"
            width="120"
            sortable
          >
            <template #default="scope">
              <el-popconfirm
                width="220"
                confirm-button-text="确定"
                cancel-button-text="取消"
                :icon="InfoFilled"
                icon-color="#626AEF"
                title="确定上架/下架商品"
                @confirm="setProductOnline(scope.$index, scope.row)"
              >
                <template #reference>
                  <el-button
                    size="small"
                    :type="buttonType(scope.row)"
                    @click=""
                    >{{ scope.row.product_status }}</el-button
                  >
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>

          <el-table-column
            show-overflow-tooltip
            property="description"
            label="描述"
          />

          <!-- 添加操作列 -->
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="scope">
              <el-button
                size="small"
                type="primary"
                @click="editRow(scope.$index, scope.row)"
                >编辑</el-button
              >
              <el-button
                size="small"
                type="danger"
                @click="deleteRow(scope.$index, scope.row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div
        class="tableFoot flex justify-end p-4 border-t-[1px] border-[--info-border-color] overflow-y-auto"
      >
        <el-pagination
          background
          layout="sizes, total, prev, pager, next, jumper "
          @size-change="handleSizeChange"
          v-model:current-page="page.currentPage"
          :page-sizes="[10, 20, 30, 50]"
          v-model:page-size="page.pageSize"
          :total="page.total"
          @current-change="handleCurrentChange"
          class="self-end"
        >
        </el-pagination>
      </div>
    </div>

    <!-- 修改弹窗 -->
    <!-- 原调用方式 -->
    <UpdateDialog
      v-model="dialogVisible"
      :product-id="formData?.product_id || ''"
      @saved="handleGetProductList" />

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, inject, onMounted, Ref, markRaw } from "vue";
import { HttpClient, HttpResponse } from '@/utils/http';

// @ts-ignore
import UpdateDialog from "./UpdateDialog.vue";
import { ElMessage, ElMessageBox, ElNotification, ElTable } from "element-plus";
import { Delete, InfoFilled } from "@element-plus/icons-vue";
import { userShopStore } from "@/store/index";
import Product from "@/model/Product";
import User from "@/model/User";

// import form from "element-plus/es/components/form/index.mjs";

// 获取 http
const http: HttpClient = inject("http") as HttpClient;

// 修改弹出窗口控制
const dialogVisible = ref(false);

//删除弹窗控制
const deleteDialogVisible = ref(false);
const indexData: any = ref("");
const rowData: any = ref("");

//定义修改表单对象
interface ProductData {
  product_id: string;                // 产品ID
  product_name: string;              // 产品名称
  description: string;               // 产品描述
  brand_id: string;                  // 品牌ID
  brand_name: string;                // 品牌名称
  shop_id: string;                   // 店铺ID
  shop_name: string;                 // 店铺名称
  origin: string;                    // 产地
  material: string;                  // 材质
  size: string;                      // 尺寸
  color: string;                     // 颜色
  weight: number;                    // 重量(克)
  volume: number;                    // 体积
  packaging_details: string;         // 包装信息("三无产品")
  warranty_info: string;             // 质保信息("5年质保")
  production_date: number;           // 生产日期(时间戳格式)
  expiration_date: number;           // 过期日期(时间戳格式)
  category_id: string;               // 分类ID
  category_name: string;             // 分类名称(当前为"文具")
  main_image: string;                // 主图URL
  additional_images: string;          // 附加图片(JSON字符串数组)
  details_images: string;            // 详情图片(JSON字符串数组)
  tags: string;                      // 标签(JSON字符串数组)
  product_status: boolean;           // 产品状态
  price: number;                     // 售价
  cost_price: number;                // 成本价
  stock_quantity: number;            // 库存数量
  reorder_threshold: number;         // 补货阈值
  sold_quantity: number;             // 已售数量
  review_count: number;              // 评价数量
  average_rating: number;            // 平均评分
  promotion_details: string;         // 促销信息("满500减100元")
  shipping_fee: number;              // 运费
  sales_status: string;              // 销售状态("Available")
  warehouse_id: string;              // 仓库ID
  warehouse_name: string;            // 仓库名称("胡益铭霸仓")
  safety_stock: number;              // 安全库存
  last_restock_date: string;         // 最后补货日期("YYYY-MM-DD HH:mm:ss")
  restock_threshold: number;         // 补货阈值
  createTime?: string;               // 创建时间(可选)
  updateTime?: string;               // 更新时间(可选)
}

// interface Form {
//   product_info: Partial<ProductData>;
//   product_sales: Partial<ProductData>;
//   inventory: Partial<ProductData>;
// }


// 由于 ProductData 接口有很多必填属性，这里先使用 Partial 类型创建一个可选属性的对象
const formData = ref<Partial<ProductData>>({});

//修改弹窗以及获取商品信息
function editRow(index: any, row: any) {
  dialogVisible.value = true;
  indexData.value = index;
  rowData.value = row;
  http.get(`/products/${rowData.value.product_id}`)
  .then((response: HttpResponse) => {
    const data = response.data.data as ProductData;
// 由于 formData 是 ref 对象，需要使用 .value 来修改其值
    formData.value = data;
    // const formData = JSON.stringify(form);
  })
  .catch(error => {
    console.error('Error fetching product data:', error);
  });
}


const searchText = ref("");
const searchType = ref("");

const time = ref("");

const searchList = [
  {
    value: "product_name",
    label: "商品名称",
  },
  {
    value: "product_id",
    label: "商品id",
  },
  {
    value: "brand_id",
    label: "商品品牌",
  },
  {
    value: "shop_id",
    label: "店铺id",
  },
  {
    value: "category_name",
    label: "分类",
  },
  {
    value: "sales_status",
    label: "销售状态",
  },
];


// 示例数据
let tableData: Ref<Product[]> = ref([] as Product[]);


const multipleTableRef = ref<InstanceType<typeof ElTable>>();
const selectData = ref<any>([]);
//选择列表
const handleSelectionChange = (val: any[]) => {
  selectData.value = val;
};

// 定义请求体
interface ProductType {
  [key: string]: string; // 允许任何字符串作为键，并且值也是字符串
}
// const product = ref<ProductType>({})
let product: ProductType = {}; // 明确声明 product 为 ProductType 类型
// 构建查询参数对象
const requestJSON: Record<string, any> = {};
// const requestJSON = {};
const page = reactive({
  pageNum: 1,
  pageSize: 10,
  currentPage: 1,
  total: 0,
});
//清空搜索条件
function resetSearch() {
  searchText.value = "";
  searchType.value = "";
  // startTime.value = "";
  // endTime.value = "";
}

// 获取当前店铺��数据
const ShopInfo = userShopStore();


//获取表格数据
const handleGetProductList = async () => {
  // const user = JSON.parse(localStorage.getItem("user") || "");
  const user = JSON.parse(localStorage.getItem("user")|| "") as User ;
  if (user.role == "Admin") {
    Object.keys(product).forEach((key) => delete product[key]); //清空对象
    if (searchType.value != "" && searchText.value != "") {
      product[searchType.value] = searchText.value; //赋值对象
    }
    await http
      .get("/products/getProductPagination", {
        params: {
          pageNum: page.pageNum,
          pageSize: page.pageSize,
          product: JSON.stringify(product),
        },
      })
      .then((res: HttpResponse) => {
        if (res.data.data.total == 0) {
          ElMessage({
            message: `您没有该店${ShopInfo.getCurrentShop.shop_name}的相关商品`,
            type: "warning",
            center: true,
          });
          return;
        }
        page.total = parseInt(res.data.data.total);
        tableData.value = res.data.data.list;
        tableData.value.forEach((item: Product) => {
          item.tags = JSON.parse(item.tags || "");
          // item.updateTime = item.updateTime.join("-");
          item.product_status = item.product_status ? "已上架" : "已下架";
        });
      });
  }
  if (user.role == "ShopOwner") {
    Object.keys(requestJSON).forEach((key) => delete requestJSON[key]); //清空对象

    if (searchType.value != "" && searchText.value != "") {
      requestJSON[searchType.value] = searchText.value; //赋值对象
    }
    if (!ShopInfo.getCurrentShop.shop_id) {
      ElNotification({
        title: "Error",
        message: "亲，没有绑定店铺，无法查询",
        type: "error",
      });
      return;
    }
    requestJSON["shop_id"] = ShopInfo.getCurrentShop.shop_id; //赋值对象
    await http
      .get("/products/getProductPagination", {
        params: {
          pageNum: page.pageNum,
          pageSize: page.pageSize,
          product: JSON.stringify(requestJSON),
        },
      })
      .then((res: HttpResponse) => {
        if (res.data.data.total == 0) {
          ElMessage({
            message: `您没有该店${ShopInfo.getCurrentShop.shop_name}的相关商品`,
            type: "warning",
            center: true,
          });
          return;
        }
        page.total = Number(res.data.data.total);
        tableData.value = res.data.data.list;
        tableData.value.forEach((item: Product) => {
          item.tags = JSON.parse(item.tags || "");
          // item.updateTime = item.updateTime.join("-");
          item.product_status = item.product_status ? "已上架" : "已下架";
        });
      });
  }
};

// 上下架计算属性
function buttonType(row: any) {
  return row.product_status === "已上架" ? "success" : "info";
}

//修改商品上下架
const setProductOnline = (index: any, row: any) => {
  tableData.value[index].product_status =
    row.product_status == "已上架" ? "已下架" : "已上架";
  http.put(`/products/${row.product_id}/status`).then((res: HttpResponse) => {
    ElMessage({
      message: res.data.msg,
      type: "success",
    });
  });
};

//删除单个商品数据
const deleteRow = (_index: any, row: any) => {
  // 在实际应用中，你可能需要从 data 数组中移除该行
  tableData.value.splice(indexData, 1);
  ElMessageBox.confirm("确认删除数据？(无法恢复！)", "删除警告", {
    type: "warning",
    icon: markRaw(Delete),
  }).then(() => {
    http
      .delete(`/products/${row.product_id}`)
      .then((res: HttpResponse) => {
        ElMessage({
          message: res.data.data,
          type: "success",
        });
        deleteDialogVisible.value = false;
      })
      .catch(() => {
        ElMessage({
          message: "删除失败",
          type: "error",
        });
        deleteDialogVisible.value = false;
      });
  });
};

//批量删除商品数据
const delData = () => {
  if (selectData.value.length === 0) {
    ElMessage.warning("请选择要删除的数据");
    return;
  }
  ElMessageBox.confirm("确认删除所选数据？(无法恢复！)", "删除警告", {
    type: "warning",
    icon: markRaw(Delete),
  })
    .then(() => {
      const selectId = selectData.value.map((item: any) => item.product_id);
      http
        .post("/products/deleteAll", selectId)
        .then((_res) => {
          selectData.value = [];
          ElMessage.success("删除成功");
          handleGetProductList();
        })
        .catch((error) => {
          console.error("删除失败", error);
        });
    })
    .catch(() => {
      // catch error
    });
};

// 当组件挂载时执行数据请求
onMounted(() => {
  // handleCategory();
  handleGetProductList();
});

// 分页
function handleCurrentChange(val: number) {
  page.pageNum = val;
  handleGetProductList();
}

function handleSizeChange(val: number) {
  page.currentPage = val;
}
</script>

<style lang="scss" scoped></style>
