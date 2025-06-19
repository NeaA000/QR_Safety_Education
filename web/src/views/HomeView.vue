<template>
  <div class="home-view">
    <!-- 헤더 -->
    <div class="header">
      <div class="welcome-section">
        <h1 class="welcome-title">안녕하세요!</h1>
        <p class="welcome-subtitle">{{ userName }}님, 오늘도 안전한 하루 되세요</p>
      </div>
      <el-button 
        type="primary" 
        :icon="Scan" 
        @click="handleQRScan"
        class="qr-scan-btn"
      >
        QR 스캔
      </el-button>
    </div>

    <!-- 진행률 카드 -->
    <el-card class="progress-card">
      <template #header>
        <div class="card-header">
          <el-icon><TrendCharts /></el-icon>
          <span>학습 진행률</span>
        </div>
      </template>
      
      <div class="progress-content">
        <div class="progress-stats">
          <div class="stat-item">
            <span class="stat-value">{{ completedLectures }}</span>
            <span class="stat-label">완료</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ totalLectures }}</span>
            <span class="stat-label">전체</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ progressPercentage }}%</span>
            <span class="stat-label">진행률</span>
          </div>
        </div>
        
        <el-progress 
          :percentage="progressPercentage" 
          :stroke-width="8"
          color="#3b82f6"
        />
      </div>
    </el-card>

    <!-- 빠른 액션 -->
    <div class="quick-actions">
      <h2 class="section-title">빠른 액션</h2>
      <div class="action-grid">
        <div 
          v-for="action in quickActions" 
          :key="action.name"
          class="action-item"
          @click="handleAction(action)"
        >
          <el-icon :size="24" class="action-icon">
            <component :is="action.icon" />
          </el-icon>
          <span class="action-label">{{ action.label }}</span>
        </div>
      </div>
    </div>

    <!-- 최근 강의 -->
    <el-card class="recent-lectures">
      <template #header>
        <div class="card-header">
          <el-icon><VideoPlay /></el-icon>
          <span>최근 강의</span>
          <el-button 
            type="text" 
            @click="$router.push('/lectures')"
            class="view-all-btn"
          >
            전체보기
          </el-button>
        </div>
      </template>
      
      <div v-if="recentLectures.length === 0" class="empty-state">
        <el-icon size="48" color="#ddd"><VideoPlay /></el-icon>
        <p>아직 시청한 강의가 없습니다.</p>
        <el-button type="primary" @click="$router.push('/lectures')">
          강의 둘러보기
        </el-button>
      </div>
      
      <div v-else class="lecture-list">
        <div 
          v-for="lecture in recentLectures" 
          :key="lecture.id"
          class="lecture-item"
          @click="playLecture(lecture)"
        >
          <div class="lecture-thumbnail">
            <img :src="lecture.thumbnail" :alt="lecture.title" />
            <div class="play-overlay">
              <el-icon><VideoPlay /></el-icon>
            </div>
          </div>
          
          <div class="lecture-info">
            <h3 class="lecture-title">{{ lecture.title }}</h3>
            <p class="lecture-instructor">{{ lecture.instructor }}</p>
            <div class="lecture-meta">
              <span class="duration">{{ formatDuration(lecture.duration) }}</span>
              <span class="progress">{{ lecture.progress }}% 완료</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 공지사항 -->
    <el-card v-if="announcements.length > 0" class="announcements">
      <template #header>
        <div class="card-header">
          <el-icon><Bell /></el-icon>
          <span>공지사항</span>
        </div>
      </template>
      
      <div class="announcement-list">
        <div 
          v-for="announcement in announcements" 
          :key="announcement.id"
          class="announcement-item"
          @click="viewAnnouncement(announcement)"
        >
          <div class="announcement-content">
            <h4 class="announcement-title">{{ announcement.title }}</h4>
            <p class="announcement-date">{{ formatDate(announcement.date) }}</p>
          </div>
          <el-icon class="announcement-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { 
  Scan, TrendCharts, VideoPlay, Bell, ArrowRight,
  House, Medal, User, BookOpen
} from '@element-plus/icons-vue'

interface Lecture {
  id: string
  title: string
  instructor: string
  thumbnail: string
  duration: number
  progress: number
}

interface Announcement {
  id: string
  title: string
  content: string
  date: Date
}

// 스토어
const authStore = useAuthStore()
const appStore = useAppStore()
const router = useRouter()

// 반응형 데이터
const completedLectures = ref(3)
const totalLectures = ref(12)
const recentLectures = ref<Lecture[]>([])
const announcements = ref<Announcement[]>([])

// 계산된 속성
const userName = computed(() => authStore.user?.name || '사용자')
const progressPercentage = computed(() => 
  Math.round((completedLectures.value / totalLectures.value) * 100)
)

