// web/src/types/global.d.ts
// 전역 타입 정의

// Vite 환경변수 타입 확장
interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string
  readonly VITE_BUILD_NUMBER: string
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 네이티브 브리지 인터페이스
declare global {
  interface Window {
    // Android WebView Interface
    Android?: {
      // QR 스캐너
      scanQR(): Promise<string>
      
      // 파일 관리
      downloadFile(url: string, filename: string): Promise<string>
      saveFile(data: string, filename: string, mimeType: string): Promise<string>
      openFile(path: string): Promise<boolean>
      
      // 디바이스 정보
      getDeviceInfo(): Promise<string>
      getAppVersion(): Promise<string>
      
      // 권한 관리
      requestPermission(permission: string): Promise<boolean>
      checkPermission(permission: string): Promise<boolean>
      
      // UI 요소
      showToast(message: string): void
      showAlert(title: string, message: string): Promise<boolean>
      
      // 네트워크
      checkNetworkStatus(): Promise<string>
      
      // FCM
      getFCMToken(): Promise<string>
      
      // TODO: 보안 기능들 (추후 추가)
      // checkRootStatus(): Promise<boolean>
      // checkDebugging(): Promise<boolean>
      // checkAppIntegrity(): Promise<boolean>
      // enableScreenProtection(): void
      // disableScreenProtection(): void
    }
    
    // iOS WebKit Interface
    webkit?: {
      messageHandlers: {
        // QR 스캐너
        scanQR: {
          postMessage(data: any): void
        }
        
        // 파일 관리
        downloadFile: {
          postMessage(data: { url: string; filename: string }): void
        }
        saveFile: {
          postMessage(data: { data: any; filename: string; mimeType: string }): void
        }
        openFile: {
          postMessage(data: { path: string }): void
        }
        
        // 디바이스 정보
        getDeviceInfo: {
          postMessage(data: any): void
        }
        getAppVersion: {
          postMessage(data: any): void
        }
        
        // 권한 관리
        requestPermission: {
          postMessage(data: { permission: string }): void
        }
        checkPermission: {
          postMessage(data: { permission: string }): void
        }
        
        // UI 요소
        showToast: {
          postMessage(data: { message: string }): void
        }
        showAlert: {
          postMessage(data: { title: string; message: string }): void
        }
        
        // 네트워크
        checkNetworkStatus: {
          postMessage(data: any): void
        }
        
        // FCM
        getFCMToken: {
          postMessage(data: any): void
        }
      }
    }
    
    // 앱 상태 플래그
    isNativeApp?: boolean
  }
}

// Firebase 관련 타입
export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

// 사용자 인터페이스
export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  phoneNumber: string | null
  
  // 커스텀 프로퍼티
  role?: 'user' | 'admin' | 'instructor'
  department?: string
  employeeId?: string
  lastLoginAt?: Date
  createdAt?: Date
}

// 인증 상태
export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  error: string | null
  lastLoginMethod?: 'email' | 'qr' | 'social'
}

// QR 코드 데이터
export interface QRCodeData {
  type: 'login' | 'course' | 'certificate' | 'url'
  data: any
  timestamp: number
  signature?: string
  userId?: string
  courseId?: string
}

// 강의 정보
export interface Course {
  id: string
  title: string
  description: string
  thumbnailUrl?: string
  videoUrl: string
  duration: number // 초 단위
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  
  // 진행 상태
  progress?: number // 0-100
  isCompleted?: boolean
  lastWatchedAt?: Date
  watchTime?: number
  
  // 메타데이터
  createdAt: Date
  updatedAt: Date
  version: string
}

// 수료증 정보
export interface Certificate {
  id: string
  userId: string
  courseId: string
  courseName: string
  completedAt: Date
  score?: number
  validUntil?: Date
  certificateNumber: string
  
  // 생성 정보
  generatedAt: Date
  downloadUrl?: string
  qrCodeUrl?: string
}

// 앱 설정
export interface AppConfig {
  version: string
  buildNumber: string
  apiBaseUrl: string
  environment: 'development' | 'staging' | 'production'
  
  // 기능 플래그
  features: {
    qrScanner: boolean
    offlineMode: boolean
    analytics: boolean
    crashReporting: boolean
    pushNotifications: boolean
  }
  
  // 보안 설정
  security: {
    sslPinning: boolean
    rootDetection: boolean
    debugDetection: boolean
    screenProtection: boolean
  }
  
  // UI 설정
  ui: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    notifications: boolean
  }
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: number
  timestamp: string
}

// 페이지네이션
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 토스트 메시지
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration: number
  timestamp: number
}

// 디바이스 정보
export interface DeviceInfo {
  platform: 'android' | 'ios' | 'web'
  osVersion: string
  appVersion: string
  deviceModel: string
  isNative: boolean
  screenWidth: number
  screenHeight: number
  language: string
  timezone: string
  
  // 보안 관련
  isRooted?: boolean
  isEmulator?: boolean
  isDebugging?: boolean
}

// 네트워크 상태
export interface NetworkStatus {
  isConnected: boolean
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  speed?: 'slow' | 'fast'
}

// 에러 타입
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
  stack?: string
  
  // 에러 분류
  category: 'network' | 'auth' | 'security' | 'ui' | 'system'
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// 이벤트 타입
export type AppEvent = 
  | 'app_launch'
  | 'user_login'
  | 'user_logout'
  | 'course_start'
  | 'course_complete'
  | 'qr_scan'
  | 'certificate_download'
  | 'error_occurred'

// 권한 타입
export type Permission = 
  | 'CAMERA'
  | 'STORAGE'
  | 'MICROPHONE'
  | 'LOCATION'
  | 'NOTIFICATIONS'

// 플랫폼 타입
export type Platform = 'android' | 'ios' | 'web'

// 환경 타입
export type Environment = 'development' | 'staging' | 'production'

// 테마 타입
export type Theme = 'light' | 'dark' | 'auto'

// 언어 타입
export type Language = 'ko' | 'en' | 'ja' | 'zh'

// 로그 레벨
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// 내보내기 (다른 파일에서 import 할 수 있도록)
export {}