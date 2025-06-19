<!-- CertificateView.vue -->
<template>
  <div class="certificate-view">
    <div class="header">
      <h1>수료증</h1>
      <el-button type="primary" :icon="Download" @click="downloadAll">
        전체 다운로드
      </el-button>
    </div>

    <div v-if="certificates.length === 0" class="empty-state">
      <el-icon size="64" color="#ddd"><Medal /></el-icon>
      <h3>아직 발급된 수료증이 없습니다</h3>
      <p>강의를 완료하면 수료증이 자동으로 발급됩니다.</p>
      <el-button type="primary" @click="$router.push('/lectures')">
        강의 보러가기
      </el-button>
    </div>

    <div v-else class="certificates-grid">
      <div 
        v-for="cert in certificates" 
        :key="cert.id"
        class="certificate-card"
      >
        <div class="certificate-preview">
          <img :src="cert.previewUrl" :alt="cert.lectureName" />
        </div>
        <div class="certificate-info">
          <h3>{{ cert.lectureName }}</h3>
          <p>{{ formatDate(cert.issuedDate) }}</p>
          <div class="certificate-actions">
            <el-button size="small" @click="downloadCertificate(cert)">
              다운로드
            </el-button>
            <el-button size="small" type="primary" @click="shareCertificate(cert)">
              공유
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Download, Medal } from '@element-plus/icons-vue'

interface Certificate {
  id: string
  lectureName: string
  previewUrl: string
  downloadUrl: string
  issuedDate: Date
}

const certificates = ref<Certificate[]>([])

onMounted(() => {
  // TODO: 수료증 데이터 로드
  certificates.value = [
    {
      id: '1',
      lectureName: '화재 안전 기초',
      previewUrl: '/images/cert-preview1.jpg',
      downloadUrl: '/certificates/cert1.pdf',
      issuedDate: new Date('2024-12-15')
    }
  ]
})

const downloadCertificate = (cert: Certificate) => {
  console.log('수료증 다운로드:', cert.lectureName)
}

const shareCertificate = (cert: Certificate) => {
  console.log('수료증 공유:', cert.lectureName)
}

const downloadAll = () => {
  console.log('전체 수료증 다운로드')
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('ko-KR')
}
</script>

<style scoped>
.certificate-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.certificates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.certificate-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s;
}

.certificate-card:hover {
  transform: translateY(-4px);
}

.certificate-preview img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.certificate-info {
  padding: 16px;
}

.certificate-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
</style>