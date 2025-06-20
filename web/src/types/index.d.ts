// web/src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

// 🔐 라우트 메타 타입 확장
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
    hideForAuth?: boolean
    title?: string
    description?: string
    showInNav?: boolean
    icon?: string
  }
}

// 📱 컴포넌트 지연 로딩 (성능 최적화)
const routes: Array<RouteRecordRaw> = [
  // 🏠 루트 리다이렉트
  {
    path: '/',
    redirect: (to) => {
      // 인증 상태에 따라 다른 페이지로 리다이렉트
      const authStore = useAuthStore()
      return authStore.isAuthenticated ? '/home' : '/login'
    }
  },

  // 🔐 인증 관련 라우트
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('../views/auth/LoginView.vue'),
        alias: '/login', // 단축 경로 지원
        meta: {
          hideForAuth: true,
          title: '로그인 - QR 안전교육',
          description: 'QR 안전교육 서비스에 로그인하세요'
        }
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('../views/auth/RegisterView.vue'),
        alias: '/register', // 단축 경로 지원
        meta: {
          hideForAuth: true,
          title: '회원가입 - QR 안전교육',
          description: 'QR 안전교육 서비스에 가입하세요'
        }
      }
    ]
  },

  // 🏠 홈 화면 (일반 사용자 전용)
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/home/HomeView.vue'),
    meta: {
      requiresAuth: true,
      title: 'QR 안전교육',
      description: '스마트한 안전교육 플랫폼',
      showInNav: true,
      icon: 'home'
    }
  },

  // 📚 강의 관련 라우트
  {
    path: '/courses',
    children: [
      {
        path: '',
        name: 'CourseList',
        component: () => import('../views/course/CourseListView.vue'),
        meta: {
          requiresAuth: true,
          title: '강의 목록 - QR 안전교육',
          description: '다양한 안전교육 강의를 둘러보세요',
          showInNav: true,
          icon: 'academic-cap'
        }
      },
      {
        path: ':id',
        name: 'CourseDetail',
        component: () => import('../views/course/CourseDetailView.vue'),
        props: true,
        meta: {
          requiresAuth: true,
          title: '강의 상세 - QR 안전교육'
        }
      },
      {
        path: ':id/enroll',
        name: 'CourseEnroll',
        component: () => import('../views/course/CourseEnrollView.vue'),
        props: true,
        meta: {
          requiresAuth: true,
          title: '강의 신청 - QR 안전교육'
        }
      },
      {
        path: 'my',
        name: 'MyCourses',
        component: () => import('../views/course/MyCoursesView.vue'),
        alias: '/my-courses', // 기존 경로 호환성
        meta: {
          requiresAuth: true,
          title: '내 강의 - QR 안전교육',
          description: '수강 중인 강의를 확인하세요',
          showInNav: true,
          icon: 'book-open'
        }
      }
    ]
  },

  // 🎓 학습 관련 라우트 (Flutter의 LearningView, VideoPlayerView)
  {
    path: '/learning',
    children: [
      {
        path: ':courseId/:lessonId',
        name: 'Learning',
        component: () => import('../views/learning/LearningView.vue'),
        props: true,
        meta: {
          requiresAuth: true,
          title: '학습 중 - QR 안전교육'
        }
      },
      {
        path: 'video/:videoId',
        name: 'VideoPlayer',
        component: () => import('../views/learning/VideoPlayerView.vue'),
        alias: '/video/:videoId', // 기존 경로 호환성
        props: true,
        meta: {
          requiresAuth: true,
          title: '동영상 학습 - QR 안전교육'
        }
      },
      {
        path: 'warning/:id?',
        name: 'VideoWarning',
        component: () => import('../views/learning/VideoWarningView.vue'),
        alias: '/video-warning/:id?', // 기존 경로 호환성
        props: true,
        meta: {
          requiresAuth: true,
          title: '안전 주의사항 - QR 안전교육'
        }
      }
    ]
  },

  // 🏆 수료증 관련 (Flutter의 CompletedLecturesScreen)
  {
    path: '/certificates',
    name: 'Certificates',
    component: () => import('../views/certificate/CertificateListView.vue'),
    meta: {
      requiresAuth: true,
      title: '수료증 - QR 안전교육',
      description: '취득한 수료증을 확인하세요',
      showInNav: true,
      icon: 'trophy'
    }
  },

  // 📱 QR 스캔 (네이티브 우선, 웹 폴백)
  {
    path: '/qr-scan',
    name: 'QRScan',
    component: () => import('../views/qr/QRScanView.vue'),
    meta: {
      title: 'QR 스캔 - QR 안전교육',
      description: 'QR 코드를 스캔하여 교육에 참여하세요',
      showInNav: true,
      icon: 'qr-code'
    }
  },

  // 👤 프로필 (Flutter의 ProfileScreen)
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/profile/ProfileView.vue'),
    meta: {
      requiresAuth: true,
      title: '프로필 - QR 안전교육',
      description: '개인정보 및 설정을 관리하세요',
      showInNav: true,
      icon: 'user'
    }
  },

  // 🔧 관리자 라우트 (Flutter의 AdminDashboardScreen)
  {
    path: '/admin',
    redirect: '/admin/dashboard',
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/AdminDashboardView.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: '관리자 대시보드 - QR 안전교육'
        }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/AdminUsersView.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: '사용자 관리 - QR 안전교육'
        }
      },
      {
        path: 'users/:id',
        name: 'UserDetail',
        component: () => import('../views/admin/UserDetailView.vue'),
        props: true,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: '사용자 상세 - QR 안전교육'
        }
      },
      {
        path: 'packages',
        name: 'AdminPackages',
        component: () => import('../views/admin/AdminLecturePackageView.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: '강의 패키지 관리 - QR 안전교육'
        }
      }
    ]
  },

  // 📄 정적 페이지
  {
    path: '/static',
    children: [
      {
        path: 'about',
        name: 'About',
        component: () => import('../views/static/AboutView.vue'),
        alias: '/about',
        meta: {
          title: '소개 - QR 안전교육',
          description: 'QR 안전교육 서비스를 소개합니다'
        }
      },
      {
        path: 'privacy',
        name: 'Privacy',
        component: () => import('../views/static/PrivacyView.vue'),
        alias: '/privacy',
        meta: {
          title: '개인정보처리방침 - QR 안전교육'
        }
      },
      {
        path: 'terms',
        name: 'Terms',
        component: () => import('../views/static/TermsView.vue'),
        alias: '/terms',
        meta: {
          title: '이용약관 - QR 안전교육'
        }
      }
    ]
  },

  // 🚫 에러 페이지
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: {
      title: '페이지를 찾을 수 없습니다 - QR 안전교육'
    }
  },

  // 🔄 모든 매칭되지 않는 경로 → 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

