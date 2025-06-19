package com.jbsqr.safety.modules

import android.app.Activity
import android.content.Intent
import android.util.Log
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.UserProfileChangeRequest

/**
 * Firebase 인증 모듈
 * 구글 소셜 로그인 및 사용자 관리
 */
class AuthModule(private val activity: Activity) {

    companion object {
        private const val TAG = "AuthModule"
        private const val RC_SIGN_IN = 2001
    }

    private val firebaseAuth: FirebaseAuth = FirebaseAuth.getInstance()
    private val googleSignInClient: GoogleSignInClient

    private var authCallback: ((Boolean, Map<String, Any>?) -> Unit)? = null

    init {
        // Google Sign-In 설정
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken("jb-safety-education") // Firebase Console에서 가져온 웹 클라이언트 ID
            .requestEmail()
            .requestProfile()
            .build()

        googleSignInClient = GoogleSignIn.getClient(activity, gso)

        Log.d(TAG, "AuthModule 초기화 완료")
    }

    /**
     * 구글 소셜 로그인
     */
    fun signInWithGoogle(callback: (Boolean, Map<String, Any>?) -> Unit) {
        Log.d(TAG, "구글 로그인 시작")
        this.authCallback = callback

        val signInIntent = googleSignInClient.signInIntent
        activity.startActivityForResult(signInIntent, RC_SIGN_IN)
    }

    /**
     * 로그아웃
     */
    fun signOut(callback: (Boolean) -> Unit) {
        Log.d(TAG, "로그아웃 시작")

        try {
            // Firebase 로그아웃
            firebaseAuth.signOut()

            // Google 로그아웃
            googleSignInClient.signOut().addOnCompleteListener { task ->
                val success = task.isSuccessful
                Log.d(TAG, "로그아웃 완료: $success")
                callback(success)
            }
        } catch (e: Exception) {
            Log.e(TAG, "로그아웃 오류", e)
            callback(false)
        }
    }

    /**
     * 현재 로그인된 사용자 정보 가져오기
     */
    fun getCurrentUser(): Map<String, Any>? {
        val user = firebaseAuth.currentUser
        return if (user != null) {
            mapOf(
                "uid" to user.uid,
                "email" to (user.email ?: ""),
                "displayName" to (user.displayName ?: ""),
                "photoUrl" to (user.photoUrl?.toString() ?: ""),
                "isEmailVerified" to user.isEmailVerified,
                "phoneNumber" to (user.phoneNumber ?: ""),
                "providerId" to (user.providerId ?: ""),
                "metadata" to mapOf(
                    "creationTimestamp" to (user.metadata?.creationTimestamp ?: 0),
                    "lastSignInTimestamp" to (user.metadata?.lastSignInTimestamp ?: 0)
                )
            )
        } else {
            null
        }
    }

    /**
     * 사용자 프로필 업데이트
     */
    fun updateUserProfile(displayName: String?, photoUrl: String?, callback: (Boolean) -> Unit) {
        val user = firebaseAuth.currentUser
        if (user != null) {
            val profileUpdates = UserProfileChangeRequest.Builder()
                .apply {
                    displayName?.let { setDisplayName(it) }
                    photoUrl?.let { setPhotoUri(android.net.Uri.parse(it)) }
                }
                .build()

            user.updateProfile(profileUpdates)
                .addOnCompleteListener { task ->
                    val success = task.isSuccessful
                    Log.d(TAG, "프로필 업데이트: $success")
                    callback(success)
                }
        } else {
            Log.w(TAG, "로그인된 사용자가 없음")
            callback(false)
        }
    }

    /**
     * 이메일 인증 발송
     */
    fun sendEmailVerification(callback: (Boolean) -> Unit) {
        val user = firebaseAuth.currentUser
        if (user != null && !user.isEmailVerified) {
            user.sendEmailVerification()
                .addOnCompleteListener { task ->
                    val success = task.isSuccessful
                    Log.d(TAG, "이메일 인증 발송: $success")
                    callback(success)
                }
        } else {
            Log.w(TAG, "이메일 인증이 필요하지 않음")
            callback(false)
        }
    }

    /**
     * 로그인 상태 확인
     */
    fun isUserSignedIn(): Boolean {
        val user = firebaseAuth.currentUser
        val isSignedIn = user != null
        Log.d(TAG, "로그인 상태: $isSignedIn")
        return isSignedIn
    }

    /**
     * 액티비티 결과 처리
     */
    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == RC_SIGN_IN) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            try {
                val account = task.getResult(ApiException::class.java)
                Log.d(TAG, "구글 로그인 성공: ${account?.email}")
                firebaseAuthWithGoogle(account)
            } catch (e: ApiException) {
                Log.e(TAG, "구글 로그인 실패: ${e.statusCode}", e)
                authCallback?.invoke(false, mapOf("error" to "Google Sign-In failed: ${e.message}"))
                authCallback = null
            }
        }
    }

    /**
     * Firebase 인증 처리
     */
    private fun firebaseAuthWithGoogle(account: GoogleSignInAccount?) {
        if (account == null) {
            Log.e(TAG, "구글 계정 정보가 없음")
            authCallback?.invoke(false, mapOf("error" to "Google account is null"))
            authCallback = null
            return
        }

        Log.d(TAG, "Firebase 인증 시작")
        val credential = GoogleAuthProvider.getCredential(account.idToken, null)

        firebaseAuth.signInWithCredential(credential)
            .addOnCompleteListener(activity) { task ->
                if (task.isSuccessful) {
                    Log.d(TAG, "Firebase 인증 성공")
                    val user = firebaseAuth.currentUser
                    val userInfo = getCurrentUser()
                    authCallback?.invoke(true, userInfo)
                } else {
                    Log.e(TAG, "Firebase 인증 실패", task.exception)
                    authCallback?.invoke(false, mapOf("error" to "Firebase authentication failed: ${task.exception?.message}"))
                }
                authCallback = null
            }
    }

    /**
     * 인증 상태 리스너 등록
     */
    fun addAuthStateListener(listener: FirebaseAuth.AuthStateListener) {
        firebaseAuth.addAuthStateListener(listener)
    }

    /**
     * 인증 상태 리스너 제거
     */
    fun removeAuthStateListener(listener: FirebaseAuth.AuthStateListener) {
        firebaseAuth.removeAuthStateListener(listener)
    }

    /**
     * 사용자 계정 삭제
     */
    fun deleteUser(callback: (Boolean) -> Unit) {
        val user = firebaseAuth.currentUser
        if (user != null) {
            user.delete()
                .addOnCompleteListener { task ->
                    val success = task.isSuccessful
                    Log.d(TAG, "사용자 계정 삭제: $success")
                    callback(success)
                }
        } else {
            Log.w(TAG, "삭제할 사용자가 없음")
            callback(false)
        }
    }

    /**
     * 사용자 토큰 가져오기
     */
    fun getUserToken(callback: (String?) -> Unit) {
        val user = firebaseAuth.currentUser
        if (user != null) {
            user.getIdToken(true)
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        val token = task.result?.token
                        Log.d(TAG, "사용자 토큰 조회 성공")
                        callback(token)
                    } else {
                        Log.e(TAG, "사용자 토큰 조회 실패", task.exception)
                        callback(null)
                    }
                }
        } else {
            Log.w(TAG, "로그인된 사용자가 없음")
            callback(null)
        }
    }

    /**
     * 리소스 정리
     */
    fun cleanup() {
        Log.d(TAG, "AuthModule 리소스 정리")
        authCallback = null
    }
}