<template>
  <div class="login-container">
    <div class="login-background">
      <div class="background-pattern"></div>
    </div>

    <div class="login-content">
      <el-card class="login-card">
        <div class="login-header">
          <div class="logo-section">
            <el-icon :size="48" color="var(--color-brand-primary)">
              <Lock />
            </el-icon>
            <h2 class="login-title">QR 안전교육</h2>
            <p class="login-subtitle">스마트한 안전교육의 시작</p>
          </div>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          @submit.prevent="handleLogin"
          label-position="top"
          class="login-form"
        >
          <el-form-item prop="email" class="form-item">
            <el-input
              v-model="loginForm.email"
              type="email"
              placeholder="이메일 주소를 입력하세요"
              :prefix-icon="Message"
              autocomplete="username"
              size="large"
              class="form-input"
            />
          </el-form-item>

          <el-form-item prop="password" class="form-item">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              :prefix-icon="Lock"
              show-password
              autocomplete="current-password"
              size="large"
              class="form-input"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item class="form-item">
            <el-button
              type="primary"
              :loading="isLoading"
              size="large"
              class="login-button"
              @click="handleLogin"
            >
              <span v-if="!isLoading">로그인</span>
              <span v-else>로그인 중...</span>
            </el-button>
          </el-form-item>

          <el-form-item class="form-item">
            <el-button
              link
              class="forgot-password-link"
              @click="handleForgotPassword"
            >
              비밀번호를 잊으셨나요?
            </el-button>
          </el-form-item>

          <el-divider class="divider">
            <span class="divider-text">또는</span>
          </el-divider>

          <el-form-item class="form-item">
            <el-button
              type="default"
              size="large"
              :loading="isGoogleLoading"
              class="google-login-button"
              @click="handleGoogleLogin"
            >
              <template #icon>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </template>
              <span v-if="!isGoogleLoading">Google로 로그인</span>
              <span v-else>Google 로그인 중...</span>
            </el-button>
          </el-form-item>

          <el-form-item class="form-item register-section">
            <p class="register-text">
              아직 계정이 없으신가요?
              <el-button link type="primary" @click="goRegister" class="register-link">
                회원가입
              </el-button>
            </p>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 안전교육 특징 소개 -->
      <div class="features-section">
        <h3 class="features-title">QR 안전교육 특징</h3>
        <div class="features-grid">
          <div class="feature-item">
            <el-icon :size="24" color="var(--color-brand-primary)">
              <Camera />
            </el-icon>
            <span>QR 코드 스캔</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24" color="var(--color-brand-secondary)">
              <Document />
            </el-icon>
            <span>체계적인 교육</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24" color="var(--color-warning)">
              <Trophy />
            </el-icon>
            <span>수료증 발급</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24" color="var(--color-brand-secondary-dark)">
              <VideoPlay />
            </el-icon>
            <span>실시간 진도</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Message, Lock, Camera, Document, Trophy, VideoPlay } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth.ts'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref()
const isLoading = ref(false)
const isGoogleLoading = ref(false)

const loginForm = reactive({
  email: '',
  password: ''
})

const loginRules = {
  email: [
    { required: true, message: '이메일을 입력하세요.', trigger: 'blur' },
    { type: 'email', message: '유효한 이메일을 입력하세요.', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '비밀번호를 입력하세요.', trigger: 'blur' },
    { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다.', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    isLoading.value = true
    try {
      const success = await authStore.login({
        email: loginForm.email,
        password: loginForm.password
      })
      if (success) {
        authStore.initializeAuth() // 인증 상태 재초기화
        ElMessage.success('안전교육 플랫폼에 오신 것을 환영합니다!')
        router.replace('/home')
      } else {
        ElMessage.error(authStore.error || '로그인에 실패했습니다.')
      }
    } finally {
      isLoading.value = false
    }
  })
}

const handleGoogleLogin = async () => {
  isGoogleLoading.value = true
  try {
    const success = await authStore.signInWithGoogle()
    if (success) {
      authStore.initializeAuth() // 인증 상태 재초기화
      ElMessage.success('Google 계정으로 안전하게 로그인되었습니다!')
      router.replace('/home')
    } else {
      ElMessage.error(authStore.error || 'Google 로그인에 실패했습니다.')
    }
  } finally {
    isGoogleLoading.value = false
  }
}

const handleForgotPassword = () => {
  ElMessage.info('비밀번호 재설정 기능은 준비 중입니다.')
}

const goRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-background);
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(103, 194, 58, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(64, 158, 255, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
  animation: float 25s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-8px) rotate(0.5deg); }
  66% { transform: translateY(8px) rotate(-0.5deg); }
}

.login-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
  padding: var(--spacing-5);
}

.login-card {
  border-radius: var(--border-radius-2xl);
  box-shadow: var(--box-shadow-company);
  border: 1px solid var(--border-color-extra-light);
  background: var(--color-brand-base);
  backdrop-filter: blur(20px);
  overflow: hidden;
}

