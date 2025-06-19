// 🔧 web/src/constants/categories.ts
// 하드코딩된 카테고리 데이터

import type { MainCategory, MiddleCategory, LeafCategory } from '@/types/category'

/**
 * 📋 메인 탭 리스트 (다국어 지원)
 */
export const MAIN_CATEGORIES: MainCategory[] = ['전체', '기계', '공구', '장비', '약품']

/**
 * 🗺️ 메인 카테고리 → 중간 카테고리 매핑
 */
export const MAIN_TO_MIDDLE_MAPPING: Record<MainCategory, MiddleCategory[]> = {
  '전체': [
    // 기계 관련
    '건설기계', '공작기계', '산업기계', '제조기계',
    // 공구 관련
    '수공구', '전동공구', '절삭공구', '측정공구',
    // 장비 관련
    '안전장비', '운송장비',
    // 약품 관련
    '의약품', '화공약품'
  ],
  '기계': ['건설기계', '공작기계', '산업기계', '제조기계'],
  '공구': ['수공구', '전동공구', '절삭공구', '측정공구'],
  '장비': ['안전장비', '운송장비'],
  '약품': ['의약품', '화공약품']
}

/**
 * 🔧 중간 카테고리 → 리프 카테고리 매핑
 */
export const MIDDLE_TO_LEAF_MAPPING: Record<MiddleCategory, LeafCategory[]> = {
  // 기계 관련 리프 카테고리
  '건설기계': ['불도저', '크레인'],
  '공작기계': ['CNC 선반', '연삭기'],
  '산업기계': ['굴착기', '유압 프레스'],
  '제조기계': ['사출 성형기', '열 성형기'],

  // 공구 관련 리프 카테고리
  '수공구': ['전동드릴', '플라이어', '해머'],
  '전동공구': ['그라인더', '전동톱', '해머드릴'],
  '절삭공구': ['가스 용접기', '커터'],
  '측정공구': ['마이크로미터', '하이트 게이지'],

  // 장비 관련 리프 카테고리
  '안전장비': [
    '헬멧', '방진 마스크', '낙하 방지벨트',
    '안전모', '안전화', '보호안경',
    '귀마개', '보호장갑', '호흡 보호구'
  ],
  '운송장비': ['리프트 장비', '체인 블록', '호이스트'],

  // 약품 관련 리프 카테고리
  '의약품': ['인슐린', '항생제'],
  '화공약품': ['황산', '염산']
}

/**
 * 🌍 다국어 번역 매핑
 */
export const CATEGORY_TRANSLATIONS = {
  // 메인 카테고리 번역
  main: {
    '전체': { en: 'All', vi: 'Tất cả', cn: '全部' },
    '기계': { en: 'Machinery', vi: 'Máy móc', cn: '机械' },
    '공구': { en: 'Tools', vi: 'Công cụ', cn: '工具' },
    '장비': { en: 'Equipment', vi: 'Thiết bị', cn: '设备' },
    '약품': { en: 'Chemicals', vi: 'Hóa chất', cn: '药品' }
  },
  
  // 중간 카테고리 번역
  middle: {
    '건설기계': { en: 'Construction Machinery', vi: 'Máy xây dựng', cn: '建筑机械' },
    '공작기계': { en: 'Machine Tools', vi: 'Máy công cụ', cn: '机床' },
    '산업기계': { en: 'Industrial Machinery', vi: 'Máy công nghiệp', cn: '工业机械' },
    '제조기계': { en: 'Manufacturing Equipment', vi: 'Thiết bị sản xuất', cn: '制造设备' },
    '수공구': { en: 'Hand Tools', vi: 'Dụng cụ cầm tay', cn: '手工具' },
    '전동공구': { en: 'Power Tools', vi: 'Dụng cụ điện', cn: '电动工具' },
    '절삭공구': { en: 'Cutting Tools', vi: 'Dụng cụ cắt', cn: '切削工具' },
    '측정공구': { en: 'Measuring Tools', vi: 'Dụng cụ đo', cn: '测量工具' },
    '안전장비': { en: 'Safety Equipment', vi: 'Thiết bị an toàn', cn: '安全设备' },
    '운송장비': { en: 'Transport Equipment', vi: 'Thiết bị vận chuyển', cn: '运输设备' },
    '의약품': { en: 'Pharmaceuticals', vi: 'Dược phẩm', cn: '药品' },
    '화공약품': { en: 'Chemical Products', vi: 'Hóa chất', cn: '化工产品' }
  },
  
  // 리프 카테고리 번역 (주요 항목만)
  leaf: {
    '불도저': { en: 'Bulldozer', vi: 'Máy ủi', cn: '推土机' },
    '크레인': { en: 'Crane', vi: 'Cần cẩu', cn: '起重机' },
    '굴착기': { en: 'Excavator', vi: 'Máy đào', cn: '挖掘机' },
    '헬멧': { en: 'Helmet', vi: 'Mũ bảo hiểm', cn: '头盔' },
    '안전모': { en: 'Hard Hat', vi: 'Mũ an toàn', cn: '安全帽' },
    '안전화': { en: 'Safety Shoes', vi: 'Giày an toàn', cn: '安全鞋' },
    '보호안경': { en: 'Safety Glasses', vi: 'Kính bảo hộ', cn: '护目镜' }
    // 필요시 더 추가...
  }
}

/**
 * 🎨 카테고리별 아이콘 및 색상 매핑
 */
export const CATEGORY_STYLES = {
  main: {
    '전체': { icon: 'Grid', color: '#409EFF' },
    '기계': { icon: 'Setting', color: '#F56C6C' },
    '공구': { icon: 'Tools', color: '#E6A23C' },
    '장비': { icon: 'Box', color: '#67C23A' },
    '약품': { icon: 'Medicine', color: '#909399' }
  },
  middle: {
    '건설기계': { icon: 'Truck', color: '#F56C6C' },
    '공작기계': { icon: 'Setting', color: '#F56C6C' },
    '산업기계': { icon: 'Operation', color: '#F56C6C' },
    '제조기계': { icon: 'Platform', color: '#F56C6C' },
    '수공구': { icon: 'Tools', color: '#E6A23C' },
    '전동공구': { icon: 'Lightning', color: '#E6A23C' },
    '절삭공구': { icon: 'Scissors', color: '#E6A23C' },
    '측정공구': { icon: 'Aim', color: '#E6A23C' },
    '안전장비': { icon: 'ShieldCheck', color: '#67C23A' },
    '운송장비': { icon: 'Van', color: '#67C23A' },
    '의약품': { icon: 'Medicine', color: '#909399' },
    '화공약품': { icon: 'Flask', color: '#909399' }
  }
}