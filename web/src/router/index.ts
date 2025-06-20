// web/src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 컴포넌트 지연 로딩
const LoginView = () => import('@/views/auth/LoginView.vue')
const RegisterView = () => import('@/views/auth/RegisterView.vue')
const HomeView = () => import('@/views/home/HomeView.vue')
const CourseListView = () => import('@/views/course/CourseListView.vue')
const CourseDetailView = () => import('@/views/course/CourseDetailView.vue')
const MyCoursesView = () => import('@/views/course/MyCoursesView.vue')
const LearningView = () => import('@/views/learning/LearningView.vue')
const VideoPlayerView = () => import('@/views/learning/VideoPlayerView.vue')
const CertificateListView = () => import('@/views/certificate/CertificateListView.vue')
const ProfileView = () => import('@/views/profile/ProfileView.vue')
const QRScanView = () => import('@/views/qr/QRScanView.vue')

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      requiresAuth: false,
      hideForAuth: true, // 로그인된 사용자에게는 숨김
      title: '로그인'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: {
      requiresAuth: false,
      hideForAuth: true,
      title: '회원가입'
    }
  },
  {
    path: '/home',
    name: 'Home',
    component: HomeView,
    meta: {
      requiresAuth: true,
      title: '홈'
    }
  },
  {
    path: '/courses',
    name: 'CourseList',
    component: CourseListView,
    meta: {
      requiresAuth: true,
      title: '강의 목록'
    }
  },
  {
    path: '/course/:id',
    name: 'CourseDetail',
    component: CourseDetailView,
    meta: {
      requiresAuth: true,
      title: '강의 상세'
    },
    props: true
  },
  {
    path: '/my-courses',
    name: 'MyCourses',
    component: MyCoursesView,
    meta: {
      requiresAuth: true,
      title: '내 강의'
    }
  },
  {
    path: '/learning/:id',
    name: 'Learning',
    component: LearningView,
    meta: {
      requiresAuth: true,
      title: '학습하기'
    },
    props: true
  },
  {
    path: '/video/:id',
    name: 'VideoPlayer',
    component: VideoPlayerView,
    meta: {
      requiresAuth: true,
      title: '동영상 재생'
    },
    props: true
  },
  {
    path: '/video-warning/:id',
    name: 'VideoWarning',
    component: () => import('@/views/learning/VideoWarningView.vue'),
    meta: {
      requiresAuth: true,
      title: '안전 경고'
    },
    props: true
  },
  {
    path: '/certificates',
    name: 'Certificates',
    component: CertificateListView,
    meta: {
      requiresAuth: true,
      title: '수료증'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: {
      requiresAuth: true,
      title: '프로필'
    }
  },
  {
    path: '/qr-scan',
    name: 'QRScan',
    component: QRScanView,
    meta: {
      requiresAuth: true,
      title: 'QR 스캔'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: '페이지를 찾을 수 없음'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 네비게이션 가드
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 인증 상태 확인 (처음 로드 시)
  if (!authStore.isInitialized) {
    await authStore.initializeAuth()
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const hideForAuth = to.matched.some(record => record.meta.hideForAuth)
  const isAuthenticated = authStore.isLoggedIn

  // 인증이 필요한 페이지
  if (requiresAuth && !isAuthenticated) {
    // 미로그인 사용자를 로그인 페이지로 리다이렉트
    next({
      path: '/login',
      query: { redirect: to.fullPath } // 로그인 후 원래 페이지로 돌아가기 위해
    })
    return
  }

  // 로그인된 사용자가 로그인/회원가입 페이지에 접근하는 경우
  if (hideForAuth && isAuthenticated) {
    next('/home')
    return
  }

  // 일반 페이지 접근
  next()
})

// 라우트 변경 후 타이틀 설정
router.afterEach((to) => {
  // 페이지 타이틀 설정
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - QR 안전교육`
  } else {
    document.title = 'QR 안전교육'
  }

  // 네이티브 앱에서 페이지 변경 알림
  if (typeof window !== 'undefined' && (window as any).Android) {
    try {
      // 현재 페이지 정보를 네이티브에 전달 (필요한 경우)
      console.log(`페이지 변경: ${to.path}`)
    } catch (error) {
      console.error('네이티브 통신 오류:', error)
    }
  }
})

export default router
