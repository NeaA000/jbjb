// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'

// Element Plus (선택사항)
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

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

// Element Plus 사용 (선택사항)
app.use(ElementPlus)

// Element Plus 아이콘 등록 (선택사항)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

// 전역 에러 핸들러 (선택사항)
app.config.errorHandler = (err, instance, info) => {
    console.error('Global error:', err)
    console.error('Component:', instance)
    console.error('Error info:', info)
}

// 앱 마운트
app.mount('#app')