<template>
  <div class="home-container">
    <!-- 헤더 -->
    <div class="home-header">
      <div class="header-content">
        <div class="logo-section">
          <el-icon :size="32" color="var(--color-brand-primary)">
            <Lock />
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
                class="upgrade-button"
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
          <el-card class="action-card qr-scan-card" @click="handleQRScan">
            <div class="action-content">
              <el-icon :size="40" color="var(--color-brand-primary)">
                <Camera />
              </el-icon>
              <h4>QR 스캔</h4>
              <p>QR 코드를 스캔하여 교육 시작</p>
            </div>
          </el-card>

          <!-- 강의 목록 -->
          <el-card class="action-card courses-card" @click="$router.push('/courses')">
            <div class="action-content">
              <el-icon :size="40" color="var(--color-brand-secondary)">
                <Document />
              </el-icon>
              <h4>강의 목록</h4>
              <p>다양한 안전교육 강의 탐색</p>
            </div>
          </el-card>

          <!-- 내 강의 (로그인된 사용자만) -->
          <el-card
            v-if="authStore.isLoggedIn"
            class="action-card my-courses-card"
            @click="$router.push('/courses/my')"
          >
            <div class="action-content">
              <el-icon :size="40" color="var(--color-brand-primary-dark)">
                <Collection />
              </el-icon>
              <h4>내 강의</h4>
              <p>수강 중인 강의 확인</p>
            </div>
          </el-card>

          <!-- 수료증 (로그인된 사용자만) -->
          <el-card
            v-if="authStore.isLoggedIn"
            class="action-card certificates-card"
            @click="$router.push('/certificates')"
          >
            <div class="action-content">
              <el-icon :size="40" color="var(--color-warning)">
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
                <component :is="getActivityIcon(activity.icon)" />
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
            <el-icon :size="60" color="var(--color-brand-secondary)">
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
          <el-card class="stat-card courses-stat">
            <div class="stat-content">
              <el-icon :size="32" color="var(--color-brand-secondary)">
                <Document />
              </el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.totalCourses }}</div>
                <div class="stat-label">수강한 강의</div>
              </div>
            </div>
          </el-card>

          <el-card class="stat-card completed-stat">
            <div class="stat-content">
              <el-icon :size="32" color="var(--color-brand-primary)">
                <Trophy />
              </el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.completedCourses }}</div>
                <div class="stat-label">완료한 강의</div>
              </div>
            </div>
          </el-card>

          <el-card class="stat-card certificates-stat">
            <div class="stat-content">
              <el-icon :size="32" color="var(--color-warning)">
                <Medal />
              </el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.certificates }}</div>
                <div class="stat-label">수료증</div>
              </div>
            </div>
          </el-card>

          <el-card class="stat-card hours-stat">
            <div class="stat-content">
              <el-icon :size="32" color="var(--color-brand-secondary-dark)">
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
  Lock,
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
    iconColor: 'var(--color-brand-primary)',
    type: 'course_complete',
    courseId: '1'
  },
  {
    id: 2,
    title: '작업장 안전 수칙 시청',
    time: '1일 전',
    icon: 'Document',
    iconColor: 'var(--color-brand-secondary)',
    type: 'lesson_watch',
    lessonId: '5'
  },
  {
    id: 3,
    title: '안전모 착용법 강의 신청',
    time: '3일 전',
    icon: 'Collection',
    iconColor: 'var(--color-brand-primary-dark)',
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

// 활동 아이콘 매핑 함수
const getActivityIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    Trophy,
    Document,
    Collection,
    Calendar,
    Clock,
    Medal,
    Lock
  }
  return iconMap[iconName] || Document
}

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
  background: var(--gradient-background);
}

.home-header {
  background: var(--header-background);
  box-shadow: var(--box-shadow-company);
  position: sticky;
  top: 0;
  z-index: var(--z-index-sticky);
  border-bottom: 1px solid var(--border-color-light);
}

.header-content {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--spacing-4) var(--spacing-5);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.app-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color-primary);
  margin: 0;
  background: var(--gradient-company);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.welcome-text {
  font-weight: var(--font-weight-medium);
  color: var(--text-color-regular);
}

.main-content {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--spacing-5);
}

.welcome-section {
  margin-bottom: var(--spacing-8);
}

.welcome-card {
  background: var(--gradient-company);
  border: none;
  border-radius: var(--border-radius-2xl);
  overflow: hidden;
  box-shadow: var(--box-shadow-company);
}

:deep(.welcome-card .el-card__body) {
  padding: 0;
}

.welcome-content {
  text-align: center;
  padding: var(--spacing-10) var(--spacing-5);
  color: var(--white);
}

