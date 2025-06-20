<template>
  <el-card class="my-course-card" shadow="hover">
    <div class="course-content">
      <!-- 썸네일 -->
      <div class="course-thumbnail">
        <img
          :src="courseData?.thumbnail || '/default-course.jpg'"
          :alt="enrollment.courseName"
          @error="handleImageError"
        />
        <div class="progress-overlay">
          <div class="progress-circle">
            <el-progress
              type="circle"
              :percentage="enrollment.progress"
              :width="60"
              :stroke-width="6"
              :color="progressColor"
            />
          </div>
        </div>
        <div class="status-badge">
          <el-tag :type="statusType" size="small">
            {{ statusText }}
          </el-tag>
        </div>
      </div>

      <!-- 강의 정보 -->
      <div class="course-info">
        <div class="course-header">
          <h3 class="course-title" :title="enrollment.courseName">
            {{ enrollment.courseName }}
          </h3>
          <el-dropdown @command="handleMenuCommand">
            <el-button :icon="MoreFilled" circle size="small" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="view-course">강의 정보</el-dropdown-item>
                <el-dropdown-item
                  v-if="enrollment.status === 'active'"
                  command="pause"
                >
                  일시정지
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="enrollment.status === 'paused'"
                  command="resume"
                >
                  재개하기
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="isCompleted"
                  command="certificate"
                >
                  수료증 보기
                </el-dropdown-item>
                <el-dropdown-item divided command="remove">
                  강의 삭제
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="course-meta">
          <div class="meta-item">
            <el-icon><User /></el-icon>
            <span>{{ courseData?.instructor || '강사 정보 없음' }}</span>
          </div>
          <div class="meta-item">
            <el-icon><Clock /></el-icon>
            <span>마지막 학습: {{ formatLastAccessed(enrollment.lastAccessedAt) }}</span>
          </div>
        </div>

        <div class="progress-info">
          <div class="progress-text">
            <span>진행률: {{ enrollment.progress }}%</span>
            <span class="lecture-progress">
              {{ enrollment.completedLectures?.length || 0 }} / {{ enrollment.totalLectures }} 강의
            </span>
          </div>
          <el-progress
            :percentage="enrollment.progress"
            :stroke-width="8"
            :color="progressColor"
            :show-text="false"
          />
        </div>

        <div class="learning-stats" v-if="enrollment.watchTime">
          <div class="stat-item">
            <span class="stat-label">학습 시간</span>
            <span class="stat-value">{{ formatDuration(enrollment.watchTime) }}</span>
          </div>
          <div class="stat-item" v-if="enrollment.lastLecture">
            <span class="stat-label">최근 강의</span>
            <span class="stat-value">{{ enrollment.lastLecture }}</span>
          </div>
        </div>
      </div>

      <!-- 액션 버튼 -->
      <div class="course-actions">
        <el-button
          v-if="!isCompleted"
          type="primary"
          size="large"
          @click="handleContinue"
          :disabled="enrollment.status === 'paused'"
        >
          <el-icon><VideoPlay /></el-icon>
          {{ enrollment.progress === 0 ? '학습 시작' : '이어서 학습' }}
        </el-button>

        <el-button
          v-else
          type="success"
          size="large"
          @click="handleViewCertificate"
        >
          <el-icon><Trophy /></el-icon>
          수료증 보기
        </el-button>

        <div class="action-info">
          <div v-if="enrollment.enrolledAt" class="enrolled-date">
            등록일: {{ formatDate(enrollment.enrolledAt) }}
          </div>
          <div v-if="isCompleted && enrollment.completedAt" class="completed-date">
            완료일: {{ formatDate(enrollment.completedAt) }}
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Clock,
  VideoPlay,
  Trophy,
  MoreFilled
} from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores/courses.ts'

// Props
interface Enrollment {
  id: string
  courseId: string
  courseName: string
  enrolledAt: Date
  lastAccessedAt: Date
  completedAt?: Date
  status: 'active' | 'completed' | 'paused'
  progress: number
  completedLectures: string[]
  totalLectures: number
  watchTime?: number
  lastLecture?: string
}

interface Props {
  enrollment: Enrollment
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  continue: [enrollment: Enrollment]
  'view-certificate': [enrollment: Enrollment]
  pause: [enrollment: Enrollment]
  resume: [enrollment: Enrollment]
}>()

// 상태
const courseStore = useCourseStore()
const courseData = ref(null)

// 계산된 속성
const isCompleted = computed(() =>
  props.enrollment.status === 'completed' || props.enrollment.progress >= 100
)

