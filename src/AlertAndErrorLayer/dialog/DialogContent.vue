<script lang="ts" setup>
import { dialogMap } from './index'
</script>
<template>
  <div class="dialog-content">
    <KeepAlive>
      <component v-for="item in dialogMap" :is="item[1].vNode" :key="item[0]"></component>
    </KeepAlive>
  </div>
</template>
<style lang="less" scoped></style>
