<template>
  <el-dialog
    v-model="dialogVisible"
    width="500"
    @close="onCancel"
    destroy-on-close
  >
    <template #header>
      <div class="mb-4 text-xl font-bold">新增品牌</div>
    </template>
    <div class="content flex justify-center items-center p-4">
      <el-form
        ref="FormRef"
        class="w-full"
        label-position="left"
        label-width="100px"
        :model="brand"
        :rules="rules"
        v-if="brand"
      >
        <el-form-item
          class="flex justify-center items-center"
          label="品牌图片"
          prop="logo_url"
          required
        >
          <div
            class="image relative flex justify-center items-center w-24 h-24 rounded-md overflow-hidden"
            v-if="brand.logo_url"
          >
            <el-image
              :src="brand.logo_url"
              :zoom-rate="1.2"
              :max-scale="7"
              :min-scale="0.2"
              preview-teleported
              :preview-src-list="[brand.logo_url]"
              fit="cover"
              style="width: 100%; height: 100%"
            />
          </div>
          <div class="upload w-24 h-24 overflow-hidden" v-else>
            <FileUploader
              :action="uploadUrl"
              :multiple="true"
              :limit="1"
              :before-upload="validateImage"
              @change="uploadChange"
              @onSuccess="success"
              @onError="error"
            />
          </div>
        </el-form-item>
        <el-form-item label="品牌名称" prop="brand_name" required>
          <el-input
            v-model="brand.brand_name"
            placeholder="请输入品牌名称"
            clearable
            required
          ></el-input>
        </el-form-item>
        <el-form-item label="绑定店铺" prop="shop_id" required>
          <el-select v-model="brand.shop_id" placeholder="选择店铺负责人">
            <el-option :label="shop.shop_name" :value="shop.shop_id" />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌描述" prop="description" required>
          <el-input
            v-model="brand.description"
            placeholder="请输入品牌描述"
            type="textarea"
            clearable
            required
          ></el-input>
        </el-form-item>
        <el-form-item label="品牌状态">
          <el-select v-model="brand.status" placeholder="设置品牌状态">
            <el-option label="已签约" value="Active" />
            <el-option label="待审核" value="Inactive" />
            <el-option label="已过期" value="Invalid" />
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
import FileUploader from "@/components/upload/FileUploader.vue";
import { ElMessage, FormInstance, FormRules } from "element-plus";
import http from '@/utils/http';
import { HttpResponse, UPLOAD_URL } from '@/utils/http';
const uploadUrl = UPLOAD_URL;
import Brand, {  } from "@/model/Brand";
import Shop from "@/model/Shop";

// 传参数据类型
interface Props {
  dialogVisible?: boolean;
  dialogType?: string;
  brand?: Brand | undefined;
  //   onConfirm: (shopFormRef: FormInstance | undefined) => boolean;
  //   onCancel: () => void;
}

// 自定义事件
interface Emits {
  (e: "getData"): void;
  (e: "update:Dialog", formData: Brand | undefined, flag?: boolean): void;
}

// 参数默认值
const props = withDefaults(defineProps<Props>(), {
  dialogVisible: false,
  dialogType: "add",
  brand: undefined,
  onConfirm: () => true,
  onCancel: () => {},
});

const emit = defineEmits<Emits>();

const shop: Shop = JSON.parse(localStorage.getItem("currentShop") || "") as Shop; // 当前登录用户

