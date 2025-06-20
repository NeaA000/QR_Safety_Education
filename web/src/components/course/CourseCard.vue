<template>
  <el-card
    class="course-card"
    shadow="hover"
    @click="handleCardClick"
  >
    <!-- 썸네일 -->
    <div class="course-thumbnail">
      <img
        :src="course.thumbnail || '/default-course.jpg'"
        :alt="course.title"
        @error="handleImageError"
      />
      <div class="course-badge">
        <el-tag v-if="course.isNew" type="danger" size="small">NEW</el-tag>
        <el-tag v-if="course.isBest" type="warning" size="small">BEST</el-tag>
        <el-tag v-if="course.price === 0" type="success" size="small">무료</el-tag>
      </div>
      <div class="course-rating" v-if="course.rating > 0">
        <el-icon><Star /></el-icon>
        <span>{{ course.rating.toFixed(1) }}</span>
      </div>
    </div>

    <!-- 강의 정보 -->
    <div class="course-info">
      <div class="course-category">
        {{ getCategoryName(course.categoryId) }}
      </div>

      <h3 class="course-title" :title="course.title">
        {{ course.title }}
      </h3>

      <p class="course-description" :title="course.description">
        {{ course.description }}
      </p>

      <div class="course-instructor">
        <el-avatar
          :src="course.instructorPhoto"
          :icon="UserFilled"
          :size="24"
        />
        <span>{{ course.instructor }}</span>
      </div>

      <div class="course-meta">
        <div class="meta-item">
          <el-icon><Clock /></el-icon>
          <span>{{ formatDuration(course.duration) }}</span>
        </div>
        <div class="meta-item">
          <el-icon><VideoPlay /></el-icon>
          <span>{{ course.lectureCount }}강</span>
        </div>
        <div class="meta-item">
          <el-icon><User /></el-icon>
          <span>{{ course.enrollmentCount || 0 }}명</span>
        </div>
      </div>

      <div class="course-difficulty">
        <el-tag
          :type="getDifficultyType(course.difficulty)"
          size="small"
        >
          {{ getDifficultyText(course.difficulty) }}
        </el-tag>
      </div>
    </div>

    <!-- 가격 및 신청 버튼 -->
    <div class="course-footer">
      <div class="course-price">
        <span v-if="course.originalPrice && course.originalPrice > course.price" class="original-price">
          {{ formatPrice(course.originalPrice) }}
        </span>
        <span class="current-price" :class="{ free: course.price === 0 }">
          {{ course.price === 0 ? '무료' : formatPrice(course.price) }}
        </span>
      </div>

      <el-button
        v-if="!isEnrolled"
        type="primary"
        size="small"
        @click.stop="handleEnroll"
        :loading="isEnrolling"
      >
        {{ course.price === 0 ? '무료 신청' : '신청하기' }}
      </el-button>

      <el-button
        v-else
        type="success"
        size="small"
        @click.stop="goToLecture"
      >
        학습하기
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Star,
  Clock,
  VideoPlay,
  User,
  UserFilled
} from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores/courses.ts'

// Props
interface Course {
  id: string
  title: string
  description: string
  thumbnail?: string
  instructor: string
  instructorPhoto?: string
  categoryId: string
  duration: number
  lectureCount: number
  enrollmentCount: number
  rating: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  price: number
  originalPrice?: number
  isNew?: boolean
  isBest?: boolean
}

interface Props {
  course: Course
  isEnrolled: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  enroll: [courseId: string]
}>()

// 상태
const router = useRouter()
const courseStore = useCourseStore()
const isEnrolling = ref(false)

// 계산된 속성
const categories = computed(() => courseStore.categories)

/**
 * 이벤트 핸들러
 */
const handleCardClick = () => {
  router.push(`/courses/${props.course.id}`)
}

const handleEnroll = async () => {
  try {
    isEnrolling.value = true
    emit('enroll', props.course.id)
  } finally {
    isEnrolling.value = false
  }
}

const goToLecture = () => {
  router.push(`/lectures/${props.course.id}`)
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/default-course.jpg'
}

/**
 * 유틸리티 함수
 */
const getCategoryName = (categoryId: string): string => {
  const category = categories.value.find(cat => cat.id === categoryId)
  return category?.name || '기타'
}

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}분`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(price)
}

const getDifficultyText = (difficulty: string): string => {
  const map: Record<string, string> = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급'
  }
  return map[difficulty] || '초급'
}

const getDifficultyType = (difficulty: string): string => {
  const map: Record<string, string> = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'danger'
  }
  return map[difficulty] || 'info'
}
</script>

<style scoped>
.course-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.course-card :deep(.el-card__body) {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.course-thumbnail {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  border-radius: 4px 4px 0 0;
}

.course-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.course-card:hover .course-thumbnail img {
  transform: scale(1.05);
}

.course-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
}

.course-rating {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.course-rating .el-icon {
  color: #F7BA2A;
}

.course-info {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.course-category {
  font-size: 12px;
  color: #409EFF;
  font-weight: 500;
}

.course-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.course-description {
  font-size: 14px;
  color: #606266;
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.course-instructor {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #909399;
}

.course-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.meta-item .el-icon {
  font-size: 14px;
}

.course-difficulty {
  margin-top: auto;
}

.course-footer {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.course-price {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.original-price {
  font-size: 12px;
  color: #909399;
  text-decoration: line-through;
}

.current-price {
  font-size: 16px;
  font-weight: 600;
  color: #F56C6C;
}

.current-price.free {
  color: #67C23A;
}

.course-footer .el-button {
  flex-shrink: 0;
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .course-thumbnail {
    height: 160px;
  }

  .course-meta {
    gap: 8px;
  }

  .meta-item {
    font-size: 11px;
  }

  .course-footer {
    padding: 10px 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .course-footer .el-button {
    width: 100%;
  }
}
