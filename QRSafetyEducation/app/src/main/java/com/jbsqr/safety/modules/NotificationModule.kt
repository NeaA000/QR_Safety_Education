package com.jbsqr.safety.modules

import android.Manifest
import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging
import com.jbsqr.safety.MainActivity
import com.jbsqr.safety.R

/**
 * 푸시 알림 및 FCM 관리 모듈
 * Firebase Cloud Messaging을 사용한 푸시 알림 기능
 */
class NotificationModule(private val activity: Activity) {

    companion object {
        private const val TAG = "NotificationModule"
        private const val NOTIFICATION_PERMISSION_REQUEST = 4001
        private const val CHANNEL_ID = "qr_safety_education"
        private const val CHANNEL_NAME = "QR 안전교육 알림"
        private const val CHANNEL_DESCRIPTION = "교육 관련 알림을 받습니다"
    }

    private val notificationManager = NotificationManagerCompat.from(activity)
    private var permissionCallback: (() -> Unit)? = null

    init {
        createNotificationChannel()
        Log.d(TAG, "NotificationModule 초기화 완료")
    }

    /**
     * 알림 채널 생성 (Android 8.0+)
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = CHANNEL_DESCRIPTION
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
            }

            val notificationManager = activity.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)

            Log.d(TAG, "알림 채널 생성 완료")
        }
    }

    /**
     * 로컬 알림 표시
     * @param title 알림 제목
     * @param message 알림 내용
     * @param lectureId 강의 ID (선택적)
     */
    fun showNotification(title: String, message: String, lectureId: String? = null) {
        Log.d(TAG, "알림 표시: $title")

        if (checkNotificationPermission()) {
            displayNotification(title, message, lectureId)
        } else {
            permissionCallback = { displayNotification(title, message, lectureId) }
            requestNotificationPermission()
        }
    }

    /**
     * 실제 알림 표시
     */
    private fun displayNotification(title: String, message: String, lectureId: String?) {
        try {
            // 알림 클릭 시 실행할 인텐트
            val intent = Intent(activity, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                lectureId?.let { putExtra("lecture_id", it) }
            }

            val pendingIntent = PendingIntent.getActivity(
                activity,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // 알림 빌더
            val notification = NotificationCompat.Builder(activity, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setColor(ContextCompat.getColor(activity, R.color.notification_accent_color))
                .build()

            // 알림 표시
            val notificationId = System.currentTimeMillis().toInt()
            notificationManager.notify(notificationId, notification)

            Log.d(TAG, "알림 표시 완료: ID=$notificationId")

        } catch (e: Exception) {
            Log.e(TAG, "알림 표시 오류", e)
        }
    }

    /**
     * FCM 토큰 가져오기
     */
    fun getFCMToken(): String? {
        var token: String? = null

        FirebaseMessaging.getInstance().token
            .addOnCompleteListener { task ->
                if (!task.isSuccessful) {
                    Log.w(TAG, "FCM 토큰 가져오기 실패", task.exception)
                    return@addOnCompleteListener
                }

                token = task.result
                Log.d(TAG, "FCM 토큰: $token")
            }

        return token
    }

    /**
     * FCM 토큰 가져오기 (콜백 방식)
     */
    fun getFCMToken(callback: (String?) -> Unit) {
        FirebaseMessaging.getInstance().token
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val token = task.result
                    Log.d(TAG, "FCM 토큰 조회 성공")
                    callback(token)
                } else {
                    Log.e(TAG, "FCM 토큰 조회 실패", task.exception)
                    callback(null)
                }
            }
    }

    /**
     * FCM 주제 구독
     * @param topic 구독할 주제
     */
    fun subscribeToTopic(topic: String, callback: (Boolean) -> Unit) {
        FirebaseMessaging.getInstance().subscribeToTopic(topic)
            .addOnCompleteListener { task ->
                val success = task.isSuccessful
                Log.d(TAG, "주제 구독 $topic: $success")
                callback(success)
            }
    }

    /**
     * FCM 주제 구독 해제
     * @param topic 구독 해제할 주제
     */
    fun unsubscribeFromTopic(topic: String, callback: (Boolean) -> Unit) {
        FirebaseMessaging.getInstance().unsubscribeFromTopic(topic)
            .addOnCompleteListener { task ->
                val success = task.isSuccessful
                Log.d(TAG, "주제 구독 해제 $topic: $success")
                callback(success)
            }
    }

    /**
     * 교육 완료 알림
     */
    fun showEducationCompleteNotification(courseName: String, certificateId: String) {
        val title = "교육 수료 완료"
        val message = "'$courseName' 교육을 성공적으로 완료하였습니다. 수료증이 발급되었습니다."

        showNotification(title, message)
    }

    /**
     * 교육 시작 알림
     */
    fun showEducationStartNotification(courseName: String, lectureId: String) {
        val title = "교육 시작"
        val message = "'$courseName' 교육을 시작합니다."

        showNotification(title, message, lectureId)
    }

    /**
     * 교육 일시정지 알림
     */
    fun showEducationPausedNotification(reason: String) {
        val title = "교육 일시정지"
        val message = "교육이 일시정지되었습니다. 사유: $reason"

        showNotification(title, message)
    }

    /**
     * 정기 알림 설정 (선택적)
     */
    fun schedulePeriodicNotification(title: String, message: String, intervalHours: Int) {
        // WorkManager를 사용한 정기 알림 (필요시 구현)
        Log.d(TAG, "정기 알림 설정: ${intervalHours}시간 간격")
    }

    /**
     * 알림 권한 확인
     */
    private fun checkNotificationPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                activity,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            notificationManager.areNotificationsEnabled()
        }
    }

    /**
     * 알림 권한 요청
     */
    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                NOTIFICATION_PERMISSION_REQUEST
            )
        }
    }

    /**
     * 권한 요청 결과 처리
     */
    fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        when (requestCode) {
            NOTIFICATION_PERMISSION_REQUEST -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    Log.d(TAG, "알림 권한 승인됨")
                    permissionCallback?.invoke()
                } else {
                    Log.w(TAG, "알림 권한 거부됨")
                }
                permissionCallback = null
            }
        }
    }

    /**
     * 모든 알림 제거
     */
    fun clearAllNotifications() {
        notificationManager.cancelAll()
        Log.d(TAG, "모든 알림 제거")
    }

    /**
     * 특정 알림 제거
     */
    fun cancelNotification(notificationId: Int) {
        notificationManager.cancel(notificationId)
        Log.d(TAG, "알림 제거: ID=$notificationId")
    }

    /**
     * 알림 설정 화면으로 이동
     */
    fun openNotificationSettings() {
        try {
            val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                    putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, activity.packageName)
                }
            } else {
                Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = android.net.Uri.parse("package:${activity.packageName}")
                }
            }

            activity.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "알림 설정 화면 열기 오류", e)
        }
    }

    /**
     * 리소스 정리
     */
    fun cleanup() {
        Log.d(TAG, "NotificationModule 리소스 정리")
        permissionCallback = null
    }
}