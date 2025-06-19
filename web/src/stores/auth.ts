// web/src/stores/auth.ts
// 인증 상태 관리 (Pinia Store)

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  displayName: string
  department?: string
  employeeId?: string
}

export const useAuthStore = defineStore('auth', () => {
  // 상태 정의
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastLoginMethod = ref<'email' | 'qr' | 'social' | null>(null)

  // 계산된 속성
  const isAuthenticated = computed(() => !!user.value)
  const currentUser = computed(() => user.value)
  const isLoading = computed(() => loading.value)
  const authError = computed(() => error.value)

  // Firebase Auth 인스턴스 (지연 로딩)
  let firebaseAuth: any = null

  /**
   * Firebase Auth 초기화
   */
  const initializeAuth = async () => {
    try {
      if (!firebaseAuth) {
        const { auth } = await import('@/services/firebase')
        firebaseAuth = auth

        if (firebaseAuth) {
          const { onAuthStateChanged } = await import('firebase/auth')
          // 인증 상태 변경 감지
          onAuthStateChanged(firebaseAuth, (firebaseUser) => {
            if (firebaseUser) {
              user.value = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                emailVerified: firebaseUser.emailVerified,
                phoneNumber: firebaseUser.phoneNumber,
                lastLoginAt: new Date()
                // role: '' // 필요시 추가
              }
              console.log('✅ 사용자 인증됨:', user.value.email)
            } else {
              user.value = null
              console.log('❌ 사용자 로그아웃됨')
            }
            loading.value = false
          })
        }
      }
    } catch (error) {
      console.error('Firebase Auth 초기화 실패:', error)
      loading.value = false
    }
  }

  /**
   * 이메일/비밀번호 로그인
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      if (!firebaseAuth) {
        await initializeAuth()
      }

      if (firebaseAuth) {
        const { signInWithEmailAndPassword } = await import('firebase/auth')
        const userCredential = await signInWithEmailAndPassword(
          firebaseAuth,
          credentials.email,
          credentials.password
        )

        if (userCredential.user) {
          lastLoginMethod.value = 'email'
          // Analytics 이벤트 로깅
          const { logAnalyticsEvent } = await import('@/services/firebase')
          logAnalyticsEvent('login', {
            method: 'email',
            user_id: userCredential.user.uid
          })
          console.log('✅ 이메일 로그인 성공')
        }
      } else {
        throw new Error('Firebase Auth가 초기화되지 않았습니다.')
      }
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ 로그인 실패:', error.value)
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

      // QR 데이터 파싱
      const parsedData: QRCodeData = JSON.parse(qrData)
      if (parsedData.type !== 'login') {
        throw new Error('유효하지 않은 QR 코드입니다.')
      }

      if (!firebaseAuth) {
        await initializeAuth()
      }

      // TODO: 실제 QR 로그인 구현
      console.log('QR 로그인 데이터:', parsedData)
      lastLoginMethod.value = 'qr'
      const { logAnalyticsEvent } = await import('@/services/firebase')
      logAnalyticsEvent('login', {
        method: 'qr',
        qr_type: parsedData.type
      })
      throw new Error('QR 로그인은 아직 구현되지 않았습니다.')
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ QR 로그인 실패:', error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 회원가입
   */
  const register = async (registerData: RegisterData): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      if (!firebaseAuth) {
        await initializeAuth()
      }

      if (firebaseAuth) {
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
        const userCredential = await createUserWithEmailAndPassword(
          firebaseAuth,
          registerData.email,
          registerData.password
        )

        if (userCredential.user) {
          // 프로필 업데이트
          await updateProfile(userCredential.user, {
            displayName: registerData.displayName
          })

          // Firestore에 추가 사용자 정보 저장
          await saveUserProfile(userCredential.user.uid, {
            email: registerData.email,
            displayName: registerData.displayName,
            department: registerData.department,
            employeeId: registerData.employeeId,
            role: 'user',
            createdAt: new Date()
          })

          // Analytics 이벤트 로깅
          const { logAnalyticsEvent } = await import('@/services/firebase')
          logAnalyticsEvent('sign_up', {
            method: 'email',
            user_id: userCredential.user.uid
          })
          console.log('✅ 회원가입 성공')
        }
      } else {
        throw new Error('Firebase Auth가 초기화되지 않았습니다.')
      }
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ 회원가입 실패:', error.value)
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

      if (firebaseAuth) {
        const { signOut } = await import('firebase/auth')
        await signOut(firebaseAuth)
        const { logAnalyticsEvent } = await import('@/services/firebase')
        logAnalyticsEvent('logout', {
          method: lastLoginMethod.value || 'unknown'
        })
      }

      // 상태 초기화
      user.value = null
      lastLoginMethod.value = null
      console.log('✅ 로그아웃 완료')
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ 로그아웃 실패:', error.value)
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

      if (!firebaseAuth) {
        await initializeAuth()
      }

      if (firebaseAuth) {
        const { sendPasswordResetEmail } = await import('firebase/auth')
        await sendPasswordResetEmail(firebaseAuth, email)
        console.log('✅ 비밀번호 재설정 이메일 전송 완료')
      } else {
        throw new Error('Firebase Auth가 초기화되지 않았습니다.')
      }
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ 비밀번호 재설정 실패:', error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 인증 상태 확인
   */
  const checkAuthState = async (): Promise<void> => {
    try {
      loading.value = true
      await initializeAuth()
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ 인증 상태 확인 실패:', error.value)
    }
    // loading은 onAuthStateChanged에서 false로 설정됨
  }

  /**
   * 사용자 프로필 업데이트
   */
  const updateUserProfile = async (updates: Partial<User>): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      if (!user.value) {
        throw new Error('로그인된 사용자가 없습니다.')
      }

      if (firebaseAuth && firebaseAuth.currentUser) {
        const { updateProfile } = await import('firebase/auth')
        // Firebase Auth 프로필 업데이트
        if (updates.displayName || updates.photoURL) {
          await updateProfile(firebaseAuth.currentUser, {
            displayName: updates.displayName || firebaseAuth.currentUser.displayName,
            photoURL: updates.photoURL || firebaseAuth.currentUser.photoURL
          })
        }
        // Firestore 사용자 정보 업데이트
        await saveUserProfile(user.value.uid, updates)
        // 로컬 상태 업데이트
        user.value = { ...user.value, ...updates }
        console.log('✅ 프로필 업데이트 완료')
      }
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ 프로필 업데이트 실패:', error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Firestore에 사용자 프로필 저장
   */
  const saveUserProfile = async (uid: string, profileData: any): Promise<void> => {
    try {
      const { db } = await import('@/services/firebase')
      if (db) {
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
        const userDoc = doc(db, 'users', uid)
        await setDoc(userDoc, {
          ...profileData,
          updatedAt: serverTimestamp()
        }, { merge: true })
      }
    } catch (error) {
      console.error('사용자 프로필 저장 실패:', error)
      // Firestore 오류는 로그인 자체를 실패시키지 않음
    }
  }

  /**
   * 에러 메시지 변환
   */
  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error

    // Firebase Auth 에러 코드별 메시지
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': '등록되지 않은 이메일입니다.',
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

  // 스토어 반환
  return {
    // 상태
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    lastLoginMethod: readonly(lastLoginMethod),
    
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