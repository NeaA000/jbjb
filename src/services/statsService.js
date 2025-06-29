// web/src/services/statsService.js
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from './firebase'
import { FIREBASE_COLLECTIONS } from '@/utils/constants'
import ProgressService from './progressService'
import EnrollmentService from './enrollmentService'
import CourseService from './courseService'

class StatsService {
    // 캐시 설정
    static CACHE_KEY_PREFIX = 'stats_'
    static CACHE_DURATION = 10 * 60 * 1000 // 10분
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
     * 사용자 대시보드 통계 가져오기
     */
    static async getUserDashboardStats(userId) {
        try {
            if (!userId || userId === 'guest') {
                return this.getGuestStats()
            }

            // 캐시 확인
            const cacheKey = `${this.CACHE_KEY_PREFIX}dashboard_${userId}`
            const cached = this.getFromCache(cacheKey)
            if (cached) {
                return cached
            }

            // 병렬로 데이터 로드
            const [enrollmentStats, progressMap, certificates] = await Promise.all([
                EnrollmentService.calculateEnrollmentStats(userId),
                ProgressService.loadAllUserProgress(userId),
                this.getUserCertificates(userId)
            ])

            // 진행률 통계 계산
            const progressStats = ProgressService.calculateProgressStats(progressMap)

            // 종합 통계
            const stats = {
                // 강의 통계
                totalEnrolled: enrollmentStats.total,
                completed: progressStats.completedCourses,
                inProgress: progressStats.inProgressCourses,
                notStarted: progressStats.notStartedCourses,

                // 학습 시간 (시간 단위로 변환)
                totalHours: Math.round(enrollmentStats.totalStudyTime / 60),

                // 수료증
                certificates: certificates.length,

                // 진행률
                averageProgress: progressStats.averageProgress,

                // 추가 통계
                completionRate: enrollmentStats.total > 0
                    ? Math.round((progressStats.completedCourses / enrollmentStats.total) * 100)
                    : 0,

                // 최근 활동
                lastActivityDate: await this.getLastActivityDate(userId)
            }

            // 캐시 저장
            this.setCache(cacheKey, stats)

            return stats
        } catch (error) {
            console.error('대시보드 통계 로드 오류:', error)
            return this.getDefaultStats()
        }
    }

    /**
     * 게스트 통계
     */
    static getGuestStats() {
        const enrollments = EnrollmentService.getGuestEnrollments()
        const progressMap = ProgressService.loadAllGuestProgress()
        const progressStats = ProgressService.calculateProgressStats(progressMap)

        return {
            totalEnrolled: enrollments.length,
            completed: progressStats.completedCourses,
            inProgress: progressStats.inProgressCourses,
            notStarted: progressStats.notStartedCourses,
            totalHours: 0,
            certificates: 0,
            averageProgress: progressStats.averageProgress,
            completionRate: enrollments.length > 0
                ? Math.round((progressStats.completedCourses / enrollments.length) * 100)
                : 0,
            lastActivityDate: null
        }
    }

    /**
     * 기본 통계값
     */
    static getDefaultStats() {
        return {
            totalEnrolled: 0,
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            totalHours: 0,
            certificates: 0,
            averageProgress: 0,
            completionRate: 0,
            lastActivityDate: null
        }
    }

    /**
     * 사용자 수료증 목록 가져오기
     */
    static async getUserCertificates(userId) {
        try {
            const certificatesRef = collection(db, FIREBASE_COLLECTIONS.CERTIFICATES)
            const q = query(
                certificatesRef,
                where('userId', '==', userId),
                orderBy('issuedAt', 'desc')
            )

            const snapshot = await getDocs(q)
            const certificates = []

            snapshot.forEach(doc => {
                certificates.push({
                    id: doc.id,
                    ...doc.data()
                })
            })

            return certificates
        } catch (error) {
            console.error('수료증 목록 조회 오류:', error)
            return []
        }
    }

