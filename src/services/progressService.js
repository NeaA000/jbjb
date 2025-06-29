// web/src/services/progressService.js
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase'
import { FIREBASE_COLLECTIONS } from '@/utils/constants'

class ProgressService {
    // 캐시 설정
    static CACHE_KEY_PREFIX = 'progress_'
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
     * 진행률 로드 (Firebase + 캐시)
     */
    static async loadProgress(userId, courseId) {
        try {
            // 게스트 사용자 처리
            if (!userId || userId === 'guest') {
                return this.loadGuestProgress(courseId)
            }

            // 캐시 확인
            const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}_${courseId}`
            const cached = this.getFromCache(cacheKey)
            if (cached !== null) {
                return cached
            }

            // Firebase에서 로드
            const progressId = `${userId}_${courseId}`
            const progressRef = doc(db, FIREBASE_COLLECTIONS.PROGRESS, progressId)
            const progressSnap = await getDoc(progressRef)

            let progressData = {
                progress: 0,
                lastWatchedTime: 0,
                completed: false,
                updatedAt: null
            }

            if (progressSnap.exists()) {
                const data = progressSnap.data()
                progressData = {
                    progress: data.progress || data.percentage || 0,
                    lastWatchedTime: data.lastWatchedTime || 0,
                    completed: data.completed || data.progress >= 100,
                    updatedAt: data.updatedAt
                }
            }

            // 캐시에 저장
            this.setCache(cacheKey, progressData)

            return progressData
        } catch (error) {
            console.error('진행률 로드 오류:', error)
            return {
                progress: 0,
                lastWatchedTime: 0,
                completed: false,
                updatedAt: null
            }
        }
    }

    /**
     * 진행률 저장
     */
    static async saveProgress(userId, courseId, progressData) {
        try {
            // 게스트 사용자 처리
            if (!userId || userId === 'guest') {
                return this.saveGuestProgress(courseId, progressData)
            }

            const progressId = `${userId}_${courseId}`
            const progressRef = doc(db, FIREBASE_COLLECTIONS.PROGRESS, progressId)

            const dataToSave = {
                userId,
                courseId,
                progress: Math.round(progressData.progress || 0),
                lastWatchedTime: progressData.currentTime || 0,
                updatedAt: serverTimestamp(),
                completed: progressData.progress >= 100,
                duration: progressData.duration || 0,
                language: progressData.language || 'ko'
            }

            await setDoc(progressRef, dataToSave, { merge: true })

            // 캐시 업데이트
            const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}_${courseId}`
            this.setCache(cacheKey, {
                ...dataToSave,
                updatedAt: new Date()
            })

            console.log(`💾 진행률 저장: ${dataToSave.progress}%, 시간: ${dataToSave.lastWatchedTime}초`)

            return dataToSave
        } catch (error) {
            console.error('진행률 저장 오류:', error)
            throw error
        }
    }

    /**
     * 게스트 진행률 로드 (localStorage)
     */
    static loadGuestProgress(courseId) {
        try {
            const progressKey = `${this.CACHE_KEY_PREFIX}guest_${courseId}`
            const timeKey = `lastTime_guest_${courseId}`

            const savedProgress = localStorage.getItem(progressKey)
            const savedTime = localStorage.getItem(timeKey)

            return {
                progress: savedProgress ? parseInt(savedProgress) : 0,
                lastWatchedTime: savedTime ? parseFloat(savedTime) : 0,
                completed: savedProgress ? parseInt(savedProgress) >= 100 : false,
                updatedAt: null
            }
        } catch (error) {
            console.error('게스트 진행률 로드 오류:', error)
            return {
                progress: 0,
                lastWatchedTime: 0,
                completed: false,
                updatedAt: null
            }
        }
    }

    /**
     * 게스트 진행률 저장 (localStorage)
     */
    static saveGuestProgress(courseId, progressData) {
        try {
            const progressKey = `${this.CACHE_KEY_PREFIX}guest_${courseId}`
            const timeKey = `lastTime_guest_${courseId}`

            localStorage.setItem(progressKey, Math.round(progressData.progress || 0).toString())
            localStorage.setItem(timeKey, (progressData.currentTime || 0).toString())

            return {
                progress: progressData.progress,
                lastWatchedTime: progressData.currentTime,
                completed: progressData.progress >= 100,
                updatedAt: new Date()
            }
        } catch (error) {
            console.error('게스트 진행률 저장 오류:', error)
            throw error
        }
    }

    /**
     * 사용자의 모든 진행률 정보 로드
     */
    static async loadAllUserProgress(userId) {
        try {
            if (!userId || userId === 'guest') {
                return this.loadAllGuestProgress()
            }

            const progressRef = collection(db, FIREBASE_COLLECTIONS.PROGRESS)
            const q = query(progressRef, where('userId', '==', userId))
            const snapshot = await getDocs(q)

            const progressMap = new Map()

            snapshot.forEach(doc => {
                const data = doc.data()
                progressMap.set(data.courseId, {
                    progress: data.progress || 0,
                    lastWatchedTime: data.lastWatchedTime || 0,
                    completed: data.completed || false,
                    updatedAt: data.updatedAt
                })
            })

            return progressMap
        } catch (error) {
            console.error('전체 진행률 로드 오류:', error)
            return new Map()
        }
    }

    /**
     * 게스트의 모든 진행률 정보 로드
     */
    static loadAllGuestProgress() {
        const progressMap = new Map()

        try {
            // localStorage의 모든 진행률 키 찾기
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(`${this.CACHE_KEY_PREFIX}guest_`)) {
                    const courseId = key.replace(`${this.CACHE_KEY_PREFIX}guest_`, '')
                    const progress = parseInt(localStorage.getItem(key) || '0')
                    const timeKey = `lastTime_guest_${courseId}`
                    const lastTime = parseFloat(localStorage.getItem(timeKey) || '0')

                    progressMap.set(courseId, {
                        progress,
                        lastWatchedTime: lastTime,
                        completed: progress >= 100,
                        updatedAt: null
                    })
                }
            })
        } catch (error) {
            console.error('게스트 전체 진행률 로드 오류:', error)
        }

        return progressMap
    }

    /**
     * 진행률 삭제
     */
    static async deleteProgress(userId, courseId) {
        try {
            if (!userId || userId === 'guest') {
                // 게스트 진행률 삭제
                const progressKey = `${this.CACHE_KEY_PREFIX}guest_${courseId}`
                const timeKey = `lastTime_guest_${courseId}`
                localStorage.removeItem(progressKey)
                localStorage.removeItem(timeKey)
            } else {
                // Firebase에서 삭제
                const progressId = `${userId}_${courseId}`
                const progressRef = doc(db, FIREBASE_COLLECTIONS.PROGRESS, progressId)
                await setDoc(progressRef, { deleted: true }, { merge: true })
            }

            // 캐시에서 삭제
            const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}_${courseId}`
            this.memoryCache.delete(cacheKey)

        } catch (error) {
            console.error('진행률 삭제 오류:', error)
            throw error
        }
    }

    /**
     * 배치 진행률 로드 (여러 강의의 진행률을 한번에)
     */
    static async loadBatchProgress(userId, courseIds) {
        try {
            const progressMap = new Map()

            if (!userId || userId === 'guest') {
                // 게스트 배치 로드
                courseIds.forEach(courseId => {
                    const progressData = this.loadGuestProgress(courseId)
                    progressMap.set(courseId, progressData)
                })
                return progressMap
            }

            // Firebase 배치 로드
            const promises = courseIds.map(courseId =>
                this.loadProgress(userId, courseId).then(data => ({
                    courseId,
                    data
                }))
            )

            const results = await Promise.all(promises)

            results.forEach(({ courseId, data }) => {
                progressMap.set(courseId, data)
            })

            return progressMap
        } catch (error) {
            console.error('배치 진행률 로드 오류:', error)
            return new Map()
        }
    }

    /**
     * 진행률 통계 계산
     */
    static calculateProgressStats(progressMap) {
        let totalCourses = 0
        let completedCourses = 0
        let inProgressCourses = 0
        let totalProgress = 0

        progressMap.forEach(progress => {
            totalCourses++
            totalProgress += progress.progress || 0

            if (progress.completed || progress.progress >= 100) {
                completedCourses++
            } else if (progress.progress > 0) {
                inProgressCourses++
            }
        })

        return {
            totalCourses,
            completedCourses,
            inProgressCourses,
            notStartedCourses: totalCourses - completedCourses - inProgressCourses,
            averageProgress: totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0
        }
    }

    /**
     * 캐시 초기화
     */
    static clearCache() {
        this.memoryCache.clear()

        // localStorage의 진행률 관련 항목 삭제
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.CACHE_KEY_PREFIX) || key.startsWith('lastTime_')) {
                localStorage.removeItem(key)
            }
        })
    }

    /**
     * 진행률 기반 추천 강의 계산
     */
    static getRecommendedCourses(progressMap, allCourses) {
        const recommendations = []

        // 1. 진행 중인 강의 우선
        const inProgressCourses = []
        progressMap.forEach((progress, courseId) => {
            if (progress.progress > 0 && progress.progress < 100) {
                const course = allCourses.find(c => c.id === courseId)
                if (course) {
                    inProgressCourses.push({
                        ...course,
                        progress: progress.progress,
                        priority: 1
                    })
                }
            }
        })

        // 진행률 높은 순으로 정렬
        inProgressCourses.sort((a, b) => b.progress - a.progress)
        recommendations.push(...inProgressCourses.slice(0, 3))

        // 2. 시작하지 않은 관련 강의
        const startedCategories = new Set()
        progressMap.forEach((progress, courseId) => {
            if (progress.progress > 0) {
                const course = allCourses.find(c => c.id === courseId)
                if (course?.category?.main) {
                    startedCategories.add(course.category.main)
                }
            }
        })

        const relatedNotStarted = allCourses.filter(course => {
            const hasProgress = progressMap.has(course.id)
            const progress = hasProgress ? progressMap.get(course.id).progress : 0
            return progress === 0 && startedCategories.has(course.category?.main)
        })

        recommendations.push(...relatedNotStarted.slice(0, 3).map(c => ({
            ...c,
            progress: 0,
            priority: 2
        })))

        return recommendations
    }
}

export default ProgressService