:deep(.login-card .el-card__body) {
  padding: var(--spacing-8) var(--spacing-6);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
}

.login-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
  background: var(--gradient-company);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-color-regular);
  margin: 0;
  font-weight: var(--font-weight-medium);
}

.login-form {
  width: 100%;
}

.form-item {
  margin-bottom: var(--spacing-5);
}

.form-item:last-child {
  margin-bottom: 0;
}

:deep(.form-input .el-input__wrapper) {
  border-radius: var(--border-radius-xl);
  box-shadow: var(--box-shadow-sm);
  border: 1px solid var(--border-color-light);
  background: var(--color-brand-base);
  transition: var(--transition-all);
}

:deep(.form-input .el-input__wrapper:hover) {
  border-color: var(--color-brand-primary);
  box-shadow: var(--box-shadow-green);
}

:deep(.form-input .el-input__wrapper.is-focus) {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.1);
}

.login-button {
  width: 100%;
  border-radius: var(--border-radius-xl);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  padding: var(--spacing-4) var(--spacing-6);
  background: var(--gradient-company);
  border: none;
  box-shadow: var(--box-shadow-company);
  transition: var(--transition-all);
}

.login-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--box-shadow-green-lg);
  background: var(--gradient-company-reverse);
}

.login-button:active {
  transform: translateY(0);
}

.forgot-password-link {
  width: 100%;
  color: var(--text-color-regular);
  font-size: var(--font-size-sm);
  padding: var(--spacing-2);
}

.forgot-password-link:hover {
  color: var(--color-brand-primary);
}

.divider {
  margin: var(--spacing-6) 0;
  border-color: var(--border-color-light);
}

.divider-text {
  color: var(--text-color-secondary);
  font-size: var(--font-size-sm);
  padding: 0 var(--spacing-4);
  background: var(--color-brand-base);
}

.google-login-button {
  width: 100%;
  border-radius: var(--border-radius-xl);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
  padding: var(--spacing-4) var(--spacing-6);
  border: 1px solid var(--border-color-base);
  background: var(--color-brand-base);
  color: var(--text-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  transition: var(--transition-all);
}

.google-login-button:hover {
  border-color: var(--color-brand-secondary);
  box-shadow: var(--box-shadow-blue);
  transform: translateY(-1px);
}

.register-section {
  text-align: center;
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--border-color-extra-light);
}

.register-text {
  margin: 0;
  color: var(--text-color-regular);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.register-link {
  font-weight: var(--font-weight-semibold);
  padding: 0;
  font-size: var(--font-size-sm);
  color: var(--color-brand-primary);
}

.register-link:hover {
  color: var(--color-brand-primary-dark);
}

.features-section {
  margin-top: var(--spacing-8);
  text-align: center;
}

.features-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-color-primary);
  margin: 0 0 var(--spacing-5) 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color-extra-light);
  transition: var(--transition-all);
  backdrop-filter: blur(10px);
}

.feature-item:hover {
  background: var(--color-brand-base);
  transform: translateY(-2px);
  box-shadow: var(--box-shadow-sm);
  border-color: var(--border-color-light);
}

.feature-item span {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-color-regular);
  text-align: center;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .login-content {
    max-width: 400px;
    padding: var(--spacing-4);
  }

  :deep(.login-card .el-card__body) {
    padding: var(--spacing-6) var(--spacing-4);
  }

  .login-title {
    font-size: var(--font-size-2xl);
  }

  .login-subtitle {
    font-size: var(--font-size-sm);
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-3);
  }

  .feature-item {
    flex-direction: row;
    justify-content: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
  }

  .feature-item span {
    text-align: left;
  }
}

@media (max-width: 480px) {
  .login-content {
    padding: var(--spacing-3);
  }

  :deep(.login-card .el-card__body) {
    padding: var(--spacing-5) var(--spacing-3);
  }

  .login-title {
    font-size: var(--font-size-xl);
  }

  .form-item {
    margin-bottom: var(--spacing-4);
  }

  .login-button,
  .google-login-button {
    padding: var(--spacing-3) var(--spacing-4);
  }
}

/* 접근성 개선 */
@media (prefers-reduced-motion: reduce) {
  .background-pattern {
    animation: none;
  }

  .login-button:hover,
  .google-login-button:hover,
  .feature-item:hover {
    transform: none;
  }
}

/* 다크 모드 지원 */
@media (prefers-color-scheme: dark) {
  .login-card {
    background: var(--color-brand-base);
    border-color: var(--border-color-base);
  }

  .feature-item {
    background: rgba(31, 41, 55, 0.8);
    border-color: var(--border-color-base);
  }

  .feature-item:hover {
    background: var(--color-brand-base);
  }

  .divider-text {
    background: var(--color-brand-base);
  }
}

</style>
