<template>
  <el-dialog
    v-model="dialogVisible"
    width="500"
    :close-on-press-escape="false"
    @close="onCancel"
    destroy-on-close
  >
    <template #header>
      <div class="mb-4 text-xl font-bold">{{dialogType==='add'?'新增':'修改'}}商品分类</div>
    </template>
    <div class="content flex justify-center items-center p-4">
      <el-form
        ref="FormRef"
        class="w-full"
        label-position="left"
        label-width="100px"
        :model="productCategory"
        :rules="rules"
        v-if="productCategory"
      >
        <!-- 分类名称 -->
        <el-form-item label="分类名称" prop="category_name" required>
          <el-input
            v-model="productCategory.category_name"
            placeholder="请输入分类名称"
            clearable
            required
          ></el-input>
        </el-form-item>

        <!-- 分类描述 -->
        <el-form-item label="分类描述" prop="description">
          <el-input
            v-model="productCategory.description"
            placeholder="请输入分类描述"
            type="textarea"
            clearable
          ></el-input>
        </el-form-item>

        <!-- 父分类 -->
        <el-form-item label="父分类" prop="parent_category_id">
          <el-select
            v-model="productCategory.parent_category_id"
            placeholder="选择父分类"
            clearable
            filterable
          >
            <el-option label="无父分类" value="" />
            <el-option
              v-for="[id, name] in Object.entries(parentCategoryMap)"
              :key="id"
              :label="name"
              :value="id"
            />
          </el-select>
        </el-form-item>

        <!-- 分类图片 - 仅Admin可见 -->
        <el-form-item
          label="分类图片"
          prop=""
          v-if="user.role === 'Admin'"
        >
          <MediaPicker
            v-model="productCategory.image_url"
            variant="banner"
            height="120px"
            biz-type="category"
          />
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
import { ref, reactive, watchEffect, inject } from "vue";
import { ElMessage, FormInstance, FormRules } from "element-plus";
import type ProductCategory from "@/model/ProductCategory";
import User from "@/model/User";
import Shop from "@/model/Shop";
import type { HttpClient } from '@/utils/http';
import MediaPicker from '@/components/MediaPicker/MediaPicker.vue';

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

const http: HttpClient = inject("http") as HttpClient;

// 获取当前用户
const user: User = JSON.parse(localStorage.getItem("user") || "{}") as User;
//获取当前店铺
const ShopInfo = JSON.parse(localStorage.getItem("currentShop") || "{}") as Shop;

interface Props {
  dialogVisible?: boolean;
  dialogType?: 'add' | 'edit';
  categoryData?: ProductCategory; // 确保导入/正确定义了ProductCategory类型
}

interface Emits {
  (e: "getData"): void;
  (e: "update:Dialog", formData?: ProductCategory, flag?: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  dialogVisible: false,
  dialogType: "add",
  productCategory: () => ({
    category_id: "",
    shop_id: "",
    category_name: "",
    description: "",
    parent_category_id: "",
    image_url: "",
    createTime: "",
    updateTime: ""
  }),
});

const emit = defineEmits<Emits>();

const dialogVisible = ref(false);
const dialogType = ref("");
const productCategory = ref<ProductCategory>();
const FormRef = ref<FormInstance>();


// 根据用户角色调整验证规则
const rules = reactive<FormRules<ProductCategory>>({
  category_name: [
    { required: true, message: "请输入分类名称", trigger: "blur" },
    { 
      min: 2, 
      max: 50, 
      message: "分类名称长度应在2到50个字符之间", 
      trigger: "blur" 
    }
  ],
  description: [
    { 
      max: 500, 
      message: "分类描述长度不能超过500个字符", 
      trigger: "blur" 
    }
  ],
  
});


// 清空表单数据
const clearData = () => {
  productCategory.value = {
    category_id: "",
    shop_id: "",
    category_name: "",
    description: "",
    parent_category_id: "",
    image_url: "",
    createTime: "",
    updateTime: "",
  };
};

// 取消按钮
function onCancel() {
  clearData();
  emit("update:Dialog", undefined, false);
}

// 在saveCategory方法中
const saveCategory = async (type: 'add' | 'edit') => {
  try {
    // 1. 准备请求数据和URL
    const url = type === 'add' 
      ? '/category' 
      : `/category/${productCategory.value?.category_id}`;
    
    const method = type === 'add' ? 'post' : 'put';
    
    // 2. 确保数据格式正确
    const requestData = {
      ...productCategory.value,
      // 明确处理可能的null/undefined值
      parent_category_id: productCategory.value?.parent_category_id || null,
      shop_id: ShopInfo.shop_id || null
    };

    // 3. 使用配置好的axios实例发送请求
    const response = await http[method](url, requestData);
      

    // 4. 处理响应 (拦截器已处理了响应结构)
    if (response.data.code === 200) {
      ElMessage.success(type === 'add' ? '新增成功！' : '修改成功！');
      return true;
    } else {
      // 拦截器已处理错误，这里理论上不会执行
      ElMessage.error(response.data.message || '操作失败');
      return false;
    }
  } catch (error: any) {
    // 错误已被拦截器处理，这里做UI反馈
    const errorMsg = error.message || 
      (type === 'add' ? '新增分类失败' : '修改分类失败');
    
    ElMessage.error(errorMsg);
    return false;
  }
};

// 确认按钮
async function onConfirm(FormRef: FormInstance | undefined) {
  if (!FormRef) return;
  try {
    await FormRef.validate();
    if (dialogType.value === 'add' || dialogType.value === 'edit') {
      const success = await saveCategory(dialogType.value);
      if (success) {
        FormRef.resetFields();
        clearData();
        emit("update:Dialog", undefined, false);
        emit("getData");
      }
    }
  } catch (error: any) {
    if (error?.fields) return; // 表单验证错误，不弹 toast
    ElMessage.error(error.message || "操作失败，请重试");
  }
}


watchEffect(() => {
  dialogVisible.value = props.dialogVisible;
  dialogType.value = props.dialogType;
  productCategory.value = props.categoryData 
    ? { ...props.categoryData } 
    : {
        category_id: "",
        shop_id: "",
        category_name: "",
        description: "",
        parent_category_id: "",
        image_url: "",
        createTime: "",
        updateTime: "",
      };

});
</script>

<style lang="scss" scoped>
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