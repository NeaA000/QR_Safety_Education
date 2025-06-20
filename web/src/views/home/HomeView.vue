<template>
  <div class="home-container">
    <!-- 헤더 -->
    <div class="home-header">
      <div class="header-content">
        <div class="logo-section">
          <el-icon :size="32" color="#409EFF">
            <Shield />
          </el-icon>
          <h1 class="app-title">QR 안전교육</h1>
        </div>

        <div class="user-section">
          <template v-if="authStore.isLoggedIn">
            <span class="welcome-text">{{ authStore.displayName }}님</span>
            <el-dropdown @command="handleUserAction">
              <el-button type="primary" :icon="User" circle />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile" :icon="User">
                    프로필
                  </el-dropdown-item>
                  <el-dropdown-item command="settings" :icon="Setting">
                    설정
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" :icon="SwitchButton" divided>
                    로그아웃
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" @click="$router.push('/auth/login')">
              로그인
            </el-button>
          </template>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="main-content">
      <!-- 환영 섹션 -->
      <div class="welcome-section">
        <el-card class="welcome-card">
          <div class="welcome-content">
            <h2 class="welcome-title">
              <template v-if="authStore.isLoggedIn">
                {{ authStore.displayName }}님, 환영합니다!
              </template>
              <template v-else>
                QR 안전교육에 오신 것을 환영합니다
              </template>
            </h2>
            <p class="welcome-description">
              <template v-if="authStore.isAnonymous">
                게스트로 로그인하셨습니다. 회원가입하시면 더 많은 기능을 이용하실 수 있습니다.
              </template>
              <template v-else-if="authStore.isLoggedIn">
                오늘도 안전한 작업환경을 위한 교육을 시작해보세요.
              </template>
              <template v-else>
                QR 코드 기반 스마트 안전교육으로 효율적인 학습을 경험하세요.
              </template>
            </p>

            <!-- 게스트 사용자 업그레이드 버튼 -->
            <div v-if="authStore.isAnonymous" class="upgrade-section">
              <el-button
                type="primary"
                size="large"
                @click="$router.push('/auth/register?upgrade=true')"
                :icon="UserFilled"
              >
                회원가입하고 모든 기능 이용하기
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 빠른 액션 -->
      <div class="quick-actions">
        <h3 class="section-title">빠른 시작</h3>
        <div class="action-grid">
          <!-- QR 스캔 -->
          <el-card class="action-card" @click="handleQRScan">
            <div class="action-content">
              <el-icon :size="40" color="#409EFF">
                <Camera />
              </el-icon>
              <h4>QR 스캔</h4>
              <p>QR 코드를 스캔하여 교육 시작</p>
            </div>
          </el-card>

          <!-- 강의 목록 -->
          <el-card class="action-card" @click="$router.push('/courses')">
            <div class="action-content">
              <el-icon :size="40" color="#67C23A">
                <Document />
              </el-icon>
              <h4>강의 목록</h4>
              <p>다양한 안전교육 강의 탐색</p>
            </div>
          </el-card>

          <!-- 내 강의 (로그인된 사용자만) -->
          <el-card
            v-if="authStore.isLoggedIn"
            class="action-card"
            @click="$router.push('/courses/my')"
          >
            <div class="action-content">
              <el-icon :size="40" color="#E6A23C">
                <Collection />
              </el-icon>
              <h4>내 강의</h4>
              <p>수강 중인 강의 확인</p>
            </div>
          </el-card>

          <!-- 수료증 (로그인된 사용자만) -->
          <el-card
            v-if="authStore.isLoggedIn"
            class="action-card"
            @click="$router.push('/certificates')"
          >
            <div class="action-content">
              <el-icon :size="40" color="#F56C6C">
                <Trophy />
              </el-icon>
              <h4>수료증</h4>
              <p>취득한 수료증 관리</p>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 최근 활동 (로그인된 사용자만) -->
      <div v-if="authStore.isLoggedIn && !authStore.isAnonymous" class="recent-activity">
        <h3 class="section-title">최근 활동</h3>
        <el-card class="activity-card">
          <div v-if="recentActivities.length > 0" class="activity-list">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="activity-item"
            >
              <el-icon :size="20" :color="activity.iconColor">
                <component :is="activity.icon" />
              </el-icon>
              <div class="activity-content">
                <span class="activity-title">{{ activity.title }}</span>
                <span class="activity-time">{{ activity.time }}</span>
              </div>
              <el-button type="primary" link @click="handleActivityClick(activity)">
                보기
              </el-button>
            </div>
          </div>
          <div v-else class="no-activity">
            <el-icon :size="60" color="#C0C4CC">
              <Calendar />
            </el-icon>
            <p>아직 활동 내역이 없습니다.</p>
            <p>첫 번째 강의를 시작해보세요!</p>
          </div>
        </el-card>
      </div>

      <!-- 통계 (로그인된 사용자만) -->
      <div v-if="authStore.isLoggedIn && !authStore.isAnonymous" class="stats-section">
        <h3 class="section-title">나의 학습 현황</h3>
        <div class="stats-grid">
          <el-card class="stat-card">
            <div class="stat-content">
              <el-icon :size="32" color="#409EFF">
                <Document />
              </el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.totalCourses }}</div>
                <div class="stat-label">수강한 강의</div>
              </div>
            </div>
          </el-card>

          <el-card class="stat-card">
            <div class="stat-content">
              <el-icon :size="32" color="#67C23A">
                <Trophy />
              </el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.completedCourses }}</div>
                <div class="stat-label">완료한 강의</div>
              </div>
            </div>
          </el-card>

          <el-card class="stat-card">
            <div class="stat-content">
              <el-icon :size="32" color="#E6A23C">
                <Medal />
              </el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.certificates }}</div>
                <div class="stat-label">수료증</div>
              </div>
            </div>
          </el-card>

          <el-card class="stat-card">
            <div class="stat-content">
              <el-icon :size="32" color="#F56C6C">
                <Clock />
              </el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.totalHours }}</div>
                <div class="stat-label">학습 시간</div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Shield,
  User,
  UserFilled,
  Setting,
  SwitchButton,
  Camera,
  Document,
  Collection,
  Trophy,
  Calendar,
  Clock,
  Medal
} from '@element-plus/icons-vue'

