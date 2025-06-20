// src/stores/learning.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type DocumentData,
  type QuerySnapshot
} from 'firebase/firestore'
import { getFirebaseDb } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore, type Enrollment } from '@/stores/courses'

// 학습 진행 관련 타입
export interface LearningProgress {
  enrollmentId: string
  courseId: string
  courseTitle: string
  currentLectureId?: string
  currentLectureTitle?: string
  totalLectures: number
  completedLectures: string[]
  progress: number // 0-100
  totalWatchTime: number // 초 단위
  lastAccessedAt: Date
  startedAt: Date
  completedAt?: Date
  nextLectureId?: string
}

export interface LectureProgress {
  lectureId: string
  lectureTitle: string
  duration: number // 총 길이 (초)
  watchedTime: number // 시청 시간 (초)
  progress: number // 0-100
  isCompleted: boolean
  lastPosition: number // 마지막 재생 위치 (초)
  completedAt?: Date
  quiz?: QuizProgress
}

export interface QuizProgress {
  quizId: string
  questions: number
  correctAnswers: number
  score: number
  attempts: number
  bestScore: number
  completedAt?: Date
}

export interface Certificate {
  id: string
  userId: string
  courseId: string
  courseTitle: string
  userName: string
  issueDate: Date
  certificateNumber: string
  status: 'pending' | 'issued' | 'revoked'
  verificationCode: string
  pdfUrl?: string
}

export interface LearningStats {
  totalCourses: number
  completedCourses: number
  inProgressCourses: number
  totalWatchTime: number // 분 단위
  averageProgress: number
  completionRate: number
  currentStreak: number
  longestStreak: number
  certificatesEarned: number
  lastStudyDate?: Date
}

