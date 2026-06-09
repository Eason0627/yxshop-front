<template>
  <el-dialog
    v-model="dialogVisible"
    width="600"
    :close-on-press-escape="false"
    @close="onCancel"
    destroy-on-close
  >
    <template #header>
      <div class="mb-4 text-xl font-bold">{{ dialogType === 'add' ? '新增用户' : '编辑用户' }}</div>
    </template>
    <div class="content flex justify-center items-center p-4">
      <el-form
        ref="formRef"
        class="w-full"
        label-position="left"
        label-width="100px"
        :model="userForm"
        :rules="rules"
      >
        <el-form-item
          class="flex justify-center items-center"
          label="用户头像"
          prop="avatar"
        >
          <div
            class="image relative flex justify-center items-center w-24 h-24 rounded-full overflow-hidden"
            @mouseover="onMouseOver($event)"
            v-if="userForm.avatar"
          >
            <el-image
              :src="userForm.avatar"
              :zoom-rate="1.2"
              :max-scale="7"
              :min-scale="0.2"
              preview-teleported
              :preview-src-list="[userForm.avatar]"
              fit="cover"
              style="width: 100%; height: 100%"
            />
            <el-image-viewer
              v-if="showImageViewer"
              :url-list="[userForm.avatar]"
              @close="closeViewer"
            />
            <Transition name="fade">
              <div
                class="preview absolute flex justify-center items-center w-full h-full"
                @mouseout="onMouseOut($event)"
                v-show="editImage"
              >
                <div class="mask absolute w-full h-full bg-black opacity-40 z-5"></div>
                <div class="flex items-center text-white text-xl z-10">
                  <span class="mr-2 cursor-pointer" @click="zoomIn">
                    <el-icon><ZoomIn /></el-icon>
                  </span>
                  <span class="cursor-pointer" @click="delAvatar">
                    <el-icon><Delete /></el-icon>
                  </span>
                </div>
              </div>
            </Transition>
          </div>
          <div class="upload w-24 h-24 overflow-hidden" v-else>
            <FileUploader
              action="/upload"
              :multiple="false"
              :limit="1"
              :before-upload="validateImage"
              @change="uploadChange"
              @onSuccess="uploadSuccess"
              @onError="uploadError"
              disabled
            />
          </div>
        </el-form-item>

        <el-form-item label="用户名" prop="username" >
          <el-input
            v-model="userForm.username"
            placeholder="请输入用户名"
            clearable
            :disabled="dialogType === 'edit'"
            readonly
          />
        </el-form-item>

        <el-form-item label="昵称" prop="nick_name" >
          <el-input
            v-model="userForm.nick_name"
            placeholder="请输入昵称"
            clearable
            readonly
          />
        </el-form-item>

        <el-form-item label="密码" prop="password" :required="dialogType === 'add'">
          <el-input
            v-model="userForm.password"
            placeholder="请输入密码"
            clearable
            show-password
            type="password"
            readonly
          />
        </el-form-item>

        <el-form-item label="邮箱" prop="email" >
          <el-input
            v-model="userForm.email"
            placeholder="请输入邮箱"
            clearable
            readonly
          />
        </el-form-item>

        <el-form-item label="手机号" prop="phone" >
          <el-input
            v-model="userForm.phone"
            placeholder="请输入手机号"
            clearable
            readonly
          />
        </el-form-item>

        <el-form-item label="微信ID" prop="wechat_id">
          <el-input
            v-model="userForm.wechat_id"
            placeholder="请输入微信ID"
            clearable
            readonly
          />
        </el-form-item>

        <el-form-item label="角色" prop="role" required>
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="Admin" />
            <el-option label="商家" value="ShopOwner" />
            <el-option label="顾客" value="Customer" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status" required>
          <el-select v-model="userForm.status" placeholder="请选择状态">
            <el-option label="活跃" value="Active" />
            <el-option label="禁用" value="Inactive" />
          </el-select>
        </el-form-item>

        <!-- //性别改成展示，不允许编辑。 -->
        <el-form-item label="性别" prop="gender" >
          <el-input
            :value="genderText"
            placeholder="请输入性别"
            clearable
            readonly
          />
        </el-form-item>


        <el-form-item label="生日" prop="birth">
          <el-date-picker
            v-model="userForm.birth"
            type="date"
            placeholder="选择生日"
            value-format="YYYY-MM-DD"
            readonly
          />
        </el-form-item>

        <el-form-item label="默认地址" prop="default_address">
          <el-input
            v-model="userForm.default_address"
            placeholder="请输入默认地址"
            type="textarea"
            :rows="2"
            readonly
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onCancel">取消</el-button>
        <el-button type="primary" @click="onConfirm(formRef)">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect ,computed} from 'vue'
