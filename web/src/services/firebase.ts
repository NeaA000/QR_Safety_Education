import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { getAnalytics, logEvent } from 'firebase/analytics'
import { getRemoteConfig } from 'firebase/remote-config'

// Firebase 설정 (환경변수 또는 하드코딩)
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "qrjbsafetyeducation.firebaseapp.com",
  projectId: "qrjbsafetyeducation",
  storageBucket: "qrjbsafetyeducation.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
}

// Firebase 앱 인스턴스
let app = null
let auth = null
let db = null
let storage = null
let messaging = null
let analytics = null
let remoteConfig = null

// 개발 환경 설정
const isDevelopment = import.meta.env.MODE === 'development'

/**
 * Firebase 초기화
 */
export async function initializeFirebase() {
  try {
    console.log('🔥 Firebase 초기화 시작...')
    
    // Firebase 앱 초기화
    app = initializeApp(firebaseConfig)
    console.log('✅ Firebase 앱 초기화 완료')
    
    // Authentication 초기화
    auth = getAuth(app)
    if (isDevelopment) {
      // 개발 환경에서는 에뮬레이터 사용 (선택적)
      // connectAuthEmulator(auth, 'http://localhost:9099')
    }
    console.log('✅ Firebase Auth 초기화 완료')
    
    // Firestore 초기화
    db = getFirestore(app)
    if (isDevelopment) {
      // 개발 환경에서는 에뮬레이터 사용 (선택적)
      // connectFirestoreEmulator(db, 'localhost', 8080)
    }
    console.log('✅ Firestore 초기화 완료')
    
    // Storage 초기화
    storage = getStorage(app)
    if (isDevelopment) {
      // 개발 환경에서는 에뮬레이터 사용 (선택적)
      // connectStorageEmulator(storage, 'localhost', 9199)
    }
    console.log('✅ Firebase Storage 초기화 완료')
    
    // Analytics 초기화 (웹에서만)
    if (typeof window !== 'undefined' && !window.isNativeApp) {
      try {
        analytics = getAnalytics(app)
        console.log('✅ Firebase Analytics 초기화 완료')
      } catch (error) {
        console.warn('⚠️ Analytics 초기화 실패:', error.message)
      }
    }
    
    // Remote Config 초기화
    try {
      remoteConfig = getRemoteConfig(app)
      remoteConfig.settings.minimumFetchIntervalMillis = isDevelopment ? 0 : 3600000 // 개발: 즉시, 프로덕션: 1시간
      
      // 기본값 설정
      const defaultConfig = {
        app_version: '1.0.0',
        maintenance_mode: false,
        force_update_required: false,
        max_video_quality: '720p',
        enable_debug_logs: isDevelopment
      }
      
      await remoteConfig.setDefaults(defaultConfig)
      await remoteConfig.fetchAndActivate()
      console.log('✅ Remote Config 초기화 완료')
    } catch (error) {
      console.warn('⚠️ Remote Config 초기화 실패:', error.message)
    }
    
    // Messaging 초기화 (서비스 워커 필요)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        messaging = getMessaging(app)
        
        // 토큰 요청 (사용자 권한 필요)
        if (window.isNativeApp) {
          // Native 앱에서는 Android/iOS가 토큰 관리
          console.log('📱 Native 앱: FCM 토큰은 네이티브에서 관리')
        } else {
          // 웹에서는 직접 토큰 관리
          await requestNotificationPermission()
        }
        
        console.log('✅ Firebase Messaging 초기화 완료')
      } catch (error) {
        console.warn('⚠️ Messaging 초기화 실패:', error.message)
      }
    }
    
    console.log('🎉 Firebase 전체 초기화 완료!')
    return true
    
  } catch (error) {
    console.error('❌ Firebase 초기화 실패:', error)
    throw error
  }
}

/**
 * 알림 권한 요청 (웹용)
 */
