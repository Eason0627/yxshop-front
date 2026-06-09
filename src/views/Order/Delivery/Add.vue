<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <!-- 筛选条件卡片 -->
    <el-card class="mb-6 shadow-sm">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <div class="text-sm text-gray-500 mb-1">搜索类型</div>
          <el-select v-model="searchParams.searchType" placeholder="请选择" style="width: 100px">
            <el-option label="订单ID" value="orderId" />
            <el-option label="物流状态" value="status" />
            <el-option label="创建时间" value="createTime" />
          </el-select>
        </div>
        
        <div class="flex-1 max-w-sm">
          <div class="text-sm text-gray-500 mb-1">请输入内容</div>
          <el-input v-model="searchParams.keyword" placeholder="请输入搜索内容" clearable />
        </div>
        
        <div>
          <el-checkbox v-model="searchParams.enableDateRange" class="mr-2">时间范围</el-checkbox>
          <el-date-picker
            v-model="searchParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :disabled="!searchParams.enableDateRange"
          />
        </div>
        
        <div class="flex gap-2">
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">清除</el-button>
        </div>
      </div>
      
      <!-- 已选条件标签 -->
      <div v-if="selectedFilters.length > 0" class="mt-4 flex flex-wrap gap-2">
        <el-tag
          v-for="filter in selectedFilters"
          :key="filter.key"
          closable
          @close="removeFilter(filter.key)"
          class="flex items-center gap-1"
        >
          {{ filter.label }}: {{ filter.value }}
        </el-tag>
      </div>
    </el-card>
    
    <!-- 操作区域卡片 -->
    <el-card class="mb-6 shadow-sm">
      <div class="flex justify-between items-center">
        <el-button type="primary" @click="handleAdd" class="flex items-center">
          <el-icon class="mr-1"><plus /></el-icon>
          新增物流状态
        </el-button>
        
        <div class="flex items-center text-sm text-gray-600">
          <span class="mr-2">每页显示</span>
          <el-select v-model="pagination.pageSize" @change="fetchData" style="width:100px">
            <el-option label="10条" :value="10" />
            <el-option label="20条" :value="20" />
            <el-option label="50条" :value="50" />
            <el-option label="100条" :value="100" />
          </el-select>
        </div>
      </div>
    </el-card>
    
    <!-- 数据表格卡片 -->
    <el-card class="shadow-sm">
      <div class="table-container">
        <el-table
          :data="tableData"
          stripe
          style="width: 100%"
          class="mb-4"
          v-loading="loading"
        >
          <el-table-column prop="order_id" label="订单ID" width="180" />
          <el-table-column prop="status_code" label="物流状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status_code)" effect="light">
                {{ statusCodeMap[row.status_code] || '未知状态' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column prop="updated_at" label="更新时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.updated_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <!-- 分页 -->
      <div class="flex justify-between items-center mt-4 mb-2 px-2">
        <div class="text-sm text-gray-600">
          显示 {{ (pagination.currentPage - 1) * pagination.pageSize + 1 }} 至 
          {{ Math.min(pagination.currentPage * pagination.pageSize, pagination.total) }} 条，
          共 {{ pagination.total }} 条
        </div>
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="prev, pager, next, jumper"
          @current-change="fetchData"
          @size-change="fetchData"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog
      :destroy-on-close="true"
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="left"
      >
        <el-form-item label="订单ID" prop="order_id">
          <el-input v-model="formData.order_id" placeholder="请输入订单ID" />
        </el-form-item>
        <el-form-item label="物流状态" prop="status_code">
          <el-select v-model="formData.status_code" placeholder="请选择物流状态" class="w-full">
            <el-option
              v-for="code in Object.keys(statusCodeMap)"
              :key="code"
              :label="statusCodeMap[code]"
              :value="code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted ,inject} from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { OrderStatus } from '@/model/OrderStatus'
import { statusCodeMap, createEmptyOrderStatus } from '@/model/OrderStatus'
import { HttpClient,  } from '@/utils/http';

const http: HttpClient = inject("http") as HttpClient;

interface Logistics {
  id: number
  order_id: string
  status_code: string
  description: string
  created_at: string
  updated_at: string
}

interface PageInfo<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

interface Result {
  code: number
  message: string
  data: PageInfo<Logistics>
}
// 表格数据
const tableData = ref<OrderStatus[]>([])

// 搜索参数
const searchParams = reactive({
  searchType: 'order_id',
  keyword: '',
  enableDateRange: false,
  dateRange: []
})

// 分页参数
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 加载状态
const loading = ref(false)

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref<FormInstance>()
const formData = reactive<OrderStatus>(createEmptyOrderStatus())
const isEditMode = ref(false)

// 表单验证规则
const formRules: FormRules = {
  order_id: [
    { required: true, message: '请输入订单ID', trigger: 'blur' }
  ],
  status_code: [
    { required: true, message: '请选择物流状态', trigger: 'change' }
  ]
}

// 计算已选筛选条件
const selectedFilters = computed(() => {
  const filters = []
  
  if (searchParams.keyword) {
    filters.push({
      key: 'keyword',
      label: searchParams.searchType === 'orderId' ? '订单ID' : 
            searchParams.searchType === 'status' ? '物流状态' : '创建时间',
      value: searchParams.keyword
    })
  }
  
  if (searchParams.enableDateRange && searchParams.dateRange?.length === 2) {
    filters.push({
      key: 'dateRange',
      label: '时间范围',
      value: `${formatDate(searchParams.dateRange[0])} 至 ${formatDate(searchParams.dateRange[1])}`
    })
  }
  
  return filters
})

// 获取状态标签类型
const getStatusTagType = (code: string) => {
  switch(code) {
    case '1': return 'primary'    // 待发货
    case '2': return ''           // 已发货
    case '3': return 'warning'    // 运输中
    case '4': return 'warning'    // 派送中
    case '5': return 'success'    // 已签收
    case '6': return 'danger'     // 拒收/退货中
    case '7': return 'info'       // 退货完成
    case '8': return 'info'       // 已取消
    default: return 'info'
  }
}

// 初始化加载数据
onMounted(() => {
  fetchData()
})
// 构建查询参数对象
// const requestJSON: Record<string, any> = {};
// 获取数据
const fetchData = async () => {
  try {
    loading.value = true
    
    // 获取用户权限信息（根据您的实际项目调整）
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}')
    // const isAdmin = userInfo.role === 'admin' // 假设管理员role为'admin'
    const currentShop = JSON.parse(localStorage.getItem('currentShop') || '{}')
    const shopId = currentShop.shop_id // 假设商家信息中包含shopId

    // 构造请求参数
    const params: any = {
      key:'',
      pageNum: pagination.currentPage,
      pageSize: pagination.pageSize
    }

    // 构建查询条件对象
    const queryConditions: any = {}

    // 添加搜索条件
    if (searchParams.keyword) {
      if (searchParams.searchType === 'order_id') {
        queryConditions.order_id = searchParams.keyword
      } else if (searchParams.searchType === 'status') {
        queryConditions.status_code = searchParams.keyword
      } else if (searchParams.searchType === 'createTime') {
        // 处理时间范围查询
        if (searchParams.enableDateRange && searchParams.dateRange?.length === 2) {
          queryConditions.start_time = new Date(searchParams.dateRange[0]).toISOString()
          queryConditions.end_time = new Date(searchParams.dateRange[1]).toISOString()
        }
      }
    }

    // 如果不是管理员，添加店铺ID限制
    if (userInfo.role ==="ShopOwner") {
      queryConditions.shop_id = shopId
    }

    // 如果有查询条件，添加到params
    if (Object.keys(queryConditions).length > 0) {
      params.key = JSON.stringify(queryConditions)
    }
    // 调用后端API
    const response = await http.get<Result>('/logistics/getLogistics', { params })
    
    if (response.data.code === 200) {
      tableData.value = response.data.data.list
      // 修正拼写错误，将 praerInt 改为 parseInt
      // 由于 total 可能是字符串类型，先将其转换为数字类型
      // 同时考虑到 response.data.data.total 可能不是字符串，需要先转换为字符串再解析
      // pagination.total = response.data.data.total;
       pagination.total = parseInt(String(response.data.data.total));

    } else {
      ElMessage.error(response.data.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  fetchData()
}

// 重置搜索
const resetSearch = () => {
  searchParams.searchType = 'orderId'
  searchParams.keyword = ''
  searchParams.enableDateRange = false
  searchParams.dateRange = []
  handleSearch()
}


// 移除筛选条件
const removeFilter = (key: string) => {
  if (key === 'keyword') {
    searchParams.keyword = ''
  } else if (key === 'dateRange') {
    searchParams.enableDateRange = false
    searchParams.dateRange = []
  }
  handleSearch()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增物流状态'
  isEditMode.value = false
  Object.assign(formData, createEmptyOrderStatus())
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: OrderStatus) => {
  dialogTitle.value = '编辑物流状态'
  isEditMode.value = true
  Object.assign(formData, JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
}

// 删除
const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条物流状态记录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 调用后端删除接口
    const response = await http.delete('/logistics/bathDel', {
      data: [id.toString()] // 将id转换为字符串并放入数组
    })
    
    if (response.data.code === 200) {
      ElMessage.success(response.data.message || '删除成功')
      // 重新加载数据
      fetchData()
    } else {
      ElMessage.error(response.data.message || '删除失败')
    }
  } catch (error) {
    // 用户取消删除或请求失败
    if (error !== 'cancel') { // 不是用户主动取消的情况
      console.error('删除失败:', error)
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (isEditMode.value) {
      // 调用修改接口
      const response = await http.post('/logistics/updateLogistics', {
        id: formData.id,
        order_id: formData.order_id,
        status_code: formData.status_code,
        description: formData.description,
        // 如果需要，可以添加其他字段
      })
      
      if (response.data.code === 200) {
        ElMessage.success(response.data.message || '修改物流成功')
        // 重新加载数据
        fetchData()
      } else {
        ElMessage.warning(response.data.message || '物流ID不存在')
      }
    } else {
      // 添加新记录 - 调用添加接口
      const response = await http.post('/logistics/addLogistics', {
        order_id: formData.order_id,
        status_code: formData.status_code,
        description: formData.description
      })
      
      if (response.data.code === 200) {
        ElMessage.success(response.data.message || '添加物流成功')
        // 重新加载数据
        fetchData()
      } else {
        ElMessage.error(response.data.message || '添加物流失败')
      }
    }
    
    dialogVisible.value = false
  } catch (error: any) {
    console.error('操作失败:', error)
    if (error.response && error.response.data) {
      ElMessage.error(error.response.data.message || '操作失败')
    } else {
      ElMessage.error('操作失败，请稍后重试')
    }
  }
}

// 格式化日期
const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-')
}
</script>

<style scoped>
/* 新增表格容器样式 */
.table-container {
  max-height: calc(100vh - 400px); /* 根据页面布局调整这个值 */
  overflow-y: auto;
}

/* 固定表头 */
:deep(.el-table__header-wrapper) {
  position: sticky;
  top: 0;
  z-index: 10;
}


/* 使用 Tailwind CSS 补充样式 */
.el-card {
  @apply border border-gray-200;
}

.el-card + .el-card {
  @apply mt-4;
}

.el-table {
  @apply mt-4;
}

.el-pagination {
  @apply justify-end;
}

/* 对话框标题样式 */
:deep(.el-dialog__header) {
  @apply border-b border-gray-200 pb-4 mb-4;
}

/* 对话框底部按钮样式 */
:deep(.el-dialog__footer) {
  @apply border-t border-gray-200 pt-4 mt-4;
}

/* 表格行悬停效果 */
:deep(.el-table__body tr:hover>td) {
  @apply bg-gray-50;
}

/* 卡片标题样式 */
:deep(.el-card__header) {
  @apply bg-gray-50 border-b border-gray-200;
}
</style>
