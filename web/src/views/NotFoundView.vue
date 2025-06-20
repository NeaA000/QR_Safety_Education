<!-- web/src/views/NotFoundView.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center">
      <!-- 404 일러스트레이션 -->
      <div class="mb-8">
        <div class="relative">
          <!-- QR 코드 스타일 배경 -->
          <div class="w-48 h-48 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center relative overflow-hidden">
            <!-- QR 패턴 장식 -->
            <div class="absolute inset-4 opacity-10">
              <div class="grid grid-cols-8 gap-1 h-full">
                <div v-for="i in 64" :key="i"
                     :class="getQRPatternClass(i)"
                     class="aspect-square rounded-sm">
                </div>
              </div>
            </div>

            <!-- 404 텍스트 -->
            <div class="relative z-10">
              <h1 class="text-6xl font-bold text-gray-800 mb-2">404</h1>
              <div class="w-16 h-1 bg-blue-500 mx-auto rounded-full"></div>
            </div>
          </div>

          <!-- 떠다니는 요소들 -->
          <div class="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce delay-75"></div>
          <div class="absolute -bottom-2 -left-2 w-6 h-6 bg-red-400 rounded-full animate-bounce delay-150"></div>
          <div class="absolute top-1/2 -left-6 w-4 h-4 bg-green-400 rounded-full animate-bounce"></div>
        </div>
      </div>

      <!-- 메시지 -->
      <div class="space-y-4 mb-8">
        <h2 class="text-2xl font-bold text-gray-800">
          페이지를 찾을 수 없습니다
        </h2>
        <p class="text-gray-600 leading-relaxed">
          요청하신 페이지가 존재하지 않거나<br>
          이동되었을 수 있습니다.
        </p>
      </div>

      <!-- 액션 버튼들 -->
      <div class="space-y-3">
        <!-- 홈으로 돌아가기 -->
        <button
          @click="goHome"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <HomeIcon class="w-5 h-5" />
          <span>홈으로 돌아가기</span>
        </button>

        <!-- 이전 페이지로 -->
        <button
          @click="goBack"
          class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <ArrowLeftIcon class="w-5 h-5" />
          <span>이전 페이지로</span>
        </button>

        <!-- QR 스캔 -->
        <button
          @click="scanQR"
          class="w-full bg-green-100 hover:bg-green-200 text-green-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <QrCodeIcon class="w-5 h-5" />
          <span>QR 코드 스캔</span>
        </button>
      </div>

      <!-- 도움말 링크 -->
      <div class="mt-8 pt-6 border-t border-gray-200">
        <p class="text-sm text-gray-500 mb-3">문제가 지속될 경우</p>
        <div class="flex justify-center space-x-4 text-sm">
          <a href="mailto:support@example.com"
             class="text-blue-600 hover:text-blue-700 flex items-center space-x-1">
            <EnvelopeIcon class="w-4 h-4" />
            <span>문의하기</span>
          </a>
          <a href="tel:+82-2-1234-5678"
             class="text-blue-600 hover:text-blue-700 flex items-center space-x-1">
            <PhoneIcon class="w-4 h-4" />
            <span>전화상담</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  HomeIcon,
  ArrowLeftIcon,
  QrCodeIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()

// QR 패턴 생성 함수
const getQRPatternClass = (index: number): string => {
  // 의사 랜덤 패턴 생성 (실제 QR 코드처럼 보이게)
  const patterns = [
    'bg-gray-800', 'bg-transparent', 'bg-gray-800', 'bg-transparent',
    'bg-transparent', 'bg-gray-800', 'bg-transparent', 'bg-gray-800'
  ]

  const row = Math.floor((index - 1) / 8)
  const col = (index - 1) % 8

  // 코너 마커 패턴
  if ((row < 3 && col < 3) ||
    (row < 3 && col > 4) ||
    (row > 4 && col < 3)) {
    return row % 2 === col % 2 ? 'bg-gray-800' : 'bg-transparent'
  }

  // 랜덤 패턴
  return patterns[(row + col) % patterns.length]
}

// 네비게이션 함수들
const goHome = () => {
  router.push('/')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const scanQR = () => {
  // QR 스캔 페이지로 이동 또는 네이티브 QR 스캐너 호출
  if (window.Android && window.Android.startQRScan) {
    // 네이티브 QR 스캐너 호출
    window.Android.startQRScan()
  } else {
    // 웹 QR 스캔 페이지로 이동
    router.push('/qr-scan')
  }
}

// 페이지 메타 설정
if (typeof document !== 'undefined') {
  document.title = '페이지를 찾을 수 없음 - QR 안전교육'
}
</script>

<style scoped>
/* 커스텀 애니메이션 */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* 호버 효과 개선 */
button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

button:active {
  transform: translateY(0);
}

/* QR 패턴 애니메이션 */
.grid > div {
  transition: all 0.3s ease;
}

.grid:hover > div {
  animation: pulse 2s infinite;
  animation-delay: calc(var(--i) * 0.1s);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
