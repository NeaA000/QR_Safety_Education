import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Lecture, Certificate } from '@/types/global'

// 강의 카테고리 타입
export type LectureCategory = 
  | 'fire'         // 화재 안전
  | 'firstaid'     // 응급처치
  | 'electric'     // 전기 안전
  | 'chemical'     // 화학 안전
  | 'height'       // 고소 작업
  | 'machinery'    // 기계 안전
  | 'construction' // 건설 안전
  | 'general'      // 일반 안전

// 강의 레벨 타입
export type LectureLevel = '초급' | '중급' | '고급'

// 강의 상태 타입
export type LectureStatus = 'not_started' | 'in_progress' | 'completed' | 'expired'

// 확장된 강의 인터페이스
interface ExtendedLecture extends Lecture {
  instructor: string
  thumbnailUrl: string
  progress: number
  level: LectureLevel
  status: LectureStatus
  tags: string[]
  requiredTime: number  // 최소 시청 시간 (초)
  hasQuiz: boolean
  quizPassScore: number
  expiresAt?: Date
  downloadUrl?: string
  subtitles?: {
    language: string
    url: string
  }[]
}

// 강의 진도 정보
interface LectureProgress {
  lectureId: string
  userId: string
  watchedTime: number    // 실제 시청 시간 (초)
  totalTime: number      // 전체 영상 길이 (초)
  progressPercent: number // 진도율 (%)
  lastWatchedAt: Date
  isCompleted: boolean
  quizScore?: number
  completedAt?: Date
}

// 강의 검색 필터
interface LectureFilter {
  category?: LectureCategory
  level?: LectureLevel
  status?: LectureStatus
  searchQuery?: string
  sortBy?: 'title' | 'createdAt' | 'progress' | 'duration'
  sortOrder?: 'asc' | 'desc'
}

// 강의 통계
interface LectureStats {
  totalLectures: number
  completedLectures: number
  inProgressLectures: number
  totalWatchTime: number  // 분 단위
  averageScore: number
  completionRate: number  // 완료율 (%)
}

