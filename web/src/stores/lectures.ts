// src/stores/lectures.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Lecture, Certificate } from '@/types/global'
import type { MainCategory, MiddleCategory, LeafCategory } from '@/types/category'

// 확장된 강의 타입 (3단계 카테고리 추가)
export interface ExtendedLecture extends Lecture {
  enrolledAt?: Date
  expiresAt?: Date
  lastAccessedAt?: Date
  completedChapters?: number[]
  certificates?: Certificate[]
  mainCategory?: MainCategory
  middleCategory?: MiddleCategory
  leafCategory?: LeafCategory
}

// 카테고리 타입
export type LectureCategory = 'safety' | 'technology' | 'management' | 'legal' | 'other'

// 레벨 타입
export type LectureLevel = '초급' | '중급' | '고급'

// 상태 타입
export type LectureStatus = 'not_started' | 'in_progress' | 'completed' | 'expired'

// 필터 인터페이스 (3단계 카테고리 추가)
export interface LectureFilter {
  category?: LectureCategory
  level?: LectureLevel
  status?: LectureStatus
  searchQuery?: string
  sortBy?: 'title' | 'createdAt' | 'progress' | 'duration'
  sortOrder?: 'asc' | 'desc'
  mainCategory?: MainCategory
  middleCategory?: MiddleCategory
  leafCategory?: LeafCategory
}

// 통계 인터페이스
export interface LectureStats {
  totalLectures: number
  completedLectures: number
  inProgressLectures: number
  totalWatchTime: number
  averageProgress: number
  completionRate: number
}

