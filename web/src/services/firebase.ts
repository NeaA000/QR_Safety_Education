// src/services/firebase.ts - 보안 강화가 필요한 버전 (수정됨)
import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import type { FirebaseStorage } from 'firebase/storage'
import type { Analytics } from 'firebase/analytics'

// TODO: [보안강화-P1] API 키 노출 방지
// - 환경변수를 암호화하여 저장
// - ProGuard/R8으로 난독화
// - Firebase App Check 구현으로 앱 무결성 검증
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "qr-safety-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "qr-safety-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "qr-safety-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:demo",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEMO"
}

// Firebase 인스턴스
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null
let analytics: Analytics | null = null

// 초기화 상태
let isInitialized = false
let initializationPromise: Promise<boolean> | null = null

/**
 * Firebase 초기화 (싱글톤 패턴)
 */
export async function initializeFirebase(): Promise<boolean> {
  // 이미 초기화 중이면 기존 Promise 반환
  if (initializationPromise) {
    return initializationPromise
  }

  // 이미 초기화되었으면 true 반환
  if (isInitialized) {
    return true
  }

  initializationPromise = doInitialize()
  return initializationPromise
}

async function doInitialize(): Promise<boolean> {
  try {
    console.log('🔥 Firebase 초기화 시작...')
    
    // TODO: [보안강화-P2] API 호출 전 네트워크 보안 검증
    // - HTTPS 강제 확인
    // - 인증서 피닝 구현 (프로덕션 환경)
    if (import.meta.env.PROD && !window.location.protocol.includes('https')) {
      console.error('❌ HTTPS가 필요합니다!')
      // TODO: HTTP에서 HTTPS로 강제 리다이렉트
      window.location.protocol = 'https:'
    }
    
    // Firebase 모듈 동적 임포트
    const { initializeApp } = await import('firebase/app')
    const { getAuth } = await import('firebase/auth')
    const { getFirestore } = await import('firebase/firestore')
    const { getStorage } = await import('firebase/storage')
    
    // Firebase 앱 초기화
    app = initializeApp(firebaseConfig)
    console.log('✅ Firebase 앱 초기화 완료')
    
    // 서비스 초기화
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
    
    // TODO: [보안강화-P3] Firestore 보안 규칙 강화
    // - 읽기/쓰기 권한을 인증된 사용자로 제한
    // - 사용자별 데이터 접근 제한
    // - 민감한 필드 접근 제한
    
    // TODO: [보안강화-P4] Storage 보안 규칙 강화
    // - 파일 업로드 크기 제한 (최대 10MB)
    // - 허용된 파일 형식만 업로드 (이미지, PDF)
    // - 사용자별 저장 공간 할당량 설정
    
    console.log('✅ Firebase 서비스들 초기화 완료')
    
    // Analytics (프로덕션 환경에서만)
    if (import.meta.env.PROD && typeof window !== 'undefined') {
      try {
        const { getAnalytics } = await import('firebase/analytics')
        analytics = getAnalytics(app)
        
        // TODO: [보안강화-P5] 개인정보 보호
        // - IP 주소 익명화 설정
        // - 민감한 정보 수집 방지
        // - GDPR/CCPA 준수를 위한 동의 관리
        
        console.log('✅ Firebase Analytics 초기화 완료')
      } catch (error) {
        console.warn('⚠️ Analytics 초기화 실패:', error)
      }
    }
    
    isInitialized = true
    console.log('🎉 Firebase 전체 초기화 완료!')
    return true
    
  } catch (error) {
    console.error('❌ Firebase 초기화 실패:', error)
    
    // TODO: [보안강화-P6] 오류 처리 강화
    // - 민감한 오류 정보 노출 방지
    // - 사용자에게는 일반적인 메시지만 표시
    // - 상세 오류는 로깅 시스템으로만 전송
    
    // 개발 환경에서만 상세 오류 표시
    if (import.meta.env.DEV) {
      console.error('상세 오류:', error)
    }
    
    return false
  }
}

/**
 * Firebase 서비스 getter (초기화 보장)
 */
export async function getFirebaseAuth(): Promise<Auth> {
  if (!auth) {
    const initialized = await initializeFirebase()
    if (!initialized || !auth) {
      throw new Error('Firebase Auth 초기화 실패')
    }
  }
  return auth
}

export async function getFirebaseDb(): Promise<Firestore> {
  if (!db) {
    const initialized = await initializeFirebase()
    if (!initialized || !db) {
      throw new Error('Firestore 초기화 실패')
    }
  }
  return db
}

export async function getFirebaseStorage(): Promise<FirebaseStorage> {
  if (!storage) {
    const initialized = await initializeFirebase()
    if (!initialized || !storage) {
      throw new Error('Firebase Storage 초기화 실패')
    }
  }
  return storage
}

/**
 * Analytics 이벤트 로깅 (보안 강화)
 */
export function logAnalyticsEvent(eventName: string, parameters: Record<string, any> = {}): void {
  try {
    // TODO: [보안강화-P7] 민감한 정보 필터링
    // - 이메일, 전화번호 등 PII 제거
    // - 사용자 ID는 해시화하여 전송
    const sanitizedParams = sanitizeParameters(parameters)
    
    if (analytics && import.meta.env.PROD) {
      import('firebase/analytics').then(({ logEvent }) => {
        logEvent(analytics!, eventName, sanitizedParams)
      })
    } else {
      console.log('📊 Analytics Event (Demo):', eventName, sanitizedParams)
    }
  } catch (error) {
    console.warn('Analytics 이벤트 로깅 실패:', error)
  }
}

/**
 * 파라미터 삭제/마스킹
 */
function sanitizeParameters(params: Record<string, any>): Record<string, any> {
  const sanitized = { ...params }
  
  // TODO: [보안강화-P8] PII 필터링 규칙 구현
  // - 이메일 패턴 감지 및 마스킹
  // - 전화번호 패턴 감지 및 마스킹
  // - 신용카드 번호 패턴 감지 및 제거
  
  // 민감한 키워드 제거
  const sensitiveKeys = ['email', 'password', 'phone', 'ssn', 'creditCard', 'name', 'address']
  sensitiveKeys.forEach(key => {
    if (key in sanitized) {
      delete sanitized[key]
    }
  })
  
  // 재귀적으로 중첩된 객체도 검사
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeParameters(sanitized[key])
    }
  })
  
  return sanitized
}

// 개발 환경 헬퍼 함수
export function isFirebaseInitialized(): boolean {
  return isInitialized
}

// 동기적 접근을 위한 getter (초기화 후에만 사용)
// 주의: 이 변수들은 초기화 전에는 null입니다
export { app, auth, db, storage, analytics }

// 기본 내보내기
export default {
  initializeFirebase,
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
  logAnalyticsEvent,
  isFirebaseInitialized
}