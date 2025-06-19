// src/services/native-bridge.ts
// 기본 Native Bridge 서비스 - 타입 오류 수정 버전

interface NativeBridgeInterface {
  isNative: boolean
  platform: 'android' | 'ios' | 'web'
  
  // QR 스캐너
  scanQR(): Promise<string>
  
  // 파일 관리
  downloadFile(url: string, filename: string): Promise<string>
  saveFile(data: any, filename: string, mimeType?: string): Promise<string>
  openFile(path: string): Promise<boolean>
  
  // 디바이스 정보
  getDeviceInfo(): Promise<any>
  getAppVersion(): Promise<{ version: string; buildNumber: string }>
  
  // 권한 관리
  requestPermission(permission: string): Promise<boolean>
  checkPermission(permission: string): Promise<boolean>
  
  // 알림
  showToast(message: string): void
  showAlert(title: string, message: string): Promise<boolean>
  
  // 네트워크
  checkNetworkStatus(): Promise<{ isConnected: boolean; type: string }>
  
  // FCM
  getFCMToken(): Promise<string>
}

class NativeBridge implements NativeBridgeInterface {
  public readonly isNative: boolean
  public readonly platform: 'android' | 'ios' | 'web'

  constructor() {
    // 네이티브 환경 감지
    this.isNative = !!(window.Android || window.webkit?.messageHandlers)
    
    if (window.Android) {
      this.platform = 'android'
    } else if (window.webkit?.messageHandlers) {
      this.platform = 'ios'
    } else {
      this.platform = 'web'
    }

    console.log(`[NativeBridge] 초기화 완료 - Platform: ${this.platform}, Native: ${this.isNative}`)
  }

  /**
   * QR 코드 스캔
   */
  async scanQR(): Promise<string> {
    try {
      if (this.platform === 'android' && window.Android) {
        // scanQR 메서드가 존재하는지 확인
        if (typeof window.Android.scanQR === 'function') {
          const result = await window.Android.scanQR()
          return result || ''
        } else {
          throw new Error('Android scanQR 메서드가 구현되지 않았습니다.')
        }
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('QR 스캔 타임아웃'))
          }, 30000)
          
          // iOS 응답을 위한 글로벌 콜백 설정
          window.onQRScanResult = (result: string) => {
            clearTimeout(timeout)
            resolve(result)
          }
          
