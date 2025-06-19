// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 라우트 컴포넌트 지연 로딩
const SplashView = () => import('@/views/SplashView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const HomeView = () => import('@/views/HomeView.vue')
const LectureListView = () => import('@/views/LectureListView.vue')
const VideoPlayerView = () => import('@/views/VideoPlayerView.vue')
const CertificateView = () => import('@/views/CertificateView.vue')
const ProfileView = () => import('@/views/ProfileView.vue')

// 라우트 정의
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'splash',
    component: SplashView,
    meta: {
      title: 'QR 안전교육',
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
      icon: 'House'
    }
  },
  {
    path: '/lectures',
    name: 'lectures',
    component: LectureListView,
    meta: {
      title: '강의 목록',
      requiresAuth: true,
      icon: 'VideoPlay'
    }
  },
  {
    path: '/lectures/:id/watch',
    name: 'video-player',
    component: VideoPlayerView,
    props: true,
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
      icon: 'User'
    }
  },
  // QR 코드로 접근하는 특별 라우트
  {
    path: '/qr/:lectureId',
    name: 'qr-access',
    beforeEnter: (to) => {
      // QR 코드 접근 시 강의 페이지로 리다이렉트
      return { name: 'video-player', params: { id: to.params.lectureId } }
    }
  },
  // 404 페이지
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: '페이지를 찾을 수 없음',
      requiresAuth: false
    }
  }
]

// 라우터 생성
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 뒤로가기 시 이전 스크롤 위치 복원
    if (savedPosition) {
      return savedPosition
    }
    // 새 페이지로 이동 시 맨 위로 스크롤
    return { top: 0 }
  }
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
    // TODO: Firebase Analytics 페이지뷰 추적
    console.log(`페이지 뷰: ${to.name}`)
  }
  
  // 네이티브 앱에 페이지 변경 알림
  if (window.isNativeApp && window.Android) {
    window.Android.showToast(`페이지 이동: ${to.meta.title || to.name}`)
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