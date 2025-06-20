// stores/courses.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type DocumentData,
  type QuerySnapshot,
  type DocumentSnapshot
} from 'firebase/firestore'
import { getFirebaseDb } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth'
import type { User, UserRole, PartialUser, EnrollmentStatus, PaymentMethod, UpdateData } from '@/types/global'

// 타입 정의
export interface Course {
  id: string
  title: string
  description: string
  thumbnail?: string
  instructor: string
  instructorTitle?: string
  instructorPhoto?: string
  categoryId: string
  price: number
  originalPrice?: number
  discountRate?: number
  rating?: number
  reviewCount?: number
  enrollmentCount?: number
  duration?: number
  lectureCount?: number
  isActive: boolean
  isRecommended?: boolean
  objectives?: string[]
  requirements?: string[]
  content?: string
  curriculum?: CurriculumSection[]
  createdAt?: Date
  updatedAt?: Date
}

export interface CurriculumSection {
  id: string
  title: string
  duration?: number
  lectures?: Lecture[]
}

export interface Lecture {
  id: string
  title: string
  duration: number
  videoUrl?: string
  description?: string
  order: number
}

export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  order: number
  isActive: boolean
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  courseName: string
  enrolledAt: Date
  status: EnrollmentStatus
  progress: number
  lastAccessedAt?: Date
  completedAt?: Date
  completedLectures: string[]
  totalLectures: number
  paymentAmount: number
  paymentMethod: PaymentMethod
}

export interface Review {
  id: string
  courseId: string
  userId: string
  userName: string
  userPhoto?: string
  rating: number
  content: string
  createdAt: Date
  updatedAt?: Date
}

type SortType = 'latest' | 'popular' | 'rating' | 'price'

