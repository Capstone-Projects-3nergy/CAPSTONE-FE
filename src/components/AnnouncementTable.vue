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
  }
})

defineEmits(['prev', 'next', 'go', 'edit', 'delete'])

const getCategoryBadgeClass = (category) => {
  switch (category) {
    case 'Maintenance': return 'bg-yellow-100 text-yellow-800'
    case 'Events': return 'bg-purple-100 text-purple-800'
    case 'News': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-800'
    case 'Upcoming': return 'bg-blue-100 text-blue-800'
    case 'Past': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getIconClass = (category) => {
  switch (category) {
    case 'Maintenance': return 'text-blue-600 bg-blue-100'
    case 'Events': return 'text-purple-600 bg-purple-100'
    default: return 'text-green-600 bg-green-100'
  }
}
</script>

<template>
  <div class="md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 w-full overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="hidden md:table-header-group bg-gray-50/50">
          <tr>
            <th scope="col" class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
            <th scope="col" class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
            <th scope="col" class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Posted</th>
            <th scope="col" class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" class="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <tr v-if="items.length === 0">
            <td colspan="5" class="text-center py-8 text-gray-500">No announcements found.</td>
          </tr>
          <tr v-for="item in items" :key="item.id" class="md:table-row flex flex-col md:flex-row bg-gray-50 md:bg-white rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 shadow md:shadow-none hover:bg-gray-50/50 transition-colors duration-150">
            <td class="px-4 py-2 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap">
              <span class="md:hidden font-semibold text-[#185DC0] block mb-1">Title:</span>
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center" :class="getIconClass(item.category)">
                   <!-- Dynamic Icon based on category or default -->
                   <svg v-if="item.category === 'Maintenance'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                   <svg v-else-if="item.category === 'Events'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" /></svg>
                   <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-bold text-gray-900">{{ item.title }}</div>
                  <div class="text-xs text-gray-500">{{ item.subtitle }}</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-2 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap">
              <span class="md:hidden font-semibold text-[#185DC0] mr-2">Category:</span>
              <span class="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getCategoryBadgeClass(item.category)">
                {{ item.category }}
              </span>
            </td>
            <td class="px-4 py-2 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap text-sm text-gray-500">
              <span class="md:hidden font-semibold text-[#185DC0] mr-2">Date Posted:</span>
              {{ item.datePosted }}
            </td>
            <td class="px-4 py-2 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap">
              <span class="md:hidden font-semibold text-[#185DC0] mr-2">Status:</span>
              <span class="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getStatusBadgeClass(item.status)">
                {{ item.status }}
              </span>
            </td>
            <td class="px-4 py-2 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap text-right text-sm font-medium flex items-center md:table-cell gap-2">
              <span class="md:hidden font-semibold text-[#185DC0] mr-2">Actions:</span>
              <button @click="$emit('edit', item)" class="group relative text-gray-400 hover:text-blue-600 transition-colors mx-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0">
                  <div class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                    Edit Announcement
                    <div class="absolute left-1/2 top-full -translate-x-1/2">
                      <div class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                    </div>
                  </div>
                </div>
              </button>
              <button @click="$emit('delete', item)" class="group relative text-gray-400 hover:text-red-600 transition-colors mx-2">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0">
                  <div class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                    Delete Announcement
                    <div class="absolute left-1/2 top-full -translate-x-1/2">
                      <div class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                    </div>
                  </div>
                </div>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Pagination -->
    <div class="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 sm:justify-end gap-3" v-if="total > 0">
        <!-- <span class="text-sm text-gray-500">Showing page <span class="font-medium">{{ page }}</span> of <span class="font-medium">{{ total }}</span></span> -->
        <div class="flex gap-2 w-full sm:w-auto justify-center">
            <button 
              @click="$emit('prev')" 
              :disabled="page === 1"
              class="px-3 py-1 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >Previous</button>
            
            <!-- Page Numbers -->
            <button
              v-for="p in pages"
              :key="p"
              @click="$emit('go', p)"
              class="px-3 py-1 border border-gray-200 rounded-lg text-sm cursor-pointer"
              :class="p === page ? 'bg-blue-50 text-blue-600 font-medium border-blue-200' : 'text-gray-500 hover:bg-gray-50d'"
            >
              {{ p }}
            </button>

            <button 
              @click="$emit('next')" 
              :disabled="!canNext"
              class="px-3 py-1 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >Next</button>
        </div>
    </div>
  </div>
</template>
