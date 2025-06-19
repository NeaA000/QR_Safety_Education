// src/types/global.d.ts
// 전역 타입 정의 (보안 강화 포함)

// Window 객체 확장 (보안 강화: 타입 안전성 개선)
declare global {
  interface Window {
    // Android WebView 인터페이스 (보안 강화: 메서드 시그니처 명확화)
    Android?: {
      // QR 스캐너 (보안: 권한 확인 포함)
      scanQR(): Promise<string>
      
      // 파일 관리 (보안: 파일 타입 및 크기 제한)
      downloadFile(url: string, filename: string): Promise<string>
      saveFile(data: string, filename: string): Promise<string>
      openFile(path: string): Promise<boolean>
      
      // 디바이스 정보 (보안: 민감한 정보 제외)
      getDeviceInfo(): Promise<string>
      getAppVersion(): Promise<string>
      
      // 권한 관리 (보안: 권한별 세분화)
      requestPermission(permission: string): Promise<boolean>
      checkPermission(permission: string): Promise<boolean>
      
      // UI 요소
      showToast(message: string): void
      showAlert(title: string, message: string): Promise<boolean>
      
      // 네트워크 상태
      checkNetworkStatus(): Promise<string>
      
      // FCM 토큰 (보안: 토큰 관리 강화)
      getFCMToken(): Promise<string>
      
      // TODO: 추가 보안 기능들
      // 루팅 탐지
      checkRootStatus?(): Promise<boolean>
      // 앱 무결성 검증
      verifyAppIntegrity?(): Promise<boolean>
      // 스크린 캡처 방지
      enableScreenProtection?(): void
      disableScreenProtection?(): void
    }
    
    // iOS WebKit 인터페이스
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
    
    // 네이티브 브릿지 콜백 함수들 (보안 강화: 타입 안전성)
    onQRScanResult?: (result: string) => void
    onDownloadResult?: (path: string) => void
    onSaveFileResult?: (path: string) => void
    onOpenFileResult?: (success: boolean) => void
    onDeviceInfoResult?: (info: DeviceInfo) => void
    onAppVersionResult?: (info: AppVersionInfo) => void
    onPermissionResult?: (granted: boolean) => void
    onCheckPermissionResult?: (granted: boolean) => void
    onAlertResult?: (result: boolean) => void
    onNetworkStatusResult?: (status: NetworkStatus) => void
    onFCMTokenResult?: (token: string) => void
  }
}

// Firebase 관련 타입 (보안 강화)
export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

// 사용자 인터페이스 (보안 강화: 민감한 정보 타입 명확화)
export interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  emailVerified?: boolean
  phoneNumber?: string | null
  lastLoginAt?: Date
  role?: 'user' | 'instructor' | 'admin'
  
  // 보안 관련 필드
  isActive?: boolean
  lastPasswordChange?: Date
  twoFactorEnabled?: boolean
  securityLevel?: 'basic' | 'enhanced' | 'premium'
  
  // 개인정보 보호 설정
  privacySettings?: {
    shareProgress: boolean
    allowAnalytics: boolean
    allowNotifications: boolean
  }
}

// 인증 상태 (보안 강화)
export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isInitialized: boolean
  
  // 보안 관련 상태
  sessionExpiry?: Date
  lastActivity?: Date
  loginAttempts?: number
  accountLocked?: boolean
}

// QR 코드 데이터 (보안 강화: 데이터 검증)
export interface QRCodeData {
  type: 'course' | 'certificate' | 'profile' | 'link'
  version: string // QR 데이터 버전
  timestamp: number // 생성 시점 (보안: 재생 공격 방지)
  
  // 데이터 페이로드 (타입별로 다름)
  payload: {
    [key: string]: any
  }
  
  // 보안 관련 필드
  signature?: string // 디지털 서명
  expiresAt?: number // 만료 시점
  singleUse?: boolean // 일회용 여부
}

// 강의 정보 (보안 강화: 접근 제어)
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
  
  // 접근 제어 (보안 강화)
  accessLevel: 'public' | 'registered' | 'premium' | 'admin'
  requiredRole?: string
  prerequisites?: string[] // 선수 강의 ID 목록
  
  // 진행 상태
  progress?: number // 0-100
  isCompleted?: boolean
  lastWatchedAt?: Date
  watchTime?: number
  
  // 보안 관련
  isEncrypted?: boolean
  drmProtected?: boolean
  allowDownload?: boolean
  allowScreenshot?: boolean
  
  // 메타데이터
  createdAt: Date
  updatedAt: Date
  version: string
  instructor?: {
    id: string
    name: string
    avatar?: string
  }
}