// 🚀 라우터 생성
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 📱 모바일 친화적 스크롤 동작
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 80 // 헤더 높이 고려
      }
    }

    // 페이지 전환 시 부드러운 스크롤
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ top: 0, behavior: 'smooth' })
      }, 100)
    })
  }
})

// 🔐 글로벌 네비게이션 가드
router.beforeEach(async (to, from, next) => {
  try {
    const authStore = useAuthStore()

    // 🔄 인증 상태 초기화 대기 (최대 3초)
    if (!authStore.isInitialized) {
      console.log('🔄 인증 상태 초기화 대기 중...')
      let attempts = 0
      while (!authStore.isInitialized && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }

      if (!authStore.isInitialized) {
        console.warn('⚠️ 인증 상태 초기화 타임아웃')
      }
    }

    // 🏠 페이지 제목 및 메타 태그 설정
    if (to.meta.title) {
      document.title = to.meta.title
    }

    if (to.meta.description) {
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.setAttribute('content', to.meta.description)
      }
    }

    // 🚫 로그인되지 않은 사용자는 로그인 페이지로
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      ElMessage.warning('로그인이 필요한 서비스입니다.')
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 🚫 로그인된 사용자가 로그인/회원가입 페이지 접근 시 홈으로 리다이렉트
    if (to.meta.hideForAuth && authStore.isAuthenticated) {
      next('/home')
      return
    }

    // 🔐 관리자 권한 체크
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      ElMessage.error('관리자 권한이 필요합니다.')
      next('/home')
      return
    }

    // 📱 네이티브 앱에서 페이지 변경 알림
    if (window.Android && window.Android.onPageChanged) {
      window.Android.onPageChanged(to.path, to.meta.title || '')
    }

    // ✅ 모든 검사 통과
    next()

  } catch (error) {
    console.error('🚫 라우터 가드 오류:', error)
    ElMessage.error('페이지 이동 중 오류가 발생했습니다.')
    next('/home')
  }
})

