<script setup>
defineProps({
  items: {
    type: Array,
    default: () => []
  },
  pages: {
    type: Array,
    default: () => []
  },
  page: {
    type: Number,
    default: 1
  },
  total: {
    type: Number,
    default: 0
  },
  canNext: {
    type: Boolean,
    default: true
  },
  viewMode: {
    type: String,
    default: 'grid'
  }
})

defineEmits(['prev', 'next', 'go', 'edit', 'delete'])

const getCategoryBadgeClass = (category) => {
  switch (category) {
    case 'เร่งด่วน': return 'bg-[#FEF2F2] text-[#EF4444]'
    case 'ซ่อมบำรุง': return 'bg-[#FFFBEB] text-[#F59E0B]'
    case 'กิจกรรม': return 'bg-[#EFF6FF] text-[#3B82F6]'
    case 'ทั่วไป': return 'bg-[#F0FDF4] text-[#10B981]'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Published': return 'bg-green-100 text-green-800'
    case 'Draft': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getCategoryIcon = (category) => {
  switch (category) {
    case 'เร่งด่วน': 
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`
    case 'ซ่อมบำรุง':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`
    case 'กิจกรรม':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
  }
}
</script>

<template>
  <div>
    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="items.length === 0" class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
        No announcements found.
      </div>
      
      <div v-for="item in items" :key="item.id" class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 flex flex-col group relative">
        <div class="p-6 flex-grow flex flex-col">
          <!-- Card Header (Author and Date) -->
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3 w-full">
              <div class="h-10 w-10 flex-shrink-0 bg-blue-100 text-[#185DC0] rounded-full flex items-center justify-center font-bold text-sm">
                SP
              </div>
              <div class="flex flex-col min-w-0 flex-1">
                <span class="font-bold text-gray-900 text-sm truncate flex items-center gap-2">
                  {{ item.author || 'Staff Portal' }}
                  <span v-if="item.pinned" class="text-blue-600" title="Pinned">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                  </span>
                </span>
                <span class="text-xs text-gray-500">{{ item.datePosted }}</span>
              </div>
              <!-- Status Pill on top right of the author in grid mode -->
              <div class="flex-shrink-0">
                <span class="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-lg" :class="getStatusBadgeClass(item.status)">
                  {{ item.status }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Card Body -->
          <h3 class="font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-tight group-hover:text-[#185DC0] transition-colors">
            {{ item.title }}
          </h3>
          <p class="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-grow">
            {{ item.subtitle }}
          </p>
          
          <!-- Category label -->
          <div class="mt-auto mb-4">
            <span class="px-3 py-1 inline-flex items-center gap-1.5 text-[11px] font-bold rounded-xl" :class="getCategoryBadgeClass(item.category)">
              <span v-html="getCategoryIcon(item.category)"></span>
              {{ item.category }}
            </span>
          </div>

          <!-- Divider -->
          <div class="h-px bg-gray-100 w-full mb-4"></div>
          
          <!-- Card Footer -->
          <div class="flex items-center justify-between">
            <div class="flex items-center text-gray-500 text-xs font-semibold gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {{ item.views || 0 }} Views
            </div>
            
            <div class="flex items-center gap-2">
              <button @click="$emit('edit', item)" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button @click="$emit('delete', item)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 w-full overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="hidden md:table-header-group bg-gray-50/50">
            <tr>
              <th scope="col" class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-[40%]">Title</th>
              <th scope="col" class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
              <th scope="col" class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date Posted</th>
              <th scope="col" class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" class="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Views</th>
              <th scope="col" class="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-if="items.length === 0">
              <td colspan="6" class="text-center py-8 text-gray-500">No announcements found.</td>
            </tr>
            <tr v-for="item in items" :key="item.id" class="md:table-row flex flex-col md:flex-row bg-gray-50 md:bg-white rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 shadow md:shadow-none hover:bg-gray-50/50 transition-colors duration-150 relative">
              <td class="px-4 py-3 md:py-4 md:px-6 border-b md:border-none">
                <div class="flex items-start gap-4">
                  <div class="hidden md:flex h-10 w-10 flex-shrink-0 bg-blue-100 text-[#185DC0] rounded-full flex items-center justify-center font-bold text-sm mt-1">
                    SP
                  </div>
                  <div>
                    <span class="md:hidden font-semibold text-[#185DC0] block mb-1">Title:</span>
                    <div class="flex items-center gap-2 mb-1">
                      <div class="text-sm font-bold text-gray-900 line-clamp-1">{{ item.title }}</div>
                      <span v-if="item.pinned" class="text-blue-600 flex-shrink-0" title="Pinned">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                      </span>
                    </div>
                    <div class="text-xs text-gray-500 line-clamp-1">{{ item.subtitle }}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-2 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap align-top md:align-middle">
                <span class="md:hidden font-semibold text-[#185DC0] mr-2">Category:</span>
                <span class="px-3 py-1 inline-flex items-center gap-1.5 text-[11px] font-bold rounded-xl" :class="getCategoryBadgeClass(item.category)">
                  <span v-html="getCategoryIcon(item.category)"></span>
                  {{ item.category }}
                </span>
              </td>
              <td class="px-4 py-2 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap text-sm text-gray-500 font-medium align-top md:align-middle">
                <span class="md:hidden font-semibold text-[#185DC0] mr-2">Date Posted:</span>
                <div class="flex flex-col">
                  <span>{{ item.datePosted.split(' - ')[0] }}</span>
                  <span class="text-xs text-gray-400">{{ item.datePosted.split(' - ')[1] }}</span>
                </div>
              </td>
              <td class="px-4 py-2 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap align-top md:align-middle">
                <span class="md:hidden font-semibold text-[#185DC0] mr-2">Status:</span>
                <span class="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-lg" :class="getStatusBadgeClass(item.status)">
                  {{ item.status }}
                </span>
              </td>
              <td class="px-4 py-2 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap md:text-center text-sm text-gray-500 font-medium align-top md:align-middle">
                <span class="md:hidden font-semibold text-[#185DC0] mr-2">Views:</span>
                {{ item.views || 0 }}
              </td>
              <td class="px-4 py-2 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap text-right text-sm font-medium flex items-center md:table-cell gap-2 align-top md:align-middle">
                <span class="md:hidden font-semibold text-[#185DC0] mr-2">Actions:</span>
                <div class="flex items-center justify-end gap-2">
                  <button @click="$emit('edit', item)" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button @click="$emit('delete', item)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Pagination -->
    <div class="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 sm:justify-end gap-3" v-if="total > 0">
        <div class="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 inline-flex items-center gap-1 w-full sm:w-auto justify-center">
            <button 
              @click="$emit('prev')" 
              :disabled="page === 1"
              class="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
            >Previous</button>
            
            <!-- Page Numbers -->
            <button
              v-for="p in pages"
              :key="p"
              @click="$emit('go', p)"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer',
                p === page 
                  ? 'bg-[#1D355E] text-white shadow-md transform scale-105' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              ]"
            >
              {{ p }}
            </button>

            <button 
              @click="$emit('next')" 
              :disabled="!canNext"
              class="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
            >Next</button>
        </div>
    </div>
  </div>
</template>
