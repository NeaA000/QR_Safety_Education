// src/services/native-bridge.ts
// 네이티브 브릿지 서비스 (기본 기능 버전)

import type { 
  DeviceInfo, 
  AppVersionInfo, 
  NetworkStatus, 
  AppError,
  Permission 
} from '@/types/global'

// 네이티브 브릿지 인터페이스
interface NativeBridgeInterface {
  readonly isNative: boolean
  readonly platform: 'android' | 'ios' | 'web'
  
  // QR 스캐너
  scanQR(): Promise<string>
  
  // 파일 관리
  downloadFile(url: string, filename: string): Promise<string>
  saveFile(data: string, filename: string, mimeType?: string): Promise<string>
  openFile(path: string): Promise<boolean>
  
  // 디바이스 정보
  getDeviceInfo(): Promise<DeviceInfo>
  getAppVersion(): Promise<AppVersionInfo>
  
  // 권한 관리
  requestPermission(permission: Permission): Promise<boolean>
  checkPermission(permission: Permission): Promise<boolean>
  
  // 알림
  showToast(message: string): void
  showAlert(title: string, message: string): Promise<boolean>
  
  // 네트워크
  checkNetworkStatus(): Promise<NetworkStatus>
  
  // FCM
  getFCMToken(): Promise<string>
}

