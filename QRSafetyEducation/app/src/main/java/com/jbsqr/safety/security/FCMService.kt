package com.jbsqr.safety.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.jbsqr.safety.MainActivity
import com.jbsqr.safety.R
import org.json.JSONObject

/**
 * Firebase Cloud Messaging 서비스
 * 푸시 알림 수신 및 처리를 담당
 */
class FCMService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "FCMService"

        // 알림 채널 ID들
        private const val CHANNEL_ID_GENERAL = "general_notifications"
        private const val CHANNEL_ID_EDUCATION = "education_notifications"
        private const val CHANNEL_ID_CERTIFICATE = "certificate_notifications"
        private const val CHANNEL_ID_EMERGENCY = "emergency_notifications"

        // 알림 ID들
        private const val NOTIFICATION_ID_GENERAL = 1000
        private const val NOTIFICATION_ID_EDUCATION = 2000
        private const val NOTIFICATION_ID_CERTIFICATE = 3000
        private const val NOTIFICATION_ID_EMERGENCY = 4000

        // 푸시 메시지 타입들
        private const val MESSAGE_TYPE_GENERAL = "general"
        private const val MESSAGE_TYPE_EDUCATION = "education"
        private const val MESSAGE_TYPE_CERTIFICATE = "certificate"
        private const val MESSAGE_TYPE_EMERGENCY = "emergency"
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "FCMService 생성됨")
        createNotificationChannels()
    }

    /**
     * 새로운 토큰 수신 시 호출
     * 서버에 토큰 업데이트 필요
     */
    override fun onNewToken(token: String) {
        Log.d(TAG, "새로운 FCM 토큰 받음: $token")

        // SharedPreferences에 토큰 저장
        saveTokenToPreferences(token)

        // 서버에 토큰 전송
        sendTokenToServer(token)
    }

    /**
     * 메시지 수신 시 호출
     */
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "FCM 메시지 수신 from: ${remoteMessage.from}")

        // 데이터 페이로드 처리
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "메시지 데이터: ${remoteMessage.data}")
            handleDataMessage(remoteMessage.data)
        }

        // 알림 페이로드 처리
        remoteMessage.notification?.let { notification ->
            Log.d(TAG, "메시지 알림: ${notification.title} - ${notification.body}")

            val messageType = remoteMessage.data["type"] ?: MESSAGE_TYPE_GENERAL
            showNotification(
                title = notification.title ?: "알림",
                body = notification.body ?: "",
                messageType = messageType,
                data = remoteMessage.data
            )
        }
    }

    /**
     * 데이터 메시지 처리
     */
    private fun handleDataMessage(data: Map<String, String>) {
        try {
            val messageType = data["type"] ?: MESSAGE_TYPE_GENERAL

            when (messageType) {
                MESSAGE_TYPE_EDUCATION -> {
                    handleEducationMessage(data)
                }
                MESSAGE_TYPE_CERTIFICATE -> {
                    handleCertificateMessage(data)
                }
                MESSAGE_TYPE_EMERGENCY -> {
                    handleEmergencyMessage(data)
                }
                else -> {
                    handleGeneralMessage(data)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "데이터 메시지 처리 오류", e)
        }
    }

    /**
     * 교육 관련 메시지 처리
     */
    private fun handleEducationMessage(data: Map<String, String>) {
        val lectureId = data["lecture_id"]
        val lectureName = data["lecture_name"]
        val action = data["action"] // "new", "reminder", "deadline"

        Log.d(TAG, "교육 메시지: $action - $lectureName")

        val title = when (action) {
            "new" -> "새로운 안전교육 배정"
            "reminder" -> "안전교육 이수 알림"
            "deadline" -> "안전교육 마감 임박"
            else -> "안전교육 알림"
        }

        val body = when (action) {
            "new" -> "$lectureName 교육이 새로 배정되었습니다."
            "reminder" -> "$lectureName 교육을 완료해주세요."
            "deadline" -> "$lectureName 교육 마감이 임박했습니다."
            else -> "$lectureName 관련 알림입니다."
        }

        showNotification(
            title = title,
            body = body,
            messageType = MESSAGE_TYPE_EDUCATION,
            data = data
        )
    }

    /**
     * 수료증 관련 메시지 처리
     */
    private fun handleCertificateMessage(data: Map<String, String>) {
        val certificateId = data["certificate_id"]
        val lectureName = data["lecture_name"]
        val action = data["action"] // "issued", "reminder", "expiring"

        Log.d(TAG, "수료증 메시지: $action - $lectureName")

        val title = when (action) {
            "issued" -> "수료증 발급 완료"
            "reminder" -> "수료증 다운로드 알림"
            "expiring" -> "수료증 만료 임박"
            else -> "수료증 알림"
        }

        val body = when (action) {
            "issued" -> "$lectureName 수료증이 발급되었습니다."
            "reminder" -> "$lectureName 수료증을 다운로드하세요."
            "expiring" -> "$lectureName 수료증이 곧 만료됩니다."
            else -> "$lectureName 수료증 관련 알림입니다."
        }

        showNotification(
            title = title,
            body = body,
            messageType = MESSAGE_TYPE_CERTIFICATE,
            data = data
        )
    }

    /**
     * 응급/긴급 메시지 처리
     */
    private fun handleEmergencyMessage(data: Map<String, String>) {
        val emergencyType = data["emergency_type"]
        val message = data["message"]

        Log.w(TAG, "긴급 메시지: $emergencyType - $message")

        showNotification(
            title = "🚨 긴급 안전 알림",
            body = message ?: "긴급 상황이 발생했습니다.",
            messageType = MESSAGE_TYPE_EMERGENCY,
            data = data,
            isHighPriority = true
        )
    }

    /**
     * 일반 메시지 처리
     */
    private fun handleGeneralMessage(data: Map<String, String>) {
        val title = data["title"] ?: "JB 안전교육"
        val body = data["body"] ?: "새로운 알림이 있습니다."

        Log.d(TAG, "일반 메시지: $title - $body")

        showNotification(
            title = title,
            body = body,
            messageType = MESSAGE_TYPE_GENERAL,
            data = data
        )
    }

    /**
     * 알림 표시
     */
    private fun showNotification(
        title: String,
        body: String,
        messageType: String,
        data: Map<String, String>,
        isHighPriority: Boolean = false
    ) {
        try {
            val channelId = getChannelId(messageType)
            val notificationId = getNotificationId(messageType)

            // 알림 클릭 시 실행할 Intent
            val intent = createNotificationIntent(messageType, data)
            val pendingIntent = PendingIntent.getActivity(
                this,
                notificationId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // 알림 빌더 생성
            val notificationBuilder = NotificationCompat.Builder(this, channelId)
                .setSmallIcon(R.drawable.ic_notification)
                .setLargeIcon(BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher))
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setColor(resources.getColor(R.color.primary, null))

            // 긴급 알림인 경우 우선순위 높임
            if (isHighPriority || messageType == MESSAGE_TYPE_EMERGENCY) {
                notificationBuilder
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setDefaults(NotificationCompat.DEFAULT_ALL)
                    .setVibrate(longArrayOf(0, 1000, 500, 1000))
            } else {
                notificationBuilder.setPriority(NotificationCompat.PRIORITY_DEFAULT)
            }

            // 알림 표시
            val notificationManager = NotificationManagerCompat.from(this)
            notificationManager.notify(notificationId, notificationBuilder.build())

            Log.d(TAG, "알림 표시 완료: $title")
        } catch (e: Exception) {
            Log.e(TAG, "알림 표시 오류", e)
        }
    }

    /**
     * 알림 채널 생성 (Android 8.0 이상)
     */
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // 일반 알림 채널
            val generalChannel = NotificationChannel(
                CHANNEL_ID_GENERAL,
                "일반 알림",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "일반적인 앱 알림"
            }

            // 교육 알림 채널
            val educationChannel = NotificationChannel(
                CHANNEL_ID_EDUCATION,
                "안전교육 알림",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "안전교육 관련 중요 알림"
            }

            // 수료증 알림 채널
            val certificateChannel = NotificationChannel(
                CHANNEL_ID_CERTIFICATE,
                "수료증 알림",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "수료증 발급 및 관리 알림"
            }

            // 긴급 알림 채널
            val emergencyChannel = NotificationChannel(
                CHANNEL_ID_EMERGENCY,
                "긴급 안전 알림",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "긴급 안전 상황 알림"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 1000, 500, 1000)
            }

            // 채널 등록
            notificationManager.createNotificationChannels(listOf(
                generalChannel,
                educationChannel,
                certificateChannel,
                emergencyChannel
            ))

            Log.d(TAG, "알림 채널 생성 완료")
        }
    }

    /**
     * 메시지 타입에 따른 채널 ID 반환
     */
    private fun getChannelId(messageType: String): String {
        return when (messageType) {
            MESSAGE_TYPE_EDUCATION -> CHANNEL_ID_EDUCATION
            MESSAGE_TYPE_CERTIFICATE -> CHANNEL_ID_CERTIFICATE
            MESSAGE_TYPE_EMERGENCY -> CHANNEL_ID_EMERGENCY
            else -> CHANNEL_ID_GENERAL
        }
    }

    /**
     * 메시지 타입에 따른 알림 ID 반환
     */
    private fun getNotificationId(messageType: String): Int {
        return when (messageType) {
            MESSAGE_TYPE_EDUCATION -> NOTIFICATION_ID_EDUCATION
            MESSAGE_TYPE_CERTIFICATE -> NOTIFICATION_ID_CERTIFICATE
            MESSAGE_TYPE_EMERGENCY -> NOTIFICATION_ID_EMERGENCY
            else -> NOTIFICATION_ID_GENERAL
        } + System.currentTimeMillis().toInt() % 1000 // 고유 ID 보장
    }

    /**
     * 알림 클릭 시 실행할 Intent 생성
     */
    private fun createNotificationIntent(messageType: String, data: Map<String, String>): Intent {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP

            // 메시지 타입에 따른 추가 데이터
            putExtra("notification_type", messageType)
            putExtra("from_notification", true)

            when (messageType) {
                MESSAGE_TYPE_EDUCATION -> {
                    putExtra("lecture_id", data["lecture_id"])
                    putExtra("action", "open_lecture")
                }
                MESSAGE_TYPE_CERTIFICATE -> {
                    putExtra("certificate_id", data["certificate_id"])
                    putExtra("action", "open_certificate")
                }
                MESSAGE_TYPE_EMERGENCY -> {
                    putExtra("emergency_type", data["emergency_type"])
                    putExtra("action", "show_emergency")
                }
            }
        }

        return intent
    }

    /**
     * FCM 토큰을 SharedPreferences에 저장
     */
    private fun saveTokenToPreferences(token: String) {
        try {
            val prefs = getSharedPreferences("fcm_prefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("fcm_token", token)
                .putLong("token_timestamp", System.currentTimeMillis())
                .apply()

            Log.d(TAG, "FCM 토큰 저장 완료")
        } catch (e: Exception) {
            Log.e(TAG, "FCM 토큰 저장 오류", e)
        }
    }

    /**
     * 서버에 FCM 토큰 전송
     */
    private fun sendTokenToServer(token: String) {
        try {
            // Firebase Functions 또는 백엔드 서버에 토큰 전송
            // 실제 구현에서는 Retrofit 또는 OkHttp 사용

            Log.d(TAG, "서버에 FCM 토큰 전송 준비: $token")

            // TODO: 실제 서버 API 호출 구현
            // 예시:
            // apiService.updateFCMToken(userId, token)

        } catch (e: Exception) {
            Log.e(TAG, "서버 토큰 전송 오류", e)
        }
    }

    /**
     * 현재 FCM 토큰 가져오기
     */
    fun getCurrentToken(): String? {
        return try {
            val prefs = getSharedPreferences("fcm_prefs", Context.MODE_PRIVATE)
            prefs.getString("fcm_token", null)
        } catch (e: Exception) {
            Log.e(TAG, "FCM 토큰 조회 오류", e)
            null
        }
    }

    /**
     * 리소스 정리
     */
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "FCMService 소멸")
    }
}