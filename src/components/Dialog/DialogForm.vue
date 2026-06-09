<template>
  <el-dialog :title="title" v-model="dialogVisible" @close="closeDialog">
    <el-form
      ref="formRef"
      class="flex flex-col justify-center items-center py-4"
      :model="formData"
      :rules="rules"
      :label-position="labelPosition"
      label-width="120px"
    >
      <div
        v-for="groupName in Object.keys(groupFields)"
        :key="groupName"
        class="w-full px-20"
      >
        <div
          class="title flex items-center py-4 font-bold text-left text-xl text-[--info-text-color]"
        >
          <div class="line w-1 h-6 rounded-md bg-[--theme-color]"></div>
          <div class="text px-4">{{ groupName }}</div>
        </div>
        <div class="w-full">
          <div
            class="px-10 mx-auto"
            v-for="(field, index) in groupFields[groupName]"
            :key="index"
          >
            <el-form-item
              :prop="field.prop"
              :rules="field.rules"
              v-show="field.show"
            >
              <template #label>
                <div class="label">
                  <el-tooltip
                    class="box-item"
                    effect="dark"
                    :content="field.tips"
                    placement="bottom"
                    v-if="field.tips"
                  >
                    <div class="flex items-center">
                      <span>{{ field.label }}</span
                      ><el-icon><InfoFilled /></el-icon>
                    </div>
                  </el-tooltip>
                  <span v-else>{{ field.label }}</span>
                </div>
              </template>
              <template #default>
                <div v-if="field.HTML" v-html="field.HTML"></div>
                <el-checkbox
                  v-else-if="field.type === 'checkbox'"
                  v-model="formData[field.prop]"
                  :label="field.label"
                  @change="
                    field.onChange &&
                      field.onChange(formData[field.prop], field)
                  "
                ></el-checkbox>
                <el-input
                  v-else-if="field.type === 'text'"
                  v-model="formData[field.prop]"
                  :placeholder="field.placeholder"
                  @change="
                    field.onChange &&
                      field.onChange(formData[field.prop], field)
                  "
                ></el-input>
                <el-select
                  v-else-if="field.type === 'select'"
                  v-model="formData[field.prop]"
                  value-key="id"
                  :placeholder="field.placeholder"
                  :multiple="field.multiple"
                  :loading="field.loading ? field.loading : false"
                  @focus="
                    field.onFocus && field.onFocus(formData[field.prop], field)
                  "
                  @change="
                    field.onChange &&
                      field.onChange(formData[field.prop], field)
                  "
                >
                  <template #loading>
                    <svg class="circular" viewBox="0 0 50 50">
                      <circle class="path" cx="25" cy="25" r="20" fill="none" />
                    </svg>
                  </template>
                  <el-option
                    v-for="option in field.options"
                    :key="option.id"
                    :label="option.label"
                    :value="option.value"
                    :disabled="option.disabled"
                  >
                    <span>{{ option.label }}</span>
                  </el-option>
                </el-select>
                <el-date-picker
                  v-else-if="field.type === 'datetime'"
                  v-model="formData[field.prop]"
                  type="date"
                  :placeholder="field.placeholder"
                  @change="
                    field.onChange &&
                      field.onChange(formData[field.prop], field)
                  "
                ></el-date-picker>
                <el-input-number
                  style="min-width: 200px"
                  v-else-if="field.type === 'number'"
                  v-model="formData[field.prop]"
                  :placeholder="field.placeholder"
                  :max="field.max"
                  :min="field.min"
                  @change="
                    field.onChange &&
                      field.onChange(formData[field.prop], field)
                  "
                ></el-input-number>
                <el-input-number
                  style="min-width: 200px"
                  v-else-if="field.type === 'double'"
                  v-model="formData[field.prop]"
                  :placeholder="field.placeholder"
                  :precision="2"
                  :step="0.1"
                  :max="field.max"
                  :min="field.min"
                  @change="
                    field.onChange &&
                      field.onChange(formData[field.prop], field)
                  "
                />
                <el-input
                  type="textarea"
                  v-else-if="field.type === 'textarea'"
                  v-model="formData[field.prop]"
                  :placeholder="field.placeholder"
                  @change="
                    field.onChange &&
                      field.onChange(formData[field.prop], field)
                  "
                ></el-input>
                <FileUploader
                  v-else-if="field.type === 'uploader'"
                  :action="field.uploadConfig.uploadAction"
                  :multiple="field.uploadConfig.multiple"
                  :limit="field.uploadConfig.limit"
                  :before-upload="validateImage"
                  @change="uploadChange"
                  @onSuccess="success"
                  @onError="error"
                />
              </template>
            </el-form-item>
            <div v-if="index == groupFields[groupName].length - 1">
              <el-divider />
            </div>
          </div>
        </div>
      </div>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElForm, FormInstance, ElMessage } from "element-plus";
