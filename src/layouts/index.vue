<template>
  <el-container>
    <el-header class="border-solid overflow-hidden border-b border-b-[#e0e0e0] ">
      <Header/>
    </el-header>
    <el-container class="h-[calc(100vh-60px)] ">
      <el-aside width="300px" class="border-r border-r-[#e0e0e0]">
        <Sidebar/>
      </el-aside>
      <el-main>
        <router-view/>
      </el-main>
    </el-container>
  </el-container>
</template>
<script setup lang="ts">
import Header from '@/layouts/components/Header.vue'
import Sidebar from '@/layouts/components/Sidebar.vue'

</script>
<style lang="scss" scoped>

</style>