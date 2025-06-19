package com.jbsqr.safety.bridge

import android.content.Context
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.jbsqr.safety.modules.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * JavaScript Interface for Native ↔ Web Communication
 * Vue.js 웹앱에서 window.Android.methodName() 형태로 호출 가능
 */
class JavaScriptInterface(
    private val context: Context,
    private val authModule: AuthModule,
    private val qrScannerModule: QRScannerModule,
    private val storageModule: StorageModule,
    private val motionSensorModule: MotionSensorModule,
    private val notificationModule: NotificationModule
) {

    companion object {
        private const val TAG = "JavaScriptInterface"
    }

    private val gson = Gson()
    private val mainScope = CoroutineScope(Dispatchers.Main)

    // WebView는 setWebView 메서드를 통해 나중에 설정
    private var webView: WebView? = null

    /**
     * WebView 인스턴스 설정 (초기화 후 호출)
     */
    fun setWebView(webView: WebView) {
        this.webView = webView
        Log.d(TAG, "WebView 인스턴스 설정 완료")
    }

    // ================================
    // QR Scanner 관련 메서드
    // ================================

    /**
     * QR 코드 스캔 시작
     * JavaScript: window.Android.scanQR()
     */
    @JavascriptInterface
    fun scanQR() {
        Log.d(TAG, "QR 스캔 요청")

        mainScope.launch {
            try {
                qrScannerModule.startScan { result ->
                    // 스캔 결과를 JavaScript로 전달
                    val jsonResult = gson.toJson(mapOf(
                        "success" to true,
                        "data" to result,
                        "timestamp" to System.currentTimeMillis()
                    ))

                    callJavaScript("window.onQRScanned", jsonResult)
                }
            } catch (e: Exception) {
                Log.e(TAG, "QR 스캔 오류", e)
                val errorResult = gson.toJson(mapOf(
                    "success" to false,
                    "error" to e.message,
                    "timestamp" to System.currentTimeMillis()
                ))

                callJavaScript("window.onQRError", errorResult)
            }
        }
    }

    /**
     * QR 스캔 중지
     * JavaScript: window.Android.stopQRScan()
     */
    @JavascriptInterface
    fun stopQRScan() {
        Log.d(TAG, "QR 스캔 중지 요청")
        qrScannerModule.stopScan()
    }

    // ================================
    // Motion Sensor 관련 메서드
    // ================================

    /**
     * 기기 흔들림 감지 시작
     * JavaScript: window.Android.startMotionDetection()
     */
    @JavascriptInterface
    fun startMotionDetection() {
        Log.d(TAG, "모션 감지 시작")

        motionSensorModule.startMotionDetection { isShaking ->
            val motionData = gson.toJson(mapOf(
                "isShaking" to isShaking,
                "timestamp" to System.currentTimeMillis()
            ))

            if (isShaking) {
                callJavaScript("window.onMotionDetected", motionData)
            } else {
                callJavaScript("window.onMotionStopped", motionData)
            }
        }
    }

    /**
     * 기기 흔들림 감지 중지
     * JavaScript: window.Android.stopMotionDetection()
     */
    @JavascriptInterface
    fun stopMotionDetection() {
        Log.d(TAG, "모션 감지 중지")
        motionSensorModule.stopMotionDetection()
    }

    // ================================
    // 파일 저장 관련 메서드
    // ================================

    /**
     * 파일 다운로드
     * JavaScript: window.Android.downloadFile(url, filename)
     */
    @JavascriptInterface
    fun downloadFile(url: String, filename: String) {
        Log.d(TAG, "파일 다운로드 요청: $filename")

        mainScope.launch {
            try {
                storageModule.downloadFile(url, filename) { progress, filePath ->
                    val progressData = gson.toJson(mapOf(
                        "progress" to progress,
                        "filename" to filename,
                        "filePath" to filePath,
                        "timestamp" to System.currentTimeMillis()
                    ))

                    if (progress >= 100) {
                        callJavaScript("window.onDownloadComplete", progressData)
                    } else {
                        callJavaScript("window.onDownloadProgress", progressData)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "파일 다운로드 오류", e)
                val errorData = gson.toJson(mapOf(
                    "success" to false,
                    "error" to e.message,
                    "filename" to filename
                ))

                callJavaScript("window.onDownloadError", errorData)
            }
        }
    }

    /**
     * 수료증 PDF 생성 및 저장
     * JavaScript: window.Android.generateCertificate(data)
     */
    @JavascriptInterface
    fun generateCertificate(certificateData: String) {
        Log.d(TAG, "수료증 생성 요청")

        mainScope.launch {
            try {
                val data = gson.fromJson(certificateData, JsonObject::class.java)

                storageModule.generateCertificatePDF(data) { success, filePath ->
                    val result = gson.toJson(mapOf(
                        "success" to success,
                        "filePath" to filePath,
                        "certificateData" to data,
                        "timestamp" to System.currentTimeMillis()
                    ))

                    if (success) {
                        callJavaScript("window.onCertificateGenerated", result)
                    } else {
                        callJavaScript("window.onCertificateError", result)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "수료증 생성 오류", e)
                val errorResult = gson.toJson(mapOf(
                    "success" to false,
                    "error" to e.message
                ))

                callJavaScript("window.onCertificateError", errorResult)
            }
        }
    }

    // ================================
    // 인증 관련 메서드
    // ================================

    /**
     * 구글 소셜 로그인
     * JavaScript: window.Android.loginWithGoogle()
     */
    @JavascriptInterface
    fun loginWithGoogle() {
        Log.d(TAG, "구글 로그인 요청")

        mainScope.launch {
            authModule.signInWithGoogle { success, user ->
                val result = gson.toJson(mapOf(
                    "success" to success,
                    "user" to user,
                    "timestamp" to System.currentTimeMillis()
                ))

                if (success) {
                    callJavaScript("window.onLoginSuccess", result)
                } else {
                    callJavaScript("window.onLoginError", result)
                }
            }
        }
    }

    /**
     * 로그아웃
     * JavaScript: window.Android.logout()
     */
    @JavascriptInterface
    fun logout() {
        Log.d(TAG, "로그아웃 요청")

        authModule.signOut { success ->
            val result = gson.toJson(mapOf(
                "success" to success,
                "timestamp" to System.currentTimeMillis()
            ))

            callJavaScript("window.onLogoutComplete", result)
        }
    }

    /**
     * 현재 사용자 정보 가져오기
     * JavaScript: window.Android.getCurrentUser()
     */
    @JavascriptInterface
    fun getCurrentUser(): String {
        Log.d(TAG, "현재 사용자 정보 요청")

        val user = authModule.getCurrentUser()
        return gson.toJson(mapOf(
            "success" to (user != null),
            "user" to user,
            "timestamp" to System.currentTimeMillis()
        ))
    }

    // ================================
    // 알림 관련 메서드
    // ================================

    /**
     * 푸시 알림 표시
     * JavaScript: window.Android.showNotification(title, message)
     */
    @JavascriptInterface
    fun showNotification(title: String, message: String) {
        Log.d(TAG, "알림 표시 요청: $title")

        notificationModule.showNotification(title, message)
    }

    /**
     * FCM 토큰 가져오기
     * JavaScript: window.Android.getFCMToken()
     */
    @JavascriptInterface
    fun getFCMToken(): String {
        Log.d(TAG, "FCM 토큰 요청")

        var token: String? = null
        notificationModule.getFCMToken { fcmToken ->
            token = fcmToken
        }

        return gson.toJson(mapOf(
            "success" to (token != null),
            "token" to token,
            "timestamp" to System.currentTimeMillis()
        ))
    }

    // ================================
    // 시스템 정보 관련 메서드
    // ================================

    /**
     * 앱 버전 정보 가져오기
     * JavaScript: window.Android.getAppVersion()
     */
    @JavascriptInterface
    fun getAppVersion(): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            gson.toJson(mapOf(
                "versionName" to packageInfo.versionName,
                "versionCode" to packageInfo.versionCode,
                "packageName" to context.packageName
            ))
        } catch (e: Exception) {
            Log.e(TAG, "앱 버전 정보 조회 오류", e)
            gson.toJson(mapOf(
                "success" to false,
                "error" to e.message
            ))
        }
    }

    /**
     * 디바이스 정보 가져오기
     * JavaScript: window.Android.getDeviceInfo()
     */
    @JavascriptInterface
    fun getDeviceInfo(): String {
        return gson.toJson(mapOf(
            "manufacturer" to android.os.Build.MANUFACTURER,
            "model" to android.os.Build.MODEL,
            "version" to android.os.Build.VERSION.RELEASE,
            "sdk" to android.os.Build.VERSION.SDK_INT,
            "timestamp" to System.currentTimeMillis()
        ))
    }

    // ================================
    // 웹뷰 제어 관련 메서드
    // ================================

    /**
     * 웹뷰 새로고침
     * JavaScript: window.Android.refreshWebView()
     */
    @JavascriptInterface
    fun refreshWebView() {
        Log.d(TAG, "웹뷰 새로고침 요청")

        mainScope.launch {
            webView?.reload()
        }
    }

    /**
     * 뒤로가기
     * JavaScript: window.Android.goBack()
     */
    @JavascriptInterface
    fun goBack() {
        Log.d(TAG, "뒤로가기 요청")

        mainScope.launch {
            webView?.let { wv ->
                if (wv.canGoBack()) {
                    wv.goBack()
                }
            }
        }
    }

    /**
     * 특정 URL로 이동
     * JavaScript: window.Android.navigateToUrl(url)
     */
    @JavascriptInterface
    fun navigateToUrl(url: String) {
        Log.d(TAG, "URL 이동 요청: $url")

        mainScope.launch {
            webView?.loadUrl(url)
        }
    }

    // ================================
    // 유틸리티 메서드
    // ================================

    /**
     * JavaScript 함수 호출
     */
    private fun callJavaScript(functionName: String, data: String) {
        mainScope.launch {
            webView?.let { wv ->
                val script = "if (typeof $functionName === 'function') { $functionName($data); }"
                wv.evaluateJavascript(script) { result ->
                    Log.d(TAG, "JavaScript 호출 결과: $result")
                }
            } ?: Log.w(TAG, "WebView가 설정되지 않아 JavaScript 호출 실패")
        }
    }

    /**
     * 로그 출력 (JavaScript에서 호출)
     * JavaScript: window.Android.log(level, message)
     */
    @JavascriptInterface
    fun log(level: String, message: String) {
        when (level.lowercase()) {
            "debug", "d" -> Log.d("WebApp", message)
            "info", "i" -> Log.i("WebApp", message)
            "warn", "w" -> Log.w("WebApp", message)
            "error", "e" -> Log.e("WebApp", message)
            else -> Log.v("WebApp", message)
        }
    }

    /**
     * 리소스 정리
     */
    fun cleanup() {
        Log.d(TAG, "JavaScriptInterface 리소스 정리")
        webView = null
    }
}