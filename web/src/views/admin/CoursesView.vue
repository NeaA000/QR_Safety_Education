<template>
  <div class="admin-courses-container">
    <!-- 헤더 -->
    <div class="header">
      <div class="header-content">
        <el-button
          @click="goBack"
          :icon="ArrowLeft"
          circle
        />
        <h1 class="page-title">강의 관리</h1>
        <div class="header-actions">
          <el-button
            type="primary"
            :icon="Plus"
            @click="showCreateDialog"
          >
            강의 추가
          </el-button>
        </div>
      </div>
    </div>

    <!-- 필터 및 검색 -->
    <div class="filter-section">
      <div class="filter-container">
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="강의명, 강사명으로 검색"
            :prefix-icon="Search"
            @input="handleSearch"
            clearable
          />
        </div>

        <div class="filter-controls">
          <el-select
            v-model="statusFilter"
            placeholder="상태"
            @change="handleFilter"
            clearable
          >
            <el-option label="전체" value="" />
            <el-option label="활성" value="active" />
            <el-option label="비활성" value="inactive" />
            <el-option label="임시저장" value="draft" />
          </el-select>

          <el-select
            v-model="categoryFilter"
            placeholder="카테고리"
            @change="handleFilter"
            clearable
          >
            <el-option label="전체" value="" />
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </div>
      </div>
    </div>

    <!-- 통계 섹션 -->
    <div class="stats-section">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-value">{{ totalCourses }}</div>
          <div class="stat-label">전체 강의</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ activeCourses }}</div>
          <div class="stat-label">활성 강의</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalEnrollments }}</div>
          <div class="stat-label">총 수강생</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ averageRating.toFixed(1) }}</div>
          <div class="stat-label">평균 평점</div>
        </div>
      </div>
    </div>

    <!-- 강의 목록 -->
    <div class="main-content">
      <div v-if="isLoading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="filteredCourses.length === 0" class="empty-container">
        <el-empty description="강의가 없습니다">
          <el-button type="primary" @click="showCreateDialog">
            첫 번째 강의 만들기
          </el-button>
        </el-empty>
      </div>

      <div v-else class="courses-table">
        <el-table
          :data="filteredCourses"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />

          <el-table-column label="강의 정보" min-width="300">
            <template #default="{ row }">
              <div class="course-info">
                <div class="course-thumbnail">
                  <img
                    :src="row.thumbnail || '/default-course.jpg'"
                    :alt="row.title"
                  />
                </div>
                <div class="course-details">
                  <h4>{{ row.title }}</h4>
                  <p>{{ row.instructor }}</p>
                  <div class="course-meta">
                    <el-tag size="small">{{ getCategoryName(row.categoryId) }}</el-tag>
                    <span class="duration">{{ formatDuration(row.duration) }}</span>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="상태" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="수강생" width="100">
            <template #default="{ row }">
              {{ row.enrollmentCount || 0 }}명
            </template>
          </el-table-column>

          <el-table-column label="평점" width="100">
            <template #default="{ row }">
              <div class="rating">
                <el-icon><Star /></el-icon>
                <span>{{ (row.rating || 0).toFixed(1) }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="가격" width="120">
            <template #default="{ row }">
              <span :class="{ free: row.price === 0 }">
                {{ row.price === 0 ? '무료' : formatPrice(row.price) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="등록일" width="120">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column label="작업" width="150" fixed="right">
            <template #default="{ row }">
              <div class="actions">
                <el-button
                  size="small"
                  @click="editCourse(row)"
                  :icon="Edit"
                />
                <el-button
                  size="small"
                  type="success"
                  @click="viewCourse(row)"
                  :icon="View"
                />
                <el-button
                  size="small"
                  type="danger"
                  @click="deleteCourse(row)"
                  :icon="Delete"
                />
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 페이지네이션 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalCourses"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <!-- 일괄 작업 -->
      <div v-if="selectedCourses.length > 0" class="batch-actions">
        <el-card>
          <div class="batch-content">
            <span>{{ selectedCourses.length }}개 강의 선택됨</span>
            <div class="batch-buttons">
              <el-button @click="batchStatusChange('active')">활성화</el-button>
              <el-button @click="batchStatusChange('inactive')">비활성화</el-button>
              <el-button type="danger" @click="batchDelete">삭제</el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 강의 생성/편집 다이얼로그 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '강의 편집' : '강의 추가'"
      width="80%"
      max-width="800px"
    >
      <el-form
        ref="courseFormRef"
        :model="courseForm"
        :rules="courseRules"
        label-width="100px"
      >
        <el-form-item label="강의명" prop="title">
          <el-input v-model="courseForm.title" placeholder="강의명을 입력하세요" />
        </el-form-item>

        <el-form-item label="강사" prop="instructor">
          <el-input v-model="courseForm.instructor" placeholder="강사명을 입력하세요" />
        </el-form-item>

        <el-form-item label="카테고리" prop="categoryId">
          <el-select v-model="courseForm.categoryId" placeholder="카테고리 선택">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="설명" prop="description">
          <el-input
            v-model="courseForm.description"
            type="textarea"
            :rows="3"
            placeholder="강의 설명을 입력하세요"
          />
        </el-form-item>

        <el-form-item label="난이도" prop="difficulty">
          <el-select v-model="courseForm.difficulty" placeholder="난이도 선택">
            <el-option label="초급" value="beginner" />
            <el-option label="중급" value="intermediate" />
            <el-option label="고급" value="advanced" />
          </el-select>
        </el-form-item>

        <el-form-item label="소요시간" prop="duration">
          <el-input-number
            v-model="courseForm.duration"
            :min="1"
            :max="10000"
            placeholder="분 단위"
          />
          <span style="margin-left: 8px;">분</span>
        </el-form-item>

        <el-form-item label="가격" prop="price">
          <el-input-number
            v-model="courseForm.price"
            :min="0"
            :precision="0"
            placeholder="원"
          />
          <span style="margin-left: 8px;">원</span>
        </el-form-item>

        <el-form-item label="상태" prop="status">
          <el-select v-model="courseForm.status" placeholder="상태 선택">
            <el-option label="활성" value="active" />
            <el-option label="비활성" value="inactive" />
            <el-option label="임시저장" value="draft" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">취소</el-button>
        <el-button
          type="primary"
          @click="saveCourse"
          :loading="isSaving"
        >
          {{ isEditing ? '수정' : '등록' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  View,
  Delete,
  Star
} from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores/courses.ts'

// 스토어 및 라우터
const router = useRouter()
const courseStore = useCourseStore()

// 상태
const isLoading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const selectedCourses = ref([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const courseFormRef = ref()

// 강의 폼 데이터
const courseForm = reactive({
  id: '',
  title: '',
  instructor: '',
  categoryId: '',
  description: '',
  difficulty: 'beginner',
  duration: 60,
  price: 0,
  status: 'active'
})

// 폼 검증 규칙
const courseRules = {
  title: [
    { required: true, message: '강의명을 입력해주세요', trigger: 'blur' }
  ],
  instructor: [
    { required: true, message: '강사명을 입력해주세요', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '카테고리를 선택해주세요', trigger: 'change' }
  ],
  description: [
    { required: true, message: '강의 설명을 입력해주세요', trigger: 'blur' }
  ]
}

// 계산된 속성
const categories = computed(() => courseStore.categories)
const allCourses = computed(() => courseStore.courses)

const filteredCourses = computed(() => {
  let filtered = allCourses.value

  // 검색 필터
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(course =>
      course.title.toLowerCase().includes(query) ||
      course.instructor.toLowerCase().includes(query)
    )
  }

  // 상태 필터
  if (statusFilter.value) {
    filtered = filtered.filter(course => course.status === statusFilter.value)
  }

  // 카테고리 필터
  if (categoryFilter.value) {
    filtered = filtered.filter(course => course.categoryId === categoryFilter.value)
  }

  return filtered
})

const totalCourses = computed(() => allCourses.value.length)
const activeCourses = computed(() =>
  allCourses.value.filter(course => course.status === 'active').length
)
const totalEnrollments = computed(() =>
  allCourses.value.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0)
)
const averageRating = computed(() => {
  const courses = allCourses.value.filter(course => course.rating > 0)
  if (courses.length === 0) return 0
  return courses.reduce((sum, course) => sum + course.rating, 0) / courses.length
})

/**
 * 이벤트 핸들러
 */
const goBack = () => {
  router.push('/admin')
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleSelectionChange = (selection: any[]) => {
  selectedCourses.value = selection
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const showCreateDialog = () => {
  resetForm()
  isEditing.value = false
  dialogVisible.value = true
}

const editCourse = (course: any) => {
  Object.assign(courseForm, course)
  isEditing.value = true
  dialogVisible.value = true
}

const viewCourse = (course: any) => {
  router.push(`/courses/${course.id}`)
}

const deleteCourse = async (course: any) => {
  try {
    await ElMessageBox.confirm(
      `"${course.title}" 강의를 삭제하시겠습니까?`,
      '강의 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'error'
      }
    )

    // TODO: API 호출
    ElMessage.success('강의가 삭제되었습니다.')
  } catch {
    // 취소
  }
}

const saveCourse = async () => {
  try {
    await courseFormRef.value?.validate()
    isSaving.value = true

    // TODO: API 호출
    await new Promise(resolve => setTimeout(resolve, 1000))

    ElMessage.success(
      isEditing.value ? '강의가 수정되었습니다.' : '강의가 등록되었습니다.'
    )
    dialogVisible.value = false
    resetForm()
  } catch (error) {
    if (error !== false) { // 폼 검증 실패가 아닌 경우
      ElMessage.error('저장에 실패했습니다.')
    }
  } finally {
    isSaving.value = false
  }
}

const batchStatusChange = async (status: string) => {
  try {
    await ElMessageBox.confirm(
      `선택된 ${selectedCourses.value.length}개 강의의 상태를 변경하시겠습니까?`,
      '일괄 상태 변경',
      {
        confirmButtonText: '변경',
        cancelButtonText: '취소',
        type: 'warning'
      }
    )

    // TODO: API 호출
    ElMessage.success('상태가 변경되었습니다.')
    selectedCourses.value = []
  } catch {
    // 취소
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `선택된 ${selectedCourses.value.length}개 강의를 삭제하시겠습니까?`,
      '일괄 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'error'
      }
    )

    // TODO: API 호출
    ElMessage.success('강의가 삭제되었습니다.')
    selectedCourses.value = []
  } catch {
    // 취소
  }
}

const resetForm = () => {
  Object.assign(courseForm, {
    id: '',
    title: '',
    instructor: '',
    categoryId: '',
    description: '',
    difficulty: 'beginner',
    duration: 60,
    price: 0,
    status: 'active'
  })
  courseFormRef.value?.clearValidate()
}

/**
 * 유틸리티 함수
 */
const getCategoryName = (categoryId: string): string => {
  const category = categories.value.find(cat => cat.id === categoryId)
  return category?.name || '기타'
}

const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    active: '활성',
    inactive: '비활성',
    draft: '임시저장'
  }
  return map[status] || '알 수 없음'
}

const getStatusType = (status: string): string => {
  const map: Record<string, string> = {
    active: 'success',
    inactive: 'danger',
    draft: 'warning'
  }
  return map[status] || 'info'
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

const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj)
}

