<template>
  <el-dialog
    v-model="dialogVisible"
    width="600"
    :close-on-press-escape="false"
    @close="onCancel"
    destroy-on-close
  >
    <template #header>
      <div class="mb-4 text-xl font-bold">{{dialogType==='add'?'新增':'修改'}}仓库信息</div>
    </template>
    <div class="content flex justify-center items-center p-4">
      <el-form
        ref="FormRef"
        class="w-full"
        label-position="left"
        label-width="100px"
        :model="warehouse"
        :rules="rules"
        v-if="warehouse"
      >
        <!-- 仓库名称 -->
        <el-form-item label="仓库名称" prop="warehouse_name" required>
          <el-input
            v-model="warehouse.warehouse_name"
            placeholder="请输入仓库名称"
            clearable
          ></el-input>
        </el-form-item>

        <!-- 所属用户ID -->

        <el-form-item label="所属用户ID" prop="user_id" required>
          <el-select 
            v-model="warehouse.user_id" 
            placeholder="请选择"
            clearable
            :disabled="dialogType === 'edit'"
          >
            <el-option label="{{userInfo.username}}" value="userInfo.id" />
          
          </el-select>
        </el-form-item>
        <!-- 仓库地址 -->
        <el-form-item label="仓库地址" prop="address" required>
          <el-input
            v-model="warehouse.address"
            placeholder="请输入详细地址"
            type="textarea"
            :rows="2"
            clearable
          ></el-input>
        </el-form-item>

        <!-- 联系信息 -->
        <el-form-item label="联系信息" prop="contact_info">
          <el-input
            v-model="warehouse.contact_info"
            placeholder="请输入联系电话或邮箱"
            clearable
          ></el-input>
        </el-form-item>

        <!-- 容量信息 -->
        <div class="flex gap-4">
          <!-- 总容量 -->
          <el-form-item label="总容量" prop="total_capacity" required class="flex-1">
            <el-input-number
              v-model="warehouse.total_capacity"
              :min="1"
              :max="999999"
              placeholder="单位：立方米"
              controls-position="right"
              class="w-full"
            />
          </el-form-item>

          <!-- 当前容量 -->
          <el-form-item label="当前容量" prop="current_capacity" required class="flex-1">
            <el-input-number
              v-model="warehouse.current_capacity"
              :min="0"
              :max="warehouse.total_capacity"
              placeholder="单位：立方米"
              controls-position="right"
              class="w-full"
            />
          </el-form-item>
        </div>

        <!-- 仓库状态 -->
        <el-form-item label="仓库状态" prop="status" required>
          <el-select v-model="warehouse.status" placeholder="选择仓库状态">
            <el-option label="启用" value="Active" />
            <el-option label="停用" value="Inactive" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onCancel">取消</el-button>
        <el-button type="primary" @click="onConfirm(FormRef)">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect } from "vue";
import { ElMessage, FormInstance, FormRules } from "element-plus";
import http from '@/utils/http';
import  Warehouse  from "@/model/Warehouse";
import  User  from "@/model/User";
// import { useUserShopStore } from '@/stores/userShopStore'

interface Props {
  dialogVisible?: boolean;
  dialogType?: string;
  warehouse?: Warehouse | undefined;
}

interface Emits {
  (e: "getData"): void;
  (e: "update:Dialog", formData?: Warehouse, flag?: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  dialogVisible: false,
  dialogType: "add",
  warehouse: undefined,
});

const emit = defineEmits<Emits>();

const dialogVisible = ref(false);
const dialogType = ref("");
const warehouse = ref<Warehouse>();
const FormRef = ref<FormInstance>();
 //获取当前用户信息
 const userInfo = JSON.parse(localStorage.getItem("user") || "{}") as User;

const rules = reactive<FormRules<Warehouse>>({
  warehouse_name: [
    { required: true, message: "请输入仓库名称", trigger: "blur" },
    { min: 2, max: 50, message: "名称长度2-50个字符", trigger: "blur" }
  ],
  user_id: [
    { required: true, message: "请输入所属用户ID", trigger: "blur" },
    { pattern: /^[a-zA-Z0-9]+$/, message: "ID只能包含字母和数字", trigger: "blur" }
  ],
  address: [
    { required: true, message: "请输入仓库地址", trigger: "blur" },
    { min: 5, max: 200, message: "地址长度5-200个字符", trigger: "blur" }
  ],
  total_capacity: [
    { required: true, message: "请输入总容量", trigger: "blur" },
    { type: "number", min: 1, message: "容量必须大于0", trigger: "change" }
  ],
  current_capacity: [
    { required: true, message: "请输入当前容量", trigger: "blur" },
    { 
      type: "number", 
      validator: (_, value, callback) => {
        if (value < 0) return callback(new Error("容量不能为负数"));
        if (value > (warehouse.value?.total_capacity || Infinity)) {
          return callback(new Error("当前容量不能超过总容量"));
        }
        callback();
      },
      trigger: "change"
    }
  ],
  status: [
    { required: true, message: "请选择仓库状态", trigger: "change" }
  ]
});

const clearData = () => {
  warehouse.value = {
    warehouse_id: "",
    warehouse_name: "",
    user_id: userInfo.id,
    address: "",
    contact_info: "",
    total_capacity: 100,
    current_capacity: 0,
    manager_user_id: "",
    status: "Active",
    
  };
};

const onCancel = () => {
  clearData();
  emit("update:Dialog", warehouse.value, false);
};

const onConfirm = async (FormRef: FormInstance | undefined) => {
  if (!FormRef) return;
  
  try {
    await FormRef.validate();
    
    if (dialogType.value === "add") {
      await addWarehouse();
    } else {
      await updateWarehouse();
    }

    FormRef.resetFields();
    clearData();
    emit("update:Dialog", warehouse.value, false);
    
  } catch (error) {
    console.error("操作失败:", error);
    ElMessage.error("操作失败，请检查表单");
  }
};

const addWarehouse = async () => {
  delete warehouse.value?.createTime;
  delete warehouse.value?.updateTime
  await http.post("warehouses/addWarehouse", warehouse.value)
    .then(res => {
      if (res.data.code === 200) {
        ElMessage.success("新增仓库成功！");
        emit("getData");
      }
    })
    .catch(() => ElMessage.error("新增失败"));
};

const updateWarehouse = async () => {
  delete warehouse.value?.createTime;
  delete warehouse.value?.updateTime
  await http.put(`/warehouses/${warehouse.value?.warehouse_id}`, warehouse.value)
    .then(res => {
      if (res.data.code === 200) {
        ElMessage.success("更新成功！");
        emit("getData");
      }
    })
    .catch(() => ElMessage.error("更新失败"));
};

watchEffect(() => {
  dialogVisible.value = props.dialogVisible;
  dialogType.value = props.dialogType;
  warehouse.value = props.warehouse;
});
</script>

<style lang="scss" scoped>
/* 保留原有过渡动画样式 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-leave-to {
  display: none;
}
</style>