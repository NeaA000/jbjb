// web/src/services/languageService.js
import { SUPPORTED_LANGUAGES } from '@/utils/constants'

class LanguageService {
    // 언어 관련 상수
    static DEFAULT_LANGUAGE = 'ko'
    static STORAGE_KEY = 'user_language_preference'

    // 언어 이름 맵핑
    static LANGUAGE_NAMES = {
        ko: '한국어',
        en: 'English',
        zh: '中文',
        vi: 'Tiếng Việt',
        th: 'ภาษาไทย',
        ja: '日本語',
        es: 'Español',
        fr: 'Français',
        de: 'Deutsch',
        ru: 'Русский'
    }

    // 언어 플래그 맵핑
    static LANGUAGE_FLAGS = {
        ko: '🇰🇷',
        en: '🇺🇸',
        zh: '🇨🇳',
        vi: '🇻🇳',
        th: '🇹🇭',
        ja: '🇯🇵',
        es: '🇪🇸',
        fr: '🇫🇷',
        de: '🇩🇪',
        ru: '🇷🇺'
    }

    // 언어별 로케일 맵핑
    static LANGUAGE_LOCALES = {
        ko: 'ko-KR',
        en: 'en-US',
        zh: 'zh-CN',
        vi: 'vi-VN',
        th: 'th-TH',
        ja: 'ja-JP',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        ru: 'ru-RU'
    }

    /**
     * 언어 코드로 언어 이름 가져오기
     */
    static getLanguageName(code) {
        return this.LANGUAGE_NAMES[code] || code.toUpperCase()
    }

    /**
     * 언어 코드로 플래그 가져오기
     */
    static getLanguageFlag(code) {
        return this.LANGUAGE_FLAGS[code] || '🌐'
    }

    /**
     * 언어 코드로 로케일 가져오기
     */
    static getLanguageLocale(code) {
        return this.LANGUAGE_LOCALES[code] || 'en-US'
    }

    /**
     * 사용자 선호 언어 가져오기
     */
    static getUserPreferredLanguage() {
        try {
            // 1. localStorage에서 확인
            const saved = localStorage.getItem(this.STORAGE_KEY)
            if (saved && this.isValidLanguage(saved)) {
                return saved
            }

            // 2. 브라우저 언어 확인
            const browserLang = navigator.language.substring(0, 2).toLowerCase()
            if (this.isValidLanguage(browserLang)) {
                return browserLang
            }

            // 3. 기본값 반환
            return this.DEFAULT_LANGUAGE
        } catch (error) {
            console.error('언어 설정 로드 오류:', error)
            return this.DEFAULT_LANGUAGE
        }
    }

    /**
     * 사용자 선호 언어 설정
     */
    static setUserPreferredLanguage(languageCode) {
        try {
            if (!this.isValidLanguage(languageCode)) {
                console.warn(`유효하지 않은 언어 코드: ${languageCode}`)
                return false
            }

            localStorage.setItem(this.STORAGE_KEY, languageCode)

            // HTML lang 속성 업데이트
            document.documentElement.lang = this.getLanguageLocale(languageCode)

            return true
        } catch (error) {
            console.error('언어 설정 저장 오류:', error)
            return false
        }
    }

    /**
     * 유효한 언어 코드인지 확인
     */
    static isValidLanguage(code) {
        return Object.keys(this.LANGUAGE_NAMES).includes(code)
    }

    /**
     * 지원하는 모든 언어 목록 가져오기
     */
    static getSupportedLanguages() {
        return Object.entries(this.LANGUAGE_NAMES).map(([code, name]) => ({
            code,
            name,
            flag: this.LANGUAGE_FLAGS[code],
            locale: this.LANGUAGE_LOCALES[code]
        }))
    }

