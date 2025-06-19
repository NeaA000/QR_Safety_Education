// src/stores/categoryStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Category {
  id: string
  name: string
  originalName: string
  parent?: string
  level: 1 | 2 | 3
  order: number
  isActive: boolean
}

export type MainCategory = string
export type MiddleCategory = string
export type LeafCategory = string

export const useCategoryStore = defineStore('category', () => {
  // 상태
  const categories = ref<Category[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 계산된 속성
  const mainCategories = computed(() => 
    categories.value.filter(cat => cat.level === 1).sort((a, b) => a.order - b.order)
  )

  const getMiddleCategories = (mainCategory: string) => {
    return categories.value
      .filter(cat => cat.level === 2 && cat.parent === mainCategory)
      .sort((a, b) => a.order - b.order)
  }

  const getLeafCategories = (middleCategory: string) => {
    return categories.value
      .filter(cat => cat.level === 3 && cat.parent === middleCategory)
      .sort((a, b) => a.order - b.order)
  }

  // 카테고리 경로 가져오기
  const getCategoryPath = (leafCategoryId: string): string[] => {
    const path: string[] = []
    let currentCategory = categories.value.find(c => c.id === leafCategoryId)
    
    while (currentCategory) {
      path.unshift(currentCategory.name)
      if (currentCategory.parent) {
        currentCategory = categories.value.find(c => c.originalName === currentCategory!.parent)
      } else {
        break
      }
    }
    
    return path
  }

  // 액션
  async function initialize() {
    if (categories.value.length > 0) return // 이미 로드됨

    isLoading.value = true
    error.value = null

    try {
      // TODO: 실제 API 호출로 교체
      await new Promise(resolve => setTimeout(resolve, 500))

      // 더미 데이터
      categories.value = [
        // 메인 카테고리
        { id: '1', name: '안전', originalName: '안전', level: 1, order: 1, isActive: true },
        { id: '2', name: '기술', originalName: '기술', level: 1, order: 2, isActive: true },
        { id: '3', name: '관리', originalName: '관리', level: 1, order: 3, isActive: true },
        { id: '4', name: '법규', originalName: '법규', level: 1, order: 4, isActive: true },
        
        // 중간 카테고리 - 안전
        { id: '11', name: '건설안전', originalName: '건설안전', parent: '안전', level: 2, order: 1, isActive: true },
        { id: '12', name: '화학안전', originalName: '화학안전', parent: '안전', level: 2, order: 2, isActive: true },
        { id: '13', name: '전기안전', originalName: '전기안전', parent: '안전', level: 2, order: 3, isActive: true },
        { id: '14', name: '기계안전', originalName: '기계안전', parent: '안전', level: 2, order: 4, isActive: true },
        
        // 중간 카테고리 - 기술
        { id: '21', name: '전기기술', originalName: '전기기술', parent: '기술', level: 2, order: 1, isActive: true },
        { id: '22', name: '기계기술', originalName: '기계기술', parent: '기술', level: 2, order: 2, isActive: true },
        { id: '23', name: 'IT기술', originalName: 'IT기술', parent: '기술', level: 2, order: 3, isActive: true },
        
        // 세부 카테고리 - 건설안전
        { id: '111', name: '기초과정', originalName: '기초과정', parent: '건설안전', level: 3, order: 1, isActive: true },
        { id: '112', name: '심화과정', originalName: '심화과정', parent: '건설안전', level: 3, order: 2, isActive: true },
        { id: '113', name: '현장실무', originalName: '현장실무', parent: '건설안전', level: 3, order: 3, isActive: true },
        
        // 세부 카테고리 - 화학안전
        { id: '121', name: '위험물관리', originalName: '위험물관리', parent: '화학안전', level: 3, order: 1, isActive: true },
        { id: '122', name: 'MSDS이해', originalName: 'MSDS이해', parent: '화학안전', level: 3, order: 2, isActive: true },
        { id: '123', name: '응급대응', originalName: '응급대응', parent: '화학안전', level: 3, order: 3, isActive: true },
        
        // 세부 카테고리 - 전기안전
        { id: '131', name: '기초이론', originalName: '기초이론', parent: '전기안전', level: 3, order: 1, isActive: true },
        { id: '132', name: '실무과정', originalName: '실무과정', parent: '전기안전', level: 3, order: 2, isActive: true },
        { id: '133', name: '사고예방', originalName: '사고예방', parent: '전기안전', level: 3, order: 3, isActive: true },
      ]
    } catch (err) {
      error.value = err instanceof Error ? err.message : '카테고리를 불러오는데 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 카테고리 검색
  function searchCategories(query: string): Category[] {
    const lowerQuery = query.toLowerCase()
    return categories.value.filter(cat => 
      cat.name.toLowerCase().includes(lowerQuery) ||
      cat.originalName.toLowerCase().includes(lowerQuery)
    )
  }

  // 카테고리 활성화/비활성화
  function toggleCategory(categoryId: string) {
    const category = categories.value.find(c => c.id === categoryId)
    if (category) {
      category.isActive = !category.isActive
    }
  }

  return {
    // 상태
    categories,
    isLoading,
    error,

    // 계산된 속성
    mainCategories,

    // 메서드
    getMiddleCategories,
    getLeafCategories,
    getCategoryPath,
    initialize,
    searchCategories,
    toggleCategory
  }
})