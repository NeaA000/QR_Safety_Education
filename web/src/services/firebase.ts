// src/services/firebase.ts - 안전한 TypeScript 버전
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Firebase 설정 (환경변수 또는 기본값)
const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "qr-safety-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "qr-safety-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "qr-safety-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:demo",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEMO"
}

// Firebase 모듈들 (동적 임포트로 안전하게 로드)
let app: any = null
let auth: any = null
let db: any = null
let storage: any = null
let analytics: any = null

/**
 * Firebase 초기화 (안전한 버전)
 */
export async function initializeFirebase(): Promise<boolean> {
  try {
    console.log('🔥 Firebase 초기화 시작...')
    
    // Firebase 모듈들을 동적으로 임포트
    const { initializeApp } = await import('firebase/app')
    const { getAuth } = await import('firebase/auth')
    const { getFirestore } = await import('firebase/firestore')
    const { getStorage } = await import('firebase/storage')
    
    // Firebase 앱 초기화
    app = initializeApp(firebaseConfig)
    console.log('✅ Firebase 앱 초기화 완료')
    
    // 서비스들 초기화
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
    
    console.log('✅ Firebase 서비스들 초기화 완료')
    
    // Analytics는 프로덕션에서만
    if (import.meta.env.PROD && typeof window !== 'undefined') {
      try {
        const { getAnalytics } = await import('firebase/analytics')
        analytics = getAnalytics(app)
        console.log('✅ Firebase Analytics 초기화 완료')
      } catch (error) {
        console.warn('⚠️ Analytics 초기화 실패:', error)
      }
    }
    
    console.log('🎉 Firebase 전체 초기화 완료!')
    return true
    
  } catch (error) {
    console.error('❌ Firebase 초기화 실패:', error)
    console.warn('⚠️ Firebase 없이 계속 진행합니다.')
    return false
  }
}

/**
 * Analytics 이벤트 로깅
 */
export function logAnalyticsEvent(eventName: string, parameters: Record<string, any> = {}): void {
  try {
    if (analytics && import.meta.env.PROD) {
      // 동적 임포트로 logEvent 사용
      import('firebase/analytics').then(({ logEvent }) => {
        logEvent(analytics, eventName, parameters)
      })
    } else {
      console.log('📊 Analytics Event (Demo):', eventName, parameters)
    }
  } catch (error) {
    console.warn('Analytics 이벤트 로깅 실패:', error)
  }
}

// 개발 환경에서 자동 초기화
if (import.meta.env.DEV) {
  initializeFirebase().catch(console.error)
}

// Firebase 인스턴스 내보내기
export { app, auth, db, storage, analytics }

// 기본 내보내기
export default {
  initializeFirebase,
  logAnalyticsEvent,
  app,
  auth,
  db,
  storage,
  analytics
}