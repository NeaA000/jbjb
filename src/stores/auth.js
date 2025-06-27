// stores/auth.js
import { defineStore } from 'pinia'
import { authService, firestoreService, storageService, getErrorMessage } from '@/services/firebase'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        isLoading: false,
        error: null,
        isInitialized: false
    }),

    getters: {
        // 로그인 여부
        isLoggedIn: (state) => !!state.user,

        // 게스트 여부
        isGuest: (state) => state.user?.isGuest || false,

        // 일반 사용자 여부
        isAuthenticated: (state) => state.user && !state.user.isGuest,

        // 사용자 ID
        userId: (state) => state.user?.uid || null,

        // 사용자 이름
        displayName: (state) => state.user?.displayName || '사용자',

        // 프로필 사진
        photoURL: (state) => state.user?.photoURL || null,

        // 이메일
        email: (state) => state.user?.email || null,

        // 로그인 제공자
        provider: (state) => state.user?.provider || null,

        // 프로필 완성 여부
        profileCompleted: (state) => state.user?.profileCompleted !== false
    },

    actions: {
        // 초기화 - Firebase Auth 상태 리스너 설정
        async initialize() {
            if (this.isInitialized) return

            this.isLoading = true

            return new Promise((resolve) => {
                authService.onAuthStateChange((user) => {
                    this.user = user
                    this.isInitialized = true
                    this.isLoading = false
                    resolve(user)
                })
            })
        },

        // 이메일 로그인
        async loginWithEmail(email, password) {
            this.isLoading = true
            this.error = null

            try {
                const user = await authService.loginWithEmail(email, password)
                this.user = user

                return { success: true }
            } catch (error) {
                this.error = getErrorMessage(error)
                return { success: false, error: this.error }
            } finally {
                this.isLoading = false
            }
        },

        // Google 로그인
        async loginWithGoogle() {
            this.isLoading = true
            this.error = null

            try {
                const user = await authService.loginWithGoogle()

                // 중복 팝업 요청으로 null이 반환된 경우
                if (!user) {
                    return { success: false, error: '이미 로그인 창이 열려있습니다.' }
                }

                this.user = user

                // 프로필 완성 여부 확인
                if (!user.profileCompleted) {
                    // 신규 사용자 - 추가 정보 필요
                    return { success: true, user: user }
                }

                // 기존 사용자
                return { success: true, user: user }
            } catch (error) {
                this.error = getErrorMessage(error)
                return { success: false, error: this.error }
            } finally {
                this.isLoading = false
            }
        },

        // 게스트 로그인
        async loginAsGuest() {
            this.isLoading = true
            this.error = null

            try {
                const user = await authService.loginAsGuest()
                this.user = user

                return { success: true }
            } catch (error) {
                this.error = getErrorMessage(error)
                return { success: false, error: this.error }
            } finally {
                this.isLoading = false
            }
        },

        // 회원가입
        async register(email, password, displayName, birthDate) {
            this.isLoading = true
            this.error = null

            try {
                const user = await authService.register(email, password, displayName, birthDate)
                this.user = user

                return { success: true }
            } catch (error) {
                this.error = getErrorMessage(error)
                return { success: false, error: this.error }
            } finally {
                this.isLoading = false
            }
        },

        // Google 사용자 추가 정보 입력
        async completeGoogleProfile(uid, additionalData) {
            this.isLoading = true
            this.error = null

            try {
                await firestoreService.updateGoogleUserProfile(uid, additionalData)

                // 로컬 상태 업데이트
                this.user = {
                    ...this.user,
                    ...additionalData,
                    profileCompleted: true
                }

                return { success: true }
            } catch (error) {
                this.error = getErrorMessage(error)
                return { success: false, error: this.error }
            } finally {
                this.isLoading = false
            }
        },

        // 게스트를 일반 계정으로 전환
        async convertGuestToUser(email, password, displayName) {
            if (!this.isGuest) {
                return { success: false, error: '게스트 사용자가 아닙니다.' }
            }

            this.isLoading = true
            this.error = null

            try {
                const user = await authService.convertGuestToUser(email, password, displayName)
                this.user = user

                return { success: true }
            } catch (error) {
                this.error = getErrorMessage(error)
                return { success: false, error: this.error }
            } finally {
                this.isLoading = false
            }
        },

        // 로그아웃
        async logout() {
            this.isLoading = true

            try {
                await authService.logout()
                this.user = null

                // 로그인 상태 유지 설정 제거
                localStorage.removeItem('rememberMe')

                return { success: true }
            } catch (error) {
                console.error('로그아웃 오류:', error)
                return { success: false, error: getErrorMessage(error) }
            } finally {
                this.isLoading = false
            }
        },

        // 프로필 업데이트
        async updateProfile(data) {
            if (!this.user || this.isGuest) {
                return { success: false, error: '로그인이 필요합니다.' }
            }

            this.isLoading = true
            this.error = null

            try {
                await firestoreService.updateUserProfile(this.user.uid, data)

                // 로컬 상태 업데이트
                this.user = {
                    ...this.user,
                    ...data
                }

                return { success: true }
            } catch (error) {
                this.error = getErrorMessage(error)
                return { success: false, error: this.error }
            } finally {
                this.isLoading = false
            }
        },

        // 프로필 사진 업로드
        async uploadProfilePhoto(file) {
            if (!this.user || this.isGuest) {
                return { success: false, error: '로그인이 필요합니다.' }
            }

            this.isLoading = true

            try {
                const photoURL = await storageService.uploadProfilePhoto(this.user.uid, file)

                // 로컬 상태 업데이트
                this.user.photoURL = photoURL

                return { success: true, photoURL }
            } catch (error) {
                this.error = getErrorMessage(error)
                return { success: false, error: this.error }
            } finally {
                this.isLoading = false
            }
        },

        // 프로필 사진 삭제
        async deleteProfilePhoto() {
            if (!this.user || this.isGuest) {
                return { success: false, error: '로그인이 필요합니다.' }
            }

            this.isLoading = true

            try {
                await storageService.deleteProfilePhoto(this.user.uid)

                // 로컬 상태 업데이트
                this.user.photoURL = null

                return { success: true }
            } catch (error) {
                this.error = getErrorMessage(error)
                return { success: false, error: this.error }
            } finally {
                this.isLoading = false
            }
        },

        // 비밀번호 재설정 이메일 전송
        async sendPasswordResetEmail(email) {
            this.isLoading = true
            this.error = null

            try {
                await authService.resetPassword(email)
                return { success: true }
            } catch (error) {
                this.error = getErrorMessage(error)
                return { success: false, error: this.error }
            } finally {
                this.isLoading = false
            }
        },

        // 사용자 정보 새로고침
        async refreshUser() {
            if (!this.user || this.isGuest) return

            try {
                const userProfile = await firestoreService.getUserProfile(this.user.uid)
                if (userProfile) {
                    this.user = {
                        ...this.user,
                        ...userProfile
                    }
                }
                return { success: true }
            } catch (error) {
                console.error('사용자 정보 새로고침 오류:', error)
                return { success: false, error: getErrorMessage(error) }
            }
        },

        // 에러 초기화
        clearError() {
            this.error = null
        },

        // 사용자 상태 초기화 (테스트용)
        resetUser() {
            this.user = null
            this.isInitialized = false
            this.error = null
        }
    },

    // Persist 설정 - 새로고침 시에도 상태 유지
    persist: {
        key: 'auth',
        storage: localStorage,
        paths: ['user'],
        afterRestore: (context) => {
            // 복원 후 Firebase Auth 상태와 동기화
            context.store.initialize()
        }
    }
})