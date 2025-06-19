// src/router/index.ts - TypeScript 오류 수정 버전
import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 인터페이스 정의
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

interface QRCodeData {
  type: string
  lectureId?: string
  userId?: string
  [key: string]: any
}

// 라우트 컴포넌트 지연 로딩
const SplashView = () => import('@/views/SplashView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const HomeView = () => import('@/views/HomeView.vue')
const LectureListView = () => import('@/views/LectureListView.vue')
const VideoPlayerView = () => import('@/views/VideoPlayerView.vue')
const CertificateView = () => import('@/views/CertificateView.vue')
const ProfileView = () => import('@/views/ProfileView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')

// 라우트 정의
const routes = [
  {
    path: '/',
    name: 'splash',
    component: SplashView,
    meta: {
      title: '스플래시',
      requiresAuth: false,
      hideNavigation: true
    }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      title: '로그인',
      requiresAuth: false,
      hideNavigation: true
    }
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: {
      title: '홈',
      requiresAuth: true,
      hideNavigation: false,
      icon: 'House'
    }
  },
  {
    path: '/lectures',
    name: 'lectures',
    component: LectureListView,
    meta: {
      title: '강의',
      requiresAuth: true,
      hideNavigation: false,
      icon: 'VideoPlay'
    }
  },
  {
    path: '/lectures/:id/watch',
    name: 'video-player',
    component: VideoPlayerView,
    meta: {
      title: '강의 시청',
      requiresAuth: true,
      hideNavigation: true
    }
  },
  {
    path: '/certificates',
    name: 'certificates',
    component: CertificateView,
    meta: {
      title: '수료증',
      requiresAuth: true,
      hideNavigation: false,
      icon: 'Medal'
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: {
      title: '프로필',
      requiresAuth: true,
      hideNavigation: false,
      icon: 'User'
    }
  },
  // QR 라우트 - 타입 오류 수정
  {
    path: '/qr/:lectureId',
    name: 'qr-access',
    redirect: (to: RouteLocationNormalized) => ({
      name: 'video-player',
      params: { id: String(to.params.lectureId) }
    })
  },
  // 404 페이지
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: {
      title: '404',
      requiresAuth: false,
      hideNavigation: true
    }
  }
] as const

// 라우터 생성
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 전역 네비게이션 가드
router.beforeEach(async (to, from, next) => {
  console.log(`라우팅: ${from.path} → ${to.path}`)
  
  const authStore = useAuthStore()
  
  // 인증이 필요한 페이지인지 확인
  const requiresAuth = to.meta.requiresAuth
  
  // 스플래시 페이지가 아닌 경우에만 인증 확인
  if (to.name !== 'splash') {
    // 인증 상태 확인 (아직 확인되지 않은 경우)
    if (!authStore.isInitialized) {
      try {
        await authStore.checkAuthState()
      } catch (error) {
        console.error('인증 상태 확인 실패:', error)
      }
    }
    
    // 인증이 필요한 페이지에 비로그인 상태로 접근
    if (requiresAuth && !authStore.isAuthenticated) {
      console.log('인증 필요 - 로그인 페이지로 리다이렉트')
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
    
    // 이미 로그인된 상태에서 로그인/스플래시 페이지 접근
    if (!requiresAuth && authStore.isAuthenticated && (to.name === 'login' || to.name === 'splash')) {
      console.log('이미 인증됨 - 홈으로 리다이렉트')
      next({ name: 'home' })
      return
    }
  }
  
  // 페이지 제목 설정
  if (to.meta.title) {
    document.title = `${to.meta.title} - QR 안전교육`
  }
  
  next()
})

// 라우팅 후 처리
router.afterEach((to, from) => {
  // 페이지 변경 분석 (Firebase Analytics)
  if (import.meta.env.PROD) {
    console.log(`페이지 뷰: ${String(to.name)}`)
  }
  
  // 네이티브 앱에 페이지 변경 알림
  if (window.isNativeApp && window.Android) {
    window.Android.showToast(`페이지 이동: ${to.meta.title || String(to.name)}`)
  }
})

// 라우터 에러 핸들링
router.onError((error) => {
  console.error('라우터 에러:', error)
  
  // 치명적인 라우팅 에러 시 홈으로 리다이렉트
  if (error.message.includes('Failed to fetch')) {
    console.log('라우트 로딩 실패 - 홈으로 리다이렉트')
    router.push('/home')
  }
})

export default router

// 라우터 유틸리티 함수들
export const navigationItems = [
  {
    name: 'home',
    title: '홈',
    icon: 'House',
    path: '/home'
  },
  {
    name: 'lectures',
    title: '강의',
    icon: 'VideoPlay',
    path: '/lectures'
  },
  {
    name: 'certificates',
    title: '수료증',
    icon: 'Medal',
    path: '/certificates'
  },
  {
    name: 'profile',
    title: '프로필',
    icon: 'User',
    path: '/profile'
  }
]

// 라우트 메타데이터 타입 확장
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    hideNavigation?: boolean
    icon?: string
  }
}

// 타입 내보내기
export type { User, QRCodeData }