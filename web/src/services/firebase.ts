// web/src/services/firebase.ts
import { initializeApp, FirebaseApp } from 'firebase/app'
import {
  getAuth,
  Auth,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth'
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

// Firebase 설정 (환경변수에서 가져오기)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Firebase 서비스 인스턴스
let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage
let functions: any

// 초기화 상태 추적
let isInitialized = false
let initializationPromise: Promise<boolean> | null = null

/**
 * Firebase 초기화 함수
 * @returns Promise<boolean> 초기화 성공 여부
 */
export const initializeFirebase = async (): Promise<boolean> => {
  // 이미 초기화되었거나 초기화 중인 경우
  if (isInitialized) return true
  if (initializationPromise) return initializationPromise

  initializationPromise = (async () => {
    try {
      console.log('🔥 Firebase 초기화 시작...')

      // Firebase 앱 초기화
      app = initializeApp(firebaseConfig)

      // 인증 서비스 초기화
      auth = getAuth(app)

      // 🔐 보안 강화: 인증 지속성 설정 (로컬 저장소 사용)
      await setPersistence(auth, browserLocalPersistence)

      // Firestore 초기화
      db = getFirestore(app)

      // Storage 초기화
      storage = getStorage(app)

      // Functions 초기화
      functions = getFunctions(app)

      // 🚀 개발 환경에서 에뮬레이터 연결
      if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
        console.log('🧪 Firebase 에뮬레이터 연결 중...')

        try {
          // Auth 에뮬레이터 (포트 9099)
          connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })

          // Firestore 에뮬레이터 (포트 8080)
          connectFirestoreEmulator(db, 'localhost', 8080)

          // Functions 에뮬레이터 (포트 5001)
          connectFunctionsEmulator(functions, 'localhost', 5001)

          console.log('✅ Firebase 에뮬레이터 연결 완료')
        } catch (emulatorError) {
          console.warn('⚠️ Firebase 에뮬레이터 연결 실패, 프로덕션 환경 사용:', emulatorError)
        }
      }

      // 🌐 네트워크 상태 체크
      try {
        await enableNetwork(db)
        console.log('🌐 Firestore 네트워크 연결 성공')
      } catch (networkError) {
        console.warn('⚠️ Firestore 네트워크 연결 실패, 오프라인 모드:', networkError)
      }

      isInitialized = true
      console.log('✅ Firebase 초기화 완료')

      return true

    } catch (error) {
      console.error('❌ Firebase 초기화 실패:', error)

      // 🔄 재시도 로직 (3초 후 1회 재시도)
      if (!import.meta.env.DEV) {
        console.log('🔄 Firebase 초기화 재시도 중...')
        await new Promise(resolve => setTimeout(resolve, 3000))

        try {
          app = initializeApp(firebaseConfig)
          auth = getAuth(app)
          db = getFirestore(app)
          storage = getStorage(app)
          functions = getFunctions(app)

          isInitialized = true
          console.log('✅ Firebase 재시도 성공')
          return true
        } catch (retryError) {
          console.error('❌ Firebase 재시도 실패:', retryError)
        }
      }

      return false
    }
  })()

  return initializationPromise
}

/**
 * Firebase 앱 인스턴스 반환
 */
export const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    throw new Error('Firebase가 초기화되지 않았습니다. initializeFirebase()를 먼저 호출하세요.')
  }
  return app
}

/**
 * Firebase Auth 인스턴스 반환
 */
export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    throw new Error('Firebase Auth가 초기화되지 않았습니다.')
  }
  return auth
}

/**
 * Firestore 인스턴스 반환
 */
export const getFirebaseFirestore = (): Firestore => {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.')
  }
  return db
}

/**
 * Firebase Storage 인스턴스 반환
 */
export const getFirebaseStorage = (): FirebaseStorage => {
  if (!storage) {
    throw new Error('Firebase Storage가 초기화되지 않았습니다.')
  }
  return storage
}

/**
 * Firebase Functions 인스턴스 반환
 */
export const getFirebaseFunctions = () => {
  if (!functions) {
    throw new Error('Firebase Functions가 초기화되지 않았습니다.')
  }
  return functions
}

/**
 * 네트워크 연결 상태 체크
 */
export const checkNetworkStatus = async (): Promise<boolean> => {
  if (!db) return false

  try {
    await enableNetwork(db)
    return true
  } catch {
    return false
  }
}

/**
 * 오프라인 모드 활성화
 */
export const goOffline = async (): Promise<void> => {
  if (db) {
    await disableNetwork(db)
  }
}

/**
 * 온라인 모드 활성화
 */
export const goOnline = async (): Promise<void> => {
  if (db) {
    await enableNetwork(db)
  }
}

// 기본 export들
export { app, auth, db, storage, functions }
