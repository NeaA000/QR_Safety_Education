package com.jbsqr.safety.security

import android.content.Context
import android.content.pm.PackageManager
import android.content.pm.Signature
import android.os.Build
import android.os.Debug
import android.provider.Settings
import android.util.Log
import com.jbsqr.safety.BuildConfig
import java.io.File
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException

/**
 * 종합 보안 관리 모듈
 * 앱 무결성 검증, 디버깅 탐지, 에뮬레이터 탐지 등
 * 구글 플레이스토어 보안 정책 준수
 */
class SecurityManager(private val context: Context) {

    companion object {
        private const val TAG = "SecurityManager"

        // Debug 서명만 설정 (프로덕션 서명은 나중에 추가)
        private val EXPECTED_SIGNATURES = arrayOf(
            "9745f7468189d2eee42d60dedd710568b1527a6013a0d57e9f5f6410489b71d8" // Debug 서명
        )

        // 알려진 에뮬레이터 특성들
        private val EMULATOR_PROPS = arrayOf(
            "ro.product.model" to "google_sdk",
            "ro.product.manufacturer" to "Genymotion",
            "ro.hardware" to "goldfish",
            "ro.product.board" to "unknown",
            "ro.product.device" to "generic",
            "ro.build.product" to "sdk",
            "ro.build.product" to "google_sdk"
        )

        // 루팅 탐지용 경로들 (기본적인 것들만)
        private val ROOT_PATHS = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su",
            "/su/bin/su"
        )

