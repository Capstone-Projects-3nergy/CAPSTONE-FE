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

defineEmits(['prev', 'next', 'go', 'edit', 'delete', 'pin', 'view'])

const getCategoryBadgeClass = (category) => {
  switch (category) {
    case 'Urgent': return 'bg-[#FEF2F2] text-[#EF4444]'
    case 'Maintenance': return 'bg-[#FFFBEB] text-[#F59E0B]'
    case 'Events': return 'bg-[#EFF6FF] text-[#3B82F6]'
    case 'General': return 'bg-[#F0FDF4] text-[#10B981]'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Published': return 'bg-green-50 text-green-600'
    case 'Draft': return 'bg-orange-50 text-orange-600'
    default: return 'bg-gray-50 text-gray-600'
  }
}

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Urgent': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>`
    case 'Maintenance': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>`
    case 'Events': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" /></svg>`
    case 'General': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>`
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
      
      <template v-for="item in items" :key="item.id">
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 flex flex-col group relative">
          <!-- Image display similar to Announcement.vue -->
          <div class="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
          <!-- Placeholder for Image -->
          <div class="absolute inset-0 flex items-center justify-center text-gray-400">
            <svg class="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div class="p-6 flex-grow flex flex-col">
          <!-- Card Header (Pinned, Category, and Status Badges) -->
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-2 w-full flex-wrap">
              <!-- Left Side Badges -->
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Pinned Badge -->
                <span v-if="item.pinned" class="px-2.5 py-1 inline-flex items-center gap-1.5 text-xs font-bold rounded-lg bg-red-100 text-red-600 shadow-sm" title="Pinned">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  Pinned
                </span>

                <!-- Category Badge -->
                <span class="px-2.5 py-1 inline-flex items-center gap-1.5 text-xs font-bold rounded-lg" :class="getCategoryBadgeClass(item.category)">
                  <span v-html="getCategoryIcon(item.category)"></span>
                  {{ item.category }}
                </span>

                <!-- Status Pill -->
                <span class="px-2.5 py-1 inline-flex items-center text-xs leading-5 font-bold rounded-lg" :class="getStatusBadgeClass(item.status)">
                  {{ item.status }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Card Body -->
          <h3 class="font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-tight group-hover:text-[#0E4B90] transition-colors">
            {{ item.title ? item.title.replace(/^Draft\s*-\s*/i, '') : '' }}
          </h3> 
          <p class="text-sm text-gray-600 mb-6 leading-relaxed flex-grow">
            {{ item.subtitle ? item.subtitle.replace(/^Draft\s*-\s*/i, '') : '' }}
          </p>

          <!-- Divider -->
          <div class="h-px bg-gray-100 w-full mb-4"></div>
          
          <!-- Card Footer -->
          <div class="flex items-center justify-between gap-2 mt-auto">
            <!-- Left Side: Metadata consolidated into single line -->
            <div class="flex flex-row items-center gap-3 text-gray-400 text-[10px] font-bold min-w-0">
                <div class="flex items-center gap-1 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                  </svg>
                  <span>{{ item.datePosted.split(' - ')[0] }}</span>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <div class="h-3.5 w-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[7px] font-bold">P</div>
                  <span class="truncate max-w-[60px]">{{ item.author || 'Staff Portal' }}</span>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{{ item.views || 0 }}</span>
                </div>
            </div>
            
            <!-- Right Side: Action Buttons -->
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <button @click="$emit('pin', item)" class="relative group/btn p-1.5 border border-gray-100 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer bg-white flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M14.102 2.664c.628-.416 1.692-.713 2.495.09l4.647 4.648c.806.804.508 1.868.091 2.495a2.95 2.95 0 0 1-.863.85c-.334.213-.756.374-1.211.35a9 9 0 0 1-.658-.071l-.068-.01a9 9 0 0 0-.707-.073c-.504-.025-.698.06-.76.12l-2.49 2.491c-.08.08-.18.258-.256.6c-.073.33-.105.736-.113 1.186c-.007.432.008.874.024 1.3l.001.047c.015.423.03.855.009 1.194c-.065 1.031-.868 1.79-1.658 2.141c-.79.35-1.917.437-2.7-.347l-2.25-2.25L3.53 21.53a.75.75 0 1 1-1.06-1.06l4.104-4.105l-2.25-2.25c-.783-.784-.697-1.91-.346-2.7c.35-.79 1.11-1.593 2.14-1.658c.34-.021.772-.006 1.195.009l.047.001c.426.015.868.031 1.3.024c.45-.008.856-.04 1.186-.113c.342-.076.52-.177.6-.257l2.49-2.49c.061-.061.146-.256.12-.76a9 9 0 0 0-.073-.707l-.009-.068a9 9 0 0 1-.071-.658c-.025-.455.136-.877.348-1.211c.216-.34.515-.64.851-.863"/></svg>
                <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0">
                  <div class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                    Pin Announcement
                    <div class="absolute left-1/2 top-full -translate-x-1/2">
                      <div class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                    </div>
                  </div>
                </div>
              </button>
              <button @click="$emit('edit', item)" class="relative group/btn p-1.5 border border-gray-100 text-orange-400 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer bg-white flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0">
                  <div class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                    Edit Announcement
                    <div class="absolute left-1/2 top-full -translate-x-1/2">
                      <div class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                    </div>
                  </div>
                </div>
              </button>
              <button @click="$emit('view', item)" class="relative group/btn p-1.5 border border-gray-100 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer bg-white flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0">
                  <div class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                    View Announcement
                    <div class="absolute left-1/2 top-full -translate-x-1/2">
                      <div class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                    </div>
                  </div>
                </div>
              </button>
              <button @click="$emit('delete', item)" class="relative group/btn p-1.5 border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors cursor-pointer bg-white flex items-center justify-center shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0">
                   <div class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                     Delete Announcement
                     <div class="absolute left-1/2 top-full -translate-x-1/2">
                       <div class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                     </div>
                   </div>
                 </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
    </div>

    <!-- List View -->
    <div v-else class="md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 w-full overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="hidden md:table-header-group bg-gray-50/50">
            <tr>
              <th scope="col" class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider w-[40%]">Title</th>
              <th scope="col" class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider">Category</th>
              <th scope="col" class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider">Date Posted</th>
              <th scope="col" class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider">Status</th>
              <th scope="col" class="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 tracking-wider">Views</th>
              <th scope="col" class="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-500 tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-transparent md:bg-white divide-y divide-gray-100">
            <tr v-if="items.length === 0">
              <td colspan="6" class="text-center py-8 text-gray-500">No announcements found.</td>
            </tr>
            <template v-for="item in items" :key="item.id">
              <tr class="md:table-row flex flex-col md:flex-row bg-gray-50 md:bg-white rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 shadow md:shadow-none hover:bg-gray-50/50 transition-colors duration-150 relative">
                <td class="px-4 py-3 md:py-4 md:px-6 border-b md:border-none md:align-middle">
                  <div class="flex items-center gap-4">
                    <div class="hidden md:flex h-10 w-10 flex-shrink-0 bg-blue-100 text-[#0E4B90] rounded-full flex items-center justify-center font-bold text-sm">
                      SP
                    </div>
                    <div class="flex-grow">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="md:hidden font-semibold text-[#0E4B90] text-xs shrink-0">Title:</span>
                        <div class="text-sm font-bold text-gray-900 md:line-clamp-1 flex-grow">
                          {{ item.title ? item.title.replace(/^Draft\s*-\s*/i, '') : '' }}
                        </div>
                        <span v-if="item.pinned" class="text-red-500 flex-shrink-0" title="Pinned">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                          </svg>
                        </span>
                      </div>
                      <div class="mt-1 md:mt-0">
                        <div class="text-xs text-gray-500 leading-relaxed min-w-0 break-words">
                          {{ item.subtitle ? item.subtitle.replace(/^Draft\s*-\s*/i, '') : '' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap align-middle md:align-middle">
                  <span class="md:hidden font-semibold text-[#0E4B90] mr-2 text-xs">Category:</span>
                  <span class="px-3 py-1 inline-flex items-center gap-1.5 text-xs font-bold rounded-full" :class="getCategoryBadgeClass(item.category)">
                    <span v-html="getCategoryIcon(item.category)"></span>
                    {{ item.category }}
                  </span>
                </td>
                <td class="px-4 py-3 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap text-sm text-gray-500 font-medium align-middle md:align-middle">
                  <span class="md:hidden font-semibold text-[#0E4B90] mr-2 text-xs">Date Posted:</span>
                  <span class="text-xs sm:text-sm">{{ item.datePosted.split(' - ')[0] }}</span>
                </td>
                <td class="px-4 py-3 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap align-middle md:align-middle">
                  <span class="md:hidden font-semibold text-[#0E4B90] mr-2 text-xs">Status:</span>
                  <span class="px-3 py-1 inline-flex text-xs font-bold rounded-full" :class="getStatusBadgeClass(item.status)">
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-4 py-3 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap align-middle md:align-middle">
                  <!-- Action row for mobile replaces Views row -->
                  <div class="md:hidden flex items-center justify-start gap-2 w-full">
                    <span class="font-semibold text-[#0E4B90] text-xs">Action:</span>
                    <div class="flex items-center gap-1">
                      <button @click="$emit('pin', item)" class="p-1.5 border border-gray-100 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer bg-white shadow-sm flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M14.102 2.664c.628-.416 1.692-.713 2.495.09l4.647 4.648c.806.804.508 1.868.091 2.495a2.95 2.95 0 0 1-.863.85c-.334.213-.756.374-1.211.35a9 9 0 0 1-.658-.071l-.068-.01a9 9 0 0 0-.707-.073c-.504-.025-.698.06-.76.12l-2.49 2.491c-.08.08-.18.258-.256.6c-.073.33-.105.736-.113 1.186c-.007.432.008.874.024 1.3l.001.047c.015.423.03.855.009 1.194c-.065 1.031-.868 1.79-1.658 2.141c-.79.35-1.917.437-2.7-.347l-2.25-2.25L3.53 21.53a.75.75 0 1 1-1.06-1.06l4.104-4.105l-2.25-2.25c-.783-.784-.697-1.91-.346-2.7c.35-.79 1.11-1.593 2.14-1.658c.34-.021.772-.006 1.195.009l.047.001c.426.015.868.031 1.3.024c.45-.008.856-.04 1.186-.113c.342-.076.52-.177.6-.257l2.49-2.49c.061-.061.146-.256.12-.76a9 9 0 0 0-.073-.707l-.009-.068a9 9 0 0 1-.071-.658c-.025-.455.136-.877.348-1.211c.216-.34.515-.64.851-.863"/></svg>
                      </button>
                      <button @click="$emit('edit', item)" class="p-1.5 border border-gray-100 text-orange-400 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer bg-white shadow-sm flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button @click="$emit('view', item)" class="p-1.5 border border-gray-100 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer bg-white shadow-sm flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button @click="$emit('delete', item)" class="p-1.5 border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors cursor-pointer bg-white shadow-sm flex items-center justify-center">
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  <!-- Desktop Views (Hidden on Mobile) -->
                  <div class="hidden md:block md:text-center text-sm text-gray-500 font-medium">
                    {{ item.views || 0 }}
                  </div>
                </td>
                <td class="px-4 py-3 md:py-4 md:px-6 whitespace-nowrap align-middle bg-[#F8FAFC] md:bg-transparent">
                  <!-- Metadata row for mobile at the bottom -->
                  <div class="md:hidden flex items-center gap-4 text-gray-400 text-[10px] font-bold">
                    <div class="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                      </svg>
                      <span>{{ item.datePosted.split(' - ')[0] }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="h-3.5 w-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[7px] font-bold">P</div>
                      <span class="truncate max-w-[80px]">{{ item.author || 'Staff Portal' }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{{ item.views || 0 }} views</span>
                    </div>
                  </div>

                  <!-- Desktop Actions (Hidden on Mobile as they moved up) -->
                  <div class="hidden md:flex items-center justify-end gap-1.5">
                     <button @click="$emit('pin', item)" class="relative group/btn p-1.5 border border-gray-100 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer bg-white flex items-center justify-center shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M14.102 2.664c.628-.416 1.692-.713 2.495.09l4.647 4.648c.806.804.508 1.868.091 2.495a2.95 2.95 0 0 1-.863.85c-.334.213-.756.374-1.211.35a9 9 0 0 1-.658-.071l-.068-.01a9 9 0 0 0-.707-.073c-.504-.025-.698.06-.76.12l-2.49 2.491c-.08.08-.18.258-.256.6c-.073.33-.105.736-.113 1.186c-.007.432.008.874.024 1.3l.001.047c.015.423.03.855.009 1.194c-.065 1.031-.868 1.79-1.658 2.141c-.79.35-1.917.437-2.7-.347l-2.25-2.25L3.53 21.53a.75.75 0 1 1-1.06-1.06l4.104-4.105l-2.25-2.25c-.783-.784-.697-1.91-.346-2.7c.35-.79 1.11-1.593 2.14-1.658c.34-.021.772-.006 1.195.009l.047.001c.426.015.868.031 1.3.024c.45-.008.856-.04 1.186-.113c.342-.076.52-.177.6-.257l2.49-2.49c.061-.061.146-.256.12-.76a9 9 0 0 0-.073-.707l-.009-.068a9 9 0 0 1-.071-.658c-.025-.455.136-.877.348-1.211c.216-.34.515-.64.851-.863"/></svg>
                        <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0">
                          <div class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                            Pin Announcement
                            <div class="absolute left-1/2 top-full -translate-x-1/2">
                              <div class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                            </div>
                          </div>
                        </div>
                     </button>
                     <button @click="$emit('edit', item)" class="relative group/btn p-1.5 border border-gray-100 text-orange-400 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer bg-white flex items-center justify-center shadow-sm">
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                       <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0">
                         <div class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                           Edit Announcement
                           <div class="absolute left-1/2 top-full -translate-x-1/2">
                             <div class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                           </div>
                         </div>
                       </div>
                     </button>
                     <button @click="$emit('view', item)" class="relative group/btn p-1.5 border border-gray-100 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer bg-white flex items-center justify-center shadow-sm">
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                       <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0">
                         <div class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                           View Announcement
                           <div class="absolute left-1/2 top-full -translate-x-1/2">
                             <div class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                           </div>
                         </div>
                       </div>
                     </button>
                     <button @click="$emit('delete', item)" class="relative group/btn p-1.5 border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors cursor-pointer bg-white flex items-center justify-center shadow-sm">
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0">
                         <div class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                           Delete Announcement
                           <div class="absolute left-1/2 top-full -translate-x-1/2">
                             <div class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                           </div>
                         </div>
                       </div>
                     </button>
                  </div>
                </td>
            </tr>
          </template>
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
                  ? 'bg-[#0E4B90] text-white shadow-md transform scale-105' 
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
