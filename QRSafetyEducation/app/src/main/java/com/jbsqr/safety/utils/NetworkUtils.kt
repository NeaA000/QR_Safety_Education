package com.jbsqr.safety.utils

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.util.Log
import kotlinx.coroutines.*
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import javax.net.ssl.HttpsURLConnection

/**
 * 네트워크 연결 상태 확인 및 관리 유틸리티
 * 안전한 네트워크 통신을 위한 헬퍼 클래스
 */
class NetworkUtils(private val context: Context) {

    companion object {
        private const val TAG = "NetworkUtils"
        private const val TIMEOUT_CONNECT = 5000 // 5초
        private const val TIMEOUT_READ = 10000 // 10초

        // 연결 확인용 테스트 URL들
        private val TEST_URLS = arrayOf(
            "https://www.google.com",
            "https://firebase.google.com",
            "https://www.github.com"
        )
    }

    private val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var networkStateListener: NetworkStateListener? = null

    /**
     * 네트워크 연결 상태 리스너 인터페이스
     */
    interface NetworkStateListener {
        fun onNetworkAvailable()
        fun onNetworkLost()
        fun onNetworkChanged(networkType: NetworkType)
    }

    /**
     * 네트워크 타입 열거형
     */
    enum class NetworkType {
        WIFI,
        CELLULAR,
        ETHERNET,
        VPN,
        UNKNOWN
    }

    /**
     * 네트워크 연결 상태 확인
     * @return 연결 여부
     */
    fun isNetworkAvailable(): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val network = connectivityManager.activeNetwork ?: return false
                val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false

                capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                        capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
            } else {
                @Suppress("DEPRECATION")
                val networkInfo = connectivityManager.activeNetworkInfo
                networkInfo?.isConnected == true
            }
        } catch (e: Exception) {
            Log.e(TAG, "네트워크 상태 확인 오류", e)
            false
        }
    }

    /**
     * WiFi 연결 여부 확인
     */
    fun isWiFiConnected(): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val network = connectivityManager.activeNetwork ?: return false
                val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
            } else {
                @Suppress("DEPRECATION")
                val networkInfo = connectivityManager.getNetworkInfo(ConnectivityManager.TYPE_WIFI)
                networkInfo?.isConnected == true
            }
        } catch (e: Exception) {
            Log.e(TAG, "WiFi 상태 확인 오류", e)
            false
        }
    }

    /**
     * 모바일 데이터 연결 여부 확인
     */
    fun isCellularConnected(): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val network = connectivityManager.activeNetwork ?: return false
                val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)
            } else {
                @Suppress("DEPRECATION")
                val networkInfo = connectivityManager.getNetworkInfo(ConnectivityManager.TYPE_MOBILE)
                networkInfo?.isConnected == true
            }
        } catch (e: Exception) {
            Log.e(TAG, "모바일 데이터 상태 확인 오류", e)
            false
        }
    }

    /**
     * 현재 네트워크 타입 확인
     */
    fun getCurrentNetworkType(): NetworkType {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val network = connectivityManager.activeNetwork ?: return NetworkType.UNKNOWN
                val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return NetworkType.UNKNOWN

                when {
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> NetworkType.WIFI
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> NetworkType.CELLULAR
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> NetworkType.ETHERNET
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN) -> NetworkType.VPN
                    else -> NetworkType.UNKNOWN
                }
            } else {
                @Suppress("DEPRECATION")
                val networkInfo = connectivityManager.activeNetworkInfo
                when (networkInfo?.type) {
                    ConnectivityManager.TYPE_WIFI -> NetworkType.WIFI
                    ConnectivityManager.TYPE_MOBILE -> NetworkType.CELLULAR
                    ConnectivityManager.TYPE_ETHERNET -> NetworkType.ETHERNET
                    ConnectivityManager.TYPE_VPN -> NetworkType.VPN
                    else -> NetworkType.UNKNOWN
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "네트워크 타입 확인 오류", e)
            NetworkType.UNKNOWN
        }
    }

    /**
     * 인터넷 연결 실제 테스트
     * @return 인터넷 연결 가능 여부
     */
    suspend fun testInternetConnection(): Boolean = withContext(Dispatchers.IO) {
        try {
            // 여러 URL 중 하나라도 연결되면 성공
            for (testUrl in TEST_URLS) {
                if (pingUrl(testUrl)) {
                    Log.d(TAG, "인터넷 연결 확인됨: $testUrl")
                    return@withContext true
                }
            }

            Log.w(TAG, "모든 테스트 URL 연결 실패")
            false
        } catch (e: Exception) {
            Log.e(TAG, "인터넷 연결 테스트 오류", e)
            false
        }
    }

    /**
     * 특정 URL에 ping 테스트
     */
    private suspend fun pingUrl(urlString: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val url = URL(urlString)
            val connection = if (urlString.startsWith("https://")) {
                url.openConnection() as HttpsURLConnection
            } else {
                url.openConnection() as HttpURLConnection
            }

            connection.apply {
                requestMethod = "HEAD"
                connectTimeout = TIMEOUT_CONNECT
                readTimeout = TIMEOUT_READ
                instanceFollowRedirects = false
                useCaches = false
            }

            val responseCode = connection.responseCode
            connection.disconnect()

            // 200번대 응답이면 성공
            responseCode in 200..299
        } catch (e: IOException) {
            Log.w(TAG, "$urlString 연결 실패: ${e.message}")
            false
        } catch (e: Exception) {
            Log.e(TAG, "$urlString 연결 테스트 오류", e)
            false
        }
    }

    /**
     * 네트워크 상태 모니터링 시작
     */
    fun startNetworkMonitoring(listener: NetworkStateListener) {
        try {
            this.networkStateListener = listener

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                networkCallback = object : ConnectivityManager.NetworkCallback() {
                    override fun onAvailable(network: Network) {
                        super.onAvailable(network)
                        Log.d(TAG, "네트워크 연결됨")
                        listener.onNetworkAvailable()

                        // 네트워크 타입 확인 후 알림
                        val networkType = getCurrentNetworkType()
                        listener.onNetworkChanged(networkType)
                    }

                    override fun onLost(network: Network) {
                        super.onLost(network)
                        Log.d(TAG, "네트워크 연결 끊어짐")
                        listener.onNetworkLost()
                    }

                    override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
                        super.onCapabilitiesChanged(network, networkCapabilities)
                        Log.d(TAG, "네트워크 능력 변경됨")

                        val networkType = getCurrentNetworkType()
                        listener.onNetworkChanged(networkType)
                    }
                }

                val networkRequest = NetworkRequest.Builder()
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    .build()

                connectivityManager.registerNetworkCallback(networkRequest, networkCallback!!)
                Log.d(TAG, "네트워크 모니터링 시작")
            } else {
                Log.w(TAG, "API 레벨이 너무 낮아 네트워크 모니터링 제한됨")
            }
        } catch (e: Exception) {
            Log.e(TAG, "네트워크 모니터링 시작 오류", e)
        }
    }

    /**
     * 네트워크 상태 모니터링 중지
     */
    fun stopNetworkMonitoring() {
        try {
            networkCallback?.let { callback ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    connectivityManager.unregisterNetworkCallback(callback)
                }
                networkCallback = null
            }
            networkStateListener = null
            Log.d(TAG, "네트워크 모니터링 중지")
        } catch (e: Exception) {
            Log.e(TAG, "네트워크 모니터링 중지 오류", e)
        }
    }

    /**
     * 네트워크 상태 정보 반환
     */
    fun getNetworkInfo(): Map<String, Any> {
        return mapOf(
            "isAvailable" to isNetworkAvailable(),
            "isWiFiConnected" to isWiFiConnected(),
            "isCellularConnected" to isCellularConnected(),
            "networkType" to getCurrentNetworkType().name,
            "timestamp" to System.currentTimeMillis()
        )
    }

    /**
     * Firebase 연결 테스트
     */
    suspend fun testFirebaseConnection(): Boolean = withContext(Dispatchers.IO) {
        try {
            val firebaseUrls = arrayOf(
                "https://firebase.google.com",
                "https://firestore.googleapis.com",
                "https://jb-safety-education-default-rtdb.firebaseio.com"
            )

            for (url in firebaseUrls) {
                if (pingUrl(url)) {
                    Log.d(TAG, "Firebase 연결 확인됨: $url")
                    return@withContext true
                }
            }

            Log.w(TAG, "Firebase 연결 실패")
            false
        } catch (e: Exception) {
            Log.e(TAG, "Firebase 연결 테스트 오류", e)
            false
        }
    }

    /**
     * 네트워크 속도 측정 (단순 버전)
     */
    suspend fun measureNetworkSpeed(): NetworkSpeed = withContext(Dispatchers.IO) {
        try {
            val testUrl = "https://www.google.com"
            val startTime = System.currentTimeMillis()

            val success = pingUrl(testUrl)
            val endTime = System.currentTimeMillis()
            val latency = endTime - startTime

            when {
                !success -> NetworkSpeed.NO_CONNECTION
                latency < 100 -> NetworkSpeed.EXCELLENT
                latency < 300 -> NetworkSpeed.GOOD
                latency < 1000 -> NetworkSpeed.FAIR
                else -> NetworkSpeed.POOR
            }
        } catch (e: Exception) {
            Log.e(TAG, "네트워크 속도 측정 오류", e)
            NetworkSpeed.NO_CONNECTION
        }
    }

    /**
     * 네트워크 속도 등급
     */
    enum class NetworkSpeed {
        EXCELLENT,     // 100ms 미만
        GOOD,         // 100-300ms
        FAIR,         // 300ms-1초
        POOR,         // 1초 이상
        NO_CONNECTION // 연결 없음
    }

    /**
     * 리소스 정리
     */
    fun cleanup() {
        Log.d(TAG, "NetworkUtils 리소스 정리")
        stopNetworkMonitoring()
    }
}