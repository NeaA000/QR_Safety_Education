package com.jbsqr.safety

import android.app.Application
import android.content.Context
import android.content.res.Configuration
import android.util.Log
import androidx.appcompat.app.AppCompatDelegate
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import com.google.firebase.FirebaseApp
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreSettings
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.remoteconfig.FirebaseRemoteConfig
import com.google.firebase.remoteconfig.FirebaseRemoteConfigSettings
import com.jbsqr.safety.security.SecurityManager
import com.jbsqr.safety.utils.NetworkUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * QR 안전교육 앱의 Application 클래스
 * 앱 전체의 초기화 및 전역 설정을 담당
 */
class QRSafetyEducationApplication : Application(), DefaultLifecycleObserver {

    companion object {
        private const val TAG = "QRSafetyApp"

        // 싱글톤 인스턴스
        @Volatile
        private var INSTANCE: QRSafetyEducationApplication? = null

        /**
         * Application 인스턴스 가져오기
         */
        fun getInstance(): QRSafetyEducationApplication {
            return INSTANCE ?: throw IllegalStateException("Application이 초기화되지 않았습니다.")
        }

        /**
         * Context를 통한 Application 인스턴스 가져오기
         */
        fun getInstance(context: Context): QRSafetyEducationApplication {
            return context.applicationContext as QRSafetyEducationApplication
        }
    }

    // 전역 코루틴 스코프
    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    // 보안 관리자
    private lateinit var securityManager: SecurityManager

    // 네트워크 유틸리티
    private lateinit var networkUtils: NetworkUtils

    // Firebase 컴포넌트들
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var firebaseFirestore: FirebaseFirestore
    private lateinit var firebaseMessaging: FirebaseMessaging
    private lateinit var firebaseRemoteConfig: FirebaseRemoteConfig
    private lateinit var firebaseCrashlytics: FirebaseCrashlytics
    private var firebaseAnalytics: FirebaseAnalytics? = null

    // 앱 상태
    private var isAppInForeground = false
    private var appStartTime = 0L

    override fun onCreate() {
        super<Application>.onCreate()

        try {
            // 싱글톤 인스턴스 설정
            INSTANCE = this

            // 앱 시작 시간 기록
            appStartTime = System.currentTimeMillis()

            Log.d(TAG, "QRSafetyEducationApplication 초기화 시작")

            // 생명주기 관찰자 등록
            ProcessLifecycleOwner.get().lifecycle.addObserver(this)

            // 기본 설정 초기화
            initializeBasicSettings()

            // Firebase 초기화
            initializeFirebase()

            // 보안 시스템 초기화
            initializeSecurity()

            // 네트워크 유틸리티 초기화
            initializeNetworkUtils()

            // 백그라운드 작업 시작
            startBackgroundTasks()

            Log.d(TAG, "QRSafetyEducationApplication 초기화 완료 (${System.currentTimeMillis() - appStartTime}ms)")

        } catch (e: Exception) {
            Log.e(TAG, "Application 초기화 중 오류 발생", e)
            // Crashlytics에 오류 전송 (초기화된 경우)
            if (::firebaseCrashlytics.isInitialized) {
                firebaseCrashlytics.recordException(e)
            }
        }
    }

