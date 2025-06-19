import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { User, ApiResponse } from '@/types/global'

// Firebase 관련 import
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { app as firebaseApp } from '@/services/firebase' // app을 firebaseApp으로 import

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  displayName: string
  phoneNumber?: string
  department?: string
  position?: string
  employeeId?: string
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  
  // 상태
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 계산된 속성
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isInstructor = computed(() => user.value?.role === 'instructor')
  const isStudent = computed(() => user.value?.role === 'student')

  // 로컬 스토리지에서 토큰 복원
  function initializeAuth() {
    const savedToken = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
      } catch (err) {
        console.error('인증 정보 복원 실패:', err)
        clearAuth()
      }
    }
  }

  // 이메일/비밀번호 로그인
  async function login(credentials: LoginCredentials): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      // TODO: 실제 API 호출로 교체
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 더미 응답
      const response: ApiResponse<{ user: User; token: string; refreshToken: string }> = {
        success: true,
        data: {
          user: {
            id: '1',
            email: credentials.email,
            displayName: '홍길동',
            photoURL: 'https://via.placeholder.com/150',
            phoneNumber: '010-1234-5678',
            department: '안전관리팀',
            position: '대리',
            employeeId: 'EMP001',
            createdAt: new Date('2024-01-01'),
            lastLoginAt: new Date(),
            isActive: true,
            role: 'student'
          },
          token: 'dummy-jwt-token',
          refreshToken: 'dummy-refresh-token'
        },
        timestamp: new Date()
      }

      if (response.success && response.data) {
        user.value = response.data.user
        token.value = response.data.token
        refreshToken.value = response.data.refreshToken

        // 로컬 스토리지에 저장
        if (credentials.rememberMe) {
          localStorage.setItem('authToken', response.data.token)
          localStorage.setItem('user', JSON.stringify(response.data.user))
        } else {
          sessionStorage.setItem('authToken', response.data.token)
          sessionStorage.setItem('user', JSON.stringify(response.data.user))
        }

        return true
      }

      throw new Error('로그인에 실패했습니다.')
    } catch (err) {
      error.value = err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 구글 로그인
  async function signInWithGoogle(): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const auth = getAuth(firebaseApp ?? undefined)
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const googleUser = result.user

      // 실제 서비스에서는 googleUser에서 필요한 정보를 추출해 서버에 회원가입/로그인 처리
      // 여기서는 더미 사용자로 처리
      const googleProfile: User = {
        id: googleUser.uid,
        email: googleUser.email || '',
        displayName: googleUser.displayName || 'Google 사용자',
        photoURL: googleUser.photoURL || '',
        phoneNumber: googleUser.phoneNumber || '',
        department: '',
        position: '',
        employeeId: '',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true,
        role: 'student'
      }

      user.value = googleProfile
      token.value = await googleUser.getIdToken()
      refreshToken.value = googleUser.refreshToken

      // 로컬 스토리지에 저장
      localStorage.setItem('authToken', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))

      return true
    } catch (err: any) {
      error.value = err.message || 'Google 로그인에 실패했습니다.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 회원가입
  async function register(data: RegisterData): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      // TODO: 실제 API 호출로 교체
      await new Promise(resolve => setTimeout(resolve, 1500))

      // 더미 응답
      const response: ApiResponse<{ user: User; token: string }> = {
        success: true,
        data: {
          user: {
            id: Date.now().toString(),
            ...data,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            isActive: true,
            role: 'student'
          },
          token: 'dummy-jwt-token'
        },
        timestamp: new Date()
      }

      if (response.success) {
        return true
      }

      throw new Error('회원가입에 실패했습니다.')
    } catch (err) {
      error.value = err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 로그아웃
  async function logout() {
    try {
      // TODO: 서버에 로그아웃 요청
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      console.error('로그아웃 요청 실패:', err)
    } finally {
      clearAuth()
    }
  }

  // 인증 정보 삭제
  function clearAuth() {
    user.value = null
    token.value = null
    refreshToken.value = null
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('user')
  }

  // 토큰 갱신
  async function refreshAuthToken(): Promise<boolean> {
    if (!refreshToken.value) return false

    try {
      // TODO: 실제 API 호출로 교체
      await new Promise(resolve => setTimeout(resolve, 500))

      // 더미 응답
      const newToken = 'new-dummy-jwt-token'
      token.value = newToken
      
      // 스토리지 업데이트
      if (localStorage.getItem('authToken')) {
        localStorage.setItem('authToken', newToken)
      } else if (sessionStorage.getItem('authToken')) {
        sessionStorage.setItem('authToken', newToken)
      }

      return true
    } catch (err) {
      console.error('토큰 갱신 실패:', err)
      clearAuth()
      await router.push('/login')
      return false
    }
  }

  // 프로필 업데이트
  async function updateProfile(updates: Partial<User>): Promise<boolean> {
    if (!user.value) return false

    isLoading.value = true
    error.value = null

    try {
      // TODO: 실제 API 호출로 교체
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 사용자 정보 업데이트
      user.value = { ...user.value, ...updates }
      
      // 스토리지 업데이트
      if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(user.value))
      } else if (sessionStorage.getItem('user')) {
        sessionStorage.setItem('user', JSON.stringify(user.value))
      }

      return true
    } catch (err) {
      error.value = '프로필 업데이트에 실패했습니다.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 비밀번호 변경
  async function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      // TODO: 실제 API 호출로 교체
      await new Promise(resolve => setTimeout(resolve, 1000))
      return true
    } catch (err) {
      error.value = '비밀번호 변경에 실패했습니다.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 상태
    user,
    token,
    isLoading,
    error,

    // 계산된 속성
    isAuthenticated,
    isAdmin,
    isInstructor,
    isStudent,

    // 액션
    initializeAuth,
    login,
    signInWithGoogle, // 구글 로그인 추가
    register,
    logout,
    clearAuth,
    refreshAuthToken,
    updateProfile,
    changePassword
  }
})