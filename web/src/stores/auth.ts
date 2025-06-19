import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { User } from '@/types/global'

// Firebase 관련 import
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { app as firebaseApp } from '@/services/firebase'

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
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isInstructor = computed(() => user.value?.role === 'instructor')
  const isStudent = computed(() => user.value?.role === 'student')

  function initializeAuth() {
    const savedToken = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
      } catch (err) {
        clearAuth()
      }
    }
  }

  // Firebase 이메일/비밀번호 로그인
  async function login(credentials: LoginCredentials): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      const auth = getAuth(firebaseApp ?? undefined)
      const result = await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
      const firebaseUser = result.user

      const userProfile: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        phoneNumber: firebaseUser.phoneNumber || '',
        department: '',
        position: '',
        employeeId: '',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true,
        role: 'student'
      }

      user.value = userProfile
      token.value = await firebaseUser.getIdToken()
      refreshToken.value = firebaseUser.refreshToken

      if (credentials.rememberMe) {
        localStorage.setItem('authToken', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))
      } else {
        sessionStorage.setItem('authToken', token.value)
        sessionStorage.setItem('user', JSON.stringify(user.value))
      }

      return true
    } catch (err: any) {
      error.value = err.message || '로그인에 실패했습니다.'
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

  async function register(data: RegisterData): Promise<boolean> {
    // 실제 회원가입 로직 필요 (Firebase Auth createUserWithEmailAndPassword 등)
    return false
  }

  async function logout() {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      //
    } finally {
      clearAuth()
    }
  }

  function clearAuth() {
    user.value = null
    token.value = null
    refreshToken.value = null
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('user')
  }

  async function refreshAuthToken(): Promise<boolean> {
    // 실제 토큰 갱신 로직 필요
    return false
  }

  async function updateProfile(updates: Partial<User>): Promise<boolean> {
    if (!user.value) return false
    user.value = { ...user.value, ...updates }
    if (localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(user.value))
    } else if (sessionStorage.getItem('user')) {
      sessionStorage.setItem('user', JSON.stringify(user.value))
    }
    return true
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    // 실제 비밀번호 변경 로직 필요
    return false
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    isInstructor,
    isStudent,
    initializeAuth,
    login,
    signInWithGoogle,
    register,
    logout,
    clearAuth,
    refreshAuthToken,
    updateProfile,
    changePassword
  }
})