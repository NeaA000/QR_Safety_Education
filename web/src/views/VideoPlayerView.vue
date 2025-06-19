<template>
  <div class="lecture-list-view">
    <div class="header">
      <h1>강의 목록</h1>
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="강의 검색..."
          :prefix-icon="Search"
          clearable
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="filters">
      <!-- 3단계 카테고리 필터 -->
      <el-select 
        v-model="selectedMainCategory" 
        placeholder="메인 카테고리" 
        clearable
        @change="handleMainCategoryChange"
      >
        <el-option label="전체" value="" />
        <el-option
          v-for="category in categoryStore.mainCategories"
          :key="category.id"
          :label="category.name"
          :value="category.name"
        />
      </el-select>

      <el-select 
        v-if="selectedMainCategory && selectedMainCategory !== '전체'"
        v-model="selectedMiddleCategory" 
        placeholder="중간 카테고리" 
        clearable
        @change="handleMiddleCategoryChange"
      >
        <el-option
          v-for="category in currentMiddleCategories"
          :key="category.id"
          :label="category.name"
          :value="category.name"
        />
      </el-select>

      <el-select 
        v-if="selectedMiddleCategory"
        v-model="selectedLeafCategory" 
        placeholder="세부 카테고리" 
        clearable
        @change="handleLeafCategoryChange"
      >
        <el-option
          v-for="category in currentLeafCategories"
          :key="category.id"
          :label="category.name"
          :value="category.name"
        />
      </el-select>

      <!-- 레벨 및 상태 필터 -->
      <el-select v-model="selectedLevel" placeholder="레벨" clearable @change="handleLevelChange">
        <el-option label="초급" value="초급" />
        <el-option label="중급" value="중급" />
        <el-option label="고급" value="고급" />
      </el-select>

      <el-select v-model="selectedStatus" placeholder="상태" clearable @change="handleStatusChange">
        <el-option label="시작 전" value="not_started" />
        <el-option label="진행 중" value="in_progress" />
        <el-option label="완료" value="completed" />
      </el-select>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="lectureStore.isLoading" class="loading">
      <el-icon class="is-loading" :size="40">
        <Loading />
      </el-icon>
      <p>강의 목록을 불러오는 중...</p>
    </div>

    <!-- 강의 목록 -->
    <div v-else-if="filteredLectures.length > 0" class="lectures-grid">
      <div 
        v-for="lecture in filteredLectures" 
        :key="lecture.id"
        class="lecture-card"
        @click="goToLecture(lecture)"
      >
        <div class="lecture-thumbnail">
          <img :src="lecture.thumbnailUrl" :alt="lecture.title" />
          <div class="play-overlay">
            <el-icon size="32"><VideoPlay /></el-icon>
          </div>
          <div class="duration">{{ formatDuration(lecture.duration) }}</div>
        </div>
        
        <div class="lecture-content">
          <h3>{{ lecture.title }}</h3>
          <p class="instructor">{{ lecture.instructor }}</p>
          
          <div class="lecture-meta">
            <el-tag size="small" type="info">{{ lecture.level }}</el-tag>
            <el-tag 
              size="small" 
              :type="getStatusTagType(lectureStore.getLectureStatus(lecture))"
            >
              {{ getStatusText(lectureStore.getLectureStatus(lecture)) }}
            </el-tag>
          </div>

          <!-- 카테고리 표시 -->
          <div class="category-breadcrumb">
            <span v-if="lecture.mainCategory">{{ lecture.mainCategory }}</span>
            <span v-if="lecture.middleCategory"> > {{ lecture.middleCategory }}</span>
            <span v-if="lecture.leafCategory"> > {{ lecture.leafCategory }}</span>
          </div>
          
          <!-- 진도 표시 -->
          <el-progress 
            v-if="lecture.progress && lecture.progress > 0"
            :percentage="lecture.progress"
            :stroke-width="6"
            :color="lecture.progress === 100 ? '#67C23A' : '#409EFF'"
          />
        </div>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="empty-state">
      <el-empty description="조건에 맞는 강의가 없습니다" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, VideoPlay, Loading } from '@element-plus/icons-vue'
