<script setup lang="ts">
import { onMounted } from "vue";
import FloatingWindow from "./components/FloatingWindow.vue";

onMounted(() => {
  console.log("Content script app mounted");
});
</script>

<template>
  <FloatingWindow title="AI 助手" :width="420" :height="520">
    <div class="block font-[inherit]">
      <p class="block text-base font-medium text-gray-800 mb-2">👋 你好！我是 AI 助手</p>
      <p class="block text-sm text-gray-400 leading-relaxed">在这里放置你的插件内容</p>
    </div>
  </FloatingWindow>
</template>
