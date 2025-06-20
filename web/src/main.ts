// web/src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import './assets/styles/main.css'

// 앱 생성
const app = createApp(App)

// Pinia 스토어 설정
const pinia = createPinia()
app.use(pinia)

// Vue Router 설정
app.use(router)

// Element Plus 설정
app.use(ElementPlus, {
  locale: undefined, // 기본 로케일 사용 (한국어는 나중에 추가)
  size: 'default'
})

// Element Plus 아이콘 전역 등록
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 전역 에러 핸들러
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err, info)
  // TODO: 에러 리포팅 서비스에 전송
}

// 전역 경고 핸들러 (개발 환경에서만)
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, vm, trace) => {
    console.warn('Vue warning:', msg, trace)
  }
}

// 앱 마운트
app.mount('#app')

// HMR (Hot Module Replacement) 지원
if (import.meta.hot) {
  import.meta.hot.accept()
}
