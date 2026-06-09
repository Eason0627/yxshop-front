<template>
  <div class="list w-full h-full p-4 pb-24">
    <div
      class="container flex flex-col w-full h-full mx-auto border-[1px] border-[--info-border-color] rounded-md overflow-y-auto bg-white"
    >
      <Query
        :tableData="userList"
        :selectData="selectData"
        :delData="delData"
        @update:Query="updateQuery"
        @getData="getData"
        @search="search"
        @reSet="reSet"
      ></Query>
      <div ref="tableBox" class="tableBox flex-1">
        <el-table
          class="mt-[-1] w-full"
          ref="multipleTableRef"
          :data="searchList.length ? searchList : userList"
          :empty-text="'暂无数据'"
          v-loading="loading"
          :height="tableBox?.scrollHeight"
          border
          :cell-style="{ padding: '8px 0' }"
          :header-cell-style="{ padding: '8px 0' }"
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
                :src="scope.row.avatar"
                :zoom-rate="1.2"
                :max-scale="7"
                :min-scale="0.2"
                preview-teleported
                :preview-src-list="[scope.row.avatar]"
                fit="cover"
                style="width: 64px; height: 64px"
              />
            </template>

            <template v-if="item.type === 'role'" #default="scope">
              <el-tag
                :type="
                  scope.row.role === 'Admin'
                    ? 'danger'
                    : scope.row.role === 'ShopOwner'
                    ? 'warning'
                    : 'success'
                "
              >
                {{
                  scope.row.role === 'Admin'
                    ? '管理员'
                    : scope.row.role === 'ShopOwner'
                    ? '商家'
                    : '顾客'
                }}
              </el-tag>
            </template>

            <template v-if="item.type === 'status'" #default="scope">
              <el-tag
                :type="
                  scope.row.status === USER_STATUS.ACTIVE
                    ? 'success'
                    : scope.row.status === USER_STATUS.BANNED
                    ? 'warning'
                    : 'danger'
                "
              >
                {{
                  scope.row.status === USER_STATUS.ACTIVE
                    ? '活跃'
                    : scope.row.status === USER_STATUS.BANNED
                    ? '禁用'
                    : '注销'
                }}
              </el-tag>
            </template>

            <template v-if="item.type === 'verified'" #default="scope">
              <el-tag :type="scope.row.is_verified ? 'success' : 'info'">
                {{ scope.row.is_verified ? '已认证' : '未认证' }}
              </el-tag>
            </template>

            <template v-if="item.type === 'date'" #default="scope">
              {{ formatDate(scope.row.createTime) }}
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
                >{{ scope.row.status === 'Deleted' ? '恢复' : '注销' }}</el-button
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
      :user="userForm"
      @getData="getData"
      @update:Dialog="updateDialog"
    ></Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, inject, onMounted, markRaw } from "vue";
import { USER_STATUS } from '@/constants/status';
import { ElMessage, ElMessageBox, ElTable } from "element-plus";
import { Delete,  } from "@element-plus/icons-vue";
import type { HttpClient } from '@/utils/http';
import EventBus from "@/utils/event-bus";
import User from "@/model/User";
import Query from "./Query.vue";
import Dialog from "./Dialog.vue";

const http: HttpClient = inject("http") as HttpClient;
const loading = ref(false);
const dialogVisible = ref(false);
const dialogType = ref("");
const userForm = ref<User>({
  id: "",
  username: "",
  nick_name: "",
  password: "",
  email: "",
  phone: "",
  wechat_id: "",
  role: "Customer",
  createTime: new Date(),
  updateTime: new Date(),
  status: "Active",
  is_verified: 0,
  avatar: "",
  birth: new Date(),
  gender: "",
  default_address: "",
  code: ""
});