// 네이티브 브릿지 구현 클래스
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

    console.log(`🔗 [NativeBridge] 초기화 완료 - Platform: ${this.platform}, Native: ${this.isNative}`)
  }

  /**
   * 네이티브 메서드 호출 헬퍼
   */
  private async callNativeMethod<T>(
    methodName: string, 
    args: any[] = [],
    defaultValue?: T
  ): Promise<T> {
    try {
      if (this.platform === 'android' && window.Android) {
        const method = (window.Android as any)[methodName]
        if (typeof method === 'function') {
          const result = await method.apply(window.Android, args)
          return result as T
        }
      } else if (this.platform === 'ios' && window.webkit?.messageHandlers) {
        // iOS 구현
        return new Promise((resolve) => {
          // TODO: iOS 메시지 핸들러 구현
          resolve(defaultValue as T)
        })
      }
      
      // 웹 환경 또는 메서드 없음
      if (defaultValue !== undefined) {
        return defaultValue
      }
      
      throw new Error(`네이티브 메서드 ${methodName}을 찾을 수 없습니다.`)
    } catch (error) {
      console.error(`❌ [NativeBridge] ${methodName} 호출 실패:`, error)
      throw error
    }
  }

  /**
   * QR 코드 스캔
   */
  async scanQR(): Promise<string> {
    console.log('📱 QR 스캔 시작...')
    
    if (!this.isNative) {
      // TODO: 보안 - 웹 환경에서 QR 스캔 구현
      throw new Error('웹 환경에서는 QR 스캔을 사용할 수 없습니다.')
    }

    const result = await this.callNativeMethod<string>('scanQR')
    
    // 결과 검증
    if (typeof result !== 'string' || result.trim() === '') {
      throw new Error('QR 스캔 결과가 유효하지 않습니다.')
    }
    
    console.log('✅ QR 스캔 완료')
    return result.trim()
  }

  /**
   * 파일 다운로드
   */
  async downloadFile(url: string, filename: string): Promise<string> {
    console.log(`📥 파일 다운로드: ${filename}`)
    
    // TODO: 보안 - URL 검증
    // TODO: 보안 - 파일명 검증
    
    if (!this.isNative) {
      // 웹 환경에서 다운로드
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      return url
    }

    const result = await this.callNativeMethod<string>('downloadFile', [url, filename])
    console.log('✅ 파일 다운로드 완료')
    return result
  }

  /**
   * 파일 저장
   */
  async saveFile(data: string, filename: string, mimeType?: string): Promise<string> {
    console.log(`💾 파일 저장: ${filename}`)
    
    // TODO: 보안 - 데이터 크기 제한
    // TODO: 보안 - MIME 타입 검증
    
    if (!this.isNative) {
      // 웹 환경에서 저장
      const blob = new Blob([data], { type: mimeType || 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      return filename
    }

    await this.callNativeMethod('saveFile', [data, filename])
    console.log('✅ 파일 저장 완료')
    return filename
  }

  /**
   * 파일 열기
   */
  async openFile(path: string): Promise<boolean> {
    console.log(`📂 파일 열기: ${path}`)
    
    if (!this.isNative) {
      window.open(path, '_blank')
      return true
    }

    const result = await this.callNativeMethod<boolean>('openFile', [path], false)
    return result
  }

  /**
   * 디바이스 정보 가져오기
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    console.log('📱 디바이스 정보 조회...')
    
    if (!this.isNative) {
      // 웹 환경 기본값
      return {
        platform: 'web',
        version: navigator.userAgent,
        model: 'Browser',
        manufacturer: 'Unknown',
        uuid: 'web-' + Date.now(),
        isVirtual: false
      }
    }

    const result = await this.callNativeMethod<string>('getDeviceInfo')
    
    try {
      const deviceInfo = JSON.parse(result) as DeviceInfo
      // TODO: 보안 - 민감한 정보 필터링
      return deviceInfo
    } catch (error) {
      console.error('디바이스 정보 파싱 실패:', error)
      throw new Error('디바이스 정보를 가져올 수 없습니다.')
    }
  }

  /**
   * 앱 버전 정보 가져오기
   */
  async getAppVersion(): Promise<AppVersionInfo> {
    console.log('📱 앱 버전 정보 조회...')
    
    if (!this.isNative) {
      return {
        version: '1.0.0',
        buildNumber: '1',
        packageName: 'com.qrsafety.web'
      }
    }

    const result = await this.callNativeMethod<string>('getAppVersion')
    
    try {
      const versionInfo = JSON.parse(result) as AppVersionInfo
      return versionInfo
    } catch (error) {
      console.error('버전 정보 파싱 실패:', error)
      throw new Error('앱 버전 정보를 가져올 수 없습니다.')
    }
  }

  /**
   * 권한 요청
   */
  async requestPermission(permission: Permission): Promise<boolean> {
    console.log(`🔐 권한 요청: ${permission}`)
    
    // TODO: 보안 - 권한 요청 로깅
    // TODO: 보안 - 권한 남용 방지
    
    if (!this.isNative) {
      // 웹 환경에서 권한 처리
      if (permission === 'CAMERA') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          stream.getTracks().forEach(track => track.stop())
          return true
        } catch {
          return false
        }
      }
      return true
    }

    const result = await this.callNativeMethod<boolean>('requestPermission', [permission], false)
    console.log(`✅ 권한 ${permission} ${result ? '승인됨' : '거부됨'}`)
    return result
  }

  /**
   * 권한 확인
   */
  async checkPermission(permission: Permission): Promise<boolean> {
    console.log(`🔍 권한 확인: ${permission}`)
    
    if (!this.isNative) {
      return true
    }

    return await this.callNativeMethod<boolean>('checkPermission', [permission], false)
  }

  /**
   * 토스트 메시지 표시
   */
  showToast(message: string): void {
    console.log(`💬 토스트: ${message}`)
    
    // TODO: 보안 - XSS 방지를 위한 메시지 sanitization
    
    if (!this.isNative) {
      // 웹 환경에서 토스트 표시
      const toast = document.createElement('div')
      toast.textContent = message
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        z-index: 9999;
      `
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 3000)
      return
    }

    this.callNativeMethod('showToast', [message])
  }

  /**
   * 알림 다이얼로그 표시
   */
  async showAlert(title: string, message: string): Promise<boolean> {
    console.log(`🔔 알림: ${title}`)
    
    // TODO: 보안 - XSS 방지를 위한 입력값 sanitization
    
    if (!this.isNative) {
      return confirm(`${title}\n\n${message}`)
    }

    return await this.callNativeMethod<boolean>('showAlert', [title, message], false)
  }

  /**
   * 네트워크 상태 확인
   */
  async checkNetworkStatus(): Promise<NetworkStatus> {
    console.log('🌐 네트워크 상태 확인...')
    
    if (!this.isNative) {
      return {
        isConnected: navigator.onLine,
        type: 'unknown'
      }
    }

    const result = await this.callNativeMethod<string>('checkNetworkStatus')
    
    try {
      const status = JSON.parse(result) as NetworkStatus
      // TODO: 보안 - HTTPS 연결 확인
      return status
    } catch (error) {
      console.error('네트워크 상태 파싱 실패:', error)
      return {
        isConnected: false,
        type: 'unknown'
      }
    }
  }

  /**
   * FCM 토큰 가져오기
   */
  async getFCMToken(): Promise<string> {
    console.log('🔑 FCM 토큰 조회...')
    
    // TODO: 보안 - 토큰 암호화 저장
    // TODO: 보안 - 토큰 갱신 주기 관리
    
    if (!this.isNative) {
      return 'web-fcm-token-' + Date.now()
    }

    const token = await this.callNativeMethod<string>('getFCMToken')
    
    if (!token || token.trim() === '') {
      throw new Error('FCM 토큰을 가져올 수 없습니다.')
    }
    
    console.log('✅ FCM 토큰 조회 완료')
    return token.trim()
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const nativeBridge = new NativeBridge()

// 전역 접근을 위한 window 객체에 추가
if (typeof window !== 'undefined') {
  (window as any).nativeBridge = nativeBridge
}

export default nativeBridge
export { NativeBridge, type NativeBridgeInterface }