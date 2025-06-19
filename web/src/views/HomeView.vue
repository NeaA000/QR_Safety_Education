<template>
  <div class="home-container">
    <!-- 헤더 -->
    <div class="header">
      <div class="header-content">
        <h1 class="page-title">안전교육 관리</h1>
        <el-dropdown trigger="click" @command="handleCommand">
          <el-button circle>
            <el-icon><User /></el-icon>
          </el-button>
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
          <el-avatar :size="60" :src="userAvatar">
            <el-icon :size="30"><UserFilled /></el-icon>
          </el-avatar>
          <div class="user-details">
            <h2>{{ userName }}님, 환영합니다!</h2>
            <p>{{ userEmail }}</p>
          </div>
        </div>
      </el-card>

      <!-- QR 스캔 섹션 -->
      <el-card class="qr-scan-card">
        <div class="qr-scan-content">
          <el-icon :size="48" color="#409EFF">
            <CameraFilled />
          </el-icon>
          <h3>강의 QR 코드 스캔</h3>
          <p>QR 코드를 스캔하여 안전교육을 시작하세요</p>
          <el-button 
            type="primary" 
            size="large"
            @click="handleQRScan"
            :loading="isScanning"
          >
            <el-icon class="el-icon--left"><Scan /></el-icon>
            QR 코드 스캔
          </el-button>
        </div>
      </el-card>

      <!-- 빠른 메뉴 -->
      <div class="quick-menu">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card shadow="hover" @click="goToLectures" class="menu-card">
              <div class="menu-item">
                <el-icon :size="32" color="#67C23A">
                  <VideoPlay />
                </el-icon>
                <span>내 강의</span>
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
        
        <div v-if="recentLectures.length > 0">
          <div 
            v-for="lecture in recentLectures" 
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

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  User, 
  UserFilled, 
  Setting, 
  SwitchButton, 
  CameraFilled,
  Scan,
  VideoPlay,
  Medal
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useLectureStore } from '@/stores/lectures'
import nativeBridge from '@/services/native-bridge'

export default {
  name: 'HomeView',
  components: {
    User,
    UserFilled,
    Setting,
    SwitchButton,
    CameraFilled,
    Scan,
    VideoPlay,
    Medal
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const lectureStore = useLectureStore()
    
    // 상태
    const isScanning = ref(false)
    const recentLectures = ref([])
    
    // 계산된 속성
    const userName = computed(() => authStore.user?.displayName || '사용자')
    const userEmail = computed(() => authStore.user?.email || '')
    const userAvatar = computed(() => authStore.user?.photoURL || '')
    
    /**
     * QR 코드 스캔
     */
    const handleQRScan = async () => {
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
        
        // QR 스캐너 실행
        const result = await nativeBridge.scanQR()
        
        if (result && result.data) {
          // QR 데이터 처리
          await processQRCode(result.data)
        }
        
      } catch (error) {
        console.error('QR 스캔 실패:', error)
        
        if (error.message?.includes('취소')) {
          // 사용자가 취소한 경우 메시지 표시 안 함
        } else {
          ElMessage.error('QR 스캔에 실패했습니다.')
        }
      } finally {
        isScanning.value = false
      }
    }
    
    /**
     * QR 코드 데이터 처리
     */
    const processQRCode = async (qrData) => {
      try {
        // QR 데이터 파싱
        const data = JSON.parse(qrData)
        
        // QR 타입 확인
        if (data.type === 'lecture' && data.lectureId) {
          // 강의 정보 조회
          const lecture = await lectureStore.getLectureById(data.lectureId)
          
          if (lecture) {
            // 강의 신청/시작 확인
            const confirmed = await ElMessageBox.confirm(
              `"${lecture.title}" 강의를 시작하시겠습니까?`,
              '강의 시작',
              {
                confirmButtonText: '시작',
                cancelButtonText: '취소',
                type: 'info'
              }
            )
            
            if (confirmed) {
              // 강의 화면으로 이동
              router.push({
                name: 'video-player',
                params: { id: data.lectureId }
              })
            }
          } else {
            ElMessage.error('유효하지 않은 강의 코드입니다.')
          }
        } else {
          ElMessage.error('인식할 수 없는 QR 코드입니다.')
        }
        
      } catch (error) {
        console.error('QR 데이터 처리 실패:', error)
        ElMessage.error('QR 코드 처리 중 오류가 발생했습니다.')
      }
    }
    
    /**
     * 드롭다운 명령 처리
     */
    const handleCommand = (command) => {
      switch (command) {
        case 'profile':
          router.push('/profile')
          break
        case 'settings':
          router.push('/settings')
          break
        case 'logout':
          handleLogout()
          break
      }
    }
    
    /**
     * 로그아웃
     */
    const handleLogout = async () => {
      try {
        await ElMessageBox.confirm(
          '로그아웃하시겠습니까?',
          '로그아웃',
          {
            confirmButtonText: '확인',
            cancelButtonText: '취소',
            type: 'warning'
          }
        )
        
        await authStore.signOut()
        router.replace('/login')
        ElMessage.success('로그아웃되었습니다.')
        
      } catch (error) {
        // 취소한 경우
      }
    }
    
    /**
     * 페이지 이동
     */
    const goToLectures = () => router.push('/lectures')
    const goToCertificates = () => router.push('/certificates')
    const goToLecture = (id) => router.push(`/lectures/${id}/watch`)
    
    /**
     * 최근 학습 내역 로드
     */
    const loadRecentLectures = async () => {
      try {
        recentLectures.value = await lectureStore.getRecentLectures()
      } catch (error) {
        console.error('최근 학습 내역 로드 실패:', error)
      }
    }
    
    // 라이프사이클
    onMounted(() => {
      loadRecentLectures()
    })
    
    return {
      // 상태
      isScanning,
      recentLectures,
      
      // 계산된 속성
      userName,
      userEmail,
      userAvatar,
      
      // 메서드
      handleQRScan,
      handleCommand,
      goToLectures,
      goToCertificates,
      goToLecture
    }
  }
}
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
}
</style>