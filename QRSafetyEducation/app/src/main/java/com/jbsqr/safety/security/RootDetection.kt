package com.jbsqr.safety.security

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import java.io.File
import java.io.BufferedReader
import java.io.InputStreamReader

/**
 * 루팅/탈옥 탐지 모듈
 * 다양한 방법으로 기기의 루팅 상태를 탐지
 * 보안이 중요한 앱에서 루팅된 기기 차단용
 */
class RootDetection(private val context: Context) {

    companion object {
        private const val TAG = "RootDetection"

        // 루팅 관련 앱 패키지명들
        private val ROOT_APPS = arrayOf(
            "com.noshufou.android.su",
            "com.thirdparty.superuser",
            "eu.chainfire.supersu",
            "com.koushikdutta.superuser",
            "com.zachspong.temprootremovejb",
            "com.ramdroid.appquarantine",
            "com.topjohnwu.magisk",
            "com.kingroot.kinguser",
            "com.kingo.root",
            "com.smedialink.oneclickroot",
            "com.zhiqupk.root.global",
            "com.alephzain.framaroot"
        )

        // SU 바이너리 경로들
        private val SU_PATHS = arrayOf(
            "/system/bin/su",
            "/system/xbin/su",
            "/sbin/su",
            "/system/su",
            "/system/bin/.ext/su",
            "/system/usr/we-need-root/su-backup",
            "/system/xbin/mu",
            "/su/bin/su",
            "/data/local/su",
            "/data/local/bin/su",
            "/data/local/xbin/su",
            "/system/app/Superuser.apk",
            "/system/app/SuperSU.apk",
            "/system/etc/init.d/99SuperSUDaemon",
            "/dev/com.koushikdutta.superuser.daemon/",
            "/system/etc/.has_su_daemon",
            "/system/etc/.installed_su_daemon",
            "/system/bin/.ext/.su",
            "/system/usr/we-need-root/"
        )

        // 위험한 시스템 속성들
        private val DANGEROUS_PROPS = arrayOf(
            "ro.debuggable" to "1",
            "ro.secure" to "0",
            "ro.build.selinux" to "0",
            "ro.build.tags" to "test-keys"
        )

        // 루팅 관련 파일들
        private val ROOT_FILES = arrayOf(
            "/system/app/Superuser.apk",
            "/system/app/SuperSU.apk",
            "/system/etc/init.d/99SuperSUDaemon",
            "/system/bin/.ext/.su",
            "/system/etc/.has_su_daemon",
            "/system/etc/.installed_su_daemon",
            "/dev/com.koushikdutta.superuser.daemon/"
        )
    }

    /**
     * 종합적인 루팅 탐지
     * @return 루팅 탐지 여부
     */
    fun isDeviceRooted(): Boolean {
        return try {
            Log.d(TAG, "루팅 탐지 시작")

            val results = mutableListOf<Boolean>()

            // 1. SU 바이너리 확인
            results.add(checkSUBinary())

            // 2. 루팅 앱 확인
            results.add(checkRootApps())

            // 3. 위험한 시스템 속성 확인
            results.add(checkDangerousProps())

            // 4. RW 권한 확인
            results.add(checkRWPaths())

            // 5. 테스트 키 확인
            results.add(checkTestKeys())

            // 6. BusyBox 확인
            results.add(checkBusyBox())

            // 7. 루팅 관련 파일 확인
            results.add(checkRootFiles())

            // 8. SU 명령어 실행 테스트
            results.add(checkSUCommand())

            val isRooted = results.any { it }
            Log.d(TAG, "루팅 탐지 결과: $isRooted (${results.count { it }}개 방법에서 탐지)")

            isRooted
        } catch (e: Exception) {
            Log.e(TAG, "루팅 탐지 중 오류", e)
            false
        }
    }

    /**
     * SU 바이너리 파일 존재 확인
     */
    private fun checkSUBinary(): Boolean {
        for (path in SU_PATHS) {
            if (File(path).exists()) {
                Log.d(TAG, "SU 바이너리 발견: $path")
                return true
            }
        }
        return false
    }

    /**
     * 루팅 관련 앱 설치 확인
     */
    private fun checkRootApps(): Boolean {
        val packageManager = context.packageManager

        for (packageName in ROOT_APPS) {
            try {
                packageManager.getPackageInfo(packageName, 0)
                Log.d(TAG, "루팅 앱 발견: $packageName")
                return true
            } catch (e: PackageManager.NameNotFoundException) {
                // 패키지가 없음 - 정상
            }
        }
        return false
    }

    /**
     * 위험한 시스템 속성 확인
     */
    private fun checkDangerousProps(): Boolean {
        for ((prop, dangerousValue) in DANGEROUS_PROPS) {
            val value = getSystemProperty(prop)
            if (value == dangerousValue) {
                Log.d(TAG, "위험한 시스템 속성 발견: $prop=$value")
                return true
            }
        }
        return false
    }

    /**
     * 읽기/쓰기 권한 확인
     */
    private fun checkRWPaths(): Boolean {
        val paths = arrayOf("/system", "/system/bin", "/system/sbin", "/system/xbin", "/vendor/bin", "/sbin", "/etc")

        for (path in paths) {
            val file = File(path)
            if (file.exists() && file.canWrite()) {
                Log.d(TAG, "시스템 경로 쓰기 권한 발견: $path")
                return true
            }
        }
        return false
    }

