// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/element-custom.scss' // 커스텀 Element Plus 스타일
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import koKR from 'element-plus/dist/locale/ko.mjs' // 한국어 로케일

// 글로벌 스타일
import './assets/main.css'

// Pinia 생성 및 persist 플러그인 추가
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// Vue 앱 생성
const app = createApp(App)

// Pinia 사용
app.use(pinia)

// 라우터 사용
app.use(router)

// Element Plus 사용 (한국어 설정)
app.use(ElementPlus, {
    locale: koKR,
    size: 'default',
    zIndex: 3000
})

// Element Plus 아이콘 등록
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

// 전역 속성 설정
app.config.globalProperties.$isDev = import.meta.env.DEV
app.config.globalProperties.$isProd = import.meta.env.PROD

// 전역 에러 핸들러
app.config.errorHandler = (err, instance, info) => {
    console.error('Global error:', err)
    console.error('Component:', instance)
    console.error('Error info:', info)

    // 프로덕션 환경에서는 에러 추적 서비스로 전송
    if (import.meta.env.PROD) {
        // 예: Sentry, LogRocket 등으로 에러 전송
    }
}

// 성능 모니터링 (개발 환경)
if (import.meta.env.DEV) {
    app.config.performance = true
}

// 앱 마운트
app.mount('#app')

// 서비스 워커 등록 (PWA 지원용)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration)
            })
            .catch(error => {
                console.log('SW registration failed:', error)
            })
    })
}

// 뷰포트 높이 수정 (모바일 브라우저 대응)
const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
}

setViewportHeight()
window.addEventListener('resize', setViewportHeight)
window.addEventListener('orientationchange', setViewportHeight)