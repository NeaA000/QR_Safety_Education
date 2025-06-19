<template>
  <div id="app">
    <router-view v-if="isReady" />
    <div v-else class="loading-container">
      <el-icon class="is-loading" :size="40" color="#409EFF">
        <Loading />
      </el-icon>
      <p>앱을 초기화하는 중...</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { initializeFirebase } from '@/services/firebase'
import { Loading } from '@element-plus/icons-vue'

export default {
  name: 'App',
  components: {
    Loading
  },
  setup() {
    const isReady = ref(false)
    const authStore = useAuthStore()

    onMounted(async () => {
      try {
        // 1. Firebase 초기화 먼저 수행
        console.log('Firebase 초기화 시작...')
        const firebaseInitialized = await initializeFirebase()
        
        if (!firebaseInitialized) {
          console.warn('Firebase 초기화 실패, 오프라인 모드로 진행')
          // TODO: [보안강화] 오프라인 모드 처리
          // - 로컬 데이터베이스 사용
          // - 네트워크 복구 시 동기화
        }

        // 2. Auth 상태 초기화
        console.log('인증 상태 확인 중...')
        await authStore.initializeAuth()
        
        // TODO: [보안강화] 앱 무결성 검증
        // - 앱 서명 검증
        // - 루팅/탈옥 디바이스 감지
        // - 디버깅 도구 감지
        
        isReady.value = true
        console.log('앱 초기화 완료')
      } catch (error) {
        console.error('앱 초기화 오류:', error)
        // TODO: [보안강화] 초기화 실패 시 안전한 처리
        // - 민감한 데이터 접근 차단
        // - 오류 보고 (민감한 정보 제외)
        isReady.value = true // 에러 화면 표시를 위해
      }
    })

    return {
      isReady
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1rem;
}

.loading-container p {
  color: #909399;
  font-size: 14px;
}
</style>