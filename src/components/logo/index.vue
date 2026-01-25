<template>
  <div>
    <div class="flex gap-2">
      <div class="log-mino">MINIO</div>
      <div class="log-view">VIEW</div>
    </div>
    <!-- <div class="text-[10px] pl-[42px] mt-[2px]">在线MINIO查看器</div> -->
  </div>
</template>

<script setup lang="ts">

</script>
<style scoped lang="scss">
.log-mino, .log-view {
  position: relative;
  text-align: center;
  width: 85px;
  font-weight: bold;
  font-size: 22px;
}

.log-mino::before, .log-mino::after,
.log-view::before, .log-view::after {
  position: absolute;
  left: 0;
  width: 100%;
  height: 3px;
  content: "";
}

.log-mino::before, .log-view::before {
  top: 0;
}

.log-mino::after, .log-view::after {
  bottom: 0;
}

.log-mino {
  &::before, &::after {
    background: #000000;
  }
}

.log-view {
  background: #29b6f6;
  color: #ffffff;

  &::before, &::after {
    background: #29b6f6;
  }
}
</style>