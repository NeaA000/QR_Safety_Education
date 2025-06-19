<template>
  <div class="login-container">
    <!-- 배경 -->
    <div class="background-pattern"></div>
    
    <!-- 메인 콘텐츠 -->
    <div class="login-content">
      <!-- 헤더 -->
      <div class="login-header">
        <div class="logo-section">
          <el-icon size="60" color="#1976d2">
            <Shield />
          </el-icon>
          <h1 class="app-title">QR 안전교육</h1>
          <p class="app-description">QR 코드로 시작하는 스마트한 안전 교육</p>
        </div>
      </div>
      
      <!-- 로그인 폼 -->
      <div class="login-form-container">
        <el-card class="login-card" shadow="always">
          <template #header>
            <div class="card-header">
              <span class="login-title">로그인</span>
            </div>
          </template>
          
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            label-position="top"
            size="large"
            @submit.prevent="handleLogin"
          >
            <!-- 이메일 입력 -->
            <el-form-item label="이메일" prop="email">
              <el-input
                v-model="loginForm.email"
                type="email"
                placeholder="이메일을 입력하세요"
                :prefix-icon="Message"
                clearable
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            
            <!-- 비밀번호 입력 -->
            <el-form-item label="비밀번호" prop="password">
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
            
            <!-- 로그인 옵션 -->
            <div class="login-options">
              <el-checkbox v-model="loginForm.rememberMe">
                로그인 상태 유지
              </el-checkbox>
              <el-link type="primary" @click="showForgotPassword">
                비밀번호 찾기
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
      
      <!-- QR 로그인 섹션 -->
      <div class="qr-login-section">
        <el-card class="qr-card" shadow="hover">
          <div class="qr-content">
            <el-icon size="32" color="#1976d2">
              <Qrcode />
            </el-icon>
            <div class="qr-text">
              <h3>QR 코드로 빠른 로그인</h3>
              <p>QR 코드를 스캔하여 간편하게 로그인하세요</p>
            </div>
            <el-button
              type="primary"
              :icon="Scan"
              :loading="isQRLoading"
              @click="handleQRLogin"
              class="qr-button"
            >
              QR 스캔
            </el-button>
          </div>
        </el-card>
      </div>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Shield, Message, Lock, Qrcode, Scan } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import nativeBridge from '@/services/native-bridge'
import { logAnalyticsEvent } from '@/services/firebase'

