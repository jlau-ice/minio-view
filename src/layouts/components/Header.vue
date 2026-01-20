<template>
  <div class="h-full px-[20px] flex items-center justify-between w-full">
    <div class="flex items-center select-none">
      <img class="mr-3" src="@/assets/ice.svg" width="30" alt="MinIO View"/>
      <span class="text-xl  font-bold  text-gray-800">MINIO Kanban</span>
    </div>
    <el-menu router class="felx border-none flex-1 justify-end" :default-active="activeIndex" mode="horizontal" @select="handleSelect">
      <el-menu-item index="/gallery">
        <el-icon><Picture /></el-icon>
        <span>图库</span>
      </el-menu-item>
      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <span>设置</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Picture, Setting } from '@element-plus/icons-vue'

const route = useRoute()
const activeIndex = ref(route.path)

watch(() => route.path, (newPath) => {
  activeIndex.value = newPath
})

const handleSelect = (key: string) => {
  activeIndex.value = key
}
</script>
<style lang="scss" scoped>

</style>