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

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.config.globalProperties.$isNativeApp = window.isNativeApp ?? false

if (import.meta.env.DEV) {
  app.config.performance = true
}

app.config.errorHandler = (error, instance, info) => {
  console.error('Vue 에러:', error)
  console.error('컴포넌트 인스턴스:', instance)
  console.error('에러 정보:', info)
}

app.mount('#app')

if (import.meta.env.DEV) {
  console.log('🚀 QR 안전교육 앱 시작됨')
  console.log('📱 네이티브 앱 여부:', window.isNativeApp ?? false)
  console.log('🌐 환경:', import.meta.env.MODE)
}