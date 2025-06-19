// 1. vite.config.ts - Vite 빌드 도구 설정
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  
  // 경로 별칭 설정
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@types': resolve(__dirname, 'src/types')
    }
  },

  // 개발 서버 설정
  server: {
    port: 3000,
    host: '0.0.0.0', // 모든 네트워크 인터페이스에서 접근 가능
    open: true, // 브라우저 자동 열기
    cors: true,
    
    // 개발 환경에서는 HTTP 사용 (나중에 HTTPS로 변경)
    // https: false // 프로덕션에서는 true로 설정
    
    // 프록시 설정 (API 서버 연동용)
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  // 빌드 설정
  build: {
    outDir: 'dist',
    sourcemap: true, // 개발용 - 프로덕션에서는 false
    minify: 'terser', // 코드 압축
    target: 'es2020', // 타겟 브라우저 지원
    
    // 번들 최적화
    rollupOptions: {
      output: {
        // 청크 분리로 로딩 성능 최적화
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'firebase-vendor': [
            'firebase/app', 
            'firebase/auth', 
            'firebase/firestore',
            'firebase/storage',
            'firebase/analytics'
          ],
          'ui-vendor': ['element-plus', '@element-plus/icons-vue']
        },
        
        // 파일명 패턴
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return 'media/[name]-[hash].[ext]'
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)(\?.*)?$/i.test(assetInfo.name)) {
            return 'img/[name]-[hash].[ext]'
          }
          if (ext === 'css') {
            return 'css/[name]-[hash].[ext]'
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    },
    
    // 번들 크기 경고 임계값
    chunkSizeWarningLimit: 1000
  },

  // 환경변수 정의
  define: {
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    
    // 빌드 시간 정보
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },

  // CSS 설정
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/styles/variables.scss";`
      }
    }
  },

  // 최적화 설정
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore'
    ]
  }
})