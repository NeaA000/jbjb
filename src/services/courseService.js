// web/src/services/courseService.js
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

class CourseService {
    // Flask API 엔드포인트 (개발/프로덕션 환경에 따라 변경)
    static API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

    /**
     * Flask에서 전체 강의 목록 가져오기
     */
    static async getCoursesFromFlask() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/courses`)
            if (!response.ok) {
                throw new Error('강의 목록을 가져올 수 없습니다.')
            }

            const data = await response.json()

            // 날짜 문자열을 Date 객체로 변환
            const courses = data.courses.map(course => ({
                ...course,
                createdAt: new Date(course.createdAt || Date.now()),
                updatedAt: new Date(course.updatedAt || Date.now())
            }))

            return { courses }
        } catch (error) {
            console.error('Flask API 오류:', error)
            // 개발 중 임시 데이터 반환
            return { courses: this.getMockCourses() }
        }
    }

    /**
     * Firebase에서 강의 상세 정보 가져오기
     */
    static async getCourseById(courseId) {
        try {
            const courseDoc = await getDoc(doc(db, 'courses', courseId))

            if (courseDoc.exists()) {
                return {
                    id: courseDoc.id,
                    ...courseDoc.data()
                }
            }

            // Firebase에 없으면 Flask에서 찾기
            const flaskData = await this.getCoursesFromFlask()
            return flaskData.courses.find(c => c.id === courseId) || null
        } catch (error) {
            console.error('강의 조회 오류:', error)
            return null
        }
    }

    /**
     * 사용자의 수강 정보 가져오기
     */
    static async getUserEnrollments(userId) {
        try {
            const enrollmentsQuery = query(
                collection(db, 'enrollments'),
                where('userId', '==', userId),
                orderBy('enrolledAt', 'desc')
            )

            const snapshot = await getDocs(enrollmentsQuery)
            const enrollments = []

            snapshot.forEach(doc => {
                enrollments.push({
                    id: doc.id,
                    ...doc.data(),
                    enrolledAt: doc.data().enrolledAt?.toDate() || new Date(),
                    completedAt: doc.data().completedAt?.toDate() || null
                })
            })

            return enrollments
        } catch (error) {
            console.error('수강 정보 조회 오류:', error)
            return []
        }
    }

    /**
     * 강의 신청
     */
    static async enrollCourse(courseId, userId, isQRAccess = false) {
        try {
            const enrollmentId = `${userId}_${courseId}`

            // 이미 신청했는지 확인
            const existingEnrollment = await getDoc(doc(db, 'enrollments', enrollmentId))
            if (existingEnrollment.exists()) {
                return {
                    success: false,
                    message: '이미 신청한 강의입니다.'
                }
            }

            // 새 수강 신청
            const enrollmentData = {
                courseId,
                userId,
                status: 'enrolled',
                progress: 0,
                enrolledAt: serverTimestamp(),
                isQRAccess,
                ...(isQRAccess && { qrAccessedAt: serverTimestamp() })
            }

            await setDoc(doc(db, 'enrollments', enrollmentId), enrollmentData)

            return {
                success: true,
                message: '강의 신청이 완료되었습니다.',
                enrollmentId
            }
        } catch (error) {
            console.error('강의 신청 오류:', error)
            return {
                success: false,
                message: '강의 신청에 실패했습니다.'
            }
        }
    }

    /**
     * 진도 업데이트
     */
    static async updateProgress(courseId, userId, progress, currentTime = 0, duration = 0) {
        try {
            const enrollmentId = `${userId}_${courseId}`

            const updateData = {
                progress: Math.min(100, Math.max(0, progress)),
                lastViewedAt: serverTimestamp(),
                currentVideoTime: currentTime
            }

            // 100% 완료 시
            if (progress >= 100) {
                updateData.status = 'completed'
                updateData.completedAt = serverTimestamp()
                updateData.progress = 100
            }

            await updateDoc(doc(db, 'enrollments', enrollmentId), updateData)

            return {
                success: true,
                progress: updateData.progress,
                isCompleted: updateData.progress === 100
            }
        } catch (error) {
            console.error('진도 업데이트 오류:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * 비디오 URL 가져오기
     */
    static async getVideoUrl(videoId, language = 'ko') {
        try {
            // Firebase Storage URL 또는 외부 비디오 URL 반환
            // 실제 구현은 Firebase Storage 설정에 따라 다름
            const videoUrl = `https://storage.googleapis.com/your-bucket/${videoId}/${language}.mp4`

            return {
                videoUrl,
                metadata: {
                    language,
                    duration: '30:00'
                }
            }
        } catch (error) {
            console.error('비디오 URL 조회 오류:', error)
            return { videoUrl: null, metadata: null }
        }
    }

    /**
     * 사용 가능한 언어 목록
     */
    static async getAvailableLanguages(videoId) {
        try {
            // 실제로는 Firebase에서 조회
            return {
                languages: ['ko', 'en', 'zh', 'vi'],
                details: {
                    ko: { language: '한국어', isDefault: true },
                    en: { language: 'English', isDefault: false },
                    zh: { language: '中文', isDefault: false },
                    vi: { language: 'Tiếng Việt', isDefault: false }
                }
            }
        } catch (error) {
            console.error('언어 목록 조회 오류:', error)
            return { languages: ['ko'], details: {} }
        }
    }

    /**
     * 개발용 임시 데이터
     */
    static getMockCourses() {
        return [
            {
                id: 'course-1',
                title: '굴착기 안전 운전 교육',
                description: '굴착기의 안전한 조작법과 사고 예방을 위한 필수 교육입니다.',
                category: {
                    main: '기계',
                    middle: '건설기계',
                    leaf: '굴착기'
                },
                instructor: '김안전',
                duration: '30분',
                difficulty: 'beginner',
                thumbnail: 'https://via.placeholder.com/400x225',
                videoUrl: 'sample-video-1',
                rating: 4.5,
                reviewCount: 128,
                enrolledCount: 456,
                tags: ['안전', '건설', '중장비'],
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15')
            },
            {
                id: 'course-2',
                title: '크레인 작업 안전 수칙',
                description: '크레인 운영 시 반드시 알아야 할 안전 규정과 절차를 학습합니다.',
                category: {
                    main: '기계',
                    middle: '건설기계',
                    leaf: '크레인'
                },
                instructor: '박안전',
                duration: '45분',
                difficulty: 'intermediate',
                thumbnail: 'https://via.placeholder.com/400x225',
                videoUrl: 'sample-video-2',
                rating: 4.8,
                reviewCount: 89,
                enrolledCount: 234,
                tags: ['안전', '크레인', '높이작업'],
                createdAt: new Date('2024-02-01'),
                updatedAt: new Date('2024-02-01')
            },
            {
                id: 'course-3',
                title: '전동드릴 안전 사용법',
                description: '전동드릴의 올바른 사용법과 안전 수칙을 배웁니다.',
                category: {
                    main: '공구',
                    middle: '전동공구',
                    leaf: '전동드릴'
                },
                instructor: '이안전',
                duration: '20분',
                difficulty: 'beginner',
                thumbnail: 'https://via.placeholder.com/400x225',
                videoUrl: 'sample-video-3',
                rating: 4.6,
                reviewCount: 156,
                enrolledCount: 789,
                tags: ['안전', '전동공구', '드릴'],
                createdAt: new Date('2024-02-15'),
                updatedAt: new Date('2024-02-15')
            }
        ]
    }
}

export default CourseService