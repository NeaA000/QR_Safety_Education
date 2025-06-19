import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User as FirebaseUser } from 'firebase/auth'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
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
  signature?: string
  expiresAt?: number
  nonce?: string
  [key: string]: any
}

type LoginMethod = 'email' | 'qr' | null

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
  const loginAttempts = ref<Map<string, LoginAttempt>>(new Map())
  const MAX_LOGIN_ATTEMPTS = 5
  const BLOCK_DURATION_MINUTES = 30

  // 계산된 속성
  const isAuthenticated = computed(() => !!user.value)
  const currentUser = computed(() => user.value)
  const isLoading = computed(() => loading.value)
  const authError = computed(() => error.value)

  const initializeAuth = async (): Promise<void> => {
    try {
      const auth = await getFirebaseAuth()
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            user.value = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || undefined,
              photoURL: firebaseUser.photoURL || undefined,
              emailVerified: firebaseUser.emailVerified,
              phoneNumber: firebaseUser.phoneNumber || undefined,
              lastLoginAt: new Date()
            }
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

  const checkLoginAttempts = (email: string): boolean => {
    const attempt = loginAttempts.value.get(email)
    if (!attempt) return true
    if (attempt.blockedUntil && new Date() < attempt.blockedUntil) {
      const remainingMinutes = Math.ceil(
        (attempt.blockedUntil.getTime() - Date.now()) / 1000 / 60
      )
      error.value = `너무 많은 로그인 시도로 ${remainingMinutes}분 동안 차단되었습니다.`
      return false
    }
    if (attempt.blockedUntil && new Date() >= attempt.blockedUntil) {
      loginAttempts.value.delete(email)
      return true
    }
    return attempt.attempts < MAX_LOGIN_ATTEMPTS
  }

  const recordLoginAttempt = (email: string, success: boolean) => {
    const attempt = loginAttempts.value.get(email) || {
      email,
      attempts: 0,
      lastAttempt: new Date()
    }
    if (success) {
      loginAttempts.value.delete(email)
    } else {
      attempt.attempts++
      attempt.lastAttempt = new Date()
      if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
        attempt.blockedUntil = new Date(
          Date.now() + BLOCK_DURATION_MINUTES * 60 * 1000
        )
      }
      loginAttempts.value.set(email, attempt)
    }
  }

  const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' }
    }
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const complexity = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length
    if (complexity < 3) {
      return {
        valid: false,
        message: '대문자, 소문자, 숫자, 특수문자 중 3가지 이상을 포함해야 합니다.'
      }
    }
    return { valid: true }
  }

  const login = async (email: string, password: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      if (!checkLoginAttempts(email)) {
        loading.value = false
        return
      }
      const auth = await getFirebaseAuth()
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
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

  const loginWithQR = async (qrData: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      let parsedData: QRCodeData
      try {
        parsedData = JSON.parse(qrData)
      } catch {
        throw new Error('유효하지 않은 QR 코드 형식입니다.')
      }
      if (!parsedData.type || parsedData.type !== 'login') {
        throw new Error('로그인용 QR 코드가 아닙니다.')
      }
      if (!parsedData.signature) {
        throw new Error('QR 코드 서명이 없습니다.')
      }
      if (parsedData.expiresAt && Date.now() > parsedData.expiresAt) {
        throw new Error('만료된 QR 코드입니다.')
      }
      if (!parsedData.nonce) {
        throw new Error('QR 코드 nonce가 없습니다.')
      }
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

  const register = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.valid) {
        error.value = passwordValidation.message!
        loading.value = false
        return
      }
      const auth = await getFirebaseAuth()
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      if (displayName) {
        await updateProfile(firebaseUser, { displayName })
      }
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

  const logout = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      const auth = await getFirebaseAuth()
      await signOut(auth)
      user.value = null
      lastLoginMethod.value = null
      console.log('로그아웃 완료')
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('로그아웃 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Google 로그인 함수 추가
  const signInWithGoogle = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      const auth = await getFirebaseAuth()
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user
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
      console.log('Google 로그인 성공:', user.value.email)
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('Google 로그인 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getErrorMessage = (error: any): string => {
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

  return {
    user,
    loading,
    error,
    lastLoginMethod,
    isInitialized,
    isAuthenticated,
    currentUser,
    isLoading,
    authError,
    initializeAuth,
    login,
    loginWithQR,
    register,
    logout,
    validatePasswordStrength,
    signInWithGoogle // 반드시 반환값에 포함!
  }
})