<template>
  <div class="login-container">
    <!-- 배경 애니메이션 -->
    <div class="background-animation">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>

    <!-- 언어 선택 -->
    <div class="language-selector">
      <el-select v-model="selectedLanguage" size="small" class="language-select">
        <el-option label="한국어" value="ko">
          <div class="language-option">
            <span class="flag">🇰🇷</span>
            <span>한국어</span>
          </div>
        </el-option>
        <el-option label="English" value="en">
          <div class="language-option">
            <span class="flag">🇺🇸</span>
            <span>English</span>
          </div>
        </el-option>
      </el-select>
    </div>

    <div class="login-content">
      <!-- 로그인 카드 -->
      <div class="login-card">
        <!-- 로고 섹션 -->
        <div class="logo-section">
          <div class="logo-container">
            <div class="logo-icon">
              <el-icon :size="28" color="#ffffff">
                <Lock />
              </el-icon>
            </div>
            <div class="logo-glow"></div>
          </div>
          <h1 class="app-title">QR 안전교육</h1>
          <p class="app-subtitle">스마트한 안전교육의 시작</p>
        </div>

        <!-- 로그인 폼 -->
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          @submit.prevent="handleLogin"
          class="login-form"
        >
          <div class="input-group">
            <el-form-item prop="email">
              <el-input
                v-model="loginForm.email"
                type="email"
                placeholder="아이디 입력"
                size="large"
                class="modern-input"
                autocomplete="username"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="비밀번호 입력"
                size="large"
                class="modern-input"
                show-password
                autocomplete="current-password"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
          </div>

          <!-- 버튼 그룹 -->
          <div class="button-group">
            <el-button
              type="primary"
              :loading="isLoading"
              size="large"
              class="login-button primary-button"
              @click="handleLogin"
            >
              <span v-if="!isLoading">로그인</span>
              <span v-else>로그인 중...</span>
            </el-button>

            <el-button
              size="large"
              class="guest-button secondary-button"
              @click="handleGuestLogin"
            >
              게스트 로그인
            </el-button>
          </div>

          <!-- 링크 섹션 -->
          <div class="links-section">
            <el-button
              link
              class="forgot-password"
              @click="handleForgotPassword"
            >
              계정이 없으신가요? <span class="highlight">가입하기</span>
            </el-button>
          </div>

          <!-- 구분선 -->
          <div class="divider-section">
            <div class="divider-line"></div>
            <span class="divider-text">또는</span>
            <div class="divider-line"></div>
          </div>

          <!-- 소셜 로그인 -->
          <div class="social-section">
            <p class="social-title">간편 로그인</p>
            <div class="social-login">
              <button class="social-button naver" @click="handleNaverLogin">
                <div class="social-icon-wrapper">
                  <span class="social-icon naver-icon">N</span>
                </div>
                <span class="social-ripple"></span>
              </button>
              <button class="social-button google" @click="handleGoogleLogin">
                <div class="social-icon-wrapper">
                  <svg class="social-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <span class="social-ripple"></span>
              </button>
              <button class="social-button apple" @click="handleAppleLogin">
                <div class="social-icon-wrapper">
                  <svg class="social-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <span class="social-ripple"></span>
              </button>
            </div>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth.ts'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref()
const isLoading = ref(false)
const isGoogleLoading = ref(false)
const selectedLanguage = ref('ko')

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
        authStore.initializeAuth()
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

const handleGuestLogin = async () => {
  try {
    ElMessage.success('게스트로 로그인되었습니다!')
    router.replace('/home')
  } catch (error) {
    ElMessage.error('게스트 로그인에 실패했습니다.')
  }
}

const handleGoogleLogin = async () => {
  isGoogleLoading.value = true
  try {
    const success = await authStore.signInWithGoogle()
    if (success) {
      authStore.initializeAuth()
      ElMessage.success('Google 계정으로 안전하게 로그인되었습니다!')
      router.replace('/home')
    } else {
      ElMessage.error(authStore.error || 'Google 로그인에 실패했습니다.')
    }
  } finally {
    isGoogleLoading.value = false
  }
}

const handleNaverLogin = () => {
  ElMessage.info('네이버 로그인 기능은 준비 중입니다.')
}

const handleAppleLogin = () => {
  ElMessage.info('Apple 로그인 기능은 준비 중입니다.')
}

const handleForgotPassword = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 배경 애니메이션 */
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 15%;
  animation-delay: -5s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  bottom: 20%;
  left: 20%;
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-30px) rotate(120deg); }
  66% { transform: translateY(20px) rotate(240deg); }
}

/* 언어 선택 */
.language-selector {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
}

.language-select {
  width: 130px;
}

:deep(.language-select .el-select__wrapper) {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 12px;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flag {
  font-size: 14px;
}

/* 메인 콘텐츠 */
.login-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  z-index: 1;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 28px;
  padding: 48px 40px;
  width: 100%;
  max-width: 380px;
  box-shadow:
    0 32px 64px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
}

/* 로고 섹션 */
.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-container {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.logo-icon {
  background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-primary-light));
  width: 72px;
  height: 72px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow:
    0 20px 40px rgba(103, 194, 58, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  position: relative;
  z-index: 2;
}

