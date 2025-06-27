// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/auth/LoginView.vue'),
            meta: { requiresGuest: true }
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('@/views/auth/RegisterView.vue'),
            meta: { requiresGuest: true }
        },
        {
            path: '/home',
            name: 'home',
            component: () => import('@/views/home/HomeView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/courses',
            name: 'courses',
            component: () => import('@/views/course/CourseListView.vue')
        },
        {
            path: '/courses/:id',
            name: 'course-detail',
            component: () => import('@/views/course/CourseDetailView.vue'),
            props: true
        },
        {
            path: '/learning/:id',
            name: 'learning',
            component: () => import('@/views/learning/LearningView.vue'),
            props: true,
            meta: { requiresAuth: true }
        },
        {
            path: '/certificates',
            name: 'certificates',
            component: () => import('@/views/certificate/CertificateListView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/profile',
            name: 'profile',
            component: () => import('@/views/profile/ProfileView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/qr-scan',
            name: 'qr-scan',
            component: () => import('@/views/qr/QRScanView.vue')
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: () => import('@/views/NotFoundView.vue')
        }
    ]
})

// 네비게이션 가드
router.beforeEach(async (to, from) => {
    const authStore = useAuthStore()

    // 초기화 대기
    if (!authStore.isInitialized) {
        await authStore.initialize()
    }

    const isLoggedIn = authStore.isLoggedIn
    const isGuest = authStore.isGuest

    // 인증이 필요한 페이지
    if (to.meta.requiresAuth && !isLoggedIn) {
        return {
            path: '/login',
            query: { redirect: to.fullPath }
        }
    }

    // 게스트는 접근 불가한 페이지
    if (to.meta.requiresAuth && isGuest) {
        // 게스트에게 알림
        alert('이 기능은 로그인이 필요합니다.')
        return {
            path: '/courses'
        }
    }

    // 로그인한 사용자는 로그인/회원가입 페이지 접근 불가
    if (to.meta.requiresGuest && isLoggedIn) {
        return '/home'
    }
})

export default router