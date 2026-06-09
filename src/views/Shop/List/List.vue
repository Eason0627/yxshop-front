<template>
  <div class="list w-full h-full p-4 pb-24">
    <div
      class="container flex flex-col w-full h-full mx-auto border-[1px] border-[--info-border-color] rounded-md overflow-y-auto bg-white"
    >
      <Query
        :tableData="shopList"
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
          :data="searchList.length ? searchList : shopList"
          :empty-text="'暂无数据'"
          v-loading="loading"
          :height="tableBox?.scrollHeight"
          border
          @select="handleSelect"
          @select-all="handleSelectAll"
        >
          <el-table-column
            :type="item.type"
            :prop="item.prop"
            :label="item.label"
            :width="item.width"
            :show-overflow-tooltip="item.type === 'text' ? true : false"
            :fixed="item.type == 'operation' ? 'right' : false"
            align="center"
            v-for="item in tableHeader"
          >
            <template v-if="item.type === 'image'" #default="scope">
              <el-image
                :src="scope.row.shop_image"
                :zoom-rate="1.2"
                :max-scale="7"
                :min-scale="0.2"
                preview-teleported
                :preview-src-list="[scope.row.shop_image]"
                fit="cover"
                style="width: 64px; height: 64px"
              />
            </template>

            <template v-if="item.type === 'user'" #default="scope">
              {{
                scope.row.owner_user ? scope.row.owner_user.nick_name : "暂无"
              }}
            </template>

            <template v-if="item.type === 'date'" #default="scope">
              {{
                scope.row.status === "Active" ? scope.row.createTime : "待审核"
              }}
            </template>

            <template v-if="item.type === 'tags'" #default="scope">
              <el-tag
                :type="
                  scope.row.status === SHOP_STATUS.ACTIVE
                    ? 'success'
                    : scope.row.status === SHOP_STATUS.INACTIVE
                    ? 'primary'
                    : 'danger'
                "
                >{{
                  scope.row.status === "Active"
                    ? "正常营业"
                    : scope.row.status === "Inactive"
                    ? "待审核"
                    : "已注销"
                }}</el-tag
              >
            </template>

            <template v-if="item.type === 'operation'" #default="scope">
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
      :dialogType="dialogType"
      :shop="shop"
      @getData="getData"
      @update:Dialog="updateDialog"
    ></Dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 引入资源
 */
import { ref, reactive, inject, onMounted, markRaw, onBeforeMount } from "vue";
import { ElMessage, ElMessageBox, ElTable } from "element-plus";
import { SHOP_STATUS } from '@/constants/status';
import { Delete } from "@element-plus/icons-vue";
import { HttpClient, HttpResponse } from '@/utils/http';
import EventBus from "@/utils/event-bus";
import Shop from "@/model/Shop";
import User from "@/model/User";
import Query from "./Query.vue";
import Dialog from "./Dialog.vue";
// ************************************************************************************************************
const http: HttpClient = inject("http") as HttpClient; /// http 实例
const user: User = JSON.parse(localStorage.getItem("user") || "") as User; // 当前登录用户
// const userList = ref<User[]>([]);
const loading = ref(false); // 数据加载状态

const dialogVisible = ref(false); // 弹框显隐
const dialogType = ref(""); // 弹框类型
let shop = ref<Shop>({
  shop_id: "",
  shop_name: "",
  owner_user_id: "",
  phone: "",
  location: "",
  registration_date: "",
  shop_description: "",
  shop_image: "",
  status: "",
  id: undefined,
  name: undefined,
}); // 弹框数据对象

// 构建查询参数对象
const requestJSON: Record<string, any> = {};
const tableHeader = [
  {
    type: "selection",
    width: "55",
  },
  {
    label: "店铺图片",
    prop: "shop_image",
    type: "image",
  },
  {
    label: "店铺名称",
    prop: "shop_name",
    type: "default",
  },
  {
    label: "联系人",
    prop: "username",
    type: "user",
  },
  {
    label: "联系电话",
    prop: "phone",
    type: "default",
  },
  {
    label: "店铺地址",
    prop: "location",
    type: "text",
  },
  {
    label: "注册日期",
    prop: "registration_date",
    type: "date",
  },
  {
    label: "店铺描述",
    prop: "shop_description",
    type: "text",
  },
  {
    label: "店铺状态",
    prop: "status",
    type: "tags",
  },
  {
    label: "操作",
    prop: "operation",
    width: "160",
    type: "operation",
  },
]; // 表头渲染数据
let shopList = ref<Shop[]>([]); // 表格渲染数据
let searchList = ref<Shop[]>([]); // 表格渲染数据
const selectData = ref<any>([]); // 所选数据
const page = reactive({
  pageNum: 1,
  pageSize: 10,
  currentPage: 1,
  total: 0,
}); // 数据分页配置对象
const tableBox = ref<HTMLElement>(); // tableBox容器dom对象
const multipleTableRef = ref<InstanceType<typeof ElTable>>(); // elTable 实例
// ************************************************************************************************************

// 对话框数据更新
const updateDialog = (formData: Shop | undefined, flag?: boolean) => {
  if (flag !== undefined) {
    dialogVisible.value = flag;
  }
  if (formData !== undefined) {
    shop.value = { ...formData } as Shop;
  }
};

