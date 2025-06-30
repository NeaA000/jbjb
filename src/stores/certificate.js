// src/stores/certificate.js
import { defineStore } from 'pinia'
import CertificateService from '@/services/certificateService'
import { ElMessage } from 'element-plus'

export const useCertificateStore = defineStore('certificate', {
    state: () => ({
        certificates: [],
        userCertificates: [],
        currentCertificate: null,
        isLoading: false,
        error: null
    }),

    getters: {
        /**
         * 발급된 수료증 개수
         */
        certificateCount: (state) => state.userCertificates.length,

        /**
         * 카테고리별 수료증 개수
         */
        certificatesByCategory: (state) => {
            const categories = {}
            state.userCertificates.forEach(cert => {
                const category = cert.metadata?.courseCategory || '기타'
                categories[category] = (categories[category] || 0) + 1
            })
            return categories
        },

        /**
         * 최근 수료증 (5개)
         */
        recentCertificates: (state) => {
            return [...state.userCertificates]
                .sort((a, b) => {
                    const dateA = new Date(a.issuedDate?.toDate?.() || a.issuedDate)
                    const dateB = new Date(b.issuedDate?.toDate?.() || b.issuedDate)
                    return dateB - dateA
                })
                .slice(0, 5)
        }
    },

    actions: {
        /**
         * 수료증 생성
         */
        async createCertificate(certificateData) {
            this.isLoading = true
            this.error = null

            try {
                const result = await CertificateService.createCertificate(certificateData)

                if (result.success) {
                    // 수료증 생성 후 전체 목록을 다시 로드하여 동기화
                    const userId = certificateData.userId
                    await this.loadUserCertificates(userId)

                    return {
                        success: true,
                        certificate: result.data
                    }
                } else {
                    throw new Error(result.error || '수료증 생성 실패')
                }
            } catch (error) {
                console.error('수료증 생성 실패:', error)
                this.error = error.message

                return {
                    success: false,
                    error: error.message
                }
            } finally {
                this.isLoading = false
            }
        },

        /**
         * 사용자의 수료증 목록 로드
         */
        async loadUserCertificates(userId) {
            this.isLoading = true
            this.error = null

            // 캐시 무시하고 항상 Firebase에서 새로 로드
            this.userCertificates = []

            try {
                const result = await CertificateService.getUserCertificates(userId)

                if (result.success) {
                    this.userCertificates = result.data
                    console.log(`✅ ${result.data.length}개의 수료증을 로드했습니다.`)

                    return {
                        success: true,
                        data: result.data
                    }
                } else {
                    throw new Error(result.error || '수료증 목록 로드 실패')
                }
            } catch (error) {
                console.error('수료증 목록 로드 실패:', error)
                this.error = error.message
                this.userCertificates = []

                return {
                    success: false,
                    error: error.message
                }
            } finally {
                this.isLoading = false
            }
        },

        /**
         * 특정 수료증 로드
         */
        async loadCertificate(certificateId) {
            this.isLoading = true
            this.error = null

            try {
                const result = await CertificateService.getCertificateById(certificateId)

                if (result.success) {
                    this.currentCertificate = result.data

                    // 현재 수료증이 목록에 없으면 목록도 새로고침
                    const existsInList = this.userCertificates.some(cert => cert.id === certificateId)
                    if (!existsInList && result.data.userId) {
                        await this.loadUserCertificates(result.data.userId)
                    }

                    return {
                        success: true,
                        certificate: result.data
                    }
                } else {
                    throw new Error(result.error || '수료증 로드 실패')
                }
            } catch (error) {
                console.error('수료증 로드 실패:', error)
                this.error = error.message
                this.currentCertificate = null

                return {
                    success: false,
                    error: error.message
                }
            } finally {
                this.isLoading = false
            }
        },

        /**
         * 특정 강의의 수료증 가져오기
         */
        getCertificateByCourse(courseId) {
            return this.userCertificates.find(cert => cert.courseId === courseId)
        },

        /**
         * 강의 수료증 확인
         */
        async checkCourseCertificate(userId, courseId) {
            try {
                const result = await CertificateService.getCourseCertificate(userId, courseId)

                return {
                    success: true,
                    hasCertificate: result.success && result.data !== null,
                    certificate: result.data
                }
            } catch (error) {
                console.error('수료증 확인 오류:', error)
                return {
                    success: false,
                    hasCertificate: false,
                    certificate: null
                }
            }
        },

        /**
         * 수료증 검증
         */
        async verifyCertificate(certificateId) {
            try {
                const result = await CertificateService.verifyCertificate(certificateId)

                if (result.success && result.valid) {
                    ElMessage.success('유효한 수료증입니다')
                } else {
                    ElMessage.error(result.error || '유효하지 않은 수료증입니다')
                }

                return result
            } catch (error) {
                console.error('수료증 검증 실패:', error)
                ElMessage.error('수료증 검증 중 오류가 발생했습니다')

                return {
                    success: false,
                    valid: false,
                    error: error.message
                }
            }
        },

        /**
         * 수료증 통계 로드
         */
        async loadCertificateStats(userId) {
            try {
                const stats = await CertificateService.getCertificateStats(userId)
                return stats
            } catch (error) {
                console.error('수료증 통계 로드 실패:', error)
                return {
                    total: 0,
                    byCategory: {},
                    recentCertificates: []
                }
            }
        },

        /**
         * 스토어 초기화
         */
        reset() {
            this.certificates = []
            this.userCertificates = []
            this.currentCertificate = null
            this.isLoading = false
            this.error = null
        }
    },

    persist: {
        enabled: true,
        strategies: [
            {
                key: 'certificate-store',
                storage: localStorage,  // sessionStorage를 localStorage로 변경
                paths: ['userCertificates']
            }
        ]
    }
})