// src/main.ts - CSS 경로 수정 및 오류 수정 버전
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

// CSS imports
import 'element-plus/dist/index.css'
import './assets/styles/main.css'

// Firebase 초기화
import './services/firebase'

// 타입 선언
declare global {
  interface Window {
    Android?: {
      scanQR: () => void;
      saveFile: (data: string, filename: string) => void;
      showToast: (message: string) => void;
      getDeviceInfo: () => string;
      requestPermission: (permission: string) => Promise<boolean>;
    };
    webkit?: {
      messageHandlers: {
        [key: string]: {
          postMessage: (message: any) => void;
        };
      };
    };
    isNativeApp?: boolean;
  }
}

// Vue 앱 생성
const app = createApp(App)

// Pinia 스토어 설정
const pinia = createPinia()
app.use(pinia)

// Vue Router 설정
app.use(router)

// Element Plus UI 라이브러리 설정
app.use(ElementPlus)

// Element Plus 아이콘 등록
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 전역 속성 설정 (Composition API에서는 필요 없음, Options API에서만 사용)
app.config.globalProperties.$isNativeApp = window.isNativeApp ?? false

// 개발 환경에서만 성능 도구 활성화
if (import.meta.env.DEV) {
  app.config.performance = true
}

// 에러 핸들링
app.config.errorHandler = (error, instance, info) => {
  console.error('Vue 에러:', error)
  console.error('컴포넌트 인스턴스:', instance)
  console.error('에러 정보:', info)
}

// 앱 마운트
app.mount('#app')

// 개발 환경에서 디버깅 정보 출력
if (import.meta.env.DEV) {
  console.log('🚀 QR 안전교육 앱 시작됨')
  console.log('📱 네이티브 앱 여부:', window.isNativeApp ?? false)
  console.log('🌐 환경:', import.meta.env.MODE)
  // app.version은 존재하지 않으므로 Vue 버전은 직접 import해서 출력해야 함
}