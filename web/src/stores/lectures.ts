// src/stores/lectures.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MainCategory, MiddleCategory, LeafCategory } from '@/types/category'

// 🎯 개선된 강의 타입 (독립적으로 정의)
export interface ExtendedLecture {
  // 기본 정보
  id: string
  title: string
  description: string
  instructor?: string
  thumbnailUrl?: string
  videoUrl?: string

  // 카테고리 (category.ts 타입 사용)
  mainCategory: MainCategory
  middleCategory: MiddleCategory
  leafCategory: LeafCategory

  // 학습 진행 상태
  progress?: number // 0-100
  watchedTime?: number // 초 단위
  duration: number // 총 길이 (초)
  level: '입문' | '초급' | '중급' | '고급' | '전문가'

  // 날짜 정보
  createdAt: Date
  enrolledAt?: Date
  lastAccessedAt?: Date
  expiresAt?: Date

  // 상태
  isActive: boolean
  completedChapters?: number[]

  // 🆕 추가 메타데이터
  difficulty?: '입문' | '초급' | '중급' | '고급' | '전문가'
  estimatedTime?: number // 예상 소요 시간(분)
  tags?: string[] // 태그 시스템
  prerequisites?: string[] // 선행 학습 강의 ID
  relatedLectures?: string[] // 연관 강의 ID

  // 🆕 접근성 개선
  hasSubtitles?: boolean // 자막 여부
  hasTranscript?: boolean // 스크립트 여부
  supportedLanguages?: string[] // 지원 언어

  // 🆕 품질 지표
  rating?: number // 평점 (1-5)
  reviewCount?: number // 리뷰 수
  completionRate?: number // 완주율

  // 🆕 콘텐츠 메타데이터
  videoQuality?: '720p' | '1080p' | '4K'
  chapters?: LectureChapter[]
  quiz?: LectureQuiz[]
}

// 🆕 수료증 타입 정의 (Certificate import 대신)
export interface Certificate {
  id: string
  userId: string
  lectureId: string
  lectureTitle: string
  userName: string
  issueDate: Date
  certificateNumber: string
  status: 'pending' | 'issued' | 'revoked'
  verificationCode?: string
  pdfUrl?: string
}

// 🆕 강의 챕터 구조
export interface LectureChapter {
  id: string
  title: string
  duration: number // 초 단위
  videoUrl?: string
  thumbnailUrl?: string
  description?: string
  isCompleted?: boolean
  watchedTime?: number
}

// 🆕 퀴즈 구조
export interface LectureQuiz {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  isCompleted?: boolean
  userAnswer?: number
}

// 🆕 개선된 필터 인터페이스
export interface LectureFilter {
  // 카테고리 필터
  mainCategory?: MainCategory
  middleCategory?: MiddleCategory
  leafCategory?: LeafCategory

  // 난이도 및 속성 필터
  difficulty?: ExtendedLecture['difficulty']
  status?: LectureStatus
  duration?: {
    min?: number
    max?: number
  }

  // 검색 및 정렬
  searchQuery?: string
  sortBy?: 'title' | 'createdAt' | 'progress' | 'duration' | 'rating' | 'popularity'
  sortOrder?: 'asc' | 'desc'

  // 🆕 고급 필터
  hasSubtitles?: boolean
  minRating?: number
  tags?: string[]
  instructor?: string
  language?: string

  // 🆕 학습 상태 필터
  showFavorites?: boolean
  showWatchLater?: boolean
  showInProgress?: boolean
}

// 레벨 타입 (기존 유지하되 확장)
export type LectureLevel = '입문' | '초급' | '중급' | '고급' | '전문가'

// 상태 타입 (기존 유지)
export type LectureStatus = 'not_started' | 'in_progress' | 'completed' | 'expired'

// 🆕 개선된 통계 인터페이스
export interface LectureStats {
  // 기본 통계
  totalLectures: number
  completedLectures: number
  inProgressLectures: number
  notStartedLectures: number

  // 시간 통계
  totalWatchTime: number // 총 시청 시간 (분)
  averageProgress: number // 평균 진도율
  completionRate: number // 완주율

  // 🆕 카테고리별 통계
  categoryStats: {
    [category in MainCategory]?: {
      total: number
      completed: number
      inProgress: number
      averageRating: number
    }
  }

