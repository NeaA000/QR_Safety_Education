<template>
  <div class="home-container">
    <!-- 헤더 -->
    <div class="header">
      <div class="header-content">
        <h1 class="page-title">QR 안전교육</h1>
        <el-dropdown @command="handleCommand">
          <span class="el-dropdown-link">
            <el-avatar
              :src="userAvatar"
              :icon="UserFilled"
              :size="32"
            />
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                프로필
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <el-icon><Setting /></el-icon>
                설정
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>
                로그아웃
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="main-content">
      <!-- 사용자 정보 카드 -->
      <el-card class="user-info-card">
        <div class="user-info">
          <el-avatar
            :src="userAvatar"
            :icon="UserFilled"
            :size="56"
          />
          <div class="user-details">
            <h2>{{ userName }}님, 안녕하세요!</h2>
            <p>{{ userEmail }}</p>
          </div>
        </div>
      </el-card>

      <!-- QR 스캔 카드 -->
      <el-card class="qr-scan-card">
        <div class="qr-scan-content">
          <el-icon :size="48" color="white">
            <Camera />
          </el-icon>
          <h3>QR 코드로 강의 시작</h3>
          <p>QR 코드를 스캔하여 바로 강의를 시작하세요</p>
          <el-button
            type="primary"
            size="large"
            :loading="isScanning"
            @click="handleQRScan"
          >
            <el-icon><CameraFilled /></el-icon>
            {{ isScanning ? '스캔 중...' : 'QR 스캔' }}
          </el-button>
        </div>
      </el-card>

      <!-- 학습 통계 카드 -->
      <el-card class="stats-card">
        <template #header>
          <span>학습 현황</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-value">{{ learningStats.completedCourses }}</div>
              <div class="stat-label">완료한 강의</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-value">{{ learningStats.totalCourses }}</div>
              <div class="stat-label">전체 강의</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-value">{{ learningStats.completionRate }}%</div>
              <div class="stat-label">완료율</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 빠른 메뉴 -->
      <div class="quick-menu">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card shadow="hover" @click="goToCourseEnroll" class="menu-card course-enroll">
              <div class="menu-item">
                <el-icon :size="32" color="#E6A23C">
                  <Plus />
                </el-icon>
                <span>강의신청</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" @click="goToMyLearning" class="menu-card">
              <div class="menu-item">
                <el-icon :size="32" color="#409EFF">
                  <VideoPlay />
                </el-icon>
                <span>내 학습</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" @click="goToCertificates" class="menu-card">
              <div class="menu-item">
                <el-icon :size="32" color="#67C23A">
                  <Trophy />
                </el-icon>
                <span>수료증</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 신규 강의 추천 카드 -->
      <el-card class="recommended-courses" v-if="recommendedCourses.length > 0">
        <template #header>
          <div class="card-header">
            <span>추천 강의</span>
            <el-link type="primary" @click="goToCourseEnroll">전체보기</el-link>
          </div>
        </template>

        <div class="course-list">
          <div
            v-for="course in recommendedCourses"
            :key="course.id"
            class="course-item"
            @click="goToCourseDetail(course.id)"
          >
            <div class="course-thumbnail">
              <img :src="course.thumbnail || '/default-course.jpg'" :alt="course.title" />
              <div class="course-badge" v-if="course.price === 0">
                <el-tag type="success" size="small">무료</el-tag>
              </div>
            </div>
            <div class="course-info">
              <h4>{{ course.title }}</h4>
              <p>{{ course.description }}</p>
              <div class="course-meta">
                <span class="instructor">{{ course.instructor }}</span>
                <span class="duration">{{ formatDuration(course.duration) }}</span>
                <span class="price" v-if="course.price > 0">{{ formatPrice(course.price) }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 최근 학습 내역 -->
      <el-card class="recent-activities">
        <template #header>
          <div class="card-header">
            <span>최근 학습</span>
            <el-link type="primary" @click="goToMyLearning">전체보기</el-link>
          </div>
        </template>

        <div v-if="recentLearnings.length > 0">
          <div
            v-for="learning in recentLearnings"
            :key="learning.courseId"
            class="activity-item"
            @click="continueLearning(learning.courseId)"
          >
            <div class="activity-info">
              <h4>{{ learning.courseTitle }}</h4>
              <div class="activity-meta">
                <span>진행률: {{ learning.progress }}%</span>
                <span class="separator">·</span>
                <span>{{ formatRelativeTime(learning.lastAccessedAt) }}</span>
              </div>
            </div>
            <el-progress
              :percentage="learning.progress"
              :stroke-width="6"
              :color="learning.progress === 100 ? '#67C23A' : '#409EFF'"
            />
            <el-button
              v-if="learning.progress < 100"
              type="primary"
              size="small"
              @click.stop="continueLearning(learning.courseId)"
            >
              이어보기
            </el-button>
          </div>
        </div>
        <el-empty v-else description="아직 학습한 강의가 없습니다">
          <el-button type="primary" @click="goToCourseEnroll">
            강의 신청하러 가기
          </el-button>
        </el-empty>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  UserFilled,
  Setting,
  SwitchButton,
  CameraFilled,
  Camera,
  VideoPlay,
  Trophy,
  ArrowDown,
  Plus
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useLearningStore } from '@/stores/learning'
import { useCourseStore } from '@/stores/courses'
import { useQRStore } from '@/stores/qr'

