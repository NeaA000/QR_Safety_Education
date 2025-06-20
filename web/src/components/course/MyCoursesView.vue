<template>
  <div class="my-courses-container">
    <!-- 헤더 -->
    <div class="header">
      <div class="header-content">
        <el-button
          @click="goBack"
          :icon="ArrowLeft"
          circle
        />
        <h1 class="page-title">내 강의</h1>
        <div class="header-actions">
          <el-button
            @click="goToCourseList"
            type="primary"
            size="small"
          >
            강의 찾기
          </el-button>
        </div>
      </div>
    </div>

    <!-- 학습 통계 -->
    <div class="stats-section">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-value">{{ enrolledCourses.length }}</div>
          <div class="stat-label">수강 중인 강의</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ completedCoursesCount }}</div>
          <div class="stat-label">완료한 강의</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalWatchTime }}</div>
          <div class="stat-label">총 학습 시간</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ averageProgress }}%</div>
          <div class="stat-label">평균 진도</div>
        </div>
      </div>
    </div>

    <!-- 필터 및 정렬 -->
    <div class="filter-section">
      <div class="filter-container">
        <el-tabs v-model="activeFilter" @tab-change="handleFilterChange">
          <el-tab-pane label="전체" name="all" />
          <el-tab-pane label="진행 중" name="active" />
          <el-tab-pane label="완료" name="completed" />
          <el-tab-pane label="일시정지" name="paused" />
        </el-tabs>

        <el-select
          v-model="sortBy"
          placeholder="정렬"
          size="small"
          style="width: 140px"
          @change="handleSort"
        >
          <el-option label="최근 수강순" value="recent" />
          <el-option label="등록일순" value="enrolled" />
          <el-option label="진도율순" value="progress" />
          <el-option label="이름순" value="name" />
        </el-select>
      </div>
    </div>

    <!-- 강의 목록 -->
    <div class="main-content">
      <div v-if="isLoading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="filteredCourses.length === 0" class="empty-container">
        <el-empty :description="getEmptyDescription()">
          <el-button type="primary" @click="goToCourseList">
            강의 찾아보기
          </el-button>
        </el-empty>
      </div>

      <div v-else class="course-list">
        <MyCourseCard
          v-for="enrollment in filteredCourses"
          :key="enrollment.id"
          :enrollment="enrollment"
          @continue="continueLearning"
          @view-certificate="viewCertificate"
          @pause="pauseCourse"
          @resume="resumeCourse"
        />
      </div>
    </div>

    <!-- 수료증 다이얼로그 -->
    <el-dialog
      v-model="certificateDialogVisible"
      title="수료증"
      width="80%"
      max-width="500px"
    >
      <div class="certificate-content">
        <div v-if="selectedCertificate" class="certificate-preview">
          <h3>{{ selectedCertificate.courseName }}</h3>
          <p>수료일: {{ formatDate(selectedCertificate.completedAt) }}</p>
          <p>총 학습시간: {{ formatDuration(selectedCertificate.totalWatchTime) }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="certificateDialogVisible = false">닫기</el-button>
        <el-button type="primary" @click="downloadCertificate">
          수료증 다운로드
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores/courses.ts'
import { useAuthStore } from '@/stores/auth.ts'
import MyCourseCard from '@/views/course/MyCourseCard.vue'

// 스토어 및 라우터
const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore()

// 상태
const activeFilter = ref('all')
const sortBy = ref('recent')
const certificateDialogVisible = ref(false)
const selectedCertificate = ref(null)

// 계산된 속성
const isLoading = computed(() => courseStore.isLoading)
const enrolledCourses = computed(() => courseStore.enrolledCourses)

const filteredCourses = computed(() => {
  let filtered = enrolledCourses.value

  // 상태별 필터링
  switch (activeFilter.value) {
    case 'active':
      filtered = filtered.filter(course =>
        course.status === 'active' && course.progress < 100
      )
      break
    case 'completed':
      filtered = filtered.filter(course =>
        course.status === 'completed' || course.progress >= 100
      )
      break
    case 'paused':
      filtered = filtered.filter(course => course.status === 'paused')
      break
    default:
      break
  }

  // 정렬
  switch (sortBy.value) {
    case 'recent':
      return filtered.sort((a, b) =>
        new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt)
      )
    case 'enrolled':
      return filtered.sort((a, b) =>
        new Date(b.enrolledAt) - new Date(a.enrolledAt)
      )
    case 'progress':
      return filtered.sort((a, b) => b.progress - a.progress)
    case 'name':
      return filtered.sort((a, b) =>
        a.courseName.localeCompare(b.courseName)
      )
    default:
      return filtered
  }
})

