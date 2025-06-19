<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- 로딩 스피너 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <el-icon class="is-loading text-4xl text-blue-600">
          <Loading />
        </el-icon>
        <p class="mt-4 text-lg text-gray-600">로딩 중...</p>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div v-else class="app-container">
      <!-- 네비게이션 헤더 (로그인 후에만 표시) -->
      <header v-if="isAuthenticated && !isOnSplashPage" class="app-header">
        <div class="header-content">
          <div class="flex items-center">
            <el-icon class="text-2xl text-blue-600 mr-3">
              <Monitor />
            </el-icon>
            <h1 class="text-xl font-bold text-gray-800">QR 안전교육</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- 사용자 정보 -->
            <div v-if="currentUser" class="flex items-center space-x-2">
              <el-avatar :size="32" :src="currentUser.photoURL || undefined">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="text-sm text-gray-600">{{ currentUser.displayName || '사용자' }}</span>
            </div>
            
            <!-- 로그아웃 버튼 -->
            <el-button type="primary" size="small" @click="handleLogout">
              <el-icon class="mr-1"><SwitchButton /></el-icon>
              로그아웃
            </el-button>
          </div>
        </div>
      </header>

      <!-- 라우터 뷰 -->
      <main class="app-main" :class="{ 'with-header': isAuthenticated && !isOnSplashPage }">
        <router-view v-slot="{ Component, route }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </main>

      <!-- 네이티브 앱 전용 하단 네비게이션 -->
      <nav v-if="isNativeApp && isAuthenticated && !isOnSplashPage" class="bottom-navigation">
        <router-link to="/home" class="nav-item" active-class="active">
          <el-icon><House /></el-icon>
          <span>홈</span>
        </router-link>
        <router-link to="/lectures" class="nav-item" active-class="active">
          <el-icon><VideoPlay /></el-icon>
          <span>강의</span>
        </router-link>
        <router-link to="/certificates" class="nav-item" active-class="active">
          <el-icon><Medal /></el-icon>
          <span>수료증</span>
        </router-link>
        <router-link to="/profile" class="nav-item" active-class="active">
          <el-icon><User /></el-icon>
          <span>프로필</span>
        </router-link>
      </nav>
    </div>

    <!-- 토스트 알림 -->
    <div v-if="toastMessage" class="toast-notification" :class="toastType">
      <el-icon class="mr-2">
        <SuccessFilled v-if="toastType === 'success'" />
        <WarningFilled v-else-if="toastType === 'warning'" />
        <CircleCloseFilled v-else />
      </el-icon>
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { 
  Loading, Monitor, User, SwitchButton, House, 
  VideoPlay, Medal, SuccessFilled, WarningFilled, CircleCloseFilled 
} from '@element-plus/icons-vue'

// 스토어
const authStore = useAuthStore()
const appStore = useAppStore()
const route = useRoute()
const router = useRouter()

// 반응형 상태
const isLoading = ref(true)
const toastMessage = ref('')
const toastType = ref<'success' | 'warning' | 'error'>('success')

// 계산된 속성
const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentUser = computed(() => authStore.user)
const isNativeApp = computed(() => window.isNativeApp || false)
const isOnSplashPage = computed(() => route.name === 'splash')

// 라이프사이클
onMounted(async () => {
  try {
    // 인증 상태 확인
    await authStore.checkAuthState()
    
    // 앱 초기화
    await appStore.initialize()
    
    // 네이티브 앱에서 초기 설정
    if (isNativeApp.value) {
      await initializeNativeApp()
    }
    
  } catch (error) {
    console.error('앱 초기화 오류:', error)
    showToast('앱 초기화 중 오류가 발생했습니다.', 'error')
  } finally {
    isLoading.value = false
  }
})

// 라우트 변경 감시
watch(route, (to) => {
  // 페이지 제목 업데이트
  document.title = getPageTitle(to.name as string)
  
  // 네이티브 앱에 페이지 변경 알림
  if (isNativeApp.value && window.Android) {
    window.Android.showToast(`페이지 이동: ${to.name}`)
  }
})

// 메서드
const initializeNativeApp = async (): Promise<void> => {
  try {
    if (window.Android) {
      // Android 권한 요청
      await window.Android.requestPermission('CAMERA')
      await window.Android.requestPermission('WRITE_EXTERNAL_STORAGE')
    }
    
    console.log('네이티브 앱 초기화 완료')
  } catch (error) {
    console.error('네이티브 앱 초기화 실패:', error)
  }
}

const handleLogout = async (): Promise<void> => {
  try {
    await authStore.logout()
    showToast('로그아웃되었습니다.', 'success')
    router.push('/login')
  } catch (error) {
    console.error('로그아웃 오류:', error)
    showToast('로그아웃 중 오류가 발생했습니다.', 'error')
  }
}

const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success'): void => {
  toastMessage.value = message
  toastType.value = type
  
  // 3초 후 토스트 제거
  setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
  
  // 네이티브 앱에도 토스트 표시
  if (isNativeApp.value && window.Android) {
    window.Android.showToast(message)
  }
}

const getPageTitle = (routeName: string): string => {
  const titles: Record<string, string> = {
    splash: 'QR 안전교육',
    login: '로그인 - QR 안전교육',
    home: '홈 - QR 안전교육',
    lectures: '강의 목록 - QR 안전교육',
    certificates: '수료증 - QR 안전교육',
    profile: '프로필 - QR 안전교육'
  }
  
  return titles[routeName] || 'QR 안전교육'
}

// 전역 에러 핸들러
window.addEventListener('error', (event) => {
  console.error('전역 에러:', event.error)
  showToast('예상치 못한 오류가 발생했습니다.', 'error')
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('처리되지 않은 Promise 거부:', event.reason)
  showToast('네트워크 오류가 발생했습니다.', 'error')
})
</script>

<style scoped>
.loading-overlay {
  @apply fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50;
}

.loading-spinner {
  @apply flex flex-col items-center;
}

.app-header {
  @apply bg-white shadow-sm border-b border-gray-200 px-4 py-3 sticky top-0 z-40;
}

.header-content {
  @apply flex items-center justify-between max-w-7xl mx-auto;
}

.app-main {
  @apply flex-1 overflow-y-auto;
}

.app-main.with-header {
  @apply pt-0;
}

.bottom-navigation {
  @apply fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around py-2 px-4 z-40;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.nav-item {
  @apply flex flex-col items-center py-2 px-3 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200;
  font-size: 12px;
}

.nav-item.active {
  @apply text-blue-600 bg-blue-50;
}

.nav-item span {
  @apply mt-1;
}

.toast-notification {
  @apply fixed top-20 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg flex items-center z-50 transition-all duration-300;
}

.toast-notification.success {
  @apply bg-green-500 text-white;
}

.toast-notification.warning {
  @apply bg-yellow-500 text-white;
}

.toast-notification.error {
  @apply bg-red-500 text-white;
}

/* 페이지 전환 애니메이션 */
.page-enter-active, .page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .app-main.with-header {
    @apply pb-16; /* 하단 네비게이션 공간 확보 */
  }
}
</style>