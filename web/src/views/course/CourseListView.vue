<template>
  <div class="course-list-container">
    <!-- 헤더 -->
    <div class="header">
      <div class="header-content">
        <el-button
          @click="goBack"
          :icon="ArrowLeft"
          circle
        />
        <h1 class="page-title">강의 신청</h1>
        <div class="header-actions">
          <el-button
            @click="goToMyCourses"
            type="primary"
            size="small"
          >
            내 강의
          </el-button>
        </div>
      </div>
    </div>

    <!-- 검색 및 필터 -->
    <div class="search-filter-section">
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="강의명, 강사명으로 검색하세요"
          size="large"
          :prefix-icon="Search"
          @input="handleSearch"
          clearable
        />
      </div>

      <div class="filter-bar">
        <el-scrollbar>
          <div class="category-filter">
            <el-button
              :type="selectedCategory === 'all' ? 'primary' : ''"
              @click="filterByCategory('all')"
              size="small"
            >
              전체
            </el-button>
            <el-button
              v-for="category in categories"
              :key="category.id"
              :type="selectedCategory === category.id ? 'primary' : ''"
              @click="filterByCategory(category.id)"
              size="small"
            >
              {{ category.name }}
            </el-button>
          </div>
        </el-scrollbar>

        <el-select
          v-model="sortBy"
          placeholder="정렬"
          size="small"
          style="width: 120px"
          @change="handleSort"
        >
          <el-option label="최신순" value="latest" />
          <el-option label="인기순" value="popular" />
          <el-option label="평점순" value="rating" />
          <el-option label="가격순" value="price" />
        </el-select>
      </div>
    </div>

    <!-- 강의 목록 -->
    <div class="main-content">
      <div v-if="isLoading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="filteredCourses.length === 0" class="empty-container">
        <el-empty description="조건에 맞는 강의가 없습니다">
          <el-button type="primary" @click="resetFilters">
            필터 초기화
          </el-button>
        </el-empty>
      </div>

      <div v-else class="course-grid">
        <CourseCard
          v-for="course in filteredCourses"
          :key="course.id"
          :course="course"
          :is-enrolled="isEnrolled(course.id)"
          @click="goToCourseDetail(course.id)"
          @enroll="handleEnroll(course.id)"
        />
      </div>

      <!-- 더보기 버튼 (페이지네이션) -->
      <div v-if="hasMore" class="load-more">
        <el-button
          @click="loadMore"
          :loading="isLoadingMore"
          size="large"
          style="width: 200px"
        >
          더보기
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores/courses'
import CourseCard from '@/components/course/CourseCard.vue'

// 타입 정의
type SortType = 'latest' | 'popular' | 'rating' | 'price'

// 스토어 및 라우터
const router = useRouter()
const courseStore = useCourseStore()

// 상태
const isLoadingMore = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = 12

// 계산된 속성
const isLoading = computed(() => courseStore.isLoading)
const filteredCourses = computed(() => courseStore.filteredCourses)
const categories = computed(() => courseStore.categories)
const isEnrolled = computed(() => courseStore.isEnrolled)

// 검색 및 필터 상태
const searchQuery = computed({
  get: () => courseStore.searchQuery,
  set: (value: string) => courseStore.searchCourses(value)
})

const selectedCategory = computed({
  get: () => courseStore.selectedCategory,
  set: (value: string) => courseStore.filterByCategory(value)
})

const sortBy = computed({
  get: () => courseStore.sortBy,
  set: (value: SortType) => courseStore.sortCourses(value)
})

/**
 * 이벤트 핸들러
 */
const goBack = () => {
  router.go(-1)
}

const goToMyCourses = () => {
  router.push('/my-courses')
}

const goToCourseDetail = (courseId: string) => {
  router.push(`/courses/${courseId}`)
}

const handleSearch = (query: string) => {
  courseStore.searchCourses(query)
}

const filterByCategory = (categoryId: string) => {
  courseStore.filterByCategory(categoryId)
}

const handleSort = (sortType: SortType) => {
  courseStore.sortCourses(sortType)
}

const resetFilters = () => {
  courseStore.resetFilters()
}

const handleEnroll = async (courseId: string) => {
  try {
    // 강의 등록 페이지로 이동
    router.push(`/courses/${courseId}/enroll`)
  } catch (error: any) {
    ElMessage.error(error.message || '강의 신청 페이지로 이동할 수 없습니다.')
  }
}

const loadMore = async () => {
  try {
    isLoadingMore.value = true
    currentPage.value += 1

    // TODO: 페이지네이션 로직 구현
    // await courseStore.loadMoreCourses(currentPage.value, pageSize)

    // 임시로 hasMore를 false로 설정
    hasMore.value = false

  } catch (error) {
    ElMessage.error('더 많은 강의를 불러오는데 실패했습니다.')
  } finally {
    isLoadingMore.value = false
  }
}

/**
 * 초기화
 */
onMounted(async () => {
  try {
    await courseStore.initialize()
  } catch (error) {
    ElMessage.error('강의 목록을 불러오는데 실패했습니다.')
  }
})

// 필터 변경 감지
watch([searchQuery, selectedCategory, sortBy], () => {
  currentPage.value = 1
  hasMore.value = true
})
</script>

<style scoped>
.course-list-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  padding: 16px 20px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.search-filter-section {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.search-bar {
  max-width: 1200px;
  margin: 0 auto 16px;
}

.filter-bar {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.category-filter {
  display: flex;
  gap: 8px;
  white-space: nowrap;
  padding: 4px 0;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container {
  padding: 40px 0;
}

.empty-container {
  padding: 60px 0;
  text-align: center;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.load-more {
  text-align: center;
  padding: 20px 0;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .search-filter-section {
    padding: 16px;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .category-filter {
    justify-content: flex-start;
  }

  .main-content {
    padding: 16px;
  }

  .course-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .course-grid {
    grid-template-columns: 1fr;
  }
}
</style>
