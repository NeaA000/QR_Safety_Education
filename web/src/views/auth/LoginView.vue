<template>
  <div class="login-container">
    <!-- 헤더 영역 -->
    <div class="login-header">
      <div class="logo-section">
        <el-icon :size="48" color="#409EFF">
          <Shield />
        </el-icon>
        <h1 class="app-title">QR 안전교육</h1>
        <p class="app-subtitle">안전한 교육 환경을 위한 스마트 솔루션</p>
      </div>
    </div>

    <!-- 메인 로그인 폼 -->
    <div class="login-form-container">
      <el-card class="login-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon :size="24" color="#409EFF">
              <User />
            </el-icon>
            <span class="card-title">로그인</span>
          </div>
        </template>

        <!-- 탭 전환 -->
        <el-tabs v-model="activeTab" class="login-tabs">
          <!-- 이메일 로그인 탭 -->
          <el-tab-pane label="이메일 로그인" name="email">
            <el-form
              ref="emailFormRef"
              :model="emailForm"
              :rules="emailRules"
              @submit.prevent="handleEmailLogin"
              size="large"
              label-position="top"
            >
              <el-form-item label="이메일" prop="email">
                <el-input
                  v-model="emailForm.email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  :prefix-icon="Message"
                  clearable
                  @keyup.enter="handleEmailLogin"
                />
              </el-form-item>

              <el-form-item label="비밀번호" prop="password">
                <el-input
                  v-model="emailForm.password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  :prefix-icon="Lock"
                  show-password
                  clearable
                  @keyup.enter="handleEmailLogin"
                />
              </el-form-item>

              <el-form-item>
                <div class="form-options">
                  <el-checkbox v-model="rememberMe">로그인 상태 유지</el-checkbox>
                  <el-button
                    type="primary"
                    link
                    @click="showForgotPassword = true"
                  >
                    비밀번호 찾기
                  </el-button>
                </div>
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  :loading="authStore.isLoading"
                  @click="handleEmailLogin"
                  class="login-button"
                  size="large"
                >
                  <template #loading>
                    <el-icon class="is-loading">
                      <Loading />
                    </el-icon>
                  </template>
                  <el-icon v-if="!authStore.isLoading">
                    <UserFilled />
                  </el-icon>
                  로그인
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 소셜 로그인 탭 -->
          <el-tab-pane label="소셜 로그인" name="social">
            <div class="social-login-section">
              <p class="social-login-description">
                간편하게 소셜 계정으로 로그인하세요
              </p>

              <!-- 구글 로그인 (향후 구현) -->
              <el-button
                class="social-button google-button"
                size="large"
                @click="handleGoogleLogin"
                disabled
              >
                <el-icon>
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </el-icon>
                Google로 로그인 (준비중)
              </el-button>

              <!-- 네이버 로그인 (향후 구현) -->
              <el-button
                class="social-button naver-button"
                size="large"
                @click="handleNaverLogin"
                disabled
              >
                <el-icon>
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <rect width="24" height="24" fill="#03C75A"/>
                    <path fill="white" d="M16.273 12.845L7.376 0H0v24h7.727V11.156L16.624 24H24V0h-7.727v12.845z"/>
                  </svg>
                </el-icon>
                네이버로 로그인 (준비중)
              </el-button>
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- 게스트 로그인 -->
        <div class="guest-login-section">
          <el-divider>또는</el-divider>
          <el-button
            type="info"
            :loading="authStore.isLoading"
            @click="handleGuestLogin"
            class="guest-button"
            size="large"
            plain
          >
            <el-icon v-if="!authStore.isLoading">
              <UserFilled />
            </el-icon>
            게스트로 시작하기
          </el-button>
          <p class="guest-description">
            회원가입 없이 일부 기능을 체험해보세요
          </p>
        </div>

        <!-- 회원가입 링크 -->
        <div class="register-section">
          <el-divider />
          <p class="register-text">
            아직 계정이 없으신가요?
            <el-button
              type="primary"
              link
              @click="$router.push('/auth/register')"
              class="register-link"
            >
              회원가입하기
            </el-button>
          </p>
        </div>
      </el-card>
    </div>

    <!-- 비밀번호 찾기 다이얼로그 -->
    <el-dialog
      v-model="showForgotPassword"
      title="비밀번호 찾기"
      width="400px"
      :show-close="true"
    >
      <el-form
        ref="forgotPasswordFormRef"
        :model="forgotPasswordForm"
        :rules="forgotPasswordRules"
        @submit.prevent="handleForgotPassword"
      >
        <el-form-item label="이메일" prop="email">
          <el-input
            v-model="forgotPasswordForm.email"
            type="email"
            placeholder="가입한 이메일을 입력하세요"
            :prefix-icon="Message"
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showForgotPassword = false">취소</el-button>
        <el-button
          type="primary"
          :loading="authStore.isLoading"
          @click="handleForgotPassword"
        >
          재설정 이메일 발송
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Shield,
  User,
  UserFilled,
  Message,
  Lock,
  Loading
} from '@element-plus/icons-vue'

