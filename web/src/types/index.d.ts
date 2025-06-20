// web/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

// 🔐 라우트 메타 타입 정의
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresGuest?: boolean
    requiresAdmin?: boolean
    title?: string
    description?: string
  }
}

// 라우트 정의
const routes = [
  // 🏠 홈
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/home/HomeView.vue'),
    meta: {
      title: 'QR 안전교육',
      description: '스마트한 안전교육 플랫폼'
    }
  },

  // 🔐 인증 관련
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: {
          requiresGuest: true,
          title: '로그인 - QR 안전교육',
          description: 'QR 안전교육 서비스에 로그인하세요'
        }
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/auth/RegisterView.vue'),
        meta: {
          requiresGuest: true,
          title: '회원가입 - QR 안전교육',
          description: 'QR 안전교육 서비스에 가입하세요'
        }
      }
    ]
  },

  // 📚 강의 관련
  {
    path: '/courses',
    children: [
      {
        path: '',
        name: 'CourseList',
        component: () => import('@/views/course/CourseListView.vue'),
        meta: {
          title: '강의 목록 - QR 안전교육',
          description: '다양한 안전교육 강의를 둘러보세요'
        }
      },
      {
        path: ':id',
        name: 'CourseDetail',
        component: () => import('@/views/course/CourseDetailView.vue'),
        meta: {
          title: '강의 상세 - QR 안전교육'
        }
      },
      {
        path: ':id/enroll',
        name: 'CourseEnroll',
        component: () => import('@/views/course/CourseEnrollView.vue'),
        meta: {
          requiresAuth: true,
          title: '강의 신청 - QR 안전교육'
        }
      },
      {
        path: 'my',
        name: 'MyCourses',
        component: () => import('@/views/course/MyCoursesView.vue'),
        meta: {
          requiresAuth: true,
          title: '내 강의 - QR 안전교육',
          description: '수강 중인 강의를 확인하세요'
        }
      }
    ]
  },

  // 🎓 학습 관련
  {
    path: '/learning',
    children: [
      {
        path: ':courseId/:lessonId',
        name: 'Learning',
        component: () => import('@/views/learning/LearningView.vue'),
        meta: {
          requiresAuth: true,
          title: '학습 중 - QR 안전교육'
        }
      },
      {
        path: 'video/:videoId',
        name: 'VideoPlayer',
        component: () => import('@/views/learning/VideoPlayerView.vue'),
        meta: {
          requiresAuth: true,
          title: '동영상 학습 - QR 안전교육'
        }
      },
      {
        path: 'warning',
        name: 'VideoWarning',
        component: () => import('@/views/learning/VideoWarningView.vue'),
        meta: {
          requiresAuth: true,
          title: '안전 주의사항 - QR 안전교육'
        }
      }
    ]
  },

  // 🏆 수료증 관련
  {
    path: '/certificates',
    name: 'Certificates',
    component: () => import('@/views/certificate/CertificateListView.vue'),
    meta: {
      requiresAuth: true,
      title: '수료증 - QR 안전교육',
      description: '취득한 수료증을 확인하세요'
    }
  },

  // 📱 QR 스캔
  {
    path: '/qr-scan',
    name: 'QRScan',
    component: () => import('@/views/qr/QRScanView.vue'),
    meta: {
      title: 'QR 스캔 - QR 안전교육',
      description: 'QR 코드를 스캔하여 교육에 참여하세요'
    }
  },

  // 👤 프로필
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/ProfileView.vue'),
    meta: {
      requiresAuth: true,
      title: '프로필 - QR 안전교육',
      description: '개인정보 및 설정을 관리하세요'
    }
  },

  // 🔧 관리자 (추후 구현)
  {
    path: '/admin',
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/AdminDashboardView.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: '관리자 대시보드 - QR 안전교육'
        }
      }
    ]
  },

  // 📄 정적 페이지
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/static/AboutView.vue'),
    meta: {
      title: '소개 - QR 안전교육',
      description: 'QR 안전교육 서비스를 소개합니다'
    }
  },

  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('@/views/static/PrivacyView.vue'),
    meta: {
      title: '개인정보처리방침 - QR 안전교육'
    }
  },

  {
    path: '/terms',
    name: 'Terms',
    component: () => import('@/views/static/TermsView.vue'),
    meta: {
      title: '이용약관 - QR 안전교육'
    }
  },

  // 🚫 404 페이지
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/NotFoundView.vue'),
    meta: {
      title: '페이지를 찾을 수 없습니다 - QR 안전교육'
    }
  },

  // 🚫 리다이렉트 (모든 매칭되지 않는 경로)
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

