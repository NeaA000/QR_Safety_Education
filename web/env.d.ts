/// <reference types="vite/client" />

// Vue 컴포넌트 타입 정의 (Vue 3 최신 방식)
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, any>
  export default component
}

// Vite 환경변수 타입 정의
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID: string

  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string

  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT: string

  readonly VITE_USE_FIREBASE_EMULATOR: string
  readonly VITE_ENABLE_DEBUG: string
  readonly VITE_SHOW_ERROR_DETAILS: string

  readonly VITE_ENABLE_ENCRYPTION: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_MAX_LOGIN_ATTEMPTS: string
  readonly VITE_LOGIN_BLOCK_DURATION: string

  readonly VITE_QR_EXPIRY_TIME: string
  readonly VITE_QR_SECRET_KEY: string

  readonly VITE_GA_TRACKING_ID?: string
  readonly VITE_ERROR_REPORTING_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 전역 Window 객체 확장 (하이브리드 앱 네이티브 브릿지)
declare global {
  interface Window {
    // Android 네이티브 브릿지
    Android?: {
      // 페이지 이벤트
      onPageChanged?: (path: string, title: string) => void
      trackPageView?: (path: string, title: string) => void

      // QR 스캔
      startQRScan?: () => void
      onQRResult?: (result: string) => void

      // 파일 관리
      saveFile?: (filename: string, data: string) => void
      openFile?: (filename: string) => void
      shareFile?: (filename: string, title?: string) => void

      // 알림
      showNotification?: (title: string, message: string) => void

      // 앱 상태
      getAppInfo?: () => string
      exitApp?: () => void

      // 생체 인증
      startBiometricAuth?: (reason: string) => void
      onBiometricResult?: (success: boolean) => void

      // 카메라/갤러리
      openCamera?: () => void
      openGallery?: () => void
      onImageResult?: (imageBase64: string) => void

      // 네트워크 상태
      getNetworkStatus?: () => boolean
      onNetworkChanged?: (isConnected: boolean) => void

      // 저장소
      setSecureStorage?: (key: string, value: string) => void
      getSecureStorage?: (key: string) => string | null
      removeSecureStorage?: (key: string) => void

      // 진동
      vibrate?: (milliseconds?: number) => void

      // 로그
      logDebug?: (message: string) => void
      logError?: (message: string) => void
    }

    // iOS 네이티브 브릿지 (WebKit)
    webkit?: {
      messageHandlers?: {
        ios?: {
          postMessage?: (message: any) => void
        }
      }
    }

    // PWA 관련
    deferredPrompt?: any

    // Google Analytics
    gtag?: (...args: any[]) => void

    // Firebase Performance Monitoring
    firebase?: any
  }

  // 전역 함수들
  var gtag: ((...args: any[]) => void) | undefined
}

// CSS 모듈 타입 정의
declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.module.scss' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.module.sass' {
  const classes: { [key: string]: string }
  export default classes
}

// 이미지 파일 타입 정의
declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '*.ico' {
  const src: string
  export default src
}

// JSON 파일 타입 정의
declare module '*.json' {
  const value: any
  export default value
}

// 텍스트 파일 타입 정의
declare module '*.txt' {
  const content: string
  export default content
}

// Web Workers
declare module '*?worker' {
  const workerConstructor: {
    new (): Worker
  }
  export default workerConstructor
}

declare module '*?worker&inline' {
  const workerConstructor: {
    new (): Worker
  }
  export default workerConstructor
}

// Raw 파일 import
declare module '*?raw' {
  const content: string
  export default content
}

declare module '*?url' {
  const url: string
  export default url
}

// Node.js 전역 변수 (빌드 시에만 사용)
declare var process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test'
    [key: string]: string | undefined
  }
}

export {}