  // 🆕 최근 활동
  recentActivity: {
    lastWeekWatchTime: number
    lastMonthWatchTime: number
    streakDays: number // 연속 학습 일수
    longestStreak: number // 최장 연속 학습 일수
  }

  // 🆕 성취 지표
  achievements: {
    certificatesEarned: number
    perfectScores: number // 만점 퀴즈 수
    fastCompletions: number // 빠른 완주 수
  }
}

// 🆕 카테고리 트리 구조 관리
export interface CategoryTree {
  main: MainCategory
  middle: MiddleCategory[]
  leaf: { [key in MiddleCategory]?: LeafCategory[] }
}

export const useLectureStore = defineStore('lectures', () => {
  // 📊 상태 관리
  const lectures = ref<ExtendedLecture[]>([])
  const categories = ref<CategoryTree[]>([])
  const certificates = ref<Certificate[]>([])
  const favorites = ref<string[]>([]) // 즐겨찾기 강의 ID
  const watchLater = ref<string[]>([]) // 나중에 볼 강의 ID

  // 🔄 로딩 및 에러 상태
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filter = ref<LectureFilter>({})
  const currentLecture = ref<ExtendedLecture | null>(null)

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

  // 🎯 개선된 필터링 로직
  const filteredLectures = computed(() => {
    let result = [...lectures.value]

    // 즐겨찾기 필터
    if (filter.value.showFavorites) {
      result = result.filter(lecture => favorites.value.includes(lecture.id))
    }

    // 나중에 보기 필터
    if (filter.value.showWatchLater) {
      result = result.filter(lecture => watchLater.value.includes(lecture.id))
    }

    // 진행 중인 강의 필터
    if (filter.value.showInProgress) {
      result = result.filter(lecture => getLectureStatus(lecture) === 'in_progress')
    }

    // 카테고리 필터 (3단계) - '전체'는 필터링하지 않음
    if (filter.value.mainCategory && filter.value.mainCategory !== '전체') {
      result = result.filter(lecture => lecture.mainCategory === filter.value.mainCategory)
    }
    if (filter.value.middleCategory) {
      result = result.filter(lecture => lecture.middleCategory === filter.value.middleCategory)
    }
    if (filter.value.leafCategory) {
      result = result.filter(lecture => lecture.leafCategory === filter.value.leafCategory)
    }

    // 난이도 필터
    if (filter.value.difficulty) {
      result = result.filter(lecture => lecture.difficulty === filter.value.difficulty)
    }

    // 상태 필터
    if (filter.value.status) {
      result = result.filter(lecture => getLectureStatus(lecture) === filter.value.status)
    }

    // 시간 범위 필터
    if (filter.value.duration) {
      const { min, max } = filter.value.duration
      result = result.filter(lecture => {
        if (min && lecture.duration < min * 60) return false
        if (max && lecture.duration > max * 60) return false
        return true
      })
    }

    // 자막 필터
    if (filter.value.hasSubtitles) {
      result = result.filter(lecture => lecture.hasSubtitles === true)
    }

    // 최소 평점 필터
    if (filter.value.minRating) {
      result = result.filter(lecture =>
        lecture.rating && lecture.rating >= filter.value.minRating!
      )
    }

    // 태그 필터
    if (filter.value.tags && filter.value.tags.length > 0) {
      result = result.filter(lecture =>
        lecture.tags && lecture.tags.some(tag => filter.value.tags!.includes(tag))
      )
    }

    // 강사 필터
    if (filter.value.instructor) {
      result = result.filter(lecture =>
        lecture.instructor?.toLowerCase().includes(filter.value.instructor!.toLowerCase())
      )
    }

    // 검색 필터 (개선된 검색)
    if (filter.value.searchQuery) {
      const query = filter.value.searchQuery.toLowerCase()
      result = result.filter(lecture => {
        const searchableText = [
          lecture.title,
          lecture.description,
          lecture.instructor,
          ...(lecture.tags || []),
          lecture.mainCategory,
          lecture.middleCategory,
          lecture.leafCategory
        ].join(' ').toLowerCase()

        return searchableText.includes(query)
      })
    }

    // 정렬 (개선된 정렬 옵션)
    if (filter.value.sortBy) {
      result.sort((a, b) => {
        let aValue: any, bValue: any

        switch (filter.value.sortBy) {
          case 'title':
            aValue = a.title
            bValue = b.title
            break
          case 'createdAt':
            aValue = a.createdAt
            bValue = b.createdAt
            break
          case 'progress':
            aValue = a.progress || 0
            bValue = b.progress || 0
            break
          case 'duration':
            aValue = a.duration
            bValue = b.duration
            break
          case 'rating':
            aValue = a.rating || 0
            bValue = b.rating || 0
            break
          case 'popularity':
            // 평점 * 리뷰수로 인기도 계산
            aValue = (a.rating || 0) * (a.reviewCount || 0)
            bValue = (b.rating || 0) * (b.reviewCount || 0)
            break
          default:
            return 0
        }

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

  // 🆕 카테고리별 강의 수 계산
  const lectureCountByCategory = computed(() => {
    const counts: { [key: string]: number } = {}

    lectures.value.forEach(lecture => {
      const key = `${lecture.mainCategory}-${lecture.middleCategory}-${lecture.leafCategory}`
      counts[key] = (counts[key] || 0) + 1
    })

    return counts
  })

  // 🆕 개선된 통계 계산
  const lectureStats = computed<LectureStats>(() => {
    const total = lectures.value.length
    const completed = lectures.value.filter(l => getLectureStatus(l) === 'completed').length
    const inProgress = lectures.value.filter(l => getLectureStatus(l) === 'in_progress').length
    const notStarted = lectures.value.filter(l => getLectureStatus(l) === 'not_started').length

    const totalTime = lectures.value.reduce((sum, l) => sum + (l.watchedTime || 0), 0)
    const avgProgress = total > 0
      ? lectures.value.reduce((sum, l) => sum + (l.progress || 0), 0) / total
      : 0

    // 카테고리별 통계 계산 ('전체' 제외)
    const categoryStats: LectureStats['categoryStats'] = {}
    const categoryList = Array.from(new Set(lectures.value.map(l => l.mainCategory)))
      .filter(cat => cat !== '전체') as Exclude<MainCategory, '전체'>[]

    categoryList.forEach(category => {
      const categoryLectures = lectures.value.filter(l => l.mainCategory === category)
      const categoryCompleted = categoryLectures.filter(l => getLectureStatus(l) === 'completed').length
      const categoryInProgress = categoryLectures.filter(l => getLectureStatus(l) === 'in_progress').length
      const avgRating = categoryLectures.length > 0
        ? categoryLectures.reduce((sum, l) => sum + (l.rating || 0), 0) / categoryLectures.length
        : 0

      categoryStats[category] = {
        total: categoryLectures.length,
        completed: categoryCompleted,
        inProgress: categoryInProgress,
        averageRating: avgRating
      }
    })

    // 최근 활동 계산
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const lastWeekWatchTime = lectures.value
      .filter(l => l.lastAccessedAt && new Date(l.lastAccessedAt) >= lastWeek)
      .reduce((sum, l) => sum + (l.watchedTime || 0), 0)

    const lastMonthWatchTime = lectures.value
      .filter(l => l.lastAccessedAt && new Date(l.lastAccessedAt) >= lastMonth)
      .reduce((sum, l) => sum + (l.watchedTime || 0), 0)

    return {
      totalLectures: total,
      completedLectures: completed,
      inProgressLectures: inProgress,
      notStartedLectures: notStarted,
      totalWatchTime: Math.round(totalTime / 60), // 분 단위로 변환
      averageProgress: Math.round(avgProgress),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      categoryStats,
      recentActivity: {
        lastWeekWatchTime: Math.round(lastWeekWatchTime / 60),
        lastMonthWatchTime: Math.round(lastMonthWatchTime / 60),
        streakDays: 0, // TODO: 실제 구현 필요
        longestStreak: 0 // TODO: 실제 구현 필요
      },
      achievements: {
        certificatesEarned: certificates.value.length,
        perfectScores: 0, // TODO: 퀴즈 시스템 구현 후 계산
        fastCompletions: 0 // TODO: 실제 구현 필요
      }
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
      .slice(0, 10)
  })

  // 🆕 추천 강의 (간단한 로직)
  const recommendedLectures = computed(() => {
    const userCategories = lectures.value
      .filter(l => l.progress && l.progress > 0)
      .map(l => l.mainCategory)
      .filter(cat => cat !== '전체')

    const mostStudiedCategory = userCategories.reduce((acc, category) => {
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topCategory = Object.keys(mostStudiedCategory).sort(
      (a, b) => mostStudiedCategory[b] - mostStudiedCategory[a]
    )[0]

    if (!topCategory) return []

    return lectures.value
      .filter(l =>
        l.mainCategory === topCategory &&
        getLectureStatus(l) === 'not_started' &&
        (l.rating || 0) >= 4.0
      )
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5)
  })

  // 🆕 즐겨찾기 관리
  function toggleFavorite(lectureId: string) {
    const index = favorites.value.indexOf(lectureId)
    if (index > -1) {
      favorites.value.splice(index, 1)
    } else {
      favorites.value.push(lectureId)
    }
    // TODO: 서버에 동기화
  }

  // 🆕 나중에 보기 관리
  function toggleWatchLater(lectureId: string) {
    const index = watchLater.value.indexOf(lectureId)
    if (index > -1) {
      watchLater.value.splice(index, 1)
    } else {
      watchLater.value.push(lectureId)
    }
    // TODO: 서버에 동기화
  }

  // 액션들
  async function initialize() {
    isLoading.value = true
    error.value = null

    try {
      // TODO: 실제 API 호출로 교체
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 🆕 개선된 더미 데이터 (category.ts 타입과 일치)
      lectures.value = [
        {
          id: '1',
          title: '건설현장 크레인 안전관리',
          description: '건설현장에서 크레인 작업 시 필수 안전 수칙과 점검 사항을 학습합니다.',
          mainCategory: '기계',
          middleCategory: '건설기계',
          leafCategory: '크레인',
          difficulty: '초급',
          level: '초급',
          duration: 3600,
          estimatedTime: 60,
          instructor: '김안전',
          progress: 75,
          watchedTime: 2700,
          thumbnailUrl: 'https://via.placeholder.com/400x225?text=Crane+Safety',
          createdAt: new Date('2024-01-01'),
          enrolledAt: new Date('2024-02-01'),
          lastAccessedAt: new Date('2024-03-15'),
          completedChapters: [1, 2, 3],
          isActive: true,
          hasSubtitles: true,
          hasTranscript: true,
          supportedLanguages: ['ko', 'en', 'zh', 'vi'],
          rating: 4.5,
          reviewCount: 120,
          completionRate: 85,
          videoQuality: '1080p',
          tags: ['안전', '크레인', '건설', '중장비'],
          prerequisites: [],
          relatedLectures: ['5'],
          chapters: [
            {
              id: 'c1-1',
              title: '크레인 기본 구조',
              duration: 1200,
              isCompleted: true,
              watchedTime: 1200
            },
            {
              id: 'c1-2',
              title: '안전 점검 절차',
              duration: 1200,
              isCompleted: true,
              watchedTime: 1200
            },
            {
              id: 'c1-3',
              title: '작업 전 준비사항',
              duration: 1200,
              isCompleted: true,
              watchedTime: 300
            }
          ]
        },
        {
          id: '2',
          title: '화공약품 취급 안전교육',
          description: '황산, 염산 등 위험 화학물질의 안전한 취급 방법과 응급처치를 배웁니다.',
          mainCategory: '약품',
          middleCategory: '화공약품',
          leafCategory: '황산',
          difficulty: '중급',
          level: '중급',
          duration: 5400,
          estimatedTime: 90,
          instructor: '이화학',
          progress: 100,
          watchedTime: 5400,
          thumbnailUrl: 'https://via.placeholder.com/400x225?text=Chemical+Safety',
          createdAt: new Date('2024-01-15'),
          enrolledAt: new Date('2024-02-15'),
          lastAccessedAt: new Date('2024-03-01'),
          completedChapters: [1, 2, 3, 4, 5],
          isActive: true,
          hasSubtitles: true,
          hasTranscript: false,
          supportedLanguages: ['ko', 'en'],
          rating: 4.8,
          reviewCount: 89,
          completionRate: 92,
          videoQuality: '1080p',
          tags: ['화학', '안전', '약품', '응급처치'],
          prerequisites: [],
          relatedLectures: ['3']
        },
        {
          id: '3',
          title: '전동공구 안전 사용법',
          description: '전동드릴, 그라인더 등 전동공구의 올바른 사용법과 유지보수 방법을 학습합니다.',
          mainCategory: '공구',
          middleCategory: '전동공구',
          leafCategory: '전동드릴',
          difficulty: '초급',
          level: '초급',
          duration: 2400,
          estimatedTime: 40,
          instructor: '박기술',
          progress: 30,
          watchedTime: 720,
          thumbnailUrl: 'https://via.placeholder.com/400x225?text=Power+Tools',
          createdAt: new Date('2024-02-01'),
          enrolledAt: new Date('2024-03-01'),
          lastAccessedAt: new Date('2024-03-20'),
          isActive: true,
          hasSubtitles: true,
          hasTranscript: true,
          supportedLanguages: ['ko', 'en', 'zh'],
          rating: 4.2,
          reviewCount: 156,
          completionRate: 78,
          videoQuality: '720p',
          tags: ['전동공구', '기술', '유지보수'],
          prerequisites: [],
          relatedLectures: ['4']
        },
        {
          id: '4',
          title: '안전장비 착용 및 관리',
          description: '헬멧, 안전화, 보호장갑 등 개인보호구의 올바른 착용법과 관리 방법을 익힙니다.',
          mainCategory: '장비',
          middleCategory: '안전장비',
          leafCategory: '헬멧',
          difficulty: '초급',
          level: '초급',
          duration: 1800,
          estimatedTime: 30,
          instructor: '최안전',
          progress: 0,
          watchedTime: 0,
          thumbnailUrl: 'https://via.placeholder.com/400x225?text=Safety+Equipment',
          createdAt: new Date('2024-03-01'),
          isActive: true,
          hasSubtitles: true,
          hasTranscript: true,
          supportedLanguages: ['ko', 'en', 'zh', 'vi'],
          rating: 4.0,
          reviewCount: 203,
          completionRate: 88,
          videoQuality: '1080p',
          tags: ['안전장비', 'PPE', '개인보호구'],
          prerequisites: []
        },
        {
          id: '5',
          title: '굴착기 조작 실무',
          description: '굴착기의 기본 조작법부터 고급 기술까지 현장 실무에 필요한 모든 것을 학습합니다.',
          mainCategory: '기계',
          middleCategory: '건설기계',
          leafCategory: '굴착기',
          difficulty: '중급',
          level: '중급',
          duration: 4800,
          estimatedTime: 80,
          instructor: '김굴착',
          progress: 50,
          watchedTime: 2400,
          thumbnailUrl: 'https://via.placeholder.com/400x225?text=Excavator',
          createdAt: new Date('2024-02-10'),
          enrolledAt: new Date('2024-03-05'),
          lastAccessedAt: new Date('2024-03-18'),
          isActive: true,
          hasSubtitles: true,
          hasTranscript: true,
          supportedLanguages: ['ko', 'en'],
          rating: 4.7,
          reviewCount: 67,
          completionRate: 91,
          videoQuality: '1080p',
          tags: ['굴착기', '건설기계', '조작', '실무'],
          prerequisites: [],
          relatedLectures: ['1']
        },
        {
          id: '6',
          title: 'CNC 선반 기초',
          description: 'CNC 선반의 기본 원리와 프로그래밍 방법을 배우는 기초 과정입니다.',
          mainCategory: '기계',
          middleCategory: '공작기계',
          leafCategory: 'CNC 선반',
          difficulty: '초급',
          level: '초급',
          duration: 3000,
          estimatedTime: 50,
          instructor: '이공작',
          progress: 0,
          watchedTime: 0,
          thumbnailUrl: 'https://via.placeholder.com/400x225?text=CNC+Lathe',
          createdAt: new Date('2024-03-05'),
          isActive: true,
          hasSubtitles: true,
          hasTranscript: false,
          supportedLanguages: ['ko'],
          rating: 4.3,
          reviewCount: 45,
          completionRate: 76,
          videoQuality: '720p',
          tags: ['CNC', '선반', '공작기계', '프로그래밍'],
          prerequisites: [],
          relatedLectures: []
        }
      ]

      // 더미 카테고리 트리 데이터 (category.ts와 일치)
      categories.value = [
        {
          main: '기계',
          middle: ['건설기계', '공작기계', '산업기계'],
          leaf: {
            '건설기계': ['크레인', '굴착기', '불도저'],
            '공작기계': ['CNC 선반', '연삭기'],
            '산업기계': ['유압 프레스', '사출 성형기']
          }
        },
        {
          main: '공구',
          middle: ['수공구', '전동공구', '절삭공구'],
          leaf: {
            '수공구': ['해머', '플라이어'],
            '전동공구': ['전동드릴', '그라인더', '전동톱'],
            '절삭공구': ['가스 용접기', '커터']
          }
        },
        {
          main: '장비',
          middle: ['안전장비', '운송장비'],
          leaf: {
            '안전장비': ['헬멧', '안전화', '보호장갑', '방진 마스크'],
            '운송장비': ['리프트 장비', '호이스트']
          }
        },
        {
          main: '약품',
          middle: ['의약품', '화공약품'],
          leaf: {
            '의약품': ['인슐린', '항생제'],
            '화공약품': ['황산', '염산']
          }
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
        }
      ]

      // 더미 즐겨찾기/나중에 보기 데이터
      favorites.value = ['1', '2']
      watchLater.value = ['3']

    } catch (err) {
      error.value = err instanceof Error ? err.message : '강의 목록을 불러오는데 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 필터 관리
  function setFilter(newFilter: Partial<LectureFilter>) {
    filter.value = { ...filter.value, ...newFilter }
  }

  function clearFilter() {
    filter.value = {}
  }

  // 🆕 빠른 필터 설정
  function setQuickFilter(type: 'favorites' | 'watchLater' | 'inProgress' | 'completed' | 'notStarted') {
    clearFilter()
    switch (type) {
      case 'favorites':
        filter.value.showFavorites = true
        break
      case 'watchLater':
        filter.value.showWatchLater = true
        break
      case 'inProgress':
        filter.value.showInProgress = true
        break
      case 'completed':
        filter.value.status = 'completed'
        break
      case 'notStarted':
        filter.value.status = 'not_started'
        break
    }
  }

  // 강의 조회
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

  // 진도 업데이트
  async function updateProgress(lectureId: string, progress: number, watchedTime: number, chapterId?: string) {
    const lecture = lectures.value.find(l => l.id === lectureId)
    if (lecture) {
      lecture.progress = progress
      lecture.watchedTime = watchedTime
      lecture.lastAccessedAt = new Date()

      // 챕터별 진도 업데이트
      if (chapterId && lecture.chapters) {
        const chapter = lecture.chapters.find(c => c.id === chapterId)
        if (chapter) {
          chapter.watchedTime = watchedTime
          chapter.isCompleted = progress >= 100
        }
      }

      // TODO: API로 진행률 업데이트
    }
  }

  // 강의 완료
  async function completeLecture(lectureId: string) {
    const lecture = lectures.value.find(l => l.id === lectureId)
    if (lecture) {
      lecture.progress = 100
      lecture.watchedTime = lecture.duration

      // 모든 챕터 완료 처리
      if (lecture.chapters) {
        lecture.chapters.forEach(chapter => {
          chapter.isCompleted = true
          chapter.watchedTime = chapter.duration
        })
      }

      // TODO: API로 완료 처리
    }
  }

  // 🆕 강의 평가
  async function rateLecture(lectureId: string, rating: number) {
    const lecture = lectures.value.find(l => l.id === lectureId)
    if (lecture) {
      // 현재는 로컬 상태만 업데이트 (실제로는 서버에서 평균 계산)
      lecture.rating = rating
      // TODO: API로 평가 저장
    }
  }

  return {
    // 상태
    lectures,
    categories,
    certificates,
    favorites,
    watchLater,
    isLoading,
    error,
    filter,
    currentLecture,

    // 계산된 속성
    filteredLectures,
    lectureCountByCategory,
    lectureStats,
    recentLectures,
    recommendedLectures,

    // 액션
    initialize,
    setFilter,
    clearFilter,
    setQuickFilter,
    getLecture,
    updateProgress,
    completeLecture,
    rateLecture,
    toggleFavorite,
    toggleWatchLater,
    getLectureStatus
  }
})
