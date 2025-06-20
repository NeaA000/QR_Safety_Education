<template>
  <div class="course-enroll-container">
    <!-- 헤더 -->
    <div class="header">
      <div class="header-content">
        <el-button
          @click="goBack"
          :icon="ArrowLeft"
          circle
        />
        <h1 class="page-title">강의 신청</h1>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="currentCourse" class="main-content">
      <!-- 진행 단계 표시 -->
      <div class="progress-steps">
        <el-steps :active="currentStep" align-center>
          <el-step title="강의 확인" />
          <el-step title="결제 정보" />
          <el-step title="신청 완료" />
        </el-steps>
      </div>

      <!-- 단계별 콘텐츠 -->
      <div class="step-content">
        <!-- 1단계: 강의 확인 -->
        <div v-if="currentStep === 0" class="step-section">
          <el-card class="course-summary">
            <template #header>
              <span>신청하실 강의</span>
            </template>

            <div class="course-info">
              <div class="course-thumbnail">
                <img
                  :src="currentCourse.thumbnail || '/default-course.jpg'"
                  :alt="currentCourse.title"
                />
              </div>
              <div class="course-details">
                <h3>{{ currentCourse.title }}</h3>
                <p>{{ currentCourse.description }}</p>
                <div class="course-meta">
                  <div class="meta-item">
                    <el-icon><User /></el-icon>
                    <span>{{ currentCourse.instructor }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><Clock /></el-icon>
                    <span>{{ formatDuration(currentCourse.duration) }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><VideoPlay /></el-icon>
                    <span>{{ currentCourse.lectureCount }}강</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="price-section">
              <div class="price-info">
                <div v-if="currentCourse.originalPrice && currentCourse.originalPrice > currentCourse.price" class="original-price">
                  {{ formatPrice(currentCourse.originalPrice) }}
                </div>
                <div class="current-price" :class="{ free: currentCourse.price === 0 }">
                  {{ currentCourse.price === 0 ? '무료' : formatPrice(currentCourse.price) }}
                </div>
                <div v-if="currentCourse.discountRate" class="discount-info">
                  <el-tag type="warning">{{ currentCourse.discountRate }}% 할인</el-tag>
                </div>
              </div>
            </div>
          </el-card>

          <div class="step-actions">
            <el-button size="large" @click="goBack">취소</el-button>
            <el-button
              type="primary"
              size="large"
              @click="nextStep"
            >
              {{ currentCourse.price === 0 ? '무료 신청하기' : '결제하기' }}
            </el-button>
          </div>
        </div>

        <!-- 2단계: 결제 정보 (유료 강의인 경우) -->
        <div v-if="currentStep === 1" class="step-section">
          <el-card class="payment-section">
            <template #header>
              <span>결제 정보</span>
            </template>

            <div class="payment-summary">
              <div class="summary-item">
                <span>강의명</span>
                <span>{{ currentCourse.title }}</span>
              </div>
              <div class="summary-item">
                <span>강의 금액</span>
                <span>{{ formatPrice(currentCourse.originalPrice || currentCourse.price) }}</span>
              </div>
              <div v-if="currentCourse.discountRate" class="summary-item discount">
                <span>할인 금액</span>
                <span>-{{ formatPrice((currentCourse.originalPrice || 0) - currentCourse.price) }}</span>
              </div>
              <div class="summary-item total">
                <span>최종 결제 금액</span>
                <span>{{ formatPrice(currentCourse.price) }}</span>
              </div>
            </div>

            <el-divider />

            <div class="payment-methods">
              <h4>결제 방법</h4>
              <el-radio-group v-model="selectedPaymentMethod">
                <el-radio label="card" size="large">
                  <div class="payment-option">
                    <el-icon><CreditCard /></el-icon>
                    <span>신용카드</span>
                  </div>
                </el-radio>
                <el-radio label="bank" size="large">
                  <div class="payment-option">
                    <el-icon><Wallet /></el-icon>
                    <span>계좌이체</span>
                  </div>
                </el-radio>
                <el-radio label="mobile" size="large">
                  <div class="payment-option">
                    <el-icon><Iphone /></el-icon>
                    <span>휴대폰 결제</span>
                  </div>
                </el-radio>
              </el-radio-group>
            </div>

            <div class="agreement-section">
              <el-checkbox v-model="agreements.terms">
                <span>이용약관에 동의합니다</span>
                <el-link type="primary" @click="showTerms">보기</el-link>
              </el-checkbox>
              <el-checkbox v-model="agreements.privacy">
                <span>개인정보 처리방침에 동의합니다</span>
                <el-link type="primary" @click="showPrivacy">보기</el-link>
              </el-checkbox>
              <el-checkbox v-model="agreements.refund">
                <span>환불 정책에 동의합니다</span>
                <el-link type="primary" @click="showRefundPolicy">보기</el-link>
              </el-checkbox>
            </div>
          </el-card>

          <div class="step-actions">
            <el-button size="large" @click="prevStep">이전</el-button>
            <el-button
              type="primary"
              size="large"
              @click="processPayment"
              :loading="isProcessing"
              :disabled="!canProceedPayment"
            >
              {{ formatPrice(currentCourse.price) }} 결제하기
            </el-button>
          </div>
        </div>

        <!-- 3단계: 신청 완료 -->
        <div v-if="currentStep === 2" class="step-section">
          <el-result
            icon="success"
            title="강의 신청이 완료되었습니다!"
            :sub-title="enrollmentResult?.message || '강의를 시작해보세요.'"
          >
            <template #extra>
              <div class="completion-actions">
                <el-button size="large" @click="goToMyCourses">
                  내 강의 보기
                </el-button>
                <el-button
                  type="primary"
                  size="large"
                  @click="startLearning"
                >
                  학습 시작하기
                </el-button>
              </div>
            </template>
          </el-result>

          <el-card class="enrollment-details">
            <template #header>
              <span>신청 내역</span>
            </template>

            <div class="details-content">
              <div class="detail-item">
                <span>신청 일시</span>
                <span>{{ formatDateTime(enrollmentResult?.enrolledAt) }}</span>
              </div>
              <div class="detail-item">
                <span>강의명</span>
                <span>{{ currentCourse.title }}</span>
              </div>
              <div class="detail-item">
                <span>강사</span>
                <span>{{ currentCourse.instructor }}</span>
              </div>
              <div class="detail-item">
                <span>결제 금액</span>
                <span>{{ currentCourse.price === 0 ? '무료' : formatPrice(currentCourse.price) }}</span>
              </div>
              <div v-if="enrollmentResult?.paymentId" class="detail-item">
                <span>결제 번호</span>
                <span>{{ enrollmentResult.paymentId }}</span>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-container">
      <el-result
        icon="error"
        title="강의 정보를 불러올 수 없습니다"
        :sub-title="error"
      >
        <template #extra>
          <el-button type="primary" @click="retryLoad">다시 시도</el-button>
        </template>
      </el-result>
    </div>

    <!-- 약관 다이얼로그 -->
    <el-dialog
      v-model="dialogVisible.terms"
      title="이용약관"
      width="80%"
      max-width="600px"
    >
      <div class="terms-content">
        <p>강의 서비스 이용약관 내용이 여기에 표시됩니다...</p>
      </div>
    </el-dialog>

    <el-dialog
      v-model="dialogVisible.privacy"
      title="개인정보 처리방침"
      width="80%"
      max-width="600px"
    >
      <div class="privacy-content">
        <p>개인정보 처리방침 내용이 여기에 표시됩니다...</p>
      </div>
    </el-dialog>

    <el-dialog
      v-model="dialogVisible.refund"
      title="환불 정책"
      width="80%"
      max-width="600px"
    >
      <div class="refund-content">
        <p>환불 정책 내용이 여기에 표시됩니다...</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  User,
  Clock,
  VideoPlay,
  CreditCard,
  Wallet,
  Iphone
} from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores/courses.ts'

// 라우터
const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()

// 상태
const currentStep = ref(0)
const isProcessing = ref(false)
const selectedPaymentMethod = ref('card')
const agreements = ref({
  terms: false,
  privacy: false,
  refund: false
})
const dialogVisible = ref({
  terms: false,
  privacy: false,
  refund: false
})
const enrollmentResult = ref(null)

// 계산된 속성
const courseId = computed(() => route.params.id as string)
const isLoading = computed(() => courseStore.isLoading)
const error = computed(() => courseStore.error)
const currentCourse = computed(() => courseStore.currentCourse)

const canProceedPayment = computed(() => {
  return agreements.value.terms &&
    agreements.value.privacy &&
    agreements.value.refund &&
    selectedPaymentMethod.value
})

/**
 * 이벤트 핸들러
 */
const goBack = () => {
  router.go(-1)
}

const goToMyCourses = () => {
  router.push('/my-courses')
}

const startLearning = () => {
  router.push(`/lectures/${courseId.value}`)
}

const nextStep = () => {
  if (currentCourse.value?.price === 0) {
    // 무료 강의인 경우 바로 신청 처리
    processEnrollment()
  } else {
    // 유료 강의인 경우 결제 단계로
    currentStep.value = 1
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const processPayment = async () => {
  try {
    isProcessing.value = true

    // 결제 처리 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000))

    // TODO: 실제 결제 API 연동
    const paymentData = {
      courseId: courseId.value,
      amount: currentCourse.value?.price,
      method: selectedPaymentMethod.value,
      // 기타 결제 정보
    }

    // 결제 성공 후 강의 등록
    await processEnrollment(paymentData)

  } catch (error) {
    ElMessage.error('결제 처리 중 오류가 발생했습니다.')
    console.error('Payment error:', error)
  } finally {
    isProcessing.value = false
  }
}

const processEnrollment = async (paymentData = null) => {
  try {
    isProcessing.value = true

    // 강의 등록 처리
    const enrollmentId = await courseStore.enrollInCourse(courseId.value)

    enrollmentResult.value = {
      enrollmentId,
      enrolledAt: new Date(),
      paymentId: paymentData?.transactionId,
      message: currentCourse.value?.price === 0
        ? '무료 강의 신청이 완료되었습니다.'
        : '결제가 완료되고 강의 신청이 완료되었습니다.'
    }

    currentStep.value = 2
    ElMessage.success('강의 신청이 완료되었습니다!')

  } catch (error) {
    ElMessage.error(error.message || '강의 신청에 실패했습니다.')
    console.error('Enrollment error:', error)
  } finally {
    isProcessing.value = false
  }
}

const retryLoad = async () => {
  try {
    await courseStore.loadCourseDetail(courseId.value)
  } catch (error) {
    ElMessage.error('강의 정보를 불러오는데 실패했습니다.')
  }
}

const showTerms = () => {
  dialogVisible.value.terms = true
}

const showPrivacy = () => {
  dialogVisible.value.privacy = true
}

const showRefundPolicy = () => {
  dialogVisible.value.refund = true
}

/**
 * 유틸리티 함수
 */
const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}분`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(price)
}

const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * 초기화
 */
onMounted(async () => {
  try {
    await courseStore.loadCourseDetail(courseId.value)

    // 이미 등록된 강의인지 확인
    if (courseStore.isEnrolled(courseId.value)) {
      ElMessage.warning('이미 등록된 강의입니다.')
      router.replace(`/courses/${courseId.value}`)
    }
  } catch (error) {
    console.error('강의 정보 로드 실패:', error)
  }
})
</script>

<style scoped>
.course-enroll-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  padding: 16px 20px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;
}

.loading-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.error-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 60px 20px;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.progress-steps {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
}

.step-content {
  margin-bottom: 20px;
}

.step-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.course-summary {
  margin-bottom: 20px;
}

.course-info {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.course-thumbnail {
  width: 120px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.course-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-details {
  flex: 1;
}

.course-details h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
}

.course-details p {
  font-size: 14px;
  color: #606266;
  margin: 0 0 12px;
  line-height: 1.4;
}

.course-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.price-section {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.original-price {
  font-size: 16px;
  color: #909399;
  text-decoration: line-through;
}

.current-price {
  font-size: 24px;
  font-weight: 700;
  color: #F56C6C;
}

.current-price.free {
  color: #67C23A;
}

.discount-info {
  margin-left: auto;
}

.payment-section {
  margin-bottom: 20px;
}

.payment-summary {
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f7fa;
}

.summary-item.discount {
  color: #E6A23C;
}

.summary-item.total {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
  border-bottom: none;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.payment-methods h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
}

.payment-methods :deep(.el-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agreement-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.agreement-section :deep(.el-checkbox) {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  width: 100%;
}

.agreement-section :deep(.el-checkbox__label) {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
}

.completion-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.enrollment-details {
  margin-top: 20px;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f7fa;
}

.detail-item:last-child {
  border-bottom: none;
}

.terms-content,
.privacy-content,
.refund-content {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  line-height: 1.6;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }

  .progress-steps {
    padding: 20px 16px;
  }

  .course-info {
    flex-direction: column;
    gap: 12px;
  }

  .course-thumbnail {
    width: 100%;
    height: 160px;
  }

  .course-meta {
    gap: 12px;
  }

  .price-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .payment-methods :deep(.el-radio-group) {
    gap: 8px;
  }

  .step-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .completion-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