export const useCourseStore = defineStore('courses', () => {
  // 상태
  const courses = ref<Course[]>([])
  const enrolledCourses = ref<Enrollment[]>([])
  const recommendedCourses = ref<Course[]>([])
  const categories = ref<Category[]>([])
  const currentCourse = ref<Course | null>(null)
  const reviews = ref<Review[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const searchQuery = ref<string>('')
  const selectedCategory = ref<string>('all')
  const sortBy = ref<SortType>('latest')

  // getters
  const filteredCourses = computed<Course[]>(() => {
    let filtered = courses.value

    // 카테고리 필터
    if (selectedCategory.value !== 'all') {
      filtered = filtered.filter(course => course.categoryId === selectedCategory.value)
    }

    // 검색 필터
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.instructor.toLowerCase().includes(query)
      )
    }

    // 정렬
    switch (sortBy.value) {
      case 'latest':
        return filtered.sort((a, b) => {
          const aTime = a.createdAt?.getTime() || 0
          const bTime = b.createdAt?.getTime() || 0
          return bTime - aTime
        })
      case 'popular':
        return filtered.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
      case 'rating':
        return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      case 'price':
        return filtered.sort((a, b) => a.price - b.price)
      default:
        return filtered
    }
  })

  const enrolledCourseIds = computed<string[]>(() =>
    enrolledCourses.value.map(enrollment => enrollment.courseId)
  )

  const isEnrolled = computed(() => (courseId: string): boolean =>
    enrolledCourseIds.value.includes(courseId)
  )

  // Firebase DB 가져오기 헬퍼
  const getDb = async () => {
    try {
      return await getFirebaseDb()
    } catch (err) {
      console.error('Firebase DB 연결 실패:', err)
      throw new Error('데이터베이스 연결에 실패했습니다.')
    }
  }

  // actions
  const loadCourses = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const db = await getDb()
      const coursesRef = collection(db, 'courses')
      const q = query(coursesRef, where('isActive', '==', true), orderBy('createdAt', 'desc'))
      const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

      courses.value = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Course
      })

    } catch (err: any) {
      console.error('강의 목록 로드 실패:', err)
      error.value = err.message || '강의 목록을 불러오는데 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const loadCourseDetail = async (courseId: string): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const db = await getDb()
      const courseDoc: DocumentSnapshot<DocumentData> = await getDoc(doc(db, 'courses', courseId))

      if (courseDoc.exists()) {
        const data = courseDoc.data()
        currentCourse.value = {
          id: courseDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Course
      } else {
        throw new Error('강의를 찾을 수 없습니다.')
      }

    } catch (err: any) {
      console.error('강의 상세 정보 로드 실패:', err)
      error.value = err.message || '강의 정보를 불러오는데 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const loadEnrolledCourses = async (): Promise<void> => {
    try {
      const authStore = useAuthStore()
      if (!authStore.user) return

      const db = await getDb()
      const enrollmentsRef = collection(db, 'enrollments')
      const q = query(enrollmentsRef, where('userId', '==', authStore.user.id))
      const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

      enrolledCourses.value = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          enrolledAt: data.enrolledAt?.toDate(),
          lastAccessedAt: data.lastAccessedAt?.toDate(),
          completedAt: data.completedAt?.toDate()
        } as Enrollment
      })

    } catch (err: any) {
      console.error('등록된 강의 목록 로드 실패:', err)
      error.value = err.message || '등록된 강의 목록을 불러오는데 실패했습니다.'
    }
  }

  const loadRecommendedCourses = async (): Promise<void> => {
    try {
      const db = await getDb()
      const coursesRef = collection(db, 'courses')
      const q = query(
        coursesRef,
        where('isActive', '==', true),
        where('isRecommended', '==', true),
        orderBy('rating', 'desc'),
        limit(6)
      )
      const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

      recommendedCourses.value = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()
        } as Course
      })

    } catch (err: any) {
      console.error('추천 강의 로드 실패:', err)
      error.value = err.message || '추천 강의를 불러오는데 실패했습니다.'
    }
  }

  const loadCategories = async (): Promise<void> => {
    try {
      const db = await getDb()
      const categoriesRef = collection(db, 'courseCategories')
      const q = query(categoriesRef, where('isActive', '==', true), orderBy('order', 'asc'))
      const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

      categories.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Category))

    } catch (err: any) {
      console.error('카테고리 로드 실패:', err)
      error.value = err.message || '카테고리를 불러오는데 실패했습니다.'
    }
  }

  const loadCourseReviews = async (courseId: string): Promise<void> => {
    try {
      const db = await getDb()
      const reviewsRef = collection(db, 'reviews')
      const q = query(
        reviewsRef,
        where('courseId', '==', courseId),
        orderBy('createdAt', 'desc')
      )
      const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

      reviews.value = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Review
      })

    } catch (err: any) {
      console.error('리뷰 로드 실패:', err)
      error.value = err.message || '리뷰를 불러오는데 실패했습니다.'
    }
  }

  const enrollInCourse = async (courseId: string): Promise<string> => {
    try {
      const authStore = useAuthStore()
      if (!authStore.user) {
        throw new Error('로그인이 필요합니다.')
      }

      isLoading.value = true

      // 이미 등록된 강의인지 확인
      if (isEnrolled.value(courseId)) {
        throw new Error('이미 등록된 강의입니다.')
      }

      const db = await getDb()

      // 강의 정보 확인
      const courseDoc: DocumentSnapshot<DocumentData> = await getDoc(doc(db, 'courses', courseId))
      if (!courseDoc.exists()) {
        throw new Error('강의를 찾을 수 없습니다.')
      }

      const courseData = courseDoc.data() as Course

      // 등록 정보 생성
      const enrollmentData = {
        userId: authStore.user.id,
        courseId: courseId,
        courseName: courseData.title,
        enrolledAt: serverTimestamp(),
        status: 'active' as EnrollmentStatus,
        progress: 0,
        lastAccessedAt: serverTimestamp(),
        completedLectures: [],
        totalLectures: courseData.lectureCount || 0,
        paymentAmount: courseData.price || 0,
        paymentMethod: (courseData.price > 0 ? 'pending' : 'free') as PaymentMethod
      }

      // Firestore에 등록 정보 저장
      const enrollmentRef = await addDoc(collection(db, 'enrollments'), enrollmentData)

      // 강의 등록 수 증가
      await updateDoc(doc(db, 'courses', courseId), {
        enrollmentCount: (courseData.enrollmentCount || 0) + 1,
        updatedAt: serverTimestamp()
      })

      // 사용자 프로필 업데이트
      if (authStore.updateProfile && authStore.user) {
        const updateData: UpdateData = {
          stats: {
            totalLectures: ((authStore.user as any).stats?.totalLectures || 0) + 1
          }
        }
        await authStore.updateProfile(updateData)
      }

      // 로컬 상태 업데이트
      const newEnrollment: Enrollment = {
        id: enrollmentRef.id,
        userId: authStore.user.id,
        courseId: courseId,
        courseName: courseData.title,
        enrolledAt: new Date(),
        status: 'active',
        progress: 0,
        completedLectures: [],
        totalLectures: courseData.lectureCount || 0,
        paymentAmount: courseData.price || 0,
        paymentMethod: courseData.price > 0 ? 'pending' : 'free'
      }

      enrolledCourses.value.push(newEnrollment)

      return enrollmentRef.id

    } catch (err: any) {
      console.error('강의 등록 실패:', err)
      error.value = err.message || '강의 등록에 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateCourseProgress = async (
    courseId: string,
    progress: number,
    completedLectureId?: string
  ): Promise<void> => {
    try {
      const authStore = useAuthStore()
      if (!authStore.user) return

      const enrollment = enrolledCourses.value.find(e => e.courseId === courseId)
      if (!enrollment) return

      const db = await getDb()
      const updateData: any = {
        progress: Math.min(100, Math.max(0, progress)),
        lastAccessedAt: serverTimestamp()
      }

      // 완료된 강의 추가
      if (completedLectureId && !enrollment.completedLectures.includes(completedLectureId)) {
        updateData.completedLectures = [...enrollment.completedLectures, completedLectureId]
      }

      // 강의 완료 상태 업데이트
      if (progress >= 100) {
        updateData.status = 'completed'
        updateData.completedAt = serverTimestamp()

        // 사용자 통계 업데이트
        if (authStore.updateProfile && authStore.user) {
          const updateData: UpdateData = {
            stats: {
              completedLectures: ((authStore.user as any).stats?.completedLectures || 0) + 1
            }
          }
          await authStore.updateProfile(updateData)
        }
      }

      await updateDoc(doc(db, 'enrollments', enrollment.id), updateData)

      // 로컬 상태 업데이트
      const enrollmentIndex = enrolledCourses.value.findIndex(e => e.id === enrollment.id)
      if (enrollmentIndex !== -1) {
        enrolledCourses.value[enrollmentIndex] = {
          ...enrolledCourses.value[enrollmentIndex],
          ...updateData,
          lastAccessedAt: new Date()
        }
      }

    } catch (err: any) {
      console.error('강의 진도 업데이트 실패:', err)
      error.value = err.message || '진도 업데이트에 실패했습니다.'
    }
  }

  const searchCourses = (query: string): void => {
    searchQuery.value = query
  }

  const filterByCategory = (categoryId: string): void => {
    selectedCategory.value = categoryId
  }

  const sortCourses = (sortType: SortType): void => {
    sortBy.value = sortType
  }

  const resetFilters = (): void => {
    searchQuery.value = ''
    selectedCategory.value = 'all'
    sortBy.value = 'latest'
  }

  const initialize = async (): Promise<void> => {
    try {
      await Promise.all([
        loadCourses(),
        loadCategories(),
        loadEnrolledCourses()
      ])
    } catch (err: any) {
      console.error('Course store 초기화 실패:', err)
      throw err
    }
  }

  return {
    // 상태
    courses,
    enrolledCourses,
    recommendedCourses,
    categories,
    currentCourse,
    reviews,
    isLoading,
    error,
    searchQuery,
    selectedCategory,
    sortBy,

    // getters
    filteredCourses,
    enrolledCourseIds,
    isEnrolled,

    // actions
    loadCourses,
    loadCourseDetail,
    loadEnrolledCourses,
    loadRecommendedCourses,
    loadCategories,
    loadCourseReviews,
    enrollInCourse,
    updateCourseProgress,
    searchCourses,
    filterByCategory,
    sortCourses,
    resetFilters,
    initialize
  }
})
