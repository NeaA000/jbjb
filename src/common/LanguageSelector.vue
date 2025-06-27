<!-- src/components/common/LanguageSelector.vue -->
<template>
  <el-dropdown @command="handleLanguageChange">
    <el-button circle size="small">
      <span class="text-xs font-medium">{{ currentLanguageCode }}</span>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
            v-for="(name, code) in languages"
            :key="code"
            :command="code"
            :disabled="code === currentLanguage"
        >
          {{ name }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { SUPPORTED_LANGUAGES, STORAGE_KEYS } from '@/utils/constants'

// Vue I18n
const { locale } = useI18n()

// 지원 언어 목록 - constants에서 가져오기
const languages = SUPPORTED_LANGUAGES

// 현재 언어
const currentLanguage = computed(() => locale.value)
const currentLanguageCode = computed(() =>
    currentLanguage.value.toUpperCase().slice(0, 2)
)

// 언어 변경 핸들러
const handleLanguageChange = (command) => {
  locale.value = command
  // constants의 STORAGE_KEYS 사용
  localStorage.setItem(STORAGE_KEYS.LANGUAGE_PREFERENCE, command)
  ElMessage.success(`언어가 ${languages[command]}(으)로 변경되었습니다`)
}
</script>

<style scoped>
.el-button.is-circle {
  width: 32px;
  height: 32px;
}
</style>