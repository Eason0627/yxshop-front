<template>
  <el-dialog
    v-model="dialogVisible"
    width="500"
    :close-on-press-escape="false"
    @close="onCancel"
    destroy-on-close
  >
    <template #header>
      <div class="mb-4 text-xl font-bold">新增店铺</div>
    </template>
    <div class="content flex justify-center items-center p-4">
      <el-form
        ref="FormRef"
        class="w-full"
        label-position="left"
        label-width="100px"
        :model="shop"
        :rules="rules"
        v-if="shop"
      >
        <el-form-item
          class="flex justify-center items-center"
          label="店铺图片"
          prop="shop_image"
          required
        >
          <div
            class="image relative flex justify-center items-center w-24 h-24 rounded-md overflow-hidden"
            @mouseover="onMouseOver($event)"
            v-if="shop.shop_image"
          >
            <el-image
              :src="shop.shop_image"
              :zoom-rate="1.2"
              :max-scale="7"
              :min-scale="0.2"
              preview-teleported
              :preview-src-list="[shop.shop_image]"
              fit="cover"
              style="width: 100%; height: 100%"
            />
            <el-image-viewer
              v-if="showImageViewer"
              :url-list="[shop.shop_image]"
              @close="closeViewer"
            ></el-image-viewer>
            <Transition name="fade">
              <div
                class="preview absolute flex justify-center items-center w-full h-full"
                @mouseout="onMouseOut($event)"
                v-show="editImage"
              >
                <div
                  class="mask absolute w-full h-full bg-black opacity-40 z-5"
                ></div>
                <div class="flex items-center text-white text-xl z-10">
                  <span class="mr-2 cursor-pointer" @click="zoomIn">
                    <el-icon><ZoomIn /></el-icon>
                  </span>
                  <span class="cursor-pointer" @click="delShopImage">
                    <el-icon><Delete /></el-icon>
                  </span>
                </div>
              </div>
            </Transition>
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
        <el-form-item label="店铺名称" prop="shop_name" required>
          <el-input
            v-model="shop.shop_name"
            placeholder="请输入店铺名称"
            clearable
            required
          ></el-input>
        </el-form-item>
        <el-form-item label="店铺负责人" prop="owner_user_id" required>
          <el-select v-model="shop.owner_user_id" placeholder="选择店铺负责人">
            <el-option :label="user.nick_name" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone" required>
          <el-input
            v-model="shop.phone"
            placeholder="请输入联系电话"
            clearable
            required
          ></el-input>
        </el-form-item>
        <el-form-item label="地址" prop="location" required>
          <el-input
            v-model="shop.location"
            placeholder="请输入地址"
            clearable
            required
          ></el-input>
        </el-form-item>
        <el-form-item label="店铺描述" prop="shop_description" required>
          <el-input
            v-model="shop.shop_description"
            placeholder="请输入店铺描述"
            type="textarea"
            clearable
            required
          ></el-input>
        </el-form-item>
        <el-form-item label="店铺状态" prop="status" required>
          <el-select v-model="shop.status" placeholder="设置店铺状态" :disabled="user.role !== 'Admin'">
            <el-option label="正常营业" value="Active" />
            <el-option label="待审核" value="Inactive" />
            <el-option label="已注销" value="Invalid" />
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
import Shop from "@/model/Shop";
import { ElMessage, FormInstance, FormRules } from "element-plus";
import http from '@/utils/http';
import { HttpResponse, UPLOAD_URL } from '@/utils/http';
const uploadUrl = UPLOAD_URL;
import EventBus from "@/utils/event-bus";
import User from "@/model/User";

// 传参数据类型
interface Props {
  dialogVisible?: boolean;
  dialogType?: string;
  shop?: Shop | undefined;
}

// 自定义事件
interface Emits {
  (e: "getData"): void;
  (e: "update:Dialog", formData: Shop | undefined, flag?: boolean): void;
}

// 参数默认值
const props = withDefaults(defineProps<Props>(), {
  dialogVisible: false,
  dialogType: "add",
  shop: undefined,
  onConfirm: () => true,
  onCancel: () => {},
});

const emit = defineEmits<Emits>();

