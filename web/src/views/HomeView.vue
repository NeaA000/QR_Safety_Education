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
              <arrow-down />
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
          <el-icon :size="48">
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
              <div class="stat-value">{{ lectureStats.completedLectures }}</div>
              <div class="stat-label">완료한 강의</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-value">{{ lectureStats.totalLectures }}</div>
              <div class="stat-label">전체 강의</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-value">{{ lectureStats.completionRate }}%</div>
              <div class="stat-label">완료율</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 빠른 메뉴 -->
      <div class="quick-menu">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card shadow="hover" @click="goToLectures" class="menu-card">
              <div class="menu-item">
                <el-icon :size="32" color="#409EFF">
                  <VideoPlay />
                </el-icon>
                <span>강의 목록</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover" @click="goToCertificates" class="menu-card">
              <div class="menu-item">
                <el-icon :size="32" color="#E6A23C">
                  <Medal />
                </el-icon>
                <span>수료증</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 최근 학습 내역 -->
      <el-card class="recent-activities">
        <template #header>
          <div class="card-header">
            <span>최근 학습 내역</span>
            <el-link type="primary" @click="goToLectures">전체보기</el-link>
          </div>
        </template>
        
        <div v-if="recentLecturesData.length > 0">
          <div 
            v-for="lecture in recentLecturesData" 
            :key="lecture.id"
            class="activity-item"
            @click="goToLecture(lecture.id)"
          >
            <div class="activity-info">
              <h4>{{ lecture.title }}</h4>
              <p>진행률: {{ lecture.progress }}%</p>
            </div>
            <el-progress 
              :percentage="lecture.progress" 
              :stroke-width="6"
              :color="lecture.progress === 100 ? '#67C23A' : '#409EFF'"
            />
          </div>
        </div>
        <el-empty v-else description="아직 학습한 강의가 없습니다" />
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
  Camera,  // Scan 대신 Camera 사용
  VideoPlay,
  Medal,
  ArrowDown
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useLectureStore } from '@/stores/lectures'
import nativeBridge from '@/services/native-bridge'

// 스토어 및 라우터
const router = useRouter()
const authStore = useAuthStore()
const lectureStore = useLectureStore()

// 상태
const isScanning = ref(false)

// 계산된 속성
const userName = computed(() => authStore.user?.displayName || '사용자')
const userEmail = computed(() => authStore.user?.email || '')
const userAvatar = computed(() => authStore.user?.photoURL || '')
const lectureStats = computed(() => lectureStore.lectureStats)
const recentLecturesData = computed(() => lectureStore.recentLectures)

/**
 * QR 코드 스캔
 */
const handleQRScan = async (): Promise<void> => {
  try {
    isScanning.value = true
    
    // 카메라 권한 확인
    if (nativeBridge.isNativeApp()) {
      const hasPermission = await nativeBridge.requestCameraPermission()
      if (!hasPermission) {
        ElMessage.warning('카메라 권한이 필요합니다.')
        return
      }
    }

    // QR 스캔 실행
    const result = await nativeBridge.scanQR()
    
    if (result) {
      try {
        const qrData = JSON.parse(result)
        
        // QR 데이터 검증
        if (qrData.type === 'lecture' && qrData.lectureId) {
          // 강의 페이지로 이동
          await router.push(`/lectures/${qrData.lectureId}/watch`)
          ElMessage.success('강의를 시작합니다.')
        } else {
          ElMessage.error('유효하지 않은 QR 코드입니다.')
        }
      } catch (parseError) {
        console.error('QR 데이터 파싱 오류:', parseError)
        ElMessage.error('QR 코드 형식이 올바르지 않습니다.')
      }
    }
    
  } catch (error) {
    console.error('QR 스캔 오류:', error)
    ElMessage.error('QR 스캔에 실패했습니다.')
  } finally {
    isScanning.value = false
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
const goToLectures = (): void => {
  router.push('/lectures')
}

const goToCertificates = (): void => {
  router.push('/certificates')
}

const goToLecture = (id: string): void => {
  router.push(`/lectures/${id}/watch`)
}

/**
 * 초기화
 */
onMounted(async () => {
  try {
    // 강의 스토어 초기화
    await lectureStore.initialize()
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

.qr-scan-content {
  text-align: center;
  padding: 20px;
}

.qr-scan-content h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 16px 0 8px;
}

.qr-scan-content p {
  font-size: 14px;
  margin: 0 0 24px;
  opacity: 0.9;
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
}

.menu-card:hover {
  transform: translateY(-2px);
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
  margin-bottom: 8px;
}

.activity-info h4 {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 4px 0;
}

.activity-info p {
  font-size: 12px;
  color: #909399;
  margin: 0;
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
}
</style>