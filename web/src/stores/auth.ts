// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  email: string
  name: string
  photoURL?: string
  role: 'student' | 'instructor' | 'admin'
  createdAt: Date
  lastLoginAt: Date
}

export const useAuthStore = defineStore('auth', () => {
  // 상태
  const user = ref<User | null>(null)
  const isInitialized = ref(false)
  const isLoading = ref(false)

  // 계산된 속성
  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role || 'student')

  // 액션
  const checkAuthState = async (): Promise<void> => {
    try {
      isLoading.value = true
      
      // TODO: Firebase Auth 상태 확인
      // const currentUser = await getCurrentUser()
      // if (currentUser) {
      //   user.value = await getUserProfile(currentUser.uid)
      // }
      
      // 임시 테스트용 데이터
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        user.value = JSON.parse(savedUser)
      }
      
    } catch (error) {
      console.error('인증 상태 확인 오류:', error)
      user.value = null
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  const signInWithEmail = async (
    email: string, 
    password: string, 
    rememberMe: boolean = false
  ): Promise<void> => {
    try {
      isLoading.value = true
      
      // TODO: Firebase Auth 로그인
      // const credential = await signInWithEmailAndPassword(auth, email, password)
      // user.value = await getUserProfile(credential.user.uid)
      
      // 임시 테스트용 로그인
      const testUser: User = {
        id: '1',
        email: email,
        name: '테스트 사용자',
        role: 'student',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }
      
      user.value = testUser
      
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(testUser))
      }
      
    } catch (error) {
      console.error('로그인 오류:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const signInWithGoogle = async (): Promise<void> => {
    try {
      isLoading.value = true
      
      // TODO: Google 로그인 구현
      // const credential = await signInWithPopup(auth, googleProvider)
      // user.value = await getUserProfile(credential.user.uid)
      
      throw new Error('Google 로그인은 아직 구현되지 않았습니다.')
      
    } catch (error) {
      console.error('Google 로그인 오류:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      isLoading.value = true
      
      // TODO: Firebase Auth 로그아웃
      // await signOut(auth)
      
      user.value = null
      localStorage.removeItem('user')
      
    } catch (error) {
      console.error('로그아웃 오류:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    try {
      if (!user.value) throw new Error('로그인이 필요합니다.')
      
      isLoading.value = true
      
      // TODO: Firebase Firestore 업데이트
      // await updateUserProfile(user.value.id, updates)
      
      user.value = { ...user.value, ...updates }
      localStorage.setItem('user', JSON.stringify(user.value))
      
    } catch (error) {
      console.error('프로필 업데이트 오류:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const resetPassword = async (email: string): Promise<void> => {
    try {
      isLoading.value = true
      
      // TODO: Firebase Auth 비밀번호 재설정
      // await sendPasswordResetEmail(auth, email)
      
      console.log('비밀번호 재설정 이메일 전송:', email)
      
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 상태
    user,
    isInitialized,
    isLoading,
    
    // 계산된 속성
    isAuthenticated,
    userRole,
    
    // 액션
    checkAuthState,
    signInWithEmail,
    signInWithGoogle,
    logout,
    updateProfile,
    resetPassword
  }
})