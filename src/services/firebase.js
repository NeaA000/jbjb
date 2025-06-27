// services/firebase.js
import { initializeApp } from 'firebase/app'
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signInAnonymously,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    updateEmail,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from 'firebase/auth'
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    enableNetwork,
    disableNetwork
} from 'firebase/firestore'
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage'

// Firebase 설정
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Firebase 초기화
const app = initializeApp(firebaseConfig)

// 서비스 exports
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Google Provider 설정
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
    prompt: 'select_account'
})

// 인증 지속성 설정
setPersistence(auth, browserLocalPersistence)

// 인증 서비스
export const authService = {
    // 이메일 로그인
    async loginWithEmail(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // Firestore에서 추가 사용자 정보 가져오기
            const userDoc = await getDoc(doc(db, 'users', user.uid))

            if (!userDoc.exists()) {
                // 사용자 문서가 없는 경우 생성
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || email.split('@')[0],
                    photoURL: user.photoURL,
                    isGuest: false,
                    provider: 'email',
                    profileCompleted: false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }
                await setDoc(doc(db, 'users', user.uid), userData)
                return userData
            }

            return {
                uid: user.uid,
                email: user.email,
                ...userDoc.data()
            }
        } catch (error) {
            console.error('이메일 로그인 오류:', error)
            throw error
        }
    },

    // 회원가입
    async register(email, password, displayName, birthDate) {
        try {
            // Firebase Auth에 사용자 생성
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // 프로필 업데이트
            await updateProfile(user, {
                displayName: displayName
            })

            // Firestore에 사용자 문서 생성
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                birthDate: birthDate,
                photoURL: null,
                provider: 'email',
                isGuest: false,
                profileCompleted: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                // 추가 필드들
                completedCourses: [],
                enrolledCourses: [],
                certificates: [],
                preferences: {
                    language: 'ko',
                    notifications: true
                }
            }

            await setDoc(doc(db, 'users', user.uid), userData)

            return userData
        } catch (error) {
            console.error('회원가입 오류:', error)
            throw error
        }
    },

    // Google 로그인
    async loginWithGoogle() {
        try {
            // 기존 팝업 요청 취소
            if (auth.currentUser) {
                await signOut(auth)
            }

            const result = await signInWithPopup(auth, googleProvider)
            const user = result.user

            // Firestore에서 사용자 확인
            const userDoc = await getDoc(doc(db, 'users', user.uid))

            if (!userDoc.exists()) {
                // 신규 사용자인 경우 문서 생성 (기본 정보만)
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    provider: 'google',
                    isGuest: false,
                    profileCompleted: false, // 추가 정보 입력 필요
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    completedCourses: [],
                    enrolledCourses: [],
                    certificates: [],
                    preferences: {
                        language: 'ko',
                        notifications: true
                    }
                }

                await setDoc(doc(db, 'users', user.uid), userData)
                return userData
            } else {
                // 기존 사용자
                return userDoc.data()
            }
        } catch (error) {
            // 팝업 관련 에러 처리
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('로그인 창이 닫혔습니다.')
            } else if (error.code === 'auth/cancelled-popup-request') {
                // 중복 팝업 요청은 무시
                return null
            }

            console.error('Google 로그인 오류:', error)
            throw error
        }
    },

    // 게스트 로그인 (익명 인증)
    async loginAsGuest() {
        try {
            const userCredential = await signInAnonymously(auth)
            const user = userCredential.user

            // 게스트 사용자 데이터
            const guestData = {
                uid: user.uid,
                email: null,
                displayName: '게스트',
                photoURL: null,
                provider: 'anonymous',
                isGuest: true,
                createdAt: new Date().toISOString()
            }

            // Firestore에 게스트 문서 생성 (권한이 있는 경우만)
            try {
                await setDoc(doc(db, 'guests', user.uid), guestData)
            } catch (firestoreError) {
                // Firestore 권한 에러는 무시하고 계속 진행
                console.warn('게스트 문서 생성 실패 (권한 문제일 수 있음):', firestoreError)
            }

            return guestData
        } catch (error) {
            console.error('게스트 로그인 오류:', error)
            throw error
        }
    },

    // 로그아웃
    async logout() {
        try {
            await signOut(auth)
        } catch (error) {
            console.error('로그아웃 오류:', error)
            throw error
        }
    },

    // 비밀번호 재설정
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email)
        } catch (error) {
            console.error('비밀번호 재설정 오류:', error)
            throw error
        }
    },

    // 인증 상태 변경 리스너
    onAuthStateChange(callback) {
        return onAuthStateChanged(auth, async (user) => {
            if (user) {
                // 로그인 상태
                if (user.isAnonymous) {
                    // 게스트 사용자
                    callback({
                        uid: user.uid,
                        email: null,
                        displayName: '게스트',
                        photoURL: null,
                        provider: 'anonymous',
                        isGuest: true
                    })
                } else {
                    // 일반 사용자 - Firestore에서 추가 정보 가져오기
                    try {
                        const userDoc = await getDoc(doc(db, 'users', user.uid))
                        if (userDoc.exists()) {
                            callback({
                                uid: user.uid,
                                email: user.email,
                                ...userDoc.data()
                            })
                        } else {
                            // Firestore에 문서가 없는 경우 기본 정보만
                            callback({
                                uid: user.uid,
                                email: user.email,
                                displayName: user.displayName || '사용자',
                                photoURL: user.photoURL,
                                provider: user.providerData[0]?.providerId || 'unknown',
                                isGuest: false
                            })
                        }
                    } catch (error) {
                        console.error('사용자 정보 가져오기 오류:', error)
                        // Firestore 권한 에러 시 기본 정보로 대체
                        callback({
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName || '사용자',
                            photoURL: user.photoURL,
                            provider: user.providerData[0]?.providerId || 'unknown',
                            isGuest: false
                        })
                    }
                }
            } else {
                // 로그아웃 상태
                callback(null)
            }
        })
    },

    // 현재 사용자 가져오기
    getCurrentUser() {
        return auth.currentUser
    },

    // 게스트를 일반 계정으로 전환
    async convertGuestToUser(email, password, displayName) {
        try {
            const user = auth.currentUser
            if (!user || !user.isAnonymous) {
                throw new Error('게스트 사용자가 아닙니다.')
            }

            // 이메일/비밀번호 자격증명 생성
            const credential = EmailAuthProvider.credential(email, password)

            // 계정 연결
            await user.linkWithCredential(credential)

            // 프로필 업데이트
            await updateProfile(user, {
                displayName: displayName
            })

            // Firestore 사용자 문서 생성
            const userData = {
                uid: user.uid,
                email: email,
                displayName: displayName,
                photoURL: null,
                provider: 'email',
                isGuest: false,
                profileCompleted: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                completedCourses: [],
                enrolledCourses: [],
                certificates: [],
                preferences: {
                    language: 'ko',
                    notifications: true
                }
            }

            await setDoc(doc(db, 'users', user.uid), userData)

            // 게스트 문서 삭제 (있다면)
            try {
                await deleteDoc(doc(db, 'guests', user.uid))
            } catch (e) {
                // 삭제 실패 무시
            }

            return userData
        } catch (error) {
            console.error('게스트 전환 오류:', error)
            throw error
        }
    }
}

