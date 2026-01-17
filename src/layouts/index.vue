<template>
  <el-container class="app-container">
    <el-header class="border-solid overflow-hidden border-b border-b-[#e0e0e0] bg-white app-header">
      <Header/>
    </el-header>
    <el-main class="bg-[#f5f7fa] app-main">
      <router-view/>
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
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  flex-shrink: 0;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  margin-top: 60px;
}
</style>