<!-- LectureListView.vue -->
<template>
  <div class="lecture-list-view">
    <div class="header">
      <h1>강의 목록</h1>
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="강의 검색..."
          :prefix-icon="Search"
          clearable
        />
      </div>
    </div>

    <div class="filters">
      <el-select v-model="selectedCategory" placeholder="카테고리" clearable>
        <el-option label="전체" value="" />
        <el-option label="화재안전" value="fire" />
        <el-option label="응급처치" value="firstaid" />
        <el-option label="산업안전" value="industrial" />
      </el-select>
    </div>

    <div class="lectures-grid">
      <div 
        v-for="lecture in filteredLectures" 
        :key="lecture.id"
        class="lecture-card"
        @click="goToLecture(lecture)"
      >
        <div class="lecture-thumbnail">
          <img :src="lecture.thumbnail" :alt="lecture.title" />
          <div class="play-overlay">
            <el-icon size="32"><VideoPlay /></el-icon>
          </div>
          <div class="duration">{{ formatDuration(lecture.duration) }}</div>
        </div>
        
        <div class="lecture-content">
          <h3>{{ lecture.title }}</h3>
          <p>{{ lecture.instructor }}</p>
          <div class="lecture-meta">
            <span class="category">{{ lecture.category }}</span>
            <span class="level">{{ lecture.level }}</span>
          </div>
          
          <el-progress 
            v-if="lecture.progress > 0"
            :percentage="lecture.progress"
            :stroke-width="6"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, VideoPlay } from '@element-plus/icons-vue'

interface Lecture {
  id: string
  title: string
  instructor: string
  thumbnail: string
  duration: number
  category: string
  level: string
  progress: number
}

const router = useRouter()
const searchQuery = ref('')
const selectedCategory = ref('')
const lectures = ref<Lecture[]>([])

const filteredLectures = computed(() => {
  return lectures.value.filter(lecture => {
    const matchesSearch = lecture.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = !selectedCategory.value || lecture.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

onMounted(() => {
  // TODO: 강의 데이터 로드
  lectures.value = [
    {
      id: '1',
      title: '화재 안전 기초',
      instructor: '김안전',
      thumbnail: '/images/lecture1.jpg',
      duration: 1800,
      category: 'fire',
      level: '초급',
      progress: 75
    },
    {
      id: '2',
      title: '응급처치 요령',
      instructor: '박의료',
      thumbnail: '/images/lecture2.jpg',
      duration: 2400,
      category: 'firstaid',
      level: '중급',
      progress: 100
    }
  ]
})

const goToLecture = (lecture: Lecture) => {
  router.push(`/lectures/${lecture.id}/watch`)
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}분`
}
</script>

<style scoped>
.lecture-list-view {
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

.search-bar {
  width: 300px;
}

.filters {
  margin-bottom: 24px;
}

.lectures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.lecture-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.lecture-card:hover {
  transform: translateY(-4px);
}

.lecture-thumbnail {
  position: relative;
  height: 180px;
}

.lecture-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.lecture-content {
  padding: 16px;
}

.lecture-meta {
  display: flex;
  gap: 8px;
  margin: 8px 0;
}

.category, .level {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background: #f3f4f6;
  color: #374151;
}
</style>