    /**
     * 마지막 활동 날짜 가져오기
     */
    static async getLastActivityDate(userId) {
        try {
            const enrollmentsRef = collection(db, FIREBASE_COLLECTIONS.ENROLLMENTS)
            const q = query(
                enrollmentsRef,
                where('userId', '==', userId),
                orderBy('lastAccessedAt', 'desc'),
                limit(1)
            )

            const snapshot = await getDocs(q)

            if (!snapshot.empty) {
                const data = snapshot.docs[0].data()
                return data.lastAccessedAt?.toDate() || null
            }

            return null
        } catch (error) {
            console.error('마지막 활동 날짜 조회 오류:', error)
            return null
        }
    }

    /**
     * 최근 학습 강의 목록 (통계 포함)
     */
    static async getRecentCoursesWithStats(userId, limitCount = 3) {
        try {
            if (!userId || userId === 'guest') {
                return this.getGuestRecentCourses()
            }

            // 캐시 확인
            const cacheKey = `${this.CACHE_KEY_PREFIX}recent_${userId}`
            const cached = this.getFromCache(cacheKey)
            if (cached) {
                return cached
            }

            // 최근 수강 정보 가져오기
            const recentEnrollments = await EnrollmentService.getRecentEnrollments(userId, limitCount)

            // 각 강의의 상세 정보와 진행률 병렬 로드
            const coursesWithStats = await Promise.all(
                recentEnrollments.map(async (enrollment) => {
                    const [course, progress] = await Promise.all([
                        CourseService.getCourseById(enrollment.courseId),
                        ProgressService.loadProgress(userId, enrollment.courseId)
                    ])

                    if (!course) return null

                    return {
                        id: course.id,
                        title: course.title,
                        category: this.formatCategoryPath(course.category),
                        thumbnail: course.thumbnailUrl,
                        duration: course.duration,
                        progress: progress.progress,
                        lastAccessedAt: enrollment.lastAccessedAt,
                        enrolledAt: enrollment.enrolledAt,
                        status: progress.completed ? 'completed' :
                            progress.progress > 0 ? 'in-progress' : 'not-started'
                    }
                })
            )

            // null 제거
            const validCourses = coursesWithStats.filter(course => course !== null)

            // 캐시 저장
            this.setCache(cacheKey, validCourses)

            return validCourses
        } catch (error) {
            console.error('최근 학습 강의 로드 오류:', error)
            return []
        }
    }

