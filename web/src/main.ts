// web/src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
import router from './router'
import { initializeFirebase } from './services/firebase'
import { useAuthStore } from './stores/auth'

// 글로벌 스타일
import './assets/styles/main.css'

// 앱 생성
const app = createApp(App)
const pinia = createPinia()

// 플러그인 등록
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// Firebase 초기화 및 앱 시작
const initializeApp = async () => {
  try {
    console.log('🚀 앱 초기화 시작...')

    // Firebase 초기화
    const firebaseInitialized = await initializeFirebase()
    if (!firebaseInitialized) {
      console.error('❌ Firebase 초기화 실패')
      return
    }

    // 인증 스토어 초기화
    const authStore = useAuthStore()
    await authStore.initializeAuth()

    // 앱 마운트
    app.mount('#app')

    console.log('✅ 앱 초기화 완료')
  } catch (error) {
    console.error('❌ 앱 초기화 중 오류 발생:', error)

    // 오류 발생 시에도 앱 마운트 (기본 기능은 동작하도록)
    app.mount('#app')
  }
}

// DOM이 준비되면 앱 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  initializeApp()
}

// 전역 에러 핸들러
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue 에러:', err, info)

  // 프로덕션 환경에서는 에러 리포팅 서비스로 전송
  if (import.meta.env.PROD) {
    // 예: Sentry, LogRocket 등
    console.log('프로덕션 에러 리포팅:', err)
  }
}

// 성능 모니터링 (개발 환경)
if (import.meta.env.DEV) {
  app.config.performance = true
}
