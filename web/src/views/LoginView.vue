<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 class="login-title">QR 안전교육 로그인</h2>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        @submit.prevent="handleLogin"
        label-position="top"
      >
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            type="email"
            placeholder="이메일"
            :prefix-icon="Message"
            autocomplete="username"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="비밀번호"
            :prefix-icon="Lock"
            show-password
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="isLoading"
            style="width: 100%"
            @click="handleLogin"
          >로그인</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="text" style="width: 100%" @click="handleForgotPassword">
            비밀번호 재설정
          </el-button>
        </el-form-item>
        <el-divider>또는</el-divider>
        <el-form-item>
          <el-button
            type="default"
            style="width: 100%"
            :loading="isGoogleLoading"
            @click="handleGoogleLogin"
          >
            Google로 로그인
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="text" style="width: 100%" @click="goRegister">
            회원가입
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Message, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

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
    { required: true, message: '비밀번호를 입력하세요.', trigger: 'blur' }
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
        ElMessage.success('로그인되었습니다.')
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
      ElMessage.success('Google 로그인되었습니다.')
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
  ElMessage.info('회원가입은 관리자에게 문의해주세요.')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}
.login-card {
  max-width: 400px;
  width: 100%;
  padding: 32px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}
.login-title {
  text-align: center;
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 700;
  color: #409EFF;
}
</style>