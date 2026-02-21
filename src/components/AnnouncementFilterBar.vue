<script setup>
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

defineEmits(['update:search', 'update:category', 'update:viewMode'])
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
        placeholder="Search announcements..."
        class="block w-full pl-11 pr-4 py-2.5 border border-gray-100/80 rounded-xl leading-5 bg-[#F8FAFC] placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 text-sm font-medium"
      />
    </div>

    <div class="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
      <!-- Category Filter -->
      <div class="flex items-center gap-3 overflow-x-auto w-full sm:w-auto pt-1.5 pb-2.5 sm:py-1.5 px-1 hide-scrollbar">
        <span class="text-sm font-medium text-gray-500 whitespace-nowrap ml-1">Category:</span>
        <div class="flex gap-2 items-center">
          <button
            @click="$emit('update:category', '')"
            class="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap"
            :class="!modelCategory ? 'bg-[#0E2856] text-white shadow-md transform scale-105' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700'"
          >
            All
          </button>
          <button
            v-for="cat in categories"
            :key="cat"
            @click="$emit('update:category', cat)"
            class="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap"
            :class="modelCategory === cat ? 'bg-[#0E2856] text-white shadow-md transform scale-105' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700'"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div class="hidden sm:block w-px h-8 bg-gray-200 mx-1"></div>

      <!-- View Toggles -->
      <div class="flex bg-[#F8FAFC] border border-gray-100 rounded-xl p-1 shadow-inner w-full sm:w-auto justify-center">
        <button 
          @click="$emit('update:viewMode', 'grid')"
          class="p-2 rounded-lg transition-all duration-200 cursor-pointer"
          :class="viewMode === 'grid' ? 'bg-white text-[#1D355E] shadow-[0_2px_4px_rgba(0,0,0,0.06)]' : 'text-gray-400 hover:text-gray-600'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>
        </button>
        <button 
          @click="$emit('update:viewMode', 'list')"
          class="p-2 rounded-lg transition-all duration-200 cursor-pointer"
          :class="viewMode === 'list' ? 'bg-white text-[#1D355E] shadow-[0_2px_4px_rgba(0,0,0,0.06)]' : 'text-gray-400 hover:text-gray-600'"
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
