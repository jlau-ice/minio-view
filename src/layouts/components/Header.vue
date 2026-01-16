<template>
  <div class="h-full px-[10px] flex items-center w-full">
    <img class="mr-3 cursor-wait" src="@/assets/ice.svg" width="30" alt="ice"/>
    <el-menu router class="grow" :default-active="activeIndex" mode="horizontal" @select="handleSelect">
      <el-menu-item index="/dashboard" class="font-bold">上传统计</el-menu-item>
      <el-menu-item index="/manager" class="font-bold">人员管理</el-menu-item>
    </el-menu>
  </div>
</template>
<script setup lang="ts">
import {ref} from 'vue'

const activeIndex = ref('/dashboard')
const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
  activeIndex.value = key
}
</script>
<style lang="scss" scoped>

</style>