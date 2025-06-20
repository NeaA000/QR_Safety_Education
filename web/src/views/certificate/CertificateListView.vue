<!-- views/course/CourseListView.vue -->
<template>
  <div class="course-list-view">
    <app-header />

    <div class="container mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-6">강의 목록</h1>

      <!-- 필터 -->
      <course-filter @filter="handleFilter" />

      <!-- 강의 그리드 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <course-card
          v-for="course in courses"
          :key="course.id"
          :course="course"
          @click="goToCourse(course.id)"
        />
      </div>

      <!-- TODO: 페이지네이션, 무한스크롤 등 -->
      <div class="text-center mt-8">
        <el-button @click="loadMore">더 보기</el-button>
      </div>
    </div>

    <app-footer />
  </div>
</template>

<script setup lang="ts">
// TODO: 강의 목록 페이지
const courses = ref([])

const handleFilter = (filters) => {
  console.log('필터 처리:', filters)
}

const goToCourse = (courseId) => {
  console.log('강의 상세로 이동:', courseId)
}

const loadMore = () => {
  console.log('더 많은 강의 로드')
}
</script>
