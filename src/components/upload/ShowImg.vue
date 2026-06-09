<template>
  <div v-for="(item, index) in images" :key="index"
       class="image relative flex justify-center items-center w-24 h-24 rounded-md overflow-hidden mx-1"
       @mouseover="onMouseOver(index)">
    <el-image
      :src="item"
      :zoom-rate="1.2"
      :max-scale="7"
      :min-scale="0.2"
      preview-teleported
      :preview-src-list="[item]"
      fit="cover"
      style="width: 100%; height: 100%"
    />
    <el-image-viewer
      v-if="showImageViewer && currentIndex === index"
      :url-list="[item]"
      @close="closeViewer"
    ></el-image-viewer>
    <transition name="fade">
      <div
        class="preview absolute flex justify-center items-center w-full h-full"
        @mouseout="onMouseOut(index)"
        v-show="editImage && currentIndex === index"
      >
        <div
          class="mask absolute w-full h-full bg-black opacity-40 z-5"
        ></div>
        <div class="flex items-center text-white text-xl z-10">
          <span class="mr-2 cursor-pointer" @click="zoomIn()">
            <el-icon><ZoomIn /></el-icon>
          </span>
          <span class="cursor-pointer" @click="delShopImage(propsStr,index)">
            <el-icon><Delete /></el-icon>
          </span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { ZoomIn, Delete } from '@element-plus/icons-vue';

interface Props {
  images?: string[];
  propsStr?: string;
}

const { images, propsStr } = defineProps<Props>();

const showImageViewer = ref(false);
const editImage = ref(false);
const currentIndex = ref(-1);
const zoomRate = ref(1.2);

const onMouseOver = (index: number) => {
  currentIndex.value = index;
  editImage.value = true;
};

const onMouseOut = (index: number) => {
  if (currentIndex.value === index) {
    editImage.value = false;
  }
};

const zoomIn = () => {
  const newZoomRate = zoomRate.value + 0.1;
  if (newZoomRate <= 7) {
    zoomRate.value = newZoomRate;
  }
  showImageViewer.value = true;
};

const delShopImage = (propsStr:string|undefined,index: number) => {
  // 这里可以使用emit向父组件传递删除请求
  emit('deleteImage', propsStr,index);
  ElMessage.success('图片删除成功');
};

const closeViewer = () => {
  showImageViewer.value = false;
  currentIndex.value = -1;
  zoomRate.value = 1.2; // 重置缩放率
};

const emit = defineEmits(['deleteImage']);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>