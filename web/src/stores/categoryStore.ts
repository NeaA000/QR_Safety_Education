// 🗃️ web/src/stores/categoryStore.ts
// Pinia 스토어로 카테고리 상태 관리

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CategoryService, type Language } from '@/services/categoryService'
import type { MainCategory, MiddleCategory } from '@/types/category'

export const useCategoryStore = defineStore('categories', () => {
  // 서비스 인스턴스
  const categoryService = new CategoryService()
  
  // 상태
  const currentLanguage = ref<Language>('ko')
  const selectedMainCategory = ref<MainCategory | null>(null)
  const selectedMiddleCategory = ref<MiddleCategory | null>(null)

  // 언어 변경
  const setLanguage = (language: Language): void => {
    currentLanguage.value = language
    categoryService.setLanguage(language)
  }

  // 메인 카테고리 선택
  const selectMainCategory = (category: MainCategory | null): void => {
    selectedMainCategory.value = category
    selectedMiddleCategory.value = null // 중간 카테고리 초기화
  }

  // 중간 카테고리 선택
  const selectMiddleCategory = (category: MiddleCategory | null): void => {
    selectedMiddleCategory.value = category
  }

  // 계산된 속성
  const mainCategories = computed(() => categoryService.getMainCategories())
  
  const currentMiddleCategories = computed(() => {
    if (!selectedMainCategory.value) return []
    return categoryService.getMiddleCategories(selectedMainCategory.value)
  })

  const currentLeafCategories = computed(() => {
    if (!selectedMiddleCategory.value) return []
    return categoryService.getLeafCategories(selectedMiddleCategory.value)
  })

  const categoryStats = computed(() => categoryService.getCategoryStats())

  // 검색 메서드
  const searchCategories = (query: string) => {
    return categoryService.searchCategories(query)
  }

  // 사용 통계 추적
  const trackUsage = (categoryId: string, categoryName: string) => {
    categoryService.trackCategoryUsage(categoryId, categoryName)
  }

  return {
    // 상태
    currentLanguage,
    selectedMainCategory,
    selectedMiddleCategory,

    // 액션
    setLanguage,
    selectMainCategory,
    selectMiddleCategory,
    searchCategories,
    trackUsage,

    // 계산된 속성
    mainCategories,
    currentMiddleCategories,
    currentLeafCategories,
    categoryStats
  }
})