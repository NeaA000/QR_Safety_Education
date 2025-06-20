<!-- views/course/MyCoursesView.vue -->
<template>
  <div class="my-courses-view">
    <app-header />

    <div class="container mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-6">내 강의</h1>

      <!-- 탭 메뉴 -->
      <el-tabs v-model="activeTab">
        <el-tab-pane label="진행 중" name="inProgress">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- TODO: 진행 중인 강의 목록 -->
            <course-card
              v-for="course in inProgressCourses"
              :key="course.id"
              :course="course"
              :progress="getProgress(course.id)"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="완료" name="completed">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- TODO: 완료된 강의 목록 -->
            <course-card
              v-for="course in completedCourses"
              :key="course.id"
              :course="course"
              :progress="{ percentage: 100 }"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <app-footer />
  </div>
</template>

<script setup lang="ts">
// TODO: 내 강의 페이지
const activeTab = ref('inProgress')
const inProgressCourses = ref([])
const completedCourses = ref([])

const getProgress = (courseId) => {
  return { percentage: 75 } // 예시
}
</script>
