<template>
  <div class="splash-container">
    <!-- 배경 그라데이션 -->
    <div class="background-gradient"></div>
    
    <!-- 메인 콘텐츠 -->
    <div class="splash-content">
      <!-- 로고 섹션 -->
      <div class="logo-section">
        <div class="logo-container">
          <div class="logo-icon">
            <el-icon size="80" color="#ffffff">
              <Shield />
            </el-icon>
          </div>
          <div class="qr-overlay">
            <el-icon size="24" color="#1976d2">
              <Qrcode />
            </el-icon>
          </div>
        </div>
        
        <h1 class="app-title">QR 안전교육</h1>
        <p class="app-subtitle">언제 어디서나 간편한 안전 교육</p>
      </div>
      
      <!-- 로딩 섹션 -->
      <div class="loading-section">
        <div class="loading-bar">
          <div class="loading-progress" :style="{ width: progress + '%' }"></div>
        </div>
        <p class="loading-text">{{ loadingMessage }}</p>
      </div>
      
      <!-- 기능 소개 -->
      <div class="features-section" v-show="showFeatures">
        <div class="feature-item" v-for="(feature, index) in features" :key="index">
          <el-icon size="20" :color="feature.color">
            <component :is="feature.icon" />
          </el-icon>
          <span>{{ feature.text }}</span>
        </div>
      </div>
    </div>
    
    <!-- 하단 정보 -->
    <div class="footer-section">
      <p class="version-info">버전 {{ appVersion }}</p>
      <p class="copyright">© 2024 QR Safety Education</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Shield, Qrcode, VideoPlay, Medal, Share, Download } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import nativeBridge from '@/services/native-bridge'
import { logAnalyticsEvent } from '@/services/firebase'

export default {
  name: 'SplashView',
  components: {
    Shield,
    Qrcode,
    VideoPlay,
    Medal,
    Share,
    Download
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    // 반응형 데이터
    const progress = ref(0)
    const loadingMessage = ref('앱을 시작하는 중...')
    const showFeatures = ref(false)
    const appVersion = ref('1.0.0')
    
    // 기능 소개 데이터
    const features = ref([
      { icon: 'Qrcode', text: 'QR 코드 스캔', color: '#1976d2' },
      { icon: 'VideoPlay', text: '동영상 학습', color: '#43a047' },
      { icon: 'Medal', text: '수료증 발급', color: '#fb8c00' },
      { icon: 'Share', text: '간편한 공유', color: '#8e24aa' }
    ])
    
    // 로딩 단계들
    const loadingSteps = [
      { message: '앱을 시작하는 중...', duration: 800 },
      { message: '시스템을 확인하는 중...', duration: 600 },
      { message: 'Firebase를 연결하는 중...', duration: 1000 },
      { message: '사용자 정보를 확인하는 중...', duration: 800 },
      { message: '준비 완료!', duration: 400 }
    ]
    
    /**
     * 로딩 진행률 업데이트
     */
    const updateProgress = async () => {
      let currentProgress = 0
      
      for (let i = 0; i < loadingSteps.length; i++) {
        const step = loadingSteps[i]
        loadingMessage.value = step.message
        
        // 진행률 애니메이션
        const targetProgress = ((i + 1) / loadingSteps.length) * 100
        
        const progressInterval = setInterval(() => {
          if (currentProgress < targetProgress) {
            currentProgress += 2
            progress.value = Math.min(currentProgress, targetProgress)
          } else {
            clearInterval(progressInterval)
          }
        }, 20)
        
        // 다음 단계 전 대기
        await new Promise(resolve => setTimeout(resolve, step.duration))
        
        // 특정 단계에서 기능 소개 표시
        if (i === 2) {
          showFeatures.value = true
        }
      }
    }
    
    /**
     * 앱 버전 가져오기
     */
    const getAppVersion = async () => {
      try {
        if (nativeBridge.isNative) {
          const versionInfo = await nativeBridge.getAppVersion()
          appVersion.value = versionInfo.version || '1.0.0'
        } else {
          // 웹에서는 package.json에서 가져오거나 환경변수 사용
          appVersion.value = import.meta.env.VITE_APP_VERSION || '1.0.0'
        }
      } catch (error) {
        console.warn('앱 버전 가져오기 실패:', error)
      }
    }
    
    /**
     * 초기화 프로세스
     */
    const initializeApp = async () => {
      try {
        // 1. 앱 버전 정보 가져오기
        await getAppVersion()
        
        // 2. 로딩 진행률 시작
        const progressPromise = updateProgress()
        
        // 3. 실제 초기화 작업들
        await Promise.all([
          checkSystemRequirements(),
          initializeServices(),
          checkAuthState(),
          progressPromise
        ])
        
        // 4. Analytics 이벤트 로깅
        logAnalyticsEvent('app_launch', {
          version: appVersion.value,
          platform: nativeBridge.isNative ? 'mobile' : 'web'
        })
        
        // 5. 다음 화면으로 이동
        setTimeout(() => {
          navigateToMainScreen()
        }, 1000)
        
      } catch (error) {
        console.error('앱 초기화 실패:', error)
        handleInitError(error)
      }
    }
    
    /**
     * 시스템 요구사항 확인
     */
    const checkSystemRequirements = async () => {
      try {
        // 네트워크 연결 확인
        if (!navigator.onLine) {
          throw new Error('인터넷 연결을 확인해 주세요.')
        }
        
        // Native 환경에서 보안 검사
        if (nativeBridge.isNative) {
          const securityCheck = await nativeBridge.checkSecurity()
          if (!securityCheck.isSecure) {
            throw new Error('보안 검사 실패: ' + securityCheck.reason)
          }
        }
        
        // 브라우저 호환성 확인 (웹 환경)
        if (!nativeBridge.isNative) {
          if (!window.localStorage) {
            throw new Error('브라우저가 로컬 저장소를 지원하지 않습니다.')
          }
        }
        
      } catch (error) {
        console.error('시스템 요구사항 확인 실패:', error)
        throw error
      }
    }
    
    /**
     * 서비스 초기화
     */
    const initializeServices = async () => {
      try {
        // Firebase는 이미 main.js에서 초기화됨
        
        // Native Bridge 추가 설정
        if (nativeBridge.isNative) {
          // FCM 토큰 가져오기
          try {
            const fcmToken = await nativeBridge.getFCMToken()
            console.log('FCM 토큰:', fcmToken)
          } catch (error) {
            console.warn('FCM 토큰 가져오기 실패:', error)
          }
        }
        
      } catch (error) {
        console.error('서비스 초기화 실패:', error)
        throw error
      }
    }
    
    /**
     * 인증 상태 확인
     */
    const checkAuthState = async () => {
      try {
        await authStore.checkAuthState()
      } catch (error) {
        console.warn('인증 상태 확인 실패:', error)
        // 인증 실패는 치명적이지 않음 (로그인 화면으로 이동)
      }
    }
    
    /**
     * 메인 화면으로 이동
     */
    const navigateToMainScreen = () => {
      if (authStore.isAuthenticated) {
        router.replace('/home')
      } else {
        router.replace('/login')
      }
    }
    
    /**
     * 초기화 에러 처리
     */
    const handleInitError = (error) => {
      console.error('앱 초기화 에러:', error)
      
      ElMessage.error({
        title: '초기화 실패',
        message: error.message || '앱을 시작할 수 없습니다.',
        duration: 0,
        showClose: true
      })
      
      // 에러 로깅
      if (nativeBridge.isNative) {
        nativeBridge.logError(error)
      }
      
      // 재시도 버튼 표시
      setTimeout(() => {
        showRetryButton()
      }, 2000)
    }
    
    /**
     * 재시도 버튼 표시
     */
    const showRetryButton = () => {
      loadingMessage.value = '다시 시도해 주세요'
      // TODO: 재시도 버튼 UI 추가
    }
    
    /**
     * 앱 재시작
     */
    const retryApp = () => {
      window.location.reload()
    }
    
    // 라이프사이클
    onMounted(() => {
      // 1초 후 초기화 시작 (스플래시 화면 표시 시간)
      setTimeout(() => {
        initializeApp()
      }, 1000)
    })
    
    return {
      progress,
      loadingMessage,
      showFeatures,
      features,
      appVersion,
      retryApp
    }
  }
}
</script>

