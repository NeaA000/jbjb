// web/src/utils/constants.js - Firebase 컬렉션명 및 앱 전체 상수 정의

/**
 * 🔥 Firebase Firestore 컬렉션명 상수
 */
export const FIREBASE_COLLECTIONS = {
    // Flask 업로드 데이터 (메인 컬렉션)
    UPLOADS: 'uploads', // 메인 Flask 업로드 컬렉션

    // Vue 앱 전용 컬렉션
    COURSES: 'courses',
    ENROLLMENTS: 'enrollments',
    PROGRESS: 'progress',
    CERTIFICATES: 'certificates',
    USERS: 'users',

    // QR 접근 로그
    QR_ACCESS_LOGS: 'qr_access_logs',

    // 앱 설정
    APP_SETTINGS: 'app_settings'
}

/**
 * 🔥 Flask 업로드 데이터 서브컬렉션명
 */
export const FLASK_SUBCOLLECTIONS = {
    LANGUAGE_VIDEOS: 'language_videos',
    METADATA: 'metadata',
    TRANSLATIONS: 'translations'
}

/**
 * 📱 앱 설정 상수
 */
export const APP_CONFIG = {
    NAME: 'QR 안전교육',
    VERSION: '1.0.0',
    SUPPORTED_LANGUAGES: ['ko', 'en', 'zh', 'vi', 'th', 'ja'],
    DEFAULT_LANGUAGE: 'ko',
    MAX_SELECTED_COURSES: 10,
    VIDEO_AUTOPLAY: false,
    CACHE_DURATION: 30 * 60 * 1000, // 30분
    REQUEST_TIMEOUT: 30000 // 30초
}

/**
 * 🎯 카테고리 구조 (Flask 호환)
 */
export const CATEGORY_STRUCTURE = {
    MAIN_CATEGORIES: ['기계', '공구', '장비', '약품'],

    SUB_CATEGORIES: {
        '기계': ['건설기계', '공작기계', '산업기계', '제조기계'],
        '공구': ['수공구', '전동공구', '절삭공구', '측정공구'],
        '장비': ['안전장비', '운송장비'],
        '약품': ['의약품', '화공약품']
    },

    LEAF_CATEGORIES: {
        '건설기계': ['불도저', '크레인'],
        '공작기계': ['CNC 선반', '연삭기'],
        '산업기계': ['굴착기', '유압 프레스'],
        '제조기계': ['사출 성형기', '열 성형기'],
        '수공구': ['전동드릴', '플라이어', '해머'],
        '전동공구': ['그라인더', '전동톱', '해머드릴'],
        '절삭공구': ['가스 용접기', '커터'],
        '측정공구': ['마이크로미터', '하이트 게이지'],
        '안전장비': ['헬멧', '방진 마스크', '낙하 방지벨트', '안전모', '안전화', '보호안경', '귀마개', '보호장갑', '호흡 보호구'],
        '운송장비': ['리프트 장비', '체인 블록', '호이스트'],
        '의약품': ['인슐린', '항생제'],
        '화공약품': ['황산', '염산']
    }
}

/**
 * 🌐 지원 언어 매핑
 */
export const SUPPORTED_LANGUAGES = {
    'ko': '한국어',
    'en': 'English',
    'zh': '中文',
    'vi': 'Tiếng Việt',
    'th': 'ไทย',
    'ja': '日本語',
    'my': 'မြန်မာဘာသာ',
    'km': 'ភាសាខ្មែរ',
    'id': 'Bahasa Indonesia',
    'ms': 'Bahasa Melayu',
    'tl': 'Tagalog',
    'hi': 'हिन्दी',
    'bn': 'বাংলা',
    'ne': 'नेपाली',
    'ur': 'اردو',
    'ar': 'العربية',
    'es': 'Español',
    'pt': 'Português',
    'ru': 'Русский',
    'fr': 'Français',
    'de': 'Deutsch'
}

/**
 * 💾 로컬 스토리지 키
 */
export const STORAGE_KEYS = {
    // 인증 관련
    USER_PROFILE: 'userProfile',
    AUTH_TOKEN: 'authToken',
    REFRESH_TOKEN: 'refreshToken',
    DEVICE_ID: 'deviceId',

    // 강의 관련
    SELECTED_COURSES: 'selectedCourses',
    COURSE_PROGRESS: 'courseProgress',
    COURSE_ENROLLMENTS: 'courseEnrollments',
    COURSES_CACHE: 'coursesCache',
    COURSES_CACHE_TIMESTAMP: 'coursesCacheTimestamp',

    // 비디오 재생 관련
    VIDEO_SETTINGS: 'videoSettings',
    LAST_PLAYED_POSITION: 'lastPlayedPosition',
    PLAYBACK_SPEED: 'playbackSpeed',
    VOLUME_LEVEL: 'volumeLevel',

    // 앱 설정
    LANGUAGE_PREFERENCE: 'languagePreference',
    THEME_PREFERENCE: 'themePreference',
    NOTIFICATION_SETTINGS: 'notificationSettings',

    // QR 관련
    QR_SCAN_HISTORY: 'qrScanHistory',
    LAST_QR_SCAN: 'lastQrScan'
}

/**
 * 👤 사용자 역할
 */
export const USER_ROLES = {
    GUEST: 'guest',
    USER: 'user',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
}

/**
 * 📚 등록 상태
 */
export const ENROLLMENT_STATUS = {
    NOT_ENROLLED: 'not-enrolled',
    ENROLLED: 'enrolled',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    DROPPED: 'dropped'
}

/**
 * ▶️ 재생 상태
 */
