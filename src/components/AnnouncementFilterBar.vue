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
  },
  showNewButton: {
    type: Boolean,
    default: true
  },
  showViewToggles: {
    type: Boolean,
    default: true
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  }
})

defineEmits(['update:search', 'update:date', 'update:viewMode', 'new-announcement'])

const windowWidth = ref(window.innerWidth)
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const buttonSize = computed(() => {
  return windowWidth.value < 640 ? 'xs' : 'md'
})

const iconSize = computed(() => {
  return windowWidth.value < 640 ? '16' : '20'
})

const dateInput = ref(null)

const openDatePicker = () => {
  if (dateInput.value?.showPicker) {
    dateInput.value.showPicker();
  } else {
    dateInput.value?.click();
  }
}
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
        <!-- Date Picker (Styled like ParcelFilterBar) -->
        <div class="relative flex items-center group">
          <!-- Icon Overlay -->
          <div 
            class="absolute left-3 z-10 transition-transform duration-200 group-hover:scale-105 cursor-pointer"
            @click="openDatePicker"
          >
            <div class="mr-0 p-1 bg-white rounded-lg text-[#0E4B90] shadow-sm flex items-center justify-center border border-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sm:w-4 sm:h-4 text-[#0E4B90]">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>
          
          <!-- Styled Date Input -->
          <input
            ref="dateInput"
            type="date"
            :value="date"
            @input="$emit('update:date', $event.target.value)"
            class="bg-[#F8FAFC] text-[#1D355E] border border-gray-200/80 rounded-xl pl-12 sm:pl-14 pr-4 py-1.5 sm:py-2 font-bold text-xs sm:text-base shadow-inner outline-none focus:ring-2 focus:ring-[#0E4B90]/20 transition-all hover:bg-gray-100/50 whitespace-nowrap [&::-webkit-calendar-picker-indicator]:hidden"
          />
        </div>
        <ButtonWeb
          v-if="showNewButton"
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
      <div v-if="showViewToggles" class="hidden sm:block w-px h-8 bg-gray-200 mx-1"></div>

      <!-- View Toggles -->
      <div v-if="showViewToggles" class="flex bg-[#F8FAFC] border border-gray-100 rounded-xl p-1 shadow-inner w-fit flex-shrink-0">
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
