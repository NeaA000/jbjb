// web/src/services/categoryService.js

/**
 * 카테고리 관리 서비스
 * - Flutter VideoService와 동일한 카테고리 구조 사용
 * - 다국어 지원 (현재는 한국어 기준, 추후 확장)
 * - 중앙화된 카테고리 관리로 일관성 보장
 * - 🔥 Firebase uploads 데이터와 호환
 */
export class CategoryService {
    // 🌟 메인 탭 리스트 (한국어 기준) - Flutter와 동일
    static MAIN_TABS_KOREAN = ['전체', '기계', '공구', '장비', '약품']

    // 🌟 메인 탭 → 중간 카테고리 매핑 (한국어) - Flutter와 동일
    static MAIN_TO_MID_KOREAN = {
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

    // 🔧 중간 카테고리 → 리프 카테고리 매핑 (한국어) - Flutter와 동일
    static MID_TO_LEAF_KOREAN = {
        // 🔧 기계 관련 리프 카테고리
        '건설기계': ['불도저', '크레인', '굴착기'], // 🔥 굴착기 추가 (Firebase 데이터 호환)
        '공작기계': ['CNC 선반', '연삭기'], // 절삭기 제거
        '산업기계': ['굴착기', '유압 프레스'], // 굴착기 유지 (기존 호환성)
        '제조기계': ['사출 성형기', '열 성형기'], // 프레스기 제거

        // 🔧 공구 관련 리프 카테고리
        '수공구': ['플라이어', '해머'], // 🔥 전동드릴 제거 (전동공구로 이동)
        '전동공구': ['그라인더', '전동톱', '해머드릴', '전동드릴'], // 🔥 전동드릴 추가
        '절삭공구': ['가스 용접기', '커터'], // 플라즈마 노즐, 드릴 비트 제거하고 가스 용접기 추가
        '측정공구': ['마이크로미터', '하이트 게이지'], // 캘리퍼스 제거

        // 장비 관련 - 변경 없음
        '안전장비': [
            '헬멧', '방진 마스크', '낙하 방지벨트',
            '안전모', '안전화', '보호안경',
            '귀마개', '보호장갑', '호흡 보호구'
        ],
        '운송장비': ['리프트 장비', '체인 블록', '호이스트'],

        // 🔧 약품 관련 리프 카테고리
        '의약품': ['인슐린', '항생제'], // 항응고제 제거, 순서 변경
        '화공약품': ['황산', '염산'] // 수산화나트륨 제거
    }

    // 🌍 다국어 번역 매핑 (추후 확장 예정)
    static TRANSLATIONS = {
        // 메인 카테고리
        mainCategories: {
            '전체': { ko: '전체', en: 'All' },
            '기계': { ko: '기계', en: 'Machinery' },
            '공구': { ko: '공구', en: 'Tools' },
            '장비': { ko: '장비', en: 'Equipment' },
            '약품': { ko: '약품', en: 'Chemicals' }
        },
        // 중간 카테고리
        midCategories: {
            '건설기계': { ko: '건설기계', en: 'Construction Machinery' },
            '공작기계': { ko: '공작기계', en: 'Machine Tools' },
            '산업기계': { ko: '산업기계', en: 'Industrial Machinery' },
            '제조기계': { ko: '제조기계', en: 'Manufacturing Machinery' },
            '수공구': { ko: '수공구', en: 'Hand Tools' },
            '전동공구': { ko: '전동공구', en: 'Power Tools' },
            '절삭공구': { ko: '절삭공구', en: 'Cutting Tools' },
            '측정공구': { ko: '측정공구', en: 'Measuring Tools' },
            '안전장비': { ko: '안전장비', en: 'Safety Equipment' },
            '운송장비': { ko: '운송장비', en: 'Transport Equipment' },
            '의약품': { ko: '의약품', en: 'Medicine' },
            '화공약품': { ko: '화공약품', en: 'Chemical Agent' }
        }
    }

    // ============== 🔥 Firebase 호환을 위한 추가 메서드들 ==============

    /**
     * 🔥 Firebase 업로드 카테고리 구조 검증 (추가)
     * @param {string} main 메인 카테고리
     * @param {string} sub 서브 카테고리 (middle)
     * @param {string} leaf 리프 카테고리
     * @returns {boolean} 유효성 여부
     */
    static isValidCategoryPath(main, sub, leaf) {
        try {
            // 1. 메인 카테고리 검증
            if (!this.MAIN_TABS_KOREAN.includes(main)) {
                console.warn(`❌ 잘못된 메인 카테고리: ${main}`)
                return false
            }

            // 2. 서브 카테고리 검증
            const validSubs = this.MAIN_TO_MID_KOREAN[main] || []
            if (!validSubs.includes(sub)) {
                console.warn(`❌ 잘못된 서브 카테고리: ${main}>${sub}`)
                return false
            }

            // 3. 리프 카테고리 검증
            const validLeafs = this.MID_TO_LEAF_KOREAN[sub] || []
            if (!validLeafs.includes(leaf)) {
                console.warn(`❌ 잘못된 리프 카테고리: ${sub}>${leaf}`)
                return false
            }

            return true
        } catch (error) {
            console.error('카테고리 경로 검증 오류:', error)
            return false
        }
    }

    /**
     * 🔥 Firebase 데이터를 위한 카테고리 정규화 (추가)
     * @param {Object} firebaseData Firebase 업로드 데이터
     * @returns {Object} 정규화된 카테고리 객체
     */
    static normalizeCategoryFromFirebase(firebaseData) {
        return {
            main: firebaseData.main_category || firebaseData.category || '',
            middle: firebaseData.sub_category || '',
            leaf: firebaseData.sub_sub_category || ''
        }
    }

    /**
     * 🔥 디버깅을 위한 카테고리 매핑 출력 (추가)
     */
    static debugCategoryMapping() {
        console.log('=== 카테고리 구조 ===')
        console.log('메인 카테고리:', this.MAIN_TABS_KOREAN)
        console.log('메인 → 중간 매핑:', this.MAIN_TO_MID_KOREAN)
        console.log('중간 → 리프 매핑:', this.MID_TO_LEAF_KOREAN)
    }

    // ============== 기존 메서드들 ==============

    /**
     * 메인 카테고리 목록 가져오기
     * @param {boolean} includeAll '전체' 포함 여부
     * @returns {string[]} 메인 카테고리 배열
     */
    static getMainCategories(includeAll = false) {
        if (includeAll) {
            return [...this.MAIN_TABS_KOREAN]
        }
        return this.MAIN_TABS_KOREAN.filter(cat => cat !== '전체')
    }

    /**
     * 특정 메인 카테고리의 중간 카테고리 목록
     * @param {string} mainCategory 메인 카테고리
     * @returns {string[]} 중간 카테고리 배열
     */
    static getMiddleCategories(mainCategory) {
        return this.MAIN_TO_MID_KOREAN[mainCategory] || []
    }

    /**
     * 특정 중간 카테고리의 리프 카테고리 목록
     * @param {string} mainCategory 메인 카테고리
     * @param {string} middleCategory 중간 카테고리
     * @returns {string[]} 리프 카테고리 배열
     */
    static getLeafCategories(mainCategory, middleCategory) {
        return this.MID_TO_LEAF_KOREAN[middleCategory] || []
    }

    /**
     * 메인 탭 리스트 반환
     * @param {string} lang 언어 코드 (기본값: 'ko')
     * @returns {string[]} 메인 탭 배열
     */
    static getMainTabs(lang = 'ko') {
        if (lang === 'ko') {
            return [...this.MAIN_TABS_KOREAN]
        }

        // 추후 다국어 지원 시 확장
        return [...this.MAIN_TABS_KOREAN]
    }

    /**
     * 메인 → 중간 카테고리 매핑 반환
     * @param {string} lang 언어 코드
     * @returns {Object} 매핑 객체
     */
    static getMainToMidMapping(lang = 'ko') {
        if (lang === 'ko') {
            return { ...this.MAIN_TO_MID_KOREAN }
        }

        // 추후 다국어 지원 시 확장
        return { ...this.MAIN_TO_MID_KOREAN }
    }

    /**
     * 중간 → 리프 카테고리 매핑 반환
     * @param {string} lang 언어 코드
     * @returns {Object} 매핑 객체
     */
    static getMidToLeafMapping(lang = 'ko') {
        if (lang === 'ko') {
            return { ...this.MID_TO_LEAF_KOREAN }
        }

        // 추후 다국어 지원 시 확장
        return { ...this.MID_TO_LEAF_KOREAN }
    }

    /**
     * 특정 메인 카테고리의 모든 하위 카테고리 반환
     * @param {string} mainCategory 메인 카테고리명
     * @param {string} lang 언어 코드
     * @returns {string[]} 중간 + 리프 카테고리 배열
     */
    static getAllSubCategories(mainCategory, lang = 'ko') {
        const midCategories = this.MAIN_TO_MID_KOREAN[mainCategory] || []
        const allSubCategories = [...midCategories]

        // 각 중간 카테고리의 리프 카테고리들도 추가
        midCategories.forEach(midCat => {
            const leafCategories = this.MID_TO_LEAF_KOREAN[midCat] || []
            allSubCategories.push(...leafCategories)
        })

        return allSubCategories
    }

    /**
     * 카테고리 매칭 검사 (검색/필터링용)
     * @param {string} targetCategory 검색할 카테고리
     * @param {string[]} itemCategories 아이템의 카테고리들 [main, mid, leaf]
     * @returns {boolean} 매칭 여부
     */
    static matchesCategory(targetCategory, itemCategories) {
        const [mainCat, subCat, leafCat] = itemCategories
        const allCats = [mainCat, subCat, leafCat].filter(Boolean)

        let searchCats = []

        // 메인 탭인 경우
        if (this.MAIN_TABS_KOREAN.includes(targetCategory)) {
            const mids = this.MAIN_TO_MID_KOREAN[targetCategory] || []
            searchCats = [
                targetCategory,
                ...mids,
                ...mids.flatMap(m => this.MID_TO_LEAF_KOREAN[m] || [])
            ]
        }
        // 중간 카테고리인 경우
        else if (this.isMiddleCategory(targetCategory)) {
            searchCats = [
                targetCategory,
                ...(this.MID_TO_LEAF_KOREAN[targetCategory] || [])
            ]
        }
        // 리프 카테고리인 경우
        else {
            searchCats = [targetCategory]
        }

        return allCats.some(cat => searchCats.includes(cat))
    }

    /**
     * 중간 카테고리 여부 확인
     * @param {string} category 카테고리명
     * @returns {boolean} 중간 카테고리 여부
     */
    static isMiddleCategory(category) {
        return Object.values(this.MAIN_TO_MID_KOREAN)
            .flat()
            .includes(category)
    }

    /**
     * 리프 카테고리 여부 확인
     * @param {string} category 카테고리명
     * @returns {boolean} 리프 카테고리 여부
     */
    static isLeafCategory(category) {
        return Object.values(this.MID_TO_LEAF_KOREAN)
            .flat()
            .includes(category)
    }

    /**
     * 카테고리 타입 반환
     * @param {string} category 카테고리명
     * @returns {string} 'main' | 'middle' | 'leaf' | 'unknown'
     */
    static getCategoryType(category) {
        if (this.MAIN_TABS_KOREAN.includes(category)) {
            return 'main'
        }
        if (this.isMiddleCategory(category)) {
            return 'middle'
        }
        if (this.isLeafCategory(category)) {
            return 'leaf'
        }
        return 'unknown'
    }

    /**
     * 카테고리 번역
     * @param {string} category 카테고리명 (한국어)
     * @param {string} lang 대상 언어
     * @returns {string} 번역된 카테고리명
     */
    static translateCategory(category, lang = 'ko') {
        if (lang === 'ko') {
            return category
        }

        // 추후 다국어 지원 시 구현
        return category
    }

    /**
     * 카테고리 스타일 클래스 반환 (UI용)
     * @param {string} category 카테고리명
     * @returns {string} CSS 클래스명
     */
    static getCategoryStyle(category) {
        // 메인 카테고리별 색상 스타일
        const mainCategory = this.getMainCategoryForItem(category)

        const styleMap = {
            '기계': 'bg-blue-100 text-blue-800',
            '공구': 'bg-green-100 text-green-800',
            '장비': 'bg-purple-100 text-purple-800',
            '약품': 'bg-red-100 text-red-800'
        }

        return styleMap[mainCategory] || 'bg-gray-100 text-gray-800'
    }

    /**
     * 아이템 카테고리로부터 메인 카테고리 찾기
     * @param {string} category 중간 또는 리프 카테고리
     * @returns {string} 메인 카테고리명
     */
    static getMainCategoryForItem(category) {
        // 이미 메인 카테고리인 경우
        if (this.MAIN_TABS_KOREAN.includes(category)) {
            return category
        }

        // 중간 카테고리인 경우
        for (const [mainCat, midCats] of Object.entries(this.MAIN_TO_MID_KOREAN)) {
            if (midCats.includes(category)) {
                return mainCat
            }
        }

        // 리프 카테고리인 경우
        for (const [midCat, leafCats] of Object.entries(this.MID_TO_LEAF_KOREAN)) {
            if (leafCats.includes(category)) {
                return this.getMainCategoryForItem(midCat)
            }
        }

        return '전체'
    }

    /**
     * 카테고리 검증
     * @param {string[]} categories [main, middle, leaf] 형태의 카테고리 배열
     * @returns {Object} 유효성 검사 결과
     */
    static validateCategories(categories) {
        const [main, middle, leaf] = categories
        const errors = []

        // 메인 카테고리 검증
        if (main && !this.MAIN_TABS_KOREAN.includes(main)) {
            errors.push(`유효하지 않은 메인 카테고리: ${main}`)
        }

        // 중간 카테고리 검증
        if (middle) {
            if (!this.isMiddleCategory(middle)) {
                errors.push(`유효하지 않은 중간 카테고리: ${middle}`)
            } else if (main && !(this.MAIN_TO_MID_KOREAN[main] || []).includes(middle)) {
                errors.push(`메인 카테고리 ${main}에 속하지 않는 중간 카테고리: ${middle}`)
            }
        }

        // 리프 카테고리 검증
        if (leaf) {
            if (!this.isLeafCategory(leaf)) {
                errors.push(`유효하지 않은 리프 카테고리: ${leaf}`)
            } else if (middle && !(this.MID_TO_LEAF_KOREAN[middle] || []).includes(leaf)) {
                errors.push(`중간 카테고리 ${middle}에 속하지 않는 리프 카테고리: ${leaf}`)
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }

    /**
     * 카테고리 경로 문자열 생성
     * @param {Object} category { main, middle, leaf } 객체
     * @returns {string} "메인 > 중간 > 리프" 형태의 문자열
     */
    static getCategoryPath(category) {
        const parts = []
        if (category.main) parts.push(category.main)
        if (category.middle) parts.push(category.middle)
        if (category.leaf) parts.push(category.leaf)
        return parts.join(' > ')
    }
}

// default export도 제공 (하위 호환성)
export default CategoryService