// 수료증 정보 (보안 강화: 위조 방지)
export interface Certificate {
  id: string
  userId: string
  courseId: string
  courseName: string
  completedAt: Date
  score?: number
  validUntil?: Date
  certificateNumber: string
  
  // 보안 관련 (위조 방지)
  digitalSignature: string
  issuer: string
  verificationHash: string
  blockchainTxId?: string // 블록체인 기록 ID (선택사항)
  
  // 생성 정보
  generatedAt: Date
  downloadUrl?: string
  qrCodeUrl?: string
  
  // 검증 정보
  isVerified: boolean
  verificationDate?: Date
  revokedAt?: Date
  revokeReason?: string
}

// 앱 설정 (보안 강화)
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
    biometricAuth: boolean // 생체 인증
    screenProtection: boolean // 스크린 보호
  }
  
  // 보안 설정 (강화)
  security: {
    sslPinning: boolean
    rootDetection: boolean
    debugDetection: boolean
    screenProtection: boolean
    dataEncryption: boolean
    networkSecurity: boolean
    appIntegrityCheck: boolean
    
    // 세션 보안
    sessionTimeout: number // 분 단위
    maxLoginAttempts: number
    lockoutDuration: number // 분 단위
    
    // 토큰 보안
    tokenRefreshInterval: number // 분 단위
    jwtSecret?: string // 클라이언트에서는 사용하지 않음
  }
  
  // UI 설정
  ui: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    notifications: boolean
    fontSize: 'small' | 'medium' | 'large'
    colorScheme: 'default' | 'high-contrast'
  }
}

// API 응답 타입 (보안 강화)
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: AppError
  code?: number
  timestamp: string
  requestId?: string // 요청 추적용
  
  // 보안 관련
  rateLimit?: {
    remaining: number
    resetTime: number
  }
}

// 페이지네이션
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  
  // 보안: 최대 제한
  maxLimit?: number
}

// 토스트 메시지 (보안: XSS 방지)
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string // HTML 이스케이프 처리 필요
  duration: number
  timestamp: number
  
  // 보안 관련
  sanitized?: boolean // 메시지가 sanitize되었는지 여부
}

// 디바이스 정보 (보안 강화: 프라이버시 보호)
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
  
  // 보안 관련 (민감한 정보 제외)
  isRooted?: boolean
  isEmulator?: boolean
  isDebugging?: boolean
  hasVPN?: boolean
  
  // 개인식별 불가능한 정보만 포함
  // deviceId나 IMEI 등은 포함하지 않음
}

// 앱 버전 정보
export interface AppVersionInfo {
  version: string
  buildNumber: string
  releaseDate: string
  features: string[]
  
  // 보안 업데이트 정보
  securityPatch?: string
  isSecurityUpdate?: boolean
  forceUpdate?: boolean
}

// 네트워크 상태
export interface NetworkStatus {
  isConnected: boolean
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  speed?: 'slow' | 'fast'
  
  // 보안 관련
  isSecure?: boolean // HTTPS 연결 여부
  isVPN?: boolean // VPN 사용 여부
}

// 에러 타입 (보안 강화: 민감한 정보 제외)
export interface AppError {
  code: string
  message: string
  details?: Record<string, any> // 민감한 정보는 포함하지 않음
  timestamp: Date
  stack?: string // 개발 환경에서만
  
  // 에러 분류
  category: 'network' | 'auth' | 'security' | 'ui' | 'system' | 'validation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  // 보안 관련
  userId?: string // 해시된 사용자 ID
  sessionId?: string
  requestId?: string
  
  // 개인정보는 포함하지 않음
}

// 이벤트 타입 (분석용)
export type AppEvent = 
  | 'app_launch'
  | 'user_login'
  | 'user_logout'
  | 'course_start'
  | 'course_complete'
  | 'qr_scan'
  | 'certificate_download'
  | 'error_occurred'
  | 'security_violation'
  | 'permission_requested'
  | 'permission_granted'
  | 'permission_denied'

// 권한 타입
export type Permission = 
  | 'CAMERA'
  | 'STORAGE'
  | 'MICROPHONE'
  | 'LOCATION'
  | 'NOTIFICATIONS'
  | 'BIOMETRIC'
  | 'CONTACTS'
  | 'PHONE'

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

// 보안 레벨
export type SecurityLevel = 'basic' | 'enhanced' | 'premium'

// 내보내기 (다른 파일에서 import 할 수 있도록)
export {}