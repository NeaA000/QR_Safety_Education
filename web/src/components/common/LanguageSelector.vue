<!-- components/common/LanguageSelector.vue -->
<template>
  <el-select v-model="currentLocale" @change="changeLanguage" size="small">
    <el-option label="한국어" value="ko" />
    <el-option label="English" value="en" />
    <el-option label="中文" value="zh" />
    <el-option label="Tiếng Việt" value="vi" />
  </el-select>
</template>

<script setup lang="ts">
// TODO: 언어 변경 기능
const currentLocale = ref('ko')

const changeLanguage = (locale: string) => {
  console.log('언어 변경:', locale)
  // i18n locale 변경
  // 네이티브에 언어 변경 알림
}
</script>
