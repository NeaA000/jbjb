// web/src/services/enrollmentService.js
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    deleteDoc
} from 'firebase/firestore'
import { db } from './firebase'
import { FIREBASE_COLLECTIONS } from '@/utils/constants'

class EnrollmentService {
    // 캐시 설정
    static CACHE_KEY_PREFIX = 'enrollments_'
    static CACHE_DURATION = 5 * 60 * 1000 // 5분
    static memoryCache = new Map()

    /**
     * 메모리 캐시 관리
     */
    static getFromCache(key) {
        const cached = this.memoryCache.get(key)
        if (!cached) return null

        if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
            this.memoryCache.delete(key)
            return null
        }

        return cached.data
    }

    static setCache(key, data) {
        this.memoryCache.set(key, {
            data,
            timestamp: Date.now()
        })
    }

    /**
     * 사용자의 모든 수강 정보 가져오기
     */
    static async getUserEnrollments(userId, includeCompleted = true) {
        try {
            if (!userId || userId === 'guest') {
                return this.getGuestEnrollments()
            }

            // 캐시 확인
            const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}_${includeCompleted}`
            const cached = this.getFromCache(cacheKey)
            if (cached) {
                return cached
            }

            // Firebase에서 조회
            const enrollmentsRef = collection(db, FIREBASE_COLLECTIONS.ENROLLMENTS)
            let q = query(
                enrollmentsRef,
                where('userId', '==', userId),
                orderBy('enrolledAt', 'desc')
            )

            // 완료된 수강 제외 옵션
            if (!includeCompleted) {
                q = query(
                    enrollmentsRef,
                    where('userId', '==', userId),
                    where('status', '!=', 'completed'),
                    orderBy('enrolledAt', 'desc')
                )
            }

            const snapshot = await getDocs(q)
            const enrollments = []

            snapshot.forEach(doc => {
                enrollments.push({
                    id: doc.id,
                    ...doc.data(),
                    enrolledAt: doc.data().enrolledAt?.toDate() || new Date()
                })
            })

            // 캐시에 저장
            this.setCache(cacheKey, enrollments)

            return enrollments
        } catch (error) {
            console.error('수강 정보 조회 오류:', error)
            return []
        }
    }

    /**
     * 게스트 수강 정보 가져오기 (localStorage)
     */
    static getGuestEnrollments() {
        try {
            const enrollmentsKey = `${this.CACHE_KEY_PREFIX}guest`
            const saved = localStorage.getItem(enrollmentsKey)

            if (saved) {
                return JSON.parse(saved)
            }

            return []
        } catch (error) {
            console.error('게스트 수강 정보 로드 오류:', error)
            return []
        }
    }

    /**
     * 수강 신청
     */
    static async enrollCourse(userId, courseId, additionalData = {}) {
        try {
            if (!userId || userId === 'guest') {
                return this.enrollGuestCourse(courseId, additionalData)
            }

            // 중복 수강 확인
            const existingEnrollment = await this.getEnrollment(userId, courseId)
            if (existingEnrollment) {
                console.log('이미 수강 중인 강의입니다.')
                return existingEnrollment
            }

            // 수강 데이터 생성
            const enrollmentData = {
                userId,
                courseId,
                enrolledAt: serverTimestamp(),
                lastAccessedAt: serverTimestamp(),
                progress: 0,
                status: 'enrolled',
                preferredLanguage: additionalData.language || 'ko',
                ...additionalData
            }

            // Custom ID로 문서 생성 (userId_courseId)
            const enrollmentId = `${userId}_${courseId}`
            const enrollmentRef = doc(db, FIREBASE_COLLECTIONS.ENROLLMENTS, enrollmentId)
            await setDoc(enrollmentRef, enrollmentData)

            // 캐시 무효화
            this.invalidateUserCache(userId)

            return {
                id: enrollmentId,
                ...enrollmentData,
                enrolledAt: new Date()
            }
        } catch (error) {
            console.error('수강 신청 오류:', error)
            throw error
        }
    }

    /**
     * 게스트 수강 신청
     */
    static enrollGuestCourse(courseId, additionalData = {}) {
        try {
            const enrollments = this.getGuestEnrollments()

            // 중복 확인
            const existing = enrollments.find(e => e.courseId === courseId)
            if (existing) {
                return existing
            }

            const newEnrollment = {
                id: `guest_${courseId}`,
                userId: 'guest',
                courseId,
                enrolledAt: new Date().toISOString(),
                lastAccessedAt: new Date().toISOString(),
                progress: 0,
                status: 'enrolled',
                preferredLanguage: additionalData.language || 'ko',
                ...additionalData
            }

            enrollments.push(newEnrollment)
            localStorage.setItem(`${this.CACHE_KEY_PREFIX}guest`, JSON.stringify(enrollments))

            return newEnrollment
        } catch (error) {
            console.error('게스트 수강 신청 오류:', error)
            throw error
        }
    }

    /**
     * 단일 수강 정보 가져오기
     */
    static async getEnrollment(userId, courseId) {
        try {
            if (!userId || userId === 'guest') {
                const enrollments = this.getGuestEnrollments()
                return enrollments.find(e => e.courseId === courseId)
            }

            const enrollmentId = `${userId}_${courseId}`
            const enrollmentRef = doc(db, FIREBASE_COLLECTIONS.ENROLLMENTS, enrollmentId)
            const enrollmentSnap = await getDoc(enrollmentRef)

            if (enrollmentSnap.exists()) {
                return {
                    id: enrollmentSnap.id,
                    ...enrollmentSnap.data()
                }
            }

            return null
        } catch (error) {
            console.error('수강 정보 조회 오류:', error)
            return null
        }
    }

    /**
     * 수강 정보 업데이트
     */
    static async updateEnrollment(userId, courseId, updateData) {
        try {
            if (!userId || userId === 'guest') {
                return this.updateGuestEnrollment(courseId, updateData)
            }

            const enrollmentId = `${userId}_${courseId}`
            const enrollmentRef = doc(db, FIREBASE_COLLECTIONS.ENROLLMENTS, enrollmentId)

            const dataToUpdate = {
                ...updateData,
                lastAccessedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }

            await updateDoc(enrollmentRef, dataToUpdate)

            // 캐시 무효화
            this.invalidateUserCache(userId)

            return {
                id: enrollmentId,
                ...dataToUpdate
            }
        } catch (error) {
            console.error('수강 정보 업데이트 오류:', error)
            throw error
        }
    }

    /**
     * 게스트 수강 정보 업데이트
     */
    static updateGuestEnrollment(courseId, updateData) {
        try {
            const enrollments = this.getGuestEnrollments()
            const index = enrollments.findIndex(e => e.courseId === courseId)

            if (index !== -1) {
                enrollments[index] = {
                    ...enrollments[index],
                    ...updateData,
                    lastAccessedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }

                localStorage.setItem(`${this.CACHE_KEY_PREFIX}guest`, JSON.stringify(enrollments))
                return enrollments[index]
            }

            return null
        } catch (error) {
            console.error('게스트 수강 정보 업데이트 오류:', error)
            throw error
        }
    }

    /**
     * 수료 처리
     */
    static async completeCourse(userId, courseId, certificateData = {}) {
        try {
            // 수강 정보 업데이트
            await this.updateEnrollment(userId, courseId, {
                status: 'completed',
                completedAt: serverTimestamp(),
                progress: 100,
                certificateIssued: !!certificateData.certificateId
            })

            // 수료증 발급 (옵션)
            if (certificateData.courseTitle) {
                const certificateRef = collection(db, FIREBASE_COLLECTIONS.CERTIFICATES)
                await addDoc(certificateRef, {
                    userId,
                    courseId,
                    courseTitle: certificateData.courseTitle,
                    userName: certificateData.userName || 'Unknown',
                    issuedAt: serverTimestamp(),
                    certificateNumber: this.generateCertificateNumber()
                })
            }

            return true
        } catch (error) {
            console.error('수료 처리 오류:', error)
            throw error
        }
    }

    /**
     * 수료증 번호 생성
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
     * 최근 접속한 수강 목록
     */
    static async getRecentEnrollments(userId, limitCount = 3) {
        try {
            if (!userId || userId === 'guest') {
                const enrollments = this.getGuestEnrollments()
                return enrollments
                    .sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt))
                    .slice(0, limitCount)
            }

            const enrollmentsRef = collection(db, FIREBASE_COLLECTIONS.ENROLLMENTS)
            const q = query(
                enrollmentsRef,
                where('userId', '==', userId),
                orderBy('lastAccessedAt', 'desc'),
                limit(limitCount)
            )

            const snapshot = await getDocs(q)
            const enrollments = []

            snapshot.forEach(doc => {
                enrollments.push({
                    id: doc.id,
                    ...doc.data()
                })
            })

            return enrollments
        } catch (error) {
            console.error('최근 수강 목록 조회 오류:', error)
            return []
        }
    }

    /**
     * 수강 통계 계산
     */
    static async calculateEnrollmentStats(userId) {
        try {
            const enrollments = await this.getUserEnrollments(userId)

            const stats = {
                total: enrollments.length,
                completed: 0,
                inProgress: 0,
                notStarted: 0,
                totalStudyTime: 0
            }

            enrollments.forEach(enrollment => {
                if (enrollment.status === 'completed' || enrollment.progress >= 100) {
                    stats.completed++
                } else if (enrollment.progress > 0) {
                    stats.inProgress++
                } else {
                    stats.notStarted++
                }

                // 학습 시간 누적 (분 단위)
                stats.totalStudyTime += enrollment.studyTime || 0
            })

            return stats
        } catch (error) {
            console.error('수강 통계 계산 오류:', error)
            return {
                total: 0,
                completed: 0,
                inProgress: 0,
                notStarted: 0,
                totalStudyTime: 0
            }
        }
    }

    /**
     * 수강 취소
     */
    static async cancelEnrollment(userId, courseId) {
        try {
            if (!userId || userId === 'guest') {
                const enrollments = this.getGuestEnrollments()
                const filtered = enrollments.filter(e => e.courseId !== courseId)
                localStorage.setItem(`${this.CACHE_KEY_PREFIX}guest`, JSON.stringify(filtered))
                return true
            }

            const enrollmentId = `${userId}_${courseId}`
            const enrollmentRef = doc(db, FIREBASE_COLLECTIONS.ENROLLMENTS, enrollmentId)
            await deleteDoc(enrollmentRef)

            // 캐시 무효화
            this.invalidateUserCache(userId)

            return true
        } catch (error) {
            console.error('수강 취소 오류:', error)
            throw error
        }
    }

    /**
     * 학습 시간 업데이트
     */
    static async updateStudyTime(userId, courseId, additionalMinutes) {
        try {
            const enrollment = await this.getEnrollment(userId, courseId)
            if (!enrollment) return

            const currentStudyTime = enrollment.studyTime || 0
            const newStudyTime = currentStudyTime + additionalMinutes

            await this.updateEnrollment(userId, courseId, {
                studyTime: newStudyTime
            })

            return newStudyTime
        } catch (error) {
            console.error('학습 시간 업데이트 오류:', error)
            throw error
        }
    }

    /**
     * 캐시 무효화
     */
    static invalidateUserCache(userId) {
        // 해당 사용자의 모든 캐시 삭제
        for (const [key] of this.memoryCache) {
            if (key.startsWith(`${this.CACHE_KEY_PREFIX}${userId}`)) {
                this.memoryCache.delete(key)
            }
        }
    }

    /**
     * 전체 캐시 초기화
     */
    static clearCache() {
        this.memoryCache.clear()

        // localStorage의 수강 관련 항목 삭제
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.CACHE_KEY_PREFIX)) {
                localStorage.removeItem(key)
            }
        })
    }

    /**
     * 배치 수강 신청
     */
    static async enrollMultipleCourses(userId, courseIds) {
        const results = {
            success: [],
            failed: []
        }

        for (const courseId of courseIds) {
            try {
                const enrollment = await this.enrollCourse(userId, courseId)
                results.success.push({ courseId, enrollment })
            } catch (error) {
                results.failed.push({ courseId, error: error.message })
            }
        }

        return results
    }
}

export default EnrollmentService