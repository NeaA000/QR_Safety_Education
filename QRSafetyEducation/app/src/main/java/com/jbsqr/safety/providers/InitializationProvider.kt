package com.jbsqr.safety.providers

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import android.util.Log
import com.jbsqr.safety.QRSafetyEducationApplication

/**
 * 앱 초기화를 위한 ContentProvider
 * Application.onCreate()보다 먼저 실행되어 필수 초기화 작업을 수행
 *
 * AndroidManifest.xml에서 initOrder="100"으로 설정하여
 * 다른 Provider들보다 먼저 실행되도록 함
 */
class InitializationProvider : ContentProvider() {

    companion object {
        private const val TAG = "InitializationProvider"
    }

    /**
     * ContentProvider 생성 시 호출
     * Application.onCreate()보다 먼저 실행됨
     */
    override fun onCreate(): Boolean {
        return try {
            Log.d(TAG, "InitializationProvider 초기화 시작")

            val context = context ?: return false

            // 필수 초기화 작업들
            performEarlyInitialization(context)

            Log.d(TAG, "InitializationProvider 초기화 완료")
            true

        } catch (e: Exception) {
            Log.e(TAG, "InitializationProvider 초기화 오류", e)
            false
        }
    }

    /**
     * 조기 초기화 작업 수행
     */
    private fun performEarlyInitialization(context: android.content.Context) {
        try {
            // 1. 스레드 예외 핸들러 설정
            Thread.setDefaultUncaughtExceptionHandler { thread, exception ->
                Log.e(TAG, "처리되지 않은 예외 발생 (스레드: ${thread.name})", exception)

                // Crashlytics가 초기화되어 있다면 전송
                try {
                    val app = context.applicationContext as? QRSafetyEducationApplication
                    // app?.getFirebaseCrashlytics()?.recordException(exception)
                } catch (e: Exception) {
                    Log.e(TAG, "Crashlytics 전송 실패", e)
                }
            }

            // 2. 시스템 속성 확인
            checkSystemProperties()

            // 3. 앱 디렉토리 생성
            createAppDirectories(context)

            Log.d(TAG, "조기 초기화 작업 완료")

        } catch (e: Exception) {
            Log.e(TAG, "조기 초기화 작업 오류", e)
        }
    }

    /**
     * 시스템 속성 확인
     */
    private fun checkSystemProperties() {
        try {
            val osVersion = android.os.Build.VERSION.RELEASE
            val apiLevel = android.os.Build.VERSION.SDK_INT
            val manufacturer = android.os.Build.MANUFACTURER
            val model = android.os.Build.MODEL

            Log.d(TAG, "시스템 정보 - OS: $osVersion (API $apiLevel), 기기: $manufacturer $model")

        } catch (e: Exception) {
            Log.e(TAG, "시스템 속성 확인 오류", e)
        }
    }

    /**
     * 앱 전용 디렉토리 생성
     */
    private fun createAppDirectories(context: android.content.Context) {
        try {
            // 필요한 디렉토리들 생성
            val directories = listOf(
                java.io.File(context.filesDir, "certificates"),
                java.io.File(context.filesDir, "logs"),
                java.io.File(context.cacheDir, "temp"),
                java.io.File(context.cacheDir, "images")
            )

            directories.forEach { dir ->
                if (!dir.exists()) {
                    val created = dir.mkdirs()
                    Log.d(TAG, "디렉토리 생성: ${dir.absolutePath} (성공: $created)")
                }
            }

        } catch (e: Exception) {
            Log.e(TAG, "앱 디렉토리 생성 오류", e)
        }
    }

    // ContentProvider 필수 메서드들 (사용하지 않음)
    override fun query(
        uri: Uri,
        projection: Array<String>?,
        selection: String?,
        selectionArgs: Array<String>?,
        sortOrder: String?
    ): Cursor? = null

    override fun getType(uri: Uri): String? = null

    override fun insert(uri: Uri, values: ContentValues?): Uri? = null

    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<String>?): Int = 0

    override fun update(
        uri: Uri,
        values: ContentValues?,
        selection: String?,
        selectionArgs: Array<String>?
    ): Int = 0
}