// 라우터 생성
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 저장된 스크롤 위치가 있으면 복원
    if (savedPosition) {
      return savedPosition
    }
    // 해시가 있으면 해당 요소로 스크롤
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }
    // 기본적으로 페이지 상단으로
    return { top: 0 }
  }
})

// 🔐 라우터 가드
router.beforeEach(async (to, from, next) => {
  try {
    const authStore = useAuthStore()

    // 🔄 인증 상태가 초기화되지 않았다면 대기
    if (!authStore.isInitialized) {
      console.log('🔄 인증 상태 초기화 대기 중...')
      // 최대 5초 대기
      let attempts = 0
      while (!authStore.isInitialized && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
    }

    // 🏠 페이지 제목 설정
    if (to.meta.title) {
      document.title = to.meta.title
    }

    // 🏠 메타 태그 설정
    if (to.meta.description) {
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.setAttribute('content', to.meta.description)
      }
    }

    // 🔐 인증이 필요한 페이지
    if (to.meta.requiresAuth) {
      if (!authStore.isLoggedIn) {
        ElMessage.warning('로그인이 필요한 서비스입니다.')
        next({
          name: 'Login',
          query: { redirect: to.fullPath }
        })
        return
      }

      // 🔐 관리자 권한이 필요한 페이지
      if (to.meta.requiresAdmin && !authStore.isAdmin) {
        ElMessage.error('관리자 권한이 필요합니다.')
        next({ name: 'Home' })
        return
      }
    }

    // 🚫 게스트만 접근 가능한 페이지 (로그인, 회원가입)
    if (to.meta.requiresGuest && authStore.isLoggedIn) {
      // 이미 로그인된 사용자는 홈으로 리다이렉트
      next({ name: 'Home' })
      return
    }

    // 🔗 게스트 사용자를 위한 특별 처리
    if (authStore.isAnonymous) {
      // 게스트 사용자가 회원가입 페이지로 이동 시 업그레이드 모드
      if (to.name === 'Register') {
        next({
          name: 'Register',
          query: { upgrade: 'true' }
        })
        return
      }
    }

    // ✅ 모든 검사 통과
    next()

  } catch (error) {
    console.error('🚫 라우터 가드 오류:', error)
    ElMessage.error('페이지 이동 중 오류가 발생했습니다.')
    next({ name: 'Home' })
  }
})

// 🔄 라우터 이동 후 처리
router.afterEach((to, from) => {
  console.log(`🔗 라우터 이동: ${from.path} → ${to.path}`)

  // 🎯 Google Analytics 등 추적 코드 (필요시)
  if (import.meta.env.VITE_GA_TRACKING_ID) {
    // gtag('config', import.meta.env.VITE_GA_TRACKING_ID, {
    //   page_path: to.path
    // })
  }
})

// 🚫 라우터 오류 처리
router.onError((error) => {
  console.error('🚫 라우터 오류:', error)
  ElMessage.error('페이지 로드 중 오류가 발생했습니다.')
})

export default router

// 🔧 라우터 유틸리티 함수들
export const routerUtils = {
  /**
   * 이전 페이지로 이동 (히스토리가 없으면 홈으로)
   */
  goBack: () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push({ name: 'Home' })
    }
  },

  /**
   * 로그인 후 리다이렉트할 페이지 설정
   */
  setRedirectAfterLogin: (path: string) => {
    sessionStorage.setItem('redirectAfterLogin', path)
  },

  /**
   * 로그인 후 리다이렉트 실행
   */
  redirectAfterLogin: () => {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin')
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterLogin')
      router.push(redirectPath)
    } else {
      router.push({ name: 'Home' })
    }
  },

  /**
   * 현재 라우트가 특정 경로와 일치하는지 확인
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
  }
}
