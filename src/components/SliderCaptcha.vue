<template>
  <div class="slider-captcha" :style="{ width: bgWidth + 'px' }">

    <!-- 图片区域 -->
    <div
      class="relative rounded-xl overflow-hidden bg-[#EBEBEB]"
      :style="{ height: bgHeight + 'px' }"
    >
      <template v-if="!loading && bgBase64">
        <!-- 背景图 -->
        <img
          :src="bgBase64"
          :width="bgWidth"
          :height="bgHeight"
          class="block w-full h-full object-cover"
          draggable="false"
        />
        <!-- 拼图块（跟随 dragX 移动） -->
        <img
          :src="pieceBase64"
          draggable="false"
          :style="{
            position: 'absolute',
            top: '0px',
            left: dragX + 'px',
            width: pieceW + 'px',
            height: bgHeight + 'px',
            userSelect: 'none',
            pointerEvents: 'none',
          }"
        />
      </template>

      <!-- 加载中 -->
      <div v-else-if="loading" class="absolute inset-0 flex items-center justify-center">
        <i class="ri-loader-4-line animate-spin text-2xl text-[#CCC]"></i>
      </div>
      <!-- 加载失败（后端未启动或接口不存在） -->
      <div v-else-if="loadFailed" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#FAFAFA]">
        <i class="ri-wifi-off-line text-2xl text-[#CCC]"></i>
        <span class="text-[12px] text-[#BBB]">验证码加载失败</span>
        <button class="text-[12px] text-[#FF6B00] hover:underline" @click="refresh">点击重试</button>
      </div>

      <!-- 成功遮罩 -->
      <transition name="fade">
        <div
          v-if="status === 'success'"
          class="absolute inset-0 bg-green-500/20 flex items-center justify-center"
        >
          <div class="bg-white/90 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
            <i class="ri-checkbox-circle-fill text-green-500"></i>
            <span class="text-[12px] text-green-600 font-medium">验证成功</span>
          </div>
        </div>

        <!-- 失败遮罩 -->
        <div
          v-else-if="status === 'fail'"
          class="absolute inset-0 bg-red-400/15 flex items-center justify-center"
        >
          <div class="bg-white/90 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
            <i class="ri-close-circle-fill text-red-500"></i>
            <span class="text-[12px] text-red-500 font-medium">拼图不对，请重试</span>
          </div>
        </div>
      </transition>
    </div>

    <!-- 滑块轨道 -->
    <div
      class="mt-2 relative h-[44px] rounded-xl overflow-hidden select-none"
      :class="
        status === 'success'
          ? 'bg-green-50 border border-green-200'
          : 'bg-[#F7F8FA] border border-[#E8E8E8]'
      "
      @mousemove="onMouseMove"
      @mouseup="onRelease"
      @mouseleave="onTrackLeave"
    >
      <!-- 进度条 -->
      <div
        class="absolute top-0 left-0 h-full rounded-xl transition-none"
        :class="status === 'success' ? 'bg-green-100' : 'bg-[#FFEDE0]'"
        :style="{ width: dragX + HANDLE_W + 'px' }"
      ></div>

      <!-- 提示文字 -->
      <div
        v-if="status === 'idle'"
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <span class="text-[12px] text-[#C0C0C0]" :style="{ marginLeft: HANDLE_W + 8 + 'px' }">
          按住滑块，拖动完成拼图
        </span>
      </div>

      <!-- 滑块把手 -->
      <div
        class="absolute top-[2px] h-[38px] flex items-center justify-center rounded-xl shadow-sm select-none transition-colors"
        :class="[
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
          status === 'success'
            ? 'bg-green-50 border border-green-300'
            : 'bg-white border border-[#E0E0E0] hover:border-[#FF6B00]',
        ]"
        :style="{ width: HANDLE_W + 'px', left: dragX + 'px' }"
        @mousedown.prevent="onMouseDown"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend.prevent="onRelease"
      >
        <i
          class="text-base"
          :class="
            status === 'success'
              ? 'ri-check-line text-green-500'
              : isDragging
              ? 'ri-arrow-left-right-line text-[#FF6B00]'
              : 'ri-arrow-right-double-line text-[#C0C0C0]'
          "
        ></i>
      </div>
    </div>

    <!-- 换一张 -->
    <div class="mt-1 flex justify-end" :style="{ width: bgWidth + 'px' }">
      <button
        class="text-[11px] text-[#BBB] hover:text-[#FF6B00] flex items-center gap-0.5 transition-colors disabled:opacity-40"
        :disabled="loading || status === 'success'"
        @click="refresh"
      >
        <i class="ri-refresh-line text-xs"></i>
        <span>换一张</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { BASE_URL } from '@/utils/http';

