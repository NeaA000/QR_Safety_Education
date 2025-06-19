// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

// CSS imports
import 'element-plus/dist/index.css'
import './assets/styles/main.css'

// Native Bridge 타입 정의
declare global {
  interface Window {
    // Android 네이티브 브릿지
    Android?: {
      // QR 스캐너
      scanQR: () => string;
      
      // 파일 관리
      saveFile: (data: string, filename: string) => void;
      downloadFile: (url: string, filename: string) => string;
      openFile: (path: string) => boolean;
      
      // UI 헬퍼
      showToast: (message: string) => void;
      showAlert: (title: string, message: string) => boolean;
      
      // 디바이스 정보
      getDeviceInfo: () => string;
      getAppVersion: () => string;
      
      // 권한 관리
      requestPermission: (permission: string) => boolean;
      checkPermission: (permission: string) => boolean;
      requestCameraPermission: () => boolean;
      
      // 네트워크
      checkNetworkStatus: () => string;
      
      // FCM
      getFCMToken: () => string;
    };
    
    // iOS 네이티브 브릿지 (향후 확장용)
    webkit?: {
      messageHandlers: {
        [key: string]: {
          postMessage: (message: any) => void;
        };
      };
    };
    
    // 네이티브 앱 여부
    isNativeApp?: boolean;
    
    // JavaScript 콜백 함수들
    onQRScanned?: (data: string) => void;
    onDownloadProgress?: (percent: number) => void;
    onDownloadComplete?: (path: string) => void;
    onPermissionResult?: (granted: boolean) => void;
    onNetworkChanged?: (status: string) => void;
  }
}

// 앱 인스턴스 생성
const app = createApp(App)

// Pinia 스토어 설정
const pinia = createPinia()
app.use(pinia)

// Vue Router 설정
app.use(router)

// Element Plus 설정
app.use(ElementPlus, {
  // Element Plus 글로벌 설정
  size: 'default',
  zIndex: 3000,
})

// Element Plus 아이콘 전역 등록
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 글로벌 속성 설정
app.config.globalProperties.$isNativeApp = window.isNativeApp ?? false

// 개발 환경 설정
if (import.meta.env.DEV) {
  // 성능 추적 활성화
  app.config.performance = true
  
  // 개발용 네이티브 브릿지 모의 객체
  if (!window.Android && !window.webkit) {
    window.Android = {
      scanQR: () => {
        console.log('[Dev] QR 스캔 시뮬레이션')
        // 테스트용 QR 데이터 반환
        return JSON.stringify({
          type: 'lecture',
          lectureId: 'TEST_001',
          title: '테스트 안전교육',
          duration: 30
        })
      },
      saveFile: (data: string, filename: string) => {
        console.log('[Dev] 파일 저장:', filename, data.substring(0, 100) + '...')
      },
      showToast: (message: string) => {
        console.log('[Dev] Toast:', message)
      },
      getDeviceInfo: () => JSON.stringify({
        platform: 'android',
        version: '13',
        model: 'Emulator',
        isVirtual: true
      }),
      requestPermission: (permission: string) => {
        console.log('[Dev] 권한 요청:', permission)
        return true
      },
      checkPermission: (permission: string) => {
        console.log('[Dev] 권한 확인:', permission)
        return true
      },
      requestCameraPermission: () => {
        console.log('[Dev] 카메라 권한 요청')
        return true
      },
      downloadFile: (url: string, filename: string) => {
        console.log('[Dev] 파일 다운로드:', url, filename)
        return '/mock/download/' + filename
      },
      openFile: (path: string) => {
        console.log('[Dev] 파일 열기:', path)
        return true
      },
      showAlert: (title: string, message: string) => {
        console.log('[Dev] Alert:', title, message)
        alert(`${title}\n\n${message}`)
        return true
      },
      getAppVersion: () => JSON.stringify({
        version: '1.0.0',
        buildNumber: '1',
        packageName: 'com.jbsqr.safety'
      }),
      checkNetworkStatus: () => JSON.stringify({
        isConnected: true,
        type: 'wifi',
        strength: 4
      }),
      getFCMToken: () => 'dev-fcm-token-' + Date.now()
    }
    
    // 네이티브 앱 플래그 설정
    window.isNativeApp = true
  }
}

// 전역 에러 핸들러
app.config.errorHandler = (error, instance, info) => {
  console.error('❌ Vue 에러 발생')
  console.error('에러:', error)
  console.error('컴포넌트:', instance?.$options.name || '알 수 없음')
  console.error('정보:', info)
  
  // 프로덕션 환경에서는 에러 보고 서비스로 전송
  if (import.meta.env.PROD) {
    // TODO: Sentry, LogRocket 등으로 에러 전송
  }
}

// 전역 경고 핸들러
app.config.warnHandler = (msg, instance, trace) => {
  if (import.meta.env.DEV) {
    console.warn('⚠️ Vue 경고:', msg)
    console.warn('추적:', trace)
  }
}

// 앱 마운트
app.mount('#app')

// 개발 환경 로그
if (import.meta.env.DEV) {
  console.log('🚀 QR 안전교육 앱 시작됨')
  console.log('📱 네이티브 앱 여부:', window.isNativeApp ?? false)
  console.log('🌐 환경:', import.meta.env.MODE)
  console.log('🔧 Vue 버전:', app.version)
  
  // 네이티브 브릿지 확인
  if (window.Android) {
    console.log('✅ Android 브릿지 연결됨')
  } else if (window.webkit) {
    console.log('✅ iOS 브릿지 연결됨')
  } else {
    console.log('⚠️ 네이티브 브릿지 없음 (웹 모드)')
  }
}