// 🔄 네비게이션 완료 후 처리
router.afterEach((to, from) => {
  console.log(`🔗 라우터 이동: ${from.path} → ${to.path}`)

  // 📊 분석 추적 (Google Analytics, Firebase Analytics 등)
  if (import.meta.env.VITE_GA_TRACKING_ID && typeof gtag !== 'undefined') {
    gtag('config', import.meta.env.VITE_GA_TRACKING_ID, {
      page_path: to.path,
      page_title: to.meta.title
    })
  }

  // 📱 네이티브 앱 분석 전송
  if (window.Android && window.Android.trackPageView) {
    window.Android.trackPageView(to.path, to.meta.title || '')
  }
})

// 🚫 라우터 오류 처리
router.onError((error) => {
  console.error('🚫 라우터 오류:', error)
  ElMessage.error('페이지 로드 중 오류가 발생했습니다.')

  // 오류 리포팅 (선택사항)
  if (import.meta.env.VITE_ERROR_REPORTING_URL) {
    fetch(import.meta.env.VITE_ERROR_REPORTING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'router_error',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {}) // 에러 리포팅 실패는 무시
  }
})

export default router

// 🔧 라우터 유틸리티 함수들
export const routerUtils = {
  /**
   * 안전한 뒤로가기 (히스토리가 없으면 홈으로)
   */
  goBack: () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/home')
    }
  },

  /**
   * 로그인 후 리다이렉트 설정
   */
  setRedirectAfterLogin: (path: string) => {
    sessionStorage.setItem('redirectAfterLogin', path)
  },

  /**
   * 로그인 후 리다이렉트 실행
   */
  redirectAfterLogin: () => {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin')
    if (redirectPath && redirectPath !== '/login') {
      sessionStorage.removeItem('redirectAfterLogin')
      router.push(redirectPath)
    } else {
      router.push('/home')
    }
  },

  /**
   * 네비게이션에 표시할 라우트 목록 가져오기
   */
  getNavRoutes: () => {
    return routes
      .flatMap(route =>
        route.children ? route.children : [route]
      )
      .filter(route => route.meta?.showInNav)
      .map(route => ({
        name: route.name,
        path: route.path,
        title: route.meta?.title?.split(' - ')[0] || route.name,
        icon: route.meta?.icon,
        requiresAuth: route.meta?.requiresAuth
      }))
  },

  /**
   * 현재 라우트 체크
   */
  isCurrentRoute: (routeName: string): boolean => {
    return router.currentRoute.value.name === routeName
  },

  /**
   * 쿼리 파라미터 업데이트 (페이지 이동 없이)
   */
  updateQuery: (query: Record<string, any>) => {
    router.replace({
      query: {
        ...router.currentRoute.value.query,
        ...query
      }
    })
  },

  /**
   * 브레드크럼 생성
   */
  getBreadcrumbs: () => {
    const matched = router.currentRoute.value.matched
    return matched
      .filter(route => route.meta?.title)
      .map(route => ({
        name: route.name,
        title: route.meta?.title?.split(' - ')[0],
        path: route.path
      }))
  }
}

// 🌐 전역 타입 선언 (네이티브 브릿지)
declare global {
  interface Window {
    Android?: {
      onPageChanged?: (path: string, title: string) => void
      trackPageView?: (path: string, title: string) => void
      startQRScan?: () => void
    }
  }
}
