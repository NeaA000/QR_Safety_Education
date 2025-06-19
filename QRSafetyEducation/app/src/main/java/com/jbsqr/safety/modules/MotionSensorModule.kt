package com.jbsqr.safety.modules

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.util.Log
import kotlin.math.sqrt

/**
 * 기기 흔들림 감지 모듈
 * 가속도 센서를 사용하여 기기 움직임 감지 (안전교육 중 자동 일시정지용)
 */
class MotionSensorModule(private val context: Context) : SensorEventListener {

    companion object {
        private const val TAG = "MotionSensorModule"
        private const val SHAKE_THRESHOLD = 12.0 // 흔들림 감지 임계값
        private const val SHAKE_TIME_THRESHOLD = 500 // 흔들림 지속 시간 (ms)
        private const val SHAKE_COUNT_RESET_TIME = 3000 // 흔들림 카운트 리셋 시간 (ms)
    }

    private val sensorManager: SensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val accelerometer: Sensor? = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

    private var motionCallback: ((Boolean) -> Unit)? = null
    private var isMonitoring = false
    private var lastShakeTime = 0L
    private var shakeCount = 0
    private var lastAcceleration = 0.0
    private var currentAcceleration = 0.0
    private var lastUpdate = 0L

    /**
     * 기기 흔들림 감지 시작
     * @param callback 흔들림 상태 콜백 (true: 흔들림 감지, false: 정상)
     */
    fun startMotionDetection(callback: (Boolean) -> Unit) {
        Log.d(TAG, "기기 흔들림 감지 시작")

        this.motionCallback = callback

        if (accelerometer != null) {
            isMonitoring = true
            lastAcceleration = SensorManager.GRAVITY_EARTH.toDouble()
            currentAcceleration = SensorManager.GRAVITY_EARTH.toDouble()

            // 센서 등록 (SENSOR_DELAY_UI: 60Hz 정도)
            val registered = sensorManager.registerListener(
                this,
                accelerometer,
                SensorManager.SENSOR_DELAY_UI
            )

            if (registered) {
                Log.d(TAG, "가속도 센서 등록 성공")
            } else {
                Log.e(TAG, "가속도 센서 등록 실패")
                motionCallback?.invoke(false)
            }
        } else {
            Log.e(TAG, "가속도 센서를 사용할 수 없습니다")
            motionCallback?.invoke(false)
        }
    }

    /**
     * 기기 흔들림 감지 중지
     */
    fun stopMotionDetection() {
        Log.d(TAG, "기기 흔들림 감지 중지")

        if (isMonitoring) {
            sensorManager.unregisterListener(this)
            isMonitoring = false
            motionCallback = null

            // 상태 초기화
            lastShakeTime = 0L
            shakeCount = 0
            lastAcceleration = 0.0
            currentAcceleration = 0.0
            lastUpdate = 0L
        }
    }

    /**
     * 센서 값 변경 시 호출
     */
    override fun onSensorChanged(event: SensorEvent?) {
        if (event?.sensor?.type == Sensor.TYPE_ACCELEROMETER && isMonitoring) {
            val currentTime = System.currentTimeMillis()

            // 100ms마다 한 번씩 처리 (성능 최적화)
            if ((currentTime - lastUpdate) > 100) {
                val timeDiff = currentTime - lastUpdate
                lastUpdate = currentTime

                val x = event.values[0].toDouble()
                val y = event.values[1].toDouble()
                val z = event.values[2].toDouble()

                // 현재 가속도 계산
                lastAcceleration = currentAcceleration
                currentAcceleration = sqrt(x * x + y * y + z * z)
                val delta = currentAcceleration - lastAcceleration

                // 가속도 변화량이 임계값을 초과하면 흔들림으로 판단
                if (delta > SHAKE_THRESHOLD) {
                    if (currentTime - lastShakeTime > SHAKE_TIME_THRESHOLD) {
                        Log.d(TAG, "흔들림 감지: delta=$delta, threshold=$SHAKE_THRESHOLD")

                        lastShakeTime = currentTime
                        shakeCount++

                        // 흔들림 감지 콜백 호출
                        motionCallback?.invoke(true)

                        // 1초 후 자동으로 정상 상태로 복귀
                        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                            if (isMonitoring) {
                                motionCallback?.invoke(false)
                            }
                        }, 1000)
                    }
                }

                // 흔들림 카운트 리셋
                if (currentTime - lastShakeTime > SHAKE_COUNT_RESET_TIME) {
                    shakeCount = 0
                }
            }
        }
    }

    /**
     * 센서 정확도 변경 시 호출
     */
    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        when (accuracy) {
            SensorManager.SENSOR_STATUS_NO_CONTACT -> {
                Log.w(TAG, "센서 접촉 불량")
            }
            SensorManager.SENSOR_STATUS_UNRELIABLE -> {
                Log.w(TAG, "센서 데이터 불안정")
            }
            SensorManager.SENSOR_STATUS_ACCURACY_LOW -> {
                Log.d(TAG, "센서 정확도 낮음")
            }
            SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM -> {
                Log.d(TAG, "센서 정확도 보통")
            }
            SensorManager.SENSOR_STATUS_ACCURACY_HIGH -> {
                Log.d(TAG, "센서 정확도 높음")
            }
        }
    }

    /**
     * 현재 흔들림 상태 확인
     */
    fun isCurrentlyShaking(): Boolean {
        val currentTime = System.currentTimeMillis()
        return (currentTime - lastShakeTime) < SHAKE_TIME_THRESHOLD
    }

    /**
     * 흔들림 감지 통계 정보
     */
    fun getShakeStatistics(): Map<String, Any> {
        return mapOf(
            "isMonitoring" to isMonitoring,
            "shakeCount" to shakeCount,
            "lastShakeTime" to lastShakeTime,
            "currentAcceleration" to currentAcceleration,
            "threshold" to SHAKE_THRESHOLD
        )
    }

    /**
     * 흔들림 감지 설정 업데이트 (선택적)
     */
    fun updateSensitivity(newThreshold: Double) {
        Log.d(TAG, "흔들림 감지 민감도 변경: $SHAKE_THRESHOLD -> $newThreshold")
        // 실제로는 companion object의 값을 변경할 수 없으므로
        // 필요하다면 인스턴스 변수로 관리
    }

    /**
     * 가속도 센서 사용 가능 여부 확인
     */
    fun isAccelerometerAvailable(): Boolean {
        return accelerometer != null
    }

    /**
     * 리소스 정리
     */
    fun cleanup() {
        Log.d(TAG, "MotionSensorModule 리소스 정리")
        stopMotionDetection()
    }
}