// 搜索栏数据更新
const updateQuery = (formData?: Shop, flag?: boolean, type?: string) => {
  if (formData !== undefined) {
    shop.value = { ...formData } as Shop;
  }
  if (flag !== undefined) {
    dialogVisible.value = flag;
  }
  if (type !== undefined) {
    dialogType.value = type;
  }
};

// 搜索数据
const search = (
  key?: string,
  value?: string,
  startTime?: string,
  endTime?: string
) => {
  if (key && value) {
    if (key === "nick_name") {
      searchList.value = shopList.value.filter((item: Shop) => {
        return item.owner_user && item.owner_user.nick_name.includes(value);
      });
    } else {
      searchList.value = shopList.value.filter((item: any) => {
        return item[key].includes(value);
      });
    }
  }
  if (startTime && endTime) {
    searchList.value = shopList.value.filter((item: any) => {
      return (
        new Date(item.createTime) >= new Date(startTime) &&
        new Date(item.createTime) <= new Date(endTime)
      );
    });
  }
};
// 重置数据
const reSet = async () => {
  searchList.value = [];
  await getData();
};

// 模拟的事件处理函数
const editRow = (_index: number, row: Shop) => {
  dialogVisible.value = true;
  dialogType.value = "edit";
  shop.value = { ...row };
};

const deleteRow = async (_index: number, row: Shop) => {
  ElMessageBox.confirm("确认删除所选数据？(无法恢复！)", "删除警告", {
    type: "warning",
    icon: markRaw(Delete),
  })
    .then(async () => {
      await delShops([row.shop_id]);
    })
    .catch(() => {
      // catch error
    });
};

// 选择数据行
const handleSelect = (selection: any[]) => {
  selectData.value = selection;
};

// 全选数据
const handleSelectAll = (selection: any[]) => {
  selectData.value = selection;
};

// 删除所选数据
const delData = async () => {
  if (selectData.value.length === 0) {
    ElMessage.warning("请选择要删除的数据");
    return;
  }
  ElMessageBox.confirm("确认删除所选数据？(无法恢复！)", "删除警告", {
    type: "warning",
    icon: markRaw(Delete),
  })
    .then(async () => {
      // 获取选中项的id
      const selectId = selectData.value.map((item: Shop) => {
        return item.shop_id;
      });
      // 删除数据
      await delShops(selectId);
      selectData.value = [];
    })
    .catch(() => {
      // catch error
    });
};

// 分页
async function handleCurrentChange(val: number) {
  page.pageNum = val;
  await getData();
}

async function handleSizeChange(val: number) {
  page.currentPage = val;
  await getData();
}

// 根据店铺状态排序
function sortShopStatus(list: Shop[]) {
  let first: Shop[] = [];
  let second: Shop[] = [];
  let third: Shop[] = [];
  let result: Shop[] = [];
  list.forEach((item) => {
    if (item.status == "Active") {
      first.push(item);
    } else if (item.status == "Inactive") {
      second.push(item);
    } else {
      third.push(item);
    }
  });
  result = [...first, ...second, ...third];
  return result;
}

// 获取数据
const getData = async () => {
  loading.value = true;
  // 发起请求 --- 获取店铺数据
  if (user.role === "ShopOwner") {
    requestJSON.owner_user_id = user.id;
  }
  await http
    .get("/shops/getShopPagination", {
      params: {
        pageNum: page.pageNum,
        pageSize: page.pageSize,
        shop: JSON.stringify(requestJSON),
      },
    })
    .then(async (res: HttpResponse<any>) => {
      // 将店铺负责人信息绑定
      res.data.data.list.forEach(async (item: Shop) => {
        await http.get(`/users/${item.owner_user_id}`).then((res) => {
          item.owner_user = res.data.data;
        });
      });
      // 根据店铺状态排序
      page.total = parseInt(res.data.data.total);
      setTimeout(() => {
        shopList.value = sortShopStatus(res.data.data.list);
        loading.value = false;
      }, 1000);
    });

  // 获取用户数据
  // http.get("/users")
};

// 删除店铺
const delShops = async (list: any) => {
  await http
    .post("/shops/delShop", list)
    .then((res) => {
      if (res.data.code == 200) {
        ElMessage.success("删除店铺成功！");
        getData();
        // 触发 TopTools 组件更新
        EventBus.emit("updateTopTools");
      }
    })
    .catch((e) => {
      ElMessage.error("删除店铺失败！" + e.message);
    });
};

onBeforeMount(async () => {
  // 根据用户权限获取数据
  const role = user.role;
  switch (role) {
    case "Admin":
      // 当前用户为管理员，获取所有店铺信息
      await getData();
      break;
    case "ShopOwner":
      // 当前用户为商家，商家所有店铺信息
      break;
    case "Customer":
      // 当前用户为顾客
      break;
  }
});

// 当组件挂载时执行数据请求
onMounted(() => {
  // 获取数据
  getData();

  // 监听窗口大小变化
  window.addEventListener("resize", () => {
    if (multipleTableRef.value) {
      multipleTableRef.value.doLayout();
    }
    if (tableBox.value) {
      // ✅ 已有判断，无需修改
      tableBox.value.style.height = `${
        document.documentElement.clientHeight - 200
      }px`;
    }
  });

  // 设置 tableBox 容器高度
  if (tableBox.value) {
    // ✅ 添加空值判断
    tableBox.value.style.height = `${
      document.documentElement.clientHeight - 200
    }px`;
  }
});
</script>

<style lang="scss" scoped></style>
