<script setup lang="ts">
const router = useRouter()
</script>

<template>
  <div class="ErrorPage">
    <n-result status="404" title="404 资源不存在">
      <template #footer>
        <n-button @click="router.push('/')">返回首页</n-button>
      </template>
    </n-result>
  </div>
</template>

<style scoped lang="less">
.ErrorPage {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
</style>
