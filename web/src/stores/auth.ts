// src/stores/auth.ts - 타입 오류 수정 버전
import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { User as FirebaseUser } from 'firebase/auth'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { auth } from '@/services/firebase'

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

// QR 코드 데이터 타입 정의
interface QRCodeData {
  type: string
  lectureId?: string
  userId?: string
  timestamp?: number
  [key: string]: any
}

// 로그인 방법 타입
type LoginMethod = 'email' | 'qr' | null

export const useAuthStore = defineStore('auth', () => {
  // 상태
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastLoginMethod = ref<LoginMethod>(null)
  const isInitialized = ref(false)

  // 계산된 속성
  const isAuthenticated = computed(() => !!user.value)
  const currentUser = computed(() => user.value)
  const isLoading = computed(() => loading.value)
  const authError = computed(() => error.value)

  /**
   * 인증 상태 초기화
   */
  const initializeAuth = (): Promise<void> => {
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
  }

  /**
   * 이메일/비밀번호 로그인
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
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
      
      console.log('로그인 성공:', user.value.email)
    } catch (err: any) {
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
      
      // QR 데이터 파싱 및 검증
      const parsedData: QRCodeData = JSON.parse(qrData)
      
      if (!parsedData.type || parsedData.type !== 'login') {
        throw new Error('유효하지 않은 QR 코드입니다.')
      }
      
      if (!parsedData.userId) {
        throw new Error('사용자 ID가 없습니다.')
      }
      
      // TODO: 실제 QR 로그인 로직 구현
      // 여기서는 더미 사용자로 로그인
      user.value = {
        uid: parsedData.userId,
        email: `user_${parsedData.userId}@qrsafety.com`,
        displayName: '사용자',
        emailVerified: true,
        lastLoginAt: new Date()
      }
      
      lastLoginMethod.value = 'qr'
      
      console.log('QR 로그인 성공:', user.value.email)
    } catch (err: any) {
      error.value = getErrorMessage(err)
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
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // 프로필 업데이트
      if (displayName) {
        await updateProfile(firebaseUser, { displayName })
      }
      
      user.value = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || undefined,
        lastLoginAt: new Date()
      }
      
      lastLoginMethod.value = 'email'
      
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

  /**
   * 비밀번호 재설정
   */
  const resetPassword = async (email: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await sendPasswordResetEmail(auth, email)
      console.log('비밀번호 재설정 이메일 발송됨')
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('비밀번호 재설정 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 인증 상태 확인
   */
  const checkAuthState = async (): Promise<void> => {
    if (!isInitialized.value) {
      await initializeAuth()
    }
  }

  /**
   * 에러 메시지 변환
   */
  const getErrorMessage = (error: any): string => {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': '존재하지 않는 사용자입니다.',
      'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
      'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
      'auth/weak-password': '비밀번호가 너무 약합니다.',
      'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
      'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
      'auth/too-many-requests': '너무 많은 시도입니다. 잠시 후 다시 시도해주세요.',
      'auth/user-disabled': '비활성화된 계정입니다.',
      'auth/requires-recent-login': '보안을 위해 다시 로그인해주세요.',
      'auth/invalid-credential': '인증 정보가 유효하지 않습니다.'
    }

    const errorCode = error?.code || ''
    return errorMessages[errorCode] || error?.message || '알 수 없는 오류가 발생했습니다.'
  }

  /**
   * 에러 상태 초기화
   */
  const clearError = (): void => {
    error.value = null
  }

  /**
   * 사용자 권한 확인
   */
  const hasRole = (role: string): boolean => {
    return (user.value as any)?.role === role
  }

  /**
   * 관리자 권한 확인
   */
  const isAdmin = computed(() => hasRole('admin'))

  /**
   * 강사 권한 확인
   */
  const isInstructor = computed(() => hasRole('instructor') || hasRole('admin'))

  /**
   * 사용자 프로필 업데이트
   */
  const updateUserProfile = async (updates: Partial<User>): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      if (!user.value) {
        throw new Error('로그인이 필요합니다.')
      }
      
      // Firebase 프로필 업데이트
      if (auth.currentUser) {
        const profileUpdates: any = {}
        if (updates.displayName !== undefined) {
          profileUpdates.displayName = updates.displayName
        }
        if (updates.photoURL !== undefined) {
          profileUpdates.photoURL = updates.photoURL
        }
        
        if (Object.keys(profileUpdates).length > 0) {
          await updateProfile(auth.currentUser, profileUpdates)
        }
      }
      
      // 로컬 상태 업데이트
      user.value = { ...user.value, ...updates }
      
      console.log('프로필 업데이트 완료')
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('프로필 업데이트 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 스토어 반환
  return {
    // 상태
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    lastLoginMethod: readonly(lastLoginMethod),
    isInitialized: readonly(isInitialized),
    
    // 계산된 속성
    isAuthenticated,
    currentUser,
    isLoading,
    authError,
    isAdmin,
    isInstructor,
    
    // 액션
    initializeAuth,
    login,
    loginWithQR,
    register,
    logout,
    resetPassword,
    checkAuthState,
    updateUserProfile,
    clearError,
    hasRole
  }
})

// 타입 내보내기
export type AuthStore = ReturnType<typeof useAuthStore>
export type { User, QRCodeData }