    /**
     * 언어별 번역 텍스트 가져오기 (간단한 번역 시스템)
     */
    static getTranslation(key, language = null) {
        const lang = language || this.getUserPreferredLanguage()

        // 번역 데이터 (실제로는 별도 파일로 관리하는 것이 좋음)
        const translations = {
            ko: {
                // 공통
                'common.loading': '로딩 중...',
                'common.error': '오류가 발생했습니다',
                'common.success': '성공적으로 완료되었습니다',
                'common.confirm': '확인',
                'common.cancel': '취소',
                'common.save': '저장',
                'common.delete': '삭제',
                'common.edit': '수정',
                'common.back': '돌아가기',
                'common.next': '다음',
                'common.previous': '이전',
                'common.search': '검색',
                'common.filter': '필터',

                // 강의 관련
                'course.title': '강의 제목',
                'course.description': '강의 설명',
                'course.duration': '강의 시간',
                'course.difficulty': '난이도',
                'course.category': '카테고리',
                'course.enroll': '수강 신청',
                'course.start': '학습 시작',
                'course.continue': '이어서 학습',
                'course.completed': '수료 완료',

                // 진행률 관련
                'progress.title': '학습 진행률',
                'progress.completed': '완료',
                'progress.inProgress': '진행 중',
                'progress.notStarted': '시작 전',

                // 인증 관련
                'auth.login': '로그인',
                'auth.logout': '로그아웃',
                'auth.signup': '회원가입',
                'auth.profile': '프로필',

                // 메시지
                'message.enrollSuccess': '수강 신청이 완료되었습니다',
                'message.enrollError': '수강 신청에 실패했습니다',
                'message.saveSuccess': '저장되었습니다',
                'message.saveError': '저장에 실패했습니다',
                'message.deleteConfirm': '정말로 삭제하시겠습니까?',

                // 경고 메시지
                'warning.shakeDetected': '흔들림이 감지되었습니다',
                'warning.safetyFirst': '안전한 곳에서 수강해주세요',
                'warning.noWorkDuringStudy': '작업 중 수강 금지'
            },
            en: {
                // Common
                'common.loading': 'Loading...',
                'common.error': 'An error occurred',
                'common.success': 'Successfully completed',
                'common.confirm': 'Confirm',
                'common.cancel': 'Cancel',
                'common.save': 'Save',
                'common.delete': 'Delete',
                'common.edit': 'Edit',
                'common.back': 'Back',
                'common.next': 'Next',
                'common.previous': 'Previous',
                'common.search': 'Search',
                'common.filter': 'Filter',

                // Course related
                'course.title': 'Course Title',
                'course.description': 'Course Description',
                'course.duration': 'Duration',
                'course.difficulty': 'Difficulty',
                'course.category': 'Category',
                'course.enroll': 'Enroll',
                'course.start': 'Start Learning',
                'course.continue': 'Continue Learning',
                'course.completed': 'Completed',

                // Progress related
                'progress.title': 'Learning Progress',
                'progress.completed': 'Completed',
                'progress.inProgress': 'In Progress',
                'progress.notStarted': 'Not Started',

                // Auth related
                'auth.login': 'Login',
                'auth.logout': 'Logout',
                'auth.signup': 'Sign Up',
                'auth.profile': 'Profile',

                // Messages
                'message.enrollSuccess': 'Successfully enrolled',
                'message.enrollError': 'Failed to enroll',
                'message.saveSuccess': 'Saved successfully',
                'message.saveError': 'Failed to save',
                'message.deleteConfirm': 'Are you sure you want to delete?',

                // Warning messages
                'warning.shakeDetected': 'Shake detected',
                'warning.safetyFirst': 'Please study in a safe place',
                'warning.noWorkDuringStudy': 'No studying during work'
            },
            zh: {
                // 通用
                'common.loading': '加载中...',
                'common.error': '发生错误',
                'common.success': '成功完成',
                'common.confirm': '确认',
                'common.cancel': '取消',
                'common.save': '保存',
                'common.delete': '删除',
                'common.edit': '编辑',
                'common.back': '返回',
                'common.next': '下一步',
                'common.previous': '上一步',
                'common.search': '搜索',
                'common.filter': '筛选',

                // 课程相关
                'course.title': '课程标题',
                'course.description': '课程描述',
                'course.duration': '课程时长',
                'course.difficulty': '难度',
                'course.category': '分类',
                'course.enroll': '报名',
                'course.start': '开始学习',
                'course.continue': '继续学习',
                'course.completed': '已完成',

                // 进度相关
                'progress.title': '学习进度',
                'progress.completed': '已完成',
                'progress.inProgress': '进行中',
                'progress.notStarted': '未开始',

                // 认证相关
                'auth.login': '登录',
                'auth.logout': '退出',
                'auth.signup': '注册',
                'auth.profile': '个人资料',

                // 消息
                'message.enrollSuccess': '报名成功',
                'message.enrollError': '报名失败',
                'message.saveSuccess': '保存成功',
                'message.saveError': '保存失败',
                'message.deleteConfirm': '确定要删除吗？',

                // 警告消息
                'warning.shakeDetected': '检测到晃动',
                'warning.safetyFirst': '请在安全的地方学习',
                'warning.noWorkDuringStudy': '工作时禁止学习'
            }
        }

        return translations[lang]?.[key] || translations[this.DEFAULT_LANGUAGE]?.[key] || key
    }

