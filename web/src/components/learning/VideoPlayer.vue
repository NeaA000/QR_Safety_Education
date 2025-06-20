<!-- components/learning/VideoPlayer.vue -->
<template>
  <div class="video-player">
    <div class="aspect-video bg-black rounded-lg overflow-hidden">
      <!-- TODO: Video.js 또는 네이티브 비디오 플레이어 구현 -->
      <video
        ref="videoRef"
        class="w-full h-full"
        :src="videoUrl"
        controls
        @timeupdate="onTimeUpdate"
        @ended="onVideoEnd"
        @loadedmetadata="onVideoLoaded"
      />
    </div>

    <!-- 비디오 컨트롤 -->
    <div class="video-controls mt-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <el-button @click="togglePlay" circle>
            <el-icon>
              <component :is="isPlaying ? 'VideoPause' : 'VideoPlay'" />
            </el-icon>
          </el-button>

          <span class="text-sm text-gray-600">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
          </span>
        </div>

        <div class="flex items-center space-x-2">
          <!-- 배속 -->
          <el-select v-model="playbackRate" size="small" @change="changePlaybackRate">
            <el-option label="0.5x" :value="0.5" />
            <el-option label="1x" :value="1" />
            <el-option label="1.25x" :value="1.25" />
            <el-option label="1.5x" :value="1.5" />
            <el-option label="2x" :value="2" />
          </el-select>

          <!-- 전체화면 -->
          <el-button @click="toggleFullscreen" circle>
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 진행바 -->
      <div class="mt-3">
        <el-slider
          v-model="progress"
          :max="duration"
          @change="seekTo"
          :format-tooltip="formatTime"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: 비디오 플레이어 컴포넌트
interface Props {
  videoUrl: string
  courseId: string
}

const props = defineProps<Props>()

const videoRef = ref<HTMLVideoElement>()
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const playbackRate = ref(1)

const togglePlay = () => {
  console.log('재생/일시정지 토글')
  // 비디오 재생/일시정지 구현
}

const onTimeUpdate = () => {
  console.log('시간 업데이트')
  // 진행 상황 저장
}

const onVideoEnd = () => {
  console.log('비디오 종료')
  // 완료 처리
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
</script>
