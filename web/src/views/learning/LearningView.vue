<!-- views/learning/LearningView.vue -->
<template>
  <div class="learning-view">
    <app-header />

    <div class="container mx-auto px-4 py-6">
      <!-- 비디오 플레이어 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <video-player :video-url="videoUrl" :course-id="courseId" />
      </div>

      <!-- 강의 정보 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">{{ course?.title }}</h2>
        <progress-bar
          :watched-time="watchedTime"
          :total-time="totalTime"
          :percentage="progressPercentage"
          :is-completed="isCompleted"
        />
      </div>

      <!-- TODO: 학습 노트, 퀴즈 등 -->
    </div>

    <app-footer />
  </div>
</template>

<script setup lang="ts">
// TODO: 학습 페이지
const props = defineProps<{ id: string }>()

const course = ref(null)
const videoUrl = ref('')
const courseId = ref(props.id)
const watchedTime = ref('0:00')
const totalTime = ref('30:00')
const progressPercentage = ref(0)
const isCompleted = ref(false)
</script>
