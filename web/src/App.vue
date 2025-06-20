<!-- web/src/App.vue -->
<template>
  <div id="app" class="app-container">
    <!-- 로딩 스피너 -->
    <div v-if="!authStore.isInitialized" class="loading-container">
      <el-icon class="loading-icon" :size="40">
        <Loading />
      </el-icon>
      <p class="loading-text">앱 초기화 중...</p>
    </div>

    <!-- 메인 앱 콘텐츠 -->
    <div v-else class="app-content">
      <router-view v-slot="{ Component, route }">
        <transition
          :name="route.meta.transition || 'fade'"
          mode="out-in"
          appear
        >
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
    </div>

    <!-- 네이티브 브릿지 통신을 위한 숨겨진 요소 -->
    <div id="native-bridge" style="display: none;"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Loading } from '@element-plus/icons-vue'

// 스토어
const authStore = useAuthStore()

// 네이티브 앱과의 통신 설정
const setupNativeBridge = () => {
  // Android WebView와의 통신
  if (window.AndroidInterface) {
    console.log('🤖 Android 네이티브 브릿지 연결됨')
  }

  // iOS WKWebView와의 통신
  if (window.webkit?.messageHandlers) {
    console.log('🍎 iOS 네이티브 브릿지 연결됨')
  }

  // 브라우저 환경
  if (!window.AndroidInterface && !window.webkit?.messageHandlers) {
    console.log('🌐 브라우저 환경에서 실행 중')
  }
}

// 앱 생명주기
onMounted(() => {
  setupNativeBridge()

  // 화면 방향 잠금 (세로 모드 고정)
  if (screen.orientation) {
    screen.orientation.lock('portrait').catch(console.warn)
  }
})

onUnmounted(() => {
  // 정리 작업
})

// 전역 타입 선언
declare global {
  interface Window {
    AndroidInterface?: {
      scanQRCode: () => void
      saveFile: (filename: string, data: string) => void
      showToast: (message: string) => void
      requestPermission: (permission: string) => Promise<boolean>
    }
    webkit?: {
      messageHandlers: {
        nativeHandler: {
          postMessage: (message: any) => void
        }
      }
    }
  }
}
</script>

<style>
/* 글로벌 스타일 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  font-family: var(--font-family-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--bg-color-base);
}

#app {
  height: 100vh;
  overflow: hidden;
}

.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--white);
}

.loading-icon {
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-5);
}

.loading-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
}

.app-content {
  flex: 1;
  overflow: hidden;
}

/* 페이지 전환 애니메이션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-duration-base) ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform var(--transition-duration-base) ease;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .loading-text {
    font-size: var(--font-size-base);
  }
}

/* 다크 모드 지원 */
@media (prefers-color-scheme: dark) {
  body {
    background-color: var(--bg-color-base);
    color: var(--text-color-primary);
  }
}

/* 안전 영역 처리 (모바일) */
@supports (padding: max(0px)) {
  .app-container {
    padding-top: max(0px, env(safe-area-inset-top));
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
