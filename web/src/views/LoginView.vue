<template>
  <div class="login-container">
    <!-- 배경 패턴 -->
    <div class="background-pattern"></div>
    
    <div class="login-content">
      <!-- 메인 로그인 폼만 표시 (QR 섹션 제거) -->
      <el-card class="login-card" shadow="hover">
        <!-- 헤더 -->
        <div class="login-header">
          <div class="logo-section">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#409EFF">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16V19H8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z"/>
            </svg>
            <h1 class="app-title">QR 안전교육</h1>
            <p class="app-description">스마트한 안전교육 관리 시스템</p>
          </div>
        </div>
        
        <!-- 로그인 폼 -->
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          @submit.prevent="handleLogin"
          size="large"
          label-width="0"
        >
          <el-form-item prop="email">
            <el-input
              v-model="loginForm.email"
              type="email"
              placeholder="이메일을 입력하세요"
              :prefix-icon="Message"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              :prefix-icon="Lock"
              show-password
              clearable
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <!-- 비밀번호 찾기 링크 -->
          <div class="forgot-password">
            <el-link type="primary" @click="showForgotPassword">
              비밀번호를 잊으셨나요?
            </el-link>
          </div>
          
          <!-- 로그인 버튼 -->
          <el-button
            type="primary"
            size="large"
            :loading="isLoading"
            :disabled="!isFormValid"
            @click="handleLogin"
            class="login-button"
          >
            {{ isLoading ? '로그인 중...' : '로그인' }}
          </el-button>
        </el-form>
        
        <!-- 구분선 -->
        <el-divider>또는</el-divider>
        
        <!-- 소셜 로그인 -->
        <div class="social-login-section">
          <el-button
            size="large"
            :loading="isSocialLoading.google"
            @click="handleGoogleLogin"
            class="social-button google-button"
          >
            <template #icon>
              <img src="/icons/google.svg" alt="Google" class="social-icon" v-if="!isSocialLoading.google">
            </template>
            Google로 로그인
          </el-button>
          
          <el-button
            size="large"
            :loading="isSocialLoading.naver"
            @click="handleNaverLogin"
            class="social-button naver-button"
          >
            <template #icon>
              <img src="/icons/naver.svg" alt="Naver" class="social-icon" v-if="!isSocialLoading.naver">
            </template>
            네이버로 로그인
          </el-button>
        </div>
        
        <!-- 회원가입 링크 -->
        <div class="register-section">
          <span class="register-text">계정이 없으신가요?</span>
          <el-link type="primary" @click="showRegister">
            회원가입
          </el-link>
        </div>
      </el-card>
    </div>
    
    <!-- 비밀번호 찾기 다이얼로그 -->
    <el-dialog
      v-model="showForgotDialog"
      title="비밀번호 찾기"
      width="90%"
      :max-width="400"
    >
      <el-form ref="forgotFormRef" :model="forgotForm" :rules="forgotRules">
        <el-form-item label="이메일" prop="email">
          <el-input
            v-model="forgotForm.email"
            type="email"
            placeholder="가입 시 사용한 이메일을 입력하세요"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showForgotDialog = false">취소</el-button>
          <el-button
            type="primary"
            :loading="isForgotLoading"
            @click="handleForgotPassword"
          >
            재설정 링크 전송
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Message, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { logAnalyticsEvent } from '@/services/firebase'

