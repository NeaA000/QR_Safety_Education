package com.jbsqr.safety.modules

import android.Manifest
import android.app.Activity
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.*
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.google.gson.JsonObject
import java.io.*
import java.text.SimpleDateFormat
import java.util.*

/**
 * 파일 저장 및 수료증 생성 모듈
 * 파일 다운로드, PDF 생성, 외부 저장소 관리
 */
class StorageModule(private val activity: Activity) {

    companion object {
        private const val TAG = "StorageModule"
        private const val STORAGE_PERMISSION_REQUEST = 3001
        private const val CERTIFICATE_FOLDER = "QR_Safety_Certificates"
    }

    private var downloadCallback: ((Int, String?) -> Unit)? = null
    private var permissionCallback: (() -> Unit)? = null
    private val downloadReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (DownloadManager.ACTION_DOWNLOAD_COMPLETE == intent?.action) {
                downloadCallback?.invoke(100, "다운로드 완료")
            }
        }
    }

    init {
        // 다운로드 완료 브로드캐스트 리시버 등록
        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        activity.registerReceiver(downloadReceiver, filter)
        Log.d(TAG, "StorageModule 초기화 완료")
    }

    /**
     * 파일 다운로드
     * @param url 다운로드할 파일 URL
     * @param filename 저장할 파일명
     * @param callback 진행률 콜백 (progress: Int, filePath: String?)
     */
    fun downloadFile(url: String, filename: String, callback: (Int, String?) -> Unit) {
        Log.d(TAG, "파일 다운로드 시작: $filename")
        this.downloadCallback = callback

        if (checkStoragePermission()) {
            startDownload(url, filename)
        } else {
            permissionCallback = { startDownload(url, filename) }
            requestStoragePermission()
        }
    }

    /**
     * 수료증 PDF 생성
     * @param certificateData 수료증 데이터 (JSON)
     * @param callback 생성 완료 콜백 (success: Boolean, filePath: String?)
     */
    fun generateCertificatePDF(
        certificateData: JsonObject,
        callback: (Boolean, String?) -> Unit
    ) {
        Log.d(TAG, "수료증 PDF 생성 시작")

        try {
            if (checkStoragePermission()) {
                createCertificatePDF(certificateData, callback)
            } else {
                permissionCallback = { createCertificatePDF(certificateData, callback) }
                requestStoragePermission()
            }
        } catch (e: Exception) {
            Log.e(TAG, "수료증 PDF 생성 오류", e)
            callback(false, null)
        }
    }

    /**
     * 실제 다운로드 시작
     */
    private fun startDownload(url: String, filename: String) {
        try {
            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setTitle("QR 안전교육 - $filename")
                setDescription("파일을 다운로드하고 있습니다...")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
                setAllowedOverMetered(true)
                setAllowedOverRoaming(true)
            }

            val downloadManager = activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val downloadId = downloadManager.enqueue(request)

            Log.d(TAG, "다운로드 시작: ID=$downloadId")
            downloadCallback?.invoke(0, "다운로드 시작")

        } catch (e: Exception) {
            Log.e(TAG, "다운로드 시작 오류", e)
            downloadCallback?.invoke(-1, "다운로드 오류: ${e.message}")
        }
    }

    /**
     * 수료증 PDF 실제 생성
     */
    private fun createCertificatePDF(
        certificateData: JsonObject,
        callback: (Boolean, String?) -> Unit
    ) {
        try {
            // PDF 문서 생성
            val pdfDocument = PdfDocument()
            val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // A4 크기
            val page = pdfDocument.startPage(pageInfo)
            val canvas = page.canvas

            // 수료증 디자인 그리기
            drawCertificate(canvas, certificateData)

            // 페이지 완료
            pdfDocument.finishPage(page)

            // 파일 저장
            val filename = "certificate_${System.currentTimeMillis()}.pdf"
            val filePath = savePDFToStorage(pdfDocument, filename)

            pdfDocument.close()

            if (filePath != null) {
                Log.d(TAG, "수료증 PDF 생성 완료: $filePath")
                callback(true, filePath)
            } else {
                Log.e(TAG, "수료증 PDF 저장 실패")
                callback(false, null)
            }

        } catch (e: Exception) {
            Log.e(TAG, "수료증 PDF 생성 오류", e)
            callback(false, null)
        }
    }

    /**
     * 수료증 디자인 그리기
     */
    private fun drawCertificate(canvas: Canvas, data: JsonObject) {
        val paint = Paint().apply {
            isAntiAlias = true
        }

        // 배경 색상
        canvas.drawColor(Color.WHITE)

        // 제목
        paint.apply {
            color = Color.parseColor("#1976D2")
            textSize = 32f
            typeface = Typeface.DEFAULT_BOLD
            textAlign = Paint.Align.CENTER
        }
        canvas.drawText("수료증", 297.5f, 100f, paint)
        canvas.drawText("Certificate of Completion", 297.5f, 140f, paint)

        // 구분선
        paint.apply {
            color = Color.parseColor("#FF9800")
            strokeWidth = 3f
        }
        canvas.drawLine(100f, 160f, 495f, 160f, paint)

        // 사용자 정보
        paint.apply {
            color = Color.BLACK
            textSize = 18f
            typeface = Typeface.DEFAULT
            textAlign = Paint.Align.LEFT
        }

        val userName = data.get("userName")?.asString ?: "사용자"
        val courseName = data.get("courseName")?.asString ?: "안전교육 과정"
        val completionDate = data.get("completionDate")?.asString ?: getCurrentDate()
        val certificateId = data.get("certificateId")?.asString ?: UUID.randomUUID().toString()

        canvas.drawText("성명: $userName", 100f, 220f, paint)
        canvas.drawText("과정명: $courseName", 100f, 260f, paint)
        canvas.drawText("수료일: $completionDate", 100f, 300f, paint)
        canvas.drawText("증서번호: $certificateId", 100f, 340f, paint)

        // 발급 정보
        paint.apply {
            textSize = 14f
            color = Color.GRAY
            textAlign = Paint.Align.CENTER
        }

        canvas.drawText("이 증서는 상기인이 안전교육을 성공적으로 이수하였음을 증명합니다.", 297.5f, 450f, paint)
        canvas.drawText("JBS QR Safety Education System", 297.5f, 500f, paint)
        canvas.drawText("발급일: ${getCurrentDate()}", 297.5f, 540f, paint)

        // QR 코드 영역 (선택적)
        drawQRCodePlaceholder(canvas, 450f, 600f)
    }

    /**
     * QR 코드 플레이스홀더 그리기
     */
    private fun drawQRCodePlaceholder(canvas: Canvas, x: Float, y: Float) {
        val paint = Paint().apply {
            color = Color.LTGRAY
            style = Paint.Style.STROKE
            strokeWidth = 2f
        }

        canvas.drawRect(x, y, x + 100f, y + 100f, paint)

        paint.apply {
            textSize = 10f
            textAlign = Paint.Align.CENTER
            style = Paint.Style.FILL
        }
        canvas.drawText("QR Code", x + 50f, y + 55f, paint)
    }

    /**
     * PDF를 저장소에 저장
     */
    private fun savePDFToStorage(pdfDocument: PdfDocument, filename: String): String? {
        return try {
            val file = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ (Scoped Storage)
                savePDFToMediaStore(pdfDocument, filename)
            } else {
                // Android 9 이하
                savePDFToExternalStorage(pdfDocument, filename)
            }
            file
        } catch (e: Exception) {
            Log.e(TAG, "PDF 저장 오류", e)
            null
        }
    }

    /**
     * MediaStore를 사용한 PDF 저장 (Android 10+)
     */
    private fun savePDFToMediaStore(pdfDocument: PdfDocument, filename: String): String? {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val resolver = activity.contentResolver
            val contentValues = android.content.ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
                put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOCUMENTS + "/$CERTIFICATE_FOLDER")
            }

            val uri = resolver.insert(MediaStore.Files.getContentUri("external"), contentValues)

            return uri?.let {
                resolver.openOutputStream(it).use { outputStream ->
                    pdfDocument.writeTo(outputStream)
                }
                it.toString()
            }
        }
        return null
    }

    /**
     * 외부 저장소에 PDF 저장 (Android 9 이하)
     */
    private fun savePDFToExternalStorage(pdfDocument: PdfDocument, filename: String): String? {
        val folder = File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS),
            CERTIFICATE_FOLDER
        )

        if (!folder.exists()) {
            folder.mkdirs()
        }

        val file = File(folder, filename)

        FileOutputStream(file).use { outputStream ->
            pdfDocument.writeTo(outputStream)
        }

        return file.absolutePath
    }

    /**
     * 현재 날짜 문자열 반환
     */
    private fun getCurrentDate(): String {
        val sdf = SimpleDateFormat("yyyy년 MM월 dd일", Locale.KOREA)
        return sdf.format(Date())
    }

    /**
     * 저장소 권한 확인
     */
    private fun checkStoragePermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Android 10+에서는 Scoped Storage 사용
            true
        } else {
            ContextCompat.checkSelfPermission(
                activity,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED
        }
    }

    /**
     * 저장소 권한 요청
     */
    private fun requestStoragePermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE),
                STORAGE_PERMISSION_REQUEST
            )
        }
    }

    /**
     * 권한 요청 결과 처리
     */
    fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        when (requestCode) {
            STORAGE_PERMISSION_REQUEST -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    Log.d(TAG, "저장소 권한 승인됨")
                    permissionCallback?.invoke()
                } else {
                    Log.w(TAG, "저장소 권한 거부됨")
                    downloadCallback?.invoke(-1, "저장소 권한이 필요합니다")
                }
                permissionCallback = null
            }
        }
    }

    /**
     * 액티비티 결과 처리
     */
    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        // 파일 선택 결과 처리 등 (필요시 구현)
    }

    /**
     * 파일 공유
     */
    fun shareFile(filePath: String, mimeType: String = "application/pdf") {
        try {
            val file = File(filePath)
            val uri = FileProvider.getUriForFile(
                activity,
                "${activity.packageName}.fileprovider",
                file
            )

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = mimeType
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            activity.startActivity(Intent.createChooser(shareIntent, "파일 공유"))
        } catch (e: Exception) {
            Log.e(TAG, "파일 공유 오류", e)
        }
    }

    /**
     * 리소스 정리
     */
    fun cleanup() {
        Log.d(TAG, "StorageModule 리소스 정리")
        try {
            activity.unregisterReceiver(downloadReceiver)
        } catch (e: Exception) {
            Log.w(TAG, "브로드캐스트 리시버 해제 오류", e)
        }
        downloadCallback = null
        permissionCallback = null
    }
}