export const PLAYBACK_STATUS = {
    IDLE: 'idle',
    LOADING: 'loading',
    PLAYING: 'playing',
    PAUSED: 'paused',
    BUFFERING: 'buffering',
    ENDED: 'ended',
    ERROR: 'error'
}

/**
 * 📱 반응형 브레이크포인트
 */
export const BREAKPOINTS = {
    XS: 320,
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    XXL: 1536
}

/**
 * 🎨 테마 색상
 */
export const THEME_COLORS = {
    PRIMARY: '#2563eb', // blue-600
    SECONDARY: '#7c3aed', // violet-600
    SUCCESS: '#16a34a', // green-600
    WARNING: '#f59e0b', // amber-500
    ERROR: '#dc2626', // red-600
    INFO: '#0891b2', // cyan-600
    DARK: '#1f2937', // gray-800
    LIGHT: '#f3f4f6' // gray-100
}

/**
 * ⏱️ 타이머 설정 (밀리초)
 */
export const TIMERS = {
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 3000,
    AUTO_SAVE_INTERVAL: 30000, // 30초
    SESSION_CHECK_INTERVAL: 60000, // 1분
    PROGRESS_UPDATE_INTERVAL: 5000, // 5초
    SHAKE_DETECTION_COOLDOWN: 3000 // 3초
}

/**
 * 📄 페이지네이션
 */
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
    MAX_PAGE_SIZE: 100
}

/**
 * 🎯 난이도 레벨
 */
export const DIFFICULTY_LEVELS = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced'
}

/**
 * ✅ 성공 메시지
 */
export const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: '로그인되었습니다.',
    LOGOUT_SUCCESS: '로그아웃되었습니다.',
    ENROLLMENT_SUCCESS: '수강 신청이 완료되었습니다.',
    CERTIFICATE_ISSUED: '수료증이 발급되었습니다.',
    PROFILE_UPDATED: '프로필이 업데이트되었습니다.',
    PROGRESS_SAVED: '진도가 저장되었습니다.',
    QR_SCAN_SUCCESS: 'QR 코드가 스캔되었습니다.'
}

/**
 * ❌ 에러 메시지
 */
export const ERROR_MESSAGES = {
    LOGIN_FAILED: '로그인에 실패했습니다.',
    NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
    COURSE_NOT_FOUND: '강의를 찾을 수 없습니다.',
    ENROLLMENT_FAILED: '수강 신청에 실패했습니다.',
    VIDEO_LOAD_ERROR: '비디오를 불러올 수 없습니다.',
    PERMISSION_DENIED: '권한이 없습니다.',
    SESSION_EXPIRED: '세션이 만료되었습니다.',
    QR_SCAN_FAILED: 'QR 코드 스캔에 실패했습니다.',
    MAX_SELECTION_EXCEEDED: '최대 10개까지만 선택할 수 있습니다.'
}

/**
 * ⚠️ 경고 메시지
 */
export const WARNING_MESSAGES = {
    SHAKE_DETECTED: '흔들림이 감지되었습니다! 안전한 곳에서 시청하세요.',
    LOW_BATTERY: '배터리가 부족합니다.',
    SLOW_CONNECTION: '네트워크 연결이 느립니다.',
    UNSAVED_CHANGES: '저장하지 않은 변경사항이 있습니다.'
}

/**
 * 🔗 API 엔드포인트
 */
export const API_ENDPOINTS = {
    // 인증
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',

    // 강의
    COURSES: '/api/courses',
    COURSE_DETAIL: '/api/courses/:id',
    COURSE_ENROLL: '/api/courses/:id/enroll',
    COURSE_PROGRESS: '/api/courses/:id/progress',

    // 비디오
    VIDEO_URL: '/api/videos/:id/url',
    VIDEO_PROGRESS: '/api/videos/:id/progress',

    // 수료증
    CERTIFICATES: '/api/certificates',
    CERTIFICATE_VERIFY: '/api/certificates/verify/:code',

    // QR
    QR_SCAN: '/api/qr/scan',
    QR_GENERATE: '/api/qr/generate'
}

/**
 * 🎬 비디오 설정
 */
export const VIDEO_CONFIG = {
    SUPPORTED_FORMATS: ['mp4', 'webm', 'ogg'],
    MAX_RESOLUTION: '1080p',
    DEFAULT_QUALITY: '720p',
    BUFFER_LENGTH: 30, // 초
    RECONNECT_ATTEMPTS: 3,
    RECONNECT_DELAY: 1000 // 밀리초
}

/**
 * 🔔 알림 유형
 */
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
}

/**
 * 🎭 애니메이션 설정
 */
export const ANIMATION_CONFIG = {
    DURATION: {
        FAST: 200,
        NORMAL: 300,
        SLOW: 500
    },
    EASING: {
        LINEAR: 'linear',
        EASE_IN: 'ease-in',
        EASE_OUT: 'ease-out',
        EASE_IN_OUT: 'ease-in-out'
    }
}

// 기본 export
export default {
    FIREBASE_COLLECTIONS,
    FLASK_SUBCOLLECTIONS,
    APP_CONFIG,
    CATEGORY_STRUCTURE,
    SUPPORTED_LANGUAGES,
    STORAGE_KEYS,
    USER_ROLES,
    ENROLLMENT_STATUS,
    PLAYBACK_STATUS,
    BREAKPOINTS,
    THEME_COLORS,
    TIMERS,
    PAGINATION,
    DIFFICULTY_LEVELS,
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    WARNING_MESSAGES,
    API_ENDPOINTS,
    VIDEO_CONFIG,
    NOTIFICATION_TYPES,
    ANIMATION_CONFIG
}