const tableHeader = [
{
    type: "selection",
    width: "55px",
  },
  {
    label: "头像",
    prop: "avatar",
    type: "image",
    width: ""
  },
  {
    label: "用户名",
    prop: "username",
    type: "default",
    width: ""
  },
  {
    label: "昵称",
    prop: "nick_name",
    type: "default",
    width: ""
  },
  {
    label: "角色",
    prop: "role",
    type: "role",
    width: ""
  },
  {
    label: "邮箱",
    prop: "email",
    type: "default",
    width: ""
  },
  {
    label: "手机号",
    prop: "phone",
    type: "default",
    width: ""
  },
  {
    label: "状态",
    prop: "status",
    type: "status",
    width: ""
  },
  {
    label: "认证状态",
    prop: "is_verified",
    type: "verified",
    width: ""
  },
  {
    label: "注册时间",
    prop: "createTime",
    type: "date",
    width: ""
  },
  {
    label: "操作",
    prop: "operation",
    width: "180",
    type: "operation",
  },
];

let userList = ref<User[]>([]);
let searchList = ref<User[]>([]);
const selectData = ref<User[]>([]);
const page = reactive({
  pageNum: 1,
  pageSize: 10,
  currentPage: 1,
  total: 0,
});
const tableBox = ref<HTMLElement>();
const multipleTableRef = ref<InstanceType<typeof ElTable>>();

// 格式化日期
const formatDate = (date: Date) => {
  return new Date(date).toLocaleString();
};

// 对话框数据更新
const updateDialog = (formData: User | undefined, flag?: boolean) => {
  if (flag !== undefined) {
    dialogVisible.value = flag;
  }
  if (formData !== undefined) {
    userForm.value = { ...formData } as User;
  }
};

// 搜索栏数据更新
const updateQuery = (formData?: User, flag?: boolean, type?: string) => {
  if (formData !== undefined) {
    userForm.value = { ...formData } as User;
  }
  if (flag !== undefined) {
    dialogVisible.value = flag;
  }
  if (type !== undefined) {
    dialogType.value = type;
  }
};

// 搜索方法修改
const search = (
  key?: string,
  value?: string,
  startTime?: string,
  endTime?: string,
  role?: string,
  status?: string
) => {
  // 重置页码
  page.pageNum = 1;
  
  // 调用获取数据方法
  getData({
    key,
    value,
    startTime,
    endTime,
    role,
    status
  });
};

// 重置数据
const reSet = async () => {
  searchList.value = [];
  page.pageNum = 1;
  page.currentPage = 1; // 重置当前页码
  // 由于 requestJSON 是常量，不能直接赋值，改为清空对象属性
  Object.keys(requestJSON).forEach(key => delete requestJSON[key]);
  await getData(); // 不带任何参数调用，获取全部数据
};

// 编辑行
const editRow = (_index: number, row: User) => {
  dialogVisible.value = true;
  dialogType.value = "edit";
  userForm.value = { ...row };
};

// 删除单行用户
const deleteRow = async (_index: number, row: User) => {
  try {
    await ElMessageBox.confirm('确认删除此用户？(用户将无法登录)', '删除用户', {
      type: "warning",
      icon: markRaw(Delete),
    });
    
    // 调用API执行删除操作
    const response = await http.delete("/users/deleteUsers", { 
      data: { ids: [row.id] } 
    });
    
    if (response.data.code === 200) {
      ElMessage.success('删除用户成功');
      await getData(); // 刷新数据
      EventBus.emit("updateTopTools");
    } else {
      ElMessage.error(response.data.msg || '删除用户失败');
    }
  } catch (error) {
    // 用户点击取消或请求失败
    if (error !== 'cancel') {
      const errMsg = (error as Error).message || '删除用户操作失败';
      ElMessage.error(errMsg);
    }
  }
};

// 选择数据行
const handleSelect = (selection: User[]) => {
  selectData.value = selection;
};

// 全选数据
const handleSelectAll = (selection: User[]) => {
  selectData.value = selection;
};

