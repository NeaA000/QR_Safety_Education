package com.jbsqr.safety.modules

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.zxing.integration.android.IntentIntegrator
import com.google.zxing.integration.android.IntentResult

/**
 * QR 코드 스캐너 모듈
 * ZXing 라이브러리를 사용한 QR 코드 스캔 기능
 */
class QRScannerModule(private val activity: Activity) {

    companion object {
        private const val TAG = "QRScannerModule"
        private const val CAMERA_PERMISSION_REQUEST = 1001
    }

    private var scanCallback: ((String) -> Unit)? = null
    private var integrator: IntentIntegrator? = null

    /**
     * QR 코드 스캔 시작
     * @param callback 스캔 결과 콜백
     */
    fun startScan(callback: (String) -> Unit) {
        Log.d(TAG, "QR 스캔 시작 요청")
        this.scanCallback = callback

        // 카메라 권한 확인
        if (checkCameraPermission()) {
            initializeScanner()
        } else {
            requestCameraPermission()
        }
    }

    /**
     * QR 스캔 중지
     */
    fun stopScan() {
        Log.d(TAG, "QR 스캔 중지")
        integrator = null
        scanCallback = null
    }

    /**
     * 카메라 권한 확인
     */
    private fun checkCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            activity,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }

    /**
     * 카메라 권한 요청
     */
    private fun requestCameraPermission() {
        Log.d(TAG, "카메라 권한 요청")
        ActivityCompat.requestPermissions(
            activity,
            arrayOf(Manifest.permission.CAMERA),
            CAMERA_PERMISSION_REQUEST
        )
    }

    /**
     * QR 스캐너 초기화 및 실행
     */
    private fun initializeScanner() {
        try {
            integrator = IntentIntegrator(activity).apply {
                // 스캔 설정
                setDesiredBarcodeFormats(IntentIntegrator.QR_CODE)
                setPrompt("QR 코드를 카메라에 맞춰주세요")
                setCameraId(0)  // 후면 카메라 사용
                setBeepEnabled(true)  // 스캔 완료 시 소리
                setBarcodeImageEnabled(true)  // 바코드 이미지 저장
                setOrientationLocked(true)  // 세로 모드 고정

                // 커스텀 스캔 액티비티 설정 (선택적)
                setCaptureActivity(QRScannerActivity::class.java)
            }

            // 스캔 시작
            integrator?.initiateScan()
            Log.d(TAG, "QR 스캐너 실행")

        } catch (e: Exception) {
            Log.e(TAG, "QR 스캐너 초기화 오류", e)
            scanCallback?.invoke("ERROR: ${e.message}")
        }
    }

    /**
     * 액티비티 결과 처리
     */
    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        val result: IntentResult = IntentIntegrator.parseActivityResult(requestCode, resultCode, data)

        if (result != null) {
            when {
                result.contents == null -> {
                    Log.d(TAG, "QR 스캔 취소됨")
                    scanCallback?.invoke("CANCELLED")
                }
                result.contents.isNotEmpty() -> {
                    Log.d(TAG, "QR 스캔 성공: ${result.contents}")

                    // QR 코드 데이터 검증
                    val qrData = validateQRData(result.contents)
                    scanCallback?.invoke(qrData)
                }
                else -> {
                    Log.w(TAG, "QR 스캔 결과가 비어있음")
                    scanCallback?.invoke("ERROR: Empty QR code")
                }
            }
        } else {
            Log.e(TAG, "QR 스캔 결과 파싱 실패")
            scanCallback?.invoke("ERROR: Failed to parse QR result")
        }

        // 콜백 정리
        scanCallback = null
    }

    /**
     * 권한 요청 결과 처리
     */
    fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        when (requestCode) {
            CAMERA_PERMISSION_REQUEST -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    Log.d(TAG, "카메라 권한 승인됨")
                    initializeScanner()
                } else {
                    Log.w(TAG, "카메라 권한 거부됨")
                    scanCallback?.invoke("ERROR: Camera permission denied")
                    scanCallback = null
                }
            }
        }
    }

    /**
     * QR 코드 데이터 검증 및 포맷팅
     */
    private fun validateQRData(rawData: String): String {
        return try {
            // QR 코드가 URL인지 확인
            if (rawData.startsWith("http://") || rawData.startsWith("https://")) {
                // URL에서 강의 ID 추출
                val lectureId = extractLectureId(rawData)
                if (lectureId != null) {
                    Log.d(TAG, "강의 ID 추출: $lectureId")
                    return "LECTURE:$lectureId"
                }
            }

            // 커스텀 QR 코드 형식 검증 (예: QR_SAFETY_EDU:lecture_id)
            if (rawData.startsWith("QR_SAFETY_EDU:")) {
                val lectureId = rawData.substring("QR_SAFETY_EDU:".length)
                Log.d(TAG, "안전교육 QR 코드: $lectureId")
                return "LECTURE:$lectureId"
            }

            // 일반 텍스트로 반환
            Log.d(TAG, "일반 QR 코드: $rawData")
            rawData

        } catch (e: Exception) {
            Log.e(TAG, "QR 데이터 검증 오류", e)
            rawData
        }
    }

    /**
     * URL에서 강의 ID 추출
     */
    private fun extractLectureId(url: String): String? {
        return try {
            // URL 파라미터에서 lecture_id 추출
            val uri = android.net.Uri.parse(url)
            val lectureId = uri.getQueryParameter("lecture_id")
                ?: uri.getQueryParameter("id")
                ?: uri.lastPathSegment

            Log.d(TAG, "URL에서 추출된 강의 ID: $lectureId")
            lectureId

        } catch (e: Exception) {
            Log.e(TAG, "강의 ID 추출 오류", e)
            null
        }
    }

    /**
     * QR 스캔 가능 여부 확인
     */
    fun isQRScanAvailable(): Boolean {
        return try {
            // 카메라 하드웨어 존재 확인
            val hasCamera = activity.packageManager.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)

            // 카메라 권한 확인
            val hasPermission = checkCameraPermission()

            Log.d(TAG, "QR 스캔 가능 여부 - 카메라: $hasCamera, 권한: $hasPermission")
            hasCamera && hasPermission

        } catch (e: Exception) {
            Log.e(TAG, "QR 스캔 가능 여부 확인 오류", e)
            false
        }
    }

    /**
     * 리소스 정리
     */
    fun cleanup() {
        Log.d(TAG, "QRScannerModule 리소스 정리")
        integrator = null
        scanCallback = null
    }
}