export const useLearningStore = defineStore('learning', () => {
  const authStore = useAuthStore()
  const courseStore = useCourseStore()

  // 상태
  const learningProgress = ref<LearningProgress[]>([])
  const lectureProgress = ref<Map<string, LectureProgress>>(new Map())
  const certificates = ref<Certificate[]>([])
  const currentLearning = ref<LearningProgress | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Firebase DB 헬퍼
  const getDb = async () => {
    try {
      return await getFirebaseDb()
    } catch (err) {
      console.error('Firebase DB 연결 실패:', err)
      throw new Error('데이터베이스 연결에 실패했습니다.')
    }
  }

  // 계산된 속성
  const myLearnings = computed(() => {
    return learningProgress.value.sort((a, b) =>
      b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime()
    )
  })

  const inProgressLearnings = computed(() =>
    learningProgress.value.filter(l => l.progress > 0 && l.progress < 100)
  )

  const completedLearnings = computed(() =>
    learningProgress.value.filter(l => l.progress === 100)
  )

  const learningStats = computed<LearningStats>(() => {
    const total = learningProgress.value.length
    const completed = completedLearnings.value.length
    const inProgress = inProgressLearnings.value.length

    const totalTime = learningProgress.value.reduce((sum, l) => sum + l.totalWatchTime, 0)
    const avgProgress = total > 0
      ? learningProgress.value.reduce((sum, l) => sum + l.progress, 0) / total
      : 0

    return {
      totalCourses: total,
      completedCourses: completed,
      inProgressCourses: inProgress,
      totalWatchTime: Math.round(totalTime / 60),
      averageProgress: Math.round(avgProgress),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      currentStreak: calculateCurrentStreak(),
      longestStreak: 0, // TODO: 구현
      certificatesEarned: certificates.value.length,
      lastStudyDate: getLastStudyDate()
    }
  })

  // 학습 진행 정보 로드
  const loadLearningProgress = async (): Promise<void> => {
    if (!authStore.user) return

    try {
      isLoading.value = true
      error.value = null

      // 등록된 강의 정보 가져오기
      await courseStore.loadEnrolledCourses()
      const enrollments = courseStore.enrolledCourses

      // 각 등록 정보를 학습 진행 정보로 변환
      learningProgress.value = enrollments.map(enrollment => ({
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        courseTitle: enrollment.courseName,
        totalLectures: enrollment.totalLectures,
        completedLectures: enrollment.completedLectures,
        progress: enrollment.progress,
        totalWatchTime: 0, // TODO: 실제 시청 시간 계산
        lastAccessedAt: enrollment.lastAccessedAt || enrollment.enrolledAt,
        startedAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt
      }))

    } catch (err: any) {
      console.error('학습 진행 정보 로드 실패:', err)
      error.value = err.message || '학습 정보를 불러오는데 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 강의 시작/재개
  const startLearning = async (courseId: string): Promise<void> => {
    try {
      const learning = learningProgress.value.find(l => l.courseId === courseId)
      if (!learning) {
        throw new Error('등록되지 않은 강의입니다.')
      }

      currentLearning.value = learning

      // 마지막 접근 시간 업데이트
      const db = await getDb()
      const enrollment = courseStore.enrolledCourses.find(e => e.courseId === courseId)
      if (enrollment) {
        await updateDoc(doc(db, 'enrollments', enrollment.id), {
          lastAccessedAt: serverTimestamp()
        })
      }

    } catch (err: any) {
      console.error('학습 시작 실패:', err)
      error.value = err.message
      throw err
    }
  }

  // 강의 진도 업데이트
  const updateLectureProgress = async (
    courseId: string,
    lectureId: string,
    watchedTime: number,
    totalDuration: number
  ): Promise<void> => {
    try {
      const progress = Math.min(100, Math.round((watchedTime / totalDuration) * 100))

      // 로컬 상태 업데이트
      const lectureKey = `${courseId}-${lectureId}`
      lectureProgress.value.set(lectureKey, {
        lectureId,
        lectureTitle: '', // TODO: 실제 제목
        duration: totalDuration,
        watchedTime,
        progress,
        isCompleted: progress >= 95, // 95% 이상 시청 시 완료
        lastPosition: watchedTime
      })

      // 강의 완료 처리
      if (progress >= 95) {
        await markLectureComplete(courseId, lectureId)
      }

      // 전체 진도 계산 및 업데이트
      await updateCourseProgress(courseId)

    } catch (err: any) {
      console.error('강의 진도 업데이트 실패:', err)
      error.value = err.message
      throw err
    }
  }

  // 강의 완료 처리
  const markLectureComplete = async (courseId: string, lectureId: string): Promise<void> => {
    try {
      const learning = learningProgress.value.find(l => l.courseId === courseId)
      if (!learning) return

      // 이미 완료된 강의인지 확인
      if (learning.completedLectures.includes(lectureId)) return

      // 완료 목록에 추가
      learning.completedLectures.push(lectureId)

      // Firebase 업데이트
      await courseStore.updateCourseProgress(
        courseId,
        calculateCourseProgress(learning),
        lectureId
      )

    } catch (err: any) {
      console.error('강의 완료 처리 실패:', err)
      throw err
    }
  }

  // 코스 전체 진도 계산
  const calculateCourseProgress = (learning: LearningProgress): number => {
    if (learning.totalLectures === 0) return 0
    return Math.round((learning.completedLectures.length / learning.totalLectures) * 100)
  }

  // 코스 진도 업데이트
  const updateCourseProgress = async (courseId: string): Promise<void> => {
    const learning = learningProgress.value.find(l => l.courseId === courseId)
    if (!learning) return

    const progress = calculateCourseProgress(learning)
    learning.progress = progress

    // 코스 완료 처리
    if (progress === 100 && !learning.completedAt) {
      learning.completedAt = new Date()
      await requestCertificate(courseId)
    }
  }

  // 수료증 요청
  const requestCertificate = async (courseId: string): Promise<void> => {
    try {
      if (!authStore.user) return

      const db = await getDb()

      // 수료증 데이터 생성
      const certificateData = {
        userId: authStore.user.id,
        courseId,
        userName: authStore.user.displayName,
        issueDate: serverTimestamp(),
        certificateNumber: generateCertificateNumber(),
        status: 'issued' as const,
        verificationCode: generateVerificationCode()
      }

      // Firebase에 수료증 정보 저장
      const docRef = await collection(db, 'certificates').add(certificateData)

      // 로컬 상태 업데이트
      const learning = learningProgress.value.find(l => l.courseId === courseId)
      if (learning) {
        certificates.value.push({
          id: docRef.id,
          ...certificateData,
          courseTitle: learning.courseTitle,
          issueDate: new Date()
        } as Certificate)
      }

    } catch (err: any) {
      console.error('수료증 발급 실패:', err)
      throw err
    }
  }

  // 수료증 목록 로드
  const loadCertificates = async (): Promise<void> => {
    if (!authStore.user) return

    try {
      const db = await getDb()
      const q = query(
        collection(db, 'certificates'),
        where('userId', '==', authStore.user.id),
        orderBy('issueDate', 'desc')
      )

      const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

      certificates.value = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          issueDate: data.issueDate?.toDate()
        } as Certificate
      })

    } catch (err: any) {
      console.error('수료증 목록 로드 실패:', err)
      error.value = err.message
    }
  }

  // 헬퍼 함수들
  const calculateCurrentStreak = (): number => {
    // TODO: 연속 학습 일수 계산 로직
    return 0
  }

  const getLastStudyDate = (): Date | undefined => {
    if (learningProgress.value.length === 0) return undefined

    const dates = learningProgress.value
      .map(l => l.lastAccessedAt)
      .sort((a, b) => b.getTime() - a.getTime())

    return dates[0]
  }

  const generateCertificateNumber = (): string => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
    return `CERT-${year}-${random}`
  }

  const generateVerificationCode = (): string => {
    return Math.random().toString(36).substr(2, 9).toUpperCase()
  }

  // 초기화
  const initialize = async (): Promise<void> => {
    try {
      await Promise.all([
        loadLearningProgress(),
        loadCertificates()
      ])
    } catch (err) {
      console.error('Learning store 초기화 실패:', err)
      throw err
    }
  }

  return {
    // 상태
    learningProgress,
    lectureProgress,
    certificates,
    currentLearning,
    isLoading,
    error,

    // 계산된 속성
    myLearnings,
    inProgressLearnings,
    completedLearnings,
    learningStats,

    // 액션
    loadLearningProgress,
    startLearning,
    updateLectureProgress,
    markLectureComplete,
    loadCertificates,
    initialize
  }
})
