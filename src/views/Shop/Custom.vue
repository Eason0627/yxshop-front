<template>
  <div class="shop-custom h-full overflow-y-auto bg-[#f5f7fb] p-4">
    <div class="mx-auto grid max-w-[1440px] grid-cols-[280px_1fr_360px] gap-4">
      <section class="panel">
        <div class="panel-title">装修组件</div>
        <div class="component-list">
          <button
            v-for="item in components"
            :key="item.type"
            class="component-item"
            type="button"
            @click="selectComponent(item.type)"
          >
            <span class="component-icon">{{ item.icon }}</span>
            <span>{{ item.name }}</span>
          </button>
        </div>
      </section>

      <section class="workspace">
        <div class="toolbar">
          <div>
            <div class="text-sm text-slate-500">当前店铺</div>
            <div class="text-lg font-semibold text-slate-900">{{ shopDraft.name }}</div>
          </div>
          <div class="flex gap-2">
            <el-button @click="resetDraft">重置</el-button>
            <el-button type="primary" @click="saveDraft">保存草稿</el-button>
          </div>
        </div>

        <div class="preview-shell">
          <div class="phone-preview" :style="{ '--theme-color': shopDraft.themeColor }">
            <div class="shop-hero">
              <div class="shop-name">{{ shopDraft.name }}</div>
              <div class="shop-desc">{{ shopDraft.description }}</div>
            </div>
            <div class="module search-box">搜索店内商品</div>
            <div class="module banner">
              <div>
                <div class="banner-title">{{ shopDraft.bannerTitle }}</div>
                <div class="banner-subtitle">{{ shopDraft.bannerSubtitle }}</div>
              </div>
            </div>
            <div class="module-grid">
              <div v-for="nav in shopDraft.navs" :key="nav" class="nav-item">{{ nav }}</div>
            </div>
            <div class="section-title">推荐商品</div>
            <div class="product-grid">
              <div v-for="item in products" :key="item.name" class="product-card">
                <div class="product-image"></div>
                <div class="product-name">{{ item.name }}</div>
                <div class="product-price">{{ item.price }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-title">页面设置</div>
        <el-form label-position="top">
          <el-form-item label="店铺名称">
            <el-input v-model="shopDraft.name" />
          </el-form-item>
          <el-form-item label="店铺简介">
            <el-input v-model="shopDraft.description" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="主题色">
            <el-color-picker v-model="shopDraft.themeColor" />
          </el-form-item>
          <el-form-item label="横幅标题">
            <el-input v-model="shopDraft.bannerTitle" />
          </el-form-item>
          <el-form-item label="横幅副标题">
            <el-input v-model="shopDraft.bannerSubtitle" />
          </el-form-item>
        </el-form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { ElMessage } from "element-plus";

const initialDraft = {
  name: "平台自营店",
  description: "精选好物，统一运营，稳定发货",
  themeColor: "#0f766e",
  bannerTitle: "本周主推",
  bannerSubtitle: "热销商品限时上新",
  navs: ["新品", "热卖", "优惠券", "客服"],
};

const shopDraft = reactive({ ...initialDraft });

const components = [
  { type: "hero", name: "店铺头图", icon: "H" },
  { type: "search", name: "搜索栏", icon: "S" },
  { type: "banner", name: "营销横幅", icon: "B" },
  { type: "nav", name: "快捷导航", icon: "N" },
  { type: "products", name: "商品分组", icon: "P" },
];

const products = [
  { name: "示例商品 A", price: "¥99.00" },
  { name: "示例商品 B", price: "¥129.00" },
  { name: "示例商品 C", price: "¥59.00" },
  { name: "示例商品 D", price: "¥199.00" },
];

const selectComponent = (type: string) => {
  ElMessage.info(`已选中 ${type} 模块`);
};

const resetDraft = () => {
  Object.assign(shopDraft, initialDraft);
};

const saveDraft = () => {
  localStorage.setItem("shop_custom_draft", JSON.stringify(shopDraft));
  ElMessage.success("店铺装修草稿已保存");
};
</script>

<style scoped>
.panel,
.workspace {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
.panel {
  padding: 16px;
}
.panel-title {
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}
.component-list {
  display: grid;
  gap: 10px;
}
.component-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f8fafc;
  text-align: left;
}
.component-icon {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 4px;
  background: #0f766e;
  color: #fff;
  font-size: 12px;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}
.preview-shell {
  display: grid;
  min-height: 720px;
  place-items: center;
  padding: 24px;
}
.phone-preview {
  width: 375px;
  min-height: 680px;
  overflow: hidden;
  border: 1px solid #d1d5db;
  border-radius: 24px;
  background: #f8fafc;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
}
.shop-hero {
  padding: 28px 20px;
  background: var(--theme-color);
  color: #fff;
}
.shop-name {
  font-size: 22px;
  font-weight: 700;
}
.shop-desc {
  margin-top: 8px;
  font-size: 13px;
  opacity: 0.9;
}
.module {
  margin: 12px;
  border-radius: 6px;
  background: #fff;
}
.search-box {
  padding: 10px 14px;
  color: #94a3b8;
}
.banner {
  display: flex;
  min-height: 96px;
  align-items: center;
  padding: 16px;
  background: #ecfdf5;
}
.banner-title {
  font-size: 18px;
  font-weight: 700;
  color: #064e3b;
}
.banner-subtitle {
  margin-top: 6px;
  color: #047857;
}
.module-grid,
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 0 12px 12px;
}
.nav-item {
  border-radius: 6px;
  background: #fff;
  padding: 10px 0;
  text-align: center;
  font-size: 12px;
}
.section-title {
  padding: 4px 14px 10px;
  font-weight: 700;
}
.product-grid {
  grid-template-columns: repeat(2, 1fr);
}
.product-card {
  border-radius: 6px;
  background: #fff;
  padding: 10px;
}
.product-image {
  aspect-ratio: 1;
  border-radius: 4px;
  background: linear-gradient(135deg, #dbeafe, #ccfbf1);
}
.product-name {
  margin-top: 8px;
  font-size: 13px;
}
.product-price {
  margin-top: 4px;
  color: #dc2626;
  font-weight: 700;
}
</style>
