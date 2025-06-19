<script setup lang="ts">
import TheWelcome from '../components/TheWelcome.vue'
</script>

<template>
  <main>
    <TheWelcome />
  </main>
</template>
<template>
  <div class="home-container">
    <!-- 헤더 -->
    <div class="home-header">
      <div class="header-top">
        <div class="user-greeting">
          <h2>안녕하세요, {{ userName }}님!</h2>
          <p>오늘도 안전한 하루 되세요</p>
        </div>
        <div class="header-actions">
          <el-button 
            :icon="Search" 
            circle 
            @click="showSearch = true"
            title="검색"
          />
          <el-button 
            :icon="Bell" 
            circle 
            @click="showNotifications = true"
            title="알림"
          >
            <el-badge 
              v-if="unreadNotifications > 0" 
              :value="unreadNotifications" 
              class="notification-badge"
            />
          </el-button>
        </div>
      </div>
      
      <!-- 진행중인 강의 -->
      <div class="current-course" v-if="currentCourse">
        <el-card class="course-card" shadow="hover">
          <div class="course-content">
            <div class="course-info">
              <h3>{{ currentCourse.title }}</h3>
              <p>{{ currentCourse.description }}</p>
              <div class="course-progress">
                <el-progress 
                  :percentage="currentCourse.progress" 
                  :show-text="false"
                  stroke-width="4"
                />
                <span class="progress-text">{{ currentCourse.progress }}% 완료</span>
              </div>
            </div>
            <div class="course-actions">
              <el-button 
                type="primary" 
                :icon="VideoPlay"
                @click="continueCourse"
              >
                이어보기
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- QR 스캔 섹션 -->
    <div class="qr-scan-section">
      <el-card class="qr-scan-card" shadow="hover">
        <div class="qr-scan-content">
          <div class="qr-icon">
            <el-icon size="48" color="#1976d2">
              <Qrcode />
            </el-icon>
          </div>
          <div class="qr-text">
            <h3>QR 코드 스캔</h3>
            <p>QR 코드를 스캔하여 강의를 시작하세요</p>
          </div>
          <el-button 
            type="primary" 
            size="large"
            :icon="Scan"
            :loading="isScanning"
            @click="handleQRScan"
            class="qr-scan-button"
          >
            스캔 시작
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 퀵 액션 -->
    <div class="quick-actions">
      <div class="section-header">
        <h3>빠른 메뉴</h3>
      </div>
      <div class="action-grid">
        <div 
          v-for="action in quickActions" 
          :key="action.id"
          class="action-item"
          @click="handleQuickAction(action)"
        >
          <div class="action-icon">
            <el-icon size="24" :color="action.color">
              <component :is="action.icon" />
            </el-icon>
          </div>
          <span class="action-text">{{ action.text }}</span>
        </div>
      </div>
    </div>

    <!-- 최근 강의 -->
    <div class="recent-courses">
      <div class="section-header">
        <h3>최근 강의</h3>
        <el-link type="primary" @click="$router.push('/lectures')">
          전체보기
        </el-link>
      </div>
      <div class="courses-grid">
        <div 
          v-for="course in recentCourses" 
          :key="course.id"
          class="course-item"
          @click="openCourse(course)"
        >
          <div class="course-thumbnail">
            <img :src="course.thumbnail" :alt="course.title" />
            <div class="course-duration">{{ course.duration }}</div>
          </div>
          <div class="course-details">
            <h4>{{ course.title }}</h4>
            <p>{{ course.category }}</p>
            <div class="course-meta">
              <el-rate 
                v-model="course.rating" 
                disabled 
                show-score 
                text-color="#ff9900"
                score-template="{value}"
                size="small"
              />
              <span class="course-views">{{ course.views }}회 시청</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 통계 섹션 -->
    <div class="statistics-section">
      <div class="section-header">
        <h3>학습 현황</h3>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon size="24" color="#4caf50">
              <TrophyBase />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ userStats.completedCourses }}</div>
            <div class="stat-label">완료된 강의</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon size="24" color="#ff9800">
              <Clock />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ userStats.totalHours }}h</div>
            <div class="stat-label">총 학습 시간</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon size="24" color="#2196f3">
              <Medal />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ userStats.certificates }}</div>
            <div class="stat-label">취득 수료증</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon size="24" color="#9c27b0">
              <Calendar />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ userStats.streak }}</div>
            <div class="stat-label">연속 학습일</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 검색