// web/src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
  type User
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type Timestamp
} from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseFirestore } from '@/services/firebase'
import { ElMessage } from 'element-plus'

// 🔐 사용자 타입 정의
export interface UserProfile {
  uid: string
  email?: string
  name: string
  phone?: string
  dob?: Date
  role: 'guest' | 'user' | 'admin'
  provider: 'anonymous' | 'email' | 'google' | 'naver'
  joinedAt: Date
  lastLoginAt?: Date
  isTemporary?: boolean
  privacyConsent?: boolean
  privacyConsentDate?: Date
  accessLevel?: 'basic' | 'standard' | 'premium'
}

// 🔐 입력값 검증 타입
export interface RegisterData {
  email: string
  password: string
  name: string
  phone: string
  dob: Date
}

export interface LoginData {
  email: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  // 상태 변수들
  const user = ref<User | null>(null)
  const userProfile = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const error = ref<string | null>(null)

  // 계산된 속성들
  const isLoggedIn = computed(() => !!user.value)
  const isAnonymous = computed(() => user.value?.isAnonymous ?? false)
  const isAdmin = computed(() => userProfile.value?.role === 'admin')
  const currentRole = computed(() => userProfile.value?.role ?? 'guest')
  const displayName = computed(() => {
    if (userProfile.value?.name) return userProfile.value.name
    if (user.value?.displayName) return user.value.displayName
    if (isAnonymous.value) return '게스트 사용자'
    return '익명 사용자'
  })

