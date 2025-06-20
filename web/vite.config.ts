// web/vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },

  // 개발 서버 설정
  server: {
    port: 3000,
    host: true, // 모바일 디바이스에서 접근 가능
    cors: true,
    // HTTPS 설정 (필요시)
    // https: true
  },

  // 빌드 설정
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false,

    // 청크 분할 최적화
    rollupOptions: {
      output: {
        manualChunks: {
          // Vue 관련
          'vue-vendor': ['vue', 'vue-router', 'pinia'],

          // Firebase 관련
          'firebase-vendor': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
            'firebase/functions'
          ],

          // UI 라이브러리
          'ui-vendor': ['element-plus'],

          // 유틸리티
          'utils-vendor': ['lodash-es', 'dayjs']
        }
      }
    },

    // 경고 임계값 설정 (500KB)
    chunkSizeWarningLimit: 500
  },

  // CSS 설정
  css: {
    devSourcemap: true
  },

  // 환경변수 타입 체크
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  },

  // 최적화 설정
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/functions',
      'element-plus'
    ]
  },

  // PWA 설정을 위한 base path
  base: './',

  // 미리보기 설정
  preview: {
    port: 8080,
    host: true
  }
})
