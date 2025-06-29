// src/services/certificateService.js
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { FIREBASE_COLLECTIONS } from '@/utils/constants'

class CertificateService {
    /**
     * 수료증 번호 생성 (고유 ID)
     */
    static generateCertificateNumber() {
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')

        return `CERT-${year}${month}${day}-${random}`
    }

    /**
     * QR 코드용 검증 URL 생성
     */
    static generateQRCode(certificateId) {
        const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
        return `${baseUrl}/certificates/verify/${certificateId}`
    }

    /**
     * 수료증 생성
     * @param {Object} certificateData - 수료증 데이터
     * @returns {Promise<Object>} 생성된 수료증 정보
     */
    static async createCertificate(certificateData) {
        try {
            const {
                userId,
                courseId,
                courseName,
                userName,
                birthDate,
                completedDate = new Date()
            } = certificateData

            // 중복 체크
            const existingCert = await this.getCourseCertificate(userId, courseId)
            if (existingCert.success && existingCert.data) {
                return {
                    success: false,
                    error: '이미 발급된 수료증이 있습니다.',
                    data: existingCert.data
                }
            }

            // 수료증 ID 생성
            const certificateId = `${userId}_${courseId}_${Date.now()}`
            const certificateNumber = this.generateCertificateNumber()

            // 수료증 데이터 구성
            const certificate = {
                // 기본 정보
                certificateId,
                certificateNumber,

                // 사용자 정보
                userId,
                userName,
                birthDate, // 사용자 프로필에서 가져온 생년월일

                // 강의 정보
                courseId,
                courseName,

                // 수료 정보
                completedDate: Timestamp.fromDate(completedDate),
                issuedDate: serverTimestamp(),

                // 검증 정보
                qrCode: this.generateQRCode(certificateId),
                isValid: true,

                // 메타데이터
                metadata: {
                    // 강의 메타데이터 (uploads 컬렉션에서 가져온 정보)
                    courseCategory: certificateData.courseCategory || '',
                    courseDuration: certificateData.courseDuration || '',
                    courseLanguage: certificateData.courseLanguage || 'ko',

                    // 수료 조건
                    requiredProgress: 100,
                    actualProgress: certificateData.progress || 100,

                    // 추가 정보
                    deviceInfo: navigator.userAgent,
                    issuedFrom: 'web',
                    version: '1.0'
                }
            }

            // Firestore에 저장
            await setDoc(
                doc(db, FIREBASE_COLLECTIONS.CERTIFICATES, certificateId),
                certificate
            )

            // 사용자의 certificates 배열에도 추가
            const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId)
            const userDoc = await getDoc(userRef)

            if (userDoc.exists()) {
                const userData = userDoc.data()
                const certificates = userData.certificates || []

                if (!certificates.includes(certificateId)) {
                    certificates.push(certificateId)
                    await setDoc(userRef, {
                        certificates,
                        lastCertificateDate: serverTimestamp()
                    }, { merge: true })
                }
            }

            return {
                success: true,
                data: {
                    ...certificate,
                    id: certificateId
                }
            }
        } catch (error) {
            console.error('수료증 생성 오류:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * 특정 수료증 조회
     */
    static async getCertificateById(certificateId) {
        try {
            const certDoc = await getDoc(
                doc(db, FIREBASE_COLLECTIONS.CERTIFICATES, certificateId)
            )

            if (!certDoc.exists()) {
                return {
                    success: false,
                    error: '수료증을 찾을 수 없습니다.'
                }
            }

            return {
                success: true,
                data: {
                    id: certDoc.id,
                    ...certDoc.data()
                }
            }
        } catch (error) {
            console.error('수료증 조회 오류:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * 사용자의 모든 수료증 조회
     */
    static async getUserCertificates(userId) {
        try {
            const q = query(
                collection(db, FIREBASE_COLLECTIONS.CERTIFICATES),
                where('userId', '==', userId),
                orderBy('issuedDate', 'desc')
            )

            const snapshot = await getDocs(q)
            const certificates = []

            snapshot.forEach((doc) => {
                certificates.push({
                    id: doc.id,
                    ...doc.data()
                })
            })

            return {
                success: true,
                data: certificates
            }
        } catch (error) {
            console.error('사용자 수료증 목록 조회 오류:', error)
            return {
                success: false,
                error: error.message,
                data: []
            }
        }
    }

    /**
     * 특정 강의의 수료증 조회
     */
    static async getCourseCertificate(userId, courseId) {
        try {
            const q = query(
                collection(db, FIREBASE_COLLECTIONS.CERTIFICATES),
                where('userId', '==', userId),
                where('courseId', '==', courseId)
            )

            const snapshot = await getDocs(q)

            if (snapshot.empty) {
                return {
                    success: true,
                    data: null
                }
            }

            const doc = snapshot.docs[0]
            return {
                success: true,
                data: {
                    id: doc.id,
                    ...doc.data()
                }
            }
        } catch (error) {
            console.error('강의 수료증 조회 오류:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * 수료증 검증 (QR 코드 스캔 시)
     */
    static async verifyCertificate(certificateId) {
        try {
            const result = await this.getCertificateById(certificateId)

            if (!result.success) {
                return {
                    success: false,
                    valid: false,
                    error: '수료증을 찾을 수 없습니다.'
                }
            }

            const certificate = result.data

            // 유효성 검사
            if (!certificate.isValid) {
                return {
                    success: true,
                    valid: false,
                    error: '유효하지 않은 수료증입니다.',
                    certificate
                }
            }

            // 검증 로그 저장 (선택사항)
            await this.logVerification(certificateId)

            return {
                success: true,
                valid: true,
                certificate
            }
        } catch (error) {
            console.error('수료증 검증 오류:', error)
            return {
                success: false,
                valid: false,
                error: error.message
            }
        }
    }

    /**
     * 수료증 검증 로그 저장
     */
    static async logVerification(certificateId) {
        try {
            const logData = {
                certificateId,
                verifiedAt: serverTimestamp(),
                verifiedFrom: 'web',
                userAgent: navigator.userAgent,
                timestamp: Date.now()
            }

            // 검증 로그 저장 (서브컬렉션 사용)
            const logRef = collection(
                db,
                FIREBASE_COLLECTIONS.CERTIFICATES,
                certificateId,
                'verifications'
            )

            await setDoc(doc(logRef), logData)
        } catch (error) {
            console.error('검증 로그 저장 오류:', error)
            // 로그 저장 실패는 무시
        }
    }

    /**
     * 수료증 통계 조회
     */
    static async getCertificateStats(userId) {
        try {
            const result = await this.getUserCertificates(userId)

            if (!result.success) {
                return {
                    total: 0,
                    byCategory: {},
                    recentCertificates: []
                }
            }

            const certificates = result.data
            const stats = {
                total: certificates.length,
                byCategory: {},
                recentCertificates: certificates.slice(0, 5)
            }

            // 카테고리별 통계
            certificates.forEach(cert => {
                const category = cert.metadata?.courseCategory || '기타'
                stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
            })

            return stats
        } catch (error) {
            console.error('수료증 통계 조회 오류:', error)
            return {
                total: 0,
                byCategory: {},
                recentCertificates: []
            }
        }
    }

    /**
     * 수료증 PDF 생성을 위한 데이터 준비
     */
    static prepareCertificateData(certificate) {
        return {
            // 수료증 번호
            certificateNumber: certificate.certificateNumber,

            // 수료자 정보
            userName: certificate.userName,
            birthDate: certificate.birthDate,

            // 강의 정보
            courseName: certificate.courseName,
            courseCategory: certificate.metadata?.courseCategory || '',

            // 날짜 정보
            completedDate: certificate.completedDate,
            issuedDate: certificate.issuedDate || new Date(),

            // QR 코드
            qrCode: certificate.qrCode,

            // 발급 기관 정보
            issuerName: '주식회사 데이터브릿지',
            issuerTitle: '대표이사',

            // 기타
            verificationUrl: certificate.qrCode
        }
    }
}

export default CertificateService