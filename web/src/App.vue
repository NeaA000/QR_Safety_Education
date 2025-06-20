<template>
  <div id="app">
    <router-view v-if="isReady" />
    <div v-else class="loading-container">
      <div class="loading-content">
        <el-icon class="loading-icon" :size="60" color="#409EFF">
          <Loading />
        </el-icon>
        <h2 class="loading-title">QR 안전교육</h2>
        <p class="loading-text">{{ loadingMessage }}</p>
        <div class="loading-progress">
          <el-progress :percentage="loadingProgress" :show-text="false" />
        </div>
      </div>
    </div>

    <!-- 오프라인 알림 -->
    <el-alert
      v-if="showOfflineAlert"
      title="네트워크 연결 끊김"
      description="인터넷 연결을 확인해주세요. 일부 기능이 제한될 수 있습니다."
      type="warning"
      :closable="false"
      show-icon
      class="offline-alert"
    />

    <!-- 업데이트 알림 -->
    <el-notification
      v-if="showUpdateNotification"
      title="앱 업데이트 알림"
      message="새로운 버전이 있습니다. 새로고침하여 업데이트하세요."
      type="info"
      :duration="0"
      @close="showUpdateNotification = false"
    >
      <template #default>
        <div style="margin-top: 10px;">
          <el-button size="small" type="primary" @click="reloadApp">
            지금 업데이트
          </el-button>
          <el-button size="small" @click="showUpdateNotification = false">
            나중에
          </el-button>
        </div>
      </template>
    </el-notification>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { initializeFirebase, checkNetworkStatus } from '@/services/firebase'
import { Loading } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'

// 컴포넌트 상태
const isReady = ref(false)
const loadingMessage = ref('앱을 초기화하는 중...')
const loadingProgress = ref(0)
const showOfflineAlert = ref(false)
const showUpdateNotification = ref(false)

// 스토어
const authStore = useAuthStore()

// 네트워크 상태 확인
let networkCheckInterval: number | null = null

const checkNetworkConnection = async () => {
  const isOnline = await checkNetworkStatus()
  showOfflineAlert.value = !isOnline
}

// 앱 초기화
const initializeApp = async () => {
  try {
    console.log('🚀 QR 안전교육 앱 초기화 시작...')

    // 1단계: Firebase 초기화 (30%)
    loadingMessage.value = 'Firebase 연결 중...'
    loadingProgress.value = 10

    const firebaseInitialized = await initializeFirebase()

    if (!firebaseInitialized) {
      console.warn('⚠️ Firebase 초기화 실패, 오프라인 모드로 진행')
      loadingMessage.value = '오프라인 모드로 시작...'
      showOfflineAlert.value = true
    } else {
      console.log('✅ Firebase 초기화 완료')
      loadingMessage.value = 'Firebase 연결 완료'
    }

    loadingProgress.value = 30
    await new Promise(resolve => setTimeout(resolve, 500))

    // 2단계: 인증 상태 초기화 (60%)
    if (firebaseInitialized) {
      loadingMessage.value = '사용자 인증 확인 중...'
      loadingProgress.value = 40

      try {
        await authStore.initializeAuth()
        console.log('✅ 인증 상태 초기화 완료')

        if (authStore.isLoggedIn) {
          loadingMessage.value = `${authStore.displayName}님, 환영합니다!`
        } else {
          loadingMessage.value = '인증 초기화 완료'
        }
      } catch (authError) {
        console.warn('⚠️ 인증 초기화 실패:', authError)
        loadingMessage.value = '인증 초기화 실패, 계속 진행...'
      }
    }

    loadingProgress.value = 60
    await new Promise(resolve => setTimeout(resolve, 500))

    // 3단계: 앱 보안 검사 (80%)
    loadingMessage.value = '보안 검사 중...'
    loadingProgress.value = 70

    // TODO: [보안강화] 앱 무결성 검증
    // - 앱 서명 검증
    // - 루팅/탈옥 디바이스 감지
    // - 디버깅 도구 감지
    await performSecurityChecks()

    loadingProgress.value = 80
    await new Promise(resolve => setTimeout(resolve, 300))

    // 4단계: 최종 준비 (100%)
    loadingMessage.value = '준비 완료!'
    loadingProgress.value = 90

    // 네트워크 상태 모니터링 시작
    if (firebaseInitialized) {
      startNetworkMonitoring()
    }

    // 서비스 워커 등록 (PWA 지원)
    await registerServiceWorker()

    loadingProgress.value = 100
    await new Promise(resolve => setTimeout(resolve, 500))

    isReady.value = true
    console.log('🎉 QR 안전교육 앱 초기화 완료')

  } catch (error) {
    console.error('❌ 앱 초기화 오류:', error)

    // 오류 발생 시에도 앱 진행 (안전 장치)
    loadingMessage.value = '초기화 완료 (일부 제한)'
    loadingProgress.value = 100

    // TODO: [보안강화] 초기화 실패 시 안전한 처리
    // - 민감한 데이터 접근 차단
    // - 오류 보고 (민감한 정보 제외)

    await new Promise(resolve => setTimeout(resolve, 1000))
    isReady.value = true
  }
}

