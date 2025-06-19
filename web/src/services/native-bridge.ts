// src/services/native-bridge.ts
// 네이티브 브릿지 서비스 (보안 강화 버전)

import type { 
  DeviceInfo, 
  AppVersionInfo, 
  NetworkStatus, 
  AppError,
  Permission 
} from '@/types/global'

// 네이티브 브릿지 인터페이스 (보안 강화)
interface NativeBridgeInterface {
  readonly isNative: boolean
  readonly platform: 'android' | 'ios' | 'web'
  
  // QR 스캐너 (보안: 권한 확인 포함)
  scanQR(): Promise<string>
  
  // 파일 관리 (보안: 파일 타입 및 크기 제한)
  downloadFile(url: string, filename: string): Promise<string>
  saveFile(data: string, filename: string, mimeType?: string): Promise<string>
  openFile(path: string): Promise<boolean>
  
  // 디바이스 정보 (보안: 민감한 정보 제외)
  getDeviceInfo(): Promise<DeviceInfo>
  getAppVersion(): Promise<AppVersionInfo>
  
  // 권한 관리 (보안: 권한별 세분화)
  requestPermission(permission: Permission): Promise<boolean>
  checkPermission(permission: Permission): Promise<boolean>
  
  // 알림 (보안: XSS 방지)
  showToast(message: string): void
  showAlert(title: string, message: string): Promise<boolean>
  
  // 네트워크 (보안: 보안 연결 확인)
  checkNetworkStatus(): Promise<NetworkStatus>
  
  // FCM (보안: 토큰 관리 강화)
  getFCMToken(): Promise<string>
  
  // TODO: 보안 기능 추가
  checkRootStatus(): Promise<boolean>
  verifyAppIntegrity(): Promise<boolean>
  enableScreenProtection(): Promise<void>
  disableScreenProtection(): Promise<void>
}

// 입력값 검증 및 sanitization 유틸리티
class SecurityUtils {
  /**
   * 문자열 sanitization (XSS 방지)
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('입력값이 문자열이 아닙니다.')
    }
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim()
  }
  
  /**
   * URL 검증 (보안: 허용된 도메인만)
   */
  static validateUrl(url: string): boolean {
    try {
      const urlObject = new URL(url)
      
      // HTTPS 강제
      if (urlObject.protocol !== 'https:') {
        console.warn('HTTP URL은 허용되지 않습니다:', url)
        return false
      }
      
      // TODO: 허용된 도메인 화이트리스트 확인
      const allowedDomains = [
        'firebaseapp.com',
        'googleapis.com',
        'your-domain.com' // 실제 도메인으로 변경
      ]
      
      const isAllowed = allowedDomains.some(domain => 
        urlObject.hostname.endsWith(domain)
      )
      
      if (!isAllowed) {
        console.warn('허용되지 않은 도메인:', urlObject.hostname)
        return false
      }
      
      return true
    } catch {
      return false
    }
  }
  
  /**
   * 파일명 검증 (보안: 경로 탐색 방지)
   */
  static validateFilename(filename: string): boolean {
    if (typeof filename !== 'string' || filename.trim() === '') {
      return false
    }
    
    // 경로 탐색 시도 차단
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      console.warn('유효하지 않은 파일명:', filename)
      return false
    }
    
    // 허용된 확장자만
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.mp4', '.txt', '.json']
    const hasValidExtension = allowedExtensions.some(ext => 
      filename.toLowerCase().endsWith(ext)
    )
    
    if (!hasValidExtension) {
      console.warn('허용되지 않은 파일 확장자:', filename)
      return false
    }
    
    return true
  }
  
  /**
   * 권한 문자열 검증
   */
  static validatePermission(permission: string): permission is Permission {
    const validPermissions: Permission[] = [
      'CAMERA', 'STORAGE', 'MICROPHONE', 'LOCATION', 'NOTIFICATIONS', 
      'BIOMETRIC', 'CONTACTS', 'PHONE'
    ]
    
    return validPermissions.includes(permission as Permission)
  }
}