const completedCoursesCount = computed(() =>
  enrolledCourses.value.filter(course =>
    course.status === 'completed' || course.progress >= 100
  ).length
)

const totalWatchTime = computed(() => {
  const totalMinutes = enrolledCourses.value.reduce((sum, course) =>
    sum + (course.watchTime || 0), 0
  )
  return formatDuration(totalMinutes)
})

const averageProgress = computed(() => {
  if (enrolledCourses.value.length === 0) return 0
  const totalProgress = enrolledCourses.value.reduce((sum, course) =>
    sum + course.progress, 0
  )
  return Math.round(totalProgress / enrolledCourses.value.length)
})

/**
 * 이벤트 핸들러
 */
const goBack = () => {
  router.push('/home')
}

const goToCourseList = () => {
  router.push('/courses')
}

const handleFilterChange = (filterName: string) => {
  activeFilter.value = filterName
}

const handleSort = (sortType: string) => {
  sortBy.value = sortType
}

const continueLearning = (enrollment: any) => {
  router.push(`/lectures/${enrollment.courseId}/watch`)
}

const viewCertificate = (enrollment: any) => {
  selectedCertificate.value = {
    courseName: enrollment.courseName,
    completedAt: enrollment.completedAt,
    totalWatchTime: enrollment.watchTime || 0
  }
  certificateDialogVisible.value = true
}

const pauseCourse = async (enrollment: any) => {
  try {
    // TODO: API 호출로 강의 일시정지 처리
    ElMessage.success('강의가 일시정지되었습니다.')
  } catch (error) {
    ElMessage.error('강의 일시정지에 실패했습니다.')
  }
}

const resumeCourse = async (enrollment: any) => {
  try {
    // TODO: API 호출로 강의 재개 처리
    ElMessage.success('강의가 재개되었습니다.')
  } catch (error) {
    ElMessage.error('강의 재개에 실패했습니다.')
  }
}

const downloadCertificate = () => {
  // TODO: 수료증 다운로드 기능 구현
  ElMessage.success('수료증 다운로드가 시작됩니다.')
  certificateDialogVisible.value = false
}

const getEmptyDescription = (): string => {
  switch (activeFilter.value) {
    case 'active':
      return '진행 중인 강의가 없습니다'
    case 'completed':
      return '완료한 강의가 없습니다'
    case 'paused':
      return '일시정지된 강의가 없습니다'
    default:
      return '등록된 강의가 없습니다'
  }
}

/**
 * 유틸리티 함수
 */