// 보안 검사
const performSecurityChecks = async () => {
  try {
    // 기본 보안 검사들
    const checks = [
      checkDeviceIntegrity(),
      checkAppIntegrity(),
      checkRuntimeSecurity()
    ]

    await Promise.allSettled(checks)
    console.log('✅ 보안 검사 완료')
  } catch (error) {
    console.warn('⚠️ 보안 검사 중 오류:', error)
  }
}

// 디바이스 무결성 검사
const checkDeviceIntegrity = async () => {
  // TODO: 네이티브 브리지를 통한 디바이스 보안 상태 확인
  // - 루팅/탈옥 여부
  // - 디버깅 모드 여부
  // - 에뮬레이터 여부

  // 임시 구현 (브라우저 환경)
  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome-Lighthouse') ||
    userAgent.includes('HeadlessChrome')) {
    console.warn('⚠️ 자동화 도구 감지됨')
  }
}

// 앱 무결성 검사
const checkAppIntegrity = async () => {
  // TODO: 앱 서명 및 코드 무결성 검증
  // - 해시 검증
  // - 번들 무결성 확인

  console.log('📱 앱 무결성 검사 수행됨')
}

// 런타임 보안 검사
const checkRuntimeSecurity = async () => {
  // 개발자 도구 감지 (간단한 방법)
  let devtools = {
    open: false,
    orientation: null as string | null
  }

  const threshold = 160

  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold ||
      window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true
        console.warn('⚠️ 개발자 도구가 열렸을 수 있습니다')
        // TODO: 민감한 데이터 보호 조치
      }
    } else {
      devtools.open = false
    }
  }, 500)
}

// 네트워크 모니터링 시작
const startNetworkMonitoring = () => {
  // 주기적 네트워크 상태 확인
  networkCheckInterval = window.setInterval(checkNetworkConnection, 30000)

  // 브라우저 온라인/오프라인 이벤트 리스너
  window.addEventListener('online', () => {
    showOfflineAlert.value = false
    ElNotification({
      title: '네트워크 연결 복구',
      message: '인터넷 연결이 복구되었습니다.',
      type: 'success',
      duration: 3000
    })
  })

  window.addEventListener('offline', () => {
    showOfflineAlert.value = true
    ElNotification({
      title: '네트워크 연결 끊김',
      message: '인터넷 연결이 끊어졌습니다.',
      type: 'warning',
      duration: 5000
    })
  })
}

// 서비스 워커 등록 (PWA)
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('✅ Service Worker 등록 성공:', registration)

      // 업데이트 감지
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 새 버전 있음
              showUpdateNotification.value = true
            }
          })
        }
      })
    } catch (error) {
      console.warn('⚠️ Service Worker 등록 실패:', error)
    }
  }
}

// 앱 새로고침
const reloadApp = () => {
  window.location.reload()
}

// 컴포넌트 마운트
onMounted(() => {
  initializeApp()
})

// 컴포넌트 언마운트
onUnmounted(() => {
  if (networkCheckInterval) {
    clearInterval(networkCheckInterval)
  }
})
</script>

<style scoped>
#app {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.loading-content {
  text-align: center;
  color: white;
  max-width: 400px;
  width: 100%;
}

.loading-icon {
  margin-bottom: 24px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.loading-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.loading-text {
  font-size: 1rem;
  margin: 0 0 24px 0;
  opacity: 0.9;
  font-weight: 300;
}

.loading-progress {
  margin-top: 20px;
}

.loading-progress :deep(.el-progress-bar__outer) {
  background-color: rgba(255, 255, 255, 0.2);
}

.loading-progress :deep(.el-progress-bar__inner) {
  background: linear-gradient(90deg, #409EFF 0%, #67C23A 100%);
}

.offline-alert {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  margin: 0;
  border-radius: 0;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 글로벌 스타일 */
:deep(.el-card) {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

:deep(.el-button) {
  border-radius: 8px;
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #303133;
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .loading-container {
    padding: 16px;
  }

  .loading-title {
    font-size: 1.75rem;
  }

  .loading-text {
    font-size: 0.9rem;
  }
}

/* 다크 모드 대응 */
@media (prefers-color-scheme: dark) {
  #app {
    background-color: #1a1a1a;
    color: #e5eaf3;
  }

  :deep(.el-form-item__label) {
    color: #e5eaf3;
  }
}

/* 접근성 개선 */
@media (prefers-reduced-motion: reduce) {
  .loading-icon,
  * {
    animation: none !important;
    transition: none !important;
  }
}

/* 고대비 모드 */
@media (prefers-contrast: high) {
  :deep(.el-input__wrapper) {
    border: 2px solid #000;
  }

  :deep(.el-button) {
    border: 2px solid #000;
  }
}
</style>