// 删除所选数据
// 批量删除用户
const delData = async () => {
  if (selectData.value.length === 0) {
    ElMessage.warning("请选择要删除的用户");
    return;
  }

  try {
    await ElMessageBox.confirm('确认删除所选用户？(用户将无法登录)', '批量删除用户', {
      type: "warning",
      icon: markRaw(Delete),
    });
    
    // 准备要删除的ID列表
    const ids = selectData.value.map(user => user.id);
    
    // 调用批量删除API
    const response = await http.delete("/users/deleteUsers", { 
      data: { ids } 
    });
    
    if (response.data.code === 200) {
      ElMessage.success(`已删除 ${ids.length} 个用户`);
      selectData.value = []; // 清空选择
      await getData(); // 刷新数据
      EventBus.emit("updateTopTools");
    } else {
      ElMessage.error(response.data.msg || '批量删除用户失败');
    }
  } catch (error) {
    // 用户点击取消或请求失败
    if (error !== 'cancel') {
      const errMsg = (error as Error).message || '批量删除用户操作失败';
      ElMessage.error(errMsg);
    }
  }
};

// 分页
async function handleCurrentChange(val: number) {
  page.pageNum = val;
  await getData();
}

async function handleSizeChange(val: number) {
  page.pageSize = val;
  await getData();
}

// 构建查询参数对象
const requestJSON: Record<string, any> = {};

// 获取用户数据
const getData = async (searchParams?: {
  key?: string;
  value?: string;
  startTime?: string;
  endTime?: string;
  role?: string;
  status?: string;
}) => {
  loading.value = true;
  if(searchParams?.key&&searchParams?.value){
    requestJSON[searchParams.key] = searchParams.value;
  }
  if(searchParams?.startTime&&searchParams?.endTime){
    requestJSON.startTime = searchParams.startTime;
    requestJSON.endTime = searchParams.endTime;
  }
  if(searchParams?.role){
    requestJSON.role = searchParams.role;
  }
  if(searchParams?.status){
    requestJSON.status = searchParams.status;
  }

  try {
    // 构建查询参数
    const params: Record<string, any> = {
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      user: JSON.stringify(requestJSON),
    };

    // 添加搜索条件
    if (searchParams) {
      if (searchParams.key && searchParams.value) {
        // 根据不同的搜索类型设置不同的参数
        switch(searchParams.key) {
          case 'username':
            params.username = searchParams.value;
            break;
          case 'nick_name':
            params.nickName = searchParams.value;
            break;
          case 'email':
            params.email = searchParams.value;
            break;
          case 'phone':
            params.phone = searchParams.value;
            break;
          case 'wechat_id':
            params.wechatId = searchParams.value;
            break;
        }
      }
      
      // 添加角色和状态筛选
      if (searchParams.role) {
        params.role = searchParams.role;
      }
      if (searchParams.status) {
        params.status = searchParams.status;
      }
      
      // 添加时间范围
      if (searchParams.startTime && searchParams.endTime) {
        params.startTime = searchParams.startTime;
        params.endTime = searchParams.endTime;
      }
    }

    const res = await http.get("/users/page", { params });
    
    page.total = parseInt(res.data.data.total);
    userList.value = res.data.data.list.map((user: User) => ({
      ...user,
      // 确保日期类型正确
      createTime: new Date(user.createTime),
      updateTime: new Date(user.updateTime),
      birth: user.birth ? new Date(user.birth) : null,
    }));
    
  } catch (e) {
    const error = e as Error;
    ElMessage.error("获取用户数据失败: " + error.message);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  getData();

  window.addEventListener("resize", () => {
    if (multipleTableRef.value) {
      multipleTableRef.value.doLayout();
    }
    if (tableBox.value) {
      tableBox.value.style.height = `${
        document.documentElement.clientHeight - 200
      }px`;
    }
  });

  if (tableBox.value) {
    tableBox.value.style.height = `${
      document.documentElement.clientHeight - 200
    }px`;
  }
});
</script>

<style lang="scss" scoped>
.tableBox {
  width: 100%;
  overflow-x: auto;
  
  .el-table {
    width: 100% !important;
    
    th.el-table__cell, td.el-table__cell {
      padding: 8px 0;
    }
    
    .el-table__fixed, .el-table__fixed-right {
      height: 100% !important;
    }
    
    // 图片列特殊处理
    .cell {
      .el-image {
        vertical-align: middle;
      }
    }
  }
}
</style>