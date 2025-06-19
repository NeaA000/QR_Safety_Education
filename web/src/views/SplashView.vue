<template>
  <div class="splash-container">
    <div class="splash-content">
      <!-- 로고 -->
      <div class="logo-wrapper">
        <el-icon :size="80" color="#409EFF">
          <Scan />
        </el-icon>
      </div>
      
      <!-- 앱 이름 -->
      <h1 class="app-title">QR 안전교육</h1>
      <p class="app-subtitle">스마트한 안전교육 관리 시스템</p>
      
      <!-- 로딩 인디케이터 -->
      <div class="loading-wrapper">
        <el-progress 
          :percentage="loadingProgress" 
          :show-text="false"
          :stroke-width="3"
          color="#409EFF"
        />
      </div>
      
      <!-- 상태 메시지 -->
      <p class="status-message">{{ statusMessage }}</p>
    </div>
    
    <!-- 하단 정보 -->
    <div class="splash-footer">
      <p class="version">v{{ appVersion }}</p>
      <p class="copyright">© 2024 JBSQR Safety Education</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
// Qrcode 아이콘 대신 실제 존재하는 Scan 아이콘 사용
import { Scan } from '@element-plus/icons-vue'

export default {
  name: 'SplashView',
  components: {
    Scan
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const loadingProgress = ref(0)
    const statusMessage = ref('앱을 시작하는 중...')
    const appVersion = ref('1.0.0')
    
    // 로딩 시뮬레이션
    const simulateLoading = async () => {
      const steps = [
        { progress: 20, message: '환경 설정 확인 중...', delay: 300 },
        { progress: 40, message: '보안 모듈 초기화 중...', delay: 400 },
        { progress: 60, message: '사용자 인증 확인 중...', delay: 500 },
        { progress: 80, message: '데이터 동기화 중...', delay: 400 },
        { progress: 100, message: '준비 완료!', delay: 300 }
      ]
      
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, step.delay))
        loadingProgress.value = step.progress
        statusMessage.value = step.message
      }
    }
    
    // 초기화 및 라우팅
    const initialize = async () => {
      try {
        // 로딩 시작
        await simulateLoading()
        
        // 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 인증 상태 확인
        const isAuthenticated = await authStore.checkAuthStatus?.()
        
        // 라우팅
        if (isAuthenticated) {
          console.log('인증됨 - 홈으로 이동')
          router.push('/home')
        } else {
          console.log('미인증 - 로그인으로 이동')
          router.push('/login')
        }
      } catch (error) {
        console.error('초기화 실패:', error)
        statusMessage.value = '앱 시작 실패'
        
        // 에러 발생 시 로그인 페이지로
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    }
    
    onMounted(() => {
      console.log('SplashView 마운트됨')
      initialize()
    })
    
    return {
      loadingProgress,
      statusMessage,
      appVersion
    }
  }
}
</script>

<style scoped>
.splash-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.splash-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
  width: 100%;
  max-width: 400px;
}

.logo-wrapper {
  margin-bottom: 30px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.app-title {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 10px 0;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 16px;
  color: #606266;
  margin: 0 0 40px 0;
}

.loading-wrapper {
  width: 200px;
  margin-bottom: 20px;
}

.status-message {
  font-size: 14px;
  color: #909399;
  margin: 0;
  min-height: 20px;
}

.splash-footer {
  padding: 20px;
  text-align: center;
}

.version {
  font-size: 12px;
  color: #909399;
  margin: 0 0 5px 0;
}

.copyright {
  font-size: 12px;
  color: #C0C4CC;
  margin: 0;
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .app-title {
    font-size: 28px;
  }
  
  .app-subtitle {
    font-size: 14px;
  }
  
  .logo-wrapper {
    margin-bottom: 20px;
  }
}

/* 다크 모드 지원 */
@media (prefers-color-scheme: dark) {
  .splash-container {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }
  
  .app-title {
    color: #ffffff;
  }
  
  .app-subtitle {
    color: #b0b0b0;
  }
  
  .status-message {
    color: #808080;
  }
  
  .copyright {
    color: #606060;
  }
}
</style>