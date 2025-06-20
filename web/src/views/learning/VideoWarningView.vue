<!-- views/learning/VideoWarningView.vue -->
<template>
  <div class="video-warning-view min-h-screen bg-yellow-50 flex items-center justify-center px-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow-lg p-6 text-center">
      <el-icon class="text-6xl text-yellow-500 mb-4">
        <Warning />
      </el-icon>

      <h2 class="text-xl font-bold mb-4">안전교육 시청 전 주의사항</h2>

      <div class="text-left space-y-3 mb-6">
        <p class="flex items-start">
          <el-icon class="text-red-500 mr-2 mt-1"><InfoFilled /></el-icon>
          교육 중에는 다른 작업을 하지 마세요
        </p>
        <p class="flex items-start">
          <el-icon class="text-red-500 mr-2 mt-1"><InfoFilled /></el-icon>
          안전한 장소에서 시청하세요
        </p>
        <p class="flex items-start">
          <el-icon class="text-red-500 mr-2 mt-1"><InfoFilled /></el-icon>
          집중해서 끝까지 시청해야 수료증이 발급됩니다
        </p>
      </div>

      <div class="space-y-3">
        <el-button type="primary" size="large" class="w-full" @click="startVideo">
          교육 시작하기
        </el-button>
        <el-button size="large" class="w-full" @click="goBack">
          나중에 하기
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: 비디오 시청 전 경고 화면
const props = defineProps<{ id: string }>()

const startVideo = () => {
  console.log('비디오 시작:', props.id)
  // 실제 비디오 페이지로 이동
}

const goBack = () => {
  console.log('뒤로 가기')
}
</script>
