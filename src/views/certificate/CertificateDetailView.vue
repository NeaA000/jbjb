// CourseDetailView.vue의 수료증 관련 부분만 추가/수정

// <script setup> 섹션에 추가할 import와 로직
import { useCertificateStore } from '@/stores/certificate'

const certificateStore = useCertificateStore()

// 상태에 추가
const isGeneratingCertificate = ref(false)
const hasCertificate = ref(false)

// 수료증 확인 함수 추가
const checkCertificate = async () => {
  if (!authStore.isAuthenticated || authStore.isGuest || !course.value) return

  try {
    const result = await certificateStore.checkCourseCertificate(
        authStore.user.uid,
        course.value.id
    )
    hasCertificate.value = result.hasCertificate
  } catch (error) {
    console.error('수료증 확인 오류:', error)
  }
}

// 수료증 생성 함수 추가
const generateCertificate = async () => {
  if (!authStore.isAuthenticated || authStore.isGuest) {
    ElMessage.warning('로그인 후 수료증을 받을 수 있습니다')
    return
  }

  try {
    isGeneratingCertificate.value = true

    // 수료증 데이터 준비
    const certificateData = {
      userId: authStore.user.uid,
      courseId: course.value.id,
      courseName: course.value.title,
      userName: authStore.user.displayName || authStore.user.email.split('@')[0],
      birthDate: authStore.user.birthDate || '1990.01.01', // 프로필에서 가져오거나 기본값
      completedDate: new Date()
    }

    const result = await certificateStore.createCertificate(certificateData)

    if (result.success) {
      ElMessage.success('수료증이 발급되었습니다!')
      hasCertificate.value = true

      // 수료증 페이지로 이동
      setTimeout(() => {
        router.push(`/certificates/${result.certificate.certificateId}`)
      }, 1500)
    } else {
      throw new Error(result.error || '수료증 생성 실패')
    }
  } catch (error) {
    console.error('수료증 생성 오류:', error)
    ElMessage.error('수료증 생성 중 오류가 발생했습니다')
  } finally {
    isGeneratingCertificate.value = false
  }
}

// 수료증 보기 함수 추가
const viewCertificate = async () => {
  const cert = certificateStore.getCertificateByCourse(course.value.id)
  if (cert) {
    router.push(`/certificates/${cert.id}`)
  } else {
    // 다시 확인
    await checkCertificate()
    if (hasCertificate.value) {
      const cert = certificateStore.getCertificateByCourse(course.value.id)
      if (cert) {
        router.push(`/certificates/${cert.id}`)
      }
    }
  }
}

// onMounted에 추가
onMounted(async () => {
  await loadCourse()
  if (course.value) {
    await checkCertificate()
  }
})

// <template> 섹션에서 수정할 부분
// 기존의 수료 완료 섹션을 다음과 같이 수정:

<div v-if="enrollmentStatus === 'completed'"
  class="p-4 bg-green-50 border border-green-200 rounded-lg">
    <div class="flex items-center space-x-2 text-green-800">
    <Award class="w-5 h-5" />
    <span class="font-medium">수료 완료</span>
</div>

<!-- 수료증 상태에 따른 표시 -->
<div v-if="hasCertificate" class="mt-2">
  <p class="text-sm text-green-600">
    수료증이 발급되었습니다
  </p>
  <button
  @click="viewCertificate"
  class="mt-2 text-sm text-green-700 hover:text-green-800 font-medium underline"
  >
  수료증 보기 →
</button>
</div>

<div v-else-if="!authStore.isGuest" class="mt-2">
  <p class="text-sm text-green-600 mb-2">
    축하합니다! 수료증을 발급받을 수 있습니다
  </p>
  <button
  @click="generateCertificate"
  :disabled="isGeneratingCertificate"
  class="w-full py-2 px-4 bg-green-600 text-white font-medium rounded-lg
  hover:bg-green-700 transition-colors disabled:opacity-50
  disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
  <Award v-if="!isGeneratingCertificate" :size="16" />
  <Loader2 v-else :size="16" class="animate-spin" />
  <span>{{ isGeneratingCertificate ? '생성 중...' : '수료증 발급받기' }}</span>
</button>
</div>
</div>

// 버튼 섹션에도 수료증 버튼 추가
<template v-else>
  <button
      v-if="hasCertificate"
  @click="viewCertificate"
  class="btn btn-success"
  >
  <Award :size="16" />
  수료증 보기
</button>
<button
    v-else-if="!authStore.isGuest"
      @click="generateCertificate"
:disabled="isGeneratingCertificate"
class="btn btn-primary"
    >
    <Award :size="16" />
    수료증 발급
</button>
<button
      @click="reviewCourse(enrollment.courseId)"
class="btn btn-secondary"
    >
    <Play :size="16" />
    다시 보기
</button>
</template>