export default {
  name: 'LoginView',
  components: {
    Shield,
    Message,
    Lock,
    Qrcode,
    Scan
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    // 참조
    const loginFormRef = ref()
    const forgotFormRef = ref()
    
    // 로딩 상태
    const isLoading = ref(false)
    const isQRLoading = ref(false)
    const isForgotLoading = ref(false)
    const isSocialLoading = reactive({
      google: false,
      naver: false
    })
    
    // 다이얼로그 상태
    const showForgotDialog = ref(false)
    
    // 폼 데이터
    const loginForm = reactive({
      email: '',
      password: '',
      rememberMe: false
    })
    
    const forgotForm = reactive({
      email: ''
    })
    
    // 유효성 검사 규칙
    const loginRules = {
      email: [
        { required: true, message: '이메일을 입력해 주세요', trigger: 'blur' },
        { type: 'email', message: '올바른 이메일 형식이 아닙니다', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '비밀번호를 입력해 주세요', trigger: 'blur' },
        { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다', trigger: 'blur' }
      ]
    }
    
    const forgotRules = {
      email: [
        { required: true, message: '이메일을 입력해 주세요', trigger: 'blur' },
        { type: 'email', message: '올바른 이메일 형식이 아닙니다', trigger: 'blur' }
      ]
    }
    
    // 계산된 속성
    const isFormValid = computed(() => {
      return loginForm.email && loginForm.password && loginForm.password.length >= 6
    })
    
    /**
     * 일반 로그인 처리
     */
    const handleLogin = async () => {
      try {
        // 폼 유효성 검사
        const valid = await loginFormRef.value.validate()
        if (!valid) return
        
        isLoading.value = true
        
        // 로그인 시도
        await authStore.signInWithEmail(loginForm.email, loginForm.password, loginForm.rememberMe)
        
        ElMessage.success('로그인되었습니다.')
        
        // Analytics 이벤트
        logAnalyticsEvent('login', {
          method: 'email',
          success: true
        })
        
        // 홈으로 이동
        router.replace('/home')
        
      } catch (error) {
        console.error('로그인 실패:', error)
        
        let errorMessage = '로그인에 실패했습니다.'
        
        if (error.code === 'auth/user-not-found') {
          errorMessage = '존재하지 않는 계정입니다.'
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = '비밀번호가 올바르지 않습니다.'
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = '이메일 형식이 올바르지 않습니다.'
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = '비활성화된 계정입니다.'
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.'
        }
        
        ElMessage.error(errorMessage)
        
        // Analytics 이벤트
        logAnalyticsEvent('login', {
          method: 'email',
          success: false,
          error: error.code
        })
        
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
        
        // Analytics 이벤트
        logAnalyticsEvent('login', {
          method: 'google',
          success: false,
          error: error.code
        })
        
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
        
        // 네이버 로그인은 서버 측 구현 필요
        ElMessage.info('네이버 로그인 기능은 준비 중입니다.')
        
      } catch (error) {
        console.error('네이버 로그인 실패:', error)
        ElMessage.error('네이버 로그인에 실패했습니다.')
        
      } finally {
        isSocialLoading.naver = false
      }
    }
    
    /**
     * QR 로그인
     */
    const handleQRLogin = async () => {
      try {
        isQRLoading.value = true
        
        // 카메라 권한 확인
        const hasPermission = await nativeBridge.checkCameraPermission()
        if (!hasPermission) {
          const granted = await nativeBridge.requestCameraPermission()
          if (!granted) {
            ElMessage.warning('카메라 권한이 필요합니다.')
            return
          }
        }
        
        // QR 코드 스캔
        const qrResult = await nativeBridge.scanQR()
        
        if (qrResult && qrResult.data) {
          // QR 코드 데이터 처리
          await processQRLogin(qrResult.data)
        }
        
      } catch (error) {
        console.error('QR 로그인 실패:', error)
        
        if (error.message.includes('권한')) {
          ElMessage.warning('카메라 권한이 필요합니다.')
        } else if (error.message.includes('취소')) {
          // 사용자가 취소한 경우 메시지 표시하지 않음
        } else {
          ElMessage.error('QR 스캔에 실패했습니다.')
        }
        
      } finally {
        isQRLoading.value = false
      }
    }
    
    /**
     * QR 로그인 데이터 처리
     */
    const processQRLogin = async (qrData) => {
      try {
        // QR 데이터 검증 및 파싱
        const loginData = JSON.parse(qrData)
        
        if (loginData.type === 'qr_login' && loginData.token) {
          // 서버에 QR 토큰으로 로그인 요청
          await authStore.signInWithQRToken(loginData.token)
          
          ElMessage.success('QR 로그인되었습니다.')
          
          // Analytics 이벤트
          logAnalyticsEvent('login', {
            method: 'qr',
            success: true
          })
          
          router.replace('/home')
        } else {
          throw new Error('유효하지 않은 QR 코드입니다.')
        }
        
      } catch (error) {
        console.error('QR 데이터 처리 실패:', error)
        ElMessage.error('유효하지 않은 QR 코드입니다.')
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
      ElMessageBox.alert(
        '회원가입 기능은 관리자에게 문의하거나 QR 코드를 통해 진행해 주세요.',
        '회원가입',
        {
          confirmButtonText: '확인',
          type: 'info'
        }
      )
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
      isQRLoading,
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
      handleQRLogin,
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
  z-index: -1;
}

.login-content {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 헤더 */
.login-header {
  text-align: center;
  margin-bottom: 20px;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  color: #1976d2;
  margin: 0;
}

.app-description {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 로그인 카드 */
.login-card {
  border-radius: 16px;
  overflow: hidden;
}

.card-header {
  text-align: center;
}

.login-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

/* 로그인 옵션 */
.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

/* 로그인 버튼 */
.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 24px;
}

/* 소셜 로그인 */
.social-login-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-button {
  width: 100%;
  height: 48px;
  font-size: 14px;
  font-weight: 500;
}

.google-button {
  background: #fff;
  border: 1px solid #ddd;
  color: #333;
}

.google-button:hover {
  background: #f9f9f9;
}

.naver-button {
  background: #03c75a;
  border: 1px solid #03c75a;
  color: white;
}

.naver-button:hover {
  background: #02b351;
}

.social-icon {
  width: 20px;
  height: 20px;
}

/* 회원가입 섹션 */
.register-section {
  text-align: center;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.register-text {
  font-size: 14px;
  color: #666;
}

/* QR 로그인 */
.qr-card {
  border-radius: 12px;
}

.qr-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px;
}

.qr-text {
  flex: 1;
}

.qr-text h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #333;
}

.qr-text p {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.qr-button {
  flex-shrink: 0;
}

/* 다이얼로그 */
.dialog-footer {
  text-align: right;
}

/* 모바일 최적화 */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }
  
  .login-content {
    max-width: 100%;
  }
  
  .app-title {
    font-size: 24px;
  }
  
  .qr-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .qr-text {
    text-align: center;
  }
}

/* 다크모드 지원 */
@media (prefers-color-scheme: dark) {
  .login-container {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%);
  }
  
  .app-title {
    color: #64b5f6;
  }
  
  .app-description {
    color: #a0a0a0;
  }
}

/* 접근성 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>