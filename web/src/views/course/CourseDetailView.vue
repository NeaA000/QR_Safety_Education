<!-- views/course/CourseDetailView.vue -->
<template>
  <div class="course-detail-view">
    <app-header />

    <div class="container mx-auto px-4 py-6">
      <!-- 강의 정보 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 썸네일 -->
          <div class="aspect-video bg-gray-200 rounded-lg"></div>

          <!-- 강의 정보 -->
          <div>
            <h1 class="text-2xl font-bold mb-4">{{ course?.title }}</h1>
            <p class="text-gray-600 mb-4">{{ course?.description }}</p>

            <div class="space-y-2 mb-6">
              <div class="flex items-center">
                <el-icon class="mr-2"><Clock /></el-icon>
                <span>{{ course?.duration }}분</span>
              </div>
              <div class="flex items-center">
                <el-icon class="mr-2"><Star /></el-icon>
                <span>{{ course?.difficulty }}</span>
              </div>
            </div>

            <el-button type="primary" size="large" @click="startCourse">
              학습 시작
            </el-button>
          </div>
        </div>
      </div>

      <!-- TODO: 강의 커리큘럼, 리뷰 등 -->
    </div>

    <app-footer />
  </div>
</template>

<script setup lang="ts">
// TODO: 강의 상세 페이지
const course = ref(null)

const startCourse = () => {
  console.log('강의 시작')
}
</script>