// 컴포넌트 설정
const router = useRouter()
const authStore = useAuthStore()

// 반응형 상태
const activeTab = ref('email')
const rememberMe = ref(false)
const showForgotPassword = ref(false)

// 폼 참조
const emailFormRef = ref<FormInstance>()
const forgotPasswordFormRef = ref<FormInstance>()

// 이메일 로그인 폼 데이터
const emailForm = reactive({
  email: '',
  password: ''
})

// 비밀번호 찾기 폼 데이터
const forgotPasswordForm = reactive({
  email: ''
})

// 폼 검증 규칙
const emailRules: FormRules = {
  email: [
    { required: true, message: '이메일을 입력하세요', trigger: 'blur' },
    { type: 'email', message: '올바른 이메일 형식을 입력하세요', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '비밀번호를 입력하세요', trigger: 'blur' },
    { min: 6, message: '비밀번호는 6자 이상이어야 합니다', trigger: 'blur' }
  ]
}

const forgotPasswordRules: FormRules = {
  email: [
    { required: true, message: '이메일을 입력하세요', trigger: 'blur' },
    { type: 'email', message: '올바른 이메일 형식을 입력하세요', trigger: 'blur' }
  ]
}

// 이메일 로그인 처리
const handleEmailLogin = async () => {
  if (!emailFormRef.value) return

  try {
    const valid = await emailFormRef.value.validate()
    if (!valid) return

    await authStore.loginWithEmail(emailForm.email, emailForm.password)

    // 로그인 성공 시 홈으로 이동
    await router.push('/')
  } catch (error) {
    console.error('로그인 처리 중 오류:', error)
  }
}

// 게스트 로그인 처리
const handleGuestLogin = async () => {
  try {
    await authStore.loginAsGuest()

    // 게스트 로그인 시 가이드 메시지
    await ElMessageBox.alert(
      '게스트로 로그인했습니다.\n일부 기능은 제한될 수 있으며, 언제든지 회원가입하여 모든 기능을 이용하실 수 있습니다.',
      '게스트 로그인 완료',
      {
        confirmButtonText: '확인',
        type: 'info'
      }
    )

    await router.push('/')
  } catch (error) {
    console.error('게스트 로그인 처리 중 오류:', error)
  }
}

// 비밀번호 찾기 처리
const handleForgotPassword = async () => {
  if (!forgotPasswordFormRef.value) return

  try {
    const valid = await forgotPasswordFormRef.value.validate()
    if (!valid) return

    await authStore.resetPassword(forgotPasswordForm.email)

    showForgotPassword.value = false
    forgotPasswordForm.email = ''
  } catch (error) {
    console.error('비밀번호 찾기 처리 중 오류:', error)
  }
}

// 구글 로그인 (향후 구현)
const handleGoogleLogin = () => {
  ElMessage.info('구글 로그인 기능은 곧 추가될 예정입니다.')
}

// 네이버 로그인 (향후 구현)
const handleNaverLogin = () => {
  ElMessage.info('네이버 로그인 기능은 곧 추가될 예정입니다.')
}

// 마운트 시 이미 로그인된 경우 홈으로 리디렉션
onMounted(() => {
  if (authStore.isLoggedIn) {
    router.push('/')
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.login-header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
  margin-top: 40px;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.app-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 300;
}

.login-form-container {
  width: 100%;
  max-width: 420px;
}

.login-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #303133;
}

.login-tabs {
  margin-bottom: 20px;
}

.login-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
}

.social-login-section {
  padding: 20px 0;
}

.social-login-description {
  text-align: center;
  color: #606266;
  margin-bottom: 20px;
  font-size: 14px;
}

.social-button {
  width: 100%;
  height: 48px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  border-radius: 8px;
}

.google-button {
  background-color: #fff;
  border-color: #dadce0;
  color: #3c4043;
}

.google-button:hover {
  background-color: #f8f9fa;
}

.naver-button {
  background-color: #03C75A;
  border-color: #03C75A;
  color: white;
}

.naver-button:hover {
  background-color: #02b350;
}

.guest-login-section {
  text-align: center;
  padding: 20px 0;
}

.guest-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  margin-bottom: 8px;
}

.guest-description {
  color: #909399;
  font-size: 13px;
  margin: 0;
}

.register-section {
  text-align: center;
  padding-top: 10px;
}

.register-text {
  color: #606266;
  font-size: 14px;
  margin: 8px 0 0 0;
}

.register-link {
  font-weight: 600;
  padding: 0;
  margin-left: 4px;
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }

  .app-title {
    font-size: 2rem;
  }

  .app-subtitle {
    font-size: 1rem;
  }

  .login-form-container {
    max-width: 100%;
  }

  .form-options {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}

/* 다크 모드 대응 */
@media (prefers-color-scheme: dark) {
  .card-title {
    color: #e5eaf3;
  }

  .social-login-description,
  .guest-description,
  .register-text {
    color: #a3a6ad;
  }
}
</style>
