// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 라우트 정의
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { guest: true }
  },
  {
    path: '/lectures',
    name: 'lectures',
    component: () => import('@/views/LectureListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/lectures/:id',
    name: 'lecture-detail',
    component: () => import('@/views/LectureDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/lectures/:id/watch',
    name: 'lecture-watch',
    component: () => import('@/views/LectureWatchView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/certificates',
    name: 'certificates',
    component: () => import('@/views/CertificateListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/certificates/:id',
    name: 'certificate-detail',
    component: () => import('@/views/CertificateDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/edit',
    name: 'profile-edit',
    component: () => import('@/views/ProfileEditView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'admin',
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/DashboardView.vue')
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/views/admin/UsersView.vue')
      },
      {
        path: 'lectures',
        name: 'admin-lectures',
        component: () => import('@/views/admin/LecturesView.vue')
      },
      {
        path: 'certificates',
        name: 'admin-certificates',
        component: () => import('@/views/admin/CertificatesView.vue')
      },
      {
        path: 'categories',
        name: 'admin-categories',
        component: () => import('@/views/admin/CategoriesView.vue')
      }
    ]
  },
  {
    path: '/qr-scan',
    name: 'qr-scan',
    component: () => import('@/views/QRScanView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/offline',
    name: 'offline',
    component: () => import('@/views/OfflineView.vue')
  },
  {
    path: '/404',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

// 라우터 인스턴스 생성
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
  
  // 인증 정보 초기화
  if (!authStore.user) {
    authStore.initializeAuth()
  }

  const isAuthenticated = authStore.isAuthenticated
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  const guestOnly = to.matched.some(record => record.meta.guest)

  // 인증이 필요한 페이지
  if (requiresAuth && !isAuthenticated) {
    next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // 관리자 권한이 필요한 페이지
  if (requiresAdmin && !authStore.isAdmin) {
    next({ name: 'home' })
    return
  }

  // 게스트만 접근 가능한 페이지 (로그인, 회원가입)
  if (guestOnly && isAuthenticated) {
    next({ name: 'home' })
    return
  }

  // 토큰 갱신 확인 (만료 시간이 가까운 경우)
  if (isAuthenticated && authStore.token) {
    try {
      // TODO: 토큰 만료 시간 확인 로직
      // const tokenExpired = checkTokenExpiration(authStore.token)
      // if (tokenExpired) {
      //   await authStore.refreshAuthToken()
      // }
    } catch (error) {
      console.error('토큰 갱신 실패:', error)
    }
  }

  next()
})

// 라우터 에러 핸들링
router.onError(error => {
  console.error('라우터 에러:', error)
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    window.location.reload()
  }
})

export default router