    /**
     * 게스트 최근 강의
     */
    static getGuestRecentCourses() {
        const enrollments = EnrollmentService.getGuestEnrollments()
        const progressMap = ProgressService.loadAllGuestProgress()

        return enrollments
            .sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt))
            .slice(0, 3)
            .map(enrollment => {
                const progress = progressMap.get(enrollment.courseId) || { progress: 0 }

                return {
                    id: enrollment.courseId,
                    title: enrollment.courseTitle || '제목 없음',
                    category: '미분류',
                    thumbnail: null,
                    duration: '30분',
                    progress: progress.progress,
                    lastAccessedAt: enrollment.lastAccessedAt,
                    enrolledAt: enrollment.enrolledAt,
                    status: progress.progress >= 100 ? 'completed' :
                        progress.progress > 0 ? 'in-progress' : 'not-started'
                }
            })
    }

    /**
     * 카테고리 경로 포맷
     */
    static formatCategoryPath(category) {
        if (!category) return '미분류'

        const parts = []
        if (category.main) parts.push(category.main)
        if (category.middle) parts.push(category.middle)
        if (category.leaf) parts.push(category.leaf)

        return parts.join(' > ') || '미분류'
    }

    /**
     * 학습 성과 통계
     */
    static async calculateAchievementStats(userId) {
        try {
            const stats = await this.getUserDashboardStats(userId)

            const achievements = {
                // 기본 성과
                firstCourse: stats.totalEnrolled > 0,
                tenCourses: stats.totalEnrolled >= 10,
                firstCompletion: stats.completed > 0,
                tenCompletions: stats.completed >= 10,

                // 연속 학습
                weekStreak: await this.calculateWeekStreak(userId),
                monthStreak: await this.calculateMonthStreak(userId),

                // 학습 시간
                tenHours: stats.totalHours >= 10,
                fiftyHours: stats.totalHours >= 50,
                hundredHours: stats.totalHours >= 100,

                // 완료율
                halfCompleted: stats.completionRate >= 50,
                allCompleted: stats.completionRate === 100,

                // 카테고리별 성과
                categoryMaster: await this.checkCategoryMaster(userId)
            }

            return achievements
        } catch (error) {
            console.error('성과 통계 계산 오류:', error)
            return {}
        }
    }

    /**
     * 주간 연속 학습 계산
     */
    static async calculateWeekStreak(userId) {
        // 실제 구현에서는 일별 학습 기록을 확인
        // 여기서는 간단한 예시
        return 0
    }

    /**
     * 월간 연속 학습 계산
     */
    static async calculateMonthStreak(userId) {
        // 실제 구현에서는 월별 학습 기록을 확인
        return 0
    }

    /**
     * 카테고리 마스터 확인
     */
    static async checkCategoryMaster(userId) {
        // 특정 카테고리의 모든 강의를 완료했는지 확인
        return false
    }

    /**
     * 학습 추세 분석
     */
    static async analyzeLearningTrends(userId, period = 30) {
        try {
            const endDate = new Date()
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - period)

            // 기간별 학습 데이터 수집
            const dailyData = new Map()

            // 진행률 변화 추적
            const progressHistory = await this.getProgressHistory(userId, startDate, endDate)

            // 일별 데이터 집계
            progressHistory.forEach(record => {
                const dateKey = record.date.toISOString().split('T')[0]

                if (!dailyData.has(dateKey)) {
                    dailyData.set(dateKey, {
                        date: dateKey,
                        studyTime: 0,
                        completedCourses: 0,
                        progressUpdates: 0
                    })
                }

                const dayData = dailyData.get(dateKey)
                dayData.studyTime += record.studyTime || 0
                dayData.completedCourses += record.completed ? 1 : 0
                dayData.progressUpdates += 1
            })

            // 추세 분석
            const trends = {
                dailyAverage: this.calculateDailyAverage(dailyData),
                weeklyPattern: this.analyzeWeeklyPattern(dailyData),
                peakLearningTime: this.findPeakLearningTime(dailyData),
                consistency: this.calculateConsistency(dailyData),
                improvement: this.calculateImprovement(dailyData)
            }

            return trends
        } catch (error) {
            console.error('학습 추세 분석 오류:', error)
            return null
        }
    }

    /**
     * 진행률 기록 가져오기 (가상 구현)
     */
    static async getProgressHistory(userId, startDate, endDate) {
        // 실제 구현에서는 progress_history 컬렉션에서 조회
        // 여기서는 빈 배열 반환
        return []
    }

    /**
     * 일일 평균 계산
     */
    static calculateDailyAverage(dailyData) {
        if (dailyData.size === 0) return 0

        let totalStudyTime = 0
        dailyData.forEach(data => {
            totalStudyTime += data.studyTime
        })

        return Math.round(totalStudyTime / dailyData.size)
    }

    /**
     * 주간 패턴 분석
     */
    static analyzeWeeklyPattern(dailyData) {
        const weekdayStats = new Array(7).fill(0)
        const weekdayCounts = new Array(7).fill(0)

        dailyData.forEach((data, dateStr) => {
            const date = new Date(dateStr)
            const dayOfWeek = date.getDay()
            weekdayStats[dayOfWeek] += data.studyTime
            weekdayCounts[dayOfWeek] += 1
        })

        return weekdayStats.map((total, index) => ({
            day: ['일', '월', '화', '수', '목', '금', '토'][index],
            average: weekdayCounts[index] > 0 ? Math.round(total / weekdayCounts[index]) : 0
        }))
    }

    /**
     * 피크 학습 시간 찾기
     */
    static findPeakLearningTime(dailyData) {
        let maxStudyTime = 0
        let peakDate = null

        dailyData.forEach((data, dateStr) => {
            if (data.studyTime > maxStudyTime) {
                maxStudyTime = data.studyTime
                peakDate = dateStr
            }
        })

        return { date: peakDate, studyTime: maxStudyTime }
    }

    /**
     * 학습 일관성 계산
     */
    static calculateConsistency(dailyData) {
        if (dailyData.size === 0) return 0

        let activeDays = 0
        dailyData.forEach(data => {
            if (data.studyTime > 0) activeDays++
        })

        return Math.round((activeDays / dailyData.size) * 100)
    }

    /**
     * 향상도 계산
     */
    static calculateImprovement(dailyData) {
        const sortedDates = Array.from(dailyData.keys()).sort()

        if (sortedDates.length < 7) return 0

        // 첫 주와 마지막 주 비교
        const firstWeek = sortedDates.slice(0, 7)
        const lastWeek = sortedDates.slice(-7)

        let firstWeekTotal = 0
        let lastWeekTotal = 0

        firstWeek.forEach(date => {
            firstWeekTotal += dailyData.get(date).studyTime
        })

        lastWeek.forEach(date => {
            lastWeekTotal += dailyData.get(date).studyTime
        })

        const improvement = lastWeekTotal - firstWeekTotal
        return Math.round((improvement / firstWeekTotal) * 100)
    }

    /**
     * 카테고리별 통계
     */
    static async getCategoryStats(userId) {
        try {
            const enrollments = await EnrollmentService.getUserEnrollments(userId)
            const progressMap = await ProgressService.loadAllUserProgress(userId)

            const categoryStats = new Map()

            // 각 수강에 대한 강의 정보 로드
            await Promise.all(enrollments.map(async (enrollment) => {
                const course = await CourseService.getCourseById(enrollment.courseId)
                if (!course || !course.category) return

                const category = course.category.main || '기타'
                const progress = progressMap.get(enrollment.courseId) || { progress: 0 }

                if (!categoryStats.has(category)) {
                    categoryStats.set(category, {
                        name: category,
                        totalCourses: 0,
                        completedCourses: 0,
                        inProgressCourses: 0,
                        totalProgress: 0
                    })
                }

                const stats = categoryStats.get(category)
                stats.totalCourses++
                stats.totalProgress += progress.progress

                if (progress.progress >= 100) {
                    stats.completedCourses++
                } else if (progress.progress > 0) {
                    stats.inProgressCourses++
                }
            }))

            // Map을 배열로 변환하고 평균 진행률 계산
            const result = []
            categoryStats.forEach(stats => {
                result.push({
                    ...stats,
                    averageProgress: stats.totalCourses > 0
                        ? Math.round(stats.totalProgress / stats.totalCourses)
                        : 0
                })
            })

            // 총 강의 수로 정렬
            result.sort((a, b) => b.totalCourses - a.totalCourses)

            return result
        } catch (error) {
            console.error('카테고리별 통계 로드 오류:', error)
            return []
        }
    }

    /**
     * 학습 목표 달성률
     */
    static async calculateGoalAchievement(userId, goals) {
        try {
            const stats = await this.getUserDashboardStats(userId)

            const achievements = {
                daily: this.checkDailyGoal(stats, goals.daily),
                weekly: this.checkWeeklyGoal(stats, goals.weekly),
                monthly: this.checkMonthlyGoal(stats, goals.monthly),
                overall: 0
            }

            // 전체 달성률 계산
            const totalGoals = Object.keys(achievements).length - 1
            const achievedGoals = Object.values(achievements).filter(v => v === 100).length
            achievements.overall = Math.round((achievedGoals / totalGoals) * 100)

            return achievements
        } catch (error) {
            console.error('목표 달성률 계산 오류:', error)
            return {
                daily: 0,
                weekly: 0,
                monthly: 0,
                overall: 0
            }
        }
    }

    /**
     * 일일 목표 확인
     */
    static checkDailyGoal(stats, dailyGoal) {
        // 실제 구현에서는 오늘의 학습 시간 확인
        return 0
    }

    /**
     * 주간 목표 확인
     */
    static checkWeeklyGoal(stats, weeklyGoal) {
        // 실제 구현에서는 이번 주 학습 시간 확인
        return 0
    }

    /**
     * 월간 목표 확인
     */
    static checkMonthlyGoal(stats, monthlyGoal) {
        // 실제 구현에서는 이번 달 학습 시간 확인
        return 0
    }

    /**
     * 추천 강의 통계 기반 생성
     */
    static async generateRecommendations(userId, limit = 5) {
        try {
            // 사용자 학습 패턴 분석
            const [categoryStats, progressMap, enrollments] = await Promise.all([
                this.getCategoryStats(userId),
                ProgressService.loadAllUserProgress(userId),
                EnrollmentService.getUserEnrollments(userId)
            ])

            // 수강하지 않은 강의 목록
            const enrolledCourseIds = new Set(enrollments.map(e => e.courseId))
            const allCourses = await CourseService.getCoursesFromFirestore()

            const recommendations = []

            // 1. 선호 카테고리의 새로운 강의
            const preferredCategories = categoryStats.slice(0, 3).map(c => c.name)

            allCourses.courses.forEach(course => {
                if (enrolledCourseIds.has(course.id)) return

                let score = 0

                // 카테고리 매칭 점수
                if (preferredCategories.includes(course.category?.main)) {
                    score += 50
                }

                // 난이도 매칭 점수
                if (course.difficulty === 'beginner' && stats.completed < 5) {
                    score += 30
                } else if (course.difficulty === 'intermediate' && stats.completed >= 5) {
                    score += 30
                }

                // 인기도 점수
                score += Math.min(course.enrolledCount / 100, 20)

                if (score > 0) {
                    recommendations.push({
                        ...course,
                        recommendationScore: score,
                        reason: this.getRecommendationReason(course, categoryStats, stats)
                    })
                }
            })

            // 점수 기준 정렬
            recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore)

            return recommendations.slice(0, limit)
        } catch (error) {
            console.error('추천 생성 오류:', error)
            return []
        }
    }

    /**
     * 추천 이유 생성
     */
    static getRecommendationReason(course, categoryStats, userStats) {
        const reasons = []

        // 카테고리 기반
        const categoryMatch = categoryStats.find(c => c.name === course.category?.main)
        if (categoryMatch && categoryMatch.totalCourses > 0) {
            reasons.push(`${course.category.main} 카테고리에 관심이 있으시네요`)
        }

        // 난이도 기반
        if (course.difficulty === 'beginner' && userStats.completed < 5) {
            reasons.push('초급자에게 적합한 강의입니다')
        }

        // 인기도 기반
        if (course.enrolledCount > 100) {
            reasons.push('많은 수강생이 선택한 인기 강의입니다')
        }

        return reasons.length > 0 ? reasons[0] : '추천 강의입니다'
    }

    /**
     * 캐시 초기화
     */
    static clearCache() {
        this.memoryCache.clear()
    }

    /**
     * 학습 보고서 생성
     */
    static async generateLearningReport(userId, period = 'monthly') {
        try {
            const [
                dashboardStats,
                categoryStats,
                trends,
                achievements,
                recentCourses
            ] = await Promise.all([
                this.getUserDashboardStats(userId),
                this.getCategoryStats(userId),
                this.analyzeLearningTrends(userId, period === 'monthly' ? 30 : 7),
                this.calculateAchievementStats(userId),
                this.getRecentCoursesWithStats(userId, 5)
            ])

            return {
                period,
                generatedAt: new Date(),
                summary: dashboardStats,
                categories: categoryStats,
                trends,
                achievements,
                recentActivity: recentCourses,
                recommendations: await this.generateRecommendations(userId, 3)
            }
        } catch (error) {
            console.error('학습 보고서 생성 오류:', error)
            throw error
        }
    }
}

export default StatsService