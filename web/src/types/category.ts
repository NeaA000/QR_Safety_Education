// 📁 web/src/types/category.ts
// 카테고리 관련 타입 정의

export type MainCategory = '전체' | '기계' | '공구' | '장비' | '약품'

export type MiddleCategory = 
  // 기계 관련
  | '건설기계' | '공작기계' | '산업기계' | '제조기계'
  // 공구 관련  
  | '수공구' | '전동공구' | '절삭공구' | '측정공구'
  // 장비 관련
  | '안전장비' | '운송장비'
  // 약품 관련
  | '의약품' | '화공약품'

export type LeafCategory = 
  // 기계 관련
  | '불도저' | '크레인' | 'CNC 선반' | '연삭기' | '굴착기' | '유압 프레스' | '사출 성형기' | '열 성형기'
  // 공구 관련
  | '전동드릴' | '플라이어' | '해머' | '그라인더' | '전동톱' | '해머드릴' | '가스 용접기' | '커터' | '마이크로미터' | '하이트 게이지'
  // 장비 관련 
  | '헬멧' | '방진 마스크' | '낙하 방지벨트' | '안전모' | '안전화' | '보호안경' | '귀마개' | '보호장갑' | '호흡 보호구' | '리프트 장비' | '체인 블록' | '호이스트'
  // 약품 관련
  | '인슐린' | '항생제' | '황산' | '염산'

// 카테고리 노드 인터페이스
export interface CategoryNode {
  id: string
  name: string
  nameEn?: string
  nameVi?: string
  nameCn?: string
  level: 'main' | 'middle' | 'leaf'
  parentId?: string
  icon?: string
  color?: string
  description?: string
}