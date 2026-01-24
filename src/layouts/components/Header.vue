<template>
  <div class="header-wrapper">
    <div class="header-left">
      <img src="@/assets/ice.svg" width="28" height="28" alt="MinIO View" class="logo" />
      <span class="brand-name">MinIO View</span>
    </div>
    <nav class="header-nav">
      <router-link
        to="/gallery"
        class="nav-item"
        :class="{ active: activeIndex === '/gallery' }"
      >
        <el-icon :size="18"><Picture /></el-icon>
        <span>图库</span>
      </router-link>
      <router-link
        to="/settings"
        class="nav-item"
        :class="{ active: activeIndex === '/settings' }"
      >
        <el-icon :size="18"><Setting /></el-icon>
        <span>设置</span>
      </router-link>
    </nav>
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
</script>

<style lang="scss" scoped>
.header-wrapper {
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;

  .logo {
    transition: transform 0.3s ease;

    &:hover {
      transform: rotate(10deg);
    }
  }

  .brand-name {
    font-size: 17px;
    font-weight: 600;
    color: #18181b;
    letter-spacing: -0.02em;
  }
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #71717a;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    color: #18181b;
    background-color: #f4f4f5;
  }

  &.active {
    color: #18181b;
    background-color: #f4f4f5;
  }
}
</style>