.welcome-title {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--spacing-4) 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.welcome-description {
  font-size: var(--font-size-lg);
  opacity: 0.95;
  margin: 0 0 var(--spacing-6) 0;
  line-height: var(--line-height-lg);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.upgrade-section {
  margin-top: var(--spacing-6);
}

.upgrade-button {
  background: var(--white) !important;
  color: var(--color-brand-primary) !important;
  border: none !important;
  font-weight: var(--font-weight-semibold) !important;
}

.upgrade-button:hover {
  background: var(--gray-50) !important;
  transform: translateY(-1px);
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-color-primary);
  margin: 0 0 var(--spacing-4) 0;
  padding-bottom: var(--spacing-2);
  border-bottom: 3px solid var(--color-brand-primary);
  display: inline-block;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-5);
  margin-bottom: var(--spacing-8);
}

.action-card {
  cursor: pointer;
  transition: var(--transition-all);
  border: none;
  border-radius: var(--border-radius-xl);
  background: var(--white);
  box-shadow: var(--box-shadow-base);
  overflow: hidden;
  position: relative;
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-brand-primary);
  transform: scaleX(0);
  transition: var(--transition-transform);
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--box-shadow-company);
}

.action-card:hover::before {
  transform: scaleX(1);
}

.qr-scan-card::before {
  background: var(--color-brand-primary);
}

.courses-card::before {
  background: var(--color-brand-secondary);
}

.my-courses-card::before {
  background: var(--color-brand-primary-dark);
}

.certificates-card::before {
  background: var(--color-warning);
}

.action-content {
  text-align: center;
  padding: var(--spacing-6);
}

.action-content h4 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: var(--spacing-4) 0 var(--spacing-2) 0;
  color: var(--text-color-primary);
}

.action-content p {
  color: var(--text-color-regular);
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
}

.recent-activity,
.stats-section {
  margin-bottom: var(--spacing-8);
}

.activity-card {
  border-radius: var(--border-radius-xl);
  box-shadow: var(--box-shadow-base);
  border: 1px solid var(--border-color-light);
}

:deep(.activity-card .el-card__body) {
  padding: var(--spacing-6);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--bg-color-education);
  border-radius: var(--border-radius-lg);
  transition: var(--transition-colors);
  border: 1px solid var(--border-color-extra-light);
}

.activity-item:hover {
  background: var(--gray-50);
  border-color: var(--border-color-light);
}

.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.activity-title {
  font-weight: var(--font-weight-medium);
  color: var(--text-color-primary);
  font-size: var(--font-size-base);
}

.activity-time {
  font-size: var(--font-size-xs);
  color: var(--text-color-secondary);
}

.no-activity {
  text-align: center;
  padding: var(--spacing-10) var(--spacing-5);
  color: var(--text-color-secondary);
}

.no-activity p {
  margin: var(--spacing-2) 0;
  font-size: var(--font-size-base);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-5);
}

.stat-card {
  border-radius: var(--border-radius-xl);
  box-shadow: var(--box-shadow-base);
  transition: var(--transition-all);
  border: 1px solid var(--border-color-light);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--box-shadow-company);
}

:deep(.stat-card .el-card__body) {
  padding: var(--spacing-6);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color-primary);
  line-height: 1;
  margin-bottom: var(--spacing-1);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-color-regular);
  font-weight: var(--font-weight-medium);
}

/* 통계 카드별 특별한 스타일 (회사 컬러) */
.courses-stat {
  border-left: 4px solid var(--color-brand-secondary);
}

.completed-stat {
  border-left: 4px solid var(--color-brand-primary);
}

.certificates-stat {
  border-left: 4px solid var(--color-warning);
}

.hours-stat {
  border-left: 4px solid var(--color-brand-secondary-dark);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .header-content {
    padding: var(--spacing-3) var(--spacing-4);
  }

  .app-title {
    font-size: var(--font-size-xl);
  }

  .welcome-title {
    font-size: var(--font-size-3xl);
  }

  .welcome-description {
    font-size: var(--font-size-base);
  }

  .main-content {
    padding: var(--spacing-4);
  }

  .action-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-4);
  }

  .welcome-content {
    padding: var(--spacing-6) var(--spacing-4);
  }
}

@media (max-width: 480px) {
  .header-content {
    flex-direction: column;
    gap: var(--spacing-3);
    align-items: stretch;
  }

  .user-section {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .welcome-content {
    padding: var(--spacing-5) var(--spacing-3);
  }

  .stat-number {
    font-size: var(--font-size-3xl);
  }
}

/* 접근성 개선 */
@media (prefers-reduced-motion: reduce) {
  .action-card {
    transition: none;
  }

  .action-card:hover {
    transform: none;
  }

  .upgrade-button:hover {
    transform: none;
  }
}
</style>
