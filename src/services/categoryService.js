// web/src/services/categoryService.js

/**
 * 카테고리 서비스
 * 카테고리 계층 구조 및 매핑 관리
 */
class CategoryService {
    /**
     * 카테고리 계층 구조 정의
     */
    static categoryHierarchy = {
        '기계': {
            '건설장비': ['불도저', '크레인', '굴착기'],
            '산업기계': ['CNC 선반', '연삭기', '유압 프레스']
        },
        '공구': {
            '전동공구': ['드릴', '그라인더', '전기톱'],
            '수공구': ['드라이버', '스패너', '펜치']
        },
        '장비': {
            '안전장비': ['낙하 방지벨트', '안전모', '안전화', '보호안경', '귀마개', '보호장갑', '호흡 보호구'],
            '중장비': ['리프트 장비', '체인 블록', '호이스트']
        },
        '약품': {
            '의약품': ['인슐린', '항생제'],
            '화학약품': ['황산', '염산']
        }
    }

    /**
     * 리프 카테고리에서 메인 카테고리 찾기
     * @param {string} leafCategory - 리프 카테고리명
     * @returns {string|null} 메인 카테고리명
     */
    static getMainCategoryForItem(leafCategory) {
        if (!leafCategory) return null

        for (const [mainCategory, midCategories] of Object.entries(this.categoryHierarchy)) {
            for (const [, leafCategories] of Object.entries(midCategories)) {
                if (leafCategories.includes(leafCategory)) {
                    return mainCategory
                }
            }
        }
        return null
    }

    /**
     * 카테고리별 스타일 반환
     * @param {string} leafCategory - 리프 카테고리명
     * @returns {object} 스타일 객체
     */
    static getCategoryStyle(leafCategory) {
        const mainCategory = this.getMainCategoryForItem(leafCategory)

        const styleMap = {
            '기계': {
                backgroundColor: '#dbeafe',
                color: '#1e40af'
            },
            '공구': {
                backgroundColor: '#d1fae5',
                color: '#065f46'
            },
            '장비': {
                backgroundColor: '#e9d5ff',
                color: '#6b21a8'
            },
            '약품': {
                backgroundColor: '#fee2e2',
                color: '#dc2626'
            }
        }

        return styleMap[mainCategory] || {
            backgroundColor: '#f3f4f6',
            color: '#374151'
        }
    }

    /**
     * 메인 카테고리 목록 가져오기
     */
    static getMainCategories() {
        return Object.keys(this.categoryHierarchy)
    }

    /**
     * 메인 카테고리 탭 목록 (전체 포함)
     */
    static getMainTabs() {
        return ['전체', ...this.getMainCategories()]
    }

    /**
     * 특정 메인 카테고리의 중간 카테고리 목록
     */
    static getMiddleCategories(mainCategory) {
        return Object.keys(this.categoryHierarchy[mainCategory] || {})
    }

    /**
     * 특정 중간 카테고리의 리프 카테고리 목록
     */
    static getLeafCategories(mainCategory, middleCategory) {
        if (!this.categoryHierarchy[mainCategory]) return []
        return this.categoryHierarchy[mainCategory][middleCategory] || []
    }

    /**
     * 메인-중간 카테고리 매핑
     */
    static getMainToMidMapping() {
        const mapping = {}
        for (const [mainCategory, midCategories] of Object.entries(this.categoryHierarchy)) {
            mapping[mainCategory] = Object.keys(midCategories)
        }
        return mapping
    }

    /**
     * 중간-리프 카테고리 매핑
     */
    static getMidToLeafMapping() {
        const mapping = {}
        for (const [, midCategories] of Object.entries(this.categoryHierarchy)) {
            for (const [midCategory, leafCategories] of Object.entries(midCategories)) {
                mapping[midCategory] = leafCategories
            }
        }
        return mapping
    }