    /**
     * 테스트 키로 빌드되었는지 확인
     */
    private fun checkTestKeys(): Boolean {
        val buildTags = Build.TAGS
        return if (buildTags != null && buildTags.contains("test-keys")) {
            Log.d(TAG, "테스트 키로 빌드된 시스템")
            true
        } else {
            false
        }
    }

    /**
     * BusyBox 확인
     */
    private fun checkBusyBox(): Boolean {
        return try {
            val process = Runtime.getRuntime().exec(arrayOf("which", "busybox"))
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val result = reader.readLine()

            if (result != null) {
                Log.d(TAG, "BusyBox 발견: $result")
                true
            } else {
                false
            }
        } catch (e: Exception) {
            false
        }
    }

    /**
     * 루팅 관련 파일 확인
     */
    private fun checkRootFiles(): Boolean {
        for (filePath in ROOT_FILES) {
            if (File(filePath).exists()) {
                Log.d(TAG, "루팅 관련 파일 발견: $filePath")
                return true
            }
        }
        return false
    }

    /**
     * SU 명령어 실행 테스트
     */
    private fun checkSUCommand(): Boolean {
        return try {
            val process = Runtime.getRuntime().exec("su")
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val result = reader.readLine()

            // SU 명령이 실행되면 루팅된 것
            Log.d(TAG, "SU 명령어 실행 가능")
            true
        } catch (e: Exception) {
            // SU 명령 실행 실패 - 정상
            false
        }
    }

    /**
     * 시스템 속성 값 가져오기
     */
    private fun getSystemProperty(name: String): String? {
        return try {
            val process = Runtime.getRuntime().exec("getprop $name")
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            reader.readLine()
        } catch (e: Exception) {
            try {
                val systemProperties = Class.forName("android.os.SystemProperties")
                val method = systemProperties.getMethod("get", String::class.java)
                method.invoke(null, name) as? String
            } catch (ex: Exception) {
                null
            }
        }
    }

    /**
     * Magisk 탐지 (고급 루팅 도구)
     */
    fun checkMagisk(): Boolean {
        return try {
            // Magisk 관련 파일 확인
            val magiskPaths = arrayOf(
                "/sbin/.magisk",
                "/sbin/magisk",
                "/system/addon.d/99-magisk.sh",
                "/data/adb/magisk",
                "/data/adb/magisk.img",
                "/data/adb/magisk_simple"
            )

            for (path in magiskPaths) {
                if (File(path).exists()) {
                    Log.d(TAG, "Magisk 관련 파일 발견: $path")
                    return true
                }
            }

            // Magisk 앱 확인
            try {
                context.packageManager.getPackageInfo("com.topjohnwu.magisk", 0)
                Log.d(TAG, "Magisk 앱 발견")
                return true
            } catch (e: PackageManager.NameNotFoundException) {
                // 없음
            }

            false
        } catch (e: Exception) {
            Log.e(TAG, "Magisk 탐지 오류", e)
            false
        }
    }

    /**
     * Xposed Framework 탐지
     */
    fun checkXposed(): Boolean {
        return try {
            // Xposed 관련 스택 트레이스 확인
            val stackTraces = Thread.getAllStackTraces()
            for ((thread, _) in stackTraces) {
                if (thread.name.contains("Xposed")) {
                    Log.d(TAG, "Xposed 관련 스레드 발견")
                    return true
                }
            }

            // Xposed 관련 클래스 확인
            try {
                Class.forName("de.robv.android.xposed.XposedHelpers")
                Log.d(TAG, "Xposed 클래스 발견")
                return true
            } catch (e: ClassNotFoundException) {
                // 없음
            }

            false
        } catch (e: Exception) {
            Log.e(TAG, "Xposed 탐지 오류", e)
            false
        }
    }

    /**
     * 상세한 루팅 정보 반환
     */
    fun getRootDetectionDetails(): Map<String, Any> {
        return mapOf(
            "suBinaryFound" to checkSUBinary(),
            "rootAppsFound" to checkRootApps(),
            "dangerousPropsFound" to checkDangerousProps(),
            "rwPathsFound" to checkRWPaths(),
            "testKeysFound" to checkTestKeys(),
            "busyBoxFound" to checkBusyBox(),
            "rootFilesFound" to checkRootFiles(),
            "suCommandExecutable" to checkSUCommand(),
            "magiskDetected" to checkMagisk(),
            "xposedDetected" to checkXposed(),
            "overallRootDetected" to isDeviceRooted()
        )
    }

    /**
     * 루팅 우회 시도 탐지
     */
    fun detectRootCloaking(): Boolean {
        return try {
            // 루팅 숨김 앱들 확인
            val cloakingApps = arrayOf(
                "com.devadvance.rootcloak",
                "com.devadvance.rootcloakplus",
                "de.robv.android.xposed.installer",
                "com.saurik.substrate",
                "com.amphoras.hidemyroot",
                "com.amphoras.hidemyrootadfree",
                "com.formyhm.hiderootPremium",
                "com.zachspong.temprootremovejb"
            )

            val packageManager = context.packageManager
            for (packageName in cloakingApps) {
                try {
                    packageManager.getPackageInfo(packageName, 0)
                    Log.d(TAG, "루팅 숨김 앱 발견: $packageName")
                    return true
                } catch (e: PackageManager.NameNotFoundException) {
                    // 패키지가 없음
                }
            }

            false
        } catch (e: Exception) {
            Log.e(TAG, "루팅 우회 탐지 오류", e)
            false
        }
    }
}