<!-- views/course/CourseListView.vue - 수정된 강의 목록 페이지 -->
<template>
  <div class="course-list-view">
    <app-header />

    <div class="container mx-auto px-4 py-6">
      <!-- 페이지 헤더 -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">강의 목록</h1>
          <p class="text-gray-600 mt-1">다양한 안전교육 강의를 수강하세요</p>
        </div>

        <!-- 뷰 토글 (그리드/리스트) -->
        <div class="flex items-center space-x-2">
          <el-button-group>
            <el-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              @click="viewMode = 'grid'"
              size="small"
            >
              <el-icon><Grid /></el-icon>
            </el-button>
            <el-button
              :type="viewMode === 'list' ? 'primary' : 'default'"
              @click="viewMode = 'list'"
              size="small"
            >
              <el-icon><List /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 필터 및 검색 -->
      <course-filter @filter="handleFilter" />

      <!-- 정렬 및 결과 수 -->
      <div class="flex items-center justify-between mb-6">
        <div class="text-sm text-gray-600">
          총 <strong>{{ filteredCourses.length }}</strong>개의 강의
        </div>

        <el-select v-model="sortBy" @change="applySorting" size="small" style="width: 150px">
          <el-option label="최신순" value="newest" />
          <el-option label="인기순" value="popular" />
          <el-option label="이름순" value="name" />
          <el-option label="시간순" value="duration" />
        </el-select>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <loading-spinner message="강의를 불러오는 중..." />
      </div>

      <!-- 강의 목록 -->
      <div v-else-if="filteredCourses.length > 0">
        <!-- 그리드 뷰 -->
        <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <course-card
            v-for="course in paginatedCourses"
            :key="course.id"
            :course="course"
            :progress="getProgress(course.id)"
            @click="goToCourseDetail(course.id)"
            class="hover:transform hover:scale-105 transition-transform duration-200"
          />
        </div>

        <!-- 리스트 뷰 -->
        <div v-else class="space-y-4">
          <div
            v-for="course in paginatedCourses"
            :key="course.id"
            class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            @click="goToCourseDetail(course.id)"
          >
            <div class="flex items-start space-x-4">
              <!-- 썸네일 -->
              <div class="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                <img v-if="course.thumbnailUrl" :src="course.thumbnailUrl" :alt="course.title" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <el-icon class="text-2xl text-gray-400"><VideoPlay /></el-icon>
                </div>
              </div>

              <!-- 강의 정보 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ course.title }}</h3>
                    <p class="text-gray-600 text-sm mb-2 line-clamp-2">{{ course.description }}</p>

                    <div class="flex items-center space-x-4 text-xs text-gray-500">
                      <span class="flex items-center">
                        <el-icon class="mr-1"><Clock /></el-icon>
                        {{ course.duration }}분
                      </span>
                      <span class="flex items-center">
                        <el-icon class="mr-1"><Star /></el-icon>
                        {{ getDifficultyText(course.difficulty) }}
                      </span>
                      <span class="flex items-center">
                        <el-icon class="mr-1"><User /></el-icon>
                        {{ course.enrolledCount || 0 }}명 수강
                      </span>
                    </div>
                  </div>

                  <!-- 액션 버튼 -->
                  <div class="flex flex-col space-y-2">
                    <el-tag :type="getCategoryType(course.category)" size="small">
                      {{ getCategoryText(course.category) }}
                    </el-tag>

                    <!-- 진행률이 있으면 계속 학습, 없으면 수강 신청 -->
                    <el-button
                      v-if="getProgress(course.id)"
                      type="primary"
                      size="small"
                      @click.stop="continueLearning(course.id)"
                    >
                      계속 학습
                    </el-button>
                    <el-button
                      v-else-if="isEnrolled(course.id)"
                      type="success"
                      size="small"
                      @click.stop="startLearning(course.id)"
                    >
                      학습 시작
                    </el-button>
                    <el-button
                      v-else
                      size="small"
                      @click.stop="goToCourseEnroll(course.id)"
                    >
                      수강 신청
                    </el-button>
                  </div>
                </div>

                <!-- 진행률 (수강 중인 경우) -->
                <div v-if="getProgress(course.id)" class="mt-3">
                  <div class="flex justify-between text-xs mb-1">
                    <span>진행률</span>
                    <span>{{ Math.round(getProgress(course.id).percentage) }}%</span>
                  </div>
                  <el-progress :percentage="getProgress(course.id).percentage" :stroke-width="4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else class="text-center py-12">
        <el-icon class="text-6xl text-gray-400 mb-4"><DocumentCopy /></el-icon>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">강의가 없습니다</h3>
        <p class="text-gray-600 mb-4">다른 검색 조건으로 시도해보세요</p>
        <el-button @click="clearFilters">필터 초기화</el-button>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="filteredCourses.length > pageSize" class="flex justify-center mt-8">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredCourses.length"
          layout="prev, pager, next, jumper"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <app-footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '../../stores/course'
