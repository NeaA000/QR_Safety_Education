// 📱 web/src/services/native-bridge.ts
// 네이티브 앱과의 브리지 통신 서비스

import type { MainCategory, MiddleCategory, LeafCategory } from '@/types/category'

export interface NativeBridgeService {
  // 앱 환경 체크
  isNativeApp(): boolean
  
  // QR 스캐너
  scanQR(): Promise<string>
  
  // 파일 관리
  saveFile(data: string, filename: string): Promise<void>
  downloadFile(url: string, filename: string): Promise<string>
  openFile(path: string): Promise<boolean>
  
  // UI 헬퍼
  showToast(message: string): void
  showAlert(title: string, message: string): Promise<boolean>
  
  // 디바이스 정보
  getDeviceInfo(): Promise<any>
  getAppVersion(): Promise<string>
  
  // 권한 관리
  requestPermission(permission: string): Promise<boolean>
  checkPermission(permission: string): Promise<boolean>
  requestCameraPermission(): Promise<boolean>
  
  // 네트워크
  checkNetworkStatus(): Promise<any>
  
  // FCM
  getFCMToken(): Promise<string>
}

class NativeBridge implements NativeBridgeService {
  /**
   * 네이티브 앱 환경인지 체크
   */
  isNativeApp(): boolean {
    return !!(window.isNativeApp || window.Android || window.webkit)
  }

  /**
   * QR 코드 스캔
   */
  async scanQR(): Promise<string> {
    if (window.Android?.scanQR) {
      try {
        const result = window.Android.scanQR()
        // Promise일 수도, 직접 반환값일 수도 있음
        return typeof result === 'string' ? result : await result
      } catch (error) {
        console.error('Android QR 스캔 실패:', error)
        throw new Error('QR 스캔에 실패했습니다.')
      }
    }
    
    if (window.webkit?.messageHandlers?.scanQR) {
      return new Promise((resolve, reject) => {
        // iOS 메시지 핸들러 콜백 등록
        window.onQRScanned = (data: string) => {
          resolve(data)
        }
        
        // iOS로 스캔 요청
        window.webkit!.messageHandlers.scanQR.postMessage({})
        
        // 타임아웃 설정 (30초)
        setTimeout(() => {
          reject(new Error('QR 스캔 타임아웃'))
        }, 30000)
      })
    }

    throw new Error('QR 스캔 기능을 사용할 수 없습니다.')
  }

  /**
   * 파일 저장
   */
  async saveFile(data: string, filename: string): Promise<void> {
    if (window.Android?.saveFile) {
      window.Android.saveFile(data, filename)
      return
    }

    if (window.webkit?.messageHandlers?.saveFile) {
      window.webkit.messageHandlers.saveFile.postMessage({
        data,
        filename
      })
      return
    }

    // 웹 환경에서는 다운로드로 대체
    const blob = new Blob([data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * 파일 다운로드
   */
  async downloadFile(url: string, filename: string): Promise<string> {
    if (window.Android?.downloadFile) {
      const result = window.Android.downloadFile(url, filename)
      return typeof result === 'string' ? result : await result
    }

    if (window.webkit?.messageHandlers?.downloadFile) {
      return new Promise((resolve) => {
        window.onDownloadComplete = (path: string) => {
          resolve(path)
        }
        window.webkit!.messageHandlers.downloadFile.postMessage({
          url,
          filename
        })
      })
    }

    throw new Error('파일 다운로드 기능을 사용할 수 없습니다.')
  }

  /**
   * 파일 열기
   */
  async openFile(path: string): Promise<boolean> {
    if (window.Android?.openFile) {
      const result = window.Android.openFile(path)
      return typeof result === 'boolean' ? result : await result
    }

    if (window.webkit?.messageHandlers?.openFile) {
      return new Promise((resolve) => {
        window.webkit!.messageHandlers.openFile.postMessage({ path })
        // iOS는 결과를 받기 어려우므로 true로 가정
        resolve(true)
      })
    }

    return false
  }

  /**
   * 토스트 메시지 표시
   */
  showToast(message: string): void {
    if (window.Android?.showToast) {
      window.Android.showToast(message)
      return
    }

    if (window.webkit?.messageHandlers?.showToast) {
      window.webkit.messageHandlers.showToast.postMessage({ message })
      return
    }

    // 웹 환경에서는 콘솔로 대체
    console.log('Toast:', message)
  }

  /**
   * 알림 대화상자 표시
   */
  async showAlert(title: string, message: string): Promise<boolean> {
    if (window.Android?.showAlert) {
      const result = window.Android.showAlert(title, message)
      return typeof result === 'boolean' ? result : await result
    }

    if (window.webkit?.messageHandlers?.showAlert) {
      window.webkit.messageHandlers.showAlert.postMessage({
        title,
        message
      })
      return true
    }

    // 웹 환경에서는 기본 alert 사용
    alert(`${title}\n\n${message}`)
    return true
  }

  /**
   * 디바이스 정보 조회
   */
  async getDeviceInfo(): Promise<any> {
    if (window.Android?.getDeviceInfo) {
      const result = window.Android.getDeviceInfo()
      const info = typeof result === 'string' ? JSON.parse(result) : await result
      return typeof info === 'string' ? JSON.parse(info) : info
    }

    if (window.webkit?.messageHandlers?.getDeviceInfo) {
      return new Promise((resolve) => {
        window.webkit!.messageHandlers.getDeviceInfo.postMessage({})
        // iOS 응답 처리는 별도 구현 필요
        resolve({
          platform: 'ios',
          version: 'unknown',
          model: 'unknown'
        })
      })
    }

    return {
      platform: 'web',
      version: navigator.userAgent,
      model: 'browser'
    }
  }

  /**
   * 앱 버전 조회
   */
  async getAppVersion(): Promise<string> {
    if (window.Android?.getAppVersion) {
      const result = window.Android.getAppVersion()
      return typeof result === 'string' ? result : await result
    }

    return '1.0.0'
  }

  /**
   * 권한 요청
   */
  async requestPermission(permission: string): Promise<boolean> {
    if (window.Android?.requestPermission) {
      const result = window.Android.requestPermission(permission)
      return typeof result === 'boolean' ? result : await result
    }

    return true // 웹에서는 항상 허용으로 간주
  }

  /**
   * 권한 확인
   */
  async checkPermission(permission: string): Promise<boolean> {
    if (window.Android?.checkPermission) {
      const result = window.Android.checkPermission(permission)
      return typeof result === 'boolean' ? result : await result
    }

    return true
  }

  /**
   * 카메라 권한 요청
   */
  async requestCameraPermission(): Promise<boolean> {
    if (window.Android?.requestCameraPermission) {
      return window.Android.requestCameraPermission()
    }

    return this.requestPermission('CAMERA')
  }

  /**
   * 네트워크 상태 확인
   */
  async checkNetworkStatus(): Promise<any> {
    if (window.Android?.checkNetworkStatus) {
      const result = window.Android.checkNetworkStatus()
      const status = typeof result === 'string' ? JSON.parse(result) : await result
      return typeof status === 'string' ? JSON.parse(status) : status
    }

    return {
      isConnected: navigator.onLine,
      type: 'unknown'
    }
  }

  /**
   * FCM 토큰 조회
   */
  async getFCMToken(): Promise<string> {
    if (window.Android?.getFCMToken) {
      const result = window.Android.getFCMToken()
      return typeof result === 'string' ? result : await result
    }

    return 'web-token-' + Date.now()
  }
}

// 싱글톤 인스턴스 생성
const nativeBridge = new NativeBridge()

export default nativeBridge