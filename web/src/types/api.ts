// src/types/api.ts
export interface ApiResponse<T = any> {
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
  stack?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationInfo
}

// 공통 요청 타입
export interface BaseRequest {
  timestamp?: Date
  requestId?: string
}

// 로그인 관련 API 타입
export interface LoginRequest extends BaseRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  user: any
  token: string
  refreshToken: string
  expiresIn: number
}

// 강의 관련 API 타입
export interface CourseListRequest extends BaseRequest {
  page?: number
  limit?: number
  category?: string
  search?: string
  sort?: 'latest' | 'popular' | 'rating' | 'price'
}

export interface CourseEnrollRequest extends BaseRequest {
  courseId: string
  paymentMethod?: 'free' | 'card' | 'transfer'
}

// 파일 업로드 관련
export interface FileUploadResponse {
  url: string
  filename: string
  size: number
  mimeType: string
  uploadedAt: Date
}

// 에러 코드 정의
export enum ApiErrorCode {
  // 인증 관련
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // 데이터 관련
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // 서버 관련
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