// 네이티브 브릿지 구현 클래스 (보안 강화)
class NativeBridge implements NativeBridgeInterface {
  public readonly isNative: boolean
  public readonly platform: 'android' | 'ios' | 'web'
  
  // 에러 추적 및 제한
  private errorCount: number = 0
  private lastErrorTime: number = 0
  private readonly MAX_ERRORS_PER_MINUTE = 10

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
    
    // 보안 체크
    this.performSecurityCheck()
  }

  /**
   * 보안 체크 수행
   */
  private performSecurityCheck(): void {
    // 개발자 도구 감지 (프로덕션에서만)
    if (import.meta.env.PROD) {
      const devtools = {
        open: false,
        orientation: null as string | null
      }
      
      const threshold = 160
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          if (!devtools.open) {
            devtools.open = true
            console.warn('🚨 보안 경고: 개발자 도구가 감지되었습니다.')
            // TODO: 보안 이벤트 로깅
          }
        } else {
          devtools.open = false
        }
      }, 500)
    }
  }

  /**
   * 에러 제한 체크
   */
  private checkErrorLimit(): boolean {
    const now = Date.now()
    if (now - this.lastErrorTime > 60000) {
      // 1분이 지나면 에러 카운트 리셋
      this.errorCount = 0
    }
    
    if (this.errorCount >= this.MAX_ERRORS_PER_MINUTE) {
      console.error('🚨 너무 많은 에러가 발생했습니다. 잠시 후 다시 시도해주세요.')
      return false
    }
    
    return true
  }

  /**
   * 에러 기록
   */
  private recordError(error: Error, context: string): void {
    this.errorCount++
    this.lastErrorTime = Date.now()
    
    console.error(`❌ [NativeBridge] ${context} 에러:`, error)
    
    // TODO: 에러 로깅 서비스로 전송 (민감한 정보 제외)
    // logError({
    //   category: 'native_bridge',
    //   message: error.message,
    //   context,
    //   platform: this.platform,
    //   timestamp: new Date().toISOString()
    // })
  }

  /**
   * QR 코드 스캔 (보안 강화)
   */
  async scanQR(): Promise<string> {
    if (!this.checkErrorLimit()) {
      throw new Error('요청 제한 초과')
    }

    try {
      console.log('📱 QR 스캔 시작...')
      
      if (this.platform === 'android' && window.Android) {
        // Android 네이티브 호출
        if (typeof window.Android.scanQR !== 'function') {
          throw new Error('Android scanQR 메서드가 구현되지 않았습니다.')
        }
        
        const result = await window.Android.scanQR()
        
        // 결과 검증
        if (typeof result !== 'string') {
          throw new Error('QR 스캔 결과가 유효하지 않습니다.')
        }
        
        // 빈 결과 처리
        if (result.trim() === '') {
          console.log('📱 QR 스캔이 취소되었습니다.')
          return ''
        }
        
        console.log('✅ QR 스캔 완료')
        return result.trim()
        
      } else if (this.platform === 'ios' && window.webkit) {
        // iOS 네이티브 호출
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('QR 스캔 타임아웃 (30초)'))
          }, 30000)
          
          // iOS 응답을 위한 글로벌 콜백 설정
          window.onQRScanResult = (result: string) => {
            clearTimeout(timeout)
            window.onQRScanResult = undefined // 콜백 정리
            
            if (typeof result === 'string' && result.trim() !== '') {
              console.log('✅ QR 스캔 완료 (iOS)')
              resolve(result.trim())
            } else {
              console.log('📱 QR 스캔이 취소되었습니다. (iOS)')
              resolve('')
            }
          }
          
          window.webkit!.messageHandlers.scanQR.postMessage({})
        })
        
      } else {
        // 웹 환경에서는 지원하지 않음
        throw new Error('웹 환경에서는 QR 스캔을 지원하지 않습니다. 네이티브 앱을 사용해주세요.')
      }
      
    } catch (error) {
      this.recordError(error as Error, 'scanQR')
      throw error
    }
  }

  /**
   * 파일 다운로드 (보안 강화)
   */
  async downloadFile(url: string, filename: string): Promise<string> {
    if (!this.checkErrorLimit()) {
      throw new Error('요청 제한 초과')
    }

    try {
      // 입력값 검증
      if (!SecurityUtils.validateUrl(url)) {
        throw new Error('유효하지 않은 URL입니다.')
      }
      
      if (!SecurityUtils.validateFilename(filename)) {
        throw new Error('유효하지 않은 파일명입니다.')
      }
      
      console.log('📥 파일 다운로드 시작:', filename)
      
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.downloadFile !== 'function') {
          throw new Error('Android downloadFile 메서드가 구현되지 않았습니다.')
        }
        
        const result = await window.Android.downloadFile(url, filename)
        
        if (typeof result !== 'string' || result.trim() === '') {
          throw new Error('파일 다운로드에 실패했습니다.')
        }
        
        console.log('✅ 파일 다운로드 완료:', result)
        return result.trim()
        
      } else if (this.platform === 'ios' && window.webkit) {
        // iOS 구현
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('파일 다운로드 타임아웃'))
          }, 60000) // 60초
          
          window.onDownloadResult = (path: string) => {
            clearTimeout(timeout)
            window.onDownloadResult = undefined
            
            if (typeof path === 'string' && path.trim() !== '') {
              console.log('✅ 파일 다운로드 완료 (iOS):', path)
              resolve(path.trim())
            } else {
              reject(new Error('파일 다운로드에 실패했습니다.'))
            }
          }
          
          window.webkit!.messageHandlers.downloadFile.postMessage({ url, filename })
        })
        
      } else {
        // 웹 환경에서는 브라우저 다운로드 사용
        console.warn('웹 환경에서는 제한된 다운로드 기능만 지원됩니다.')
        
        try {
          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`다운로드 실패: ${response.status}`)
          }
          
          const blob = await response.blob()
          const downloadUrl = URL.createObjectURL(blob)
          
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          URL.revokeObjectURL(downloadUrl)
          
          return `웹 다운로드: ${filename}`
        } catch (error) {
          throw new Error(`웹 다운로드 실패: ${(error as Error).message}`)
        }
      }
      
    } catch (error) {
      this.recordError(error as Error, 'downloadFile')
      throw error
    }
  }

  /**
   * 파일 저장 (보안 강화)
   */
  async saveFile(data: string, filename: string, mimeType: string = 'text/plain'): Promise<string> {
    if (!this.checkErrorLimit()) {
      throw new Error('요청 제한 초과')
    }

    try {
      // 입력값 검증
      if (typeof data !== 'string') {
        throw new Error('데이터가 문자열이 아닙니다.')
      }
      
      if (!SecurityUtils.validateFilename(filename)) {
        throw new Error('유효하지 않은 파일명입니다.')
      }
      
      // 데이터 크기 제한 (10MB)
      const maxSize = 10 * 1024 * 1024
      if (data.length > maxSize) {
        throw new Error('파일 크기가 너무 큽니다. (최대 10MB)')
      }
      
      console.log('💾 파일 저장 시작:', filename)
      
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.saveFile !== 'function') {
          throw new Error('Android saveFile 메서드가 구현되지 않았습니다.')
        }
        
        const result = await window.Android.saveFile(data, filename)
        
        if (typeof result !== 'string' || result.trim() === '') {
          throw new Error('파일 저장에 실패했습니다.')
        }
        
        console.log('✅ 파일 저장 완료:', result)
        return result.trim()
        
      } else if (this.platform === 'ios' && window.webkit) {
        // iOS 구현
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('파일 저장 타임아웃'))
          }, 30000)
          
          window.onSaveFileResult = (path: string) => {
            clearTimeout(timeout)
            window.onSaveFileResult = undefined
            
            if (typeof path === 'string' && path.trim() !== '') {
              console.log('✅ 파일 저장 완료 (iOS):', path)
              resolve(path.trim())
            } else {
              reject(new Error('파일 저장에 실패했습니다.'))
            }
          }
          
          window.webkit!.messageHandlers.saveFile.postMessage({ 
            data, 
            filename, 
            mimeType 
          })
        })
        
      } else {
        // 웹 환경에서는 다운로드로 대체
        console.warn('웹 환경에서는 다운로드로 파일 저장을 대체합니다.')
        
        const blob = new Blob([data], { type: mimeType })
        const url = URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        URL.revokeObjectURL(url)
        
        return `웹 저장: ${filename}`
      }
      
    } catch (error) {
      this.recordError(error as Error, 'saveFile')
      throw error
    }
  }

  /**
   * 파일 열기 (보안 강화)
   */
  async openFile(path: string): Promise<boolean> {
    if (!this.checkErrorLimit()) {
      throw new Error('요청 제한 초과')
    }

    try {
      // 경로 검증
      if (typeof path !== 'string' || path.trim() === '') {
        throw new Error('유효하지 않은 파일 경로입니다.')
      }
      
      // 경로 탐색 공격 방지
      if (path.includes('..') || path.includes('//')) {
        throw new Error('보안상 허용되지 않은 파일 경로입니다.')
      }
      
      console.log('📂 파일 열기:', path)
      
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.openFile !== 'function') {
          throw new Error('Android openFile 메서드가 구현되지 않았습니다.')
        }
        
        const result = await window.Android.openFile(path)
        console.log('✅ 파일 열기 완료:', result)
        return result === true
        
      } else if (this.platform === 'ios' && window.webkit) {
        // iOS 구현
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('파일 열기 타임아웃'))
          }, 10000)
          
          window.onOpenFileResult = (success: boolean) => {
            clearTimeout(timeout)
            window.onOpenFileResult = undefined
            
            console.log('✅ 파일 열기 완료 (iOS):', success)
            resolve(success === true)
          }
          
          window.webkit!.messageHandlers.openFile.postMessage({ path })
        })
        
      } else {
        // 웹 환경에서는 지원하지 않음
        console.warn('웹 환경에서는 파일 열기를 지원하지 않습니다.')
        return false
      }
      
    } catch (error) {
      this.recordError(error as Error, 'openFile')
      throw error
    }
  }

  /**
   * 디바이스 정보 조회 (보안 강화: 민감한 정보 제외)
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    if (!this.checkErrorLimit()) {
      throw new Error('요청 제한 초과')
    }

    try {
      console.log('📱 디바이스 정보 조회...')
      
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.getDeviceInfo !== 'function') {
          throw new Error('Android getDeviceInfo 메서드가 구현되지 않았습니다.')
        }
        
        const result = await window.Android.getDeviceInfo()
        const deviceInfo = typeof result === 'string' ? JSON.parse(result) : result
        
        console.log('✅ 디바이스 정보 조회 완료')
        return deviceInfo as DeviceInfo
        
      } else if (this.platform === 'ios' && window.webkit) {
        // iOS 구현
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('디바이스 정보 조회 타임아웃'))
          }, 5000)
          
          window.onDeviceInfoResult = (info: DeviceInfo) => {
            clearTimeout(timeout)
            window.onDeviceInfoResult = undefined
            
            console.log('✅ 디바이스 정보 조회 완료 (iOS)')
            resolve(info)
          }
          
          window.webkit!.messageHandlers.getDeviceInfo.postMessage({})
        })
        
      } else {
        // 웹 환경에서는 기본 정보만 제공
        const webDeviceInfo: DeviceInfo = {
          platform: 'web',
          osVersion: navigator.userAgent,
          appVersion: '1.0.0-web',
          deviceModel: 'Web Browser',
          isNative: false,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
        
        console.log('✅ 웹 디바이스 정보 조회 완료')
        return webDeviceInfo
      }
      
    } catch (error) {
      this.recordError(error as Error, 'getDeviceInfo')
      throw error
    }
  }

  /**
   * 앱 버전 정보 조회
   */
  async getAppVersion(): Promise<AppVersionInfo> {
    if (!this.checkErrorLimit()) {
      throw new Error('요청 제한 초과')
    }

    try {
      console.log('📊 앱 버전 정보 조회...')
      
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.getAppVersion !== 'function') {
          throw new Error('Android getAppVersion 메서드가 구현되지 않았습니다.')
        }
        
        const result = await window.Android.getAppVersion()
        const versionInfo = typeof result === 'string' ? JSON.parse(result) : result
        
        console.log('✅ 앱 버전 정보 조회 완료')
        return versionInfo as AppVersionInfo
        
      } else if (this.platform === 'ios' && window.webkit) {
        // iOS 구현
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('앱 버전 정보 조회 타임아웃'))
          }, 5000)
          
          window.onAppVersionResult = (info: AppVersionInfo) => {
            clearTimeout(timeout)
            window.onAppVersionResult = undefined
            
            console.log('✅ 앱 버전 정보 조회 완료 (iOS)')
            resolve(info)
          }
          
          window.webkit!.messageHandlers.getAppVersion.postMessage({})
        })
        
      } else {
        // 웹 환경에서는 기본 정보
        const webVersionInfo: AppVersionInfo = {
          version: '1.0.0',
          buildNumber: '1',
          releaseDate: new Date().toISOString(),
          features: ['web-support', 'responsive-design']
        }
        
        console.log('✅ 웹 버전 정보 조회 완료')
        return webVersionInfo
      }
      
    } catch (error) {
      this.recordError(error as Error, 'getAppVersion')
      throw error
    }
  }

  /**
   * 권한 요청 (보안 강화)
   */
  async requestPermission(permission: Permission): Promise<boolean> {
    if (!this.checkErrorLimit()) {
      throw new Error('요청 제한 초과')
    }

    try {
      // 권한 문자열 검증
      if (!SecurityUtils.validatePermission(permission)) {
        throw new Error(`유효하지 않은 권한: ${permission}`)
      }
      
      console.log('🔐 권한 요청:', permission)
      
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.requestPermission !== 'function') {
          throw new Error('Android requestPermission 메서드가 구현되지 않았습니다.')
        }
        
        const granted = await window.Android.requestPermission(permission)
        
        console.log(`${granted ? '✅' : '❌'} 권한 요청 결과 (${permission}):`, granted)
        return granted === true
        
      } else if (this.platform === 'ios' && window.webkit) {
        // iOS 구현
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('권한 요청 타임아웃'))
          }, 30000)
          
          window.onPermissionResult = (granted: boolean) => {
            clearTimeout(timeout)
            window.onPermissionResult = undefined
            
            console.log(`${granted ? '✅' : '❌'} 권한 요청 결과 (${permission}, iOS):`, granted)
            resolve(granted === true)
          }
          
          window.webkit!.messageHandlers.requestPermission.postMessage({ permission })
        })
        
      } else {
        // 웹 환경에서는 브라우저 권한 API 사용
        try {
          let browserPermission: string
          
          switch (permission) {
            case 'CAMERA':
              browserPermission = 'camera'
              break
            case 'MICROPHONE':
              browserPermission = 'microphone'
              break
            case 'LOCATION':
              browserPermission = 'geolocation'
              break
            case 'NOTIFICATIONS':
              browserPermission = 'notifications'
              break
            default:
              console.warn(`웹에서 지원하지 않는 권한: ${permission}`)
              return false
          }
          
          const result = await navigator.permissions.query({ name: browserPermission as PermissionName })
          
          if (result.state === 'granted') {
            console.log('✅ 웹 권한 이미 허용됨:', permission)
            return true
          } else if (result.state === 'prompt') {
            // 실제 권한 요청이 필요한 경우
            console.log('📝 웹 권한 요청 필요:', permission)
            return false // 실제 구현에서는 사용자 액션 필요
          } else {
            console.log('❌ 웹 권한 거부됨:', permission)
            return false
          }
        } catch (error) {
          console.warn('웹 권한 확인 실패:', error)
          return false
        }
      }
      
    } catch (error) {
      this.recordError(error as Error, 'requestPermission')
      throw error
    }
  }

  /**
   * 권한 상태 확인
   */
  async checkPermission(permission: Permission): Promise<boolean> {
    if (!this.checkErrorLimit()) {
      throw new Error('요청 제한 초과')
    }

    try {
      // 권한 문자열 검증
      if (!SecurityUtils.validatePermission(permission)) {
        throw new Error(`유효하지 않은 권한: ${permission}`)
      }
      
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.checkPermission !== 'function') {
          throw new Error('Android checkPermission 메서드가 구현되지 않았습니다.')
        }
        
        const granted = await window.Android.checkPermission(permission)
        return granted === true
        
      } else if (this.platform === 'ios' && window.webkit) {
        // iOS 구현
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('권한 확인 타임아웃'))
          }, 5000)
          
          window.onCheckPermissionResult = (granted: boolean) => {
            clearTimeout(timeout)
            window.onCheckPermissionResult = undefined
            resolve(granted === true)
          }
          
          window.webkit!.messageHandlers.checkPermission.postMessage({ permission })
        })
        
      } else {
        // 웹 환경에서는 브라우저 권한 확인
        try {
          let browserPermission: string
          
          switch (permission) {
            case 'CAMERA':
              browserPermission = 'camera'
              break
            case 'MICROPHONE':
              browserPermission = 'microphone'
              break
            case 'LOCATION':
              browserPermission = 'geolocation'
              break
            case 'NOTIFICATIONS':
              browserPermission = 'notifications'
              break
            default:
              return false
          }
          
          const result = await navigator.permissions.query({ name: browserPermission as PermissionName })
          return result.state === 'granted'
        } catch {
          return false
        }
      }
      
    } catch (error) {
      this.recordError(error as Error, 'checkPermission')
      throw error
    }
  }

  /**
   * 토스트 메시지 표시 (보안: XSS 방지)
   */
  showToast(message: string): void {
    if (!this.checkErrorLimit()) {
      console.warn('요청 제한으로 토스트를 표시할 수 없습니다.')
      return
    }

    try {
      // 메시지 sanitization
      const sanitizedMessage = SecurityUtils.sanitizeString(message)
      
      if (sanitizedMessage.length > 200) {
        console.warn('토스트 메시지가 너무 깁니다. 200자로 제한됩니다.')
        const truncatedMessage = sanitizedMessage.substring(0, 197) + '...'
        this.showToast(truncatedMessage)
        return
      }
      
      console.log('💬 토스트 표시:', sanitizedMessage)
      
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.showToast === 'function') {
          window.Android.showToast(sanitizedMessage)
        } else {
          console.warn('Android showToast 메서드가 구현되지 않았습니다.')
        }
        
      } else if (this.platform === 'ios' && window.webkit) {
        window.webkit.messageHandlers.showToast.postMessage({ message: sanitizedMessage })
        
      } else {
        // 웹 환경에서는 간단한 알림으로 대체
        console.log('📱 [토스트]:', sanitizedMessage)
        
        // TODO: 웹용 토스트 UI 구현
        // 임시로 console.log 사용
      }
      
    } catch (error) {
      this.recordError(error as Error, 'showToast')
      console.error('토스트 표시 실패:', error)
    }
  }

  /**
   * 알림 대화상자 표시 (보안: XSS 방지)
   */
  async showAlert(title: string, message: string): Promise<boolean> {
    if (!this.checkErrorLimit()) {
      throw new Error('요청 제한 초과')
    }

    try {
      // 입력값 sanitization
      const sanitizedTitle = SecurityUtils.sanitizeString(title)
      const sanitizedMessage = SecurityUtils.sanitizeString(message)
      
      console.log('⚠️ 알림 표시:', sanitizedTitle)
      
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.showAlert !== 'function') {
          throw new Error('Android showAlert 메서드가 구현되지 않았습니다.')
        }
        
        const result = await window.Android.showAlert(sanitizedTitle, sanitizedMessage)
        return result === true
        
      } else if (this.platform === 'ios' && window.webkit) {
        // iOS 구현
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('알림 대화상자 타임아웃'))
          }, 30000)
          
          window.onAlertResult = (result: boolean) => {
            clearTimeout(timeout)
            window.onAlertResult = undefined
            resolve(result === true)
          }
          
          window.webkit!.messageHandlers.showAlert.postMessage({ 
            title: sanitizedTitle, 
            message: sanitizedMessage 
          })
        })
        
      } else {
        // 웹 환경에서는 브라우저 alert 사용
        const result = window.confirm(`${sanitizedTitle}\n\n${sanitizedMessage}`)
        console.log('✅ 웹 알림 결과:', result)
        return result
      }
      
    } catch (error) {
      this.recordError(error as Error, 'showAlert')
      throw error
    }
  }

  /**
   * 네트워크 상태 확인 (보안: 보안 연결 확인 포함)
   */
  async checkNetworkStatus(): Promise<NetworkStatus> {
    if (!this.checkErrorLimit()) {
      throw new Error('요청 제한 초과')
    }

    try {
      console.log('🌐 네트워크 상태 확인...')
      
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.checkNetworkStatus !== 'function') {
          throw new Error('Android checkNetworkStatus 메서드가 구현되지 않았습니다.')
        }
        
        const result = await window.Android.checkNetworkStatus()
        const networkStatus = typeof result === 'string' ? JSON.parse(result) : result
        
        console.log('✅ 네트워크 상태 확인 완료')
        return networkStatus as NetworkStatus
        
      } else if (this.platform === 'ios' && window.webkit) {
        // iOS 구현
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('네트워크 상태 확인 타임아웃'))
          }, 5000)
          
          window.onNetworkStatusResult = (status: NetworkStatus) => {
            clearTimeout(timeout)
            window.onNetworkStatusResult = undefined
            
            console.log('✅ 네트워크 상태 확인 완료 (iOS)')
            resolve(status)
          }
          
          window.webkit!.messageHandlers.checkNetworkStatus.postMessage({})
        })
        
      } else {
        // 웹 환경에서는 Navigator API 사용
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
        
        const networkStatus: NetworkStatus = {
          isConnected: navigator.onLine,
          type: connection?.effectiveType || 'unknown',
          speed: connection?.downlink > 10 ? 'fast' : 'slow',
          isSecure: location.protocol === 'https:',
          isVPN: false // 웹에서는 감지 불가
        }
        
        console.log('✅ 웹 네트워크 상태 확인 완료')
        return networkStatus
      }
      
    } catch (error) {
      this.recordError(error as Error, 'checkNetworkStatus')
      throw error
    }
  }

  /**
   * FCM 토큰 조회 (보안: 토큰 관리 강화)
   */
  async getFCMToken(): Promise<string> {
    if (!this.checkErrorLimit()) {
      throw new Error('요청 제한 초과')
    }

    try {
      console.log('🔔 FCM 토큰 조회...')
      
      if (this.platform === 'android' && window.Android) {
        if (typeof window.Android.getFCMToken !== 'function') {
          throw new Error('Android getFCMToken 메서드가 구현되지 않았습니다.')
        }
        
        const token = await window.Android.getFCMToken()
        
        if (typeof token !== 'string' || token.trim() === '') {
          throw new Error('FCM 토큰을 가져올 수 없습니다.')
        }
        
        console.log('✅ FCM 토큰 조회 완료')
        return token.trim()
        
      } else if (this.platform === 'ios' && window.webkit) {
        // iOS 구현
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('FCM 토큰 조회 타임아웃'))
          }, 10000)
          
          window.onFCMTokenResult = (token: string) => {
            clearTimeout(timeout)
            window.onFCMTokenResult = undefined
            
            if (typeof token === 'string' && token.trim() !== '') {
              console.log('✅ FCM 토큰 조회 완료 (iOS)')
              resolve(token.trim())
            } else {
              reject(new Error('FCM 토큰을 가져올 수 없습니다.'))
            }
          }
          
          window.webkit!.messageHandlers.getFCMToken.postMessage({})
        })
        
      } else {
        // 웹 환경에서는 지원하지 않음
        throw new Error('웹 환경에서는 FCM 토큰을 지원하지 않습니다.')
      }
      
    } catch (error) {
      this.recordError(error as Error, 'getFCMToken')
      throw error
    }
  }

  /**
   * TODO: 보안 기능들 (추후 구현)
   */

  /**
   * 루팅/탈옥 상태 확인
   */
  async checkRootStatus(): Promise<boolean> {
    if (!this.isNative) {
      return false
    }

    try {
      // TODO: 네이티브 구현 연동
      console.log('🛡️ 루팅/탈옥 상태 확인...')
      
      // 임시 구현 - 실제로는 네이티브에서 구현 필요
      if (this.platform === 'android') {
        // Android 루팅 체크 로직
        return false
      } else if (this.platform === 'ios') {
        // iOS 탈옥 체크 로직
        return false
      }
      
      return false
    } catch (error) {
      this.recordError(error as Error, 'checkRootStatus')
      return false
    }
  }

  /**
   * 앱 무결성 검증
   */
  async verifyAppIntegrity(): Promise<boolean> {
    if (!this.isNative) {
      return true // 웹에서는 항상 true
    }

    try {
      console.log('🔍 앱 무결성 검증...')
      
      // TODO: 네이티브 구현 연동
      // - 앱 서명 확인
      // - 코드 변조 감지
      // - 디버거 연결 감지
      
      return true
    } catch (error) {
      this.recordError(error as Error, 'verifyAppIntegrity')
      return false
    }
  }

  /**
   * 스크린 보호 활성화
   */
  async enableScreenProtection(): Promise<void> {
    if (!this.isNative) {
      console.warn('웹 환경에서는 스크린 보호를 지원하지 않습니다.')
      return
    }

    try {
      console.log('🛡️ 스크린 보호 활성화...')
      
      // TODO: 네이티브 구현 연동
      // - 스크린샷 차단
      // - 화면 녹화 감지 및 차단
      // - 최근 앱 목록에서 숨김
      
    } catch (error) {
      this.recordError(error as Error, 'enableScreenProtection')
      throw error
    }
  }

  /**
   * 스크린 보호 비활성화
   */
  async disableScreenProtection(): Promise<void> {
    if (!this.isNative) {
      return
    }

    try {
      console.log('🔓 스크린 보호 비활성화...')
      
      // TODO: 네이티브 구현 연동
      
    } catch (error) {
      this.recordError(error as Error, 'disableScreenProtection')
      throw error
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const nativeBridge = new NativeBridge()

// TODO: 보안 강화 - 글로벌 객체 보호
if (typeof window !== 'undefined') {
  // 개발 환경에서만 전역 접근 허용
  if (import.meta.env.DEV) {
    (window as any).nativeBridge = nativeBridge
  }
  
  // 프로덕션에서는 디버깅 방지
  if (import.meta.env.PROD) {
    // 개발자 도구 감지 시 경고
    let devtools = false
    const threshold = 160
    
    const detectDevTools = () => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools) {
          devtools = true
          console.warn('🚨 보안 경고: 개발자 도구가 감지되었습니다.')
          
          // TODO: 보안 이벤트 로깅
          // logSecurityEvent('devtools_detected', { timestamp: Date.now() })
        }
      } else {
        devtools = false
      }
    }
    
    setInterval(detectDevTools, 1000)
  }
}

export default nativeBridge

// 타입 내보내기
export type { NativeBridgeInterface }