export const useLectureStore = defineStore('lectures', () => {
  // 상태
  const lectures = ref<ExtendedLecture[]>([])
  const certificates = ref<Certificate[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filter = ref<LectureFilter>({})
  const currentLecture = ref<ExtendedLecture | null>(null)

  // 계산된 속성
  const filteredLectures = computed(() => {
    let result = [...lectures.value]

    // 카테고리 필터 (1단계)
    if (filter.value.category) {
      result = result.filter(lecture => lecture.category === filter.value.category)
    }

    // 3단계 카테고리 필터
    if (filter.value.mainCategory) {
      result = result.filter(lecture => lecture.mainCategory === filter.value.mainCategory)
    }
    if (filter.value.middleCategory) {
      result = result.filter(lecture => lecture.middleCategory === filter.value.middleCategory)
    }
    if (filter.value.leafCategory) {
      result = result.filter(lecture => lecture.leafCategory === filter.value.leafCategory)
    }

    // 레벨 필터
    if (filter.value.level) {
      result = result.filter(lecture => lecture.level === filter.value.level)
    }

    // 상태 필터
    if (filter.value.status) {
      result = result.filter(lecture => getLectureStatus(lecture) === filter.value.status)
    }

    // 검색 필터
    if (filter.value.searchQuery) {
      const query = filter.value.searchQuery.toLowerCase()
      result = result.filter(lecture =>
        lecture.title.toLowerCase().includes(query) ||
        lecture.description?.toLowerCase().includes(query) ||
        lecture.instructor?.toLowerCase().includes(query)
      )
    }

    // 정렬
    if (filter.value.sortBy) {
      result.sort((a, b) => {
        const aValue = a[filter.value.sortBy!]
        const bValue = b[filter.value.sortBy!]
        
        // null/undefined 처리
        if (aValue == null && bValue == null) return 0
        if (aValue == null) return 1
        if (bValue == null) return -1
        
        // 타입별 비교
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return filter.value.sortOrder === 'desc' 
            ? bValue.localeCompare(aValue)
            : aValue.localeCompare(bValue)
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return filter.value.sortOrder === 'desc'
            ? bValue - aValue
            : aValue - bValue
        }
        
        // Date 타입 처리
        if (aValue instanceof Date && bValue instanceof Date) {
          return filter.value.sortOrder === 'desc'
            ? bValue.getTime() - aValue.getTime()
            : aValue.getTime() - bValue.getTime()
        }
        
        return 0
      })
    }

    return result
  })

  // 통계 계산
  const lectureStats = computed<LectureStats>(() => {
    const total = lectures.value.length
    const completed = lectures.value.filter(l => getLectureStatus(l) === 'completed').length
    const inProgress = lectures.value.filter(l => getLectureStatus(l) === 'in_progress').length
    const totalTime = lectures.value.reduce((sum, l) => sum + (l.watchedTime || 0), 0)
    const avgProgress = total > 0
      ? lectures.value.reduce((sum, l) => sum + (l.progress || 0), 0) / total
      : 0

    return {
      totalLectures: total,
      completedLectures: completed,
      inProgressLectures: inProgress,
      totalWatchTime: totalTime,
      averageProgress: Math.round(avgProgress),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  })

  // 최근 학습 강의
  const recentLectures = computed(() => {
    return lectures.value
      .filter(l => l.lastAccessedAt != null)
      .sort((a, b) => {
        const dateA = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0
        const dateB = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 5)
  })

  // 강의 상태 판별 함수
  function getLectureStatus(lecture: ExtendedLecture): LectureStatus {
    if (lecture.expiresAt && new Date(lecture.expiresAt) < new Date()) {
      return 'expired'
    }
    if (lecture.progress === 100) {
      return 'completed'
    }
    if (lecture.progress && lecture.progress > 0) {
      return 'in_progress'
    }
    return 'not_started'
  }

  // 액션
  async function initialize() {
    isLoading.value = true
    error.value = null

    try {
      // TODO: 실제 API 호출로 교체
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 더미 데이터 (3단계 카테고리 포함)
      lectures.value = [
        {
          id: '1',
          title: '건설현장 크레인 안전관리',
          description: '건설현장에서 크레인 작업 시 필수 안전 수칙',
          category: 'safety',
          mainCategory: '기계',
          middleCategory: '건설기계',
          leafCategory: '크레인',
          level: '초급',
          duration: 3600,
          instructor: '김안전',
          progress: 75,
          watchedTime: 2700,
          thumbnailUrl: 'https://via.placeholder.com/400x225?text=Crane+Safety',
          createdAt: new Date('2024-01-01'),
          enrolledAt: new Date('2024-02-01'),
          lastAccessedAt: new Date('2024-03-15'),
          completedChapters: [1, 2, 3],
          isActive: true
        },
        {
          id: '2',
          title: '화공약품 취급 안전교육',
          description: '황산, 염산 등 위험 화학물질 안전 취급 방법',
          category: 'safety',
          mainCategory: '약품',
          middleCategory: '화공약품',
          leafCategory: '황산',
          level: '중급',
          duration: 5400,
          instructor: '이화학',
          progress: 100,
          watchedTime: 5400,
          thumbnailUrl: 'https://via.placeholder.com/400x225?text=Chemical+Safety',
          createdAt: new Date('2024-01-15'),
          enrolledAt: new Date('2024-02-15'),
          lastAccessedAt: new Date('2024-03-01'),
          completedChapters: [1, 2, 3, 4, 5],
          isActive: true
        },
        {
          id: '3',
          title: '전동공구 안전 사용법',
          description: '전동드릴, 그라인더 등 전동공구 안전 수칙',
          category: 'technology',
          mainCategory: '공구',
          middleCategory: '전동공구',
          leafCategory: '전동드릴',
          level: '초급',
          duration: 2400,
          instructor: '박기술',
          progress: 30,
          watchedTime: 720,
          thumbnailUrl: 'https://via.placeholder.com/400x225?text=Power+Tools',
          createdAt: new Date('2024-02-01'),
          enrolledAt: new Date('2024-03-01'),
          lastAccessedAt: new Date('2024-03-20'),
          isActive: true
        },
        {
          id: '4',
          title: '안전장비 착용 및 관리',
          description: '헬멧, 안전화 등 개인보호구 올바른 사용법',
          category: 'safety',
          mainCategory: '장비',
          middleCategory: '안전장비',
          leafCategory: '헬멧',
          level: '초급',
          duration: 1800,
          instructor: '최안전',
          progress: 0,
          watchedTime: 0,
          thumbnailUrl: 'https://via.placeholder.com/400x225?text=Safety+Equipment',
          createdAt: new Date('2024-03-01'),
          isActive: true
        }
      ]

      // 더미 수료증 데이터
      certificates.value = [
        {
          id: 'cert-1',
          userId: '1',
          lectureId: '2',
          lectureTitle: '화공약품 취급 안전교육',
          userName: '홍길동',
          issueDate: new Date('2024-03-01'),
          certificateNumber: 'CERT-2024-001',
          status: 'issued',
          verificationCode: 'VERIFY-001',
          pdfUrl: 'https://example.com/certificates/CERT-2024-001.pdf'
        } as Certificate
      ]
    } catch (err) {
      error.value = err instanceof Error ? err.message : '강의 목록을 불러오는데 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function setFilter(newFilter: Partial<LectureFilter>) {
    filter.value = { ...filter.value, ...newFilter }
  }

  function clearFilter() {
    filter.value = {}
  }

  async function getLecture(id: string): Promise<ExtendedLecture | null> {
    const lecture = lectures.value.find(l => l.id === id)
    if (lecture) {
      currentLecture.value = lecture
      return lecture
    }

    // API에서 가져오기
    try {
      // TODO: 실제 API 호출
      return null
    } catch (err) {
      error.value = '강의를 불러오는데 실패했습니다.'
      return null
    }
  }

  async function updateProgress(lectureId: string, progress: number, watchedTime: number) {
    const lecture = lectures.value.find(l => l.id === lectureId)
    if (lecture) {
      lecture.progress = progress
      lecture.watchedTime = watchedTime
      lecture.lastAccessedAt = new Date()

      // TODO: API로 진행률 업데이트
    }
  }

  async function completeLecture(lectureId: string) {
    const lecture = lectures.value.find(l => l.id === lectureId)
    if (lecture) {
      lecture.progress = 100
      lecture.watchedTime = lecture.duration

      // TODO: API로 완료 처리
    }
  }

  return {
    // 상태
    lectures,
    certificates,
    isLoading,
    error,
    filter,
    currentLecture,

    // 계산된 속성
    filteredLectures,
    lectureStats,
    recentLectures,

    // 액션
    initialize,
    setFilter,
    clearFilter,
    getLecture,
    updateProgress,
    completeLecture,
    getLectureStatus
  }
})