// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw, type RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 라우트 컴포넌트 지연 로딩
const SplashView = () => import('@/views/SplashView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const HomeView = () => import('@/views/HomeView.vue')
const LectureListView = () => import('@/views/LectureListView.vue')
const VideoPlayerView = () => import('@/views/VideoPlayerView.vue')
const CertificateView = () => import('@/views/CertificateView.vue')
const ProfileView = () => import('@/views/ProfileView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')

// 라우트 정의 - RouteRecordRaw 타입 명시
const routes: RouteRecordRaw[] = [
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
  // QR 라우트 - redirect 타입 수정
  {
    path: '/qr/:lectureId',
    name: 'qr-access',
    redirect: (to) => {
      // params를 string으로 변환
      return {
        name: 'video-player',
        params: { 
          id: String(to.params.lectureId) 
        }
      }
    }
  },
  // 404 페이지
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: {
      title: '페이지를 찾을 수 없습니다',
      requiresAuth: false,
      hideNavigation: true
    }
  }
]

// 라우터 생성
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 전역 네비게이션 가드
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 페이지 타이틀 설정
  const title = to.meta.title as string || 'QR 안전교육'
  document.title = title
  
  // TODO: 보안 - 라우트 접근 권한 검증 강화
  // TODO: 보안 - CSRF 토큰 검증
  // TODO: 보안 - 세션 타임아웃 체크
  
  // 인증이 필요한 페이지 체크
  const requiresAuth = to.meta.requiresAuth as boolean
  
  if (requiresAuth && !authStore.isAuthenticated) {
    // 인증되지 않은 경우 로그인 페이지로
    next({ 
      name: 'login',
      query: { redirect: to.fullPath }
    })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    // 이미 로그인한 경우 홈으로
    next({ name: 'home' })
  } else {
    next()
  }
})

// 라우터 에러 핸들링
router.onError((error) => {
  console.error('라우터 에러:', error)
  
  // TODO: 보안 - 에러 로깅 (민감한 정보 제외)
  
  // 에러 페이지로 리다이렉트
  router.push({ 
    name: 'not-found',
    params: { pathMatch: ['error'] }
  })
})

// 타입 정의
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    hideNavigation?: boolean
    icon?: string
  }
}

export default router