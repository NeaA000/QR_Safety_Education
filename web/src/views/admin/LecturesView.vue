<!-- filepath: web/src/views/admin/LecturesView.vue -->
<template>
  <div class="lecture-view">
    <div class="header">
      <div class="header-content">
        <el-button
          @click="goBack"
          :icon="ArrowLeft"
          circle
        />
        <h1 class="page-title">강의 학습</h1>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="lecture" class="main-content">
      <div class="lecture-player">
        <div class="video-container">
          <video
            v-if="lecture.videoUrl"
            :src="lecture.videoUrl"
            controls
            width="100%"
            height="400"
          />
          <div v-else class="no-video">
            <el-icon size="48"><VideoPlay /></el-icon>
            <p>동영상을 준비 중입니다.</p>
          </div>
        </div>
      </div>

      <div class="lecture-info">
        <h2>{{ lecture.title }}</h2>
        <p v-if="lecture.description">{{ lecture.description }}</p>

        <div class="progress-section">
          <div class="progress-header">
            <span>학습 진도</span>
            <span>{{ Math.round(progress) }}%</span>
          </div>
          <el-progress :percentage="progress" />
        </div>

        <div class="lecture-actions">
          <el-button
            type="primary"
            @click="markAsCompleted"
            :disabled="progress >= 100"
          >
            {{ progress >= 100 ? '완료됨' : '완료 표시' }}
          </el-button>

          <el-button @click="goToCourse">
            강의 목록으로
          </el-button>
        </div>
      </div>
    </div>

    <div v-else class="error-container">
      <el-result
        icon="error"
        title="강의를 찾을 수 없습니다"
        sub-title="요청하신 강의가 존재하지 않거나 접근 권한이 없습니다."
      >
        <template #extra>
          <el-button type="primary" @click="goBack">돌아가기</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, VideoPlay } from '@element-plus/icons-vue'

// 타입 정의
interface Lecture {
  id: string
  title: string
  description?: string
  videoUrl?: string
  duration: number
}

// 라우터
const route = useRoute()
const router = useRouter()

// 상태
const lecture = ref<Lecture | null>(null)
const isLoading = ref(false)
const progress = ref(0)

// 계산된 속성
const lectureId = computed(() => route.params.id as string)

// 메서드
const goBack = () => {
  router.go(-1)
}

const goToCourse = () => {
  router.push('/courses')
}

const markAsCompleted = () => {
  progress.value = 100
  ElMessage.success('강의를 완료하였습니다!')
}

const loadLecture = async () => {
  try {
    isLoading.value = true

    // Mock 데이터 (실제로는 API나 Store에서 가져와야 함)
    await new Promise(resolve => setTimeout(resolve, 1000))

    lecture.value = {
      id: lectureId.value,
      title: '샘플 강의',
      description: '이것은 샘플 강의입니다.',
      duration: 3600
    }

    // Mock 진도
    progress.value = Math.random() * 80

  } catch (error) {
    console.error('강의 로드 실패:', error)
    ElMessage.error('강의를 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 초기화
onMounted(() => {
  loadLecture()
})
</script>

<style scoped>
.lecture-view {
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
}

.loading-container,
.error-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.lecture-player {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.video-container {
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-video {
  text-align: center;
  color: white;
}

.no-video p {
  margin: 8px 0 0;
  font-size: 14px;
  opacity: 0.8;
}

.lecture-info {
  background: white;
  border-radius: 8px;
  padding: 24px;
  height: fit-content;
}

.lecture-info h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
}

.lecture-info p {
  color: #606266;
  line-height: 1.6;
  margin: 0 0 24px;
}

.progress-section {
  margin-bottom: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.lecture-actions {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

/* 반응형 */
@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .lecture-actions {
    flex-direction: row;
  }
}
</style>
