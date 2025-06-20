<!-- components/common/LoadingSpinner.vue -->
<template>
  <div class="loading-spinner flex items-center justify-center">
    <el-icon class="text-3xl animate-spin text-blue-500">
      <Loading />
    </el-icon>
    <span v-if="message" class="ml-2">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
// TODO: 로딩 스피너 컴포넌트
interface Props {
  message?: string
}

defineProps<Props>()
</script>
