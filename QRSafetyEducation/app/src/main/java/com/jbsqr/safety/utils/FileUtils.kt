package com.jbsqr.safety.utils

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.util.Log
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.*
import java.text.SimpleDateFormat
import java.util.*
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/**
 * 파일 관리 유틸리티
 * 수료증 PDF 저장, 파일 공유, 캐시 관리 등
 */
object FileUtils {

    private const val TAG = "FileUtils"
    private const val AUTHORITY_SUFFIX = ".fileprovider"

    // 파일 타입별 MIME 타입
    private val MIME_TYPES = mapOf(
        "pdf" to "application/pdf",
        "jpg" to "image/jpeg",
        "jpeg" to "image/jpeg",
        "png" to "image/png",
        "txt" to "text/plain",
        "json" to "application/json",
        "zip" to "application/zip"
    )

    /**
     * 앱 전용 디렉토리 경로 가져오기
     */
    fun getAppDirectory(context: Context, type: DirectoryType): File {
        return when (type) {
            DirectoryType.CERTIFICATES -> File(context.filesDir, "certificates")
            DirectoryType.CACHE -> context.cacheDir
            DirectoryType.TEMP -> File(context.cacheDir, "temp")
            DirectoryType.LOGS -> File(context.filesDir, "logs")
            DirectoryType.DOWNLOADS -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "")
            } else {
                File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "JBSafety")
            }
        }.also { dir ->
            if (!dir.exists()) {
                dir.mkdirs()
                Log.d(TAG, "디렉토리 생성: ${dir.absolutePath}")
            }
        }
    }

    /**
     * 디렉토리 타입 열거형
     */
    enum class DirectoryType {
        CERTIFICATES,  // 수료증 저장
        CACHE,        // 캐시 파일
        TEMP,         // 임시 파일
        LOGS,         // 로그 파일
        DOWNLOADS     // 다운로드 파일
    }

    /**
     * 파일 저장 (안전한 방식)
     */
    suspend fun saveFile(
        context: Context,
        data: ByteArray,
        fileName: String,
        directoryType: DirectoryType
    ): File? = withContext(Dispatchers.IO) {
        try {
            val directory = getAppDirectory(context, directoryType)
            val file = File(directory, fileName)

            // 기존 파일이 있으면 백업
            if (file.exists()) {
                val backupFile = File(directory, "${fileName}.backup")
                file.copyTo(backupFile, overwrite = true)
                Log.d(TAG, "기존 파일 백업: ${backupFile.absolutePath}")
            }

            // 파일 저장
            FileOutputStream(file).use { fos ->
                fos.write(data)
                fos.flush()
            }

            Log.d(TAG, "파일 저장 완료: ${file.absolutePath} (${data.size} bytes)")
            file
        } catch (e: Exception) {
            Log.e(TAG, "파일 저장 오류: $fileName", e)
            null
        }
    }

    /**
     * 파일 읽기
     */
    suspend fun readFile(file: File): ByteArray? = withContext(Dispatchers.IO) {
        try {
            if (!file.exists()) {
                Log.w(TAG, "파일이 존재하지 않음: ${file.absolutePath}")
                return@withContext null
            }

            FileInputStream(file).use { fis ->
                val data = fis.readBytes()
                Log.d(TAG, "파일 읽기 완료: ${file.absolutePath} (${data.size} bytes)")
                data
            }
        } catch (e: Exception) {
            Log.e(TAG, "파일 읽기 오류: ${file.absolutePath}", e)
            null
        }
    }

    /**
     * 텍스트 파일 저장
     */
    suspend fun saveTextFile(
        context: Context,
        content: String,
        fileName: String,
        directoryType: DirectoryType
    ): File? = withContext(Dispatchers.IO) {
        try {
            val data = content.toByteArray(Charsets.UTF_8)
            saveFile(context, data, fileName, directoryType)
        } catch (e: Exception) {
            Log.e(TAG, "텍스트 파일 저장 오류: $fileName", e)
            null
        }
    }

    /**
     * 텍스트 파일 읽기
     */
    suspend fun readTextFile(file: File): String? = withContext(Dispatchers.IO) {
        try {
            if (!file.exists()) {
                Log.w(TAG, "파일이 존재하지 않음: ${file.absolutePath}")
                return@withContext null
            }

            FileInputStream(file).use { fis ->
                val content = fis.readBytes().toString(Charsets.UTF_8)
                Log.d(TAG, "텍스트 파일 읽기 완료: ${file.absolutePath}")
                content
            }
        } catch (e: Exception) {
            Log.e(TAG, "텍스트 파일 읽기 오류: ${file.absolutePath}", e)
            null
        }
    }

    /**
     * 파일 공유하기
     */
    fun shareFile(context: Context, file: File, title: String = "파일 공유"): Boolean {
        return try {
            if (!file.exists()) {
                Log.w(TAG, "공유할 파일이 존재하지 않음: ${file.absolutePath}")
                return false
            }

            val authority = "${context.packageName}$AUTHORITY_SUFFIX"
            val uri = FileProvider.getUriForFile(context, authority, file)
            val mimeType = getMimeType(file.extension)

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = mimeType
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val chooserIntent = Intent.createChooser(shareIntent, title)
            chooserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(chooserIntent)

            Log.d(TAG, "파일 공유 시작: ${file.absolutePath}")
            true
        } catch (e: Exception) {
            Log.e(TAG, "파일 공유 오류: ${file.absolutePath}", e)
            false
        }
    }

    /**
     * 파일 확장자로 MIME 타입 가져오기
     */
    private fun getMimeType(extension: String): String {
        return MIME_TYPES[extension.lowercase()] ?: "application/octet-stream"
    }

    /**
     * 파일 크기를 읽기 쉬운 형태로 변환
     */
    fun formatFileSize(bytes: Long): String {
        return when {
            bytes < 1024 -> "$bytes B"
            bytes < 1024 * 1024 -> "${bytes / 1024} KB"
            bytes < 1024 * 1024 * 1024 -> "${bytes / (1024 * 1024)} MB"
            else -> "${bytes / (1024 * 1024 * 1024)} GB"
        }
    }

    /**
     * 파일명에 타임스탬프 추가
     */
    fun addTimestampToFileName(fileName: String): String {
        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val lastDotIndex = fileName.lastIndexOf('.')

        return if (lastDotIndex != -1) {
            val name = fileName.substring(0, lastDotIndex)
            val extension = fileName.substring(lastDotIndex)
            "${name}_$timestamp$extension"
        } else {
            "${fileName}_$timestamp"
        }
    }

    /**
     * 파일 삭제
     */
    fun deleteFile(file: File): Boolean {
        return try {
            if (file.exists()) {
                val deleted = file.delete()
                if (deleted) {
                    Log.d(TAG, "파일 삭제 완료: ${file.absolutePath}")
                } else {
                    Log.w(TAG, "파일 삭제 실패: ${file.absolutePath}")
                }
                deleted
            } else {
                Log.w(TAG, "삭제할 파일이 존재하지 않음: ${file.absolutePath}")
                true
            }
        } catch (e: Exception) {
            Log.e(TAG, "파일 삭제 오류: ${file.absolutePath}", e)
            false
        }
    }

    /**
     * 디렉토리 내 모든 파일 삭제
     */
    fun clearDirectory(directory: File): Boolean {
        return try {
            if (!directory.exists() || !directory.isDirectory) {
                Log.w(TAG, "삭제할 디렉토리가 존재하지 않음: ${directory.absolutePath}")
                return true
            }

            var allDeleted = true
            directory.listFiles()?.forEach { file ->
                if (file.isDirectory) {
                    allDeleted = clearDirectory(file) && allDeleted
                    allDeleted = file.delete() && allDeleted
                } else {
                    allDeleted = deleteFile(file) && allDeleted
                }
            }

            if (allDeleted) {
                Log.d(TAG, "디렉토리 정리 완료: ${directory.absolutePath}")
            } else {
                Log.w(TAG, "디렉토리 정리 중 일부 파일 삭제 실패: ${directory.absolutePath}")
            }

            allDeleted
        } catch (e: Exception) {
            Log.e(TAG, "디렉토리 정리 오류: ${directory.absolutePath}", e)
            false
        }
    }

    /**
     * 파일 압축 (ZIP)
     */
    suspend fun zipFiles(
        files: List<File>,
        outputFile: File
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            ZipOutputStream(FileOutputStream(outputFile)).use { zipOut ->
                files.forEach { file ->
                    if (file.exists()) {
                        FileInputStream(file).use { fis ->
                            val zipEntry = ZipEntry(file.name)
                            zipOut.putNextEntry(zipEntry)
                            fis.copyTo(zipOut)
                            zipOut.closeEntry()
                        }
                    }
                }
            }

            Log.d(TAG, "파일 압축 완료: ${outputFile.absolutePath}")
            true
        } catch (e: Exception) {
            Log.e(TAG, "파일 압축 오류", e)
            false
        }
    }

    /**
     * 캐시 정리
     */
    fun clearCache(context: Context): Long {
        return try {
            val cacheDir = getAppDirectory(context, DirectoryType.CACHE)
            val tempDir = getAppDirectory(context, DirectoryType.TEMP)

            var clearedBytes = 0L

            // 캐시 디렉토리 정리
            cacheDir.listFiles()?.forEach { file ->
                clearedBytes += file.length()
                deleteFile(file)
            }

            // 임시 디렉토리 정리
            tempDir.listFiles()?.forEach { file ->
                clearedBytes += file.length()
                deleteFile(file)
            }

            Log.d(TAG, "캐시 정리 완료: ${formatFileSize(clearedBytes)}")
            clearedBytes
        } catch (e: Exception) {
            Log.e(TAG, "캐시 정리 오류", e)
            0L
        }
    }

    /**
     * 오래된 파일 정리 (지정된 일수 이상)
     */
    fun cleanOldFiles(directory: File, maxDays: Int): Int {
        return try {
            if (!directory.exists() || !directory.isDirectory) {
                return 0
            }

            val cutoffTime = System.currentTimeMillis() - (maxDays * 24 * 60 * 60 * 1000L)
            var deletedCount = 0

            directory.listFiles()?.forEach { file ->
                if (file.lastModified() < cutoffTime) {
                    if (deleteFile(file)) {
                        deletedCount++
                    }
                }
            }

            Log.d(TAG, "오래된 파일 정리 완료: ${deletedCount}개 파일 삭제")
            deletedCount
        } catch (e: Exception) {
            Log.e(TAG, "오래된 파일 정리 오류", e)
            0
        }
    }

    /**
     * 디렉토리 크기 계산
     */
    fun getDirectorySize(directory: File): Long {
        return try {
            if (!directory.exists() || !directory.isDirectory) {
                return 0L
            }

            var size = 0L
            directory.listFiles()?.forEach { file ->
                size += if (file.isDirectory) {
                    getDirectorySize(file)
                } else {
                    file.length()
                }
            }

            size
        } catch (e: Exception) {
            Log.e(TAG, "디렉토리 크기 계산 오류", e)
            0L
        }
    }

    /**
     * 저장 공간 정보 반환
     */
    fun getStorageInfo(context: Context): Map<String, Any> {
        return try {
            val internalDir = context.filesDir
            val cacheDir = context.cacheDir
            val certificatesDir = getAppDirectory(context, DirectoryType.CERTIFICATES)

            mapOf(
                "internalStorage" to mapOf(
                    "totalSpace" to internalDir.totalSpace,
                    "freeSpace" to internalDir.freeSpace,
                    "usableSpace" to internalDir.usableSpace
                ),
                "appDirectories" to mapOf(
                    "certificatesSize" to getDirectorySize(certificatesDir),
                    "cacheSize" to getDirectorySize(cacheDir),
                    "totalAppSize" to getDirectorySize(context.filesDir)
                ),
                "formattedSizes" to mapOf(
                    "certificatesSize" to formatFileSize(getDirectorySize(certificatesDir)),
                    "cacheSize" to formatFileSize(getDirectorySize(cacheDir)),
                    "totalAppSize" to formatFileSize(getDirectorySize(context.filesDir))
                )
            )
        } catch (e: Exception) {
            Log.e(TAG, "저장 공간 정보 조회 오류", e)
            emptyMap()
        }
    }
}