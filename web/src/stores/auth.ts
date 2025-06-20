// web/src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User,
  AuthErrorCodes,
  deleteUser
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseFirestore } from '@/services/firebase'
import { ElMessage, ElMessageBox } from 'element-plus'

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

  // 🔐 입력값 검증 함수
  const validateRegisterData = (data: RegisterData): string | null => {
    const { email, password, name, phone, dob } = data

    // 이메일 검증
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      return '올바른 이메일 형식을 입력해주세요.'
    }

    // 비밀번호 강도 검증
    if (password.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다.'
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return '비밀번호는 영문과 숫자를 모두 포함해야 합니다.'
    }

    // 이름 검증
    if (name.trim().length < 2) {
      return '이름은 2자 이상이어야 합니다.'
    }
    if (name.trim().length > 50) {
      return '이름은 50자를 초과할 수 없습니다.'
    }

    // 전화번호 검증
    if (phone && !/^[0-9-+().\s]{10,15}$/.test(phone)) {
      return '올바른 전화번호 형식을 입력해주세요.'
    }

    // 생년월일 검증
    const now = new Date()
    if (dob > now) {
      return '생년월일은 현재 날짜보다 과거여야 합니다.'
    }
    if (dob < new Date('1900-01-01')) {
      return '올바른 생년월일을 입력해주세요.'
    }

    // 13세 미만 방지
    const age = (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    if (age < 13) {
      return '13세 이상만 가입할 수 있습니다.'
    }

    return null
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
    } catch (error) {
      console.error('사용자 정보 저장 실패:', error)
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
        return {
          uid,
          email: data.email,
          name: data.name || '',
          phone: data.phone,
          dob: data.dob instanceof Timestamp ? data.dob.toDate() : data.dob,
          role: data.role || 'user',
          provider: data.provider || 'email',
          joinedAt: data.joinedAt instanceof Timestamp ? data.joinedAt.toDate() : data.joinedAt,
          lastLoginAt: data.lastLoginAt instanceof Timestamp ? data.lastLoginAt.toDate() : data.lastLoginAt,
          isTemporary: data.isTemporary || false,
          privacyConsent: data.privacyConsent,
          privacyConsentDate: data.privacyConsentDate instanceof Timestamp ? data.privacyConsentDate.toDate() : data.privacyConsentDate,
          accessLevel: data.accessLevel || 'standard'
        } as UserProfile
      }

      return null
    } catch (error) {
      console.error('사용자 프로필 로드 실패:', error)
      return null
    }
  }

  // ✅ 이메일 로그인
  const loginWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const auth = getFirebaseAuth()
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)

      if (credential.user) {
        // 로그인 시간 업데이트
        await saveUserToFirestore(credential.user.uid, {
          lastLoginAt: new Date()
        })

        ElMessage.success('로그인에 성공했습니다.')
      }
    } catch (err: any) {
      console.error('이메일 로그인 실패:', err)

      let errorMessage = '로그인에 실패했습니다.'
      switch (err.code) {
        case AuthErrorCodes.USER_DELETED:
        case AuthErrorCodes.INVALID_EMAIL:
          errorMessage = '존재하지 않는 계정입니다.'
          break
        case AuthErrorCodes.WRONG_PASSWORD:
          errorMessage = '잘못된 비밀번호입니다.'
          break
        case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
          errorMessage = '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'
          break
        case AuthErrorCodes.NETWORK_REQUEST_FAILED:
          errorMessage = '네트워크 연결을 확인해주세요.'
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

  // ✅ 회원가입
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

      // 기존 익명 사용자가 있다면 로그아웃
      if (auth.currentUser?.isAnonymous) {
        await signOut(auth)
      }

      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password
      )

      if (credential.user) {
        // 🔐 사용자 프로필 정보 저장
        const userProfileData: Partial<UserProfile> = {
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
        }

        await saveUserToFirestore(credential.user.uid, userProfileData)

        // Firebase Auth 프로필 업데이트
        await updateProfile(credential.user, {
          displayName: data.name.trim()
        })

        ElMessage.success('회원가입이 완료되었습니다.')
      }
    } catch (err: any) {
      console.error('회원가입 실패:', err)

      let errorMessage = '회원가입에 실패했습니다.'
      switch (err.code) {
        case AuthErrorCodes.EMAIL_EXISTS:
          errorMessage = '이미 가입된 이메일입니다.'
          break
        case AuthErrorCodes.INVALID_EMAIL:
          errorMessage = '유효하지 않은 이메일 형식입니다.'
          break
        case AuthErrorCodes.WEAK_PASSWORD:
          errorMessage = '비밀번호는 8자 이상이어야 하며 영문과 숫자를 포함해야 합니다.'
          break
        case AuthErrorCodes.NETWORK_REQUEST_FAILED:
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
      }
    } catch (err: any) {
      console.error('게스트 로그인 실패:', err)
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
      }
    } catch (err: any) {
      console.error('게스트 승격 실패:', err)
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

      const auth = getFirebaseAuth()
      await sendPasswordResetEmail(auth, email.trim())

      ElMessage.success('비밀번호 재설정 이메일을 발송했습니다.')
    } catch (err: any) {
      console.error('비밀번호 재설정 실패:', err)

      let errorMessage = '비밀번호 재설정에 실패했습니다.'
      switch (err.code) {
        case AuthErrorCodes.USER_DELETED:
          errorMessage = '존재하지 않는 계정입니다.'
          break
        case AuthErrorCodes.INVALID_EMAIL:
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

      const auth = getFirebaseAuth()

      // 게스트 사용자의 경우 Firestore 데이터도 삭제
      if (user.value?.isAnonymous && userProfile.value?.isTemporary) {
        try {
          const db = getFirebaseFirestore()
          await deleteDoc(doc(db, 'users', user.value.uid))
        } catch (deleteError) {
          console.warn('게스트 데이터 삭제 실패 (무시):', deleteError)
        }
      }

      await signOut(auth)

      // 상태 초기화
      user.value = null
      userProfile.value = null
      error.value = null

      ElMessage.success('로그아웃되었습니다.')
    } catch (err: any) {
      console.error('로그아웃 실패:', err)
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
            console.error('사용자 프로필 로드 실패:', profileError)
            userProfile.value = null
          } finally {
            isInitialized.value = true
            unsubscribe()
            resolve()
          }
        })
      })
    } catch (error) {
      console.error('인증 초기화 실패:', error)
      isInitialized.value = true
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
    initializeAuth
  }
})
