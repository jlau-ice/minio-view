<template>
  <div class="logo-wrapper">
    <div class="logo-icon">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.3"/>
      </svg>
    </div>
    <div class="logo-text">
      <span class="text-minio">MINIO</span>
      <span class="text-view">VIEW</span>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  user-select: none;
}

.logo-icon {
  width: 28px;
  height: 28px;
  color: #0ea5e9;
  flex-shrink: 0;

  svg {
    width: 100%;
    height: 100%;
  }
}

.logo-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.text-minio {
  color: #18181b;
}

.text-view {
  color: #0ea5e9;
}
</style>