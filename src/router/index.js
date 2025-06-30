// web/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
// QR 접근 처리를 위해 추가 (주석 처리)
// import { useCourseStore } from '@/stores/course'

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
            path: '/course/enroll',
            name: 'course-enroll',
            component: () => import('@/views/course/CourseEnrollView.vue'),
            meta: {
                requiresAuth: false,  // 게스트도 접근 가능
                title: '강의 신청'
            }
        },
        {
            path: '/course/:id',
            name: 'course-detail',
            component: () => import('@/views/course/CourseDetailView.vue'),
            props: true
        },
        {
            path: '/category/:leafCategory',
            name: 'category-courses',
            component: () => import('@/views/course/CategoryCoursesView.vue'),
            props: true,
            meta: {
                title: '카테고리별 강의'
            }
        },
        {
            path: '/my-courses',
            name: 'my-courses',
            component: () => import('@/views/course/MyCoursesView.vue'),
            meta: {
                requiresAuth: true,
                title: '내 강의실'
            }
        },
        {
            path: '/learning/:id',
            name: 'learning',
            component: () => import('@/views/learning/LearningView.vue'),
            props: true,
            meta: {
                requiresAuth: false,  // 게스트도 학습 가능
                title: '강의 학습'
            }
        },
        {
            path: '/video-warning/:id',
            name: 'video-warning',
            component: () => import('@/views/learning/VideoWarningView.vue'),
            props: true,
            meta: {
                requiresAuth: false,
                title: '안전 경고'
            }
        },
        {
            path: '/certificates',
            name: 'certificates',
            component: () => import('@/views/certificate/CertificateListView.vue'),
            meta: {
                requiresAuth: true,
                title: '내 수료증'
            }
        },
        // 수료증 상세 페이지 - 활성화
        {
            path: '/certificates/:id',
            name: 'certificate-detail',
            component: () => import('@/views/certificate/CertificateDetailView.vue'),
            props: true,
            meta: {
                requiresAuth: true,
                title: '수료증 상세'
            }
        },
        {
            path: '/profile',
            name: 'profile',
            component: () => import('@/views/profile/ProfileView.vue'),
            meta: {
                requiresAuth: true,
                title: '프로필 관리'
            }
        },
        {
            path: '/profile/settings',
            name: 'profile-settings',
            component: () => import('@/views/profile/ProfileSettings.vue'),
            meta: {
                requiresAuth: true,
                title: '프로필 설정'
            }
        },
        {
            path: '/qr-scan',
            name: 'qr-scan',
            component: () => import('@/views/qr/QRScanView.vue'),
            meta: {
                title: 'QR 스캔'
            }
        },
        // QR 접근 페이지 - 아직 구현되지 않음
        // {
        //     path: '/qr/:courseId',
        //     name: 'qr-access',
        //     component: () => import('@/views/qr/QRAccessView.vue'),
        //     props: true,
        //     meta: {
        //         title: 'QR 강의 접근'
        //     }
        // },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: () => import('@/views/NotFoundView.vue'),
            meta: {
                title: '페이지를 찾을 수 없습니다'
            }
        }
    ]
})

// 네비게이션 가드
router.beforeEach(async (to, from) => {
    const authStore = useAuthStore()

    // 페이지 타이틀 설정
    if (to.meta.title) {
        document.title = `${to.meta.title} - QR Safety Education`
    }

    // 초기화 대기
    if (!authStore.isInitialized) {
        await authStore.initialize()
    }

    const isLoggedIn = authStore.isLoggedIn
    const isGuest = authStore.isGuest

    // 인증이 필요한 페이지
    if (to.meta.requiresAuth && !isLoggedIn) {
        // 게스트인 경우
        if (isGuest) {
            // 특정 페이지는 게스트 안내 메시지 표시
            const guestRestrictedPages = ['certificates', 'certificate-detail', 'my-courses', 'profile', 'profile-settings']
            if (guestRestrictedPages.includes(to.name)) {
                alert('이 기능은 회원만 이용할 수 있습니다.\n회원가입 후 이용해주세요.')
                return {
                    path: '/register',
                    query: { upgrade: 'true', redirect: to.fullPath }
                }
            }
        }

        // 일반 로그인 리다이렉트
        return {
            path: '/login',
            query: { redirect: to.fullPath }
        }
    }

    // 로그인한 사용자는 로그인/회원가입 페이지 접근 불가
    if (to.meta.requiresGuest && isLoggedIn && !isGuest) {
        return '/home'
    }

    // QR 접근 처리 - 추후 구현
    // if (to.name === 'qr-access') {
    //     const courseId = to.params.courseId
    //     if (courseId) {
    //         // 강의를 자동으로 선택 목록에 추가
    //         const courseStore = useCourseStore()
    //         await courseStore.addToSelected(courseId)

    //         // 강의 상세 페이지로 리다이렉트
    //         return {
    //             name: 'course-detail',
    //             params: { id: courseId },
    //             query: { qr: 'true' }
    //         }
    //     }
    // }
})

// 네비게이션 후 처리
router.afterEach((to, from) => {
    // 페이지 전환 시 스크롤 위치 초기화
    window.scrollTo(0, 0)

    // 모바일 메뉴가 열려있다면 닫기
    const mobileMenu = document.querySelector('.mobile-menu')
    if (mobileMenu && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open')
    }
})

// 라우터 에러 핸들링
router.onError((error) => {
    console.error('Router error:', error)

    // 청크 로딩 실패 시 페이지 새로고침
    if (error.message.includes('Failed to fetch dynamically imported module')) {
        window.location.reload()
    }
})

export default router