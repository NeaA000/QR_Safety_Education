<template>
  <div class="splash-container">
    <div class="splash-content">
      <!-- 로고 -->
      <div class="logo-wrapper">
        <el-icon :size="80" color="#409EFF">
          <QrCode />
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
// 아이콘 이름 수정: Qrcode -> QrCode
import { QrCode } from '@element-plus/icons-vue'

export default {
  name: 'SplashView',
  components: {
    QrCode
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
        loadingProgress.value = step.progress
        statusMessage.value = step.message
        await new Promise(resolve => setTimeout(resolve, step.delay))
      }
    }
    
    onMounted(async () => {
      try {
        // TODO: [보안강화] 앱 시작 시 보안 검증
        // - 디바이스 무결성 확인
        // - 최소 OS 버전 확인
        // - 필수 권한 확인
        
        // 로딩 애니메이션 시작
        await simulateLoading()
        
        // 인증 상태 확인 후 라우팅
        setTimeout(() => {
          if (authStore.isAuthenticated) {
            router.replace('/dashboard')
          } else {
            router.replace('/login')
          }
        }, 500)
      } catch (error) {
        console.error('스플래시 화면 오류:', error)
        // TODO: [보안강화] 오류 발생 시 안전한 처리
        router.replace('/login')
      }
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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
}

.splash-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.logo-wrapper {
  background: white;
  border-radius: 50%;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.app-title {
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
}

.app-subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 3rem;
}

.loading-wrapper {
  width: 200px;
  margin-bottom: 1rem;
}

.status-message {
  font-size: 0.875rem;
  opacity: 0.8;
  height: 20px;
}

.splash-footer {
  text-align: center;
}

.version {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-bottom: 0.25rem;
}

.copyright {
  font-size: 0.75rem;
  opacity: 0.5;
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-wrapper {
  animation: fadeIn 0.8s ease-out;
}

.app-title {
  animation: fadeIn 0.8s ease-out 0.2s both;
}

.app-subtitle {
  animation: fadeIn 0.8s ease-out 0.4s both;
}
</style>