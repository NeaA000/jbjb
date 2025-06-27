// src/stores/certificate.js
import { defineStore } from 'pinia'
import CertificateService from '@/services/certificateService'

export const useCertificateStore = defineStore('certificate', {
    state: () => ({
        certificates: [],
        currentCertificate: null,
        isLoading: false,
        error: null
    }),

    getters: {
        /**
         * 사용자의 모든 수료증
         */
        userCertificates: (state) => state.certificates,

        /**
         * 특정 강의의 수료증 존재 여부
         */
        hasCertificate: (state) => (courseId) => {
            return state.certificates.some(cert => cert.courseId === courseId)
        },

        /**
         * 특정 강의의 수료증 가져오기
         */
        getCertificateByCourse: (state) => (courseId) => {
            return state.certificates.find(cert => cert.courseId === courseId)
        },

        /**
         * 수료증 개수
         */
        certificateCount: (state) => state.certificates.length
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
                    // 수료증 목록에 추가
                    this.certificates.push(result.data)

                    return {
                        success: true,
                        certificate: result.data
                    }
                } else {
                    throw new Error(result.error || '수료증 생성 실패')
                }
            } catch (error) {
                console.error('수료증 생성 오류:', error)
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
         * 사용자의 모든 수료증 로드
         */
        async loadUserCertificates(userId) {
            this.isLoading = true
            this.error = null

            try {
                const result = await CertificateService.getUserCertificates(userId)

                if (result.success) {
                    this.certificates = result.data
                } else {
                    throw new Error(result.error || '수료증 목록 로드 실패')
                }
            } catch (error) {
                console.error('수료증 목록 로드 오류:', error)
                this.error = error.message
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
                    return {
                        success: true,
                        certificate: result.data
                    }
                } else {
                    throw new Error(result.error || '수료증을 찾을 수 없습니다')
                }
            } catch (error) {
                console.error('수료증 로드 오류:', error)
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
         * 강의의 수료증 확인
         */
        async checkCourseCertificate(userId, courseId) {
            try {
                const result = await CertificateService.getCourseCertificate(userId, courseId)

                if (result.success) {
                    // 이미 목록에 없다면 추가
                    const exists = this.certificates.find(cert => cert.id === result.data.id)
                    if (!exists) {
                        this.certificates.push(result.data)
                    }

                    return {
                        success: true,
                        hasCertificate: true,
                        certificate: result.data
                    }
                } else {
                    return {
                        success: true,
                        hasCertificate: false
                    }
                }
            } catch (error) {
                console.error('수료증 확인 오류:', error)
                return {
                    success: false,
                    error: error.message
                }
            }
        },

        /**
         * 수료증 검증
         */
        async verifyCertificate(certificateId) {
            try {
                const result = await CertificateService.verifyCertificate(certificateId)
                return result
            } catch (error) {
                console.error('수료증 검증 오류:', error)
                return {
                    success: false,
                    valid: false,
                    error: error.message
                }
            }
        },

        /**
         * 현재 수료증 초기화
         */
        clearCurrentCertificate() {
            this.currentCertificate = null
        },

        /**
         * 스토어 초기화
         */
        resetStore() {
            this.certificates = []
            this.currentCertificate = null
            this.isLoading = false
            this.error = null
        }
    }
})