// 컴포넌트 설정
const router = useRouter()
const authStore = useAuthStore()

// 반응형 상태
const recentActivities = ref([
  {
    id: 1,
    title: '화재 안전 교육 완료',
    time: '2시간 전',
    icon: 'Trophy',
    iconColor: '#67C23A',
    type: 'course_complete',
    courseId: '1'
  },
  {
    id: 2,
    title: '작업장 안전 수칙 시청',
    time: '1일 전',
    icon: 'Document',
    iconColor: '#409EFF',
    type: 'lesson_watch',
    lessonId: '5'
  },
  {
    id: 3,
    title: '안전모 착용법 강의 신청',
    time: '3일 전',
    icon: 'Collection',
    iconColor: '#E6A23C',
    type: 'course_enroll',
    courseId: '3'
  }
])

const userStats = reactive({
  totalCourses: 5,
  completedCourses: 3,
  certificates: 2,
  totalHours: 24
})

// 사용자 액션 처리
const handleUserAction = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      ElMessage.info('설정 기능은 곧 추가될 예정입니다.')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '정말로 로그아웃하시겠습니까?',
          '로그아웃 확인',
          {
            confirmButtonText: '로그아웃',
            cancelButtonText: '취소',
            type: 'warning'
          }
        )
        await authStore.logout()
        router.push('/auth/login')
      } catch {
        // 사용자가 취소함
      }
      break
  }
}

// QR 스캔 처리
const handleQRScan = () => {
  router.push('/qr-scan')
}

// 활동 클릭 처리
const handleActivityClick = (activity: any) => {
  switch (activity.type) {
    case 'course_complete':
    case 'course_enroll':
      router.push(`/courses/${activity.courseId}`)
      break
    case 'lesson_watch':
      ElMessage.info('해당 강의로 이동합니다.')
      break
    default:
      ElMessage.info('상세 정보를 확인합니다.')
  }
}

// 사용자 통계 로드
const loadUserStats = async () => {
  if (!authStore.isLoggedIn || authStore.isAnonymous) return

  try {
    // TODO: 실제 API 호출로 사용자 통계 데이터 로드
    // const stats = await userStatsAPI.getUserStats()
    // Object.assign(userStats, stats)

    console.log('사용자 통계 로드됨:', userStats)
  } catch (error) {
    console.error('사용자 통계 로드 실패:', error)
  }
}

// 최근 활동 로드
const loadRecentActivities = async () => {
  if (!authStore.isLoggedIn || authStore.isAnonymous) return

  try {
    // TODO: 실제 API 호출로 최근 활동 데이터 로드
    // const activities = await userActivityAPI.getRecentActivities()
    // recentActivities.value = activities

    console.log('최근 활동 로드됨:', recentActivities.value)
  } catch (error) {
    console.error('최근 활동 로드 실패:', error)
  }
}

// 컴포넌트 마운트
onMounted(() => {
  loadUserStats()
  loadRecentActivities()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.home-header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.welcome-text {
  font-weight: 500;
  color: #606266;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.welcome-section {
  margin-bottom: 32px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.welcome-content {
  text-align: center;
  padding: 40px 20px;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.welcome-description {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.upgrade-section {
  margin-top: 24px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.action-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.action-content {
  text-align: center;
  padding: 20px;
}

.action-content h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 16px 0 8px 0;
  color: #303133;
}

.action-content p {
  color: #606266;
  margin: 0;
  font-size: 14px;
}

.recent-activity,
.stats-section {
  margin-bottom: 32px;
}

.activity-card {
  padding: 20px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-title {
  font-weight: 500;
  color: #303133;
}

.activity-time {
  font-size: 12px;
  color: #909399;
}

.no-activity {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.no-activity p {
  margin: 8px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  padding: 20px;
  border: none;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-top: 4px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .header-content {
    padding: 12px 16px;
  }

  .app-title {
    font-size: 1.25rem;
  }

  .welcome-title {
    font-size: 1.5rem;
  }

  .welcome-description {
    font-size: 1rem;
  }

  .main-content {
    padding: 16px;
  }

  .action-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .header-content {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .user-section {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .welcome-content {
    padding: 24px 16px;
  }
}
</style>
