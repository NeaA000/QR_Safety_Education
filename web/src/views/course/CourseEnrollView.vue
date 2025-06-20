<!-- views/course/CourseEnrollView.vue - 강의 신청 페이지 -->
<template>
  <div class="course-enroll-view">
    <app-header />

    <div class="container mx-auto px-4 py-6">
      <!-- 강의 정보 카드 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 강의 썸네일 -->
          <div class="aspect-video bg-gray-200 rounded-lg overflow-hidden">
            <img v-if="course?.thumbnailUrl" :src="course.thumbnailUrl" :alt="course.title" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <el-icon class="text-6xl text-gray-400"><VideoPlay /></el-icon>
            </div>
          </div>

          <!-- 강의 기본 정보 -->
          <div>
            <div class="mb-4">
              <el-tag :type="getCategoryType(course?.category)" class="mb-2">
                {{ getCategoryText(course?.category) }}
              </el-tag>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ course?.title }}</h1>
              <p class="text-gray-600">{{ course?.description }}</p>
            </div>

            <!-- 강의 메타 정보 -->
            <div class="space-y-3 mb-6">
              <div class="flex items-center text-sm">
                <el-icon class="text-gray-500 mr-2"><Clock /></el-icon>
                <span>수강 시간: {{ course?.duration }}분</span>
              </div>
              <div class="flex items-center text-sm">
                <el-icon class="text-gray-500 mr-2"><Star /></el-icon>
                <span>난이도: {{ getDifficultyText(course?.difficulty) }}</span>
              </div>
              <div class="flex items-center text-sm">
                <el-icon class="text-gray-500 mr-2"><User /></el-icon>
                <span>수강생: {{ course?.enrolledCount || 0 }}명</span>
              </div>
              <div class="flex items-center text-sm">
                <el-icon class="text-gray-500 mr-2"><Calendar /></el-icon>
                <span>등록일: {{ formatDate(course?.createdAt) }}</span>
              </div>
            </div>

            <!-- 수강 신청 버튼 -->
            <div class="space-y-3">
              <el-button
                type="primary"
                size="large"
                :loading="isEnrolling"
                @click="enrollCourse"
                class="w-full"
                :disabled="isAlreadyEnrolled"
              >
                <el-icon class="mr-2">
                  <component :is="isAlreadyEnrolled ? 'Check' : 'Plus'" />
                </el-icon>
                {{ isAlreadyEnrolled ? '이미 수강 중' : '수강 신청하기' }}
              </el-button>

              <el-button
                v-if="isAlreadyEnrolled"
                size="large"
                @click="goToLearning"
                class="w-full"
              >
                <el-icon class="mr-2"><VideoPlay /></el-icon>
                학습 계속하기
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 강의 상세 정보 탭 -->
      <div class="bg-white rounded-lg shadow-sm">
        <el-tabs v-model="activeTab" class="p-6">
          <!-- 강의 소개 -->
          <el-tab-pane label="강의 소개" name="intro">
            <div class="prose max-w-none">
              <h3 class="text-lg font-semibold mb-4">이 강의에서 배우는 내용</h3>
              <div class="space-y-3 mb-6">
                <div v-for="(objective, index) in course?.learningObjectives || []" :key="index" class="flex items-start">
                  <el-icon class="text-green-500 mr-2 mt-1"><Check /></el-icon>
                  <span>{{ objective }}</span>
                </div>
              </div>

              <h3 class="text-lg font-semibold mb-4">강의 설명</h3>
              <div class="text-gray-700 leading-relaxed" v-html="course?.detailDescription"></div>
            </div>
          </el-tab-pane>

          <!-- 커리큘럼 -->
          <el-tab-pane label="커리큘럼" name="curriculum">
            <div class="space-y-4">
              <div v-for="(chapter, index) in course?.curriculum || []" :key="index" class="border rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-semibold">{{ chapter.title }}</h4>
                    <p class="text-sm text-gray-600">{{ chapter.description }}</p>
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ chapter.duration }}분
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 수료 조건 -->
          <el-tab-pane label="수료 조건" name="requirements">
            <div class="space-y-4">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 class="font-semibold text-blue-900 mb-2">
                  <el-icon class="mr-2"><InfoFilled /></el-icon>
                  수료 조건
                </h4>
                <ul class="space-y-2 text-sm text-blue-800">
                  <li class="flex items-center">
                    <el-icon class="mr-2"><Check /></el-icon>
                    전체 강의 시간의 {{ course?.completionCriteria?.minimumWatchTime || 80 }}% 이상 시청
                  </li>
                  <li v-if="course?.completionCriteria?.quizRequired" class="flex items-center">
                    <el-icon class="mr-2"><Check /></el-icon>
                    퀴즈 {{ course?.completionCriteria?.minimumQuizScore || 70 }}점 이상 획득
                  </li>
                  <li class="flex items-center">
                    <el-icon class="mr-2"><Check /></el-icon>
                    강의 중 이탈하지 않고 집중해서 시청
                  </li>
                </ul>
              </div>

              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 class="font-semibold text-green-900 mb-2">
                  <el-icon class="mr-2"><Medal /></el-icon>
                  수료 혜택
                </h4>
                <ul class="space-y-2 text-sm text-green-800">
                  <li class="flex items-center">
                    <el-icon class="mr-2"><Check /></el-icon>
                    공식 수료증 발급 (PDF 다운로드)
                  </li>
                  <li class="flex items-center">
                    <el-icon class="mr-2"><Check /></el-icon>
                    안전교육 이수 증명서 제공
                  </li>
                  <li class="flex items-center">
                    <el-icon class="mr-2"><Check /></el-icon>
                    관련 법정 교육 시간 인정
                  </li>
                </ul>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <app-footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useCourseStore } from '../../stores/course'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  VideoPlay,
  Clock,
  Star,
  User,
  Calendar,
  Plus,
  Check,
  InfoFilled,
  Medal
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const courseStore = useCourseStore()

