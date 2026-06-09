<template>
  <div class="fileUpload">
    <el-upload
      ref="uploadRef"
      :action="uploadAction"
      :multiple="multiple"
      :headers="headers"
      :limit="limit"
      :file-list="fileList"
      :auto-upload="auto"
      :on-change="handleChange"
      :on-remove="handleRemove"
      :before-upload="beforeUpload"
      :on-exceed="handleExceed"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-preview="handlePreview"
      list-type="picture-card"
      :class="{ 'is-disabled': disabled }"
    >
      <el-icon>
        <UploadFilled />
      </el-icon>
      <span @click="submitUpload"></span>
    </el-upload>
    <el-image-viewer
      v-if="showImageViewer"
      :url-list="previewerList"
      @close="closeViewer"
    ></el-image-viewer>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { ElMessage } from "element-plus";

// 传参数据类型
interface Props {
  disabled?: boolean;
  action?: string;
  multiple?: boolean;
  limit?: number;
  auto?: boolean;
  fileList?: any[];
  urlList?: string[];
  propsStr?: string;
  beforeUpload?: (file: any) => boolean;
  onSuccess?: (response: any, file: any, fileList: any[]) => void;
  onError?: (error: any, file: any, fileList: any[]) => void;
}

// 自定义事件
interface Emits {
  (e: "change", file: any, fileList: any[], props?: string): void;
  (e: "update:modelValue", file: any, fileList: any[], props?: string): void;
  (
    e: "onSuccess",
    response: any,
    file: any,
    fileList: any[],
    props?: string
  ): void;
  (e: "onError", error: any, file: any, fileList: any[], props?: string): void;
}

// 参数默认值
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  action: "",
  multiple: false,
  limit: 5,
  auto: false,
  fileList: ()=>[],
  urlList: () => [],
  propsStr: "",
  beforeUpload: () => true,
  onSuccess: () => {},
  onError: () => {},
});

const emit = defineEmits<Emits>();

// 接收文件列表
const fileList = ref<any[]>([]);
// 文件上传地址
const uploadAction = ref<string>(props.action);
// Upload Dom对象
const uploadRef = ref<any>(null);
const propsStr = ref<string>(props.propsStr);

const showImageViewer = ref(false); // 图片预览组件显隐
const previewerList = ref<string[]>([]); // 图片预览列表
// 携带请求头
const headers = ref({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

// 监听 action 变化
watchEffect(() => {
  uploadAction.value = props.action;
  propsStr.value = props.propsStr;
  fileList.value = props.fileList
  if(props.urlList){
    previewerList.value = props.urlList
    // showImageViewer.value = true
  }
  
});

// 提交上传
const submitUpload = () => {
  if (uploadRef.value) {
    uploadRef.value.submit();
  }
};

defineExpose({
  submitUpload,
});
function handleChange(file: any, fileList: any) {
  const list: string[] = [];
  fileList.forEach((file: any) => {
    const reader = new FileReader();
    reader.readAsDataURL(file.raw);
    reader.onloadend = () => {
      const base64Url = reader.result as string;
      list.push(base64Url);
    };
  });
  previewerList.value = list;
  emit("change", file, fileList, propsStr.value);
}

function handleRemove(file: any, fileList: any) {
  fileList.value = fileList.filter((f: any) => f.uid !== file.uid);
  emit("update:modelValue", file, fileList.value, propsStr.value);
}

function handleExceed(files: any, fileList: any) {
  ElMessage.warning(
    `当前限制选择 ${props.limit} 个文件，本次选择了 ${
      files.length
    } 个文件，共选择了 ${files.length + fileList.length} 个文件`
  );
}

function beforeUpload(file: any): boolean {
  if (typeof props.beforeUpload === "function") {
    return props.beforeUpload(file);
  }
  return true;
}

function handleSuccess(response: any, file: any, fileList: any[]) {
  // 调用父组件的 onSuccess 方法
  emit("onSuccess", response, file, fileList, propsStr.value);
}

function handleError(error: any, file: any, fileList: any[]) {
  // 调用父组件的 onError 方法
  emit("onError", error, file, fileList, propsStr.value);
}

function handlePreview(file: any) {
  if(file.url) {
    previewerList.value = [file.url]
  } else {
    const reader = new FileReader()
    reader.readAsDataURL(file.raw)
    reader.onloadend = () => {
      previewerList.value = [reader.result as string]
    }
  }
  showImageViewer.value = true
}

// 关闭图片预览
const closeViewer = () => {
  showImageViewer.value = false;
};
</script>

<style>
.is-disabled {
  pointer-events: none;
  opacity: 0.6;
}

.el-upload--picture-card,
.el-upload-list__item {
  width: 96px !important;
  height: 96px !important;
  line-height: 96px !important;
}
</style>