.logo-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: radial-gradient(circle, rgba(103, 194, 58, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse-glow 3s ease-in-out infinite;
  z-index: 1;
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
}

.app-title {
  font-size: 28px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #1a1a1a, #4a4a4a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.app-subtitle {
  color: #6c757d;
  font-size: 15px;
  font-weight: 500;
  margin: 0;
  opacity: 0.8;
}

/* 폼 스타일 */
.login-form {
  width: 100%;
}

.login-form .el-form-item {
  margin-bottom: 24px;
}

.input-group {
  margin-bottom: 32px;
}

/* 입력 아이콘 제거 */

:deep(.modern-input .el-input__wrapper) {
  background: #f8f9fb;
  border: 2px solid #e9ecef;
  border-radius: 18px;
  padding: 18px 20px;
  box-shadow: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 56px;
  width: 100%;
}

:deep(.modern-input .el-input__wrapper:hover) {
  border-color: var(--color-brand-primary);
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.1);
}

:deep(.modern-input .el-input__wrapper.is-focus) {
  border-color: var(--color-brand-primary);
  background: #ffffff;
  box-shadow:
    0 4px 12px rgba(103, 194, 58, 0.15),
    0 0 0 4px rgba(103, 194, 58, 0.1);
  transform: translateY(-1px);
}

:deep(.modern-input .el-input__inner) {
  color: #1a1a1a;
  font-weight: 500;
  font-size: 15px;
}

:deep(.modern-input .el-input__inner::placeholder) {
  color: #9ca3af;
  font-weight: 400;
}

/* 버튼 스타일 */
.button-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.primary-button {
  background: var(--color-brand-primary);
  border: none;
  border-radius: 18px;
  padding: 18px 24px;
  font-size: 16px;
  font-weight: 700;
  color: white;
  min-height: 56px;
  width: 100%;
  box-shadow:
    0 8px 20px rgba(103, 194, 58, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.primary-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 28px rgba(103, 194, 58, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.primary-button:hover::before {
  left: 100%;
}

.secondary-button {
  background: #f8f9fb;
  border: 2px solid #e9ecef;
  border-radius: 18px;
  padding: 18px 24px;
  font-size: 16px;
  font-weight: 600;
  color: #6c757d;
  min-height: 56px;
  width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.secondary-button:hover {
  border-color: var(--color-brand-primary);
  color: var(--color-brand-primary);
  background: rgba(103, 194, 58, 0.05);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.15);
}

/* 링크 섹션 */
.links-section {
  text-align: center;
  margin-bottom: 32px;
}

.forgot-password {
  color: #6c757d;
  font-size: 14px;
  font-weight: 500;
  padding: 12px;
  transition: all 0.3s ease;
}

.forgot-password:hover {
  color: var(--color-brand-primary);
}

.highlight {
  color: #8B5CF6;
  font-weight: 600;
}

/* 구분선 */
.divider-section {
  display: flex;
  align-items: center;
  margin: 32px 0;
  gap: 16px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e9ecef, transparent);
}

.divider-text {
  color: #9ca3af;
  font-size: 13px;
  font-weight: 500;
  padding: 0 8px;
  background: white;
}

/* 소셜 로그인 */
.social-section {
  text-align: center;
}

.social-title {
  color: #6c757d;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 20px 0;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.social-button {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #f8f9fb;
  border: 2px solid #e9ecef;
  position: relative;
  overflow: hidden;
}

.social-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.social-button.naver {
  background: linear-gradient(135deg, #03C75A, #02b351);
  border-color: #03C75A;
}

.social-button.naver:hover {
  box-shadow: 0 12px 24px rgba(3, 199, 90, 0.4);
}

.social-button.google {
  background: white;
  border-color: #e9ecef;
}

.social-button.google:hover {
  border-color: #4285F4;
  box-shadow: 0 12px 24px rgba(66, 133, 244, 0.2);
}

.social-button.apple {
  background: linear-gradient(135deg, #000000, #333333);
  border-color: #000000;
  color: white;
}

.social-button.apple:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
}

.social-icon-wrapper {
  position: relative;
  z-index: 2;
}

.social-icon {
  width: 28px;
  height: 28px;
}

.naver-icon {
  color: white;
  font-weight: bold;
  font-size: 24px;
}

.social-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.social-button:active .social-ripple {
  width: 120px;
  height: 120px;
}

/* 반응형 */
@media (max-width: 480px) {
  .login-card {
    padding: 36px 28px;
    margin: 20px;
    border-radius: 24px;
  }

  .language-selector {
    top: 20px;
    right: 20px;
  }

  .app-title {
    font-size: 24px;
  }

  .app-subtitle {
    font-size: 14px;
  }

  .social-login {
    gap: 16px;
  }

  .social-button {
    width: 56px;
    height: 56px;
    border-radius: 16px;
  }

  .social-icon {
    width: 24px;
    height: 24px;
  }

  .naver-icon {
    font-size: 20px;
  }

  .shape {
    display: none;
  }
}

/* 접근성 */
@media (prefers-reduced-motion: reduce) {
  .shape,
  .logo-glow,
  .primary-button::before {
    animation: none;
  }

  .primary-button:hover,
  .secondary-button:hover,
  .social-button:hover {
    transform: none;
  }
}
</style>