  // 🔐 입력값 검증 함수들
  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!email.trim()) return '이메일을 입력해주세요.'
    if (!emailRegex.test(email.trim())) return '올바른 이메일 형식을 입력해주세요.'
    return null
  }

  const validatePassword = (password: string): string | null => {
    if (!password) return '비밀번호를 입력해주세요.'
    if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.'
    if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return '비밀번호는 영문과 숫자를 모두 포함해야 합니다.'
    }
    return null
  }

  const validateName = (name: string): string | null => {
    if (!name.trim()) return '이름을 입력해주세요.'
    if (name.trim().length < 2) return '이름은 2자 이상이어야 합니다.'
    if (name.trim().length > 50) return '이름은 50자를 초과할 수 없습니다.'
    return null
  }

  const validatePhone = (phone: string): string | null => {
    if (phone && !/^[0-9-+().\s]{10,15}$/.test(phone)) {
      return '올바른 전화번호 형식을 입력해주세요.'
    }
    return null
  }

  const validateDob = (dob: Date): string | null => {
    const now = new Date()
    if (dob > now) return '생년월일은 현재 날짜보다 과거여야 합니다.'
    if (dob < new Date('1900-01-01')) return '올바른 생년월일을 입력해주세요.'

    // 13세 미만 방지
    const age = (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    if (age < 13) return '13세 이상만 가입할 수 있습니다.'

    return null
  }

  const validateRegisterData = (data: RegisterData): string | null => {
    return validateEmail(data.email) ||
      validatePassword(data.password) ||
      validateName(data.name) ||
      validatePhone(data.phone) ||
      validateDob(data.dob)
  }

  const validateLoginData = (data: LoginData): string | null => {
    return validateEmail(data.email) || validatePassword(data.password)
  }

  // 🔐 Firestore에 사용자 정보 저장
  const saveUserToFirestore = async (uid: string, userData: Partial<UserProfile>) => {
    try {
      const db = getFirebaseFirestore()
      const userRef = doc(db, 'users', uid)

      const dataToSave = {
        ...userData,
        uid,
        lastUpdated: serverTimestamp(),
        ...(userData.joinedAt ? {} : { joinedAt: serverTimestamp() })
      }

      await setDoc(userRef, dataToSave, { merge: true })
      console.log('✅ 사용자 정보 Firestore 저장 완료:', uid)
    } catch (error) {
      console.error('❌ 사용자 정보 저장 실패:', error)
      throw new Error('사용자 정보 저장에 실패했습니다.')
    }
  }

  // 🔐 Firestore에서 사용자 정보 로드
  const loadUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const db = getFirebaseFirestore()
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const data = userSnap.data()

        // Timestamp 처리 헬퍼 함수
        const convertTimestamp = (timestamp: any): Date | undefined => {
          if (!timestamp) return undefined
          if (timestamp instanceof Date) return timestamp
          if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate()
          }
          return undefined
        }

        return {
          uid,
          email: data.email,
          name: data.name || '',
          phone: data.phone,
          dob: convertTimestamp(data.dob),
          role: data.role || 'user',
          provider: data.provider || 'email',
          joinedAt: convertTimestamp(data.joinedAt) || new Date(),
          lastLoginAt: convertTimestamp(data.lastLoginAt),
          isTemporary: data.isTemporary || false,
          privacyConsent: data.privacyConsent,
          privacyConsentDate: convertTimestamp(data.privacyConsentDate),
          accessLevel: data.accessLevel || 'standard'
        } as UserProfile
      }

      return null
    } catch (error) {
      console.error('❌ 사용자 프로필 로드 실패:', error)
      return null
    }
  }

  // ✅ 이메일 로그인
  const loginWithEmail = async (data: LoginData): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      // 입력값 검증
      const validationError = validateLoginData(data)
      if (validationError) {
        error.value = validationError
        ElMessage.error(validationError)
        throw new Error(validationError)
      }

      const auth = getFirebaseAuth()
      const credential = await signInWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password
      )

      if (credential.user) {
        // 로그인 시간 업데이트
        await saveUserToFirestore(credential.user.uid, {
          lastLoginAt: new Date()
        })

        ElMessage.success('로그인에 성공했습니다.')
        console.log('✅ 이메일 로그인 성공:', credential.user.uid)
      }
    } catch (err: any) {
      console.error('❌ 이메일 로그인 실패:', err)

      let errorMessage = '로그인에 실패했습니다.'
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = '유효하지 않은 이메일 형식입니다.'
          break
        case 'auth/user-not-found':
        case 'auth/user-deleted':
          errorMessage = '존재하지 않는 계정입니다.'
          break
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
          break
        case 'auth/too-many-requests':
          errorMessage = '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'
          break
        case 'auth/network-request-failed':
          errorMessage = '네트워크 연결을 확인해주세요.'
          break
        case 'auth/user-disabled':
          errorMessage = '비활성화된 계정입니다. 관리자에게 문의하세요.'
          break
        default:
          errorMessage = err.message || '로그인 중 오류가 발생했습니다.'
      }

      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  // ✅ 이메일 회원가입
  const registerWithEmail = async (data: RegisterData): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      // 🔐 입력값 검증
      const validationError = validateRegisterData(data)
      if (validationError) {
        error.value = validationError
        ElMessage.error(validationError)
        throw new Error(validationError)
      }

      const auth = getFirebaseAuth()
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password
      )

      if (credential.user) {
        // 🔐 사용자 정보 저장
        await saveUserToFirestore(credential.user.uid, {
          email: data.email.trim(),
          name: data.name.trim(),
          phone: data.phone.trim(),
          dob: data.dob,
          role: 'user',
          provider: 'email',
          joinedAt: new Date(),
          lastLoginAt: new Date(),
          privacyConsent: true,
          privacyConsentDate: new Date(),
          accessLevel: 'standard'
        })

        // Firebase Auth 프로필 업데이트
        await updateProfile(credential.user, {
          displayName: data.name.trim()
        })

        ElMessage.success('회원가입이 완료되었습니다!')
        console.log('✅ 회원가입 성공:', credential.user.uid)
      }
    } catch (err: any) {
      console.error('❌ 회원가입 실패:', err)

      let errorMessage = '회원가입에 실패했습니다.'
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = '이미 가입된 이메일입니다.'
          break
        case 'auth/invalid-email':
          errorMessage = '유효하지 않은 이메일 형식입니다.'
          break
        case 'auth/weak-password':
          errorMessage = '비밀번호는 8자 이상이어야 하며 영문과 숫자를 포함해야 합니다.'
          break
        case 'auth/network-request-failed':
          errorMessage = '네트워크 연결을 확인해주세요.'
          break
        default:
          errorMessage = err.message || '회원가입 중 오류가 발생했습니다.'
      }

      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  // ✅ 익명 로그인 (게스트)
  const loginAsGuest = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const auth = getFirebaseAuth()

      // 기존 세션이 있다면 정리
      if (auth.currentUser) {
        await signOut(auth)
      }

      const credential = await signInAnonymously(auth)

      if (credential.user) {
        // 🔐 게스트 정보 저장
        await saveUserToFirestore(credential.user.uid, {
          role: 'guest',
          provider: 'anonymous',
          joinedAt: new Date(),
          lastLoginAt: new Date(),
          isTemporary: true,
          name: '게스트 사용자'
        })

        ElMessage.success('게스트로 로그인했습니다.')
        console.log('✅ 게스트 로그인 성공:', credential.user.uid)
      }
    } catch (err: any) {
      console.error('❌ 게스트 로그인 실패:', err)
      const errorMessage = '게스트 로그인에 실패했습니다.'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  // ✅ 게스트 → 회원 승격
  const upgradeGuestToUser = async (data: RegisterData): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const auth = getFirebaseAuth()
      const currentUser = auth.currentUser

      if (!currentUser || !currentUser.isAnonymous) {
        throw new Error('현재 게스트 사용자만 회원가입 승격이 가능합니다.')
      }

      // 🔐 입력값 검증
      const validationError = validateRegisterData(data)
      if (validationError) {
        error.value = validationError
        ElMessage.error(validationError)
        throw new Error(validationError)
      }

      // 기존 익명 계정 삭제 후 새 계정 생성
      await deleteUser(currentUser)

      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password
      )

      if (credential.user) {
        // 🔐 정식 사용자 정보 저장
        await saveUserToFirestore(credential.user.uid, {
          email: data.email.trim(),
          name: data.name.trim(),
          phone: data.phone.trim(),
          dob: data.dob,
          role: 'user',
          provider: 'email',
          joinedAt: new Date(),
          lastLoginAt: new Date(),
          privacyConsent: true,
          privacyConsentDate: new Date(),
          accessLevel: 'standard'
        })

        await updateProfile(credential.user, {
          displayName: data.name.trim()
        })

        ElMessage.success('회원가입이 완료되었습니다!')
        console.log('✅ 게스트 승격 성공:', credential.user.uid)
      }
    } catch (err: any) {
      console.error('❌ 게스트 승격 실패:', err)
      const errorMessage = err.message || '회원가입 승격에 실패했습니다.'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  // ✅ 비밀번호 재설정
  const resetPassword = async (email: string): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const emailError = validateEmail(email)
      if (emailError) {
        error.value = emailError
        ElMessage.error(emailError)
        throw new Error(emailError)
      }

      const auth = getFirebaseAuth()
      await sendPasswordResetEmail(auth, email.trim())

      ElMessage.success('비밀번호 재설정 이메일을 발송했습니다.')
      console.log('✅ 비밀번호 재설정 이메일 발송:', email)
    } catch (err: any) {
      console.error('❌ 비밀번호 재설정 실패:', err)

      let errorMessage = '비밀번호 재설정에 실패했습니다.'
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/user-deleted':
          errorMessage = '존재하지 않는 계정입니다.'
          break
        case 'auth/invalid-email':
          errorMessage = '유효하지 않은 이메일 형식입니다.'
          break
        default:
          errorMessage = err.message || '비밀번호 재설정 중 오류가 발생했습니다.'
      }

      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  // ✅ 로그아웃
  const logout = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const auth = getFirebaseAuth()
      await signOut(auth)

      // 상태 초기화
      user.value = null
      userProfile.value = null

      ElMessage.success('로그아웃되었습니다.')
      console.log('✅ 로그아웃 성공')
    } catch (err: any) {
      console.error('❌ 로그아웃 실패:', err)
      ElMessage.error('로그아웃에 실패했습니다.')
    } finally {
      isLoading.value = false
    }
  }

  // ✅ 인증 상태 초기화
  const initializeAuth = async (): Promise<void> => {
    try {
      const auth = getFirebaseAuth()

      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          try {
            user.value = firebaseUser

            if (firebaseUser) {
              // 사용자 프로필 로드
              const profile = await loadUserProfile(firebaseUser.uid)
              userProfile.value = profile

              console.log('🔐 인증 상태 변경:', {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                isAnonymous: firebaseUser.isAnonymous,
                role: profile?.role
              })
            } else {
              userProfile.value = null
              console.log('🔐 사용자 로그아웃됨')
            }
          } catch (profileError) {
            console.error('❌ 사용자 프로필 로드 실패:', profileError)
            userProfile.value = null
          } finally {
            isInitialized.value = true
            unsubscribe()
            resolve()
          }
        })
      })
    } catch (error) {
      console.error('❌ 인증 초기화 실패:', error)
      isInitialized.value = true
    }
  }

  // 사용자 프로필 업데이트
  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    try {
      if (!user.value) throw new Error('로그인된 사용자가 없습니다.')

      isLoading.value = true
      error.value = null

      // Firestore 업데이트
      await saveUserToFirestore(user.value.uid, updates)

      // 로컬 상태 업데이트
      if (userProfile.value) {
        userProfile.value = { ...userProfile.value, ...updates }
      }

      ElMessage.success('프로필이 업데이트되었습니다.')
    } catch (err: any) {
      console.error('❌ 프로필 업데이트 실패:', err)
      const errorMessage = err.message || '프로필 업데이트에 실패했습니다.'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  // 상태 및 액션 반환
  return {
    // 상태
    user: readonly(user),
    userProfile: readonly(userProfile),
    isLoading: readonly(isLoading),
    isInitialized: readonly(isInitialized),
    error: readonly(error),

    // 계산된 속성
    isLoggedIn,
    isAnonymous,
    isAdmin,
    currentRole,
    displayName,

    // 액션
    loginWithEmail,
    registerWithEmail,
    loginAsGuest,
    upgradeGuestToUser,
    resetPassword,
    logout,
    initializeAuth,
    updateUserProfile
  }
})