import { useAuthStore } from '../../stores/auth'
import CourseCard from '../../components/course/CourseCard.vue'
import CourseFilter from '../../components/course/CourseFilter.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import AppHeader from '../../components/common/AppHeader.vue'
import AppFooter from '../../components/common/AppFooter.vue'
import {
  Grid,
  List,
  VideoPlay,
  Clock,
  Star,
  User,
  DocumentCopy
} from '@element-plus/icons-vue'

const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore()

// 상태
const isLoading = ref(true)
const viewMode = ref<'grid' | 'list'>('grid')
const currentPage = ref(1)
const pageSize = ref(12)
const sortBy = ref('newest')
const filters = ref({
  category: '',
  difficulty: '',
  search: ''
})

// 계산된 속성
const filteredCourses = computed(() => {
  let courses = [...courseStore.courses]

  // 필터 적용
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    courses = courses.filter(course =>
      course.title.toLowerCase().includes(search) ||
      course.description.toLowerCase().includes(search) ||
      course.tags.some(tag => tag.toLowerCase().includes(search))
    )
  }

  // 정렬 적용
  courses.sort((a, b) => {
    switch (sortBy.value) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'popular':
        return (b.enrolledCount || 0) - (a.enrolledCount || 0)
      case 'name':
        return a.title.localeCompare(b.title, 'ko')
      case 'duration':
        return a.duration - b.duration
      default:
        return 0
    }
  })

  return courses
})

const paginatedCourses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredCourses.value.slice(start, end)
})

// 메서드
const handleFilter = (newFilters: typeof filters.value) => {
  filters.value = { ...newFilters }
  currentPage.value = 1
}

const applySorting = () => {
  currentPage.value = 1
}

const handlePageChange = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const clearFilters = () => {
  filters.value = {
    category: '',
    difficulty: '',
    search: ''
  }
  sortBy.value = 'newest'
  currentPage.value = 1
}

const getProgress = (courseId: string) => {
  const progress = courseStore.courseProgress[courseId]
  if (!progress) return null

  const percentage = (progress.watchedTime / progress.totalTime) * 100
  return { percentage: Math.min(percentage, 100) }
}

const isEnrolled = (courseId: string) => {
  return courseStore.enrolledCourses.includes(courseId)
}

const goToCourseDetail = (courseId: string) => {
  router.push(`/courses/${courseId}`)
}

const goToCourseEnroll = (courseId: string) => {
  router.push(`/courses/${courseId}/enroll`)
}

const startLearning = (courseId: string) => {
  // 신청했지만 아직 시작하지 않은 강의 - 안전 경고부터 시작
  router.push(`/learning/${courseId}/warning`)
}

const continueLearning = (courseId: string) => {
  // 진행 중인 강의 이어보기
  router.push(`/learning/${courseId}`)
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

// 초기화
onMounted(async () => {
  try {
    await courseStore.loadCourses()
    await courseStore.loadCourseProgress()
    await courseStore.loadEnrolledCourses()
  } catch (error) {
    console.error('강의 목록 로드 실패:', error)
  } finally {
    isLoading.value = false
  }
})

// 뷰 모드 저장
watch(viewMode, (newMode) => {
  localStorage.setItem('courseListViewMode', newMode)
})

// 저장된 뷰 모드 복원
onMounted(() => {
  const savedViewMode = localStorage.getItem('courseListViewMode') as 'grid' | 'list'
  if (savedViewMode) {
    viewMode.value = savedViewMode
  }
})
</script>

<style scoped>
/* 카드 호버 효과 */
.hover\:transform:hover {
  transform: translateY(-2px);
}

/* 리스트 아이템 호버 효과 */
.hover\:shadow-md:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* 페이지네이션 스타일 */
:deep(.el-pagination) {
  justify-content: center;
}

:deep(.el-pagination .el-pager li) {
  min-width: 32px;
  height: 32px;
  line-height: 32px;
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

  .space-x-4 > * + * {
    margin-left: 0.5rem;
  }
}

@media (max-width: 640px) {
  .flex.items-start.space-x-4 {
    flex-direction: column;
    space-x: 0;
  }

  .w-32.h-20 {
    width: 100%;
    height: 120px;
  }
}
</style>category) {
courses = courses.filter(course => course.category === filters.value.category)
}

if (filters.value.difficulty) {
courses = courses.filter(course => course.difficulty === filters.value.difficulty)
}

if (filters.value.