const statusText = computed(() => {
  switch (props.enrollment.status) {
    case 'completed':
      return '완료'
    case 'paused':
      return '일시정지'
    case 'active':
      return props.enrollment.progress === 0 ? '시작 전' : '진행 중'
    default:
      return '알 수 없음'
  }
})

const statusType = computed(() => {
  switch (props.enrollment.status) {
    case 'completed':
      return 'success'
    case 'paused':
      return 'warning'
    case 'active':
      return props.enrollment.progress === 0 ? 'info' : 'primary'
    default:
      return 'info'
  }
})

const progressColor = computed(() => {
  if (props.enrollment.progress >= 100) return '#67C23A'
  if (props.enrollment.progress >= 50) return '#E6A23C'
  return '#409EFF'
})

/**
 * 이벤트 핸들러
 */
const handleContinue = () => {
  emit('continue', props.enrollment)
}

const handleViewCertificate = () => {
  emit('view-certificate', props.enrollment)
}

const handleMenuCommand = async (command: string) => {
  switch (command) {
    case 'view-course':
      // TODO: 강의 상세 페이지로 이동
      break
    case 'pause':
      await handlePause()
      break
    case 'resume':
      await handleResume()
      break
    case 'certificate':
      handleViewCertificate()
      break
    case 'remove':
      await handleRemove()
      break
  }
}

const handlePause = async () => {
  try {
    await ElMessageBox.confirm(
      '강의를 일시정지하시겠습니까?',
      '강의 일시정지',
      {
        confirmButtonText: '일시정지',
        cancelButtonText: '취소',
        type: 'warning'
      }
    )
    emit('pause', props.enrollment)
  } catch {
    // 취소
  }
}

const handleResume = async () => {
  emit('resume', props.enrollment)
}

const handleRemove = async () => {
  try {
    await ElMessageBox.confirm(
      '정말로 이 강의를 삭제하시겠습니까?\n삭제된 강의는 복구할 수 없습니다.',
      '강의 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'error'
      }
    )

    // TODO: 강의 삭제 API 호출
    ElMessage.success('강의가 삭제되었습니다.')

  } catch {
    // 취소
  }
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/default-course.jpg'
}

/**
 * 유틸리티 함수
 */
const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj)
}

const formatLastAccessed = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - dateObj.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return '오늘'
  if (diffDays === 2) return '어제'
  if (diffDays <= 7) return `${diffDays - 1}일 전`
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)}주 전`
  return formatDate(dateObj)
}

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}분`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
}

/**
 * 초기화
 */
onMounted(async () => {
  try {
    // 강의 상세 정보 로드 (캐시된 정보가 있다면 사용)
    const cachedCourse = courseStore.courses.find(c => c.id === props.enrollment.courseId)
    if (cachedCourse) {
      courseData.value = cachedCourse
    } else {
      // TODO: 개별 강의 정보 로드
    }
  } catch (error) {
    console.warn('강의 정보 로드 실패:', error)
  }
})
</script>

<style scoped>
.my-course-card {
  transition: all 0.3s ease;
}

.my-course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.my-course-card :deep(.el-card__body) {
  padding: 0;
}

.course-content {
  display: grid;
  grid-template-columns: 200px 1fr auto;
  gap: 20px;
  padding: 20px;
  align-items: start;
}

.course-thumbnail {
  position: relative;
  width: 200px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.course-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.progress-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  padding: 4px;
}

.status-badge {
  position: absolute;
  top: 8px;
  right: 8px;
}

.course-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.course-title {
  font-size: 18px;
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

.course-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
}

.meta-item .el-icon {
  font-size: 14px;
}

.progress-info {
  margin-top: 8px;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.progress-text > span:first-child {
  font-weight: 600;
  color: #303133;
}

.lecture-progress {
  color: #909399;
  font-size: 13px;
}

.learning-stats {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.course-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  min-width: 140px;
}

.action-info {
  text-align: center;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.enrolled-date,
.completed-date {
  margin-bottom: 4px;
}

.completed-date {
  color: #67C23A;
  font-weight: 500;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .course-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .course-thumbnail {
    width: 100%;
    height: 160px;
  }

  .course-header {
    align-items: center;
  }

  .course-actions {
    align-items: stretch;
    min-width: auto;
  }

  .learning-stats {
    flex-direction: column;
    gap: 8px;
  }

  .progress-text {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .course-content {
    padding: 16px;
  }

  .course-thumbnail {
    height: 140px;
  }

  .course-title {
    font-size: 16px;
  }

  .meta-item {
    font-size: 12px;
  }
}
</style>
