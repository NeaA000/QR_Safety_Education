// web/src/services/native-bridge.ts
// 기본 Native Bridge 서비스 - 보안 강화 TODO

interface NativeBridgeInterface {
  isNative: boolean
  platform: 'android' | 'ios' | 'web'
  
  // QR 스캐너
  scanQR(): Promise<string>
  
  // 파일 관리
  downloadFile(url: string, filename: string): Promise<string>
  saveFile(data: any, filename: string, mimeType: string): Promise<string>
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
  
  // TODO: 보안 기능들 (플레이스토어 정책 준수를 위해 추가해야 함)
  checkSecurity(): Promise<{ isSecure: boolean; reason?: string }>
  // TODO: SSL Pinning
  // TODO: 루팅/탈옥 탐지
  // TODO: 앱 무결성 검증
  // TODO: 스크린 녹화 감지
  // TODO: 메모리 덤프 방지
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
   * TODO: 보안 강화 - 스캔 데이터 암호화, 검증
   */
  async scanQR(): Promise<string> {
    try {
      if (this.platform === 'android' && window.Android) {
        return await window.Android.scanQR()
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.webkit.messageHandlers.scanQR.postMessage({})
          // iOS 응답 처리 로직 필요
        })
      } else {
        // 웹 환경에서는 WebRTC 카메라 사용 (추후 구현)
        throw new Error('웹 환경에서는 QR 스캔을 지원하지 않습니다.')
      }
    } catch (error) {
      console.error('[NativeBridge] QR 스캔 오류:', error)
      throw error
    }
  }

  /**
   * 파일 다운로드
   * TODO: 보안 강화 - URL 검증, 안전한 다운로드 경로
   */
  async downloadFile(url: string, filename: string): Promise<string> {
    try {
      if (this.platform === 'android' && window.Android) {
        return await window.Android.downloadFile(url, filename)
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.webkit.messageHandlers.downloadFile.postMessage({ url, filename })
        })
      } else {
        // 웹 환경에서는 브라우저 다운로드
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        return Promise.resolve(url)
      }
    } catch (error) {
      console.error('[NativeBridge] 파일 다운로드 오류:', error)
      throw error
    }
  }

  /**
   * 파일 저장
   * TODO: 보안 강화 - 저장 경로 검증, 파일 암호화
   */
  async saveFile(data: any, filename: string, mimeType: string): Promise<string> {
    try {
      if (this.platform === 'android' && window.Android) {
        return await window.Android.saveFile(JSON.stringify(data), filename, mimeType)
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.webkit.messageHandlers.saveFile.postMessage({ data, filename, mimeType })
        })
      } else {
        // 웹 환경에서는 Blob 다운로드
        const blob = new Blob([JSON.stringify(data)], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        URL.revokeObjectURL(url)
        return Promise.resolve(filename)
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
        return await window.Android.openFile(path)
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.webkit.messageHandlers.openFile.postMessage({ path })
        })
      } else {
        // 웹 환경에서는 새 탭에서 열기
        window.open(path, '_blank')
        return Promise.resolve(true)
      }
    } catch (error) {
      console.error('[NativeBridge] 파일 열기 오류:', error)
      return false
    }
  }

  /**
   * 디바이스 정보 가져오기
   * TODO: 보안 강화 - 민감한 정보 필터링
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
        const nativeInfo = JSON.parse(await window.Android.getDeviceInfo())
        return { ...baseInfo, ...nativeInfo }
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.webkit.messageHandlers.getDeviceInfo.postMessage({})
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
        const versionInfo = JSON.parse(await window.Android.getAppVersion())
        return versionInfo
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.webkit.messageHandlers.getAppVersion.postMessage({})
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
   * TODO: 보안 강화 - 권한 남용 방지
   */
  async requestPermission(permission: string): Promise<boolean> {
    try {
      if (this.platform === 'android' && window.Android) {
        return await window.Android.requestPermission(permission)
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.webkit.messageHandlers.requestPermission.postMessage({ permission })
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
        return await window.Android.checkPermission(permission)
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.webkit.messageHandlers.checkPermission.postMessage({ permission })
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
        window.Android.showToast(message)
      } else if (this.platform === 'ios' && window.webkit) {
        window.webkit.messageHandlers.showToast.postMessage({ message })
      } else {
        // 웹 환경에서는 브라우저 알림 (Element Plus 토스트로 대체 가능)
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
        return await window.Android.showAlert(title, message)
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.webkit.messageHandlers.showAlert.postMessage({ title, message })
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
        return JSON.parse(await window.Android.checkNetworkStatus())
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.webkit.messageHandlers.checkNetworkStatus.postMessage({})
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
   * TODO: 보안 강화 - 토큰 암호화 저장
   */
  async getFCMToken(): Promise<string> {
    try {
      if (this.platform === 'android' && window.Android) {
        return await window.Android.getFCMToken()
      } else if (this.platform === 'ios' && window.webkit) {
        return new Promise((resolve, reject) => {
          window.webkit.messageHandlers.getFCMToken.postMessage({})
        })
      } else {
        // 웹 환경에서는 Firebase Web Push 사용 (추후 구현)
        throw new Error('웹 환경에서는 FCM을 지원하지 않습니다.')
      }
    } catch (error) {
      console.error('[NativeBridge] FCM 토큰 가져오기 오류:', error)
      throw error
    }
  }

  /**
   * 보안 검사 (기본 구현)
   * TODO: 실제 보안 검사 로직 구현 필요!
   * 
   * 추가해야 할 보안 기능들:
   * 1. 루팅/탈옥 감지
   * 2. 디버깅 탐지
   * 3. 에뮬레이터 감지
   * 4. 앱 서명 검증
   * 5. 코드 무결성 검증
   * 6. 스크린 녹화 감지
   * 7. 키보드 감지 (키로거 방지)
   * 8. 메모리 덤프 방지
   */
  async checkSecurity(): Promise<{ isSecure: boolean; reason?: string }> {
    try {
      // TODO: 실제 보안 검사 로직 구현
      // 현재는 기본적으로 안전하다고 가정
      
      if (this.platform === 'android' && window.Android) {
        // TODO: Android 네이티브에서 보안 검사 수행
        return { isSecure: true }
      } else if (this.platform === 'ios' && window.webkit) {
        // TODO: iOS 네이티브에서 보안 검사 수행
        return { isSecure: true }
      } else {
        // 웹 환경에서는 기본적인 검사만
        // TODO: 웹 환경 보안 검사 추가
        return { isSecure: true }
      }
    } catch (error) {
      console.error('[NativeBridge] 보안 검사 오류:', error)
      return { 
        isSecure: false, 
        reason: '보안 검사 중 오류가 발생했습니다.' 
      }
    }
  }
}

// 전역 타입 선언
declare global {
  interface Window {
    Android?: {
      scanQR(): Promise<string>
      downloadFile(url: string, filename: string): Promise<string>
      saveFile(data: string, filename: string, mimeType: string): Promise<string>
      openFile(path: string): Promise<boolean>
      getDeviceInfo(): Promise<string>
      getAppVersion(): Promise<string>
      requestPermission(permission: string): Promise<boolean>
      checkPermission(permission: string): Promise<boolean>
      showToast(message: string): void
      showAlert(title: string, message: string): Promise<boolean>
      checkNetworkStatus(): Promise<string>
      getFCMToken(): Promise<string>
    }
    webkit?: {
      messageHandlers: {
        [key: string]: {
          postMessage(data: any): void
        }
      }
    }
    isNativeApp?: boolean
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const nativeBridge = new NativeBridge()
export default nativeBridge

// TODO 목록 - 구글 플레이스토어 정책 준수를 위해 반드시 구현해야 함:
/*
1. 보안 강화:
   - SSL Pinning 구현
   - 루팅/탈옥 감지
   - 앱 무결성 검증
   - 스크린 녹화 감지
   - 메모리 덤프 방지
   - 디버깅 탐지
   - 에뮬레이터 감지

2. 권한 관리:
   - 최소 권한 원칙 적용
   - 권한 요청 시 명확한 이유 제공
   - 불필요한 권한 제거

3. 데이터 보안:
   - 모든 통신 HTTPS 강제
   - 민감한 데이터 암호화
   - 로그에 민감 정보 포함 금지

4. 프라이버시:
   - 개인정보 처리방침 연결
   - 데이터 수집 최소화
   - 사용자 동의 관리

5. 성능 최적화:
   - 앱 시작 시간 최적화
   - 메모리 사용량 최적화
   - 배터리 효율성 개선
*/