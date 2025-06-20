<!-- views/learning/VideoPlayerView.vue -->
<template>
  <div class="video-player-view bg-black min-h-screen">
    <!-- TODO: 전체화면 비디오 플레이어 -->
    <div class="flex items-center justify-center h-screen">
      <video-player :video-url="videoUrl" :course-id="courseId" />
    </div>

    <!-- 전체화면 컨트롤 -->
    <div class="absolute top-4 left-4">
      <el-button @click="exitFullscreen" circle>
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: 전체화면 비디오 플레이어
const props = defineProps<{ id: string }>()

const exitFullscreen = () => {
  console.log('전체화면 종료')
}
</script>