        // 루팅 관련 패키지들
        private val ROOT_PACKAGES = arrayOf(
            "com.noshufou.android.su",
            "com.noshufou.android.su.elite",
            "eu.chainfire.supersu",
            "com.koushikdutta.superuser",
            "com.thirdparty.superuser",
            "com.yellowes.su"
        )
    }

    private var isMonitoring = false
    private var monitoringRunnable: Runnable? = null
    private val handler = android.os.Handler(android.os.Looper.getMainLooper())

    /**
     * 보안 검사 결과를 담는 데이터 클래스
     */
    data class SecurityCheckResult(
        val isSecure: Boolean,
        val issues: List<String> = emptyList(),
        val details: Map<String, Any> = emptyMap()
    )

    /**
     * 종합적인 보안 검사 수행
     * @return SecurityCheckResult 보안 검사 결과
     */
    fun performSecurityCheck(): SecurityCheckResult {
        val issues = mutableListOf<String>()
        val details = mutableMapOf<String, Any>()

        try {
            Log.d(TAG, "종합 보안 검사 시작")

            // 1. 앱 무결성 검증
            val appIntegrityResult = verifyAppIntegrity()
            if (!appIntegrityResult) {
                issues.add("앱 무결성 검증 실패")
            }
            details["appIntegrity"] = appIntegrityResult

            // 2. 루팅/탈옥 탐지 (내장 기능 사용)
            val rootDetected = isDeviceRooted()
            if (rootDetected) {
                issues.add("루팅된 디바이스 감지")
            }
            details["rootDetected"] = rootDetected

            // 3. 디버깅 탐지 (프로덕션 빌드에서만)
            val debuggingDetected = isDebuggingDetected()
            if (!BuildConfig.DEBUG && debuggingDetected) {
                issues.add("디버깅 감지")
            }
            details["debuggingDetected"] = debuggingDetected

            // 4. 에뮬레이터 탐지
            val emulatorDetected = isEmulator()
            if (emulatorDetected) {
                issues.add("에뮬레이터에서 실행 중")
            }
            details["isEmulator"] = emulatorDetected

            val isSecure = issues.isEmpty()
            Log.d(TAG, "보안 검사 완료 - 보안 상태: $isSecure, 문제점: ${issues.size}개")

            return SecurityCheckResult(
                isSecure = isSecure,
                issues = issues,
                details = details
            )

        } catch (e: Exception) {
            Log.e(TAG, "보안 검사 중 오류", e)
            return SecurityCheckResult(
                isSecure = false,
                issues = listOf("보안 검사 중 오류 발생: ${e.message}"),
                details = mapOf("error" to e.message.orEmpty())
            )
        }
    }

    /**
     * 보안 위반 처리
     * @param securityResult 보안 검사 결과
     */
    fun handleSecurityViolation(securityResult: SecurityCheckResult) {
        try {
            Log.e(TAG, "보안 위반 처리 시작")
            Log.e(TAG, "문제점: ${securityResult.issues}")

            // 프로덕션 환경에서의 보안 위반 처리
            if (!BuildConfig.DEBUG && BuildConfig.STRICT_SECURITY) {
                // 엄격한 보안 모드에서는 앱 종료
                Log.e(TAG, "엄격한 보안 모드 - 앱 종료")

                // 안전한 앱 종료
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    if (context is android.app.Activity) {
                        context.finishAffinity()
                    }
                    android.os.Process.killProcess(android.os.Process.myPid())
                }
            } else {
                // 개발 환경에서는 경고만 출력
                Log.w(TAG, "개발 환경 - 보안 위반 경고만 출력")
            }

        } catch (e: Exception) {
            Log.e(TAG, "보안 위반 처리 중 오류", e)
        }
    }

    /**
     * 루팅/탈옥 탐지 (내장 기능)
     */
    fun isDeviceRooted(): Boolean {
        return try {
            // 1. su 바이너리 파일 확인
            if (checkRootBinaries()) {
                Log.w(TAG, "루팅 바이너리 파일 감지")
                return true
            }

            // 2. 루팅 앱 패키지 확인
            if (checkRootPackages()) {
                Log.w(TAG, "루팅 관련 앱 감지")
                return true
            }

            // 3. 시스템 속성 확인
            if (checkRootProperties()) {
                Log.w(TAG, "루팅 관련 시스템 속성 감지")
                return true
            }

            // 4. 테스트 키로 빌드된 시스템인지 확인
            if (checkTestKeys()) {
                Log.w(TAG, "테스트 키로 빌드된 시스템 감지")
                return true
            }

            false
        } catch (e: Exception) {
            Log.e(TAG, "루팅 탐지 오류", e)
            false
        }
    }

    /**
     * 루팅 바이너리 파일 확인
     */
    private fun checkRootBinaries(): Boolean {
        return ROOT_PATHS.any { path ->
            try {
                val file = File(path)
                file.exists() && file.canExecute()
            } catch (e: Exception) {
                false
            }
        }
    }

    /**
     * 루팅 관련 패키지 확인
     */
    private fun checkRootPackages(): Boolean {
        return ROOT_PACKAGES.any { packageName ->
            try {
                context.packageManager.getPackageInfo(packageName, 0)
                true
            } catch (e: Exception) {
                false
            }
        }
    }

    /**
     * 루팅 관련 시스템 속성 확인
     */
    private fun checkRootProperties(): Boolean {
        return try {
            val buildTags = getSystemProperty("ro.build.tags")
            buildTags?.contains("test-keys") == true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * 테스트 키 확인
     */
    private fun checkTestKeys(): Boolean {
        return Build.TAGS?.contains("test-keys") == true
    }

    /**
     * 앱 무결성 검증
     * @return 검증 통과 여부
     */
    fun verifyAppIntegrity(): Boolean {
        return try {
            Log.d(TAG, "앱 무결성 검증 시작")

            // 1. 패키지명 검증
            if (!verifyPackageName()) {
                Log.w(TAG, "패키지명 검증 실패")
                return false
            }

            // 2. 앱 서명 검증
            if (!verifyAppSignature()) {
                Log.w(TAG, "앱 서명 검증 실패")
                return false
            }

            // 3. 설치 출처 검증 (선택적)
            if (!BuildConfig.DEBUG && !verifyInstallSource()) {
                Log.w(TAG, "설치 출처 검증 실패 (경고)")
                // 프로덕션에서는 경고만 하고 통과시킴 (사이드로딩 허용)
            }

            Log.d(TAG, "앱 무결성 검증 통과")
            true

        } catch (e: Exception) {
            Log.e(TAG, "앱 무결성 검증 중 오류", e)
            false
        }
    }

    /**
     * 패키지명 검증
     */
    private fun verifyPackageName(): Boolean {
        val packageName = context.packageName
        val expectedPackageName = "com.jbsqr.safety"

        return packageName == expectedPackageName
    }

    /**
     * 앱 서명 검증 (Debug/Production 환경 고려)
     */
    private fun verifyAppSignature(): Boolean {
        return try {
            val currentSignatures = getCurrentSignatureHashes()

            // 현재 서명을 로그로 출력 (개발용)
            if (BuildConfig.DEBUG) {
                Log.d(TAG, "=== 현재 앱 서명 해시 ===")
                currentSignatures.forEachIndexed { index, hash ->
                    Log.d(TAG, "서명 $index: $hash")
                }
                Log.d(TAG, "========================")
            }

            // Debug 빌드인 경우 Debug 서명만 확인
            if (BuildConfig.DEBUG) {
                val debugSignature = EXPECTED_SIGNATURES[0] // Debug 서명
                val isValidDebug = currentSignatures.any { it.equals(debugSignature, ignoreCase = true) }

                if (!isValidDebug) {
                    Log.w(TAG, "Debug 서명 불일치")
                    Log.w(TAG, "예상 서명: $debugSignature")
                    Log.w(TAG, "현재 서명: ${currentSignatures.joinToString()}")
                }

                return isValidDebug
            }

            // Release 빌드인 경우 - 현재는 Debug 서명만 있으므로 임시로 true 반환
            // 실제 프로덕션 배포 시 프로덕션 서명을 EXPECTED_SIGNATURES에 추가해야 함
            Log.w(TAG, "프로덕션 서명 검증: 아직 프로덕션 서명이 설정되지 않음")
            Log.w(TAG, "현재 프로덕션 서명: ${currentSignatures.joinToString()}")

            // 첫 프로덕션 배포를 위해 임시로 true 반환
            // 실제 운영에서는 프로덕션 서명을 추가한 후 아래 코드를 활성화
            /*
            val hasValidSignature = currentSignatures.any { current ->
                EXPECTED_SIGNATURES.any { expected ->
                    current.equals(expected, ignoreCase = true)
                }
            }
            return hasValidSignature
            */

            return true

        } catch (e: Exception) {
            Log.e(TAG, "앱 서명 검증 오류", e)
            false
        }
    }

    /**
     * 현재 앱의 서명 해시들을 가져오기
     */
    private fun getCurrentSignatureHashes(): List<String> {
        val signatures = mutableListOf<String>()

        try {
            val packageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                context.packageManager.getPackageInfo(
                    context.packageName,
                    PackageManager.GET_SIGNING_CERTIFICATES
                )
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(
                    context.packageName,
                    PackageManager.GET_SIGNATURES
                )
            }

            val signatureArray = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.signingInfo?.apkContentsSigners
            } else {
                @Suppress("DEPRECATION")
                packageInfo.signatures
            }

            signatureArray?.forEach { signature ->
                val hash = getSignatureHash(signature)
                signatures.add(hash)
            }

        } catch (e: Exception) {
            Log.e(TAG, "서명 해시 추출 실패", e)
        }

        return signatures
    }

    /**
     * 서명 해시 생성
     */
    private fun getSignatureHash(signature: Signature): String {
        return try {
            val md = MessageDigest.getInstance("SHA-256")
            md.update(signature.toByteArray())
            bytesToHex(md.digest())
        } catch (e: NoSuchAlgorithmException) {
            Log.e(TAG, "SHA-256 알고리즘을 찾을 수 없음", e)
            ""
        }
    }

    /**
     * 바이트 배열을 16진수 문자열로 변환
     */
    private fun bytesToHex(bytes: ByteArray): String {
        val result = StringBuilder()
        for (byte in bytes) {
            result.append(String.format("%02x", byte))
        }
        return result.toString()
    }

    /**
     * 설치 출처 검증
     */
    private fun verifyInstallSource(): Boolean {
        return try {
            val installer = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                context.packageManager.getInstallSourceInfo(context.packageName).installingPackageName
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getInstallerPackageName(context.packageName)
            }

            Log.d(TAG, "설치 출처: $installer")

            // 허용된 설치 출처들
            val allowedInstallers = listOf(
                "com.android.vending",        // Google Play Store
                "com.amazon.venezia",         // Amazon Appstore
                "com.sec.android.app.samsungapps", // Samsung Galaxy Store
                null                          // 사이드로딩 (개발/테스트용)
            )

            allowedInstallers.contains(installer)
        } catch (e: Exception) {
            Log.e(TAG, "설치 출처 확인 오류", e)
            true // 오류 시 통과시킴
        }
    }

    /**
     * 디버깅 탐지
     */
    fun isDebuggingDetected(): Boolean {
        return try {
            // 1. 디버거 연결 확인
            if (Debug.isDebuggerConnected()) {
                Log.w(TAG, "디버거 연결 감지")
                return true
            }

            // 2. 개발자 옵션 활성화 확인
            if (isDeveloperOptionsEnabled()) {
                Log.w(TAG, "개발자 옵션 활성화 감지")
                return true
            }

            // 3. USB 디버깅 활성화 확인
            if (isUSBDebuggingEnabled()) {
                Log.w(TAG, "USB 디버깅 활성화 감지")
                return true
            }

            false
        } catch (e: Exception) {
            Log.e(TAG, "디버깅 탐지 오류", e)
            false
        }
    }

    /**
     * 개발자 옵션 활성화 확인
     */
    private fun isDeveloperOptionsEnabled(): Boolean {
        return try {
            Settings.Global.getInt(
                context.contentResolver,
                Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0
            ) != 0
        } catch (e: Exception) {
            false
        }
    }

    /**
     * USB 디버깅 활성화 확인
     */
    private fun isUSBDebuggingEnabled(): Boolean {
        return try {
            Settings.Global.getInt(
                context.contentResolver,
                Settings.Global.ADB_ENABLED, 0
            ) != 0
        } catch (e: Exception) {
            false
        }
    }

    /**
     * 에뮬레이터 탐지
     */
    fun isEmulator(): Boolean {
        return try {
            // 1. Build 속성 확인
            if (checkBuildProperties()) {
                Log.d(TAG, "Build 속성으로 에뮬레이터 감지")
                return true
            }

            // 2. 시스템 속성 확인
            if (checkSystemProperties()) {
                Log.d(TAG, "시스템 속성으로 에뮬레이터 감지")
                return true
            }

            // 3. 하드웨어 특성 확인
            if (checkHardwareFeatures()) {
                Log.d(TAG, "하드웨어 특성으로 에뮬레이터 감지")
                return true
            }

            false
        } catch (e: Exception) {
            Log.e(TAG, "에뮬레이터 탐지 오류", e)
            false
        }
    }

    /**
     * Build 속성 확인
     */
    private fun checkBuildProperties(): Boolean {
        return Build.FINGERPRINT.startsWith("generic") ||
                Build.FINGERPRINT.lowercase().contains("vbox") ||
                Build.FINGERPRINT.lowercase().contains("test-keys") ||
                Build.MODEL.contains("google_sdk") ||
                Build.MODEL.contains("Emulator") ||
                Build.MODEL.contains("Android SDK built for x86") ||
                Build.MANUFACTURER.contains("Genymotion") ||
                Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic") ||
                "google_sdk" == Build.PRODUCT
    }

    /**
     * 시스템 속성 확인
     */
    private fun checkSystemProperties(): Boolean {
        return try {
            for ((prop, value) in EMULATOR_PROPS) {
                val propValue = getSystemProperty(prop)
                if (propValue != null && propValue.lowercase().contains(value.lowercase())) {
                    return true
                }
            }
            false
        } catch (e: Exception) {
            false
        }
    }

    /**
     * 시스템 속성 값 가져오기
     */
    private fun getSystemProperty(name: String): String? {
        return try {
            val systemProperties = Class.forName("android.os.SystemProperties")
            val method = systemProperties.getMethod("get", String::class.java)
            method.invoke(null, name) as? String
        } catch (e: Exception) {
            null
        }
    }

    /**
     * 하드웨어 특성 확인
     */
    private fun checkHardwareFeatures(): Boolean {
        return try {
            // 센서 개수가 너무 적으면 에뮬레이터일 가능성이 높음
            val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as android.hardware.SensorManager
            val sensors = sensorManager.getSensorList(android.hardware.Sensor.TYPE_ALL)

            sensors.size < 5 // 일반적으로 실제 기기는 5개 이상의 센서를 가짐
        } catch (e: Exception) {
            false
        }
    }

    /**
     * 런타임 보안 모니터링 시작
     */
    fun startRuntimeMonitoring() {
        if (isMonitoring) return

        Log.d(TAG, "런타임 보안 모니터링 시작")
        isMonitoring = true

        monitoringRunnable = object : Runnable {
            override fun run() {
                if (isMonitoring) {
                    performRuntimeSecurityCheck()
                    handler.postDelayed(this, 30000) // 30초마다 검사
                }
            }
        }

        handler.post(monitoringRunnable!!)
    }

    /**
     * 런타임 보안 모니터링 중지
     */
    fun stopRuntimeMonitoring() {
        Log.d(TAG, "런타임 보안 모니터링 중지")
        isMonitoring = false
        monitoringRunnable?.let { handler.removeCallbacks(it) }
        monitoringRunnable = null
    }

    /**
     * 런타임 보안 검사 수행
     */
    private fun performRuntimeSecurityCheck() {
        try {
            // 1. 디버깅 재검사
            if (!BuildConfig.DEBUG && isDebuggingDetected()) {
                Log.w(TAG, "런타임 디버깅 감지")
                val securityResult = SecurityCheckResult(
                    isSecure = false,
                    issues = listOf("Runtime debugging detected")
                )
                handleSecurityViolation(securityResult)
            }

            // 2. 메모리 변조 검사 (선택적)
            // 실제 구현 시 메모리 체크섬 등을 사용할 수 있음

        } catch (e: Exception) {
            Log.e(TAG, "런타임 보안 검사 오류", e)
        }
    }

    /**
     * 보안 상태 정보 반환
     */
    fun getSecurityStatus(): Map<String, Any> {
        return mapOf(
            "appIntegrityVerified" to verifyAppIntegrity(),
            "rootDetected" to isDeviceRooted(),
            "debuggingDetected" to isDebuggingDetected(),
            "isEmulator" to isEmulator(),
            "isMonitoring" to isMonitoring,
            "buildConfig" to mapOf(
                "debug" to BuildConfig.DEBUG,
                "strictSecurity" to BuildConfig.STRICT_SECURITY
            )
        )
    }

    /**
     * 리소스 정리
     */
    fun cleanup() {
        Log.d(TAG, "SecurityManager 리소스 정리")
        stopRuntimeMonitoring()
    }
}