const dialogVisible = ref(false); // 弹框显隐
const dialogType = ref(""); // 弹框类型
const brandImage = ref("");
const brand = ref<Brand>();
const FormRef = ref<FormInstance>();
const rules = reactive<FormRules<Brand>>({
  brand_name: [
    { required: true, message: "请输入品牌名称", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
  shop_id: [{ required: true, message: "请选择店铺负责人", trigger: "change" }],
  description: [
    { required: true, message: "请输入店铺描述", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
});

// 清空新增分类表单
const clearData = () => {
  brand.value = {
    brand_id: "",
    shop_id: "",
    brand_name: "",
    description: "",
    logo_url: "",
    status: "",
  };
};

// 对话框取消按钮
function onCancel() {
  clearData();
  emit("update:Dialog", brand.value, false);
}

// 对话框确认按钮
async function onConfirm(FormRef: FormInstance | undefined) {
  if (!FormRef) return;
  // brand.status
  // switch (brand.status) {
  //   case value:
      
  //     break;
  
  //   default:
  //     break;
  // }
  await FormRef.validate((valid: any, _fields: any) => {
    if (valid) {
      if (dialogType.value == "add") {
        // 将原base64图片转为 file对象
        const file = base64ToFile(brandImage.value, "brand.jpg");
        // 获取在线链接
        uploadImage(file).then(() => {
          // 添加店铺
          addBrand().then(() => {
            // 清除表单数据
            FormRef.resetFields();
            clearData();
            emit("update:Dialog", brand.value, false);
          });
        });
      } else if (dialogType.value == "edit") {
        // 判断图片是否更改了 (是否含有http前缀)
        if (brand.value?.logo_url?.indexOf("http") == -1) {
          // 将原base64图片转为 file对象
          const file = base64ToFile(brandImage.value, "brand.jpg");
          // 获取在线链接
          uploadImage(file).then(() => {
            updateBrand().then(() => {
              // 清除表单数据
              FormRef.resetFields();
              clearData();
              emit("update:Dialog", brand.value, false);
            });
          });
        } else {
          updateBrand().then(() => {
            // 清除表单数据
            FormRef.resetFields();
            clearData();
            emit("update:Dialog", brand.value, false);
          });
        }
      }
    } else {
      ElMessage.error("请填写完整信息！");
    }
  });
}

// 将图片上传至服务器获取在线链接
async function uploadImage(file: File) {
  if (!validateImage(file)) {
    return;
  }
  const formData = new FormData();
  formData.append("file", file);
  await http
    .post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res: HttpResponse) => {
      brand.value!.logo_url = res.data.data;
    });
}

// 请求接口添加店铺
async function addBrand() {

  // 新增品牌
  await http
    .post("/brand/addBrand", brand.value)
    .then((res: HttpResponse) => {
      if (res.data.code == 200) {
        ElMessage.success("新增品牌成功！");
        emit("getData");
      }
    })
    .catch(() => {
      ElMessage.error("更新品牌失败！");
    });
}

// 请求接口更新店铺信息
async function updateBrand() {
  // 更新店铺
  await http
    .put(`/brand/updateBrand`, brand.value)
    .then((res: HttpResponse) => {
      if (res.data.code == 200) {
        ElMessage.success("更新品牌成功！");
        emit("getData");
      }
    })
    .catch(() => {
      ElMessage.error("更新品牌失败！");
    });
}

// 上传前验证图片格式
function validateImage(file: File): boolean {
  // 验证图片是否为 JPEG 或 PNG
  const isJPGOrPNG = file.type === "image/jpeg" || file.type === "image/png";
  if (!isJPGOrPNG) {
    alert("请上传 JPEG 或 PNG 格式的图片！");
    return false;
  }
  // 验证图片大小是否小于 2MB
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    alert("图片大小不能超过 2MB!");
    return false;
  }
  return true;
}

// 分类图片
function success(response: any, _file: any, _fileList: any[]) {
  // 处理上传成功后的逻辑
  // 假设后端返回的 URL 存储在 response.data.url
  brand.value!.logo_url = response.data;
}
function error(err: any, _file: any, _fileList: any[]) {
  console.error("上传失败", err);
  // 处理上传失败后的逻辑
}
function uploadChange(_file: any, _fileList: any[]) {
  const reader = new FileReader();
  reader.readAsDataURL(_file.raw);
  reader.onloadend = () => {
    const base64Url = reader.result as string;
    brandImage.value = base64Url;
    brand.value!.logo_url = base64Url;
  };
}

// base64转 file对象
function base64ToFile(
  base64Str: string,
  fileName: string,
  contentType?: string
): File {
  const byteCharacters = atob(base64Str.split(",")[1]);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 1000) {
    const slice = byteCharacters.slice(offset, offset + 1000);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType || "image/jpeg" });
  return new File([blob], fileName, { type: contentType || "image/jpeg" });
}

watchEffect(() => {
  dialogVisible.value = props.dialogVisible;
  dialogType.value = props.dialogType;
  brand.value = props.brand;
});
</script>
<style lang="scss" scoped></style>