async function requestNotificationPermission() {
  try {
    if (!messaging) return null
    
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'your-vapid-key-here' // Firebase 콘솔에서 생성
      })
      
      if (token) {
        console.log('📱 FCM 토큰:', token)
        // 서버에 토큰 전송
        await saveTokenToServer(token)
        return token
      }
    } else {
      console.log('❌ 알림 권한이 거부됨')
    }
  } catch (error) {
    console.error('알림 권한 요청 실패:', error)
  }
  return null
}

/**
 * 서버에 FCM 토큰 저장
 */
async function saveTokenToServer(token) {
  try {
    // TODO: 서버 API 호출하여 토큰 저장
    console.log('💾 FCM 토큰 서버 저장:', token)
  } catch (error) {
    console.error('토큰 서버 저장 실패:', error)
  }
}

/**
 * 포그라운드 메시지 수신 (웹용)
 */
export function setupForegroundMessaging() {
  if (!messaging) return
  
  onMessage(messaging, (payload) => {
    console.log('📩 포그라운드 메시지 수신:', payload)
    
    // 커스텀 알림 표시
    showCustomNotification(payload)
  })
}

/**
 * 커스텀 알림 표시
 */
function showCustomNotification(payload) {
  const { notification, data } = payload
  
  // Element Plus 메시지로 표시
  if (window.ElMessage) {
    window.ElMessage({
      title: notification?.title || '알림',
      message: notification?.body || '새로운 메시지가 있습니다.',
      type: 'info',
      duration: 5000,
      showClose: true
    })
  }
  
  // 브라우저 네이티브 알림
  if (Notification.permission === 'granted') {
    const notif = new Notification(notification?.title || '알림', {
      body: notification?.body,
      icon: notification?.icon || '/favicon.ico',
      data: data
    })
    
    notif.onclick = () => {
      // 알림 클릭 시 동작
      if (data?.url) {
        window.open(data.url, '_blank')
      }
      notif.close()
    }
  }
}

/**
 * Analytics 이벤트 로깅
 */
export function logAnalyticsEvent(eventName, parameters = {}) {
  try {
    if (analytics) {
      logEvent(analytics, eventName, parameters)
    }
    
    // Native 앱에서는 네이티브 Analytics 사용
    if (window.isNativeApp && window.AndroidBridge?.logAnalyticsEvent) {
      window.AndroidBridge.logAnalyticsEvent(eventName, JSON.stringify(parameters))
    }
  } catch (error) {
    console.warn('Analytics 이벤트 로깅 실패:', error)
  }
}

/**
 * Remote Config 값 가져오기
 */
export function getRemoteConfigValue(key, defaultValue = null) {
  try {
    if (remoteConfig) {
      const value = remoteConfig.getValue(key)
      return value.asString() || defaultValue
    }
  } catch (error) {
    console.warn(`Remote Config 값 가져오기 실패 (${key}):`, error)
  }
  return defaultValue
}

/**
 * Remote Config 불린 값 가져오기
 */
export function getRemoteConfigBoolean(key, defaultValue = false) {
  try {
    if (remoteConfig) {
      const value = remoteConfig.getValue(key)
      return value.asBoolean()
    }
  } catch (error) {
    console.warn(`Remote Config 불린 값 가져오기 실패 (${key}):`, error)
  }
  return defaultValue
}

/**
 * Remote Config 숫자 값 가져오기
 */
export function getRemoteConfigNumber(key, defaultValue = 0) {
  try {
    if (remoteConfig) {
      const value = remoteConfig.getValue(key)
      return value.asNumber()
    }
  } catch (error) {
    console.warn(`Remote Config 숫자 값 가져오기 실패 (${key}):`, error)
  }
  return defaultValue
}

// Firebase 인스턴스 내보내기
export { app, auth, db, storage, messaging, analytics, remoteConfig }

// 기본 내보내기
export default {
  initializeFirebase,
  setupForegroundMessaging,
  logAnalyticsEvent,
  getRemoteConfigValue,
  getRemoteConfigBoolean,
  getRemoteConfigNumber,
  app,
  auth,
  db,
  storage,
  messaging,
  analytics,
  remoteConfig
}