import { FormField } from "./FormField";
import FileUploader from "@/components/upload/FileUploader.vue";

interface Props<T> {
  title: string;
  dialogVisible: boolean;
  labelPosition: any;
  fields: FormField<T>[];
  formData: any;
}

const props = withDefaults(defineProps<Props<any>>(), {
  title: "",
  dialogVisible: false,
  labelPosition: "left",
  fields: () => [],
  formData: {},
});

const emit = defineEmits<{
  (event: "update:dialogVisible", value: boolean): void;
  (event: "update:formData", value: any): void;
  (event: "submit", data: any): void;
  (event: "uploadChange", file: any, fileList: any[]): void;
  (event: "success", response: any, file: any, fileList: any[]): void;
  (event: "error", err: any, file: any, fileList: any[]): void;
}>();

const formRef = ref<FormInstance>();
const formData = ref<any>({});
const rules = reactive<{ [key: string]: any[] }>({});

const title = ref(props.title);
const dialogVisible = ref(props.dialogVisible);
const labelPosition = ref(props.labelPosition);
const fields = ref<FormField<any>[]>(props.fields);

// 计算属性，根据 group 分组字段
const groupFields = computed(() => {
  const grouped: Record<string, FormField<any>[]> = {};

  fields.value.forEach((field) => {
    const groupName = field.group || "默认分组";
    if (!grouped[groupName]) {
      grouped[groupName] = [];
    }
    grouped[groupName].push(field);
  });

  return grouped;
});

// 验证表单
function submitForm() {
  formRef.value?.validate((valid) => {
    if (valid) {
      emit("submit", formData.value);
      emit("update:dialogVisible", false);
    } else {
      ElMessage.error("验证失败");
    }
  });
}

// 上传文件前的验证
function validateImage(file: any) {
  const isJPG = file.type === "image/jpeg";
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPG) {
    ElMessage.error("上传图片只能是 JPG 格式!");
  }
  if (!isLt2M) {
    ElMessage.error("上传图片大小不能超过 2MB!");
  }
  return isJPG && isLt2M;
}

// 上传文件的 change 事件
function uploadChange(file: any, fileList: any[]) {
  emit("uploadChange", file, fileList);
}

// 上传成功回调
function success(response: any, file: any, fileList: any) {
  emit("success", response, file, fileList);
}

// 上传失败回调
function error(err: any, file: any, fileList: any) {
  emit("error", err, file, fileList);
}

// 关闭对话框
const closeDialog = () => {
  // 重置数据
  formRef.value?.resetFields();
  emit("update:formData", {});
  emit("update:dialogVisible", false);
};

// 监听 props 数据变化
watch(
  () => props,
  (newProps) => {
    title.value = newProps.title;
    dialogVisible.value = newProps.dialogVisible;
    labelPosition.value = newProps.labelPosition;
    fields.value = newProps.fields;
    formData.value = newProps.formData;
  },
  { deep: true }
);

// 处理表单字段的 change 事件
// function handleChange(event: any) {
// }
</script>

<style scoped>
.el-input,
.el-select,
.el-textarea {
  width: 100%;
  max-width: 300px;
}

.el-textarea {
  max-width: 500px;
}

.el-select-dropdown__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  font-size: 20px;
}

.circular {
  display: inline;
  height: 30px;
  width: 30px;
  animation: loading-rotate 2s linear infinite;
}
.path {
  animation: loading-dash 1.5s ease-in-out infinite;
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-width: 2;
  stroke: var(--el-color-primary);
  stroke-linecap: round;
}
</style>