export default {
  name: 'LoginView',
  components: {
    User,
    Message,
    Lock
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    // 폼 참조
    const loginFormRef = ref()
    const forgotFormRef = ref()
    
    // 상태
    const isLoading = ref(false)
    const isForgotLoading = ref(false)
    const isSocialLoading = reactive({
      google: false,
      naver: false
    })
    const showForgotDialog = ref(false)
    
    // 로그인 폼 데이터
    const loginForm = reactive({
      email: '',
      password: ''
    })
    
    // 비밀번호 찾기 폼 데이터
    const forgotForm = reactive({
      email: ''
    })
    
    // 유효성 검사 규칙
    const loginRules = {
      email: [
        { required: true, message: '이메일을 입력해주세요', trigger: 'blur' },
        { type: 'email', message: '올바른 이메일 형식을 입력해주세요', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '비밀번호를 입력해주세요', trigger: 'blur' },
        { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다', trigger: 'blur' }
      ]
    }
    
    const forgotRules = {
      email: [
        { required: true, message: '이메일을 입력해주세요', trigger: 'blur' },
        { type: 'email', message: '올바른 이메일 형식을 입력해주세요', trigger: 'blur' }
      ]
    }
    
    // 계산된 속성
    const isFormValid = computed(() => {
      return loginForm.email && loginForm.password && loginForm.password.length >= 6
    })
    
    /**
     * 이메일 로그인
     */
    const handleLogin = async () => {
      try {
        const valid = await loginFormRef.value.validate()
        if (!valid) return
        
        isLoading.value = true
        
        await authStore.signInWithEmail(loginForm.email, loginForm.password)
        
        ElMessage.success('로그인되었습니다.')
        
        // Analytics 이벤트
        logAnalyticsEvent('login', {
          method: 'email',
          success: true
        })
        
        router.replace('/home')
        
      } catch (error) {
        console.error('로그인 실패:', error)
        
        let errorMessage = '로그인에 실패했습니다.'
        
        if (error.code === 'auth/user-not-found') {
          errorMessage = '존재하지 않는 계정입니다.'
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = '잘못된 비밀번호입니다.'
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = '이메일 형식이 올바르지 않습니다.'
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = '비활성화된 계정입니다.'
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
        }
        
        ElMessage.error(errorMessage)
        
      } finally {
        isLoading.value = false
      }
    }
    
    /**
     * Google 로그인
     */
    const handleGoogleLogin = async () => {
      try {
        isSocialLoading.google = true
        
        await authStore.signInWithGoogle()
        
        ElMessage.success('Google 로그인되었습니다.')
        
        // Analytics 이벤트
        logAnalyticsEvent('login', {
          method: 'google',
          success: true
        })
        
        router.replace('/home')
        
      } catch (error) {
        console.error('Google 로그인 실패:', error)
        
        if (error.code !== 'auth/popup-closed-by-user') {
          ElMessage.error('Google 로그인에 실패했습니다.')
        }
        
      } finally {
        isSocialLoading.google = false
      }
    }
    
    /**
     * 네이버 로그인
     */
    const handleNaverLogin = async () => {
      try {
        isSocialLoading.naver = true
        
        ElMessage.info('네이버 로그인 기능은 준비 중입니다.')
        
      } catch (error) {
        console.error('네이버 로그인 실패:', error)
        ElMessage.error('네이버 로그인에 실패했습니다.')
        
      } finally {
        isSocialLoading.naver = false
      }
    }
    
    /**
     * 비밀번호 찾기 표시
     */
    const showForgotPassword = () => {
      forgotForm.email = loginForm.email
      showForgotDialog.value = true
    }
    
    /**
     * 비밀번호 재설정
     */
    const handleForgotPassword = async () => {
      try {
        const valid = await forgotFormRef.value.validate()
        if (!valid) return
        
        isForgotLoading.value = true
        
        await authStore.sendPasswordResetEmail(forgotForm.email)
        
        ElMessage.success('비밀번호 재설정 링크를 이메일로 전송했습니다.')
        showForgotDialog.value = false
        
      } catch (error) {
        console.error('비밀번호 재설정 실패:', error)
        
        let errorMessage = '비밀번호 재설정에 실패했습니다.'
        
        if (error.code === 'auth/user-not-found') {
          errorMessage = '존재하지 않는 계정입니다.'
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = '이메일 형식이 올바르지 않습니다.'
        }
        
        ElMessage.error(errorMessage)
        
      } finally {
        isForgotLoading.value = false
      }
    }
    
    /**
     * 회원가입 화면 표시
     */
    const showRegister = () => {
      ElMessage.info('회원가입은 관리자에게 문의해주세요.')
    }
    
    // 라이프사이클
    onMounted(() => {
      // 개발 환경에서 테스트 계정 자동 입력
      if (import.meta.env.MODE === 'development') {
        loginForm.email = 'test@example.com'
        loginForm.password = 'test123'
      }
      
      // Analytics 이벤트
      logAnalyticsEvent('screen_view', {
        screen_name: 'login'
      })
    })
    
    return {
      // 참조
      loginFormRef,
      forgotFormRef,
      
      // 상태
      isLoading,
      isForgotLoading,
      isSocialLoading,
      showForgotDialog,
      
      // 폼 데이터
      loginForm,
      forgotForm,
      
      // 유효성 검사
      loginRules,
      forgotRules,
      isFormValid,
      
      // 메서드
      handleLogin,
      handleGoogleLogin,
      handleNaverLogin,
      showForgotPassword,
      handleForgotPassword,
      showRegister
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(25, 118, 210, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(25, 118, 210, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.login-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 400px;
  z-index: 1;
}

.login-card {
  width: 100%;
  border-radius: 16px;
  border: none;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 0;
  letter-spacing: -0.5px;
}

.app-description {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  margin-top: 10px;
}

.forgot-password {
  text-align: right;
  margin-bottom: 20px;
}

.social-login-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-button {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-weight: 600;
  border: 1px solid #dcdfe6;
}

.google-button {
  background: #fff;
  color: #303133;
}

.google-button:hover {
  background: #f5f5f5;
}

.naver-button {
  background: #03c75a;
  color: white;
  border-color: #03c75a;
}

.naver-button:hover {
  background: #02b151;
  border-color: #02b151;
}

.social-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.register-section {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.register-text {
  color: #606266;
  margin-right: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .login-container {
    padding: 15px;
  }
  
  .app-title {
    font-size: 24px;
  }
}

/* 다크 모드 지원 */
@media (prefers-color-scheme: dark) {
  .login-container {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }
  
  .login-card {
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .app-title {
    color: #ffffff;
  }
  
  .app-description,
  .register-text {
    color: #b0b0b0;
  }
  
  .google-button {
    background: #2d2d2d;
    color: #ffffff;
    border-color: #404040;
  }
  
  .google-button:hover {
    background: #404040;
  }
}
</style>