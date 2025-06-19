<!-- NotFoundView.vue -->
<template>
  <div class="not-found-view">
    <h1>404</h1>
    <p>페이지를 찾을 수 없습니다.</p>
    <el-button @click="$router.push('/home')">홈으로 돌아가기</el-button>
  </div>
</template>

<script setup lang="ts">
// 404 페이지 로직
</script>

<style scoped>
.not-found-view {
  padding: 20px;
  text-align: center;
}
</style>
