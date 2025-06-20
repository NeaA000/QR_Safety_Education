// android/app/src/main/java/com/qrsafety/education/MainActivity.kt
package com.qrsafety.education

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.view.WindowManager
import android.webkit.WebView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.qrsafety.education.bridge.JavaScriptBridge
import com.qrsafety.education.modules.*
import com.qrsafety.education.security.SecurityManager
import com.qrsafety.education.utils.WebViewHelper
import kotlinx.coroutines.launch

/**
 * QR 안전교육 하이브리드 앱의 메인 액티비티
 *
 * 주요 기능:
 * - WebView 컨테이너 관리
 * - 네이티브 모듈 초기화
 * - 권한 관리
 * - 보안 검사
 * - Firebase 연동
 */
class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
        private const val WEB_APP_URL = "https://qrjbsafetyeducation.firebaseapp.com"
        private const val LOCAL_DEV_URL = "http://10.0.2.2:5173" // Android Emulator localhost

        // 권한 요청 코드
        private const val PERMISSION_REQUEST_CAMERA = 1001
        private const val PERMISSION_REQUEST_STORAGE = 1002
        private const val PERMISSION_REQUEST_NOTIFICATION = 1003

        // 필수 권한 목록
        private val REQUIRED_PERMISSIONS = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.READ_EXTERNAL_STORAGE
        )

        // Android 13+ 알림 권한
        private val NOTIFICATION_PERMISSIONS = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            emptyArray()
        }
    }

    // UI 컴포넌트
    private lateinit var webView: WebView

    // 네이티브 모듈들
    private lateinit var securityManager: SecurityManager
    private lateinit var authModule: AuthModule
    private lateinit var qrScannerModule: QRScannerModule
    private lateinit var storageModule: StorageModule
    private lateinit var motionSensorModule: MotionSensorModule
    private lateinit var notificationModule: NotificationModule
    private lateinit var jsBridge: JavaScriptBridge

    // Firebase 인스턴스
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var firestore: FirebaseFirestore

    // 권한 요청 런처들
    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            Log.d(TAG, "카메라 권한 승인됨")
            initializeQRScanner()
        } else {
            showPermissionDeniedDialog("카메라", "QR 코드 스캔 기능을 사용하려면 카메라 권한이 필요합니다.")
        }
    }

    private val storagePermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.values.all { it }
        if (allGranted) {
            Log.d(TAG, "저장소 권한 승인됨")
            initializeStorageModule()
        } else {
            showPermissionDeniedDialog("저장소", "수료증 다운로드 기능을 사용하려면 저장소 권한이 필요합니다.")
        }
    }

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            Log.d(TAG, "알림 권한 승인됨")
            initializeNotificationModule()
        } else {
            Log.w(TAG, "알림 권한 거부됨 - 선택적 기능이므로 계속 진행")
        }
    }

    // QR 스캔 결과 처리 런처
    private val qrScanLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val qrCode = result.data?.getStringExtra("qr_result")
            qrCode?.let {
                handleQRScanResult(it)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 🔐 보안 검사 (앱 시작 시 가장 먼저 실행)
        performSecurityChecks()

        // 🔧 UI 설정
        setupUI()

        // 🔥 Firebase 초기화
        initializeFirebase()

        // 🔧 네이티브 모듈 초기화
        initializeNativeModules()

        // 📱 WebView 설정
        setupWebView()

        // 🔑 권한 요청
        requestRequiredPermissions()

        // 🌐 웹앱 로드
        loadWebApp()

        Log.i(TAG, "MainActivity 초기화 완료")
    }

    /**
     * 🔐 보안 검사 수행
     */
    private fun performSecurityChecks() {
        securityManager = SecurityManager(this)

        lifecycleScope.launch {
            try {
                // 루팅 탐지
                if (securityManager.isDeviceRooted()) {
                    showSecurityAlert("보안 경고", "루팅된 기기에서는 앱을 실행할 수 없습니다.") {
                        finish()
                    }
                    return@launch
                }

                // 앱 무결성 검증
                if (!securityManager.verifyAppIntegrity()) {
                    showSecurityAlert("보안 경고", "앱 무결성 검증에 실패했습니다.") {
                        finish()
                    }
                    return@launch
                }

                // 디버깅 탐지 (릴리즈 빌드에서만)
                if (!BuildConfig.DEBUG && securityManager.isDebuggingEnabled()) {
                    Log.w(TAG, "디버깅이 감지되었습니다.")
                }

                Log.d(TAG, "보안 검사 통과")

            } catch (e: Exception) {
                Log.e(TAG, "보안 검사 중 오류 발생", e)
                showSecurityAlert("보안 오류", "보안 검사 중 문제가 발생했습니다.") {
                    finish()
                }
            }
        }
    }

    /**
     * 🔧 UI 기본 설정
     */
    private fun setupUI() {
        // 스플래시 스크린 연장 (웹앱 로딩 시간 확보)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            splashScreen.setKeepOnScreenCondition { false }
        }

        // 보안을 위한 스크린샷 방지 (프로덕션에서만)
        if (!BuildConfig.DEBUG) {
            window.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            )
        }

        // 레이아웃 설정
        setContentView(R.layout.activity_main)

        // 전체 화면 설정 (상태바 유지)
        window.statusBarColor = ContextCompat.getColor(this, R.color.primary_color)
    }

    /**
     * 🔥 Firebase 초기화
     */
    private fun initializeFirebase() {
        try {
            FirebaseApp.initializeApp(this)
            firebaseAuth = FirebaseAuth.getInstance()
            firestore = FirebaseFirestore.getInstance()

            // Firestore 설정 최적화
            val settings = com.google.firebase.firestore.FirebaseFirestoreSettings.Builder()
                .setPersistenceEnabled(true) // 오프라인 지원
                .setCacheSizeBytes(100 * 1024 * 1024) // 100MB 캐시
                .build()
            firestore.firestoreSettings = settings

            Log.d(TAG, "Firebase 초기화 완료")

        } catch (e: Exception) {
            Log.e(TAG, "Firebase 초기화 실패", e)
            showAlert("초기화 오류", "Firebase 연결에 실패했습니다. 네트워크를 확인해주세요.") {
                finish()
            }
        }
    }

    /**
     * 🔧 네이티브 모듈들 초기화
     */
    private fun initializeNativeModules() {
        try {
            // Auth 모듈 초기화
            authModule = AuthModule(this, firebaseAuth, firestore)

            // Storage 모듈 초기화 (권한 확인 후 실제 초기화)
            storageModule = StorageModule(this)

            // Motion Sensor 모듈 초기화
            motionSensorModule = MotionSensorModule(this)

            // QR Scanner 모듈 초기화 (권한 확인 후 실제 초기화)
            qrScannerModule = QRScannerModule(this)

            // Notification 모듈 초기화 (권한 확인 후 실제 초기화)
            notificationModule = NotificationModule(this)

            Log.d(TAG, "네이티브 모듈 초기화 완료")

        } catch (e: Exception) {
            Log.e(TAG, "네이티브 모듈 초기화 실패", e)
            showAlert("초기화 오류", "앱 모듈 초기화에 실패했습니다.") {
                finish()
            }
        }
    }

    /**
     * 📱 WebView 설정
     */
    private fun setupWebView() {
        webView = findViewById(R.id.webview)

        // WebView 보안 및 성능 설정
        WebViewHelper.configureSecureWebView(webView, this)

        // JavaScript Bridge 설정
        jsBridge = JavaScriptBridge(
            context = this,
            authModule = authModule,
            qrScannerModule = qrScannerModule,
            storageModule = storageModule,
            motionSensorModule = motionSensorModule,
            notificationModule = notificationModule
        )

        webView.addJavascriptInterface(jsBridge, "NativeBridge")

        // WebView 클라이언트 설정 (URL 검증, SSL 처리 등)
        webView.webViewClient = WebViewHelper.createSecureWebViewClient(this)
        webView.webChromeClient = WebViewHelper.createWebChromeClient(this)

        Log.d(TAG, "WebView 설정 완료")
    }

    /**
     * 🔑 필수 권한 요청
     */
    private fun requestRequiredPermissions() {
        val missingPermissions = REQUIRED_PERMISSIONS.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        when {
            missingPermissions.isEmpty() -> {
                Log.d(TAG, "모든 필수 권한이 이미 승인됨")
                initializePermissionDependentModules()
            }
            missingPermissions.contains(Manifest.permission.CAMERA) -> {
                showPermissionRationale(
                    "카메라 권한 필요",
                    "QR 코드 스캔 기능을 위해 카메라 권한이 필요합니다."
                ) {
                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                }
            }
            missingPermissions.any { it.contains("STORAGE") } -> {
                showPermissionRationale(
                    "저장소 권한 필요",
                    "수료증 다운로드를 위해 저장소 권한이 필요합니다."
                ) {
                    storagePermissionLauncher.launch(arrayOf(
                        Manifest.permission.WRITE_EXTERNAL_STORAGE,
                        Manifest.permission.READ_EXTERNAL_STORAGE
                    ))
                }
            }
        }

        // 알림 권한은 선택적으로 요청 (Android 13+)
        if (NOTIFICATION_PERMISSIONS.isNotEmpty()) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                // 나중에 요청하거나 사용자가 설정에서 직접 활성화하도록 안내
                Log.d(TAG, "알림 권한 미승인 - 나중에 요청 예정")
            }
        }
    }

    /**
     * 권한 의존적 모듈들 초기화
     */
    private fun initializePermissionDependentModules() {
        // 카메라 권한이 있으면 QR 스캐너 활성화
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED) {
            initializeQRScanner()
        }

        // 저장소 권한이 있으면 스토리지 모듈 활성화
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
            == PackageManager.PERMISSION_GRANTED) {
            initializeStorageModule()
        }

        // 알림 권한이 있으면 알림 모듈 활성화
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            == PackageManager.PERMISSION_GRANTED) {
            initializeNotificationModule()
        }
    }

    private fun initializeQRScanner() {
        qrScannerModule.initialize()
        Log.d(TAG, "QR 스캐너 모듈 활성화됨")
    }

    private fun initializeStorageModule() {
        storageModule.initialize()
        Log.d(TAG, "저장소 모듈 활성화됨")
    }

    private fun initializeNotificationModule() {
        notificationModule.initialize()
        Log.d(TAG, "알림 모듈 활성화됨")
    }

    /**
     * 🌐 웹앱 로드
     */
    private fun loadWebApp() {
        val url = if (BuildConfig.DEBUG) {
            LOCAL_DEV_URL // 개발 환경에서는 로컬 서버
        } else {
            WEB_APP_URL // 프로덕션에서는 Firebase Hosting
        }

        Log.d(TAG, "웹앱 로드 시작: $url")
        webView.loadUrl(url)
    }

    /**
     * QR 스캔 결과 처리
     */
    private fun handleQRScanResult(qrCode: String) {
        Log.d(TAG, "QR 스캔 결과: $qrCode")

        // WebView로 결과 전달
        val jsCode = "window.handleQRScanResult && window.handleQRScanResult('$qrCode')"
        webView.evaluateJavascript(jsCode) { result ->
            Log.d(TAG, "QR 결과 웹앱 전달 완료: $result")
        }
    }

    /**
     * 권한 설명 다이얼로그 표시
     */
    private fun showPermissionRationale(title: String, message: String, onPositive: () -> Unit) {
        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("권한 허용") { _, _ -> onPositive() }
            .setNegativeButton("나중에") { dialog, _ -> dialog.dismiss() }
            .setCancelable(false)
            .show()
    }

    /**
     * 권한 거부 다이얼로그 표시
     */
    private fun showPermissionDeniedDialog(permission: String, message: String) {
        AlertDialog.Builder(this)
            .setTitle("권한 필요")
            .setMessage("$message\n\n설정에서 직접 권한을 허용할 수 있습니다.")
            .setPositiveButton("설정으로 이동") { _, _ ->
                openAppSettings()
            }
            .setNegativeButton("나중에") { dialog, _ -> dialog.dismiss() }
            .show()
    }

    /**
     * 보안 경고 다이얼로그 표시
     */
    private fun showSecurityAlert(title: String, message: String, onDismiss: () -> Unit) {
        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("확인") { _, _ -> onDismiss() }
            .setCancelable(false)
            .show()
    }

    /**
     * 일반 경고 다이얼로그 표시
     */
    private fun showAlert(title: String, message: String, onDismiss: (() -> Unit)? = null) {
        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("확인") { _, _ -> onDismiss?.invoke() }
            .show()
    }

    /**
     * 앱 설정 화면 열기
     */
    private fun openAppSettings() {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", packageName, null)
        }
        startActivity(intent)
    }

    // ==================== 생명주기 관리 ====================

    override fun onResume() {
        super.onResume()
        webView.onResume()
        motionSensorModule.resume()

        // 권한 상태 재확인
        requestRequiredPermissions()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
        motionSensorModule.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        webView.destroy()
        motionSensorModule.cleanup()
        notificationModule.cleanup()
    }

    // ==================== 백버튼 처리 ====================

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            // 앱 종료 확인 다이얼로그
            AlertDialog.Builder(this)
                .setTitle("앱 종료")
                .setMessage("앱을 종료하시겠습니까?")
                .setPositiveButton("종료") { _, _ ->
                    super.onBackPressed()
                }
                .setNegativeButton("취소") { dialog, _ ->
                    dialog.dismiss()
                }
                .show()
        }
    }

    // ==================== 인텐트 처리 (딥링크) ====================

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)

        // 딥링크 처리
        intent?.data?.let { uri ->
            handleDeepLink(uri)
        }
    }

    /**
     * 딥링크 처리
     */
    private fun handleDeepLink(uri: Uri) {
        Log.d(TAG, "딥링크 처리: $uri")

        when (uri.scheme) {
            "qrsafety" -> {
                // qrsafety://lecture/{id} 형태의 딥링크 처리
                val path = uri.path
                val jsCode = "window.handleDeepLink && window.handleDeepLink('$uri')"
                webView.evaluateJavascript(jsCode) { result ->
                    Log.d(TAG, "딥링크 웹앱 전달 완료: $result")
                }
            }
            "https", "http" -> {
                // 웹 링크는 WebView에서 직접 로드
                if (uri.host?.contains("qrjbsafetyeducation") == true) {
                    webView.loadUrl(uri.toString())
                }
            }
        }
    }
}