// Firestore 서비스
export const firestoreService = {
    // 사용자 프로필 업데이트
    async updateUserProfile(uid, data) {
        try {
            await updateDoc(doc(db, 'users', uid), {
                ...data,
                updatedAt: serverTimestamp()
            })
        } catch (error) {
            console.error('프로필 업데이트 오류:', error)
            throw error
        }
    },

    // 사용자 프로필 가져오기
    async getUserProfile(uid) {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid))
            return userDoc.exists() ? userDoc.data() : null
        } catch (error) {
            console.error('프로필 가져오기 오류:', error)
            throw error
        }
    },

    // Google 사용자 추가 정보 업데이트
    async updateGoogleUserProfile(uid, additionalData) {
        try {
            await updateDoc(doc(db, 'users', uid), {
                ...additionalData,
                profileCompleted: true,
                updatedAt: serverTimestamp()
            })
        } catch (error) {
            console.error('Google 프로필 업데이트 오류:', error)
            throw error
        }
    }
}

// Storage 서비스
export const storageService = {
    // 프로필 사진 업로드
    async uploadProfilePhoto(uid, file) {
        try {
            // 파일 크기 검증 (5MB 제한)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('파일 크기는 5MB를 초과할 수 없습니다.')
            }

            // 파일 타입 검증
            if (!file.type.startsWith('image/')) {
                throw new Error('이미지 파일만 업로드 가능합니다.')
            }

            // 파일 확장자 추출
            const extension = file.name.split('.').pop()
            const fileName = `profiles/${uid}/avatar_${Date.now()}.${extension}`

            // Storage 참조 생성
            const storageRef = ref(storage, fileName)

            // 파일 업로드
            const snapshot = await uploadBytes(storageRef, file)

            // 다운로드 URL 가져오기
            const downloadURL = await getDownloadURL(snapshot.ref)

            // Firestore 업데이트
            await firestoreService.updateUserProfile(uid, {
                photoURL: downloadURL
            })

            return downloadURL
        } catch (error) {
            console.error('프로필 사진 업로드 오류:', error)
            throw error
        }
    },

    // 프로필 사진 삭제
    async deleteProfilePhoto(uid) {
        try {
            // 현재 사용자 정보 가져오기
            const userProfile = await firestoreService.getUserProfile(uid)
            if (!userProfile?.photoURL) return

            // Storage에서 삭제
            const photoRef = ref(storage, userProfile.photoURL)
            await deleteObject(photoRef).catch(() => {
                // 파일이 없는 경우 에러 무시
            })

            // Firestore 업데이트
            await firestoreService.updateUserProfile(uid, {
                photoURL: null
            })
        } catch (error) {
            console.error('프로필 사진 삭제 오류:', error)
            throw error
        }
    }
}

