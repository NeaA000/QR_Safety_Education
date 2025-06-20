<!-- components/course/CourseFilter.vue -->
<template>
  <div class="course-filter bg-white p-4 rounded-lg shadow-sm mb-4">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- 카테고리 -->
      <div>
        <label class="block text-sm font-medium mb-2">카테고리</label>
        <el-select v-model="filters.category" placeholder="전체" clearable @change="applyFilter">
          <el-option label="전체" value="" />
          <el-option label="안전교육" value="safety" />
          <el-option label="작업안전" value="work-safety" />
          <el-option label="화재안전" value="fire-safety" />
        </el-select>
      </div>

      <!-- 난이도 -->
      <div>
        <label class="block text-sm font-medium mb-2">난이도</label>
        <el-select v-model="filters.difficulty" placeholder="전체" clearable @change="applyFilter">
          <el-option label="전체" value="" />
          <el-option label="초급" value="beginner" />
          <el-option label="중급" value="intermediate" />
          <el-option label="고급" value="advanced" />
        </el-select>
      </div>

      <!-- 정렬 -->
      <div>
        <label class="block text-sm font-medium mb-2">정렬</label>
        <el-select v-model="filters.sortBy" @change="applyFilter">
          <el-option label="최신순" value="newest" />
          <el-option label="인기순" value="popular" />
          <el-option label="시간순" value="duration" />
        </el-select>
      </div>

      <!-- 검색 -->
      <div>
        <label class="block text-sm font-medium mb-2">검색</label>
        <el-input
          v-model="filters.search"
          placeholder="강의명 검색"
          @keyup.enter="applyFilter"
          @clear="applyFilter"
          clearable
        >
          <template #suffix>
            <el-icon class="cursor-pointer" @click="applyFilter"><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: 강의 필터 컴포넌트
const filters = reactive({
  category: '',
  difficulty: '',
  sortBy: 'newest',
  search: ''
})

const emit = defineEmits<{
  filter: [filters: typeof filters]
}>()

const applyFilter = () => {
  console.log('필터 적용:', filters)
  emit('filter', filters)
}
</script>