import { useLectureStore, type LectureLevel, type LectureStatus, type ExtendedLecture } from '@/stores/lectures'
import { useCategoryStore } from '@/stores/categoryStore'
import type { MainCategory, MiddleCategory, LeafCategory } from '@/types/category'

// 스토어 및 라우터
const router = useRouter()
const lectureStore = useLectureStore()
const categoryStore = useCategoryStore()

// 상태
const searchQuery = ref('')
const selectedMainCategory = ref<MainCategory | ''>('')
const selectedMiddleCategory = ref<MiddleCategory | ''>('')
const selectedLeafCategory = ref<LeafCategory | ''>('')
const selectedLevel = ref<LectureLevel | ''>('')
const selectedStatus = ref<LectureStatus | ''>('')

// 계산된 속성
const filteredLectures = computed(() => lectureStore.filteredLectures)

const currentMiddleCategories = computed(() => {
  if (!selectedMainCategory.value || selectedMainCategory.value === '전체') return []
  return categoryStore.getMiddleCategories(selectedMainCategory.value as MainCategory)
})

const currentLeafCategories = computed(() => {
  if (!selectedMiddleCategory.value) return []
  return categoryStore.getLeafCategories(selectedMiddleCategory.value as MiddleCategory)
})

// 메서드
const handleSearch = (): void => {
  lectureStore.setFilter({ searchQuery: searchQuery.value })
}

const handleMainCategoryChange = (): void => {
  // 하위 카테고리 초기화
  selectedMiddleCategory.value = ''
  selectedLeafCategory.value = ''
  
  lectureStore.setFilter({
    mainCategory: selectedMainCategory.value || undefined,
    middleCategory: undefined,
    leafCategory: undefined
  })
}

const handleMiddleCategoryChange = (): void => {
  // 하위 카테고리 초기화
  selectedLeafCategory.value = ''
  
  lectureStore.setFilter({
    middleCategory: selectedMiddleCategory.value || undefined,
    leafCategory: undefined
  })
}

const handleLeafCategoryChange = (): void => {
  lectureStore.setFilter({
    leafCategory: selectedLeafCategory.value || undefined
  })
}

const handleLevelChange = (): void => {
  lectureStore.setFilter({ level: selectedLevel.value || undefined })
}

const handleStatusChange = (): void => {
  lectureStore.setFilter({ status: selectedStatus.value || undefined })
}

const goToLecture = (lecture: ExtendedLecture): void => {
  router.push(`/lectures/${lecture.id}/watch`)
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}시간 ${minutes % 60}분`
  }
  return `${minutes}분`
}

const getStatusTagType = (status: LectureStatus): string => {
  switch (status) {
    case 'completed': return 'success'
    case 'in_progress': return 'warning'
    case 'not_started': return 'info'
    case 'expired': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: LectureStatus): string => {
  switch (status) {
    case 'completed': return '완료'
    case 'in_progress': return '진행 중'
    case 'not_started': return '시작 전'
    case 'expired': return '기간 만료'
    default: return '알 수 없음'
  }
}

// 라이프사이클
onMounted(async () => {
  try {
    await lectureStore.initialize()
  } catch (error) {
    console.error('강의 목록 로드 실패:', error)
  }
})
</script>

<style scoped>
.lecture-list-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.search-bar {
  width: 300px;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filters .el-select {
  min-width: 150px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
}

.loading p {
  margin-top: 16px;
  font-size: 14px;
}

.lectures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.lecture-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.lecture-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.lecture-thumbnail {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.lecture-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.lecture-card:hover .play-overlay {
  opacity: 1;
}

.duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.lecture-content {
  padding: 16px;
}

.lecture-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.instructor {
  font-size: 14px;
  color: #606266;
  margin: 0 0 12px 0;
}

.lecture-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.category-breadcrumb {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
  line-height: 1.3;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .lecture-list-view {
    padding: 16px;
  }
  
  .header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .search-bar {
    width: 100%;
  }
  
  .filters {
    justify-content: center;
  }
  
  .filters .el-select {
    min-width: 120px;
  }
  
  .lectures-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>