<template>
  <div class="certificate-view">
    <div class="header">
      <h1>수료증</h1>
      <p>완료한 강의의 수료증을 확인하고 다운로드할 수 있습니다.</p>
    </div>

    <!-- 통계 정보 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon :size="32" color="#67C23A">
                <Medal />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ certificates.length }}</div>
              <div class="stat-label">발급된 수료증</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon :size="32" color="#409EFF">
                <VideoPlay />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ lectureStats.completedLectures }}</div>
              <div class="stat-label">완료한 강의</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon :size="32" color="#E6A23C">
                <Trophy />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ lectureStats.completionRate }}%</div>
              <div class="stat-label">완료율</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 수료증 목록 -->
    <div class="certificates-section">
      <div v-if="loading" class="loading">
        <el-icon class="is-loading" :size="40">
          <Loading />
        </el-icon>
        <p>수료증을 불러오는 중...</p>
      </div>

      <div v-else-if="certificates.length > 0" class="certificates-grid">
        <div 
          v-for="certificate in certificates" 
          :key="certificate.id"
          class="certificate-card"
        >
          <div class="certificate-header">
            <div class="certificate-icon">
              <el-icon :size="24" color="#67C23A">
                <Medal />
              </el-icon>
            </div>
            <div class="certificate-info">
              <h3>{{ getLectureTitle(certificate.lectureId) }}</h3>
              <p class="certificate-number">{{ certificate.certificateNumber }}</p>
            </div>
          </div>

          <div class="certificate-details">
            <div class="detail-item">
              <span class="label">발급일:</span>
              <span class="value">{{ formatDate(certificate.issuedAt) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">강사:</span>
              <span class="value">{{ getLectureInstructor(certificate.lectureId) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">카테고리:</span>
              <span class="value">{{ getLectureCategory(certificate.lectureId) }}</span>
            </div>
          </div>

          <div class="certificate-actions">
            <el-button 
              type="primary" 
              size="small"
              :icon="View"
              @click="viewCertificate(certificate)"
            >
              미리보기
            </el-button>
            <el-button 
              size="small"
              :icon="Download"
              @click="downloadCertificate(certificate)"
            >
              다운로드
            </el-button>
            <el-button 
              size="small"
              :icon="Share"
              @click="shareCertificate(certificate)"
            >
              공유
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <el-empty description="아직 발급된 수료증이 없습니다">
          <el-button type="primary" @click="goToLectures">
            강의 들으러 가기
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 수료증 미리보기 다이얼로그 -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="`수료증 미리보기 - ${selectedCertificate?.certificateNumber}`"
      width="600px"
      center
    >
      <div v-if="selectedCertificate" class="certificate-preview">
        <div class="preview-header">
          <h2>수 료 증</h2>
          <div class="certificate-number-large">
            {{ selectedCertificate.certificateNumber }}
          </div>
        </div>

        <div class="preview-content">
          <div class="recipient-info">
            <p class="recipient-label">성명</p>
            <p class="recipient-name">{{ userName }}</p>
          </div>

          <div class="course-info">
            <p class="course-label">위 사람은 다음 과정을 성실히 이수하였기에 이 증서를 수여합니다.</p>
            <p class="course-title">{{ getLectureTitle(selectedCertificate.lectureId) }}</p>
            <p class="course-details">
              강사: {{ getLectureInstructor(selectedCertificate.lectureId) }}<br>
              카테고리: {{ getLectureCategory(selectedCertificate.lectureId) }}
            </p>
          </div>

          <div class="issue-info">
            <p class="issue-date">발급일: {{ formatDate(selectedCertificate.issuedAt) }}</p>
            <p class="issuer">QR 안전교육센터</p>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="previewDialogVisible = false">닫기</el-button>
          <el-button 
            type="primary" 
            @click="downloadCertificate(selectedCertificate!)"
          >
            다운로드
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Medal, 
  VideoPlay, 
  Trophy, 
  Loading, 
  View, 
  Download, 
  Share 
} from '@element-plus/icons-vue'
import { useLectureStore } from '@/stores/lectures'
import { useAuthStore } from '@/stores/auth'
import type { Certificate } from '@/types/global'
import nativeBridge from '@/services/native-bridge'

// 스토어 및 라우터
const router = useRouter()
const lectureStore = useLectureStore()
const authStore = useAuthStore()

// 상태
const loading = ref(false)
const previewDialogVisible = ref(false)
const selectedCertificate = ref<Certificate | null>(null)

// 계산된 속성
const certificates = computed(() => lectureStore.certificates)
const lectureStats = computed(() => lectureStore.lectureStats)
const userName = computed(() => authStore.user?.displayName || '사용자')

// 메서드
const getLectureTitle = (lectureId: string): string => {
  const lecture = lectureStore.lectures.find(l => l.id === lectureId)
  return lecture?.title || '알 수 없는 강의'
}

const getLectureInstructor = (lectureId: string): string => {
  const lecture = lectureStore.lectures.find(l => l.id === lectureId)
  return lecture?.instructor || '알 수 없음'
}

const getLectureCategory = (lectureId: string): string => {
  const lecture = lectureStore.lectures.find(l => l.id === lectureId)
  if (lecture?.leafCategory) {
    return `${lecture.mainCategory} > ${lecture.middleCategory} > ${lecture.leafCategory}`
  }
  return lecture?.category || '알 수 없음'
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

const viewCertificate = (certificate: Certificate): void => {
  selectedCertificate.value = certificate
  previewDialogVisible.value = true
}

const downloadCertificate = async (certificate: Certificate): Promise<void> => {
  try {
    if (nativeBridge.isNativeApp()) {
      // 네이티브 앱에서 PDF 다운로드
      if (certificate.pdfUrl) {
        await nativeBridge.downloadFile(certificate.pdfUrl, `certificate_${certificate.certificateNumber}.pdf`)
        nativeBridge.showToast('수료증이 다운로드되었습니다.')
      } else {
        ElMessage.error('수료증 파일을 찾을 수 없습니다.')
      }
    } else {
      // 웹에서 PDF 생성 및 다운로드
      await generateAndDownloadPDF(certificate)
    }
  } catch (error) {
    console.error('수료증 다운로드 실패:', error)
    ElMessage.error('수료증 다운로드에 실패했습니다.')
  }
}

const generateAndDownloadPDF = async (certificate: Certificate): Promise<void> => {
  // TODO: PDF 생성 라이브러리 사용 (예: jsPDF)
  // 임시로 HTML을 PDF로 변환하는 로직
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const htmlContent = `
    <html>
      <head>
        <title>수료증 - ${certificate.certificateNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .certificate { border: 3px solid #333; padding: 50px; margin: 20px; }
          .title { font-size: 36px; font-weight: bold; margin-bottom: 30px; }
          .number { font-size: 14px; color: #666; margin-bottom: 30px; }
          .name { font-size: 24px; font-weight: bold; margin: 30px 0; }
          .course { font-size: 20px; margin: 20px 0; }
          .date { font-size: 16px; margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="title">수 료 증</div>
          <div class="number">${certificate.certificateNumber}</div>
          <div class="name">${userName.value}</div>
          <div class="course">${getLectureTitle(certificate.lectureId)}</div>
          <div class="instructor">강사: ${getLectureInstructor(certificate.lectureId)}</div>
          <div class="date">발급일: ${formatDate(certificate.issuedAt)}</div>
          <div class="issuer">QR 안전교육센터</div>
        </div>
      </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  printWindow.print()
}

const shareCertificate = async (certificate: Certificate): Promise<void> => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: '수료증',
        text: `${getLectureTitle(certificate.lectureId)} 과정을 성공적으로 완료했습니다!`,
        url: window.location.href
      })
    } else {
      // 공유 API가 지원되지 않는 경우 클립보드 복사
      const shareText = `${userName.value}님이 "${getLectureTitle(certificate.lectureId)}" 과정을 성공적으로 완료했습니다! 수료증 번호: ${certificate.certificateNumber}`
      await navigator.clipboard.writeText(shareText)
      ElMessage.success('공유 내용이 클립보드에 복사되었습니다.')
    }
  } catch (error) {
    console.error('공유 실패:', error)
    ElMessage.error('공유에 실패했습니다.')
  }
}

const goToLectures = (): void => {
  router.push('/lectures')
}

// 라이프사이클
onMounted(async () => {
  try {
    loading.value = true
    await lectureStore.initialize()
  } catch (error) {
    console.error('수료증 데이터 로드 실패:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.certificate-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.header p {
  font-size: 16px;
  color: #606266;
  margin: 0;
}

.stats-section {
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.certificates-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
}

.loading p {
  margin-top: 16px;
}

.certificates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.certificate-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.2s;
}

.certificate-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.certificate-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.certificate-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.certificate-number {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.certificate-details {
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.label {
  color: #606266;
}

.value {
  color: #303133;
  font-weight: 500;
}

.certificate-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.certificate-preview {
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  font-family: serif;
}

.preview-header h2 {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 16px 0;
}

.certificate-number-large {
  font-size: 14px;
  color: #909399;
  margin-bottom: 32px;
}

.recipient-label {
  font-size: 16px;
  color: #606266;
  margin: 0 0 8px 0;
}

.recipient-name {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 32px 0;
}

.course-label {
  font-size: 14px;
  color: #606266;
  margin: 0 0 16px 0;
}

.course-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.course-details {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.issue-info {
  border-top: 1px solid #eee;
  padding-top: 24px;
  margin-top: 32px;
}

.issue-date,
.issuer {
  font-size: 14px;
  color: #606266;
  margin: 8px 0;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .certificate-view {
    padding: 16px;
  }
  
  .certificates-grid {
    grid-template-columns: 1fr;
  }
  
  .certificate-actions {
    justify-content: center;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>