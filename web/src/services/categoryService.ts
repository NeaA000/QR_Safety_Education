// 🔧 web/src/services/categoryService.ts
// 카테고리 관련 비즈니스 로직

import type { MainCategory, MiddleCategory, LeafCategory } from '@/types/category'
import { 
  MAIN_CATEGORIES, 
  MAIN_TO_MIDDLE_MAPPING, 
  MIDDLE_TO_LEAF_MAPPING,
  CATEGORY_TRANSLATIONS,
  CATEGORY_STYLES 
} from '@/constants/categories'

export type Language = 'ko' | 'en' | 'vi' | 'cn'

/**
 * 카테고리 서비스 클래스
 */
export class CategoryService {
  private currentLanguage: Language = 'ko'

  /**
   * 현재 언어 설정
   */
  setLanguage(language: Language): void {
    this.currentLanguage = language
  }

  /**
   * 현재 언어 반환
   */
  getCurrentLanguage(): Language {
    return this.currentLanguage
  }

  /**
   * 📋 메인 카테고리 목록 반환
   */
  getMainCategories(): Array<{
    id: string
    name: string
    originalName: MainCategory
    icon?: string
    color?: string
  }> {
    return MAIN_CATEGORIES.map((category, index) => ({
      id: `main_${index}`,
      name: this.translateCategory('main', category),
      originalName: category,
      icon: CATEGORY_STYLES.main[category]?.icon,
      color: CATEGORY_STYLES.main[category]?.color
    }))
  }

  /**
   * 📂 특정 메인 카테고리의 중간 카테고리 반환
   */
  getMiddleCategories(mainCategory: MainCategory): Array<{
    id: string
    name: string
    originalName: MiddleCategory
    parentId: string
    icon?: string
    color?: string
  }> {
    const middleCategories = MAIN_TO_MIDDLE_MAPPING[mainCategory] || []
    const mainIndex = MAIN_CATEGORIES.indexOf(mainCategory)
    
    return middleCategories.map((category, index) => ({
      id: `middle_${mainIndex}_${index}`,
      name: this.translateCategory('middle', category),
      originalName: category,
      parentId: `main_${mainIndex}`,
      icon: CATEGORY_STYLES.middle[category]?.icon,
      color: CATEGORY_STYLES.middle[category]?.color
    }))
  }

  /**
   * 🔖 특정 중간 카테고리의 리프 카테고리 반환
   */
  getLeafCategories(middleCategory: MiddleCategory): Array<{
    id: string
    name: string
    originalName: LeafCategory
    parentId: string
  }> {
    const leafCategories = MIDDLE_TO_LEAF_MAPPING[middleCategory] || []
    
    // 부모 ID 찾기
    const parentId = this.findMiddleCategoryId(middleCategory)
    
    return leafCategories.map((category, index) => ({
      id: `leaf_${parentId}_${index}`,
      name: this.translateCategory('leaf', category),
      originalName: category,
      parentId
    }))
  }

  /**
   * 🔍 카테고리 검색
   */
  searchCategories(query: string): Array<{
    id: string
    name: string
    level: 'main' | 'middle' | 'leaf'
    originalName: string
    parentInfo?: string
  }> {
    const results: Array<any> = []
    const lowerQuery = query.toLowerCase()

    // 메인 카테고리 검색
    this.getMainCategories().forEach(category => {
      if (category.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          ...category,
          level: 'main' as const
        })
      }
    })

    // 중간 카테고리 검색
    MAIN_CATEGORIES.forEach(mainCat => {
      this.getMiddleCategories(mainCat).forEach(category => {
        if (category.name.toLowerCase().includes(lowerQuery)) {
          results.push({
            ...category,
            level: 'middle' as const,
            parentInfo: this.translateCategory('main', mainCat)
          })
        }
      })
    })

    // 리프 카테고리 검색
    Object.keys(MIDDLE_TO_LEAF_MAPPING).forEach(middleCat => {
      this.getLeafCategories(middleCat as MiddleCategory).forEach(category => {
        if (category.name.toLowerCase().includes(lowerQuery)) {
          results.push({
            ...category,
            level: 'leaf' as const,
            parentInfo: this.translateCategory('middle', middleCat as MiddleCategory)
          })
        }
      })
    })

    return results
  }

  /**
   * 📊 카테고리 통계
   */
  getCategoryStats(): {
    mainCount: number
    middleCount: number
    leafCount: number
    totalCount: number
  } {
    const mainCount = MAIN_CATEGORIES.length
    const middleCount = Object.keys(MIDDLE_TO_LEAF_MAPPING).length
    const leafCount = Object.values(MIDDLE_TO_LEAF_MAPPING)
      .reduce((sum, categories) => sum + categories.length, 0)

    return {
      mainCount,
      middleCount,
      leafCount,
      totalCount: mainCount + middleCount + leafCount
    }
  }

  /**
   * 🌍 카테고리 번역
   */
  private translateCategory(level: 'main' | 'middle' | 'leaf', category: string): string {
    if (this.currentLanguage === 'ko') {
      return category
    }

    const translations = CATEGORY_TRANSLATIONS[level] as any
    const translation = translations[category]
    
    if (translation && translation[this.currentLanguage]) {
      return translation[this.currentLanguage]
    }

    return category // 번역이 없으면 원본 반환
  }

  /**
   * 중간 카테고리 ID 찾기 헬퍼
   */
  private findMiddleCategoryId(middleCategory: MiddleCategory): string {
    for (const [mainCat, middleList] of Object.entries(MAIN_TO_MIDDLE_MAPPING)) {
      const middleIndex = middleList.indexOf(middleCategory)
      if (middleIndex !== -1) {
        const mainIndex = MAIN_CATEGORIES.indexOf(mainCat as MainCategory)
        return `middle_${mainIndex}_${middleIndex}`
      }
    }
    return 'unknown'
  }

  /**
   * 📈 사용 통계 추적 (TODO: 나중에 동적 시스템에서 활용)
   */
  trackCategoryUsage(categoryId: string, categoryName: string): void {
    // TODO: 나중에 Firebase Analytics로 전송
    console.log('카테고리 사용:', categoryId, categoryName)
  }
}