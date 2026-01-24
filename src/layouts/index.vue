<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <Header />
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import Header from '@/layouts/components/Header.vue'
</script>

<style lang="scss" scoped>
.app-container {
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  background-color: #fafafa;
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 64px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  margin-top: 64px;
  padding: 0;
}
</style>
