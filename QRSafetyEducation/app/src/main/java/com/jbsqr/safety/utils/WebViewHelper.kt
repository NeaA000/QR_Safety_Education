package com.jbsqr.safety.utils

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.net.http.SslError
import android.os.Build
import android.util.Log
import android.webkit.*
import com.jbsqr.safety.BuildConfig

/**
 * WebView 보안 설정 및 관리 헬퍼
 * 구글 플레이스토어 정책 준수를 위한 안전한 WebView 구성
 */
object WebViewHelper {

    private const val TAG = "WebViewHelper"

    /**
     * 보안이 강화된 WebView 설정
     * @param webView 설정할 WebView 인스턴스
     * @param context Context
     */
    @SuppressLint("SetJavaScriptEnabled")
    fun setupSecureWebView(webView: WebView, context: Context) {
        try {
            Log.d(TAG, "보안 WebView 설정 시작")

            val settings = webView.settings

            // === 기본 설정 ===
            settings.javaScriptEnabled = true // Vue.js 앱 실행을 위해 필요
            settings.domStorageEnabled = true // 로컬 스토리지 허용

            // === 보안 설정 ===
            settings.allowFileAccess = false // 파일 시스템 접근 차단
            settings.allowContentAccess = false // 콘텐츠 프로바이더 접근 차단
            settings.allowFileAccessFromFileURLs = false // file:// URL에서 파일 접근 차단
            settings.allowUniversalAccessFromFileURLs = false // file:// URL에서 모든 접근 차단

            // === 네트워크 보안 ===
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW // Mixed Content 차단
            }

            // === 캐시 및 저장소 설정 ===
            settings.cacheMode = WebSettings.LOAD_DEFAULT // 적절한 캐싱
            settings.databaseEnabled = false // 웹 데이터베이스 비활성화
            settings.saveFormData = false // 폼 데이터 저장 비활성화
            settings.savePassword = false // 비밀번호 저장 비활성화

            // === 디스플레이 설정 ===
            settings.setSupportZoom(true) // 확대/축소 허용
            settings.builtInZoomControls = true // 확대/축소 컨트롤
            settings.displayZoomControls = false // 확대/축소 버튼 숨김
            settings.useWideViewPort = true // 뷰포트 메타태그 지원
            settings.loadWithOverviewMode = true // 화면 크기에 맞춤

            // === 폰트 및 텍스트 설정 ===
            settings.textZoom = 100 // 기본 텍스트 크기
            settings.minimumFontSize = 12 // 최소 폰트 크기

            // === 사용자 에이전트 설정 ===
            val customUserAgent = "${settings.userAgentString} JBSafetyApp/${BuildConfig.VERSION_NAME}"
            settings.userAgentString = customUserAgent

            // === 디버깅 설정 ===
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
            }

            // === 쿠키 설정 ===
            setupCookieManager(webView)

            // === WebViewClient 설정 ===
            webView.webViewClient = createSecureWebViewClient()

            // === WebChromeClient 설정 ===
            webView.webChromeClient = createWebChromeClient()