// 에러 메시지 한글화
export const getErrorMessage = (error) => {
    const errorMessages = {
        // 인증 관련
        'auth/user-not-found': '등록되지 않은 이메일입니다.',
        'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
        'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
        'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
        'auth/invalid-email': '올바른 이메일 형식이 아닙니다.',
        'auth/operation-not-allowed': '이 인증 방법은 허용되지 않습니다.',
        'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
        'auth/cancelled-popup-request': '이미 로그인 창이 열려있습니다.',
        'auth/account-exists-with-different-credential': '이미 다른 방법으로 가입된 계정입니다.',
        'auth/invalid-credential': '인증 정보가 올바르지 않습니다.',
        'auth/unauthorized-domain': '승인되지 않은 도메인입니다.',

        // 네트워크 관련
        'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
        'auth/too-many-requests': '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',

        // Firestore 관련
        'permission-denied': '접근 권한이 없습니다.',
        'Missing or insufficient permissions': '접근 권한이 없습니다.',

        // 기타
        'auth/user-disabled': '비활성화된 계정입니다.',
        'auth/requires-recent-login': '보안을 위해 다시 로그인해주세요.'
    }

    const message = error.code || error.message || '오류가 발생했습니다.'
    return errorMessages[message] || errorMessages[error.code] || message
}

// 네트워크 상태 체크
export const checkNetworkStatus = async () => {
    try {
        await enableNetwork(db)
        return true
    } catch (error) {
        console.error('네트워크 상태 확인 오류:', error)
        return false
    }
}

export default {
    auth,
    db,
    storage,
    authService,
    firestoreService,
    storageService,
    getErrorMessage,
    checkNetworkStatus
}