    /**
     * 기본 설정 초기화
     */
    private fun initializeBasicSettings() {
        try {
            Log.d(TAG, "기본 설정 초기화")

            // 다크 모드 설정 (시스템 설정 따름)
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)

            // 로케일 설정 (한국어 우선)
            setAppLocale()

        } catch (e: Exception) {
            Log.e(TAG, "기본 설정 초기화 오류", e)
        }
    }

    /**
     * Firebase 초기화
     */
    private fun initializeFirebase() {
        try {
            Log.d(TAG, "Firebase 초기화 시작")

            // Firebase 앱 초기화
            FirebaseApp.initializeApp(this)

            // Firebase Auth 초기화
            firebaseAuth = FirebaseAuth.getInstance().apply {
                // 언어 설정 (한국어)
                setLanguageCode("ko")

                // 인증 상태 리스너 (선택적)
                addAuthStateListener { auth ->
                    val user = auth.currentUser
                    Log.d(TAG, "Firebase Auth 상태 변경: ${user?.uid ?: "로그아웃"}")
                }
            }

            // Firestore 초기화
            firebaseFirestore = FirebaseFirestore.getInstance().apply {
                // Firestore 설정
                val settings = FirebaseFirestoreSettings.Builder()
                    .setPersistenceEnabled(true) // 오프라인 지원
                    .setCacheSizeBytes(FirebaseFirestoreSettings.CACHE_SIZE_UNLIMITED)
                    .build()
                firestoreSettings = settings
            }

            // Firebase Messaging 초기화
            firebaseMessaging = FirebaseMessaging.getInstance().apply {
                // FCM 토큰 가져오기
                token.addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        val token = task.result
                        Log.d(TAG, "FCM 토큰: $token")
                        // TODO: 서버에 토큰 전송
                    } else {
                        Log.w(TAG, "FCM 토큰 가져오기 실패", task.exception)
                    }
                }
            }

            // Firebase Remote Config 초기화
            firebaseRemoteConfig = FirebaseRemoteConfig.getInstance().apply {
                val configSettings = FirebaseRemoteConfigSettings.Builder()
                    .setMinimumFetchIntervalInSeconds(if (BuildConfig.DEBUG) 0 else 3600) // 디버그: 즉시, 릴리즈: 1시간
                    .build()
                setConfigSettingsAsync(configSettings)

                // 기본값 설정
                setDefaultsAsync(getRemoteConfigDefaults())

                // 원격 설정 가져오기
                fetchAndActivate().addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        Log.d(TAG, "Remote Config 업데이트 완료")
                    } else {
                        Log.w(TAG, "Remote Config 업데이트 실패")
                    }
                }
            }

            // Firebase Crashlytics 초기화
            firebaseCrashlytics = FirebaseCrashlytics.getInstance().apply {
                // 디버그 빌드에서는 Crashlytics 비활성화
                setCrashlyticsCollectionEnabled(!BuildConfig.DEBUG)

                // 사용자 정보 설정 (선택적)
                setUserId("anonymous_user")
                setCustomKey("app_version", BuildConfig.VERSION_NAME)
                setCustomKey("build_type", BuildConfig.BUILD_TYPE)
            }

            // Firebase Analytics 초기화 (GDPR 준수)
            if (isAnalyticsConsentGiven()) {
                firebaseAnalytics = FirebaseAnalytics.getInstance(this).apply {
                    setAnalyticsCollectionEnabled(true)
                    setUserId("anonymous_user")
                    setUserProperty("app_version", BuildConfig.VERSION_NAME)
                }
                Log.d(TAG, "Firebase Analytics 활성화")
            } else {
                Log.d(TAG, "Firebase Analytics 비활성화 (사용자 동의 없음)")
            }

            Log.d(TAG, "Firebase 초기화 완료")

        } catch (e: Exception) {
            Log.e(TAG, "Firebase 초기화 오류", e)
        }
    }

    /**
     * 보안 시스템 초기화
     */
    private fun initializeSecurity() {
        try {
            Log.d(TAG, "보안 시스템 초기화")

            securityManager = SecurityManager(this)

            // 백그라운드에서 보안 검증 수행
            applicationScope.launch(Dispatchers.IO) {
                val securityResult = securityManager.performSecurityCheck()

                if (!securityResult.isSecure) {
                    Log.w(TAG, "보안 위험 감지: ${securityResult.issues}")
                    securityManager.handleSecurityViolation(securityResult)
                } else {
                    Log.d(TAG, "보안 검증 통과")
                }
            }

        } catch (e: Exception) {
            Log.e(TAG, "보안 시스템 초기화 오류", e)
        }
    }

    /**
     * 네트워크 유틸리티 초기화
     */
    private fun initializeNetworkUtils() {
        try {
            Log.d(TAG, "네트워크 유틸리티 초기화")

            networkUtils = NetworkUtils(this)

            // 네트워크 상태 모니터링 시작
            networkUtils.startNetworkMonitoring(object : NetworkUtils.NetworkStateListener {
                override fun onNetworkAvailable() {
                    Log.d(TAG, "네트워크 연결됨")
                    onNetworkConnected()
                }

                override fun onNetworkLost() {
                    Log.d(TAG, "네트워크 연결 끊어짐")
                    onNetworkDisconnected()
                }

                override fun onNetworkChanged(networkType: NetworkUtils.NetworkType) {
                    Log.d(TAG, "네트워크 타입 변경: $networkType")
                }
            })

        } catch (e: Exception) {
            Log.e(TAG, "네트워크 유틸리티 초기화 오류", e)
        }
    }

    /**
     * 백그라운드 작업 시작
     */
    private fun startBackgroundTasks() {
        applicationScope.launch(Dispatchers.IO) {
            try {
                // 캐시 정리 (앱 시작 시)
                cleanupOldCaches()

                // Firebase 연결 테스트
                testFirebaseConnection()

                // 앱 사용 통계 업데이트
                updateAppUsageStats()

            } catch (e: Exception) {
                Log.e(TAG, "백그라운드 작업 오류", e)
            }
        }
    }

    /**
     * Remote Config 기본값
     */
    private fun getRemoteConfigDefaults(): Map<String, Any> {
        return mapOf(
            "min_app_version" to BuildConfig.VERSION_NAME,
            "force_update_required" to false,
            "maintenance_mode" to false,
            "max_video_quality" to "720p",
            "enable_debug_logs" to BuildConfig.DEBUG,
            "fcm_enabled" to true,
            "analytics_enabled" to false,
            "max_concurrent_downloads" to 3,
            "cache_retention_days" to 7
        )
    }

    /**
     * Analytics 동의 여부 확인
     */
    private fun isAnalyticsConsentGiven(): Boolean {
        val sharedPrefs = getSharedPreferences("app_preferences", Context.MODE_PRIVATE)
        return sharedPrefs.getBoolean("analytics_consent", false)
    }

    /**
     * 앱 로케일 설정
     */
    private fun setAppLocale() {
        try {
            val sharedPrefs = getSharedPreferences("app_preferences", Context.MODE_PRIVATE)
            val savedLanguage = sharedPrefs.getString("app_language", "ko") // 기본값: 한국어

            // TODO: 필요시 로케일 변경 로직 구현
            Log.d(TAG, "앱 언어 설정: $savedLanguage")

        } catch (e: Exception) {
            Log.e(TAG, "로케일 설정 오류", e)
        }
    }

    /**
     * 네트워크 연결 시 호출
     */
    private fun onNetworkConnected() {
        applicationScope.launch(Dispatchers.IO) {
            try {
                // Firebase 재연결
                if (::firebaseFirestore.isInitialized) {
                    firebaseFirestore.enableNetwork()
                }

                // Remote Config 업데이트
                if (::firebaseRemoteConfig.isInitialized) {
                    firebaseRemoteConfig.fetchAndActivate()
                }

                // 대기 중인 데이터 동기화
                synchronizePendingData()

            } catch (e: Exception) {
                Log.e(TAG, "네트워크 연결 처리 오류", e)
            }
        }
    }

    /**
     * 네트워크 연결 끊어짐 시 호출
     */
    private fun onNetworkDisconnected() {
        applicationScope.launch(Dispatchers.IO) {
            try {
                // Firebase 오프라인 모드
                if (::firebaseFirestore.isInitialized) {
                    firebaseFirestore.disableNetwork()
                }

                // 오프라인 데이터 준비
                prepareOfflineData()

            } catch (e: Exception) {
                Log.e(TAG, "네트워크 연결 끊어짐 처리 오류", e)
            }
        }
    }

    /**
     * 오래된 캐시 정리
     */
    private fun cleanupOldCaches() {
        try {
            val cacheDir = cacheDir
            val maxCacheAge = 7 * 24 * 60 * 60 * 1000L // 7일
            val currentTime = System.currentTimeMillis()

            cacheDir.listFiles()?.forEach { file ->
                if (currentTime - file.lastModified() > maxCacheAge) {
                    file.deleteRecursively()
                    Log.d(TAG, "오래된 캐시 파일 삭제: ${file.name}")
                }
            }

        } catch (e: Exception) {
            Log.e(TAG, "캐시 정리 오류", e)
        }
    }

    /**
     * Firebase 연결 테스트
     */
    private suspend fun testFirebaseConnection() {
        try {
            if (::networkUtils.isInitialized) {
                val isConnected = networkUtils.testFirebaseConnection()
                Log.d(TAG, "Firebase 연결 테스트 결과: $isConnected")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Firebase 연결 테스트 오류", e)
        }
    }

    /**
     * 앱 사용 통계 업데이트
     */
    private fun updateAppUsageStats() {
        try {
            val sharedPrefs = getSharedPreferences("app_stats", Context.MODE_PRIVATE)
            val launchCount = sharedPrefs.getInt("launch_count", 0) + 1
            val lastLaunchTime = System.currentTimeMillis()

            sharedPrefs.edit()
                .putInt("launch_count", launchCount)
                .putLong("last_launch_time", lastLaunchTime)
                .putString("app_version", BuildConfig.VERSION_NAME)
                .apply()

            Log.d(TAG, "앱 실행 횟수: $launchCount")

            // Crashlytics에 사용자 통계 전송
            if (::firebaseCrashlytics.isInitialized) {
                firebaseCrashlytics.setCustomKey("launch_count", launchCount)
                firebaseCrashlytics.setCustomKey("last_launch_time", lastLaunchTime)
            }

        } catch (e: Exception) {
            Log.e(TAG, "앱 사용 통계 업데이트 오류", e)
        }
    }

    /**
     * 대기 중인 데이터 동기화
     */
    private fun synchronizePendingData() {
        try {
            // TODO: 오프라인에서 쌓인 데이터를 서버와 동기화
            Log.d(TAG, "대기 중인 데이터 동기화 시작")

        } catch (e: Exception) {
            Log.e(TAG, "데이터 동기화 오류", e)
        }
    }

    /**
     * 오프라인 데이터 준비
     */
    private fun prepareOfflineData() {
        try {
            // TODO: 오프라인에서 사용할 수 있는 데이터 준비
            Log.d(TAG, "오프라인 데이터 준비")

        } catch (e: Exception) {
            Log.e(TAG, "오프라인 데이터 준비 오류", e)
        }
    }

    // ============================================
    // 생명주기 콜백들
    // ============================================

    override fun onStart(owner: LifecycleOwner) {
        super<DefaultLifecycleObserver>.onStart(owner)
        Log.d(TAG, "앱이 포그라운드로 전환됨")
        isAppInForeground = true

        // 포그라운드 전환 시 작업
        applicationScope.launch {
            onAppEnterForeground()
        }
    }

    override fun onStop(owner: LifecycleOwner) {
        super<DefaultLifecycleObserver>.onStop(owner)
        Log.d(TAG, "앱이 백그라운드로 전환됨")
        isAppInForeground = false

        // 백그라운드 전환 시 작업
        applicationScope.launch {
            onAppEnterBackground()
        }
    }

    /**
     * 앱이 포그라운드로 전환될 때 호출
     */
    private suspend fun onAppEnterForeground() {
        try {
            // Remote Config 업데이트 확인
            if (::firebaseRemoteConfig.isInitialized) {
                firebaseRemoteConfig.fetchAndActivate()
            }

            // 네트워크 상태 재확인
            if (::networkUtils.isInitialized) {
                networkUtils.testInternetConnection()
            }

        } catch (e: Exception) {
            Log.e(TAG, "포그라운드 전환 처리 오류", e)
        }
    }

    /**
     * 앱이 백그라운드로 전환될 때 호출
     */
    private suspend fun onAppEnterBackground() {
        try {
            // 데이터 저장
            saveAppState()

            // 불필요한 리소스 정리
            cleanupResources()

        } catch (e: Exception) {
            Log.e(TAG, "백그라운드 전환 처리 오류", e)
        }
    }

    /**
     * 앱 상태 저장
     */
    private fun saveAppState() {
        try {
            val sharedPrefs = getSharedPreferences("app_state", Context.MODE_PRIVATE)
            sharedPrefs.edit()
                .putLong("last_background_time", System.currentTimeMillis())
                .putBoolean("was_in_foreground", isAppInForeground)
                .apply()

            Log.d(TAG, "앱 상태 저장 완료")

        } catch (e: Exception) {
            Log.e(TAG, "앱 상태 저장 오류", e)
        }
    }

    /**
     * 리소스 정리
     */
    private fun cleanupResources() {
        try {
            // 메모리 정리
            System.gc()

            Log.d(TAG, "리소스 정리 완료")

        } catch (e: Exception) {
            Log.e(TAG, "리소스 정리 오류", e)
        }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        Log.d(TAG, "Configuration 변경: ${newConfig.toString()}")
    }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        Log.d(TAG, "메모리 정리 요청: level $level")

        when (level) {
            TRIM_MEMORY_UI_HIDDEN -> {
                // UI가 숨겨짐
                cleanupUIResources()
            }
            TRIM_MEMORY_RUNNING_CRITICAL -> {
                // 메모리 부족 상황
                emergencyCleanup()
            }
        }
    }

    /**
     * UI 리소스 정리
     */
    private fun cleanupUIResources() {
        try {
            Log.d(TAG, "UI 리소스 정리")
            // TODO: UI 관련 리소스 정리
        } catch (e: Exception) {
            Log.e(TAG, "UI 리소스 정리 오류", e)
        }
    }

    /**
     * 긴급 메모리 정리
     */
    private fun emergencyCleanup() {
        try {
            Log.w(TAG, "긴급 메모리 정리 수행")

            // 캐시 정리
            cacheDir.deleteRecursively()

            // 가비지 컬렉션 강제 실행
            System.gc()

        } catch (e: Exception) {
            Log.e(TAG, "긴급 메모리 정리 오류", e)
        }
    }

    // ============================================
    // 공용 메서드들
    // ============================================

    /**
     * Firebase Auth 인스턴스 가져오기
     */
    fun getFirebaseAuth(): FirebaseAuth = firebaseAuth

    /**
     * Firestore 인스턴스 가져오기
     */
    fun getFirebaseFirestore(): FirebaseFirestore = firebaseFirestore

    /**
     * Firebase Messaging 인스턴스 가져오기
     */
    fun getFirebaseMessaging(): FirebaseMessaging = firebaseMessaging

    /**
     * Remote Config 인스턴스 가져오기
     */
    fun getFirebaseRemoteConfig(): FirebaseRemoteConfig = firebaseRemoteConfig

    /**
     * 보안 관리자 가져오기
     */
    fun getSecurityManager(): SecurityManager = securityManager

    /**
     * 네트워크 유틸리티 가져오기
     */
    fun getNetworkUtils(): NetworkUtils = networkUtils

    /**
     * 앱이 포그라운드에 있는지 확인
     */
    fun isAppInForeground(): Boolean = isAppInForeground

    /**
     * 앱 시작 시간 가져오기
     */
    fun getAppStartTime(): Long = appStartTime
}