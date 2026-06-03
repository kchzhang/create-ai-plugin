<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { IconSidebar, IconMinimize, IconMaximize, IconClose, IconResize } from "@/icons";

const props = withDefaults(
  defineProps<{
    title?: string;
    width?: number;
    height?: number;
    initX?: number;
    initY?: number;
    minWidth?: number;
    minHeight?: number;
  }>(),
  {
    title: "浮动窗口",
    width: 400,
    height: 500,
    initX: -1,
    initY: -1,
    minWidth: 200,
    minHeight: 150,
  }
);

const visible = ref(true);
const minimized = ref(false);

const posX = ref(0);
const posY = ref(0);
const currentWidth = ref(props.width);
const currentHeight = ref(props.height);

const windowStyle = computed(() => ({
  position: "fixed" as const,
  left: `${posX.value}px`,
  top: `${posY.value}px`,
  width: `${currentWidth.value}px`,
  height: minimized.value ? "auto" : `${currentHeight.value}px`,
  zIndex: 2147483647,
}));

onMounted(() => {
  if (props.initX >= 0 && props.initY >= 0) {
    posX.value = props.initX;
    posY.value = props.initY;
  } else {
    posX.value = window.innerWidth - currentWidth.value - 20;
    posY.value = window.innerHeight - currentHeight.value - 20;
  }
});

// --- 拖拽逻辑 ---
let dragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

function onHeaderMouseDown(e: MouseEvent) {
  if (minimized.value) return;
  dragging = true;
  dragOffsetX = e.clientX - posX.value;
  dragOffsetY = e.clientY - posY.value;
  e.preventDefault();
}

function onMouseMove(e: MouseEvent) {
  if (resizing) {
    handleResizeMove(e.clientX, e.clientY);
    return;
  }
  if (!dragging) return;
  let newX = e.clientX - dragOffsetX;
  let newY = e.clientY - dragOffsetY;
  // 边界约束
  newX = Math.max(0, Math.min(newX, window.innerWidth - currentWidth.value));
  newY = Math.max(0, Math.min(newY, window.innerHeight - 48));
  posX.value = newX;
  posY.value = newY;
}

function onMouseUp() {
  dragging = false;
  resizing = false;
}

// --- 拉伸逻辑 ---
let resizing = false;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartW = 0;
let resizeStartH = 0;

function onResizeMouseDown(e: MouseEvent) {
  if (minimized.value) return;
  e.preventDefault();
  e.stopPropagation();
  resizing = true;
  resizeStartX = e.clientX;
  resizeStartY = e.clientY;
  resizeStartW = currentWidth.value;
  resizeStartH = currentHeight.value;
}

function onResizeTouchStart(e: TouchEvent) {
  if (minimized.value) return;
  e.stopPropagation();
  const touch = e.touches[0];
  resizing = true;
  resizeStartX = touch.clientX;
  resizeStartY = touch.clientY;
  resizeStartW = currentWidth.value;
  resizeStartH = currentHeight.value;
}

function handleResizeMove(clientX: number, clientY: number) {
  let newW = resizeStartW + (clientX - resizeStartX);
  let newH = resizeStartH + (clientY - resizeStartY);
  // 最小尺寸限制
  newW = Math.max(props.minWidth, newW);
  newH = Math.max(props.minHeight, newH);
  // 边界限制：不超出视口右侧和底部
  newW = Math.min(newW, window.innerWidth - posX.value);
  newH = Math.min(newH, window.innerHeight - posY.value);
  currentWidth.value = newW;
  currentHeight.value = newH;
}

function onTouchMove(e: TouchEvent) {
  if (!resizing) return;
  const touch = e.touches[0];
  handleResizeMove(touch.clientX, touch.clientY);
}

function onTouchEnd() {
  resizing = false;
}

// 头部触摸拖拽
let touchDragging = false;
let touchDragOffsetX = 0;
let touchDragOffsetY = 0;

