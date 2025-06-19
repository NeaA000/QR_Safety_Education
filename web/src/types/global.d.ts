// src/types/global.d.ts
// 전역 타입 정의 파일

// Android 네이티브 인터페이스 정의
interface AndroidInterface {
  // 기본 메서드
  scanQR: () => string | Promise<string>
  saveFile: (data: string, filename: string) => void
  showToast: (message: string) => void
  getDeviceInfo: () => string
  requestPermission: (permission: string) => Promise<boolean>
  
  // 추가 메서드
  downloadFile: (url: string, filename: string) => string | Promise<string>
  openFile: (path: string) => boolean | Promise<boolean>
  getAppVersion: () => string | Promise<string>
  checkPermission: (permission: string) => boolean | Promise<boolean>
  showAlert: (title: string, message: string) => boolean | Promise<boolean>
  checkNetworkStatus: () => string | Promise<string>
  getFCMToken: () => string | Promise<string>
}

// iOS WebKit 인터페이스
interface WebKitMessageHandlers {
  [key: string]: {
    postMessage: (message: any) => void
  }
}

// Window 확장
declare global {
  interface Window {
    Android?: AndroidInterface
    webkit?: {
      messageHandlers: WebKitMessageHandlers
    }
    isNativeApp?: boolean
  }
}

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

// 디바이스 정보
export interface DeviceInfo {
  platform: string
  version: string
  model: string
  manufacturer: string
  uuid: string
  isVirtual: boolean
}

// 앱 버전 정보
export interface AppVersionInfo {
  version: string
  buildNumber: string
  packageName: string
}

// 네트워크 상태
export interface NetworkStatus {
  isConnected: boolean
  type: 'wifi' | 'cellular' | 'none' | 'unknown'
  strength?: number
}

// 앱 에러
export interface AppError {
  code: string
  message: string
  details?: any
}

// QR 코드 데이터
export interface QRCodeData {
  type: string
  lectureId?: string
  userId?: string
  timestamp?: number
  [key: string]: any
}

// 사용자 정보
export interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  emailVerified?: boolean
  phoneNumber?: string
  lastLoginAt?: Date
  role?: string
}

// 강의 정보
export interface Lecture {
  id: string
  title: string
  description: string
  duration: number
  videoUrl: string
  thumbnailUrl?: string
  category: string
  createdAt: Date
  updatedAt: Date
}

// 수료증 정보
export interface Certificate {
  id: string
  userId: string
  lectureId: string
  issuedAt: Date
  certificateNumber: string
  pdfUrl?: string
}

export {}