<template>
  <el-container>
    <el-header class="border-solid overflow-hidden border-b border-b-[#e0e0e0] bg-white">
      <Header/>
    </el-header>
    <el-main class="bg-[#f5f7fa]">
      <router-view/>
    </el-main>
  </el-container>
</template>
<script setup lang="ts">
import Header from '@/layouts/components/Header.vue'

</script>
<style lang="scss" scoped>

</style>