/**
 * 초기화
 */
onMounted(async () => {
  try {
    isLoading.value = true
    await Promise.all([
      courseStore.loadCourses(),
      courseStore.loadCategories()
    ])
  } catch (error) {
    ElMessage.error('데이터를 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.admin-courses-container {
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
  max-width: 1400px;
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

.filter-section {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.filter-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-bar {
  flex: 1;
  max-width: 400px;
}

.filter-controls {
  display: flex;
  gap: 12px;
}

.stats-section {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.stats-container {
  max-width: 1400px;
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

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container,
.empty-container {
  padding: 40px 0;
  text-align: center;
}

.courses-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.course-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.course-thumbnail {
  width: 60px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.course-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-details h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px;
  line-height: 1.4;
}

.course-details p {
  font-size: 12px;
  color: #909399;
  margin: 0 0 6px;
}

.course-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.duration {
  font-size: 11px;
  color: #C0C4CC;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating .el-icon {
  color: #F7BA2A;
  font-size: 14px;
}

.rating span {
  font-size: 12px;
  color: #606266;
}

.free {
  color: #67C23A;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 4px;
}

.pagination {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #ebeef5;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.batch-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .filter-container {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filter-controls {
    justify-content: stretch;
  }

  .filter-controls .el-select {
    flex: 1;
  }

  .stats-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .main-content {
    padding: 16px;
  }

  .course-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .course-thumbnail {
    width: 100%;
    height: 60px;
  }

  .actions {
    flex-direction: column;
    gap: 2px;
  }

  .batch-actions {
    position: static;
    transform: none;
    margin-top: 20px;
  }
}

@media (max-width: 480px) {
  .stats-container {
    grid-template-columns: 1fr;
  }

  .batch-content {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .batch-buttons {
    justify-content: center;
  }
}
</style>
