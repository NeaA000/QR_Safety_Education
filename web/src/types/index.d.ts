// web/src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 컴포넌트 지연 로딩
const LoginView = () => import('@/views/auth/LoginView.vue')
const RegisterView = () => import('@/views/auth/RegisterView.vue')
const HomeView = () => import('@/views/home/HomeView.vue')
const FirstRunView = () => import('@/views/profile/FirstRunView.vue')

// 강의 관련
const CourseListView = () => import('@/views/course/CourseListView.vue')
const CourseDetailView = () => import('@/views/course/CourseDetailView.vue')
const CourseEnrollView = () => import('@/views/course/CourseEnrollView.vue')

// 내 강의 관련
const MyCoursesView = () => import('@/views/course/MyCoursesView.vue')
const MyCoursesAppliedView = () => import('@/views/course/MyCoursesAppliedView.vue')
const MyCoursesProgressView = () => import('@/views/course/MyCoursesProgressView.vue')
const MyCoursesCompletedView = () => import('@/views/course/MyCoursesCompletedView.vue')

// 학습 관련
const LearningView = () => import('@/views/learning/LearningView.vue')
const VideoWarningView = () => import('@/views/learning/VideoWarningView.vue')
const VideoPlayerView = () => import('@/views/learning/VideoPlayerView.vue')

// QR 관련
const QRScanView = () => import('@/views/qr/QRScanView.vue')
const QRResultView = () => import('@/views/qr/QRResultView.vue')

// 수료증 관련
const CertificateListView = () => import('@/views/certificate/CertificateListView.vue')
const CertificateDetailView = () => import('@/views/certificate/CertificateDetailView.vue')

// 프로필 관련
const ProfileView = () => import('@/views/profile/ProfileView.vue')
const ProfilePhotoView = () => import('@/views/profile/ProfilePhotoView.vue')

const routes: Array<RouteRecordRaw> = [
  // 기본 루트
  {
    path: '/',
    redirect: '/home'
  },

  // 첫 실행 (프로필 사진 설정)
  {
    path: '/first-run',
    name: 'FirstRun',
    component: FirstRunView,
    meta: {
      requiresAuth: false,
      title: '프로필 설정'
    }
  },

  // 인증 관련
  {
    path: '/auth/login',
    name: 'Login',
    component: LoginView,
    meta: {
      requiresAuth: false,
      hideForAuth: true,
      title: '로그인'
    }
  },
  {
    path: '/auth/register',
    name: 'Register',
    component: RegisterView,
    meta: {
      requiresAuth: false,
      hideForAuth: true,
      title: '회원가입'
    }
  },

  // 홈
  {
    path: '/home',
    name: 'Home',
    component: HomeView,
    meta: {
      requiresAuth: true,
      title: '홈'
    }
  },

  // QR 스캔 관련
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
    path: '/qr-result/:courseId',
    name: 'QRResult',
    component: QRResultView,
    meta: {
      requiresAuth: true,
      title: 'QR 스캔 결과'
    },
    props: true
  },

  // 강의 관련 (수동 신청)
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
    path: '/courses/:id',
    name: 'CourseDetail',
    component: CourseDetailView,
    meta: {
      requiresAuth: true,
      title: '강의 상세'
    },
    props: true
  },
  {
    path: '/courses/:id/enroll',
    name: 'CourseEnroll',
    component: CourseEnrollView,
    meta: {
      requiresAuth: true,
      title: '강의 신청'
    },
    props: true
  },

  // 내 강의 관련
  {
    path: '/my-courses',
    name: 'MyCourses',
    component: MyCoursesView,
    meta: {
      requiresAuth: true,
      title: '내 강의'
    },
    children: [
      {
        path: '',
        redirect: '/my-courses/applied'
      },
      {
        path: 'applied',
        name: 'MyCoursesApplied',
        component: MyCoursesAppliedView,
        meta: {
          title: '신청한 강의'
        }
      },
      {
        path: 'progress',
        name: 'MyCoursesProgress',
        component: MyCoursesProgressView,
        meta: {
          title: '진행 중인 강의'
        }
      },
      {
        path: 'completed',
        name: 'MyCoursesCompleted',
        component: MyCoursesCompletedView,
        meta: {
          title: '완료한 강의'
        }
      }
    ]
  },

  // 학습 관련
  {
    path: '/learning/:id/warning',
    name: 'LearningWarning',
    component: VideoWarningView,
    meta: {
      requiresAuth: true,
      title: '안전 경고'
    },
    props: true
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
    path: '/learning/:id/video',
    name: 'VideoPlayer',
    component: VideoPlayerView,
    meta: {
      requiresAuth: true,
      title: '동영상 재생'
    },
    props: true
  },

  // 수료증 관련
  {
    path: '/certificates',
    name: 'CertificateList',
    component: CertificateListView,
    meta: {
      requiresAuth: true,
      title: '내 수료증'
    }
  },
  {
    path: '/certificates/:id',
    name: 'CertificateDetail',
    component: CertificateDetailView,
    meta: {
      requiresAuth: true,
      title: '수료증 상세'
    },
    props: true
  },

  // 프로필 관련
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
    path: '/profile/photo',
    name: 'ProfilePhoto',
    component: ProfilePhotoView,
    meta: {
      requiresAuth: true,
      title: '프로필 사진 변경'
    }
  },

  // 404 페이지
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

  // 첫 실행 체크 (프로필 사진 미설정 사용자)
  if (isAuthenticated && !authStore.hasProfilePhoto && to.name !== 'FirstRun') {
    next('/first-run')
    return
  }

  // 인증이 필요한 페이지
  if (requiresAuth && !isAuthenticated) {
    next({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // 로그인된 사용자가 로그인/회원가입 페이지에 접근하는 경우
  if (hideForAuth && isAuthenticated) {
    const redirect = to.query.redirect as string
    next(redirect || '/home')
    return
  }

  // QR 스캔 결과 페이지 접근 제어
  if (to.name === 'QRResult' && !from.name?.toString().includes('QR')) {
    // QR 스캔을 거치지 않고 직접 접근한 경우
    next('/qr-scan')
    return
  }

  // 학습 페이지 접근 제어 (강의 신청 여부 확인)
  if (to.name?.toString().startsWith('Learning') || to.name?.toString().startsWith('Video')) {
    const courseId = to.params.id as string
    const hasAccess = await authStore.checkCourseAccess(courseId)
    if (!hasAccess) {
      next(`/courses/${courseId}`)
      return
    }
  }

  next()
})

// 라우트 변경 후 처리
router.afterEach((to) => {
  // 페이지 타이틀 설정
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - QR 안전교육`
  } else {
    document.title = 'QR 안전교육'
  }

  // 네이티브 앱에 페이지 변경 알림
  if (typeof window !== 'undefined' && (window as any).Android) {
    try {
      (window as any).Android.onPageChanged(to.path, title)
    } catch (error) {
      console.error('네이티브 통신 오류:', error)
    }
  }

  // 구글 애널리틱스 등 트래킹 (필요시)
  if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: to.path
    })
  }
})

export default router
