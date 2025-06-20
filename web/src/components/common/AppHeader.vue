<!-- components/common/AppHeader.vue -->
<template>
  <div class="app-header bg-white shadow-sm">
    <div class="flex items-center justify-between px-4 py-3">
      <div class="flex items-center">
        <el-icon class="text-2xl text-blue-500 mr-2">
          <Shield />
        </el-icon>
        <h1 class="text-lg font-bold">QR 안전교육</h1>
      </div>

      <div class="flex items-center space-x-3">
        <!-- 언어 선택 -->
        <language-selector />

        <!-- 알림 -->
        <el-badge :value="notificationCount" :hidden="notificationCount === 0">
          <el-button circle>
            <el-icon><Bell /></el-icon>
          </el-button>
        </el-badge>

        <!-- 사용자 메뉴 -->
        <el-dropdown>
          <el-avatar :src="userAvatar" class="cursor-pointer">
            {{ userName.charAt(0) }}
          </el-avatar>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goToProfile">프로필</el-dropdown-item>
              <el-dropdown-item @click="logout" divided>로그아웃</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: AppHeader 기능 구현
// - 알림 카운트
// - 사용자 아바타
// - 드롭다운 메뉴
// - 로그아웃 처리
const notificationCount = ref(3)
const userName = ref('사용자')
const userAvatar = ref('')

const goToProfile = () => {
  console.log('프로필 페이지로 이동')
}

const logout = () => {
  console.log('로그아웃 처리')
}
</script>