const emit = defineEmits<{
  (e: 'verified', token: string): void;
}>();

const HANDLE_W = 44;

const loading    = ref(true);
const loadFailed = ref(false);
const isDragging = ref(false);
const dragX      = ref(0);
const status     = ref<'idle' | 'verifying' | 'success' | 'fail'>('idle');

const captchaId  = ref('');
const bgBase64   = ref('');
const pieceBase64 = ref('');
const bgWidth    = ref(310);
const bgHeight   = ref(155);
const pieceW     = ref(50);

let startClientX = 0;
let startDragX   = 0;
let maxDragX     = 0;
let failTimer: ReturnType<typeof setTimeout> | null = null;

const fetchChallenge = async () => {
  loading.value    = true;
  loadFailed.value = false;
  status.value     = 'idle';
  dragX.value      = 0;
  bgBase64.value   = '';
  if (failTimer) { clearTimeout(failTimer); failTimer = null; }
  try {
    const res = await fetch(`${BASE_URL}/app/auth/slider/generate`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const d = json?.data || json;
    captchaId.value   = d.captchaId   ?? '';
    bgBase64.value    = d.bgBase64    ?? '';
    pieceBase64.value = d.pieceBase64 ?? '';
    bgWidth.value     = d.bgWidth     ?? 310;
    bgHeight.value    = d.bgHeight    ?? 155;
    pieceW.value      = d.pieceW      ?? 50;
    maxDragX          = bgWidth.value - HANDLE_W;
  } catch {
    loadFailed.value = true;
  }
  loading.value = false;
};

const refresh = () => {
  if (!loading.value && status.value !== 'success') fetchChallenge();
};

// ── 鼠标事件 ────────────────────────────────────────────────────────────────

const onMouseDown = (e: MouseEvent) => {
  if (status.value === 'success') return;
  isDragging.value = true;
  startClientX     = e.clientX;
  startDragX       = dragX.value;
};

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  dragX.value = clamp(startDragX + (e.clientX - startClientX), 0, maxDragX);
};

const onTrackLeave = (e: MouseEvent) => {
  // 仅在按钮仍按下时释放
  if (isDragging.value && e.buttons === 0) onRelease();
};

// ── 触控事件 ────────────────────────────────────────────────────────────────

const onTouchStart = (e: TouchEvent) => {
  if (status.value === 'success') return;
  isDragging.value = true;
  startClientX     = e.touches[0].clientX;
  startDragX       = dragX.value;
};

const onTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return;
  dragX.value = clamp(startDragX + (e.touches[0].clientX - startClientX), 0, maxDragX);
};

// ── 释放 → 提交验证 ──────────────────────────────────────────────────────────

const onRelease = async () => {
  if (!isDragging.value || status.value === 'success') {
    isDragging.value = false;
    return;
  }
  isDragging.value = false;
  if (dragX.value < 5) return; // 几乎没拖动，不提交

  status.value = 'verifying';
  try {
    const res = await fetch(`${BASE_URL}/app/auth/slider/verify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ captchaId: captchaId.value, x: Math.round(dragX.value) }),
    });
    const json = await res.json();
    const token = json?.data?.token;
    if (token) {
      status.value = 'success';
      emit('verified', token);
    } else {
      onVerifyFail();
    }
  } catch {
    onVerifyFail();
  }
};

const onVerifyFail = () => {
  status.value = 'fail';
  failTimer = setTimeout(() => {
    fetchChallenge();
  }, 1000);
};

// ── 全局 mouseup（鼠标移出组件后释放）────────────────────────────────────────

const globalMouseUp = () => { if (isDragging.value) onRelease(); };

onMounted(() => {
  fetchChallenge();
  window.addEventListener('mouseup', globalMouseUp);
});

onUnmounted(() => {
  window.removeEventListener('mouseup', globalMouseUp);
  if (failTimer) clearTimeout(failTimer);
});

// ── 工具 ─────────────────────────────────────────────────────────────────────

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// 暴露 refresh 方法供父组件调用（登录失败后重置）
defineExpose({ refresh, loadFailed });
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