function onHeaderTouchStart(e: TouchEvent) {
  if (minimized.value) return;
  const touch = e.touches[0];
  touchDragging = true;
  touchDragOffsetX = touch.clientX - posX.value;
  touchDragOffsetY = touch.clientY - posY.value;
}

function onHeaderTouchMove(e: TouchEvent) {
  if (!touchDragging) return;
  const touch = e.touches[0];
  let newX = touch.clientX - touchDragOffsetX;
  let newY = touch.clientY - touchDragOffsetY;
  newX = Math.max(0, Math.min(newX, window.innerWidth - currentWidth.value));
  newY = Math.max(0, Math.min(newY, window.innerHeight - 48));
  posX.value = newX;
  posY.value = newY;
}

function onHeaderTouchEnd() {
  touchDragging = false;
}

onMounted(() => {
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchend", onTouchEnd);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  document.removeEventListener("touchmove", onTouchMove);
  document.removeEventListener("touchend", onTouchEnd);
});

function handleMinimize() {
  minimized.value = !minimized.value;
}

function handleClose() {
  visible.value = false;
}

function handleReopen() {
  visible.value = true;
  minimized.value = false;
}
</script>

<template>
  <!-- 关闭后的浮球 -->
  <div
    v-if="!visible"
    class="fixed right-5 bottom-5 w-10 h-10 rounded-full bg-sky-500 shadow-[0_2px_12px_rgba(14,165,233,0.35)] cursor-pointer flex items-center justify-center z-[2147483647] transition-all duration-200 hover:bg-sky-400 hover:shadow-[0_4px_16px_rgba(14,165,233,0.45)] hover:scale-105"
    @click="handleReopen"
  >
    <IconSidebar class="w-[18px] h-[18px] text-white [&>svg]:stroke-white" />
  </div>

  <!-- 浮动窗口 -->
  <div v-if="visible" class="block font-sans bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden select-none" :style="windowStyle">
    <div
      class="flex items-center justify-between h-11 px-4 bg-slate-50 cursor-move select-none"
      @mousedown="onHeaderMouseDown"
      @touchstart="onHeaderTouchStart"
      @touchmove="onHeaderTouchMove"
      @touchend="onHeaderTouchEnd"
    >
      <span class="text-[13px] font-medium text-gray-700 tracking-wide block leading-11 whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]">{{ title }}</span>
      <div class="flex items-center gap-0.5">
        <slot name="header-actions"></slot>
        <button class="inline-flex items-center justify-center w-7 h-7 rounded-md cursor-pointer text-gray-400 transition-colors duration-150 hover:bg-slate-100 hover:text-gray-600" @click.stop="handleMinimize" :title="minimized ? '展开' : '最小化'">
          <IconMinimize v-if="!minimized" class="w-3.5 h-3.5" />
          <IconMaximize v-else class="w-3.5 h-3.5" />
        </button>
        <button class="inline-flex items-center justify-center w-7 h-7 rounded-md cursor-pointer text-gray-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-500" @click.stop="handleClose" title="关闭">
          <IconClose class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    <div v-show="!minimized" class="block h-[1px] bg-slate-200/60"></div>
    <div v-show="!minimized" class="block p-4 h-[calc(100%-52px)] overflow-y-auto text-sm text-gray-700 leading-relaxed box-border select-text">
      <slot></slot>
    </div>
    <!-- 右下角拉伸手柄 -->
    <div
      v-show="!minimized"
      class="group absolute right-0 bottom-0 w-[18px] h-[18px] cursor-nwse-resize flex items-center justify-center p-0.5 rounded-br-2xl"
      @mousedown="onResizeMouseDown"
      @touchstart="onResizeTouchStart"
    >
      <IconResize class="w-2.5 h-2.5 text-gray-300 transition-colors duration-150 group-hover:text-sky-400 group-active:text-sky-500 [&>svg]:fill-current" />
    </div>
  </div>
</template>