            Log.d(TAG, "보안 WebView 설정 완료")

        } catch (e: Exception) {
            Log.e(TAG, "WebView 설정 중 오류", e)
        }
    }

    /**
     * 쿠키 매니저 설정
     */
    private fun setupCookieManager(webView: WebView) {
        try {
            val cookieManager = CookieManager.getInstance()
            cookieManager.setAcceptCookie(true) // 쿠키 허용

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                cookieManager.setAcceptThirdPartyCookies(webView, false) // 3rd party 쿠키 차단
            }

            Log.d(TAG, "쿠키 매니저 설정 완료")
        } catch (e: Exception) {
            Log.e(TAG, "쿠키 매니저 설정 오류", e)
        }
    }

    /**
     * 보안이 강화된 WebViewClient 생성
     */
    private fun createSecureWebViewClient(): WebViewClient {
        return object : WebViewClient() {

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    val url = request?.url?.toString() ?: ""
                    handleUrlLoading(view, url)
                } else {
                    false
                }
            }

            @Deprecated("Deprecated in API level 24")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                return handleUrlLoading(view, url ?: "")
            }

            /**
             * URL 로딩 보안 검증
             */
            private fun handleUrlLoading(view: WebView?, url: String): Boolean {
                return try {
                    // 허용된 도메인 목록
                    val allowedDomains = listOf(
                        "jb-safety-education.firebaseapp.com",
                        "jb-safety-education.web.app",
                        "firebase.google.com",
                        "googleapis.com",
                        "gstatic.com"
                    )

                    // URL 보안 검증
                    if (!isUrlAllowed(url, allowedDomains)) {
                        Log.w(TAG, "차단된 URL 접근 시도: $url")
                        return true // 로딩 차단
                    }

                    // HTTPS 강제
                    if (!url.startsWith("https://") && !url.startsWith("about:") && !BuildConfig.DEBUG) {
                        Log.w(TAG, "HTTPS가 아닌 URL 차단: $url")
                        return true // 로딩 차단
                    }

                    Log.d(TAG, "허용된 URL 로딩: $url")
                    false // 로딩 허용
                } catch (e: Exception) {
                    Log.e(TAG, "URL 로딩 검증 오류", e)
                    true // 오류 시 차단
                }
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                Log.d(TAG, "페이지 로딩 시작: $url")
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d(TAG, "페이지 로딩 완료: $url")
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Log.e(TAG, "WebView 오류: ${error?.description} (${error?.errorCode})")
                }
            }

            override fun onReceivedHttpError(view: WebView?, request: WebResourceRequest?, errorResponse: WebResourceResponse?) {
                super.onReceivedHttpError(view, request, errorResponse)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    Log.e(TAG, "HTTP 오류: ${errorResponse?.statusCode} - ${request?.url}")
                }
            }

            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                // SSL 오류 발생 시 연결 차단 (보안상 중요)
                Log.e(TAG, "SSL 오류 발생: ${error?.toString()}")
                handler?.cancel() // 연결 취소

                // 사용자에게 오류 알림 (선택사항)
                view?.context?.let { context ->
                    showSSLErrorDialog(context, error)
                }
            }
        }
    }

    /**
     * WebChromeClient 생성
     */
    private fun createWebChromeClient(): WebChromeClient {
        return object : WebChromeClient() {

            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                Log.d(TAG, "페이지 로딩 진행률: $newProgress%")
            }

            override fun onReceivedTitle(view: WebView?, title: String?) {
                super.onReceivedTitle(view, title)
                Log.d(TAG, "페이지 제목: $title")
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.let { msg ->
                    val logLevel = when (msg.messageLevel()) {
                        ConsoleMessage.MessageLevel.DEBUG -> Log.DEBUG
                        ConsoleMessage.MessageLevel.ERROR -> Log.ERROR
                        ConsoleMessage.MessageLevel.LOG -> Log.INFO
                        ConsoleMessage.MessageLevel.TIP -> Log.INFO
                        ConsoleMessage.MessageLevel.WARNING -> Log.WARN
                        else -> Log.INFO
                    }

                    Log.println(logLevel, "WebConsole",
                        "${msg.message()} -- From line ${msg.lineNumber()} of ${msg.sourceId()}")
                }
                return true
            }

            override fun onJsAlert(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
                Log.d(TAG, "JavaScript Alert: $message")
                return super.onJsAlert(view, url, message, result)
            }

            override fun onJsConfirm(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
                Log.d(TAG, "JavaScript Confirm: $message")
                return super.onJsConfirm(view, url, message, result)
            }
        }
    }

    /**
     * URL 허용 여부 검증
     */
    private fun isUrlAllowed(url: String, allowedDomains: List<String>): Boolean {
        return try {
            // about: 스키마는 항상 허용
            if (url.startsWith("about:")) return true

            // 허용된 도메인 확인
            for (domain in allowedDomains) {
                if (url.contains(domain, ignoreCase = true)) {
                    return true
                }
            }

            false
        } catch (e: Exception) {
            Log.e(TAG, "URL 검증 오류", e)
            false
        }
    }

    /**
     * SSL 오류 다이얼로그 표시
     */
    private fun showSSLErrorDialog(context: Context, error: SslError?) {
        try {
            android.app.AlertDialog.Builder(context)
                .setTitle("보안 연결 오류")
                .setMessage("안전하지 않은 연결이 감지되었습니다.\n보안을 위해 연결을 차단합니다.")
                .setPositiveButton("확인") { dialog, _ -> dialog.dismiss() }
                .show()
        } catch (e: Exception) {
            Log.e(TAG, "SSL 오류 다이얼로그 표시 실패", e)
        }
    }

    /**
     * WebView 메모리 정리
     */
    fun clearWebViewData(webView: WebView) {
        try {
            Log.d(TAG, "WebView 데이터 정리 시작")

            // 캐시 정리
            webView.clearCache(true)

            // 폼 데이터 정리
            webView.clearFormData()

            // 히스토리 정리
            webView.clearHistory()

            // SSL 캐시 정리
            webView.clearSslPreferences()

            // 쿠키 정리 (선택적)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                CookieManager.getInstance().removeAllCookies(null)
            } else {
                @Suppress("DEPRECATION")
                CookieManager.getInstance().removeAllCookie()
            }

            Log.d(TAG, "WebView 데이터 정리 완료")
        } catch (e: Exception) {
            Log.e(TAG, "WebView 데이터 정리 오류", e)
        }
    }

    /**
     * WebView 소멸자
     */
    fun destroyWebView(webView: WebView?) {
        try {
            webView?.let { wv ->
                Log.d(TAG, "WebView 소멸 시작")

                // 로딩 중지
                wv.stopLoading()

                // 리스너 제거 (null 안전성 개선)
                wv.webViewClient = object : WebViewClient() {
                    // 기본 WebViewClient로 교체
                }
                wv.webChromeClient = object : WebChromeClient() {
                    // 기본 WebChromeClient로 교체
                }

                // 데이터 정리
                clearWebViewData(wv)

                // WebView 소멸
                wv.destroy()

                Log.d(TAG, "WebView 소멸 완료")
            }
        } catch (e: Exception) {
            Log.e(TAG, "WebView 소멸 오류", e)
        }
    }

    /**
     * JavaScript 실행 (안전한 방식)
     */
    fun executeJavaScript(webView: WebView, script: String, callback: ValueCallback<String>? = null) {
        try {
            Log.d(TAG, "JavaScript 실행: $script")

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                webView.evaluateJavascript(script, callback)
            } else {
                @Suppress("DEPRECATION")
                webView.loadUrl("javascript:$script")
            }
        } catch (e: Exception) {
            Log.e(TAG, "JavaScript 실행 오류", e)
        }
    }

    /**
     * 웹페이지 새로고침
     */
    fun refreshWebView(webView: WebView) {
        try {
            Log.d(TAG, "WebView 새로고침")
            webView.reload()
        } catch (e: Exception) {
            Log.e(TAG, "WebView 새로고침 오류", e)
        }
    }

    /**
     * 뒤로가기 처리
     */
    fun handleBackPressed(webView: WebView): Boolean {
        return try {
            if (webView.canGoBack()) {
                webView.goBack()
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "뒤로가기 처리 오류", e)
            false
        }
    }
}