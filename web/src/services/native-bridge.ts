// src/services/native-bridge.ts
import { ElMessage } from 'element-plus'

/**
 * Native Bridge 서비스
 * 웹과 네이티브 앱 간의 통신을 담당
 */
class NativeBridge {
  /**
   * 네이티브 앱 여부 확인
   */
  isNativeApp(): boolean {
    return !!(window.Android || window.webkit?.messageHandlers)
  }

  /**
   * Android 여부 확인
   */
  isAndroid(): boolean {
    return !!window.Android
  }

  /**
   * iOS 여부 확인
   */
  isIOS(): boolean {
    return !!window.webkit?.messageHandlers
  }

  /**
   * QR 코드 스캔
   * @returns QR 스캔 결과 또는 null
   */
  async scanQR(): Promise<{ data: string } | null> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isNativeApp()) {
          reject(new Error('네이티브 앱이 아닙니다.'))
          return
        }

        // 콜백 함수 설정
        window.onQRScanned = (data: string) => {
          // 콜백 함수 정리
          delete window.onQRScanned
          
          if (data) {
            resolve({ data })
          } else {
            reject(new Error('QR 스캔이 취소되었습니다.'))
          }
        }

        // 네이티브 QR 스캐너 호출
        if (this.isAndroid()) {
          const result = window.Android!.scanQR()
          // 동기 방식인 경우 바로 처리
          if (result) {
            delete window.onQRScanned
            resolve({ data: result })
          }
        } else if (this.isIOS()) {
          window.webkit!.messageHandlers.scanQR.postMessage({})
        }

        // 타임아웃 설정 (30초)
        setTimeout(() => {
          delete window.onQRScanned
          reject(new Error('QR 스캔 시간이 초과되었습니다.'))
        }, 30000)

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 카메라 권한 요청
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      if (!this.isNativeApp()) {
        // 웹에서는 브라우저 권한 요청
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())
        return true
      }

      if (this.isAndroid()) {
        return window.Android!.requestCameraPermission()
      } else if (this.isIOS()) {
        return new Promise((resolve) => {
          window.onPermissionResult = (granted: boolean) => {
            delete window.onPermissionResult
            resolve(granted)
          }
          window.webkit!.messageHandlers.requestCameraPermission.postMessage({})
        })
      }

      return false
    } catch (error) {
      console.error('카메라 권한 요청 실패:', error)
      return false
    }
  }

  /**
   * 파일 저장
   */
  async saveFile(data: string, filename: string): Promise<void> {
    try {
      if (!this.isNativeApp()) {
        // 웹에서는 다운로드 링크 생성
        const blob = new Blob([data], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        return
      }

      if (this.isAndroid()) {
        window.Android!.saveFile(data, filename)
      } else if (this.isIOS()) {
        window.webkit!.messageHandlers.saveFile.postMessage({ data, filename })
      }
    } catch (error) {
      console.error('파일 저장 실패:', error)
      throw error
    }
  }

  /**
   * 토스트 메시지 표시
   */
  showToast(message: string): void {
    if (this.isAndroid()) {
      window.Android!.showToast(message)
    } else {
      // 웹이나 iOS에서는 Element Plus 메시지 사용
      ElMessage.info(message)
    }
  }

  /**
   * 디바이스 정보 가져오기
   */
  getDeviceInfo(): any {
    try {
      if (!this.isNativeApp()) {
        return {
          platform: 'web',
          userAgent: navigator.userAgent,
          language: navigator.language
        }
      }

      if (this.isAndroid()) {
        const info = window.Android!.getDeviceInfo()
        return typeof info === 'string' ? JSON.parse(info) : info
      }

      return null
    } catch (error) {
      console.error('디바이스 정보 조회 실패:', error)
      return null
    }
  }

  /**
   * 네트워크 상태 확인
   */
  checkNetworkStatus(): { isConnected: boolean; type: string } {
    try {
      if (!this.isNativeApp()) {
        return {
          isConnected: navigator.onLine,
          type: 'unknown'
        }
      }

      if (this.isAndroid()) {
        const status = window.Android!.checkNetworkStatus()
        return typeof status === 'string' ? JSON.parse(status) : status
      }

      return {
        isConnected: true,
        type: 'unknown'
      }
    } catch (error) {
      console.error('네트워크 상태 확인 실패:', error)
      return {
        isConnected: false,
        type: 'unknown'
      }
    }
  }

  /**
   * FCM 토큰 가져오기
   */
  async getFCMToken(): Promise<string | null> {
    try {
      if (!this.isNativeApp()) {
        return null
      }

      if (this.isAndroid()) {
        return window.Android!.getFCMToken()
      }

      return null
    } catch (error) {
      console.error('FCM 토큰 조회 실패:', error)
      return null
    }
  }
}

// 싱글톤 인스턴스 export
export default new NativeBridge()