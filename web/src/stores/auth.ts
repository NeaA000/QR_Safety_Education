// src/stores/auth.ts - 보안 강화가 필요한 버전
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User as FirebaseUser } from 'firebase/auth'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { getFirebaseAuth } from '@/services/firebase'
import type { Auth } from 'firebase/auth'

// 사용자 타입 정의
interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  emailVerified?: boolean
  phoneNumber?: string
  lastLoginAt?: Date
  role?: string
}

// QR 코드 데이터 타입
interface QRCodeData {
  type: string
  lectureId?: string
  userId?: string
  timestamp?: number
  signature?: string // TODO: [보안강화] QR 코드 서명 검증
  expiresAt?: number // TODO: [보안강화] QR 코드 만료 시간
  nonce?: string // TODO: [보안강화] 재사용 방지용 nonce
  [key: string]: any
}

// 로그인 방법 타입
type LoginMethod = 'email' | 'qr' | null

// TODO: [보안강화-A1] 로그인 시도 제한
interface LoginAttempt {
  email: string
  attempts: number
  lastAttempt: Date
  blockedUntil?: Date
}

export const useAuthStore = defineStore('auth', () => {
  // 상태
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastLoginMethod = ref<LoginMethod>(null)
  const isInitialized = ref(false)
  
  // TODO: [보안강화-A2] 로그인 시도 추적
  const loginAttempts = ref<Map<string, LoginAttempt>>(new Map())
  const MAX_LOGIN_ATTEMPTS = 5
  const BLOCK_DURATION_MINUTES = 30

  // 계산된 속성
  const isAuthenticated = computed(() => !!user.value)
  const currentUser = computed(() => user.value)
  const isLoading = computed(() => loading.value)
  const authError = computed(() => error.value)

  /**
   * 인증 상태 초기화
   */
  const initializeAuth = async (): Promise<void> => {
    try {
      const auth = await getFirebaseAuth()
      
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            // TODO: [보안강화-A3] 토큰 유효성 검증
            // - 토큰 만료 시간 확인
            // - 토큰 서명 검증
            // - 리프레시 토큰 관리
            
            user.value = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || undefined,
              photoURL: firebaseUser.photoURL || undefined,
              emailVerified: firebaseUser.emailVerified,
              phoneNumber: firebaseUser.phoneNumber || undefined,
              lastLoginAt: new Date()
            }
            
            // TODO: [보안강화-A4] 세션 관리
            // - 세션 타임아웃 설정 (30분)
            // - 비활성 시 자동 로그아웃
            // - 다중 디바이스 로그인 제어
            
          } else {
            user.value = null
          }
          
          isInitialized.value = true
          unsubscribe()
          resolve()
        })
      })
    } catch (err) {
      console.error('인증 초기화 실패:', err)
      isInitialized.value = true
      throw err
    }
  }

  /**
   * 로그인 시도 확인
   */
  const checkLoginAttempts = (email: string): boolean => {
    const attempt = loginAttempts.value.get(email)
    
    if (!attempt) return true
    
    // 차단 시간 확인
    if (attempt.blockedUntil && new Date() < attempt.blockedUntil) {
      const remainingMinutes = Math.ceil(
        (attempt.blockedUntil.getTime() - Date.now()) / 1000 / 60
      )
      error.value = `너무 많은 로그인 시도로 ${remainingMinutes}분 동안 차단되었습니다.`
      return false
    }
    
    // 차단 해제
    if (attempt.blockedUntil && new Date() >= attempt.blockedUntil) {
      loginAttempts.value.delete(email)
      return true
    }
    
    return attempt.attempts < MAX_LOGIN_ATTEMPTS
  }

  /**
   * 로그인 시도 기록
   */
  const recordLoginAttempt = (email: string, success: boolean) => {
    const attempt = loginAttempts.value.get(email) || {
      email,
      attempts: 0,
      lastAttempt: new Date()
    }
    
    if (success) {
      // 성공 시 기록 삭제
      loginAttempts.value.delete(email)
    } else {
      // 실패 시 카운트 증가
      attempt.attempts++
      attempt.lastAttempt = new Date()
      
      // 최대 시도 횟수 도달 시 차단
      if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
        attempt.blockedUntil = new Date(
          Date.now() + BLOCK_DURATION_MINUTES * 60 * 1000
        )
      }
      
      loginAttempts.value.set(email, attempt)
    }
  }

  /**
   * 비밀번호 강도 검증
   */
  const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
    // TODO: [보안강화-A5] 비밀번호 정책 강화
    // 구글 플레이스토어 요구사항:
    // - 최소 8자 이상
    // - 대문자, 소문자, 숫자, 특수문자 중 3가지 이상 포함
    // - 연속된 문자나 숫자 제한
    // - 일반적인 패스워드 패턴 차단
    
    if (password.length < 8) {
      return { valid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' }
    }
    
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    const complexity = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
      .filter(Boolean).length
    
    if (complexity < 3) {
      return { 
        valid: false, 
        message: '대문자, 소문자, 숫자, 특수문자 중 3가지 이상을 포함해야 합니다.' 
      }
    }
    
    return { valid: true }
  }

  /**
   * 이메일/비밀번호 로그인
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      // TODO: [보안강화-A6] 입력 검증 및 살균
      // - SQL Injection 방지
      // - XSS 방지를 위한 입력 살균
      // - 이메일 형식 검증
      
      // 로그인 시도 제한 확인
      if (!checkLoginAttempts(email)) {
        loading.value = false
        return
      }
      
      const auth = await getFirebaseAuth()
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // TODO: [보안강화-A7] 2단계 인증 (2FA)
      // - SMS 또는 이메일 OTP
      // - Google Authenticator 연동
      // - 생체 인증 (지문, 얼굴)
      
      user.value = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || undefined,
        lastLoginAt: new Date()
      }
      
      lastLoginMethod.value = 'email'
      recordLoginAttempt(email, true)
      
      // TODO: [보안강화-A8] 로그인 이벤트 로깅
      // - IP 주소 기록 (해시화)
      // - 디바이스 정보 기록
      // - 비정상 로그인 패턴 감지
      
      console.log('로그인 성공:', user.value.email)
    } catch (err: any) {
      recordLoginAttempt(email, false)
      error.value = getErrorMessage(err)
      console.error('로그인 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * QR 코드 로그인
   */
  const loginWithQR = async (qrData: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      // TODO: [보안강화-A9] QR 코드 보안 검증
      let parsedData: QRCodeData
      
      try {
        parsedData = JSON.parse(qrData)
      } catch {
        throw new Error('유효하지 않은 QR 코드 형식입니다.')
      }
      
      // 기본 검증
      if (!parsedData.type || parsedData.type !== 'login') {
        throw new Error('로그인용 QR 코드가 아닙니다.')
      }
      
      // TODO: [보안강화-A10] QR 코드 고급 검증
      // 1. 서명 검증 (HMAC 또는 RSA)
      if (!parsedData.signature) {
        throw new Error('QR 코드 서명이 없습니다.')
      }
      // TODO: 서버에서 서명 검증 API 호출
      
      // 2. 만료 시간 확인
      if (parsedData.expiresAt && Date.now() > parsedData.expiresAt) {
        throw new Error('만료된 QR 코드입니다.')
      }
      
      // 3. Nonce 중복 확인 (재사용 방지)
      if (!parsedData.nonce) {
        throw new Error('QR 코드 nonce가 없습니다.')
      }
      // TODO: 서버에서 nonce 중복 확인
      
      // TODO: [보안강화-A11] 서버 API를 통한 QR 로그인
      // - QR 데이터를 서버로 전송
      // - 서버에서 검증 후 토큰 발급
      // - 발급된 토큰으로 Firebase 커스텀 토큰 인증
      
      lastLoginMethod.value = 'qr'
      console.log('QR 로그인 성공')
    } catch (err: any) {
      error.value = err.message || 'QR 로그인 실패'
      console.error('QR 로그인 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 회원가입
   */
  const register = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      // 비밀번호 강도 검증
      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.valid) {
        error.value = passwordValidation.message!
        loading.value = false
        return
      }
      
      // TODO: [보안강화-A12] 추가 회원가입 보안
      // - 이메일 인증 필수화
      // - 캡차(CAPTCHA) 구현
      // - 약관 동의 기록
      // - 개인정보 암호화 저장
      
      const auth = await getFirebaseAuth()
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // 프로필 업데이트
      if (displayName) {
        await updateProfile(firebaseUser, { displayName })
      }
      
      // TODO: [보안강화-A13] 이메일 인증 발송
      // await sendEmailVerification(firebaseUser)
      
      user.value = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: displayName || undefined,
        emailVerified: firebaseUser.emailVerified,
        lastLoginAt: new Date()
      }
      
      console.log('회원가입 성공:', user.value.email)
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('회원가입 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 로그아웃
   */
  const logout = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      // TODO: [보안강화-A14] 안전한 로그아웃
      // - 서버 세션 무효화
      // - 로컬 저장된 토큰 삭제
      // - 자동 로그인 정보 삭제
      
      const auth = await getFirebaseAuth()
      await signOut(auth)
      
      user.value = null
      lastLoginMethod.value = null
      
      // TODO: [보안강화-A15] 로그아웃 후 처리
      // - 캐시된 민감한 데이터 삭제
      // - 메모리에서 암호화 키 제거
      
      console.log('로그아웃 완료')
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('로그아웃 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 에러 메시지 변환 (보안 강화)
   */
  const getErrorMessage = (error: any): string => {
    // TODO: [보안강화-A16] 에러 메시지 보안
    // - 상세한 에러 정보 노출 방지
    // - 일반적인 메시지로 변환
    // - 실제 에러는 로깅 시스템으로만
    
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': '등록되지 않은 이메일입니다.',
      'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
      'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
      'auth/weak-password': '비밀번호가 보안 정책을 충족하지 않습니다.',
      'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
      'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
      'auth/too-many-requests': '너무 많은 시도입니다. 잠시 후 다시 시도해주세요.'
    }

    const errorCode = error?.code || ''
    return errorMessages[errorCode] || '로그인 처리 중 오류가 발생했습니다.'
  }

  // 스토어 반환
  return {
    // 상태
    user,
    loading,
    error,
    lastLoginMethod,
    isInitialized,
    
    // 계산된 속성
    isAuthenticated,
    currentUser,
    isLoading,
    authError,
    
    // 액션
    initializeAuth,
    login,
    loginWithQR,
    register,
    logout,
    validatePasswordStrength
  }
})