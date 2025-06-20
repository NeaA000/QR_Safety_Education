<!-- components/learning/ProgressBar.vue -->
<template>
  <div class="progress-bar">
    <div class="flex justify-between text-sm mb-2">
      <span>학습 진행률</span>
      <span>{{ percentage }}%</span>
    </div>

    <el-progress
      :percentage="percentage"
      :stroke-width="12"
      :color="progressColor"
    />

    <div class="flex justify-between text-xs text-gray-500 mt-2">
      <span>{{ watchedTime }} / {{ totalTime }}</span>
      <span v-if="isCompleted" class="text-green-600">완료</span>
      <span v-else-if="percentage > 0" class="text-blue-600">진행 중</span>
      <span v-else class="text-gray-400">시작 전</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: 진도율 표시 컴포넌트
interface Props {
  watchedTime: string
  totalTime: string
  percentage: number
  isCompleted: boolean
}

defineProps<Props>()

const progressColor = computed(() => {
  return props.isCompleted ? '#67c23a' : '#409eff'
})
</script>
