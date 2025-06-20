<template>
  <div class="register-container">
    <!-- 헤더 영역 -->
    <div class="register-header">
      <el-button
        type="primary"
        :icon="ArrowLeft"
        @click="$router.back()"
        class="back-button"
        circle
      />

      <div class="logo-section">
        <el-icon :size="40" color="#409EFF">
          <Shield />
        </el-icon>
        <h1 class="app-title">회원가입</h1>
        <p class="app-subtitle">QR 안전교육 서비스에 가입하세요</p>
      </div>
    </div>

    <!-- 회원가입 폼 -->
    <div class="register-form-container">
      <el-card class="register-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon :size="24" color="#409EFF">
              <UserFilled />
            </el-icon>
            <span class="card-title">
              {{ isUpgradeMode ? '게스트 계정 업그레이드' : '새 계정 만들기' }}
            </span>
          </div>
        </template>

        <!-- 진행 단계 -->
        <el-steps
          :active="currentStep"
          align-center
          class="register-steps"
          :space="80"
        >
          <el-step title="기본정보" :icon="User" />
          <el-step title="추가정보" :icon="IdCard" />
          <el-step title="약관동의" :icon="DocumentChecked" />
        </el-steps>

        <!-- 1단계: 기본 정보 -->
        <div v-show="currentStep === 0" class="step-content">
          <el-form
            ref="basicFormRef"
            :model="registerForm"
            :rules="basicRules"
            label-position="top"
            size="large"
          >
            <el-form-item label="이메일" prop="email">
              <el-input
                v-model="registerForm.email"
                type="email"
                placeholder="example@email.com"
                :prefix-icon="Message"
                clearable
              />
            </el-form-item>

            <el-form-item label="비밀번호" prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="8자 이상, 영문+숫자 포함"
                :prefix-icon="Lock"
                show-password
                clearable
              />
              <div class="password-strength">
                <div class="strength-bar">
                  <div
                    class="strength-fill"
                    :class="passwordStrengthClass"
                    :style="{ width: passwordStrengthWidth }"
                  />
                </div>
                <span class="strength-text" :class="passwordStrengthClass">
                  {{ passwordStrengthText }}
                </span>
              </div>
            </el-form-item>

            <el-form-item label="비밀번호 확인" prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                :prefix-icon="Lock"
                show-password
                clearable
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 2단계: 추가 정보 -->
        <div v-show="currentStep === 1" class="step-content">
          <el-form
            ref="detailFormRef"
            :model="registerForm"
            :rules="detailRules"
            label-position="top"
            size="large"
          >
            <el-form-item label="이름" prop="name">
              <el-input
                v-model="registerForm.name"
                placeholder="실명을 입력하세요"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>

            <el-form-item label="전화번호" prop="phone">
              <el-input
                v-model="registerForm.phone"
                placeholder="010-1234-5678"
                :prefix-icon="Phone"
                clearable
              />
            </el-form-item>

            <el-form-item label="생년월일" prop="dob">
              <el-date-picker
                v-model="registerForm.dob"
                type="date"
                placeholder="생년월일을 선택하세요"
                :editable="false"
                :clearable="false"
                value-format="YYYY-MM-DD"
                format="YYYY년 MM월 DD일"
                :disabled-date="disabledDate"
                style="width: 100%"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 3단계: 약관 동의 -->
        <div v-show="currentStep === 2" class="step-content">
          <div class="terms-section">
            <h3 class="terms-title">
              <el-icon><DocumentChecked /></el-icon>
              서비스 이용약관
            </h3>

            <el-checkbox
              v-model="termsAgreement.all"
              @change="handleAllTermsChange"
              class="all-terms-checkbox"
              size="large"
            >
              모든 약관에 동의합니다
            </el-checkbox>

            <el-divider />

            <div class="terms-list">
              <el-checkbox
                v-model="termsAgreement.service"
                class="terms-item"
                @change="checkAllTermsStatus"
              >
                <span class="required-mark">[필수]</span>
                서비스 이용약관 동의
                <el-button type="primary" link @click="showTermsDialog('service')">
                  내용보기
                </el-button>
              </el-checkbox>

              <el-checkbox
                v-model="termsAgreement.privacy"
                class="terms-item"
                @change="checkAllTermsStatus"
              >
                <span class="required-mark">[필수]</span>
                개인정보 처리방침 동의
                <el-button type="primary" link @click="showTermsDialog('privacy')">
                  내용보기
                </el-button>
              </el-checkbox>

              <el-checkbox
                v-model="termsAgreement.marketing"
                class="terms-item"
                @change="checkAllTermsStatus"
              >
                <span class="optional-mark">[선택]</span>
                마케팅 정보 수신 동의
                <el-button type="primary" link @click="showTermsDialog('marketing')">
                  내용보기
                </el-button>
              </el-checkbox>

              <el-checkbox
                v-model="termsAgreement.age"
                class="terms-item"
                @change="checkAllTermsStatus"
              >
                <span class="required-mark">[필수]</span>
                만 13세 이상입니다
              </el-checkbox>
            </div>
          </div>
        </div>

        <!-- 버튼 영역 -->
        <div class="button-section">
          <el-button
            v-if="currentStep > 0"
            size="large"
            @click="previousStep"
            class="step-button"
          >
            <el-icon><ArrowLeft /></el-icon>
            이전
          </el-button>

          <el-button
            v-if="currentStep < 2"
            type="primary"
            size="large"
            @click="nextStep"
            class="step-button"
          >
            다음
            <el-icon><ArrowRight /></el-icon>
          </el-button>

          <el-button
            v-if="currentStep === 2"
            type="primary"
            size="large"
            :loading="authStore.isLoading"
            @click="handleRegister"
            class="register-button"
            :disabled="!canRegister"
          >
            <template #loading>
              <el-icon class="is-loading">
                <Loading />
              </el-icon>
            </template>
            <el-icon v-if="!authStore.isLoading">
              <Check />
            </el-icon>
            {{ isUpgradeMode ? '계정 업그레이드' : '회원가입 완료' }}
          </el-button>
        </div>

        <!-- 로그인 링크 -->
        <div v-if="!isUpgradeMode" class="login-section">
          <el-divider />
          <p class="login-text">
            이미 계정이 있으신가요?
            <el-button
              type="primary"
              link
              @click="$router.push('/auth/login')"
              class="login-link"
            >
              로그인하기
            </el-button>
          </p>
        </div>
      </el-card>
    </div>

    <!-- 약관 상세 다이얼로그 -->
    <el-dialog
      v-model="showTermsDetailDialog"
      :title="currentTermsTitle"
      width="80%"
      max-width="600px"
    >
      <div class="terms-content" v-html="currentTermsContent"></div>
      <template #footer>
        <el-button type="primary" @click="showTermsDetailDialog = false">
          확인
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RegisterData } from '@/stores/auth'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Shield,
  UserFilled,
  User,
  IdCard,
  DocumentChecked,
  Message,
  Lock,
  Phone,
  ArrowLeft,
  ArrowRight,
  Loading,
  Check
} from '@element-plus/icons-vue'

