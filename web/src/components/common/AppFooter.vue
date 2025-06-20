<!-- components/common/AppFooter.vue -->
<template>
  <div class="app-footer bg-white border-t">
    <div class="flex justify-around py-3">
      <router-link to="/home" class="footer-item">
        <el-icon><House /></el-icon>
        <span>홈</span>
      </router-link>

      <router-link to="/courses" class="footer-item">
        <el-icon><VideoPlay /></el-icon>
        <span>강의</span>
      </router-link>

      <div class="footer-item" @click="scanQR">
        <el-icon><QrCode /></el-icon>
        <span>QR스캔</span>
      </div>

      <router-link to="/certificates" class="footer-item">
        <el-icon><Medal /></el-icon>
        <span>수료증</span>
      </router-link>

      <router-link to="/profile" class="footer-item">
        <el-icon><User /></el-icon>
        <span>프로필</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: 하단 네비게이션 바
const scanQR = () => {
  console.log('QR 스캔 시작')
  // 네이티브 QR 스캔 호출
}
</script>

<style scoped>
.footer-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  color: #666;
  text-decoration: none;
}

.footer-item.router-link-active {
  color: #409eff;
}
</style>