    /**
     * 카테고리 경로 생성
     */
    static getCategoryPath(leafCategory) {
        for (const [mainCategory, midCategories] of Object.entries(this.categoryHierarchy)) {
            for (const [midCategory, leafCategories] of Object.entries(midCategories)) {
                if (leafCategories.includes(leafCategory)) {
                    return {
                        main: mainCategory,
                        middle: midCategory,
                        leaf: leafCategory,
                        fullPath: `${mainCategory} > ${midCategory} > ${leafCategory}`
                    }
                }
            }
        }
        return {
            main: '',
            middle: '',
            leaf: leafCategory,
            fullPath: leafCategory
        }
    }

    /**
     * 카테고리 유효성 검사
     */
    static isValidCategory(main, middle = null, leaf = null) {
        if (!this.categoryHierarchy[main]) return false
        if (middle && !this.categoryHierarchy[main][middle]) return false
        if (leaf && (!middle || !this.categoryHierarchy[main][middle].includes(leaf))) return false
        return true
    }

    /**
     * 전체 카테고리 트리 구조 반환
     */
    static getCategoryTree() {
        const tree = []
        for (const [mainCategory, midCategories] of Object.entries(this.categoryHierarchy)) {
            const mainNode = {
                label: mainCategory,
                value: mainCategory,
                children: []
            }

            for (const [midCategory, leafCategories] of Object.entries(midCategories)) {
                const midNode = {
                    label: midCategory,
                    value: midCategory,
                    children: leafCategories.map(leaf => ({
                        label: leaf,
                        value: leaf
                    }))
                }
                mainNode.children.push(midNode)
            }

            tree.push(mainNode)
        }
        return tree
    }

    /**
     * 디버깅용 카테고리 매핑 정보 출력
     */
    static debugCategoryMapping() {
        console.log('=== CategoryService 디버깅 정보 ===')
        console.log('메인 카테고리:', this.getMainCategories())
        console.log('메인-중간 매핑:', this.getMainToMidMapping())
        console.log('중간-리프 매핑:', this.getMidToLeafMapping())
        console.log('전체 계층 구조:', this.categoryHierarchy)
    }

    /**
     * 카테고리 통계 정보
     */
    static getCategoryStats() {
        let totalMain = 0
        let totalMiddle = 0
        let totalLeaf = 0

        for (const [, midCategories] of Object.entries(this.categoryHierarchy)) {
            totalMain++
            for (const [, leafCategories] of Object.entries(midCategories)) {
                totalMiddle++
                totalLeaf += leafCategories.length
            }
        }

        return {
            mainCategories: totalMain,
            middleCategories: totalMiddle,
            leafCategories: totalLeaf,
            total: totalMain + totalMiddle + totalLeaf
        }
    }

    /**
     * 카테고리 검색
     * @param {string} keyword - 검색 키워드
     * @returns {Array} 매칭되는 카테고리 목록
     */
    static searchCategories(keyword) {
        const results = []
        const lowerKeyword = keyword.toLowerCase()

        for (const [mainCategory, midCategories] of Object.entries(this.categoryHierarchy)) {
            // 메인 카테고리 검색
            if (mainCategory.toLowerCase().includes(lowerKeyword)) {
                results.push({
                    type: 'main',
                    category: mainCategory,
                    path: mainCategory
                })
            }

            for (const [midCategory, leafCategories] of Object.entries(midCategories)) {
                // 중간 카테고리 검색
                if (midCategory.toLowerCase().includes(lowerKeyword)) {
                    results.push({
                        type: 'middle',
                        category: midCategory,
                        path: `${mainCategory} > ${midCategory}`
                    })
                }

                // 리프 카테고리 검색
                for (const leafCategory of leafCategories) {
                    if (leafCategory.toLowerCase().includes(lowerKeyword)) {
                        results.push({
                            type: 'leaf',
                            category: leafCategory,
                            path: `${mainCategory} > ${midCategory} > ${leafCategory}`
                        })
                    }
                }
            }
        }

        return results
    }

    /**
     * 카테고리별 아이콘 매핑 (필요시 사용)
     */
    static getCategoryIcon(mainCategory) {
        const iconMap = {
            '기계': 'wrench',
            '공구': 'hammer',
            '장비': 'hard-hat',
            '약품': 'flask-conical'
        }
        return iconMap[mainCategory] || 'folder'
    }
}

// ES6 모듈 export
export { CategoryService }

// CommonJS 호환성을 위한 default export
export default CategoryService