// 상태
const course = ref(null)
const activeTab = ref('intro')
const isEnrolling = ref(false)
const isLoading = ref(true)

// 계산된 속성
const isAlreadyEnrolled = computed(() => {
  if (!course.value) return false
  return !!courseStore.courseProgress[course.value.id]
})

// 강의 정보 로드
const loadCourse = async () => {
  try {
    isLoading.value = true
    const courseId = route.params.id as string
    course.value = await courseStore.loadCourse(courseId)
  } catch (error) {
    console.error('강의 로드 실패:', error)
    ElMessage.error('강의 정보를 불러올 수 없습니다.')
    router.push('/courses')
  } finally {
    isLoading.value = false
  }
}

// 수강 신청
const enrollCourse = async () => {
  if (!authStore.isAuthenticated) {
    ElMessage.warning('로그인이 필요합니다.')
    router.push('/login')
    return
  }

  if (authStore.isAnonymous) {
    const result = await ElMessageBox.confirm(
      '게스트 사용자는 수강 기록이 저장되지 않습니다. 회원가입을 하시겠습니까?',
      '회원가입 안내',
      {
        confirmButtonText: '회원가입',
        cancelButtonText: '게스트로 계속',
        type: 'warning'
      }
    ).catch(() => 'cancel')

    if (result === 'confirm') {
      router.push('/register')
      return
    }
  }

  try {
    isEnrolling.value = true
    await courseStore.startCourse(course.value.id)
    ElMessage.success('수강 신청이 완료되었습니다!')

    // 학습 페이지로 이동할지 묻기
    const result = await ElMessageBox.confirm(
      '지금 바로 학습을 시작하시겠습니까?',
      '학습 시작',
      {
        confirmButtonText: '학습 시작',
        cancelButtonText: '나중에',
        type: 'info'
      }
    ).catch(() => 'cancel')

    if (result === 'confirm') {
      goToLearning()
    }
  } catch (error) {
    console.error('수강 신청 실패:', error)
    ElMessage.error('수강 신청에 실패했습니다. 다시 시도해주세요.')
  } finally {
    isEnrolling.value = false
  }
}

// 학습 페이지로 이동
const goToLearning = () => {
  router.push(`/learning/${course.value.id}`)
}

// 유틸리티 함수들
const getCategoryType = (category: string) => {
  const types = {
    'safety': 'danger',
    'work-safety': 'warning',
    'fire-safety': 'success'
  }
  return types[category] || 'info'
}

const getCategoryText = (category: string) => {
  const texts = {
    'safety': '안전교육',
    'work-safety': '작업안전',
    'fire-safety': '화재안전'
  }
  return texts[category] || '기타'
}

const getDifficultyText = (difficulty: string) => {
  const texts = {
    'beginner': '초급',
    'intermediate': '중급',
    'advanced': '고급'
  }
  return texts[difficulty] || '미정'
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('ko-KR')
}

// 초기화
onMounted(() => {
  loadCourse()
})
</script>

<style scoped>
.prose {
  color: #374151;
}

.prose h3 {
  margin-bottom: 1rem;
}

.prose ul {
  list-style: none;
  padding: 0;
}

.prose li {
  margin-bottom: 0.5rem;
}

/* 탭 스타일 커스터마이징 */
:deep(.el-tabs__item) {
  font-weight: 500;
}

:deep(.el-tabs__item.is-active) {
  color: #3b82f6;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
