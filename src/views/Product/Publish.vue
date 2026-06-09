<template>
  <div class="page">

    <!-- 顶部操作栏 -->
    <div class="mb-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button class="flex items-center gap-1.5 text-[13px] text-[#999] hover:text-[#FF6B00] transition-colors" @click="$router.back()">
            <i class="ri-arrow-left-line"></i>返回
          </button>
          <span class="text-[#E0E0E0]">|</span>
          <h2 class="text-[15px] font-semibold text-[#1A1A1A]">{{ isEdit ? '编辑商品' : '发布商品' }}</h2>
          <el-tag v-if="form.auditStatus === 'Pending'"  type="warning" size="small" effect="light">审核中</el-tag>
          <el-tag v-else-if="form.auditStatus === 'Approved'" type="success" size="small" effect="light">已通过</el-tag>
          <el-tag v-else-if="form.auditStatus === 'Rejected'" type="danger"  size="small" effect="light">已拒绝</el-tag>
        </div>
        <el-button type="primary" :loading="saving" @click="save('submit')">
          <i class="ri-send-plane-line mr-1"></i>{{ isEdit ? '保存修改' : '发布商品' }}
        </el-button>
      </div>
      <!-- 拒绝原因 -->
      <div v-if="form.auditStatus === 'Rejected' && form.auditReason"
        class="mt-3 flex items-start gap-2 px-4 py-3 bg-[#FFF2F0] border border-[#FFCCC7] rounded-lg text-[13px] text-[#CF1322]">
        <i class="ri-error-warning-line text-[16px] flex-shrink-0 mt-0.5"></i>
        <div><span class="font-medium mr-1">审核拒绝原因：</span>{{ form.auditReason }}</div>
      </div>
    </div>

    <div v-loading="pageLoading" class="flex gap-4 items-start">

      <!-- ── 左列 ── -->
      <div class="flex-1 min-w-0 space-y-4">

        <!-- 基本信息 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden bg-white">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-information-line mr-1.5 text-[#409EFF]"></i>基本信息</span>
          </div>
          <div class="p-5">
            <el-form :model="form" :rules="rules" ref="formRef" label-width="80px" size="default" @submit.prevent>
              <div class="grid grid-cols-[1fr_180px] gap-4">
                <el-form-item label="商品名称" prop="name">
                  <el-input v-model="form.name" placeholder="请输入商品名称" maxlength="60" show-word-limit />
                </el-form-item>
                <el-form-item label="货号">
                  <el-input v-model="form.productCode" placeholder="商家自定义货号" maxlength="32" clearable />
                </el-form-item>
              </div>
              <!-- 分类 / 店铺 / 品牌 三选器同一行 -->
              <div class="grid grid-cols-3 gap-3">
                <el-form-item label="商品分类" prop="categoryId">
                  <el-select v-model="form.categoryId" class="w-full" placeholder="请选择分类" clearable filterable>
                    <template v-for="cat in categoryTree" :key="cat.categoryId">
                      <el-option-group v-if="cat.children && cat.children.length" :label="cat.categoryName">
                        <el-option v-for="child in cat.children" :key="child.categoryId"
                          :value="child.categoryId" :label="child.categoryName">
                          <span class="flex items-center gap-1.5">
                            <i :class="categoryIcon(child.categoryName)" class="text-[#409EFF] text-[13px]"></i>
                            {{ child.categoryName }}
                          </span>
                        </el-option>
                      </el-option-group>
                      <el-option v-else :value="cat.categoryId" :label="cat.categoryName">
                        <span class="flex items-center gap-1.5">
                          <i :class="categoryIcon(cat.categoryName)" class="text-[#409EFF] text-[13px]"></i>
                          {{ cat.categoryName }}
                        </span>
                      </el-option>
                    </template>
                    <template #empty>
                      <div class="text-center text-[#CCC] py-4 text-[12px]">暂无分类，请先在商品分类管理中添加</div>
                    </template>
                  </el-select>
                </el-form-item>
                <el-form-item label="所属店铺">
                  <el-select v-model="form.shopId" class="w-full" placeholder="请选择店铺" clearable filterable :disabled="!isAdmin">
                    <el-option v-for="s in shops" :key="s.shopId || s.id" :label="s.displayName || s.shopName" :value="s.shopId || s.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="品牌">
                  <el-select v-model="form.brandId" class="w-full" clearable filterable placeholder="请选择品牌（可选）">
                    <el-option v-for="b in brands"
                      :key="b.shopId || b.id || b.brandId"
                      :label="b.displayName || b.shopName || b.brandName"
                      :value="b.shopId || b.id || b.brandId">
                      <span class="flex items-center gap-1.5">
                        <i class="ri-award-line text-[#FA8C16] text-[13px]"></i>
                        {{ b.displayName || b.shopName || b.brandName }}
                      </span>
                    </el-option>
                    <template #empty>
                      <div class="text-center text-[#CCC] py-4 text-[12px]">暂无品牌，请先在品牌管理中添加</div>
                    </template>
                  </el-select>
                </el-form-item>
              </div>
              <el-form-item label="商品简介">
                <el-input v-model="form.subtitle" type="textarea" :rows="2" placeholder="简短描述商品特点，展示在列表页" maxlength="200" show-word-limit />
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 商品图片 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden bg-white">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-image-line mr-1.5 text-[#FA8C16]"></i>商品图片</span>
          </div>
          <div class="p-5 flex gap-6">
            <div class="flex-shrink-0">
              <div class="text-[12px] text-[#555] font-medium mb-2">主图 <span class="text-[#FF4D4F]">*</span></div>
              <MediaPicker v-model="form.mainImage" :preview-size="120" bizType="product" />
              <div class="text-[11px] text-[#BBB] mt-1.5">建议 800×800px 以上</div>
            </div>
            <div class="w-px bg-[#F0F0F0] self-stretch"></div>
            <div class="flex-1 min-w-0 space-y-4">
              <div>
                <div class="text-[12px] text-[#555] font-medium mb-2">轮播图</div>
                <MediaPicker v-model="form.images" :multiple="true" :max-count="9" :preview-size="80" bizType="product" />
                <div class="text-[11px] text-[#BBB] mt-1.5">最多 9 张</div>
              </div>
              <div>
                <div class="text-[12px] text-[#555] font-medium mb-2">
                  商品视频 <span class="text-[11px] text-[#BBB] font-normal">（可选）</span>
                </div>
                <div v-if="form.videoUrl" class="relative mb-2 rounded-xl overflow-hidden bg-black group">
                  <video :src="form.videoUrl" controls class="w-full max-h-[200px] block" />
                  <button class="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-[#FF4D4F] rounded-lg flex items-center justify-center transition-colors"
                    @click="form.videoUrl = ''">
                    <i class="ri-delete-bin-line text-white text-sm"></i>
                  </button>
                </div>
                <div v-else class="flex gap-2">
                  <el-upload
                    :show-file-list="false"
                    :before-upload="handleVideoUpload"
                    accept="video/mp4,video/webm,video/quicktime"
                    class="flex-1"
                  >
                    <div class="flex items-center justify-center gap-2 h-[80px] border-2 border-dashed border-[#E0E0E0] rounded-xl hover:border-[#FF6B00] hover:bg-[#FFF8F3] transition-colors cursor-pointer px-4"
                      :class="videoUploading ? 'opacity-60 pointer-events-none' : ''">
                      <i v-if="videoUploading" class="ri-loader-4-line text-[#FF6B00] text-xl animate-spin"></i>
                      <i v-else class="ri-video-upload-line text-[#CCC] text-2xl"></i>
                      <span class="text-[12px] text-[#999]">{{ videoUploading ? '上传中...' : '点击上传视频到资源中心' }}</span>
                    </div>
                  </el-upload>
                </div>
                <p class="text-[11px] text-[#BBB] mt-1">支持 MP4 / WebM，建议不超过 200MB</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 商品规格（含默认价格/库存/重量） -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden bg-white">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-list-settings-line mr-1.5 text-[#FF6B00]"></i>商品规格</span>
            <span v-if="hasSpecs" class="ml-2 text-[11px] text-[#BBB]">{{ skuRows.length }} 个 SKU，{{ skuRows.filter(s=>s.enabled).length }} 个已启用</span>
          </div>
          <div class="p-4 space-y-4">

            <!-- 规格维度 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[12px] font-medium text-[#555]">规格维度 <span class="text-[#BBB] font-normal">（可选，添加颜色/尺码/版本等）</span></span>
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] text-[#BBB]">快捷：</span>
                  <el-button v-for="tpl in SPEC_TEMPLATES" :key="tpl.label" size="small" plain @click="applySpecTemplate(tpl)">{{ tpl.label }}</el-button>
                  <el-button v-if="specGroups.length > 0" size="small" text type="danger" @click="clearSpecGroups">清空</el-button>
                </div>
              </div>
              <div class="space-y-2">
                <div v-for="(group, gi) in specGroups" :key="gi"
                  class="grid grid-cols-[110px_1fr_32px] gap-3 items-start p-3 bg-[#FAFAFA] rounded-lg border border-[#F0F0F0]">
                  <el-input v-model="group.name" placeholder="规格名（如 颜色）" size="small" maxlength="8" @blur="rebuildSkus" />
                  <div class="flex flex-wrap gap-1.5 items-center">
                    <el-tag v-for="(val, vi) in group.values" :key="vi" closable size="small" @close="removeSpecValue(gi, vi)">{{ val }}</el-tag>
                    <el-input v-model="group.inputVal" placeholder="输入规格值，回车添加" size="small" class="!w-[150px]"
                      maxlength="20" @keyup.enter.stop="addSpecValue(gi)" />
                  </div>
                  <el-button type="danger" link size="small" @click="removeSpecGroup(gi)"><i class="ri-delete-bin-line"></i></el-button>
                </div>
              </div>
              <el-button plain size="small" class="mt-2" @click="addSpecGroup" :disabled="specGroups.length >= 3">
                <i class="ri-add-line mr-1"></i>添加规格维度（最多 3 个）
              </el-button>
            </div>

            <!-- SKU 表格（始终展示，无规格时为单默认行） -->
            <div class="border-t border-[#F5F5F5]"></div>
            <div>
              <div class="border border-[#F0F0F0] rounded-lg overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full text-[12px] border-collapse">
                    <thead>
                      <tr class="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                        <!-- 无规格：可编辑的规格名称列；有规格：各维度列 -->
                        <th v-if="!hasSpecs" class="px-3 py-2.5 text-left font-semibold text-[#555] border-r border-[#F0F0F0]" style="width:130px">规格名称</th>
                        <th v-for="g in validSpecGroups" :key="g.name"
                          class="px-3 py-2.5 text-left font-semibold text-[#555] whitespace-nowrap border-r border-[#F0F0F0]">{{ g.name }}</th>
                        <th class="px-3 py-2.5 text-left font-semibold text-[#555] border-r border-[#F0F0F0]" style="width:90px">图片</th>
                        <th class="px-3 py-2.5 text-left font-semibold text-[#555] border-r border-[#F0F0F0]" style="width:120px">SKU编码</th>
                        <th class="px-3 py-2 text-left font-semibold text-[#555] border-r border-[#F0F0F0]" style="width:140px">
                          <div class="flex items-center justify-between gap-1">
                            <span><span class="text-[#FF4D4F]">*</span> 售价（元）</span>
                            <button class="text-[#409EFF] hover:text-[#66B1FF] text-[10px] whitespace-nowrap" @click="openBatch('price')">批量</button>
                          </div>
                        </th>
                        <th class="px-3 py-2 text-left font-semibold text-[#555] border-r border-[#F0F0F0]" style="width:140px">
                          <div class="flex items-center justify-between gap-1">
                            <span>原价（元）</span>
                            <button class="text-[#409EFF] hover:text-[#66B1FF] text-[10px] whitespace-nowrap" @click="openBatch('originalPrice')">批量</button>
                          </div>
                        </th>
                        <th class="px-3 py-2 text-left font-semibold text-[#555] border-r border-[#F0F0F0]" style="width:120px">
                          <div class="flex items-center justify-between gap-1">
                            <span><span class="text-[#FF4D4F]">*</span> 库存</span>
                            <button class="text-[#409EFF] hover:text-[#66B1FF] text-[10px] whitespace-nowrap" @click="openBatch('stock')">批量</button>
                          </div>
                        </th>
                        <th class="px-3 py-2 text-left font-semibold text-[#555] border-r border-[#F0F0F0]" style="width:120px">
                          <div class="flex items-center justify-between gap-1">
                            <span>重量(kg)</span>
                            <button class="text-[#409EFF] hover:text-[#66B1FF] text-[10px] whitespace-nowrap" @click="openBatch('weight')">批量</button>
                          </div>
                        </th>
                        <th class="px-3 py-2.5 text-center font-semibold text-[#555]" style="width:52px">启用</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(sku, si) in skuRows" :key="sku.specKey"
                        class="border-b border-[#F5F5F5] last:border-b-0"
                        :class="sku.enabled ? 'bg-white' : 'bg-[#FAFAFA] opacity-60'">
                        <!-- 无规格：可编辑规格名称 -->
                        <td v-if="!hasSpecs" class="px-2 py-1.5 border-r border-[#F5F5F5]">
                          <el-input v-model="sku.specLabel" size="small" placeholder="如：默认款、标准版" :disabled="!sku.enabled" />
                        </td>
                        <!-- 有规格：合并单元格显示规格值 -->
                        <template v-for="(g, gi) in validSpecGroups" :key="g.name">
                          <td v-if="si % skuBlockSize(gi) === 0" :rowspan="skuBlockSize(gi)"
                            class="px-3 py-2 border-r border-[#F0F0F0] whitespace-nowrap font-medium text-[#333] align-middle"
                            :class="{ 'border-b border-[#F0F0F0]': si + skuBlockSize(gi) < skuRows.length }">
                            {{ sku.specs[g.name] }}
                          </td>
                        </template>
                        <!-- 图片：直接用 MediaPicker，无需额外弹窗 -->
                        <td class="px-2 py-1.5 border-r border-[#F5F5F5]">
                          <MediaPicker v-model="sku.image" :preview-size="68" bizType="product" />
                        </td>
                        <!-- SKU编码 -->
                        <td class="px-2 py-1.5 border-r border-[#F5F5F5]">
                          <el-input v-model="sku.skuCode" size="small" placeholder="货号/编码" :disabled="!sku.enabled" />
                        </td>
                        <!-- 售价 -->
                        <td class="px-2 py-1.5 border-r border-[#F5F5F5]">
                          <el-input-number v-model="sku.price" :min="0" :precision="2" size="small" class="!w-full" controls-position="right" :disabled="!sku.enabled" />
                        </td>
                        <!-- 原价 -->
                        <td class="px-2 py-1.5 border-r border-[#F5F5F5]">
                          <el-input-number v-model="sku.originalPrice" :min="0" :precision="2" size="small" class="!w-full" controls-position="right" :disabled="!sku.enabled" />
                        </td>
                        <!-- 库存 -->
                        <td class="px-2 py-1.5 border-r border-[#F5F5F5]">
                          <el-input-number v-model="sku.stock" :min="0" size="small" class="!w-full" controls-position="right" :disabled="!sku.enabled" />
                        </td>
                        <!-- 重量 -->
                        <td class="px-2 py-1.5 border-r border-[#F5F5F5]">
                          <el-input-number v-model="sku.weight" :min="0" :precision="3" :step="0.1" size="small" class="!w-full" controls-position="right" :disabled="!sku.enabled" />
                        </td>
                        <!-- 启用 -->
                        <td class="px-2 py-1.5 text-center">
                          <el-switch v-model="sku.enabled" size="small" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="flex items-center gap-3 mt-2 text-[11px] text-[#999]">
                <el-button v-if="hasSpecs" size="small" text type="primary" @click="autoGenSkuCodes">自动生成编码</el-button>
                <span class="text-[#BBB]">原价仅用于展示划线价，不参与计算 · 点击列标题「批量」可批量填写</span>
              </div>
            </div>

          </div>
        </div>

        <!-- 商品卖点 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden bg-white">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-star-line mr-1.5 text-[#52C41A]"></i>商品卖点
              <span class="ml-1 text-[11px] text-[#BBB] font-normal">最多 5 条</span></span>
          </div>
          <div class="p-4">
            <div class="flex flex-wrap gap-2 mb-2">
              <el-tag v-for="(f, fi) in form.featureList" :key="fi" closable type="success" effect="light" @close="removeFeature(fi)">{{ f }}</el-tag>
            </div>
            <div v-if="form.featureList.length < 5" class="flex gap-2">
              <el-input v-model="featureInput" placeholder="输入卖点，回车添加（如：12期免息、顺丰包邮）"
                size="small" class="flex-1" maxlength="20" show-word-limit @keyup.enter="addFeature" />
              <el-button size="small" @click="addFeature">添加</el-button>
            </div>
            <div v-else class="text-[11px] text-[#BBB]">已达最大数量（5条）</div>
          </div>
        </div>

        <!-- 商品详情（WangEditor 精简工具栏） -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden bg-white">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-file-text-line mr-1.5 text-[#13C2C2]"></i>商品详情</span>
          </div>
          <div>
            <Toolbar :editor="editorRef" :defaultConfig="toolbarConfig" class="border-b border-[#F0F0F0]" />
            <Editor v-model="form.description" :defaultConfig="editorConfig"
              style="min-height: 320px; overflow-y: hidden;" @onCreated="handleEditorCreated" />
          </div>
        </div>

      </div>

      <!-- ── 右列（sticky）── -->
      <div class="w-[300px] flex-shrink-0 space-y-3 sticky top-4 self-start">

        <!-- 物流 & 限购 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden bg-white">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-truck-line mr-1.5 text-[#1677FF]"></i>物流 & 限购</span>
          </div>
          <div class="p-4">
            <el-form :model="form" label-width="68px" size="default">
              <el-form-item label="运费">
                <div class="flex items-center gap-2 w-full">
                  <el-radio-group v-model="form.shippingType" size="small">
                    <el-radio-button value="free">包邮</el-radio-button>
                    <el-radio-button value="fixed">固定</el-radio-button>
                  </el-radio-group>
                  <el-input-number v-if="form.shippingType === 'fixed'"
                    v-model="form.shippingFee" :min="0" :precision="2" size="small"
                    class="flex-1" controls-position="right" placeholder="元" />
                </div>
              </el-form-item>
              <el-form-item label="发货仓库">
                <div class="flex items-center gap-2 w-full">
                  <el-select v-model="form.warehouseId" class="flex-1" placeholder="请选择发货仓库" clearable
                    @change="onWarehouseChange">
                    <el-option v-for="w in warehouses" :key="w.id" :value="w.id"
                      :label="w.name + (w.isDefault === 1 ? ' (默认)' : '')">
                      <div class="flex flex-col py-0.5">
                        <span class="text-[13px]">{{ w.name }}<el-tag v-if="w.isDefault===1" size="small" type="warning" effect="light" class="ml-1.5">默认</el-tag></span>
                        <span v-if="w.fullAddress" class="text-[11px] text-[#999] truncate max-w-[220px]">{{ w.fullAddress }}</span>
                      </div>
                    </el-option>
                  </el-select>
                  <el-button size="small" plain @click="goToWarehouse">
                    <i class="ri-settings-3-line mr-1"></i>管理
                  </el-button>
                </div>
              </el-form-item>
              <el-form-item label="发货时效">
                <el-select v-model="form.shippingDays" class="w-full">
                  <el-option :value="1"  label="24小时内" />
                  <el-option :value="2"  label="48小时内" />
                  <el-option :value="7"  label="7天内" />
                  <el-option :value="15" label="15天内" />
                  <el-option :value="0"  label="预售另约" />
                </el-select>
              </el-form-item>
              <el-form-item label="每人限购">
                <div class="flex items-center gap-1.5 w-full">
                  <el-input-number v-model="form.purchaseLimit" :min="0" :step="1" class="flex-1" controls-position="right" />
                  <span class="text-[11px] text-[#999]">件，0=不限</span>
                </div>
              </el-form-item>
              <el-form-item label="最小起订">
                <div class="flex items-center gap-1.5 w-full">
                  <el-input-number v-model="form.moq" :min="1" :step="1" class="flex-1" controls-position="right" />
                  <span class="text-[11px] text-[#999]">件</span>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 标签 & 设置 -->
        <div class="rounded-xl border border-[#F0F0F0] overflow-hidden bg-white">
          <div class="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#F0F0F0]">
            <span class="text-[12px] font-semibold text-[#555]"><i class="ri-settings-3-line mr-1.5 text-[#722ED1]"></i>标签 & 设置</span>
          </div>
          <div class="p-4">
            <el-form :model="form" label-width="68px" size="default">
              <el-form-item label="上架状态">
                <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" />
              </el-form-item>
              <el-form-item label="标签文字">
                <el-input v-model="form.tag" placeholder="新品、热销等" maxlength="6" clearable />
              </el-form-item>
              <template v-if="form.tag">
                <el-form-item label="文字颜色">
                  <div class="flex items-center gap-2 w-full">
                    <el-color-picker v-model="form.tagColor" size="small" />
                    <el-input v-model="form.tagColor" class="flex-1" placeholder="#FFFFFF" />
                  </div>
                </el-form-item>
                <el-form-item label="背景颜色">
                  <div class="flex items-center gap-2 w-full">
                    <el-color-picker v-model="form.tagBg" size="small" />
                    <el-input v-model="form.tagBg" class="flex-1" placeholder="#FF4D4F" />
                  </div>
                </el-form-item>
                <div class="flex gap-1.5 -mt-1 mb-2">
                  <span class="text-[11px] text-[#999] self-center">预设：</span>
                  <button v-for="c in TAG_PRESETS" :key="c.bg" class="w-5 h-5 rounded-full border-2 transition-all"
                    :class="form.tagBg === c.bg ? 'border-[#333] scale-110' : 'border-transparent'"
                    :style="{ backgroundColor: c.bg }" @click="form.tagColor = c.text; form.tagBg = c.bg" />
                </div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[11px] text-[#999]">预览：</span>
                  <span class="px-2 py-0.5 rounded text-[11px]"
                    :style="{ color: form.tagColor||'#fff', backgroundColor: form.tagBg||'#FF4D4F' }">
                    {{ form.tag }}
                  </span>
                </div>
              </template>
            </el-form>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-col gap-2">
          <el-button type="primary" size="large" :loading="saving" @click="save('submit')" class="!w-full !m-0">
            <i class="ri-send-plane-line mr-1"></i>{{ isEdit ? '保存修改' : '提交审核' }}
          </el-button>
          <el-button v-if="!isEdit || form.auditStatus === 'Draft' || form.auditStatus === ''"
            size="large" :loading="saving" @click="save('draft')" class="!w-full !m-0">
            <i class="ri-draft-line mr-1"></i>保存草稿
          </el-button>
          <el-button size="large" @click="$router.back()" class="!w-full !m-0">取消</el-button>
        </div>

      </div>
    </div>

    <!-- 统一批量填写弹窗 -->
    <el-dialog v-model="batchDialog.visible" :title="`批量填写${batchDialog.label}`" width="280px" align-center>
      <div class="flex justify-center py-2">
        <el-input-number
          v-model="batchDialog.val"
          :min="0"
          :precision="batchDialog.precision"
          :step="batchDialog.step"
          controls-position="right"
          class="!w-[180px]"
        />
      </div>
      <template #footer>
        <div class="flex justify-center gap-2">
          <el-button @click="batchDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="applyBatch">应用全部</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, shallowRef, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import { adminProductApi, adminShopApi, warehouseApi, fileApi } from '@/utils/admin-api';
import { usePermission } from '@/utils/permission';
import { userShopStore } from '@/store/index';
import { BASE_URL } from '@/utils/http';
import MediaPicker from '@/components/MediaPicker/MediaPicker.vue';

const router    = useRouter();
const route     = useRoute();
const { isAdmin } = usePermission();
const shopStore   = userShopStore();

const productId = computed(() => route.query.id as string | undefined);
const isEdit    = computed(() => !!productId.value);

const videoUploading = ref(false);
const handleVideoUpload = async (file: File) => {
  videoUploading.value = true;
  try {
    const res: any = await fileApi.upload(file, 'product');
    const url = res?.data?.data?.url || res?.data?.url || '';
    if (url) {
      form.videoUrl = url;
      ElMessage.success('视频已上传到资源中心');
    }
  } catch {
    ElMessage.error('视频上传失败');
  } finally {
    videoUploading.value = false;
  }
  return false;
};

// ── WangEditor ───────────────────────────────────────────────────────────────
const editorRef = shallowRef<IDomEditor | null>(null);

// 精简工具栏：排除字体族/行高/待办/表情/公式/代码块/视频/全屏/表格
const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: [
    'fontFamily', 'lineHeight',
    'todo', 'emotion', 'insertFormula',
    'codeBlock', 'code',
    'group-video', 'fullScreen',
    'insertTable',
    'indent', 'delIndent',
  ],
};

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '详细介绍商品特点、规格参数、使用说明等...',
  MENU_CONF: {
    uploadImage: {
      server: `${BASE_URL}/files/upload`,
      fieldName: 'file',
      headers: { Authorization: localStorage.getItem('token') || '' },
      customInsert(res: any, insertFn: (url: string, alt: string, href: string) => void) {
        const url = res.data?.url || res.data?.objectKey || '';
        if (url) insertFn(url, '', url);
      },
    },
  },
};

function handleEditorCreated(editor: IDomEditor) { editorRef.value = editor; }
onUnmounted(() => editorRef.value?.destroy());

// ── 常量 ─────────────────────────────────────────────────────────────────────
const TAG_PRESETS = [
  { bg: '#FF4D4F', text: '#FFFFFF' }, { bg: '#FF6B00', text: '#FFFFFF' },
  { bg: '#52C41A', text: '#FFFFFF' }, { bg: '#1677FF', text: '#FFFFFF' },
  { bg: '#722ED1', text: '#FFFFFF' }, { bg: '#555555', text: '#FFFFFF' },
];

const SPEC_TEMPLATES = [
  { label: '颜色+尺码', groups: [{ name: '颜色', values: ['黑色','白色','红色','蓝色'] }, { name: '尺码', values: ['S','M','L','XL','XXL'] }] },
  { label: '版本+存储', groups: [{ name: '版本', values: ['标准版','Pro版','Ultra版'] }, { name: '存储', values: ['128GB','256GB','512GB','1TB'] }] },
  { label: '颜色+容量', groups: [{ name: '颜色', values: ['黑色','白色','蓝色'] }, { name: '容量', values: ['250ml','500ml','1L'] }] },
  { label: '颜色+规格', groups: [{ name: '颜色', values: ['黑色','白色'] }, { name: '规格', values: ['标准款','升级款','旗舰款'] }] },
];

// ── 表单 ─────────────────────────────────────────────────────────────────────
const formRef     = ref<FormInstance>();
const pageLoading = ref(false);
const saving      = ref(false);

const form = reactive({
  name:          '',
  productCode:   '',
  categoryId:    null as number | null,
  shopId:        null as number | null,
  brandId:       null as number | null,
  subtitle:      '',
  description:   '',
  price:         null as number | null,
  originalPrice: null as number | null,
  stock:         null as number | null,
  weight:        null as number | null,
  shippingType:  'free',
  shippingFee:   null as number | null,
  warehouseId:   null as number | null,
  shipFrom:      '',              // 仍保留用于展示（从仓库自动填充）
  shippingDays:  1 as number | null,
  purchaseLimit: 0 as number | null,
  moq:           1 as number | null,
  videoUrl:      '',
  mainImage:     '',
  images:        [] as string[],
  featureList:   [] as string[],
  tag:           '',
  tagColor:      '#FFFFFF',
  tagBg:         '#FF4D4F',
  status:        1,
  auditStatus:   '',
  auditReason:   '',
});

// 只保留 name/category/mainImage 的 el-form 校验；price/stock 在 save() 手动检查
const rules = {
  name:       [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  mainImage:  [{ required: true, message: '请上传商品主图', trigger: 'change' }],
};

// ── 商品卖点 ─────────────────────────────────────────────────────────────────
const featureInput = ref('');
function addFeature() {
  const val = featureInput.value.trim();
  if (!val || form.featureList.length >= 5) return;
  if (!form.featureList.includes(val)) form.featureList.push(val);
  featureInput.value = '';
}
function removeFeature(fi: number) { form.featureList.splice(fi, 1); }

// ── 规格 & SKU ────────────────────────────────────────────────────────────────
interface SpecGroup { name: string; values: string[]; inputVal: string; }
interface SkuRow {
  specKey:       string;
  specs:         Record<string,string>;
  specLabel:     string;   // 无规格时用户自定义的规格名称（如"默认款"）
  skuCode:       string;
  price:         number | null;
  originalPrice: number | null;
  stock:         number | null;
  weight:        number | null;
  image:         string;
  enabled:       boolean;
}
const DEFAULT_SKU_KEY = '__default__';
function emptySkuRow(overrides: Partial<SkuRow> = {}): SkuRow {
  return { specKey:'', specs:{}, specLabel:'默认', skuCode:'', price:null, originalPrice:null, stock:null, weight:null, image:'', enabled:true, ...overrides };
}

const specGroups    = ref<SpecGroup[]>([]);
const skuRows       = ref<SkuRow[]>([]);

const validSpecGroups = computed(() => specGroups.value.filter(g => g.name.trim() && g.values.length > 0));
const hasSpecs        = computed(() => validSpecGroups.value.length > 0);

function skuBlockSize(gi: number) { return validSpecGroups.value.slice(gi+1).reduce((a,g) => a*g.values.length, 1); }
function cartesian(groups: SpecGroup[]) {
  const valid = groups.filter(g => g.name && g.values.length > 0);
  if (!valid.length) return [];
  return valid.reduce<Record<string,string>[]>((acc, g) => {
    if (!acc.length) return g.values.map(v => ({ [g.name]: v }));
    return acc.flatMap(prev => g.values.map(v => ({ ...prev, [g.name]: v })));
  }, []);
}
function specKeyOf(specs: Record<string,string>) { return Object.values(specs).join('/'); }
function rebuildSkus() {
  const combos = cartesian(specGroups.value);
  if (combos.length === 0) {
    // 无规格：保留（或初始化）单行默认 SKU
    const prev = skuRows.value[0];
    skuRows.value = [emptySkuRow({ specKey: DEFAULT_SKU_KEY, ...(prev ? prev : {}) })];
    return;
  }
  const existing = new Map(skuRows.value.map(s => [s.specKey, s]));
  skuRows.value = combos.map(specs => {
    const key = specKeyOf(specs);
    const prev = existing.get(key);
    return prev ? { ...prev, specs } : emptySkuRow({ specKey: key, specs });
  });
}
function addSpecGroup()  { if (specGroups.value.length < 3) specGroups.value.push({ name:'', values:[], inputVal:'' }); }
function removeSpecGroup(gi: number) { specGroups.value.splice(gi,1); rebuildSkus(); }
function addSpecValue(gi: number) {
  const val = specGroups.value[gi].inputVal.trim();
  if (!val) return;
  if (!specGroups.value[gi].values.includes(val)) { specGroups.value[gi].values.push(val); rebuildSkus(); }
  specGroups.value[gi].inputVal = '';
}
function removeSpecValue(gi: number, vi: number) { specGroups.value[gi].values.splice(vi,1); rebuildSkus(); }
function applySpecTemplate(tpl: typeof SPEC_TEMPLATES[0]) {
  specGroups.value = tpl.groups.map(g => ({ name: g.name, values: [...g.values], inputVal: '' }));
  rebuildSkus();
}
function clearSpecGroups() { specGroups.value = []; skuRows.value = []; }
function autoGenSkuCodes() {
  skuRows.value.forEach(s => {
    if (!s.skuCode && s.specKey !== DEFAULT_SKU_KEY)
      s.skuCode = Object.values(s.specs).join('-').toUpperCase().replace(/\s+/g,'');
  });
  ElMessage.success('编码已自动生成，可手动修改');
}

// SKU 图片直接用 MediaPicker 组件，无需额外弹窗

type BatchField = 'price' | 'originalPrice' | 'stock' | 'weight';
const BATCH_META: Record<BatchField, { label: string; precision: number; step: number }> = {
  price:         { label: '售价（元）', precision: 2, step: 1 },
  originalPrice: { label: '原价（元）', precision: 2, step: 1 },
  stock:         { label: '库存',       precision: 0, step: 1 },
  weight:        { label: '重量(kg)',   precision: 3, step: 0.1 },
};
const batchDialog = ref({ visible: false, field: 'price' as BatchField, label: '', precision: 2, step: 1, val: null as number | null });
function openBatch(field: BatchField) {
  const meta = BATCH_META[field];
  batchDialog.value = { visible: true, field, label: meta.label, precision: meta.precision, step: meta.step, val: null };
}
function applyBatch() {
  const { field, val } = batchDialog.value;
  if (val != null) skuRows.value.forEach(s => { if (s.enabled) (s as any)[field] = val; });
  batchDialog.value.visible = false;
}

// ── 辅助数据 ──────────────────────────────────────────────────────────────────
const categoryTree = ref<any[]>([]); const shops = ref<any[]>([]); const brands = ref<any[]>([]);
const warehouses   = ref<any[]>([]);

const CATEGORY_ICON_MAP: Record<string, string> = {
  '数码': 'ri-smartphone-line', '手机': 'ri-smartphone-line', '电脑': 'ri-computer-line',
  '家电': 'ri-tv-line', '电视': 'ri-tv-line',
  '运动': 'ri-run-line', '健身': 'ri-heart-pulse-line',
  '生活': 'ri-home-heart-line', '家居': 'ri-home-4-line',
  '图书': 'ri-book-2-line', '书籍': 'ri-book-line',
  '食品': 'ri-restaurant-line', '零食': 'ri-cake-line',
  '美妆': 'ri-magic-line', '护肤': 'ri-sparkling-line',
  '箱包': 'ri-handbag-line', '服装': 'ri-shirt-line',
  '玩具': 'ri-gamepad-line', '母婴': 'ri-baby-line',
  '汽车': 'ri-car-line', '工具': 'ri-tools-line',
};
function categoryIcon(name: string) {
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (name && name.includes(key)) return icon;
  }
  return 'ri-price-tag-3-line';
}

const loadAuxData = async () => {
  const [catRes, shopRes, brandRes, warehouseRes] = await Promise.allSettled([
    adminProductApi.adminCategories(),
    isAdmin ? adminShopApi.list({ pageNum:1, pageSize:200 }) : adminShopApi.getMyShop(),
    fetch(`${BASE_URL}/app/brands?pageNum=1&pageSize=200`).then(r => r.json()),
    warehouseApi.list(),
  ]);
  if (catRes.status==='fulfilled') { const d=(catRes.value as any).data?.data||(catRes.value as any).data||[]; categoryTree.value=Array.isArray(d)?d:[]; }
  if (shopRes.status==='fulfilled') {
    const d=(shopRes.value as any).data?.data||(shopRes.value as any).data||{};
    shops.value=Array.isArray(d)?d:(d.records||(d?[d]:[]));
    if (!isAdmin && shops.value.length>0 && !form.shopId) form.shopId=shops.value[0].shopId||shops.value[0].id;
  }
  if (brandRes.status==='fulfilled') { const d=(brandRes.value as any)?.data?.records||(brandRes.value as any)?.data||[]; brands.value=Array.isArray(d)?d:[]; }
  if (warehouseRes.status==='fulfilled') { const d=(warehouseRes.value as any).data?.data||(warehouseRes.value as any).data||[]; warehouses.value=Array.isArray(d)?d:[]; }
  // 新建时自动选中默认仓库
  if (!isEdit.value && !form.warehouseId) {
    const def = warehouses.value.find((w: any) => w.isDefault === 1);
    if (def) { form.warehouseId = def.id; form.shipFrom = def.fullAddress || def.city || ''; }
  }
};

// 选中仓库时同步 shipFrom（供展示）
function onWarehouseChange(id: number | null) {
  const w = warehouses.value.find((x: any) => x.id === id);
  form.shipFrom = w ? (w.fullAddress || w.city || '') : '';
}

// 跳转到仓库管理页
function goToWarehouse() { router.push('/shop/warehouse'); }

// ── 加载商品 ──────────────────────────────────────────────────────────────────
const loadProduct = async () => {
  if (!productId.value) return;
  pageLoading.value = true;
  try {
    const res: any = await adminProductApi.detail(productId.value);
    const p = res.data?.data || res.data;
    if (!p) return;
    form.name          = p.name || '';
    form.productCode   = p.productCode || '';
    form.categoryId    = p.categoryId || null;
    form.shopId        = p.shopId || null;
    form.brandId       = p.brandShopId || null;
    form.subtitle      = p.subtitle || '';
    form.description   = p.description || '';
    form.price         = p.price ?? null;
    form.originalPrice = p.originalPrice ?? null;
    form.stock         = p.stock ?? null;
    form.weight        = p.weight ?? null;
    form.shippingType  = p.shippingType || 'free';
    form.shippingFee   = p.shippingFee ?? null;
    form.warehouseId   = p.warehouseId ?? null;
    form.shipFrom      = p.shipFrom || '';
    form.shippingDays  = p.shippingDays ?? 1;
    form.purchaseLimit = p.purchaseLimit ?? 0;
    form.moq           = p.moq ?? 1;
    form.videoUrl      = p.videoUrl || '';
    form.mainImage     = p.mainImage || p.image || '';
    form.images        = p.images ? (Array.isArray(p.images) ? p.images : String(p.images).split(',').filter(Boolean)) : [];
    form.tag           = p.tag || '';
    form.tagColor      = p.tagColor || '#FFFFFF';
    form.tagBg         = p.tagBg || '#FF4D4F';
    form.status        = p.status ?? 1;
    form.auditStatus   = p.auditStatus || '';
    form.auditReason   = p.auditReason || '';
    if (p.features) { try { form.featureList = JSON.parse(p.features); } catch { form.featureList = []; } }
    if (p.specs) {
      try {
        const parsed = typeof p.specs==='string' ? JSON.parse(p.specs) : p.specs;
        if (parsed?.groups) {
          specGroups.value = parsed.groups.map((g: any) => ({ name:g.name||'', values:g.values||[], inputVal:'' }));
          if (parsed.skus) skuRows.value = parsed.skus.map((s: any) => emptySkuRow({
            specKey:s.specKey||'', specs:s.specs||{}, specLabel:s.specLabel||'默认', skuCode:s.skuCode||'',
            price:s.price??null, originalPrice:s.originalPrice??null,
            stock:s.stock??null, weight:s.weight??null,
            image:s.image||'', enabled:s.enabled!==false,
          }));
        } else if (Array.isArray(parsed) && parsed[0]?.label) {
          specGroups.value = parsed.map((g: any) => ({ name:g.label||'', values:g.values||[], inputVal:'' }));
          rebuildSkus();
        }
      } catch { /* ignore */ }
    } else {
      // 无规格时用商品级价格/库存/重量初始化默认 SKU 行
      skuRows.value = [emptySkuRow({
        specKey: DEFAULT_SKU_KEY,
        price:         p.price ?? null,
        originalPrice: p.originalPrice ?? null,
        stock:         p.stock ?? null,
        weight:        p.weight ?? null,
      })];
    }
  } finally { pageLoading.value = false; }
};

// ── 离开提醒 ──────────────────────────────────────────────────────────────────
let initialSnapshot = '';
function snapshot() { return JSON.stringify({ name:form.name, price:form.price, stock:form.stock, mainImage:form.mainImage, description:form.description }); }
onBeforeRouteLeave(async (_to, _from, next) => {
  if (!isEdit.value || initialSnapshot==='' || snapshot()===initialSnapshot) { next(); return; }
  try {
    await ElMessageBox.confirm('当前页面有未保存的修改，确定要离开吗？','离开确认',
      { confirmButtonText:'离开', cancelButtonText:'继续编辑', type:'warning' });
    next();
  } catch { next(false); }
});

// ── 保存 ─────────────────────────────────────────────────────────────────────
const save = async (mode: 'submit' | 'draft') => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (!form.mainImage) { ElMessage.warning('请上传商品主图'); return; }
  // 从 skuRows 校验：始终至少 1 行
  const enabledSkus = skuRows.value.filter(s => s.enabled);
  if (mode === 'submit') {
    if (!enabledSkus.length) { ElMessage.warning('请至少启用一行 SKU'); return; }
    if (enabledSkus.some(s => !s.price || s.price <= 0)) { ElMessage.warning('请为所有启用的 SKU 设置售价'); return; }
    if (enabledSkus.some(s => s.stock == null || s.stock < 0)) { ElMessage.warning('请为所有启用的 SKU 设置库存'); return; }
  }

  saving.value = true;
  try {
    // 从 SKU 行推导商品级价格/库存/重量/原价
    const prices = enabledSkus.map(s => s.price||0).filter(p => p>0);
    const finalPrice    = prices.length ? Math.min(...prices) : 0;
    const finalStock    = enabledSkus.reduce((sum,s) => sum+(s.stock||0), 0);
    const finalWeight   = enabledSkus[0]?.weight ?? null;
    const finalOriginal = enabledSkus[0]?.originalPrice ?? null;

    // specs JSON（有规格时才写入）
    const specsJson = hasSpecs.value ? JSON.stringify({
      groups: specGroups.value.map(g => ({ name:g.name, values:g.values })),
      skus:   skuRows.value.map(s => ({
        specKey:s.specKey, specs:s.specs, specLabel:s.specLabel, skuCode:s.skuCode,
        price:s.price, originalPrice:s.originalPrice, stock:s.stock, weight:s.weight,
        image:s.image, enabled:s.enabled,
      })),
    }) : null;

    const payload: Record<string,any> = {
      name:          form.name.trim(),
      productCode:   form.productCode || null,
      categoryId:    form.categoryId,
      shopId:        form.shopId,
      brandShopId:   form.brandId ?? null,
      subtitle:      form.subtitle || null,
      description:   form.description || null,
      features:      form.featureList.length ? JSON.stringify(form.featureList) : null,
      price:         finalPrice,
      originalPrice: finalOriginal,
      stock:         finalStock,
      weight:        finalWeight,
      shippingType:  form.shippingType,
      shippingFee:   form.shippingType==='fixed' ? (form.shippingFee??null) : null,
      warehouseId:   form.warehouseId ?? null,
      shipFrom:      form.shipFrom || null,
      shippingDays:  form.shippingDays ?? 1,
      purchaseLimit: form.purchaseLimit ?? 0,
      moq:           form.moq ?? 1,
      videoUrl:      form.videoUrl || null,
      mainImage:     form.mainImage,
      images:        Array.isArray(form.images) ? form.images.filter(Boolean).join(',') : form.images,
      tag:           form.tag || null,
      tagColor:      form.tag ? (form.tagColor||'#FFFFFF') : null,
      tagBg:         form.tag ? (form.tagBg||'#FF4D4F') : null,
      status:        form.status,
      specs:         specsJson,
      auditStatus:   mode==='draft' ? 'Draft' : 'Pending',
    };
    if (isEdit.value) {
      await adminProductApi.update(productId.value!, payload);
      ElMessage.success(mode==='draft' ? '草稿已保存' : '修改已提交审核，请等待管理员审核');
      initialSnapshot = snapshot();
    } else {
      await adminProductApi.create(payload);
      ElMessage.success(mode==='draft' ? '草稿已保存' : '商品已提交审核');
      router.push('/product/list');
    }
  } finally { saving.value = false; }
};

// ── 初始化 ────────────────────────────────────────────────────────────────────
onMounted(async () => {
  // 新建时先初始化默认行，loadProduct 会覆盖
  skuRows.value = [emptySkuRow({ specKey: DEFAULT_SKU_KEY })];
  await loadAuxData();
  await loadProduct();
  if (!isAdmin && !form.shopId) form.shopId = shopStore.currentShop?.shopId || shopStore.currentShop?.id || null;
  if (isEdit.value) initialSnapshot = snapshot();
});
</script>