// 스토어 및 라우터
const router = useRouter()
const authStore = useAuthStore()
const learningStore = useLearningStore()
const courseStore = useCourseStore()
const qrStore = useQRStore()

// 계산된 속성
const userName = computed(() => authStore.user?.displayName || '사용자')
const userEmail = computed(() => authStore.user?.email || '')
const userAvatar = computed(() => authStore.user?.photoURL || '')
const learningStats = computed(() => learningStore.learningStats)
const recentLearnings = computed(() => learningStore.myLearnings.slice(0, 3))
const recommendedCourses = computed(() => courseStore.recommendedCourses.slice(0, 3))
const isScanning = computed(() => qrStore.isScanning)

/**
 * QR 코드 스캔
 */
const handleQRScan = async (): Promise<void> => {
  try {
    await qrStore.scanQR()
  } catch (error) {
    console.error('QR 스캔 오류:', error)
  }
}

/**
 * 드롭다운 메뉴 처리
 */
const handleCommand = async (command: string): Promise<void> => {
  switch (command) {
    case 'profile':
      await router.push('/profile')
      break

    case 'settings':
      ElMessage.info('설정 기능 준비 중입니다.')
      break

    case 'logout':
      await handleLogout()
      break
  }
}

/**
 * 로그아웃 처리
 */
const handleLogout = async (): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      '정말 로그아웃하시겠습니까?',
      '로그아웃',
      {
        confirmButtonText: '확인',
        cancelButtonText: '취소',
        type: 'warning'
      }
    )

    await authStore.logout()
    await router.replace('/login')
    ElMessage.success('로그아웃되었습니다.')

  } catch (error) {
    // 취소한 경우 - 아무것도 하지 않음
  }
}

/**
 * 페이지 이동
 */
const goToCourseEnroll = (): void => {
  router.push('/courses')
}

const goToMyLearning = (): void => {
  router.push('/my-learning')
}

const goToCertificates = (): void => {
  router.push('/certificates')
}

const goToCourseDetail = (id: string): void => {
  router.push(`/courses/${id}`)
}

const continueLearning = async (courseId: string): Promise<void> => {
  try {
    await learningStore.startLearning(courseId)
    router.push(`/learning/${courseId}`)
  } catch (error) {
    ElMessage.error('학습을 시작할 수 없습니다.')
  }
}

/**
 * 유틸리티 함수
 */
const formatDuration = (minutes?: number): string => {
  if (!minutes) return ''
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

const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}일 전`
  if (hours > 0) return `${hours}시간 전`
  if (minutes > 0) return `${minutes}분 전`
  return '방금 전'
}

/**
 * 초기화
 */
onMounted(async () => {
  try {
    // 스토어 초기화
    await Promise.all([
      learningStore.initialize(),
      courseStore.loadRecommendedCourses()
    ])
  } catch (error) {
    console.error('홈 화면 초기화 실패:', error)
    ElMessage.error('데이터를 불러오는데 실패했습니다.')
  }
})
</script>

<style scoped>
.home-container {
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
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.user-info-card {
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-details h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.user-details p {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.qr-scan-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #409EFF 0%, #1976D2 100%);
  color: white;
}

.qr-scan-card :deep(.el-card__body) {
  padding: 0;
}

.qr-scan-content {
  text-align: center;
  padding: 40px 20px;
}

.qr-scan-content h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: white;
}

.qr-scan-content p {
  font-size: 14px;
  margin: 0 0 24px;
  opacity: 0.9;
  color: white;
}

.qr-scan-content .el-button {
  background: white;
  color: #409EFF;
  border: none;
  font-weight: 600;
}

.qr-scan-content .el-button:hover {
  background: #f5f5f5;
}

.stats-card {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.quick-menu {
  margin-bottom: 20px;
}

.menu-card {
  cursor: pointer;
  transition: transform 0.2s;
  margin-bottom: 16px;
}

.menu-card:hover {
  transform: translateY(-2px);
}

.menu-card.course-enroll {
  background: linear-gradient(135deg, #E6A23C 0%, #F56C6C 100%);
  color: white;
}

.menu-card.course-enroll .menu-item span {
  color: white;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

.menu-item span {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.recommended-courses {
  margin-bottom: 20px;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.course-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.course-item:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.course-thumbnail {
  position: relative;
  width: 120px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.course-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-badge {
  position: absolute;
  top: 4px;
  right: 4px;
}

.course-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.course-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-info p {
  font-size: 14px;
  color: #606266;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.course-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: auto;
  font-size: 12px;
  color: #909399;
}

.course-meta .price {
  color: #E6A23C;
  font-weight: 600;
}

.recent-activities {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-item {
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 16px;
}

.activity-item:hover {
  background: #f5f7fa;
  margin: 0 -20px;
  padding: 16px 20px;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-info {
  flex: 1;
}

.activity-info h4 {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 4px 0;
}

.activity-meta {
  font-size: 12px;
  color: #909399;
}

.separator {
  margin: 0 4px;
}

.activity-item .el-progress {
  flex: 1;
  max-width: 200px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }

  .quick-menu .el-col {
    margin-bottom: 16px;
  }

  .stats-card .el-col {
    margin-bottom: 16px;
  }

  .course-item {
    flex-direction: column;
    gap: 12px;
  }

  .course-thumbnail {
    width: 100%;
    height: 160px;
  }

  .activity-item {
    flex-wrap: wrap;
  }

  .activity-item .el-progress {
    width: 100%;
    max-width: none;
    order: 3;
  }
}
</style>
