<template>
  <div class="course-detail-container">
    <!-- 헤더 -->
    <div class="header">
      <div class="header-content">
        <el-button
          @click="goBack"
          :icon="ArrowLeft"
          circle
        />
        <h1 class="page-title">강의 상세</h1>
        <div class="header-actions">
          <el-button
            @click="shareCourse"
            :icon="Share"
            circle
          />
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else-if="currentCourse" class="main-content">
      <!-- 강의 기본 정보 -->
      <div class="course-hero">
        <div class="course-thumbnail">
          <img
            :src="currentCourse.thumbnail || '/default-course.jpg'"
            :alt="currentCourse.title"
          />
          <div class="play-button" v-if="isEnrolled">
            <el-button
              type="primary"
              :icon="VideoPlay"
              size="large"
              round
              @click="goToLecture"
            >
              학습 시작
            </el-button>
          </div>
        </div>

        <div class="course-info">
          <div class="course-category">
            <el-tag>{{ getCategoryName(currentCourse.categoryId) }}</el-tag>
          </div>

          <h1 class="course-title">{{ currentCourse.title }}</h1>

          <p class="course-description">{{ currentCourse.description }}</p>

          <div class="course-stats">
            <div class="stat-item">
              <el-icon><Star /></el-icon>
              <span>{{ (currentCourse.rating || 0).toFixed(1) }}</span>
              <span class="review-count">({{ currentCourse.reviewCount || 0 }}개 리뷰)</span>
            </div>
            <div class="stat-item">
              <el-icon><User /></el-icon>
              <span>{{ currentCourse.enrollmentCount || 0 }}명 수강</span>
            </div>
            <div class="stat-item">
              <el-icon><Clock /></el-icon>
              <span>{{ formatDuration(currentCourse.duration || 0) }}</span>
            </div>
          </div>

          <div class="instructor-info">
            <el-avatar
              :src="currentCourse.instructorPhoto"
              :icon="UserFilled"
              :size="40"
            />
            <div class="instructor-details">
              <h4>{{ currentCourse.instructor }}</h4>
              <p>{{ currentCourse.instructorTitle || '강사' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 가격 및 신청 섹션 -->
      <div class="enrollment-section">
        <div class="price-info">
          <div v-if="currentCourse.originalPrice && currentCourse.originalPrice > currentCourse.price" class="original-price">
            {{ formatPrice(currentCourse.originalPrice) }}
          </div>
          <div class="current-price" :class="{ free: currentCourse.price === 0 }">
            {{ currentCourse.price === 0 ? '무료' : formatPrice(currentCourse.price) }}
          </div>
          <div v-if="currentCourse.discountRate" class="discount-rate">
            {{ currentCourse.discountRate }}% 할인
          </div>
        </div>

        <div class="enrollment-actions">
          <el-button
            v-if="!isEnrolled"
            type="primary"
            size="large"
            @click="handleEnroll"
            :loading="isEnrolling"
            style="width: 200px"
          >
            {{ currentCourse.price === 0 ? '무료 신청' : '신청하기' }}
          </el-button>

          <el-button
            v-else
            type="success"
            size="large"
            @click="goToLecture"
            style="width: 200px"
          >
            학습하기
          </el-button>

          <el-button
            @click="addToWishlist"
            :icon="isWishlisted ? StarFilled : Star"
            :type="isWishlisted ? 'warning' : 'default'"
          >
            {{ isWishlisted ? '찜 해제' : '찜하기' }}
          </el-button>
        </div>
      </div>

      <!-- 탭 메뉴 -->
      <el-tabs v-model="activeTab" class="course-tabs">
        <el-tab-pane label="강의 소개" name="description">
          <div class="tab-content">
            <div class="course-objectives" v-if="currentCourse.objectives?.length">
              <h3>학습 목표</h3>
              <ul>
                <li v-for="objective in currentCourse.objectives" :key="objective">
                  {{ objective }}
                </li>
              </ul>
            </div>

            <div class="course-requirements" v-if="currentCourse.requirements?.length">
              <h3>수강 요건</h3>
              <ul>
                <li v-for="requirement in currentCourse.requirements" :key="requirement">
                  {{ requirement }}
                </li>
              </ul>
            </div>

            <div class="course-content" v-if="currentCourse.content">
              <h3>강의 내용</h3>
              <div v-html="currentCourse.content"></div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="커리큘럼" name="curriculum">
          <div class="tab-content">
            <div class="curriculum-summary">
              <div class="summary-item">
                <strong>{{ currentCourse.lectureCount || 0 }}</strong>개 강의
              </div>
              <div class="summary-item">
                <strong>{{ formatDuration(currentCourse.duration || 0) }}</strong> 총 시간
              </div>
            </div>

            <div class="curriculum-list" v-if="currentCourse.curriculum?.length">
              <div
                v-for="(section, index) in currentCourse.curriculum"
                :key="section.id"
                class="curriculum-section"
              >
                <div class="section-header">
                  <h4>{{ section.title }}</h4>
                  <span class="section-info">
                    {{ section.lectures?.length || 0 }}강 · {{ formatDuration(section.duration || 0) }}
                  </span>
                </div>

                <div class="lecture-list" v-if="section.lectures?.length">
                  <div
                    v-for="lecture in section.lectures"
                    :key="lecture.id"
                    class="lecture-item"
                  >
                    <div class="lecture-info">
                      <el-icon><VideoPlay /></el-icon>
                      <span>{{ lecture.title }}</span>
                    </div>
                    <div class="lecture-duration">
                      {{ formatDuration(lecture.duration) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="no-curriculum">
              <el-empty description="커리큘럼 정보가 없습니다" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="리뷰" name="reviews">
          <div class="tab-content">
            <div class="review-summary">
              <div class="rating-overview">
                <div class="overall-rating">
                  <span class="rating-score">{{ (currentCourse.rating || 0).toFixed(1) }}</span>
                  <el-rate
                    :model-value="currentCourse.rating || 0"
                    disabled
                    show-score
                  />
                  <span class="review-count">{{ currentCourse.reviewCount || 0 }}개 리뷰</span>
                </div>
              </div>
            </div>

            <div class="review-list" v-if="reviews.length">
              <div
                v-for="review in reviews"
                :key="review.id"
                class="review-item"
              >
                <div class="review-header">
                  <el-avatar
                    :src="review.userPhoto"
                    :icon="UserFilled"
                    :size="32"
                  />
                  <div class="review-user">
                    <h5>{{ review.userName }}</h5>
                    <el-rate :model-value="review.rating" disabled size="small" />
                  </div>
                  <div class="review-date">
                    {{ formatDate(review.createdAt) }}
                  </div>
                </div>
                <div class="review-content">
                  {{ review.content }}
                </div>
              </div>
            </div>

            <el-empty v-else description="아직 리뷰가 없습니다" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-container">
      <el-result
        icon="error"
        title="강의를 불러올 수 없습니다"
        :sub-title="error"
      >
        <template #extra>
          <el-button type="primary" @click="retryLoad">다시 시도</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Share,
  VideoPlay,
  Star,
  StarFilled,
  User,
  UserFilled,
  Clock
} from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores/courses'

// 라우터
const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()

// 상태
const activeTab = ref('description')
const isEnrolling = ref(false)
const isWishlisted = ref(false)

// 계산된 속성
const courseId = computed(() => route.params.id as string)
const isLoading = computed(() => courseStore.isLoading)
const error = computed(() => courseStore.error)
const currentCourse = computed(() => courseStore.currentCourse)
const categories = computed(() => courseStore.categories)
const reviews = computed(() => courseStore.reviews)
const isEnrolled = computed(() => courseStore.isEnrolled(courseId.value))

/**
 * 이벤트 핸들러
 */
const goBack = () => {
  router.go(-1)
}

const goToLecture = () => {
  router.push(`/lectures/${courseId.value}`)
}

const handleEnroll = async () => {
  try {
    if (currentCourse.value && currentCourse.value.price > 0) {
      await ElMessageBox.confirm(
        `${formatPrice(currentCourse.value.price)}를 결제하시겠습니까?`,
        '강의 신청',
        {
          confirmButtonText: '결제하기',
          cancelButtonText: '취소',
          type: 'info'
        }
      )
    }

    isEnrolling.value = true
    await courseStore.enrollInCourse(courseId.value)
    ElMessage.success('강의 신청이 완료되었습니다.')

  } catch (error: any) {
    if (error.message !== 'cancel') {
      ElMessage.error(error.message || '강의 신청에 실패했습니다.')
    }
  } finally {
    isEnrolling.value = false
  }
}

const addToWishlist = () => {
  isWishlisted.value = !isWishlisted.value
  ElMessage.success(isWishlisted.value ? '찜 목록에 추가되었습니다.' : '찜 목록에서 제거되었습니다.')
}

const shareCourse = () => {
  if (navigator.share && currentCourse.value) {
    navigator.share({
      title: currentCourse.value.title,
      text: currentCourse.value.description,
      url: window.location.href
    })
  } else {
    navigator.clipboard.writeText(window.location.href)
    ElMessage.success('링크가 클립보드에 복사되었습니다.')
  }
}

const retryLoad = async () => {
  try {
    await courseStore.loadCourseDetail(courseId.value)
  } catch (error) {
    ElMessage.error('강의 정보를 불러오는데 실패했습니다.')
  }
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

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

/**
 * 초기화
 */
onMounted(async () => {
  try {
    await Promise.all([
      courseStore.loadCourseDetail(courseId.value),
      courseStore.loadCategories(),
      courseStore.loadCourseReviews(courseId.value)
    ])
  } catch (error) {
    console.error('강의 상세 정보 로드 실패:', error)
  }
})
</script>

<style scoped>
.course-detail-container {
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

.loading-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.error-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.course-hero {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
}

.course-thumbnail {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
}

.course-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.course-category {
  margin-bottom: 8px;
}

.course-title {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 0;
  line-height: 1.3;
}

.course-description {
  font-size: 16px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

.course-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.review-count {
  color: #909399;
  font-size: 13px;
}

.instructor-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid #ebeef5;
}

.instructor-details h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px;
}

.instructor-details p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.enrollment-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.original-price {
  font-size: 16px;
  color: #909399;
  text-decoration: line-through;
}

.current-price {
  font-size: 24px;
  font-weight: 700;
  color: #F56C6C;
}

.current-price.free {
  color: #67C23A;
}

.discount-rate {
  font-size: 14px;
  color: #E6A23C;
  background: #FDF6EC;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.enrollment-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.course-tabs {
  background: white;
  border-radius: 8px;
  padding: 0;
}

.course-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 24px;
  border-bottom: 1px solid #ebeef5;
}

.tab-content {
  padding: 24px;
}

.course-objectives h3,
.course-requirements h3,
.course-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
}

.course-objectives ul,
.course-requirements ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.course-objectives li,
.course-requirements li {
  padding: 8px 0;
  border-bottom: 1px solid #f5f7fa;
  position: relative;
  padding-left: 20px;
}

.course-objectives li:before,
.course-requirements li:before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #67C23A;
  font-weight: 600;
}

.curriculum-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.summary-item {
  font-size: 14px;
  color: #606266;
}

.summary-item strong {
  color: #303133;
  font-size: 16px;
}

.curriculum-section {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin-bottom: 16px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.section-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.section-info {
  font-size: 14px;
  color: #909399;
}

.lecture-list {
  background: white;
}

.lecture-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f5f7fa;
}

.lecture-item:last-child {
  border-bottom: none;
}

.lecture-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.lecture-duration {
  font-size: 13px;
  color: #909399;
}

.no-curriculum {
  text-align: center;
  padding: 40px;
}

.review-summary {
  margin-bottom: 24px;
}

.rating-overview {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.overall-rating {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rating-score {
  font-size: 32px;
  font-weight: 700;
  color: #F7BA2A;
}

.review-count {
  font-size: 14px;
  color: #909399;
}

.review-item {
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.review-user {
  flex: 1;
}

.review-user h5 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px;
}

.review-date {
  font-size: 12px;
  color: #909399;
}

.review-content {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }

  .course-hero {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 20px;
  }

  .course-thumbnail {
    height: 240px;
  }

  .course-title {
    font-size: 24px;
  }

  .enrollment-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 20px;
  }

  .enrollment-actions {
    justify-content: center;
  }

  .tab-content {
    padding: 20px 16px;
  }

  .curriculum-summary {
    flex-direction: column;
    gap: 8px;
  }

  .course-stats {
    gap: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 16px;
  }

  .lecture-item {
    padding: 12px 16px;
  }
}
</style>
