<template>
  <el-dialog
    v-model="dialogVisible"
    width="500"
    :close-on-press-escape="false"
    @close="onCancel"
    destroy-on-close
  >
    <template #header>
      <div class="mb-4 text-xl font-bold">{{dialogType==='add'?'新增':'修改'}}订单</div>
    </template>
    <div class="content flex justify-center items-center p-4">
      <el-form
        ref="FormRef"
        class="w-full"
        label-position="left"
        label-width="100px"
        :model="order"
        :rules="rules"
        v-if="order"
      >
        <!-- 删除商品图片相关的 el-form-item -->
        <el-form-item label="客户ID" prop="customer_id" required>
          <el-select v-model="order.customer_id" placeholder="选择客户ID" :disabled="dialogType === 'edit'">
            <el-option :label="user.nick_name" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式" prop="payment_method" required>
          <el-input
            v-model="order.payment_method"
            placeholder="请输入支付方式"
            clearable
            required
          ></el-input>
        </el-form-item>
        <el-form-item label="发货地址" prop="shipping_address" required>
          <el-input
            v-model="order.shipping_address"
            placeholder="请输入发货地址"
            clearable
            required
          ></el-input>
        </el-form-item>
        <el-form-item label="订单备注" prop="comments" required>
          <el-input
            v-model="order.comments"
            placeholder="请输入订单备注"
            type="textarea"
            clearable
            required
          ></el-input>
        </el-form-item>
        <el-form-item label="支付状态" prop="payment_status" required>
          <el-select v-model="order.payment_status" placeholder="设置订单状态">
            <el-option label="已支付" value="Paid" />
            <el-option label="未支付" value="Unpaid" />
            <el-option label="已发货" value="Shipped" />
            <el-option label="已完成" value="Completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态" prop="" required>
          <el-select v-model="order.order_status" placeholder="设置订单状态">
            <el-option label="待处理" value="待处理" />
            <el-option label="已确认" value="已确认" />
            <el-option label="已发货" value="已发货" />
            <el-option label="已送达" value="已送达" />
            <el-option label="已取消" value="已取消" />
            <el-option label="已退款" value="已退款" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onCancel">取消</el-button>
        <el-button type="primary" @click="onConfirm(FormRef)"> 确定 </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, reactive, watchEffect } from "vue";
import {Order} from "@/model/Order";
import { ElMessage, FormInstance, FormRules } from "element-plus";
import http from '@/utils/http';
import { HttpResponse } from '@/utils/http';
import EventBus from "@/utils/event-bus";
import User from "@/model/User";

// 传参数据类型
interface Props {
  dialogVisible?: boolean;
  dialogType?: string;
  order?: Order | undefined;
}

// 自定义事件
interface Emits {
  (e: "getData"): void;
  (e: "update:Dialog", formData: Order | undefined, flag?: boolean): void;
}

// 参数默认值
const props = withDefaults(defineProps<Props>(), {
  dialogVisible: false,
  dialogType: "add",
  order: undefined,
  onConfirm: () => true,
  onCancel: () => {},
});

const emit = defineEmits<Emits>();

const dialogVisible = ref(false); // 弹框显隐
const dialogType = ref(""); // 弹框类型
const order = ref<Order>();
const user: User = JSON.parse(localStorage.getItem("user") || "") as User; // 当前登录用户
const FormRef = ref<FormInstance>();
const rules = reactive<FormRules<Order>>({
  customer_id: [
    { required: true, message: "请选择客户ID", trigger: "change" },
  ],
  payment_method: [
    { required: true, message: "请输入支付方式", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
  shipping_address: [
    { required: true, message: "请输入发货地址", trigger: "blur" },
    { min: 2, max: 100, message: "长度在 2 到 100 个字符", trigger: "blur" },
  ],
  // 删除商品图片验证规则
  payment_status: [{ required: true, message: "请选择订单状态", trigger: "change" }],
});

// 清空新增订单表单
const clearData = () => {
  order.value = {
    order_id: "",
    customer_id: "",
    payment_method: "",
    shipping_address: "",
    comments: "",
    // 删除 product_image 字段
    payment_status: "Paid",
    // 若 Order 类型定义中没有 id 属性，可使用可选属性语法
    // 假设需要添加 id 属性到 Order 类型中，可先在类型定义处添加，此处暂时使用可选属性
    // @ts-ignore 暂时忽略类型检查，后续需完善 Order 类型定义
    id: "",
    name: "",
  };
};

// 对话框取消按钮
function onCancel() {
  clearData();
  emit("update:Dialog", order.value, false);
}

// 对话框确认按钮
async function onConfirm(FormRef: FormInstance | undefined) {
  if (!FormRef) return;
  await FormRef.validate((valid: any, _fields: any) => {
    if (valid) {
      if (dialogType.value == "add") {
        // 删除图片上传相关逻辑
        addOrder().then(() => {
          // 清除表单数据
          FormRef.resetFields();
          clearData();
          emit("update:Dialog", order.value, false);
        });
      } else if (dialogType.value == "edit") {
        // 删除图片上传相关逻辑
        updateOrder().then(() => {
          // 清除表单数据
          FormRef.resetFields();
          clearData();
          emit("update:Dialog", order.value, false);
        });
      }
    } else {
      ElMessage.error("请填写完整信息！");
    }
  });
}

// 请求接口添加订单
async function addOrder() {
  try {
    const res: HttpResponse = await http.post("/orders/addOrder", order.value);
    if (res.data.code === 200) {
      ElMessage.success("新增订单成功！");
      emit("getData");
      // 触发 TopTools 组件更新
      EventBus.emit("updateTopTools");
    } else {
      console.error('新增订单失败，响应码:', res.data.code, '错误信息:', res.data.message);
      ElMessage.error(res.data.message || "新增订单失败！");
    }
  } catch (error) {
    console.error('新增订单时发生网络错误:', error);
    ElMessage.error("网络错误，新增订单失败！");
  }
}

// 请求接口更新订单信息
async function updateOrder() {
  if (!order.value?.order_id) {
    console.error('更新订单失败，订单 ID 为空');
    ElMessage.error("更新订单失败，订单 ID 为空！");
    return;
  }
  try {
    const res: HttpResponse = await http.put(`/orders/${order.value.order_id}`, order.value);
    if (res.data.code === 200) {
      ElMessage.success("更新订单成功！");
      emit("getData");
    } else {
      console.error('更新订单失败，响应码:', res.data.code, '错误信息:', res.data.message);
      ElMessage.error(res.data.message || "更新订单失败！");
    }
  } catch (error) {
    console.error('更新订单时发生网络错误:', error);
    ElMessage.error("网络错误，更新订单失败！");
  }
}

watchEffect(() => {
  dialogVisible.value = props.dialogVisible;
  dialogType.value = props.dialogType;
  order.value = props.order;
  if (dialogType.value === 'add') {
    order.value!.order_id = Date.now();
  }
});
</script>
<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  // transform: scale(2);
  opacity: 0;
}

.fade-leave-to {
  display: none; // 解决过渡动画抖动
}
</style>