export const useLectureStore = defineStore('lectures', () => {
  // 상태
  const lectures = ref<ExtendedLecture[]>([])
  const currentLecture = ref<ExtendedLecture | null>(null)
  const lectureProgress = ref<Map<string, LectureProgress>>(new Map())
  const certificates = ref<Certificate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filter = ref<LectureFilter>({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // 계산된 속성
  const isLoading = computed(() => loading.value)
  const lectureError = computed(() => error.value)
  
  const filteredLectures = computed(() => {
    let result = [...lectures.value]

    // 검색어 필터링
    if (filter.value.searchQuery) {
      const query = filter.value.searchQuery.toLowerCase()
      result = result.filter(lecture => 
        lecture.title.toLowerCase().includes(query) ||
        lecture.instructor.toLowerCase().includes(query) ||
        lecture.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // 카테고리 필터링
    if (filter.value.category) {
      result = result.filter(lecture => lecture.category === filter.value.category)
    }

    // 레벨 필터링
    if (filter.value.level) {
      result = result.filter(lecture => lecture.level === filter.value.level)
    }

    // 상태 필터링
    if (filter.value.status) {
      result = result.filter(lecture => lecture.status === filter.value.status)
    }

    // 정렬
    if (filter.value.sortBy) {
      result.sort((a, b) => {
        const aValue = a[filter.value.sortBy as keyof ExtendedLecture]
        const bValue = b[filter.value.sortBy as keyof ExtendedLecture]
        
        if (filter.value.sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1
        } else {
          return aValue > bValue ? 1 : -1
        }
      })
    }

    return result
  })

  const lectureStats = computed((): LectureStats => {
    const total = lectures.value.length
    const completed = lectures.value.filter(l => l.status === 'completed').length
    const inProgress = lectures.value.filter(l => l.status === 'in_progress').length
    
    const totalWatchTime = Array.from(lectureProgress.value.values())
      .reduce((sum, progress) => sum + progress.watchedTime, 0) / 60 // 분 단위 변환
    
    const scoresWithQuiz = certificates.value
      .map(cert => lectureProgress.value.get(cert.lectureId))
      .filter(progress => progress?.quizScore !== undefined)
      .map(progress => progress!.quizScore!)
    
    const averageScore = scoresWithQuiz.length > 0 
      ? scoresWithQuiz.reduce((sum, score) => sum + score, 0) / scoresWithQuiz.length 
      : 0

    return {
      totalLectures: total,
      completedLectures: completed,
      inProgressLectures: inProgress,
      totalWatchTime: Math.round(totalWatchTime),
      averageScore: Math.round(averageScore),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  })

  const recentLectures = computed(() => {
    return lectures.value
      .filter(lecture => lecture.status === 'in_progress' || lecture.status === 'completed')
      .sort((a, b) => {
        const aProgress = lectureProgress.value.get(a.id)
        const bProgress = lectureProgress.value.get(b.id)
        const aDate = aProgress?.lastWatchedAt || new Date(0)
        const bDate = bProgress?.lastWatchedAt || new Date(0)
        return bDate.getTime() - aDate.getTime()
      })
      .slice(0, 5)
  })

  // 액션
  const fetchLectures = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      // TODO: 실제 API 호출
      // const response = await api.get('/lectures')
      // lectures.value = response.data

      // 임시 데이터
      lectures.value = [
        {
          id: '1',
          title: '화재 안전 기초 교육',
          description: '사업장에서 발생할 수 있는 화재 위험요소와 예방법, 대응 방법을 학습합니다.',
          duration: 1800, // 30분
          videoUrl: 'https://example.com/videos/fire-safety-basic.mp4',
          thumbnailUrl: '/images/lectures/fire-safety-basic.jpg',
          category: 'fire',
          instructor: '김안전',
          progress: 75,
          level: '초급',
          status: 'in_progress',
          tags: ['화재', '소화기', '비상대피'],
          requiredTime: 1620, // 27분 (90% 이상 시청 필요)
          hasQuiz: true,
          quizPassScore: 80,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          subtitles: [
            { language: 'ko', url: '/subtitles/fire-safety-basic-ko.vtt' },
            { language: 'en', url: '/subtitles/fire-safety-basic-en.vtt' },
            { language: 'vi', url: '/subtitles/fire-safety-basic-vi.vtt' }
          ]
        },
        {
          id: '2',
          title: '응급처치 요령',
          description: '응급상황 발생 시 기본적인 응급처치 방법과 119 신고 요령을 익힙니다.',
          duration: 2400, // 40분
          videoUrl: 'https://example.com/videos/first-aid.mp4',
          thumbnailUrl: '/images/lectures/first-aid.jpg',
          category: 'firstaid',
          instructor: '박의료',
          progress: 100,
          level: '중급',
          status: 'completed',
          tags: ['응급처치', 'CPR', '상처치료'],
          requiredTime: 2160, // 36분
          hasQuiz: true,
          quizPassScore: 85,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
          subtitles: [
            { language: 'ko', url: '/subtitles/first-aid-ko.vtt' }
          ]
        },
        {
          id: '3',
          title: '전기 안전 관리',
          description: '전기 설비 작업 시 안전 수칙과 감전 사고 예방법을 학습합니다.',
          duration: 2100, // 35분
          videoUrl: 'https://example.com/videos/electric-safety.mp4',
          thumbnailUrl: '/images/lectures/electric-safety.jpg',
          category: 'electric',
          instructor: '이전기',
          progress: 0,
          level: '고급',
          status: 'not_started',
          tags: ['전기', '감전', '정전작업'],
          requiredTime: 1890, // 31.5분
          hasQuiz: true,
          quizPassScore: 90,
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-20')
        }
      ]

      console.log('강의 목록 로드 완료:', lectures.value.length, '개')

    } catch (err: any) {
      error.value = err.message || '강의 목록을 불러오는데 실패했습니다.'
      console.error('강의 목록 로드 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchLectureById = async (id: string): Promise<ExtendedLecture | null> => {
    try {
      const lecture = lectures.value.find(l => l.id === id)
      if (lecture) {
        currentLecture.value = lecture
        return lecture
      }

      // TODO: API에서 개별 강의 데이터 가져오기
      // const response = await api.get(`/lectures/${id}`)
      // currentLecture.value = response.data
      // return response.data

      return null
    } catch (err: any) {
      error.value = err.message || '강의 정보를 불러오는데 실패했습니다.'
      console.error('강의 정보 로드 실패:', err)
      throw err
    }
  }

  const updateProgress = async (lectureId: string, watchedTime: number): Promise<void> => {
    try {
      const lecture = lectures.value.find(l => l.id === lectureId)
      if (!lecture) return

      const progressPercent = Math.min(Math.round((watchedTime / lecture.duration) * 100), 100)
      const isCompleted = watchedTime >= lecture.requiredTime && progressPercent >= 90

      const progress: LectureProgress = {
        lectureId,
        userId: 'current-user', // TODO: 실제 사용자 ID
        watchedTime,
        totalTime: lecture.duration,
        progressPercent,
        lastWatchedAt: new Date(),
        isCompleted
      }

      if (isCompleted && !lectureProgress.value.get(lectureId)?.isCompleted) {
        progress.completedAt = new Date()
        lecture.status = 'completed'
        
        // 수료증 자동 생성
        await generateCertificate(lectureId)
      } else if (progressPercent > 0) {
        lecture.status = 'in_progress'
      }

      lecture.progress = progressPercent
      lectureProgress.value.set(lectureId, progress)

      // TODO: 서버에 진도 정보 전송
      // await api.post(`/lectures/${lectureId}/progress`, progress)

      console.log('진도 업데이트:', lectureId, progressPercent + '%')

    } catch (err: any) {
      error.value = err.message || '진도 업데이트에 실패했습니다.'
      console.error('진도 업데이트 실패:', err)
      throw err
    }
  }

  const generateCertificate = async (lectureId: string): Promise<Certificate> => {
    try {
      const lecture = lectures.value.find(l => l.id === lectureId)
      if (!lecture) throw new Error('강의를 찾을 수 없습니다.')

      const certificate: Certificate = {
        id: `cert_${lectureId}_${Date.now()}`,
        userId: 'current-user', // TODO: 실제 사용자 ID
        lectureId,
        issuedAt: new Date(),
        certificateNumber: `QR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
      }

      certificates.value.push(certificate)

      // TODO: 서버에서 PDF 생성 및 저장
      // const response = await api.post(`/certificates/generate`, certificate)
      // certificate.pdfUrl = response.data.pdfUrl

      console.log('수료증 생성 완료:', certificate.certificateNumber)
      return certificate

    } catch (err: any) {
      error.value = err.message || '수료증 생성에 실패했습니다.'
      console.error('수료증 생성 실패:', err)
      throw err
    }
  }

  const setFilter = (newFilter: Partial<LectureFilter>): void => {
    filter.value = { ...filter.value, ...newFilter }
  }

  const clearFilter = (): void => {
    filter.value = {
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
  }

  const resetError = (): void => {
    error.value = null
  }

  // 초기화
  const initialize = async (): Promise<void> => {
    await fetchLectures()
  }

  return {
    // 상태
    lectures,
    currentLecture,
    lectureProgress,
    certificates,
    loading,
    error,
    filter,

    // 계산된 속성
    isLoading,
    lectureError,
    filteredLectures,
    lectureStats,
    recentLectures,

    // 액션
    fetchLectures,
    fetchLectureById,
    updateProgress,
    generateCertificate,
    setFilter,
    clearFilter,
    resetError,
    initialize
  }
})