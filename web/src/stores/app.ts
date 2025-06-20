// src/stores/app.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AppConfig {
  version: string
  buildTime: string
  environment: 'development' | 'staging' | 'production'
  features: {
    qrScanner: boolean
    offlineMode: boolean
    pushNotifications: boolean
    analytics: boolean
  }
}

export interface ToastMessage {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  duration?: number
  timestamp: number
}

// 네이티브 브리지 타입 정의
declare global {
  interface Window {
    isNativeApp?: boolean
    Android?: {
      requestPermission: (permission: string) => Promise<boolean>
      showToast: (message: string) => void
      getDeviceInfo: () => string
      scanQR: () => Promise<string>
      getLocation: () => string
    }
    webkit?: {
      messageHandlers?: {
        requestPermission: {
          postMessage: (permission: string) => void
        }
        showToast: {
          postMessage: (message: string) => void
        }
      }
    }
  }
}

export const useAppStore = defineStore('app', () => {
  // 상태
  const isLoading = ref(false)
  const isOnline = ref(navigator.onLine)
  const isNativeApp = ref(window.isNativeApp || false)
  const toasts = ref<ToastMessage[]>([])
  const config = ref<AppConfig>({
    version: '1.0.0',
    buildTime: new Date().toISOString(),
    environment: import.meta.env.MODE as 'development' | 'staging' | 'production',
    features: {
      qrScanner: true,
      offlineMode: false,
      pushNotifications: false,
      analytics: import.meta.env.PROD
    }
  })

  // 계산된 속성
  const isDevelopment = computed(() => config.value.environment === 'development')
  const isProduction = computed(() => config.value.environment === 'production')
  const canUseQRScanner = computed(() => config.value.features.qrScanner && isNativeApp.value)

  // 액션
  const initialize = async (): Promise<void> => {
    try {
      isLoading.value = true

      // 온라인 상태 감지
      window.addEventListener('online', () => {
        isOnline.value = true
        showToast('인터넷에 연결되었습니다.', 'success')
      })

      window.addEventListener('offline', () => {
        isOnline.value = false
        showToast('인터넷 연결이 끊어졌습니다.', 'warning')
      })

      // 네이티브 앱 설정
      if (isNativeApp.value) {
        await initializeNativeFeatures()
      }

      console.log('🚀 앱 초기화 완료')

    } catch (error) {
      console.error('앱 초기화 오류:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const initializeNativeFeatures = async (): Promise<void> => {
    try {
      // 네이티브 브리지 설정
      if (window.Android) {
        console.log('Android 네이티브 기능 초기화')

        // 권한 확인
        const cameraPermission = await window.Android.requestPermission('CAMERA')
        if (!cameraPermission) {
          config.value.features.qrScanner = false
        }
      }

      if (window.webkit) {
        console.log('iOS 네이티브 기능 초기화')
      }

    } catch (error) {
      console.error('네이티브 기능 초기화 오류:', error)
    }
  }

  const showToast = (
    message: string,
    type: ToastMessage['type'] = 'info',
    duration: number = 3000
  ): string => {
    const id = Date.now().toString()
    const toast: ToastMessage = {
      id,
      type,
      message,
      duration,
      timestamp: Date.now()
    }

    toasts.value.push(toast)

    // 자동 제거
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    // 네이티브 앱에도 토스트 표시
    if (isNativeApp.value && window.Android) {
      window.Android.showToast(message)
    }

    return id
  }

  const removeToast = (id: string): void => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clearToasts = (): void => {
    toasts.value = []
  }

  const setLoading = (loading: boolean): void => {
    isLoading.value = loading
  }

  const updateConfig = (updates: Partial<AppConfig>): void => {
    config.value = { ...config.value, ...updates }
  }

  const getDeviceInfo = (): object => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      isNativeApp: isNativeApp.value,
      timestamp: new Date().toISOString()
    }

    // 네이티브 앱에서 추가 정보
    if (isNativeApp.value && window.Android) {
      try {
        const nativeInfo = JSON.parse(window.Android.getDeviceInfo())
        Object.assign(info, { native: nativeInfo })
      } catch (error) {
        console.error('네이티브 디바이스 정보 가져오기 실패:', error)
      }
    }

    return info
  }

  const logEvent = (eventName: string, eventData?: object): void => {
    if (!config.value.features.analytics) return

    const eventInfo = {
      name: eventName,
      data: eventData,
      timestamp: new Date().toISOString(),
      device: getDeviceInfo()
    }

    console.log('📊 Analytics Event:', eventInfo)

    // TODO: Firebase Analytics로 전송
    // import { analytics } from '@/services/firebase'
    // import { logEvent as firebaseLogEvent } from 'firebase/analytics'
    // firebaseLogEvent(analytics, eventName, eventData)
  }

  return {
    // 상태
    isLoading,
    isOnline,
    isNativeApp,
    toasts,
    config,

    // 계산된 속성
    isDevelopment,
    isProduction,
    canUseQRScanner,

    // 액션
    initialize,
    showToast,
    removeToast,
    clearToasts,
    setLoading,
    updateConfig,
    getDeviceInfo,
    logEvent
  }
})