<style scoped>
.splash-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  z-index: 9999;
}

.background-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%);
  z-index: -1;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  max-width: 400px;
  width: 100%;
}

/* 로고 섹션 */
.logo-section {
  text-align: center;
  margin-bottom: 60px;
}

.logo-container {
  position: relative;
  display: inline-block;
  margin-bottom: 24px;
}

.logo-icon {
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  animation: logoFloat 3s ease-in-out infinite;
}

.qr-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.app-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.app-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 300;
}

/* 로딩 섹션 */
.loading-section {
  width: 100%;
  margin-bottom: 40px;
}

.loading-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 16px;
}

.loading-progress {
  height: 100%;
  background: linear-gradient(90deg, #ffffff 0%, #e3f2fd 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.loading-text {
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin: 0;
  font-weight: 400;
}

/* 기능 소개 */
.features-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.feature-item span {
  color: white;
  font-size: 12px;
  font-weight: 500;
}

/* 하단 정보 */
.footer-section {
  position: absolute;
  bottom: 40px;
  text-align: center;
}

.version-info {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin: 0 0 4px 0;
}

.copyright {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  margin: 0;
}

/* 모바일 최적화 */
@media (max-width: 480px) {
  .logo-icon {
    width: 100px;
    height: 100px;
  }
  
  .app-title {
    font-size: 28px;
  }
  
  .app-subtitle {
    font-size: 14px;
  }
  
  .features-section {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .feature-item {
    padding: 10px;
  }
}

/* 가로 모드 */
@media (orientation: landscape) and (max-height: 600px) {
  .splash-content {
    flex-direction: row;
    align-items: center;
    gap: 40px;
  }
  
  .logo-section {
    margin-bottom: 0;
    flex-shrink: 0;
  }
  
  .loading-section {
    margin-bottom: 0;
    flex: 1;
  }
  
  .features-section {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .footer-section {
    bottom: 20px;
  }
}

/* 다크모드 지원 */
@media (prefers-color-scheme: dark) {
  .background-gradient {
    background: linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%);
  }
}

/* 애니메이션 감소 설정 */
@media (prefers-reduced-motion: reduce) {
  .logo-icon {
    animation: none;
  }
  
  .features-section {
    animation: none;
  }
  
  .loading-progress {
    transition: none;
  }
}
</style>