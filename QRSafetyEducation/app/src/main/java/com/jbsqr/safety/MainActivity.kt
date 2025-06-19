package com.jbsqr.safety

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.jbsqr.safety.security.SecurityManager
import com.jbsqr.safety.security.RootDetection

/**
 * QR 안전교육 앱 메인 액티비티
 * 보안 검증 후 WebView로 이동하는 진입점
 */
class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
    }

    private lateinit var securityManager: SecurityManager
    private lateinit var rootDetection: RootDetection

    override fun onCreate(savedInstanceState: Bundle?) {
        // 1. 스플래시 스크린 설정 (Android 12+)
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)

        // 2. 보안 모듈 초기화
        initializeSecurity()

        // 3. 보안 검증 수행
        if (performSecurityChecks()) {
            // 4. WebView 액티비티로 이동
            startWebViewActivity()
        } else {
            // 5. 보안 위험 감지 시 앱 종료
            handleSecurityViolation()
        }
    }

    /**
     * 보안 모듈 초기화
     */
    private fun initializeSecurity() {
        securityManager = SecurityManager(this)
        rootDetection = RootDetection(this)
    }

    /**
     * 종합적인 보안 검증 수행
     * @return 보안 검증 통과 여부
     */
    private fun performSecurityChecks(): Boolean {
        Log.d(TAG, "보안 검증 시작...")

        // 1. 앱 무결성 검증
        if (!securityManager.verifyAppIntegrity()) {
            Log.w(TAG, "앱 무결성 검증 실패")
            return false
        }

        // 2. 루팅/탈옥 탐지
        if (rootDetection.isDeviceRooted()) {
            Log.w(TAG, "루팅된 디바이스 감지")
            return false
        }

        // 3. 디버깅 탐지 (프로덕션 빌드에서만)
        if (!BuildConfig.DEBUG && securityManager.isDebuggingDetected()) {
            Log.w(TAG, "디버깅 감지")
            return false
        }

        // 4. 에뮬레이터 탐지 (선택적)
        if (securityManager.isEmulator()) {
            Log.i(TAG, "에뮬레이터에서 실행 중")
            // 개발 환경에서는 허용, 프로덕션에서는 제한 가능
        }

        Log.d(TAG, "모든 보안 검증 통과")
        return true
    }

    /**
     * WebView 액티비티 시작
     */
    private fun startWebViewActivity() {
        val intent = Intent(this, WebViewActivity::class.java)

        // 딥링크 데이터가 있는 경우 전달
        if (intent.data != null) {
            intent.data = getIntent().data
        }

        // QR 코드 스캔으로 진입한 경우 추가 정보 전달
        val lectureId = getIntent().getStringExtra("lecture_id")
        val action = getIntent().getStringExtra("action")

        if (lectureId != null) {
            intent.putExtra("lecture_id", lectureId)
            intent.putExtra("action", action ?: "view")
            Log.d(TAG, "딥링크 데이터 전달: lecture_id=$lectureId, action=$action")
        }

        startActivity(intent)
        finish() // MainActivity 종료 (뒤로가기 방지)
    }

    /**
     * 보안 위반 시 처리
     */
    private fun handleSecurityViolation() {
        Log.e(TAG, "보안 위험으로 인한 앱 종료")

        // 사용자에게 안내 메시지 표시 (선택적)
        // AlertDialog.Builder(this)
        //     .setTitle("보안 알림")
        //     .setMessage("안전한 환경에서 앱을 사용해주세요.")
        //     .setPositiveButton("확인") { _, _ -> finish() }
        //     .setCancelable(false)
        //     .show()

        // 즉시 종료 (보안 강화)
        finish()
        finishAffinity()
    }

    /**
     * 앱이 포그라운드로 돌아올 때 보안 재검증
     */
    override fun onResume() {
        super.onResume()

        // 런타임 보안 모니터링 시작
        if (::securityManager.isInitialized) {
            securityManager.startRuntimeMonitoring()
        }
    }

    /**
     * 앱이 백그라운드로 갈 때
     */
    override fun onPause() {
        super.onPause()

        // 런타임 보안 모니터링 일시 중지
        if (::securityManager.isInitialized) {
            securityManager.stopRuntimeMonitoring()
        }
    }

    /**
     * 액티비티 종료 시 리소스 정리
     */
    override fun onDestroy() {
        super.onDestroy()

        // 보안 관련 리소스 정리
        if (::securityManager.isInitialized) {
            securityManager.cleanup()
        }

        Log.d(TAG, "MainActivity 리소스 정리 완료")
    }
}