const dialogVisible = ref(false); // 弹框显隐
const dialogType = ref(""); // 弹框类型
const showImageViewer = ref(false); // 图片预览组件显隐
const shopImage = ref(""); // 图片占位 base64
const editImage = ref(false); // 编辑图片工具显隐
const shop = ref<Shop>();
const user: User = JSON.parse(localStorage.getItem("user") || "") as User; // 当前登录用户
// const userList = ref<User[]>([]);
const FormRef = ref<FormInstance>();
const rules = reactive<FormRules<Shop>>({
  shop_name: [
    { required: true, message: "请输入店铺名称", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
  owner_user_id: [
    { required: true, message: "请选择店铺负责人", trigger: "change" },
  ],
  phone: [
    { required: true, message: "请输入联系电话", trigger: "blur" },
    { min: 11, max: 11, message: "请输入正确的11位手机号码", trigger: "blur" },
  ],
  location: [
    { required: true, message: "请输入店铺地址", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
  shop_description: [
    { required: true, message: "请输入店铺描述", trigger: "blur" },
    { min: 2, max: 100, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
  shop_image: [{ required: true, message: "请上传店铺图片", trigger: "blur" }],
  status: [{ required: true, message: "请选择店铺负责人", trigger: "change" }],
});

// 显示图片工具
const onMouseOver = (event: MouseEvent) => {
  event.preventDefault();
  const isOver = !(event.currentTarget as HTMLElement).contains(
    event.relatedTarget as HTMLElement
  );
  if (isOver) {
    editImage.value = true;
  }
};

// 隐藏图片工具
const onMouseOut = (event: MouseEvent) => {
  event.preventDefault();
  const isOut = !(event.currentTarget as HTMLElement).contains(
    event.relatedTarget as HTMLElement
  );
  if (isOut) {
    editImage.value = false;
  }
};

// 显示图片预览
const zoomIn = () => {
  showImageViewer.value = true;
};

// 关闭图片预览
const closeViewer = () => {
  showImageViewer.value = false;
};

// 删除当前图片
const delShopImage = () => {
  shop.value!.shop_image = "";
  shopImage.value = "";
  editImage.value = false;
};

// 清空新增分类表单
const clearData = () => {
  shop.value = {
    shop_id: "",
    shop_name: "",
    owner_user_id: "",
    phone: "",
    location: "",
    registration_date: "",
    shop_description: "",
    shop_image: "",
    status: "Active",
    id: "",
    name: "",
  };
};

// 对话框取消按钮
function onCancel() {
  clearData();
  emit("update:Dialog", shop.value, false);
}

// 对话框确认按钮
async function onConfirm(FormRef: FormInstance | undefined) {
  if (!FormRef) return;
  await FormRef.validate((valid: any, _fields: any) => {
    if (valid) {
      if (dialogType.value == "add") {
        // 将原base64图片转为 file对象
        const file = base64ToFile(shopImage.value, "shop.jpg");
        // 获取在线链接
        uploadImage(file).then(() => {
          // 添加店铺
          addShop().then(() => {
            // 清除表单数据
            FormRef.resetFields();
            clearData();
            emit("update:Dialog", shop.value, false);
          });
        });
      } else if (dialogType.value == "edit") {
        // 判断图片是否更改了 (是否含有http前缀)
        if (
          shop.value &&
          shop.value.shop_image &&
          shop.value.shop_image.indexOf("http") == -1
        ) {
          // 将原base64图片转为 file对象
          const file = base64ToFile(shopImage.value, "shop.jpg");
          // 获取在线链接
          uploadImage(file).then(() => {
            updateShop().then(() => {
              // 清除表单数据
              FormRef.resetFields();
              clearData();
              emit("update:Dialog", shop.value, false);
            });
          });
        } else {
          updateShop().then(() => {
            // 清除表单数据
            FormRef.resetFields();
            clearData();
            emit("update:Dialog", shop.value, false);
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
      shop.value!.shop_image = res.data.data;
      
    });
}

// 请求接口添加店铺
async function addShop() {

  // 新增店铺
  await http
    .post("/shops/addShop", shop.value)
    .then((res: HttpResponse) => {
      if (res.data.code == 200) {
        ElMessage.success("新增店铺成功！");
        emit("getData");
        // 触发 TopTools 组件更新
        EventBus.emit("updateTopTools");
      }
    })
    .catch(() => {
      ElMessage.error("更新店铺失败！");
    });
}

// 请求接口更新店铺信息
async function updateShop() {
  // 更新店铺
  await http
    .put(`/shops/${shop.value?.shop_id}`, shop.value)
    .then((res: HttpResponse) => {
      if (res.data.code == 200) {
        ElMessage.success("更新店铺成功！");
        emit("getData");
      }
    })
    .catch(() => {
      ElMessage.error("更新店铺失败！");
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
  shop.value!.shop_image = response.data;
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
    shopImage.value = base64Url;
    shop.value!.shop_image = base64Url;
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
  shop.value = props.shop;
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
