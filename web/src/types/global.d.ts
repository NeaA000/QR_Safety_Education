// src/types/global.d.ts

// 사용자 통계 타입
export interface UserStats {
  totalLectures?: number
  completedLectures?: number
  totalStudyTime?: number
  certificatesEarned?: number
  currentStreak?: number
  longestStreak?: number
  lastActivityAt?: Date
}

// 사용자 타입 (stats 포함)
export interface User {
  id: string
  email: string
  displayName: string
  photoURL?: string
  phoneNumber?: string
  department?: string
  position?: string
  employeeId?: string
  createdAt: Date
  lastLoginAt: Date
  isActive: boolean
  role: UserRole
  stats?: UserStats  // stats 속성 추가
}

export type UserRole = 'admin' | 'instructor' | 'student'

// 부분 사용자 타입 (업데이트용)
export interface PartialUser extends Partial<User> {
  stats?: Partial<UserStats>
}

// 강의 타입 (확장)
export interface Lecture {
  id: string
  title: string
  description?: string
  category: string
  mainCategory?: string
  middleCategory?: string
  leafCategory?: string
  level: '초급' | '중급' | '고급'
  duration: number // 초 단위
  instructor?: string
  thumbnailUrl?: string
  videoUrl?: string
  materials?: LectureMaterial[]
  chapters?: Chapter[]
  requirements?: string[]
  objectives?: string[]
  createdAt: Date
  updatedAt?: Date
  isActive: boolean
  price?: number
  progress?: number
  watchedTime?: number
  enrolledAt?: Date
  expiresAt?: Date
  lastAccessedAt?: Date
  completedChapters?: number[]
  certificates?: Certificate[]
}

// 챕터 타입
export interface Chapter {
  id: string
  lectureId: string
  title: string
  description?: string
  duration: number
  order: number
  videoUrl?: string
  isCompleted?: boolean
  watchedTime?: number
}

// 강의 자료 타입
export interface LectureMaterial {
  id: string
  name: string
  type: 'pdf' | 'video' | 'doc' | 'ppt' | 'link' | 'other'
  url: string
  size?: number
  uploadedAt: Date
}

// 수료증 타입
export interface Certificate {
  id: string
  userId: string
  lectureId: string
  lectureTitle: string
  userName: string
  issueDate: Date
  issuedAt?: Date  // issueDate와 issuedAt 둘 다 지원
  certificateNumber: string
  validUntil?: Date
  status: CertificateStatus
  downloadUrl?: string
  pdfUrl?: string  // PDF 다운로드 URL
  verificationCode?: string
}

export type CertificateStatus = 'issued' | 'expired' | 'revoked'

// 학습 기록 타입
export interface LearningRecord {
  id: string
  userId: string
  lectureId: string
  chapterId?: string
  startTime: Date
  endTime?: Date
  duration: number
  progress: number
  isCompleted: boolean
  platform?: 'web' | 'mobile' | 'app'
  deviceInfo?: any
}

// QR 코드 데이터 타입
export interface QRCodeData {
  type: 'lecture' | 'certificate' | 'user' | 'event'
  lectureId?: string
  certificateId?: string
  userId?: string
  eventId?: string
  title?: string
  duration?: number
  expiresAt?: Date
  metadata?: Record<string, any>
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
  timestamp: Date
}

export interface ApiError {
  code: string
  message: string
  details?: any
}

// 페이지네이션 타입
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: Pagination
}

// 알림 타입
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: Date
  readAt?: Date
  data?: any
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'lecture' | 'certificate'

// 설정 타입
export interface UserSettings {
  userId: string
  theme: 'light' | 'dark' | 'auto'
  language: 'ko' | 'en'
  notifications: NotificationSettings
  privacy: PrivacySettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  lectureReminders: boolean
  certificateAlerts: boolean
  marketingEmails: boolean
}

export interface PrivacySettings {
  showProfile: boolean
  showProgress: boolean
  allowAnalytics: boolean
}

// 등록 상태 타입 (const assertions 문제 해결)
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled'
export type PaymentMethod = 'free' | 'pending' | 'paid'

// 업데이트 데이터 타입 (유연한 구조)
export interface UpdateData {
  [key: string]: any
  stats?: Partial<UserStats>
}