// 컴포넌트 설정
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 게스트 계정 업그레이드 모드 여부
const isUpgradeMode = computed(() => route.query.upgrade === 'true' && authStore.isAnonymous)

// 반응형 상태
const currentStep = ref(0)
const showTermsDetailDialog = ref(false)
const currentTermsTitle = ref('')
const currentTermsContent = ref('')

// 폼 참조
const basicFormRef = ref<FormInstance>()
const detailFormRef = ref<FormInstance>()

// 회원가입 폼 데이터
const registerForm = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  phone: '',
  dob: null as Date | null
})

// 약관 동의 상태
const termsAgreement = reactive({
  all: false,
  service: false,
  privacy: false,
  marketing: false,
  age: false
})

// 폼 검증 규칙
const basicRules: FormRules = {
  email: [
    { required: true, message: '이메일을 입력하세요', trigger: 'blur' },
    { type: 'email', message: '올바른 이메일 형식을 입력하세요', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '비밀번호를 입력하세요', trigger: 'blur' },
    { min: 8, message: '비밀번호는 8자 이상이어야 합니다', trigger: 'blur' },
    {
      pattern: /^(?=.*[a-zA-Z])(?=.*\d)/,
      message: '영문과 숫자를 모두 포함해야 합니다',
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '비밀번호를 다시 입력하세요', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('비밀번호가 일치하지 않습니다'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const detailRules: FormRules = {
  name: [
    { required: true, message: '이름을 입력하세요', trigger: 'blur' },
    { min: 2, message: '이름은 2자 이상이어야 합니다', trigger: 'blur' },
    { max: 50, message: '이름은 50자를 초과할 수 없습니다', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '전화번호를 입력하세요', trigger: 'blur' },
    {
      pattern: /^[0-9-+().\s]{10,15}$/,
      message: '올바른 전화번호 형식을 입력하세요',
      trigger: 'blur'
    }
  ],
  dob: [
    { required: true, message: '생년월일을 선택하세요', trigger: 'change' }
  ]
}

// 비밀번호 강도 계산
const passwordStrength = computed(() => {
  const password = registerForm.password
  if (!password) return 0

  let strength = 0
  if (password.length >= 8) strength += 1
  if (/[a-zA-Z]/.test(password)) strength += 1
  if (/\d/.test(password)) strength += 1
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1
  if (password.length >= 12) strength += 1

  return strength
})

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'weak'
  if (strength <= 2) return 'fair'
  if (strength <= 3) return 'good'
  return 'strong'
})

const passwordStrengthWidth = computed(() => {
  return `${(passwordStrength.value / 4) * 100}%`
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return '약함'
  if (strength <= 2) return '보통'
  if (strength <= 3) return '강함'
  return '매우 강함'
})

// 회원가입 가능 여부
const canRegister = computed(() => {
  return termsAgreement.service &&
    termsAgreement.privacy &&
    termsAgreement.age
})

// 날짜 선택 제한 (13세 미만 방지)
const disabledDate = (time: Date) => {
  const now = new Date()
  const thirteenYearsAgo = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate())
  return time.getTime() > thirteenYearsAgo.getTime()
}

// 단계 이동
const nextStep = async () => {
  if (currentStep.value === 0) {
    if (!basicFormRef.value) return
    const valid = await basicFormRef.value.validate()
    if (valid) currentStep.value++
  } else if (currentStep.value === 1) {
    if (!detailFormRef.value) return
    const valid = await detailFormRef.value.validate()
    if (valid) currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 약관 동의 처리
const handleAllTermsChange = (value: boolean) => {
  termsAgreement.service = value
  termsAgreement.privacy = value
  termsAgreement.marketing = value
  termsAgreement.age = value
}

const checkAllTermsStatus = () => {
  termsAgreement.all = termsAgreement.service &&
    termsAgreement.privacy &&
    termsAgreement.marketing &&
    termsAgreement.age
}

// 약관 상세 보기
const showTermsDialog = (type: string) => {
  switch (type) {
    case 'service':
      currentTermsTitle.value = '서비스 이용약관'
      currentTermsContent.value = `
        <h4>제1조 (목적)</h4>
        <p>본 약관은 QR 안전교육 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 이용자의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.</p>

        <h4>제2조 (정의)</h4>
        <p>1. "서비스"란 회사가 제공하는 QR 코드 기반 안전교육 플랫폼을 의미합니다.</p>
        <p>2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</p>

        <h4>제3조 (서비스의 제공)</h4>
        <p>회사는 다음과 같은 서비스를 제공합니다:</p>
        <ul>
          <li>QR 코드 기반 안전교육 콘텐츠</li>
          <li>학습 진도 관리 및 수료증 발급</li>
          <li>교육 현황 분석 및 리포트</li>
        </ul>
      `
      break
    case 'privacy':
      currentTermsTitle.value = '개인정보 처리방침'
      currentTermsContent.value = `
        <h4>1. 개인정보의 처리목적</h4>
        <p>QR 안전교육은 다음의 목적을 위하여 개인정보를 처리합니다:</p>
        <ul>
          <li>서비스 제공 및 계약 이행</li>
          <li>회원 가입 의사 확인 및 본인 식별</li>
          <li>학습 진도 관리 및 수료증 발급</li>
          <li>서비스 개선 및 맞춤형 서비스 제공</li>
        </ul>

        <h4>2. 수집하는 개인정보 항목</h4>
        <p>필수항목: 이메일, 이름, 전화번호, 생년월일</p>
        <p>선택항목: 마케팅 수신 동의</p>

        <h4>3. 개인정보의 보유 및 이용기간</h4>
        <p>회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 파기합니다.</p>
        <p>단, 관련 법령에 따라 보존할 의무가 있는 경우 해당 기간 동안 보관합니다.</p>
      `
      break
    case 'marketing':
      currentTermsTitle.value = '마케팅 정보 수신 동의'
      currentTermsContent.value = `
        <h4>마케팅 정보 수신 동의 (선택)</h4>
        <p>QR 안전교육에서 제공하는 다양한 혜택 정보를 받아보실 수 있습니다:</p>

        <h4>수신 정보</h4>
        <ul>
          <li>새로운 교육 콘텐츠 안내</li>
          <li>서비스 업데이트 알림</li>
          <li>이벤트 및 프로모션 정보</li>
          <li>교육 관련 유용한 정보</li>
        </ul>

        <h4>수신 방법</h4>
        <p>이메일, 푸시 알림, SMS 등을 통해 발송됩니다.</p>

        <h4>동의 철회</h4>
        <p>언제든지 설정에서 수신 동의를 철회할 수 있습니다.</p>
      `
      break
  }
  showTermsDetailDialog.value = true
}

// 회원가입 처리
const handleRegister = async () => {
  try {
    if (!canRegister.value) {
      ElMessage.error('필수 약관에 동의해주세요.')
      return
    }

    if (!registerForm.dob) {
      ElMessage.error('생년월일을 선택해주세요.')
      return
    }

    const registerData: RegisterData = {
      email: registerForm.email.trim(),
      password: registerForm.password,
      name: registerForm.name.trim(),
      phone: registerForm.phone.trim(),
      dob: new Date(registerForm.dob)
    }

    if (isUpgradeMode.value) {
      // 게스트 계정 업그레이드
      await authStore.upgradeGuestToUser(registerData)
      ElMessage.success('계정이 성공적으로 업그레이드되었습니다!')
    } else {
      // 일반 회원가입
      await authStore.registerWithEmail(registerData)
      ElMessage.success('회원가입이 완료되었습니다!')
    }

    // 홈으로 이동
    await router.push('/')
  } catch (error) {
    console.error('회원가입 처리 중 오류:', error)
  }
}

// 마운트 시 초기화
onMounted(() => {
  // 이미 로그인된 일반 사용자는 홈으로 리디렉션
  if (authStore.isLoggedIn && !authStore.isAnonymous) {
    router.push('/')
  }
})
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  position: relative;
}

.register-header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
  margin-top: 20px;
  position: relative;
  width: 100%;
  max-width: 500px;
}

.back-button {
  position: absolute;
  left: 0;
  top: 0;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.app-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.app-subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 300;
}

.register-form-container {
  width: 100%;
  max-width: 500px;
}

.register-card {
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

.register-steps {
  margin: 30px 0;
}

.step-content {
  margin: 30px 0;
  min-height: 300px;
}

.password-strength {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background-color: #e4e7ed;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.strength-fill.weak {
  background-color: #f56c6c;
}

.strength-fill.fair {
  background-color: #e6a23c;
}

.strength-fill.good {
  background-color: #409eff;
}

.strength-fill.strong {
  background-color: #67c23a;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
  min-width: 60px;
}

.strength-text.weak {
  color: #f56c6c;
}

.strength-text.fair {
  color: #e6a23c;
}

.strength-text.good {
  color: #409eff;
}

.strength-text.strong {
  color: #67c23a;
}

.terms-section {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.terms-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px 0;
  font-size: 1.1rem;
  color: #303133;
}

.all-terms-checkbox {
  font-weight: 600;
  font-size: 16px;
}

.terms-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.terms-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.terms-item:hover {
  border-color: #409eff;
}

.required-mark {
  color: #f56c6c;
  font-weight: 600;
  font-size: 12px;
}

.optional-mark {
  color: #909399;
  font-weight: 600;
  font-size: 12px;
}

.button-section {
  display: flex;
  gap: 12px;
  margin-top: 30px;
}

.step-button {
  flex: 1;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

.register-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
}

.login-section {
  text-align: center;
  padding-top: 10px;
}

.login-text {
  color: #606266;
  font-size: 14px;
  margin: 8px 0 0 0;
}

.login-link {
  font-weight: 600;
  padding: 0;
  margin-left: 4px;
}

.terms-content {
  max-height: 400px;
  overflow-y: auto;
  padding: 20px;
  line-height: 1.6;
}

.terms-content h4 {
  color: #303133;
  margin: 20px 0 10px 0;
  font-weight: 600;
}

.terms-content p {
  color: #606266;
  margin: 8px 0;
}

.terms-content ul {
  color: #606266;
  padding-left: 20px;
}

.terms-content li {
  margin: 4px 0;
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .register-container {
    padding: 16px;
  }

  .app-title {
    font-size: 1.75rem;
  }

  .register-form-container {
    max-width: 100%;
  }

  .register-steps {
    margin: 20px 0;
  }

  .step-content {
    min-height: 250px;
  }

  .button-section {
    flex-direction: column;
  }

  .step-button {
    width: 100%;
  }
}

/* 다크 모드 대응 */
@media (prefers-color-scheme: dark) {
  .card-title {
    color: #e5eaf3;
  }

  .terms-title {
    color: #e5eaf3;
  }

  .login-text {
    color: #a3a6ad;
  }
}
</style>