const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}분`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

/**
 * 초기화
 */
onMounted(async () => {
  try {
    await courseStore.loadEnrolledCourses()
  } catch (error) {
    ElMessage.error('내 강의 목록을 불러오는데 실패했습니다.')
  }
})
</script>

<style scoped>
.my-courses-container {
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

.stats-section {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.stats-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #409EFF;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.filter-section {
  background: white;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.filter-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-container :deep(.el-tabs__header) {
  margin: 0;
}

.filter-container :deep(.el-tabs__nav-wrap::after) {
  display: none;
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

.course-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.certificate-content {
  text-align: center;
  padding: 20px;
}

.certificate-preview h3 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
}

.certificate-preview p {
  font-size: 14px;
  color: #606266;
  margin: 8px 0;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .stats-section {
    padding: 16px;
  }

  .stats-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .filter-section {
    padding: 12px 16px;
  }

  .filter-container {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .main-content {
    padding: 16px;
  }
<template>
<div class="my-courses-container">
<!-- 헤더 -->
<div class="header">
<div class="header-content">
<el-button
@click="goBack"
:icon="ArrowLeft"
circle
/>
<h1 class="page-title">내 강의</h1>
<div class="header-actions">
<el-button
@click="goToCourseList"
type="primary"
size="small"
>
강의 찾기
</el-button>
</div>
</div>
</div>

<!-- 학습 통계 -->
<div class="stats-section">
<div class="stats-container">
<div class="stat-card">
<div class="stat-value">{{ enrolledCourses.length }}</div>
<div class="stat-label">수강 중인 강의</div>
</div>
<div class="stat-card">
<div class="stat-value">{{ completedCoursesCount }}</div>
<div class="stat-label">완료한 강의</div>
</div>
<div class="stat-card">
<div class="stat-value">{{ totalWatchTime }}</div>
<div class="stat-label">총 학습 시간</div>
</div>
<div class="stat-card">
<div class="stat-value">{{ averageProgress }}%</div>
<div class="stat-label">평균 진도</div>
</div>
</div>
</div>

<!-- 필터 및 정렬 -->
<div class="filter-section">
<div class="filter-container">
<el-tabs v-model="activeFilter" @tab-change="handleFilterChange">
<el-tab-pane label="전체" name="all" />
<el-tab-pane label="진행 중" name="active" />
<el-tab-pane label="완료" name="completed" />
<el-tab-pane label="일시정지" name="paused" />
</el-tabs>

<el-select
v-model="sortBy"
placeholder="정렬"
size="small"
style="width: 140px"
@change="handleSort"
>
<el-option label="최근 수강순" value="recent" />
<el-option label="등록일순" value="enrolled" />
<el-option label="진도율순" value="progress" />
<el-option label="이름순" value="name" />
</el-select>
</div>
</div>

<!-- 강의 목록 -->
<div class="main-content">
<div v-if="isLoading" class="loading-container">
<el-skeleton :rows="3" animated />
</div>

<div v-else-if="filteredCourses.length === 0" class="empty-container">
<el-empty :description="getEmptyDescription()">
<el-button type="primary" @click="goToCourseList">
강의 찾아보기
</el-button>
</el-empty>
</div>

<div v-else class="course-list">
<MyCourseCard
v-for="enrollment in filteredCourses"
:key="enrollment.id"
:enrollment="enrollment"
@continue="continueLearning"
@view-certificate="viewCertificate"
@pause="pauseCourse"
@resume="resumeCourse"
/>
</div>
</div>

<!-- 수료증 다이얼로그 -->
<el-dialog
v-model="certificateDialogVisible"
title="수료증"
width="80%"
max-width="500px"
>
<div class="certificate-content">
<div v-if="selectedCertificate" class="certificate-preview">
<h3>{{ selectedCertificate.courseName }}</h3>
<p>수료일: {{ formatDate(selectedCertificate.completedAt) }}</p>
<p>총 학습시간: {{ formatDuration(selectedCertificate.totalWatchTime) }}</p>
</div>
</div>
<template #footer>
<el-button @click="certificateDialogVisible = false">닫기</el-button>
<el-button type="primary" @click="downloadCertificate">
수료증 다운로드
</el-button>
</template>
</el-dialog>
</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores/courses.ts'
import { useAuthStore } from '@/stores/auth'
import MyCourseCard from '@/components/course/MyCourseCard.vue'

  // 스토어 및 라우터
const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore()

  // 상태
const activeFilter = ref('all')
const sortBy = ref('recent')
const certificateDialogVisible = ref(false)
const selectedCertificate = ref(null)

  // 계산된 속성
const isLoading = computed(() => courseStore.isLoading)
const enrolledCourses = computed(() => courseStore.enrolledCourses)

const filteredCourses = computed(() => {
  let filtered = enrolledCourses.value

  // 상태별 필터링
switch (activeFilter.value) {
  case 'active':
  filtered = filtered.filter(course =>
  course.status === 'active' && course.progress < 100
  )
  break
  case 'completed':
filtered = filtered.filter(course =>
course.status === 'completed' || course.progress >= 100
)
break
case 'paused':
filtered = filtered.filter(course => course.status === 'paused')
break
default:
break
}

  // 정렬
  switch (sortBy.value) {
  case 'recent':
  return filtered.sort((a, b) =>
  new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt)
)
case 'enrolled':
return filtered.sort((a, b) =>
new Date(b.enrolledAt) - new Date(a.enrolledAt)
)
case 'progress':
return filtered.sort((a, b) => b.progress - a.progress)
case 'name':
return filtered.sort((a, b) =>
a.courseName.localeCompare(b.courseName)
)
default:
return filtered
}
})

const completedCoursesCount = computed(() =>
enrolledCourses.value.filter(course =>
course.status === 'completed' || course.progress >= 100
).length
)

const totalWatchTime = computed(() => {
  const totalMinutes = enrolledCourses.value.reduce((sum, course) =>
sum + (course.watchTime || 0), 0
)
return formatDuration(totalMinutes)
})

const averageProgress = computed(() => {
  if (enrolledCourses.value.length === 0) return 0
const totalProgress = enrolledCourses.value.reduce((sum, course) =>
sum + course.progress, 0
)
return Math.round(totalProgress / enrolledCourses.value.length)
})

  /**
   * 이벤트 핸들러
   */
const goBack = () => {
  router.push('/home')
}

  const goToCourseList = () => {
  router.push('/courses')
}

  const handleFilterChange = (filterName: string) => {
  activeFilter.value = filterName
}

  const handleSort = (sortType: string) => {
  sortBy.value = sortType
}

  const continueLearning = (enrollment: any) => {
  router.push(`/lectures/${enrollment.courseId}/watch`)
}

  const viewCertificate = (enrollment: any) => {
  selectedCertificate.value = {
  courseName: enrollment.courseName,
  completedAt: enrollment.completedAt,
  totalWatchTime: enrollment.watchTime || 0
}
  certificateDialogVisible.value = true
}

  const pauseCourse = async (enrollment: any) => {
  try {
    // TODO: API 호출로 강의 일시정지 처리
    ElMessage.success('강의가 일시정지되었습니다.')
  } catch (error) {
  ElMessage.error('강의 일시정지에 실패했습니다.')
}
}

  const resumeCourse = async (enrollment: any) => {
  try {
    // TODO: API 호출로 강의 재개 처리
    ElMessage.success('강의가 재개되었습니다.')
  } catch (error) {
  ElMessage.error('강의 재개에 실패했습니다.')
}
}

  const downloadCertificate = () => {
  // TODO: 수료증 다운로드 기능 구현
  ElMessage.success('수료증 다운로드가 시작됩니다.')
certificateDialogVisible.value = false
}

  const getEmptyDescription = (): string => {
  switch (activeFilter.value) {
  case 'active':
  return '진행 중인 강의가 없습니다'
  case 'completed':
return '완료한 강의가 없습니다'
case 'paused':
return '일시정지된 강의가 없습니다'
default:
return '등록된 강의가 없습니다'
}
}

  /**
   * 유틸리티 함수
   */
  const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
  return `${minutes}분`
}
  const hours = Math.floor(minutes / 60)
const remainingMinutes = minutes % 60
return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
}

  const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}).format(new Date(date))
}

  /**
   * 초기화
   */
onMounted(async () => {
  try {
    await courseStore.loadEnrolledCourses()
  } catch (error) {
  ElMessage.error('내 강의 목록을 불러오는데 실패했습니다.')
}
})
</script>

<style scoped>
.my-courses-container {
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

  .stats-section {
    background: white;
    padding: 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .stats-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }

  .stat-card {
    text-align: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #409EFF;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 14px;
    color: #606266;
  }

  .filter-section {
    background: white;
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .filter-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .filter-container :deep(.el-tabs__header) {
    margin: 0;
  }

  .filter-container :deep(.el-tabs__nav-wrap::after) {
    display: none;
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

  .course-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .certificate-content {
    text-align: center;
    padding: 20px;
  }

  .certificate-preview h3 {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px;
  }

  .certificate-preview p {
    font-size: 14px;
    color: #606266;
    margin: 8px 0;
  }

  /* 반응형 디자인 */
  @media (max-width: 768px) {
    .header-content {
      padding: 0 16px;
    }

    .stats-section {
      padding: 16px;
    }

    .stats-container {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .filter-section {
      padding: 12px 16px;
    }

    .filter-container {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .main-content {
      padding: 16px;
    }

    .stat-card {
      padding: 16px;
    }

    .stat-value {
      font-size: 20px;
    }
  }

  @media (max-width: 480px) {
    .stats-container {
      grid-template-columns: 1fr;
    }
  }
</style>
  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .stats-container {
    grid-template-columns: 1fr;
  }
}
</style>
