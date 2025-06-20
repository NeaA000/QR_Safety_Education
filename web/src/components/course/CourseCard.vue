<!-- components/course/CourseCard.vue -->
<template>
  <div class="course-card bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer" @click="$emit('click')">
    <!-- 썸네일 -->
    <div class="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
      <img v-if="course.thumbnailUrl" :src="course.thumbnailUrl" :alt="course.title" class="w-full h-full object-cover" />
      <div v-else class="w-full h-full flex items-center justify-center">
        <el-icon class="text-4xl text-gray-400"><VideoPlay /></el-icon>
      </div>
    </div>

    <!-- 카드 내용 -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">{{ course.title }}</h3>
      <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ course.description }}</p>

      <!-- 메타 정보 -->
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span class="flex items-center">
          <el-icon class="mr-1"><Clock /></el-icon>
          {{ course.duration }}분
        </span>
        <el-tag :type="getDifficultyType(course.difficulty)" size="small">
          {{ getDifficultyText(course.difficulty) }}
        </el-tag>
      </div>

      <!-- 진행률 (내 강의인 경우) -->
      <div v-if="progress" class="mt-3">
        <div class="flex justify-between text-xs mb-1">
          <span>진행률</span>
          <span>{{ Math.round(progress.percentage) }}%</span>
        </div>
        <el-progress :percentage="progress.percentage" :stroke-width="6" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: 강의 카드 컴포넌트
interface Props {
  course: {
    id: string
    title: string
    description: string
    thumbnailUrl?: string
    duration: number
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  }
  progress?: {
    percentage: number
  }
}

defineProps<Props>()
defineEmits<{
  click: []
}>()

const getDifficultyType = (difficulty: string) => {
  const types = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'danger'
  }
  return types[difficulty] || 'info'
}

const getDifficultyText = (difficulty: string) => {
  const texts = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급'
  }
  return texts[difficulty] || '미정'
}
</script>
