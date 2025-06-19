package com.jbsqr.safety.modules

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.zxing.BarcodeFormat
import com.google.zxing.ResultPoint
import com.journeyapps.barcodescanner.BarcodeCallback
import com.journeyapps.barcodescanner.BarcodeResult
import com.journeyapps.barcodescanner.DecoratedBarcodeView
import com.journeyapps.barcodescanner.DefaultDecoderFactory
import com.jbsqr.safety.MainActivity
import com.jbsqr.safety.R
import com.jbsqr.safety.databinding.ActivityQrScannerBinding
import java.util.*

/**
 * QR 스캐너 전용 액티비티
 * 카메라를 사용하여 QR 코드를 스캔하고 결과를 처리
 */
class QRScannerActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "QRScannerActivity"

        // 결과 코드
        const val RESULT_CODE_SUCCESS = 1001
        const val RESULT_CODE_CANCELLED = 1002
        const val RESULT_CODE_ERROR = 1003

        // 결과 키
        const val EXTRA_SCAN_RESULT = "scan_result"
        const val EXTRA_ERROR_MESSAGE = "error_message"

        // 지원하는 QR 코드 포맷
        private val SUPPORTED_FORMATS = listOf(
            BarcodeFormat.QR_CODE,
            BarcodeFormat.DATA_MATRIX,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39
        )
    }

    private lateinit var binding: ActivityQrScannerBinding
    private var barcodeView: DecoratedBarcodeView? = null
    private var isFlashOn = false
    private var isScanning = true
    private var lastScanTime = 0L

    // 카메라 권한 요청 런처
    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            initializeScanner()
        } else {
            showError("카메라 권한이 필요합니다.")
            finishWithError("카메라 권한이 거부되었습니다.")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            // View Binding 설정
            binding = ActivityQrScannerBinding.inflate(layoutInflater)
            setContentView(binding.root)

            Log.d(TAG, "QRScannerActivity 생성됨")

            // 전체화면 설정
            setupFullscreen()

            // UI 초기화
            setupUI()

            // 권한 확인 및 스캐너 초기화
            checkCameraPermissionAndInit()

        } catch (e: Exception) {
            Log.e(TAG, "QRScannerActivity 초기화 오류", e)
            finishWithError("스캐너 초기화에 실패했습니다.")
        }
    }

    /**
     * 전체화면 설정
     */
    private fun setupFullscreen() {
        window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                )
    }

    /**
     * UI 초기화
     */
    private fun setupUI() {
        // 뒤로가기 버튼
        binding.btnBack.setOnClickListener {
            Log.d(TAG, "뒤로가기 버튼 클릭")
            finishCancelled()
        }

        // 플래시 토글 버튼
        binding.btnFlash.setOnClickListener {
            toggleFlash()
        }

        // 갤러리에서 이미지 선택 버튼 (선택적 기능)
        binding.btnGallery.setOnClickListener {
            // TODO: 갤러리에서 QR 이미지를 선택하여 처리하는 기능
            Toast.makeText(this, "갤러리 기능은 준비 중입니다.", Toast.LENGTH_SHORT).show()
        }

        // 스캔 가이드 텍스트 설정
        binding.tvScanGuide.text = "QR 코드를 카메라에 맞춰주세요\n스캔 영역 안에 QR 코드가 들어가도록 하세요"
    }

    /**
     * 카메라 권한 확인 및 스캐너 초기화
     */
    private fun checkCameraPermissionAndInit() {
        when {
            ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                    == PackageManager.PERMISSION_GRANTED -> {
                Log.d(TAG, "카메라 권한 이미 허용됨")
                initializeScanner()
            }
            shouldShowRequestPermissionRationale(Manifest.permission.CAMERA) -> {
                Log.d(TAG, "카메라 권한 설명 필요")
                showPermissionRationale()
            }
            else -> {
                Log.d(TAG, "카메라 권한 요청")
                cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
            }
        }
    }

    /**
     * 권한 설명 다이얼로그 표시
     */
    private fun showPermissionRationale() {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("카메라 권한 필요")
            .setMessage("QR 코드를 스캔하기 위해 카메라 권한이 필요합니다.")
            .setPositiveButton("권한 허용") { _, _ ->
                cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
            }
            .setNegativeButton("취소") { _, _ ->
                finishWithError("카메라 권한이 필요합니다.")
            }
            .setCancelable(false)
            .show()
    }

    /**
     * QR 스캐너 초기화
     */
    private fun initializeScanner() {
        try {
            Log.d(TAG, "QR 스캐너 초기화 시작")

            barcodeView = binding.barcodeScanner

            // 지원할 바코드 포맷 설정
            val formats = Collections.unmodifiableList(SUPPORTED_FORMATS)
            barcodeView?.barcodeView?.decoderFactory = DefaultDecoderFactory(formats)

            // 스캔 콜백 설정
            barcodeView?.decodeContinuous(scanCallback)

            // 스캐너 설정
            barcodeView?.setStatusText("")
            barcodeView?.viewFinder?.setLaserVisibility(true)
            barcodeView?.viewFinder?.setMaskColor(0x60000000)

            Log.d(TAG, "QR 스캐너 초기화 완료")

            // 스캔 시작
            startScanning()

        } catch (e: Exception) {
            Log.e(TAG, "QR 스캐너 초기화 오류", e)
            finishWithError("스캐너 초기화에 실패했습니다.")
        }
    }

    /**
     * QR 스캔 콜백
     */
    private val scanCallback = object : BarcodeCallback {
        override fun barcodeResult(result: BarcodeResult?) {
            if (!isScanning) return

            result?.let { scanResult ->
                try {
                    val currentTime = System.currentTimeMillis()

                    // 중복 스캔 방지 (1초 내 중복 스캔 무시)
                    if (currentTime - lastScanTime < 1000) {
                        Log.d(TAG, "중복 스캔 무시")
                        return
                    }

                    lastScanTime = currentTime
                    val scannedText = scanResult.text

                    Log.d(TAG, "QR 코드 스캔 성공: $scannedText")

                    // 스캔 중지
                    stopScanning()

                    // QR 코드 유효성 검증
                    if (isValidQRCode(scannedText)) {
                        // 성공 피드백
                        showSuccessFeedback()

                        // 결과 처리
                        handleScanResult(scannedText)
                    } else {
                        Log.w(TAG, "유효하지 않은 QR 코드: $scannedText")
                        showError("유효하지 않은 QR 코드입니다.")

                        // 3초 후 다시 스캔 시작
                        binding.root.postDelayed({
                            if (!isFinishing) {
                                startScanning()
                            }
                        }, 3000)
                    }

                } catch (e: Exception) {
                    Log.e(TAG, "QR 스캔 결과 처리 오류", e)
                    showError("QR 코드 처리 중 오류가 발생했습니다.")
                    startScanning()
                }
            }
        }

        override fun possibleResultPoints(resultPoints: MutableList<ResultPoint>?) {
            // 스캔 포인트 표시 (선택적)
        }
    }

    /**
     * QR 코드 유효성 검증
     */
    private fun isValidQRCode(qrText: String): Boolean {
        return try {
            // 빈 문자열 체크
            if (qrText.trim().isEmpty()) {
                return false
            }

            // URL 형식 체크 (https:// 또는 http://)
            if (qrText.startsWith("http://") || qrText.startsWith("https://")) {
                return true
            }

            // 커스텀 스킴 체크 (jbsqr://)
            if (qrText.startsWith("jbsqr://")) {
                return true
            }

            // JB Safety 도메인 체크
            val allowedDomains = listOf(
                "jbsqr.com",
                "app.jbsqr.com",
                "jb-safety-education.firebaseapp.com",
                "jb-safety-education.web.app"
            )

            for (domain in allowedDomains) {
                if (qrText.contains(domain, ignoreCase = true)) {
                    return true
                }
            }

            // 강의 ID 패턴 체크 (예: LECTURE_12345)
            if (qrText.matches(Regex("^LECTURE_\\d+$"))) {
                return true
            }

            Log.w(TAG, "지원하지 않는 QR 코드 형식: $qrText")
            false

        } catch (e: Exception) {
            Log.e(TAG, "QR 코드 유효성 검증 오류", e)
            false
        }
    }

    /**
     * 스캔 성공 피드백 표시
     */
    private fun showSuccessFeedback() {
        try {
            // 진동 피드백
            val vibrator = getSystemService(VIBRATOR_SERVICE) as android.os.Vibrator
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                vibrator.vibrate(
                    android.os.VibrationEffect.createOneShot(200, android.os.VibrationEffect.DEFAULT_AMPLITUDE)
                )
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(200)
            }

            // 시각적 피드백
            binding.tvScanGuide.text = "✅ QR 코드 스캔 성공!"
            binding.tvScanGuide.setTextColor(ContextCompat.getColor(this, R.color.success))

        } catch (e: Exception) {
            Log.e(TAG, "성공 피드백 표시 오류", e)
        }
    }

    /**
     * 스캔 결과 처리
     */
    private fun handleScanResult(qrText: String) {
        try {
            Log.d(TAG, "스캔 결과 처리: $qrText")

            // 결과를 MainActivity로 전달
            val resultIntent = Intent().apply {
                putExtra(EXTRA_SCAN_RESULT, qrText)
            }

            setResult(RESULT_CODE_SUCCESS, resultIntent)

            // 1초 후 액티비티 종료 (피드백 표시 시간 확보)
            binding.root.postDelayed({
                finish()
            }, 1000)

        } catch (e: Exception) {
            Log.e(TAG, "스캔 결과 처리 오류", e)
            finishWithError("결과 처리 중 오류가 발생했습니다.")
        }
    }

    /**
     * 스캔 시작
     */
    private fun startScanning() {
        try {
            if (!isScanning) {
                Log.d(TAG, "QR 스캔 시작")
                isScanning = true
                barcodeView?.resume()
            }
        } catch (e: Exception) {
            Log.e(TAG, "스캔 시작 오류", e)
        }
    }

    /**
     * 스캔 중지
     */
    private fun stopScanning() {
        try {
            if (isScanning) {
                Log.d(TAG, "QR 스캔 중지")
                isScanning = false
                barcodeView?.pause()
            }
        } catch (e: Exception) {
            Log.e(TAG, "스캔 중지 오류", e)
        }
    }

    /**
     * 플래시 토글
     */
    private fun toggleFlash() {
        try {
            barcodeView?.let { scanner ->
                if (isFlashOn) {
                    scanner.setTorchOff()
                    binding.btnFlash.setImageResource(R.drawable.ic_flash_off)
                    isFlashOn = false
                    Log.d(TAG, "플래시 끔")
                } else {
                    scanner.setTorchOn()
                    binding.btnFlash.setImageResource(R.drawable.ic_flash_on)
                    isFlashOn = true
                    Log.d(TAG, "플래시 켬")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "플래시 토글 오류", e)
            Toast.makeText(this, "플래시 기능을 사용할 수 없습니다.", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * 오류 메시지 표시
     */
    private fun showError(message: String) {
        binding.tvScanGuide.text = "❌ $message"
        binding.tvScanGuide.setTextColor(ContextCompat.getColor(this, R.color.error))
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    /**
     * 취소로 액티비티 종료
     */
    private fun finishCancelled() {
        Log.d(TAG, "QR 스캔 취소됨")
        setResult(RESULT_CODE_CANCELLED)
        finish()
    }

    /**
     * 오류로 액티비티 종료
     */
    private fun finishWithError(errorMessage: String) {
        Log.e(TAG, "QR 스캔 오류: $errorMessage")

        val resultIntent = Intent().apply {
            putExtra(EXTRA_ERROR_MESSAGE, errorMessage)
        }

        setResult(RESULT_CODE_ERROR, resultIntent)
        finish()
    }

    /**
     * 하드웨어 뒤로가기 버튼 처리
     */
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        return if (keyCode == KeyEvent.KEYCODE_BACK) {
            finishCancelled()
            true
        } else {
            super.onKeyDown(keyCode, event)
        }
    }

    /**
     * 액티비티 생명주기 관리
     */
    override fun onResume() {
        super.onResume()
        Log.d(TAG, "QRScannerActivity 재시작")

        if (::binding.isInitialized && barcodeView != null) {
            startScanning()
        }
    }

    override fun onPause() {
        super.onPause()
        Log.d(TAG, "QRScannerActivity 일시정지")
        stopScanning()
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "QRScannerActivity 소멸")

        try {
            // 플래시 끄기
            if (isFlashOn) {
                barcodeView?.setTorchOff()
            }

            // 스캐너 정리
            stopScanning()

        } catch (e: Exception) {
            Log.e(TAG, "QRScannerActivity 정리 오류", e)
        }
    }
}