    /**
     * 날짜 포맷 (언어별)
     */
    static formatDate(date, language = null) {
        const lang = language || this.getUserPreferredLanguage()
        const locale = this.getLanguageLocale(lang)

        if (!date) return ''

        const d = new Date(date)

        // Intl.DateTimeFormat을 사용한 언어별 날짜 포맷
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(d)
    }

    /**
     * 시간 포맷 (언어별)
     */
    static formatTime(date, language = null) {
        const lang = language || this.getUserPreferredLanguage()
        const locale = this.getLanguageLocale(lang)

        if (!date) return ''

        const d = new Date(date)

        return new Intl.DateTimeFormat(locale, {
            hour: '2-digit',
            minute: '2-digit'
        }).format(d)
    }

    /**
     * 숫자 포맷 (언어별)
     */
    static formatNumber(number, language = null) {
        const lang = language || this.getUserPreferredLanguage()
        const locale = this.getLanguageLocale(lang)

        return new Intl.NumberFormat(locale).format(number)
    }

    /**
     * 통화 포맷 (언어별)
     */
    static formatCurrency(amount, currency = 'KRW', language = null) {
        const lang = language || this.getUserPreferredLanguage()
        const locale = this.getLanguageLocale(lang)

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount)
    }

    /**
     * 언어 변경 이벤트 리스너 등록
     */
    static onLanguageChange(callback) {
        // CustomEvent를 사용한 언어 변경 이벤트
        window.addEventListener('languagechange', callback)

        // 클린업 함수 반환
        return () => {
            window.removeEventListener('languagechange', callback)
        }
    }

    /**
     * 언어 변경 이벤트 발생
     */
    static emitLanguageChange(newLanguage) {
        const event = new CustomEvent('languagechange', {
            detail: { language: newLanguage }
        })
        window.dispatchEvent(event)
    }

    /**
     * RTL 언어 여부 확인
     */
    static isRTL(language = null) {
        const lang = language || this.getUserPreferredLanguage()
        const rtlLanguages = ['ar', 'he', 'fa', 'ur']
        return rtlLanguages.includes(lang)
    }

    /**
     * 언어별 폰트 설정 가져오기
     */
    static getFontFamily(language = null) {
        const lang = language || this.getUserPreferredLanguage()

        const fontMap = {
            ko: '"Noto Sans KR", sans-serif',
            ja: '"Noto Sans JP", sans-serif',
            zh: '"Noto Sans SC", sans-serif',
            th: '"Noto Sans Thai", sans-serif',
            ar: '"Noto Sans Arabic", sans-serif',
            default: '"Noto Sans", sans-serif'
        }

        return fontMap[lang] || fontMap.default
    }

    /**
     * 언어 자동 감지
     */
    static detectLanguage(text) {
        // 간단한 언어 감지 로직 (실제로는 더 복잡한 알고리즘 필요)
        const patterns = {
            ko: /[가-힣]/,
            ja: /[\u3040-\u309F\u30A0-\u30FF]/,
            zh: /[\u4E00-\u9FFF]/,
            th: /[\u0E00-\u0E7F]/,
            ar: /[\u0600-\u06FF]/,
            ru: /[А-я]/
        }

        for (const [lang, pattern] of Object.entries(patterns)) {
            if (pattern.test(text)) {
                return lang
            }
        }

        return 'en' // 기본값
    }

    /**
     * 언어 설정 초기화
     */
    static clearLanguagePreference() {
        localStorage.removeItem(this.STORAGE_KEY)
    }
}

export default LanguageService