          window.webkit!.messageHandlers.scanQR.postMessage({})
        })
      } else {
        // 웹 환경에서는 테스트용 더미 데이터
        console.warn('웹 환경에서는 QR 스캔을 지원하지 않습니다.')
        return '{"type":"test","lectureId":"1","timestamp":"' + Date.now() + '"}'
      }
    } catch (error) {
      console.error('[NativeBridge] QR 스캔 오류:', error)
      throw error
    }
  }

  /**
   * 파일 다운로드
   */
  async downloadFile(url: string, filename: string): Promise<string> {
    try {
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.downloadFile === 'function') {
          return await window.Android.downloadFile(url, filename)
        } else {
          // saveFile을 대신 사용
          const response = await fetch(url)
          const blob = await response.blob()
          const text = await blob.text()
          return await this.saveFile(text, filename, blob.type)
        }
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.onDownloadResult = (path: string) => resolve(path)
          window.webkit!.messageHandlers.downloadFile.postMessage({ url, filename })
        })
      } else {
        // 웹 환경에서는 브라우저 다운로드
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return filename
      }
    } catch (error) {
      console.error('[NativeBridge] 파일 다운로드 오류:', error)
      throw error
    }
  }

  /**
   * 파일 저장
   */
  async saveFile(data: any, filename: string, mimeType: string = 'text/plain'): Promise<string> {
    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data)
      
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.saveFile === 'function') {
          // 2개 파라미터만 전달 (Android 인터페이스에 맞춤)
          return await window.Android.saveFile(dataString, filename)
        } else {
          throw new Error('Android saveFile 메서드가 구현되지 않았습니다.')
        }
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.onSaveFileResult = (path: string) => resolve(path)
          window.webkit!.messageHandlers.saveFile.postMessage({ 
            data: dataString, 
            filename, 
            mimeType 
          })
        })
      } else {
        // 웹 환경에서는 브라우저 다운로드로 처리
        const blob = new Blob([dataString], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        return filename
      }
    } catch (error) {
      console.error('[NativeBridge] 파일 저장 오류:', error)
      throw error
    }
  }

  /**
   * 파일 열기
   */
  async openFile(path: string): Promise<boolean> {
    try {
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.openFile === 'function') {
          return await window.Android.openFile(path)
        } else {
          // showToast로 대체
          window.Android.showToast(`파일이 저장되었습니다: ${path}`)
          return true
        }
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.onOpenFileResult = (success: boolean) => resolve(success)
          window.webkit!.messageHandlers.openFile.postMessage({ path })
        })
      } else {
        // 웹 환경에서는 새 탭에서 열기
        window.open(path, '_blank')
        return true
      }
    } catch (error) {
      console.error('[NativeBridge] 파일 열기 오류:', error)
      return false
    }
  }

  /**
   * 디바이스 정보 가져오기
   */
  async getDeviceInfo(): Promise<any> {
    try {
      const baseInfo = {
        platform: this.platform,
        isNative: this.isNative,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timestamp: new Date().toISOString()
      }

      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.getDeviceInfo === 'function') {
          const nativeInfoStr = await window.Android.getDeviceInfo()
          const nativeInfo = JSON.parse(nativeInfoStr)
          return { ...baseInfo, ...nativeInfo }
        } else {
          return baseInfo
        }
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.onDeviceInfoResult = (info: any) => resolve({ ...baseInfo, ...info })
          window.webkit!.messageHandlers.getDeviceInfo.postMessage({})
        })
      } else {
        return baseInfo
      }
    } catch (error) {
      console.error('[NativeBridge] 디바이스 정보 가져오기 오류:', error)
      throw error
    }
  }

  /**
   * 앱 버전 정보
   */
  async getAppVersion(): Promise<{ version: string; buildNumber: string }> {
    try {
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.getAppVersion === 'function') {
          const versionInfoStr = await window.Android.getAppVersion()
          return JSON.parse(versionInfoStr)
        } else {
          return { version: '1.0.0', buildNumber: '1' }
        }
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.onAppVersionResult = (info: any) => resolve(info)
          window.webkit!.messageHandlers.getAppVersion.postMessage({})
        })
      } else {
        // 웹 환경에서는 환경변수에서 가져오기
        return {
          version: import.meta.env.VITE_APP_VERSION || '1.0.0',
          buildNumber: import.meta.env.VITE_BUILD_NUMBER || '1'
        }
      }
    } catch (error) {
      console.error('[NativeBridge] 앱 버전 가져오기 오류:', error)
      return { version: '1.0.0', buildNumber: '1' }
    }
  }

  /**
   * 권한 요청
   */
  async requestPermission(permission: string): Promise<boolean> {
    try {
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.requestPermission === 'function') {
          return await window.Android.requestPermission(permission)
        } else {
          console.warn('권한 요청 기능이 구현되지 않았습니다.')
          return true // 기본적으로 허용
        }
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.onPermissionResult = (granted: boolean) => resolve(granted)
          window.webkit!.messageHandlers.requestPermission.postMessage({ permission })
        })
      } else {
        // 웹 환경에서는 브라우저 권한 API 사용
        if (permission === 'CAMERA' && navigator.mediaDevices) {
          try {
            await navigator.mediaDevices.getUserMedia({ video: true })
            return true
          } catch {
            return false
          }
        }
        return false
      }
    } catch (error) {
      console.error('[NativeBridge] 권한 요청 오류:', error)
      return false
    }
  }

  /**
   * 권한 확인
   */
  async checkPermission(permission: string): Promise<boolean> {
    try {
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.checkPermission === 'function') {
          return await window.Android.checkPermission(permission)
        } else {
          return true // 기본적으로 허용된 것으로 가정
        }
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.onCheckPermissionResult = (granted: boolean) => resolve(granted)
          window.webkit!.messageHandlers.checkPermission.postMessage({ permission })
        })
      } else {
        // 웹 환경에서는 기본적으로 false 반환
        return false
      }
    } catch (error) {
      console.error('[NativeBridge] 권한 확인 오류:', error)
      return false
    }
  }

  /**
   * 토스트 메시지 표시
   */
  showToast(message: string): void {
    try {
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.showToast === 'function') {
          window.Android.showToast(message)
        } else {
          console.log('[Toast]', message)
        }
      } else if (this.platform === 'ios' && window.webkit) {
        window.webkit.messageHandlers.showToast.postMessage({ message })
      } else {
        // 웹 환경에서는 콘솔에 출력
        console.log('[Toast]', message)
      }
    } catch (error) {
      console.error('[NativeBridge] 토스트 표시 오류:', error)
    }
  }

  /**
   * 알림 대화상자 표시
   */
  async showAlert(title: string, message: string): Promise<boolean> {
    try {
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.showAlert === 'function') {
          return await window.Android.showAlert(title, message)
        } else {
          // showToast로 대체
          window.Android.showToast(`${title}: ${message}`)
          return true
        }
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.onAlertResult = (result: boolean) => resolve(result)
          window.webkit!.messageHandlers.showAlert.postMessage({ title, message })
        })
      } else {
        // 웹 환경에서는 브라우저 alert
        alert(`${title}\n\n${message}`)
        return true
      }
    } catch (error) {
      console.error('[NativeBridge] 알림 표시 오류:', error)
      return false
    }
  }

  /**
   * 네트워크 상태 확인
   */
  async checkNetworkStatus(): Promise<{ isConnected: boolean; type: string }> {
    try {
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.checkNetworkStatus === 'function') {
          const statusStr = await window.Android.checkNetworkStatus()
          return JSON.parse(statusStr)
        } else {
          return { isConnected: navigator.onLine, type: 'unknown' }
        }
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.onNetworkStatusResult = (status: any) => resolve(status)
          window.webkit!.messageHandlers.checkNetworkStatus.postMessage({})
        })
      } else {
        // 웹 환경에서는 navigator.onLine 사용
        return {
          isConnected: navigator.onLine,
          type: 'unknown'
        }
      }
    } catch (error) {
      console.error('[NativeBridge] 네트워크 상태 확인 오류:', error)
      return { isConnected: false, type: 'unknown' }
    }
  }

  /**
   * FCM 토큰 가져오기
   */
  async getFCMToken(): Promise<string> {
    try {
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.getFCMToken === 'function') {
          return await window.Android.getFCMToken()
        } else {
          throw new Error('FCM 토큰 기능이 구현되지 않았습니다.')
        }
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.onFCMTokenResult = (token: string) => resolve(token)
          window.webkit!.messageHandlers.getFCMToken.postMessage({})
        })
      } else {
        // 웹 환경에서는 에러 발생
        throw new Error('웹 환경에서는 FCM을 지원하지 않습니다.')
      }
    } catch (error) {
      console.error('[NativeBridge] FCM 토큰 가져오기 오류:', error)
      throw error
    }
  }
}

// Window 객체 타입 확장 - 중복 선언 해결
declare global {
  interface Window {
    // Android WebView Interface (기본 구현만)
    Android?: {
      scanQR(): Promise<string>
      saveFile(data: string, filename: string): Promise<string>
      showToast(message: string): void
      getDeviceInfo(): Promise<string>
      requestPermission(permission: string): Promise<boolean>
    }
    
    // iOS WebKit Interface
    webkit?: {
      messageHandlers: {
        [key: string]: {
          postMessage(data: any): void
        }
      }
    }
    
    // 네이티브 앱 여부
    isNativeApp?: boolean
    
    // 콜백 함수들
    onQRScanResult?: (result: string) => void
    onDownloadResult?: (path: string) => void
    onSaveFileResult?: (path: string) => void
    onOpenFileResult?: (success: boolean) => void
    onDeviceInfoResult?: (info: any) => void
    onAppVersionResult?: (info: any) => void
    onPermissionResult?: (granted: boolean) => void
    onCheckPermissionResult?: (granted: boolean) => void
    onAlertResult?: (result: boolean) => void
    onNetworkStatusResult?: (status: any) => void
    onFCMTokenResult?: (token: string) => void
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const nativeBridge = new NativeBridge()
export default nativeBridge