package com.jbsqr.safety

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import com.jbsqr.safety.databinding.ActivityWebviewBinding

/**
 * WebView 디버깅 강화 버전
 * 문제점을 정확히 파악하기 위한 상세 로깅 추가
 */
class WebViewActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "WebViewActivity"
        // 테스트용 URL들 (우선순위 순)
        private val TEST_URLS = arrayOf(
            "https://jb-safety-education.web.app",  // 원본 URL
            "https://www.google.com",               // 네트워크 테스트
            "file:///android_asset/web/index.html", // 로컬 파일 테스트
            "about:blank"                           // 최소 테스트
        )
    }

    private lateinit var binding: ActivityWebviewBinding
    private var currentTestUrlIndex = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            Log.d(TAG, "=== WebViewActivity 시작 ===")

            // View Binding 설정
            binding = ActivityWebviewBinding.inflate(layoutInflater)
            setContentView(binding.root)

            // 단계별 테스트 시작
            testStep1_BasicSetup()

        } catch (e: Exception) {
            Log.e(TAG, "❌ onCreate 실패", e)
            showError("앱 초기화 실패: ${e.message}")
        }
    }

    /**
     * 1단계: 기본 설정 테스트
     */
    private fun testStep1_BasicSetup() {
        Log.d(TAG, "📱 1단계: 기본 설정 테스트")

        try {
            // WebView 기본 상태 확인
            val webView = binding.webview
            Log.d(TAG, "✅ WebView 인스턴스 생성 성공")

            // 기본 WebView 설정
            setupBasicWebView(webView)

            // 다음 단계로
            testStep2_NetworkCheck()

        } catch (e: Exception) {
            Log.e(TAG, "❌ 1단계 실패", e)
            showError("WebView 설정 실패: ${e.message}")
        }
    }

    /**
     * 2단계: 네트워크 상태 확인
     */
    private fun testStep2_NetworkCheck() {
        Log.d(TAG, "🌐 2단계: 네트워크 상태 확인")

        try {
            val connectivityManager = getSystemService(CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
            val networkInfo = connectivityManager.activeNetworkInfo
            val isConnected = networkInfo?.isConnected == true

            Log.d(TAG, "네트워크 연결 상태: $isConnected")
            Log.d(TAG, "네트워크 타입: ${networkInfo?.typeName}")

            if (isConnected) {
                Log.d(TAG, "✅ 네트워크 연결됨")
                testStep3_LoadWebPage()
            } else {
                Log.w(TAG, "❌ 네트워크 연결 없음")
                showError("인터넷 연결을 확인해주세요")
                setupRetryButton()
            }

        } catch (e: Exception) {
            Log.e(TAG, "❌ 2단계 실패", e)
            testStep3_LoadWebPage() // 네트워크 확인 실패해도 진행
        }
    }

    /**
     * 3단계: 웹페이지 로드 테스트
     */
    private fun testStep3_LoadWebPage() {
        Log.d(TAG, "🌍 3단계: 웹페이지 로드 테스트")

        val testUrl = TEST_URLS[currentTestUrlIndex]
        Log.d(TAG, "테스트 URL [$currentTestUrlIndex]: $testUrl")

        showLoading(true, "URL 로딩 중: $testUrl")

        try {
            binding.webview.loadUrl(testUrl)
        } catch (e: Exception) {
            Log.e(TAG, "❌ URL 로드 실패: $testUrl", e)
            tryNextUrl()
        }
    }

    /**
     * 기본 WebView 설정
     */
    private fun setupBasicWebView(webView: WebView) {
        Log.d(TAG, "⚙️ WebView 기본 설정")

        val settings = webView.settings

        // 기본 설정
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true

        // 디버깅을 위한 설정
        settings.cacheMode = android.webkit.WebSettings.LOAD_NO_CACHE
        settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

        // 사용자 에이전트 확인
        Log.d(TAG, "User Agent: ${settings.userAgentString}")

        // WebViewClient 설정 (상세 로깅)
        webView.webViewClient = object : android.webkit.WebViewClient() {

            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                Log.d(TAG, "🔄 페이지 로딩 시작: $url")
                showLoading(true, "페이지 로딩 중...")
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d(TAG, "✅ 페이지 로딩 완료: $url")
                showLoading(false)
                hideError()

                // 성공 시 다음 테스트 실행
                testStep4_JavaScriptTest()
            }

            override fun onReceivedError(
                view: WebView?,
                request: android.webkit.WebResourceRequest?,
                error: android.webkit.WebResourceError?
            ) {
                super.onReceivedError(view, request, error)

                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    Log.e(TAG, "❌ WebView 오류: ${error?.description} (코드: ${error?.errorCode})")
                    Log.e(TAG, "❌ 실패 URL: ${request?.url}")
                }

                // 다음 URL 시도
                tryNextUrl()
            }

            override fun onReceivedHttpError(
                view: WebView?,
                request: android.webkit.WebResourceRequest?,
                errorResponse: android.webkit.WebResourceResponse?
            ) {
                super.onReceivedHttpError(view, request, errorResponse)

                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                    Log.e(TAG, "❌ HTTP 오류: ${errorResponse?.statusCode}")
                    Log.e(TAG, "❌ 실패 URL: ${request?.url}")
                }
            }
        }

        // WebChromeClient 설정 (콘솔 로그 확인)
        webView.webChromeClient = object : android.webkit.WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: android.webkit.ConsoleMessage?): Boolean {
                consoleMessage?.let { msg ->
                    Log.d(TAG, "🌐 Web Console [${msg.messageLevel()}]: ${msg.message()}")
                }
                return true
            }

            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                Log.v(TAG, "📊 로딩 진행률: $newProgress%")
            }
        }
    }

    /**
     * 4단계: JavaScript 테스트
     */
    private fun testStep4_JavaScriptTest() {
        Log.d(TAG, "🔧 4단계: JavaScript 테스트")

        try {
            val testScript = """
                console.log('JavaScript 실행 테스트');
                document.body.style.backgroundColor = 'lightgreen';
                'JavaScript 테스트 성공';
            """.trimIndent()

            binding.webview.evaluateJavascript(testScript) { result ->
                Log.d(TAG, "✅ JavaScript 테스트 결과: $result")
                showSuccess("WebView 테스트 완료!")
            }

        } catch (e: Exception) {
            Log.e(TAG, "❌ JavaScript 테스트 실패", e)
        }
    }

    /**
     * 다음 URL 시도
     */
    private fun tryNextUrl() {
        currentTestUrlIndex++

        if (currentTestUrlIndex < TEST_URLS.size) {
            Log.d(TAG, "🔄 다음 URL 시도 ($currentTestUrlIndex/${TEST_URLS.size})")
            testStep3_LoadWebPage()
        } else {
            Log.e(TAG, "❌ 모든 URL 테스트 실패")
            showError("모든 URL 로드에 실패했습니다.\n네트워크 연결을 확인해주세요.")
            setupRetryButton()
        }
    }

    /**
     * 로딩 표시/숨김
     */
    private fun showLoading(show: Boolean, message: String = "로딩 중...") {
        binding.loadingOverlay.visibility = if (show) View.VISIBLE else View.GONE
        if (show) {
            binding.loadingMessage.text = message
            Log.d(TAG, "🔄 $message")
        }
    }

    /**
     * 오류 화면 표시
     */
    private fun showError(message: String) {
        binding.errorLayout.visibility = View.VISIBLE
        binding.errorMessage.text = message
        showLoading(false)
        Log.e(TAG, "❌ 오류 표시: $message")
    }

    /**
     * 오류 화면 숨김
     */
    private fun hideError() {
        binding.errorLayout.visibility = View.GONE
    }

    /**
     * 성공 메시지 표시
     */
    private fun showSuccess(message: String) {
        Log.d(TAG, "✅ $message")

        // 간단한 토스트 메시지
        android.widget.Toast.makeText(this, message, android.widget.Toast.LENGTH_LONG).show()
    }

    /**
     * 재시도 버튼 설정
     */
    private fun setupRetryButton() {
        binding.retryButton.setOnClickListener {
            Log.d(TAG, "🔄 재시도 시작")
            currentTestUrlIndex = 0 // 처음부터 다시
            hideError()
            testStep2_NetworkCheck()
        }
    }

    /**
     * 뒤로가기 처리
     */
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && binding.webview.canGoBack()) {
            binding.webview.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    /**
     * 액티비티 소멸
     */
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "🔚 WebViewActivity 종료")

        try {
            binding.webview.destroy()
        } catch (e: Exception) {
            Log.e(TAG, "WebView destroy 오류", e)
        }
    }
}