const quickActions = [
  { name: 'lectures', label: '강의 목록', icon: VideoPlay },
  { name: 'certificates', label: '수료증', icon: Medal },
  { name: 'profile', label: '프로필', icon: User },
  { name: 'help', label: '도움말', icon: BookOpen }
]

// 라이프사이클
onMounted(async () => {
  await loadDashboardData()
})

// 메서드
const loadDashboardData = async (): Promise<void> => {
  try {
    appStore.setLoading(true)
    
    // TODO: API에서 데이터 로드
    // const [lecturesData, announcementsData] = await Promise.all([
    //   fetchRecentLectures(),
    //   fetchAnnouncements()
    // ])
    
    // 임시 데이터
    recentLectures.value = [
      {
        id: '1',
        title: '화재 안전 기초',
        instructor: '김안전',
        thumbnail: '/images/lecture1.jpg',
        duration: 1800, // 30분
        progress: 75
      },
      {
        id: '2',
        title: '응급처치 요령',
        instructor: '박의료',
        thumbnail: '/images/lecture2.jpg',
        duration: 2400, // 40분
        progress: 100
      }
    ]
    
    announcements.value = [
      {
        id: '1',
        title: '새로운 안전교육 과정이 추가되었습니다',
        content: '산업안전 고급과정이 새롭게 추가되었습니다.',
        date: new Date('2024-12-19')
      }
    ]
    
    appStore.logEvent('dashboard_loaded', {
      completedLectures: completedLectures.value,
      totalLectures: totalLectures.value
    })
    
  } catch (error) {
    console.error('대시보드 데이터 로드 실패:', error)
    appStore.showToast('데이터를 불러오는데 실패했습니다.', 'error')
  } finally {
    appStore.setLoading(false)
  }
}

const handleQRScan = (): void => {
  if (appStore.canUseQRScanner) {
    try {
      window.Android?.scanQR()
      appStore.logEvent('qr_scan_initiated')
    } catch (error) {
      console.error('QR 스캔 오류:', error)
      appStore.showToast('QR 스캔을 시작할 수 없습니다.', 'error')
    }
  } else {
    appStore.showToast('QR 스캔 기능을 사용할 수 없습니다.', 'warning')
  }
}

const handleAction = (action: any): void => {
  appStore.logEvent('quick_action_clicked', { action: action.name })
  
  switch (action.name) {
    case 'lectures':
      router.push('/lectures')
      break
    case 'certificates':
      router.push('/certificates')
      break
    case 'profile':
      router.push('/profile')
      break
    case 'help':
      // TODO: 도움말 페이지로 이동
      appStore.showToast('도움말 페이지 준비 중입니다.', 'info')
      break
    default:
      break
  }
}

const playLecture = (lecture: Lecture): void => {
  appStore.logEvent('lecture_play_from_home', { lectureId: lecture.id })
  router.push(`/lectures/${lecture.id}/watch`)
}

const viewAnnouncement = (announcement: Announcement): void => {
  appStore.logEvent('announcement_clicked', { announcementId: announcement.id })
  // TODO: 공지사항 상세 페이지로 이동
  appStore.showToast('공지사항 상세 페이지 준비 중입니다.', 'info')
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}분`
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.home-view {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.welcome-section {
  flex: 1;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.welcome-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.qr-scan-btn {
  flex-shrink: 0;
}

.progress-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.progress-content {
  space-y: 16px;
}

.progress-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.quick-actions {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.action-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-icon {
  color: #3b82f6;
  margin-bottom: 8px;
}

.action-label {
  font-size: 12px;
  color: #374151;
  text-align: center;
}

.recent-lectures {
  margin-bottom: 24px;
}

.view-all-btn {
  margin-left: auto;
  color: #3b82f6;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.lecture-list {
  space-y: 16px;
}

.lecture-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.lecture-item:hover {
  background-color: #f9fafb;
}

.lecture-thumbnail {
  position: relative;
  width: 80px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.lecture-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.lecture-info {
  flex: 1;
}

.lecture-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.lecture-instructor {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.lecture-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #9ca3af;
}

.announcements {
  margin-bottom: 24px;
}

.announcement-list {
  space-y: 12px;
}

.announcement-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.announcement-item:hover {
  background-color: #f9fafb;
}

.announcement-content {
  flex: 1;
}

.announcement-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.announcement-date {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.announcement-arrow {
  color: #9ca3af;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .home-view {
    padding: 16px;
  }
  
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .lecture-item {
    padding: 12px;
  }
  
  .lecture-thumbnail {
    width: 60px;
    height: 45px;
  }
}
</style>