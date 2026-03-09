<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import ButtonWeb from './ButtonWeb.vue'

defineProps({
  modelSearch: String,
  modelCategory: String,
  categories: {
    type: Array,
    default: () => ['General', 'Maintenance', 'Events', 'Urgent']
  },
  viewMode: {
    type: String,
    default: 'grid'
  }
})

const windowWidth = ref(window.innerWidth)
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  updateDate()
  dateInterval = setInterval(updateDate, 60000)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (dateInterval) clearInterval(dateInterval)
  window.removeEventListener('resize', handleResize)
})

const buttonSize = computed(() => {
  return windowWidth.value < 640 ? 'xs' : 'md'
})

const iconSize = computed(() => {
  return windowWidth.value < 640 ? '16' : '20'
})

const currentDate = ref('')
const updateDate = () => {
  const date = new Date()
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  const day = date.getDate()
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const year = date.getFullYear()
  currentDate.value = `${weekday}, ${day} ${month} ${year}`
}
let dateInterval
</script>

<template>
  <div class="bg-white p-3 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 mb-6 flex flex-col xl:flex-row gap-4 justify-between items-center transition-all duration-300">
    <!-- Search -->
    <div class="relative w-full xl:w-[400px]">
      <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
        </svg>
      </div>
      <input
        type="text"
        :value="modelSearch"
        @input="$emit('update:search', $event.target.value)"
        placeholder="Search ..."
        class="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0E4B90]/20 focus:border-[#0E4B90] transition duration-200 shadow-sm"
      />
    </div>

    <div class="flex flex-row items-center justify-between gap-3 sm:gap-4 w-full xl:w-auto mt-1 sm:mt-0">
      <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-x-auto hide-scrollbar">
        <div class="flex items-center gap-2 bg-blue-50/50 text-[#0E4B90] px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl font-semibold shadow-sm border border-gray-100 whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5 text-[#0E4B90]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="text-[11px] sm:text-sm">{{ currentDate }}</span>
        </div>
        <ButtonWeb
          @click="$emit('new-announcement')"
          label="Add New"
          color="blue"
          :size="buttonSize"
          class="whitespace-nowrap sm:px-5 sm:py-2.5"
        >
  <template #icon>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :width="iconSize"
      :height="iconSize"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  </template>

  <template #default>
    <span>
      New <span class="hidden sm:inline">Announcement</span>
    </span>
  </template>
</ButtonWeb>
        <!-- <button class="flex items-center gap-2 bg-[#0E4B90] hover:bg-[#0E4B90]/90 text-white px-3 sm:px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 font-semibold cursor-pointer whitespace-nowrap" @click="$emit('new-announcement')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New <span class="hidden sm:inline">Announcement</span></span>
        </button> -->
      </div>

      <!-- Divider -->
      <div class="hidden sm:block w-px h-8 bg-gray-200 mx-1"></div>

      <!-- View Toggles -->
      <div class="flex bg-[#F8FAFC] border border-gray-100 rounded-xl p-1 shadow-inner w-fit flex-shrink-0">
        <button 
          @click="$emit('update:viewMode', 'grid')"
          class="p-2 rounded-lg transition-all duration-200 cursor-pointer"
          :class="viewMode === 'grid' ? 'bg-white text-[#0E4B90] shadow-[0_2px_4px_rgba(0,0,0,0.06)]' : 'text-gray-400 hover:text-gray-600'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>
        </button>
        <button 
          @click="$emit('update:viewMode', 'list')"
          class="p-2 rounded-lg transition-all duration-200 cursor-pointer"
          :class="viewMode === 'list' ? 'bg-white text-[#0E4B90] shadow-[0_2px_4px_rgba(0,0,0,0.06)]' : 'text-gray-400 hover:text-gray-600'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