import { USER_STATUS } from '@/constants/status';
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import FileUploader from '@/components/upload/FileUploader.vue'
import User from '@/model/User'
import http from '@/utils/http'
// import { HttpResponse } from '@/utils/http'
import EventBus from '@/utils/event-bus'

interface Props {
  dialogVisible?: boolean
  dialogType?: string
  user?: User | undefined
}

interface Emits {
  (e: 'getData'): void
  (e: 'update:Dialog', formData?: User, flag?: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  dialogVisible: false,
  dialogType: 'add',
  user: undefined
})

const emit = defineEmits<Emits>()

const dialogVisible = ref(false)
const dialogType = ref('add')
const showImageViewer = ref(false)
const editImage = ref(false)
const avatarImage = ref('')
const formRef = ref<FormInstance>()

const userForm = reactive<User>({
  id: '',
  username: '',
  nick_name: '',
  password: '',
  email: '',
  phone: '',
  wechat_id: '',
  role: 'Customer',
  createTime: new Date(),
  updateTime: new Date(),
  status: USER_STATUS.ACTIVE,
  is_verified: 0,
  avatar: '',
  birth: null,
  gender: '',
  default_address: '',
  code: ''
})

const rules = reactive<FormRules<User>>({
 
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
})

// 计算属性：将 gender 转换为中文
const genderText = computed(() => {
  const map = {
    
    Male: '男',
    Female: '女',
    Other: '其他'
  };
  const gender = userForm.gender as keyof typeof map;
  return map[gender] || userForm.gender; // 默认显示原值，如果没有对应的映射
});

// 显示图片工具
const onMouseOver = (event: MouseEvent) => {
  event.preventDefault()
  const isOver = !(event.currentTarget as HTMLElement).contains(
    event.relatedTarget as HTMLElement
  )
  if (isOver) {
    editImage.value = true
  }
}

// 隐藏图片工具
const onMouseOut = (event: MouseEvent) => {
  event.preventDefault()
  const isOut = !(event.currentTarget as HTMLElement).contains(
    event.relatedTarget as HTMLElement
  )
  if (isOut) {
    editImage.value = false
  }
}

// 显示图片预览
const zoomIn = () => {
  showImageViewer.value = true
}

// 关闭图片预览
const closeViewer = () => {
  showImageViewer.value = false
}

// 删除头像
const delAvatar = () => {
  userForm.avatar = ''
  avatarImage.value = ''
  editImage.value = false
}

// 清空表单
const clearForm = () => {
  Object.assign(userForm, {
    id: '',
    username: '',
    nick_name: '',
    password: '',
    email: '',
    phone: '',
    wechat_id: '',
    role: 'Customer',
    status: USER_STATUS.ACTIVE,
    avatar: '',
    birth: undefined,
    gender: '',
    default_address: ''
  })
  avatarImage.value = ''
}

// 取消按钮
const onCancel = () => {
  clearForm()
  emit('update:Dialog', undefined, false)
}



// 确认按钮
const onConfirm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        

        if (dialogType.value === 'add') {
          await createUser()
        } else {
          await updateUser()
        }

        ElMessage.success(`${dialogType.value === 'add' ? '新增' : '更新'}用户成功`)
        emit('getData')
        EventBus.emit('updateTopTools')
        onCancel()
      } catch (error) {
        ElMessage.error(`${dialogType.value === 'add' ? '新增' : '更新'}用户失败`)
      }
    }
  })
}

// 创建用户
const createUser = async () => {
  await http.post('/users', userForm)
}

// 更新用户
const updateUser = async () => {
  await http.put(`/users/updateUser`, userForm)
}

// 验证图片格式
const validateImage = (file: File): boolean => {
  const isJPGOrPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJPGOrPNG) {
    ElMessage.error('请上传 JPEG 或 PNG 格式的图片')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

// 上传成功回调
const uploadSuccess = (response: any) => {
  userForm.avatar = response.data
}

// 上传失败回调
const uploadError = (error: any) => {
  console.error('上传失败', error)
  ElMessage.error('头像上传失败')
}

// 上传变化回调
const uploadChange = (file: any) => {
  const reader = new FileReader()
  reader.readAsDataURL(file.raw)
  reader.onloadend = () => {
    avatarImage.value = reader.result as string
    userForm.avatar = avatarImage.value
  }
}

// 监听props变化
watchEffect(() => {
  dialogVisible.value = props.dialogVisible
  dialogType.value = props.dialogType || 'add'
  
  if (props.user) {
    Object.assign(userForm, props.user)
    if (props.user.avatar) {
      avatarImage.value = props.user.avatar
    }
  } else {
    clearForm()
  }
})
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

.image {
  border: 1px dashed var(--el-border-color);
  &:hover {
    border-color: var(--el-color-primary);
  }
}

.upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 50%;
  &:hover {
    border-color: var(--el-color-primary);
  }
}
</style>