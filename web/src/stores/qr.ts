// src/stores/qr.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import nativeBridge from '@/services/native-bridge'

export interface QRData {
  type: 'lecture' | 'course' | 'certificate' | 'attendance'
  id: string
  timestamp?: number
  metadata?: Record<string, any>
}

export interface QRScanHistory {
  id: string
  data: QRData
  scannedAt: Date
  location?: {
    latitude: number
    longitude: number
  }
}

export const useQRStore = defineStore('qr', () => {
  const router = useRouter()

  // 상태
  const isScanning = ref(false)
  const lastScannedData = ref<QRData | null>(null)
  const scanHistory = ref<QRScanHistory[]>([])
  const cameraPermission = ref<boolean | null>(null)

  // QR 코드 스캔
  const scanQR = async (): Promise<void> => {
    try {
      isScanning.value = true

      // 카메라 권한 확인
      if (nativeBridge.isNativeApp()) {
        const hasPermission = await nativeBridge.requestCameraPermission()
        cameraPermission.value = hasPermission

        if (!hasPermission) {
          ElMessage.warning('카메라 권한이 필요합니다.')
          return
        }
      }

      // QR 스캔 실행
      const result = await nativeBridge.scanQR()

      if (result) {
        try {
          const qrData: QRData = JSON.parse(result)

          // QR 데이터 검증
          if (!qrData.type || !qrData.id) {
            throw new Error('Invalid QR data format')
          }

          lastScannedData.value = qrData

          // 스캔 기록 저장
          const scanRecord: QRScanHistory = {
            id: Date.now().toString(),
            data: qrData,
            scannedAt: new Date()
          }

          // 위치 정보 추가 (가능한 경우)
          if (nativeBridge.isNativeApp() && window.Android?.getLocation) {
            try {
              const location = JSON.parse(window.Android.getLocation())
              scanRecord.location = location
            } catch (err) {
              console.error('위치 정보 가져오기 실패:', err)
            }
          }

          scanHistory.value.unshift(scanRecord)

          // 최대 50개 기록 유지
          if (scanHistory.value.length > 50) {
            scanHistory.value = scanHistory.value.slice(0, 50)
          }

          // 타입별 처리
          await handleQRData(qrData)

        } catch (parseError) {
          console.error('QR 데이터 파싱 오류:', parseError)
          ElMessage.error('QR 코드 형식이 올바르지 않습니다.')
        }
      }

    } catch (error) {
      console.error('QR 스캔 오류:', error)
      ElMessage.error('QR 스캔에 실패했습니다.')
    } finally {
      isScanning.value = false
    }
  }

  // QR 데이터 처리
  const handleQRData = async (qrData: QRData): Promise<void> => {
    switch (qrData.type) {
      case 'lecture':
        // 강의 페이지로 이동
        await router.push(`/lectures/${qrData.id}/watch`)
        ElMessage.success('강의를 시작합니다.')
        break

      case 'course':
        // 강의 상세 페이지로 이동
        await router.push(`/courses/${qrData.id}`)
        break

      case 'certificate':
        // 수료증 페이지로 이동
        await router.push(`/certificates/${qrData.id}`)
        break

      case 'attendance':
        // 출석 체크 처리
        await processAttendance(qrData)
        break

      default:
        ElMessage.error('알 수 없는 QR 코드 타입입니다.')
    }
  }

  // 출석 체크 처리
  const processAttendance = async (qrData: QRData): Promise<void> => {
    try {
      // TODO: Firebase Functions 호출하여 출석 처리
      ElMessage.success('출석 체크가 완료되었습니다.')
    } catch (error) {
      ElMessage.error('출석 체크에 실패했습니다.')
      throw error
    }
  }

  // QR 코드 생성 (강사/관리자용)
  const generateQRData = (type: QRData['type'], id: string, metadata?: Record<string, any>): string => {
    const qrData: QRData = {
      type,
      id,
      timestamp: Date.now(),
      metadata
    }

    return JSON.stringify(qrData)
  }

  // 스캔 기록 초기화
  const clearHistory = (): void => {
    scanHistory.value = []
    lastScannedData.value = null
  }

  // 카메라 권한 재요청
  const requestCameraPermission = async (): Promise<boolean> => {
    if (!nativeBridge.isNativeApp()) {
      return true
    }

    const hasPermission = await nativeBridge.requestCameraPermission()
    cameraPermission.value = hasPermission
    return hasPermission
  }

  return {
    // 상태
    isScanning,
    lastScannedData,
    scanHistory,
    cameraPermission,

    // 액션
    scanQR,
    generateQRData,
    clearHistory,
    requestCameraPermission
  }
})
