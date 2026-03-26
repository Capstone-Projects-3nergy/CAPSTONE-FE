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
    case 'Urgent': return 'bg-red-50 text-red-500'
    case 'Maintenance': return 'bg-orange-50 text-orange-500'
    case 'Events': return 'bg-purple-50 text-purple-500'
    case 'General': return 'bg-blue-50 text-blue-500'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'PUBLISHED': return 'bg-green-50 text-green-600'
    case 'DRAFT': return 'bg-orange-50 text-orange-600'
    default: return 'bg-gray-50 text-gray-600'
  }
}

const formatText = (text) => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

const formatStatus = (status) => formatText(status)
const formatCategory = (category) => formatText(category)

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Urgent': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`
    case 'Maintenance': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`
    case 'Events': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`
    case 'General': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
  }
}

const formatDate = (dateString) => {
  if (!dateString || dateString === 'Just now') return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} - ${hours}:${minutes}`
}
</script>

<template>
  <div>
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="items.length === 0" class="col-span-1 md:col-span-2 lg:col-span-3 py-16 px-4 text-center bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
        <div class="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-800 mb-1">No Announcements Yet</h3>
        <p class="text-gray-400 text-sm max-w-xs mx-auto">There are no announcements to display right now. Check back later for updates.</p>
      </div>
      
      <template v-for="item in items" :key="item.id">
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 flex flex-col group relative">
          <div class="h-48 bg-gray-100 relative overflow-hidden">
            <img 
              v-if="item.coverImageUrl || item.coverImage"
              :src="item.coverImageUrl || item.coverImage"
              alt="Announcement Cover"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
              <svg class="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

        <div class="p-4 sm:p-5 flex-grow flex flex-col">
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-2 w-full flex-wrap">
              <div class="flex items-center gap-2 flex-wrap">
                <span v-if="item.pinned" class="px-2.5 py-1 inline-flex items-center gap-1.5 text-xs font-bold rounded-lg bg-red-100 text-red-600 shadow-sm" title="Pinned">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  Pinned
                </span>

                <span class="px-2.5 py-1 inline-flex items-center gap-1.5 text-xs font-bold rounded-lg" :class="getCategoryBadgeClass(item.category)">
                  <span v-html="getCategoryIcon(item.category)"></span>
                  {{ formatCategory(item.category) }}
                </span>

                <span class="px-2.5 py-1 inline-flex items-center text-xs leading-5 font-bold rounded-lg" :class="getStatusBadgeClass(item.status)">
                  {{ formatStatus(item.status) }}
                </span>
              </div>
            </div>
          </div>
          
          <h3 class="font-bold text-[#0E4B90] text-base mb-2 break-words whitespace-normal leading-tight transition-colors">
            {{ item.title ? item.title.replace(/^Draft\s*-\s*/i, '') : '' }}
          </h3> 
          <div class="flex-grow mb-6 overflow-hidden">
            <p v-if="item.subtitle" class="text-xs text-gray-800 font-bold mb-1 leading-relaxed line-clamp-2">
              {{ item.subtitle.replace(/^Draft\s*-\s*/i, '') }}
            </p>
            <p v-if="item.content" class="text-[11px] text-gray-500 leading-relaxed line-clamp-3">
              {{ item.content.replace(/^Draft\s*-\s*/i, '') }}
            </p>
          </div>

        
          <div class="h-px bg-gray-100 w-full mb-4"></div>
          <div class="flex items-center justify-between gap-0.5 sm:gap-1 mt-auto min-w-0">
            <div class="flex flex-row items-center gap-1 text-gray-400 text-[8px] font-bold min-w-0 flex-1 overflow-hidden">
                <div class="flex items-center gap-0.5 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                  </svg>
                  <span class="whitespace-nowrap">{{ formatDate(item.publishAt) }}</span>
                </div>
                <div class="flex items-center gap-0.5 min-w-0">
                  <div class="h-2.5 w-2.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[5px] font-black flex-shrink-0">P</div>
                  <span class="truncate max-w-[60px] sm:max-w-[70px]">{{ item.author || 'Staff Portal' }}</span>
                </div>
                <div class="flex items-center gap-0.5 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{{ item.viewCount || item.views || 0 }}</span>
                </div>
            </div>
            <div class="flex items-center gap-0.5 flex-shrink-0">
              <button @click="$emit('pin', item)" 
                :class="[
                  'relative group/btn p-0.5 sm:p-1 border border-gray-50 rounded transition-colors cursor-pointer flex items-center justify-center shadow-sm flex-shrink-0',
                  item.pinned ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-400 bg-white hover:bg-red-50 hover:text-red-600'
                ]"
                :title="item.pinned ? 'Unpin Announcement' : 'Pin Announcement'">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M14.102 2.664c.628-.416 1.692-.713 2.495.09l4.647 4.648c.806.804.508 1.868.091 2.495a2.95 2.95 0 0 1-.863.85c-.334.213-.756.374-1.211.35a9 9 0 0 1-.658-.071l-.068-.01a9 9 0 0 0-.707-.073c-.504-.025-.698.06-.76.12l-2.49 2.491c-.08.08-.18.258-.256.6c-.073.33-.105.736-.113 1.186c-.007.432.008.874.024 1.3l.001.047c.015.423.03.855.009 1.194c-.065 1.031-.868 1.79-1.658 2.141c-.79.35-1.917.437-2.7-.347l-2.25-2.25L3.53 21.53a.75.75 0 1 1-1.06-1.06l4.104-4.105l-2.25-2.25c-.783-.784-.697-1.91-.346-2.7c.35-.79 1.11-1.593 2.14-1.658c.34-.021.772-.006 1.195.009l.047.001c.426.015.868.031 1.3.024c.45-.008.856-.04 1.186-.113c.342-.076.52-.177.6-.257l2.49-2.49c.061-.061.146-.256.12-.76a9 9 0 0 0-.073-.707l-.009-.068a9 9 0 0 1-.071-.658c-.025-.455.136-.877.348-1.211c.216-.34.515-.64.851-.863"/></svg>
                <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0">
                  <div class="relative rounded bg-gray-400 min-w-[100px] px-2 py-1 text-[10px] font-medium text-white text-center shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                    {{ item.pinned ? 'Unpin' : 'Pin' }}
                    <div class="absolute left-1/2 top-full -translate-x-1/2">
                      <div class="mx-auto h-0 w-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                    </div>
                  </div>
                </div>
              </button>
              <button @click="$emit('edit', item)" class="relative group/btn p-0.5 sm:p-1 border border-gray-50 text-slate-500 hover:text-orange-400 hover:bg-orange-50 rounded transition-colors cursor-pointer bg-white flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0">
                  <div class="relative rounded bg-gray-400 min-w-[100px] px-2 py-1 text-[10px] font-medium text-white text-center shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                    Edit
                    <div class="absolute left-1/2 top-full -translate-x-1/2">
                      <div class="mx-auto h-0 w-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                    </div>
                  </div>
                </div>
              </button>
              <button @click="$emit('view', item)" class="relative group/btn p-0.5 sm:p-1 border border-gray-50 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors cursor-pointer bg-white flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0">
                  <div class="relative rounded bg-gray-400 min-w-[100px] px-2 py-1 text-[10px] font-medium text-white text-center shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                    View
                    <div class="absolute left-1/2 top-full -translate-x-1/2">
                      <div class="mx-auto h-0 w-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                    </div>
                  </div>
                </div>
              </button>
              <button @click="$emit('delete', item)" class="relative group/btn p-0.5 sm:p-1 border border-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded transition-colors cursor-pointer bg-white flex items-center justify-center shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0">
                   <div class="relative rounded bg-gray-400 min-w-[100px] px-2 py-1 text-[10px] font-medium text-white text-center shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                     Delete
                     <div class="absolute left-1/2 top-full -translate-x-1/2">
                       <div class="mx-auto h-0 w-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-400"></div>
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

    <div v-else class="md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 w-full overflow-visible shrink-table-wrapper">
      <div class="w-full overflow-visible">
        <table class="w-full divide-y divide-gray-200">
          <thead class="hidden md:table-header-group bg-gray-50/50">
            <tr>
              <th scope="col" class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider w-[40%]">Title</th>
              <th scope="col" class="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 tracking-wider">
                <div class="inline-flex items-center justify-center gap-1">
                  <div class="w-[18px] invisible"></div>
                  Category
                  <div class="w-[18px] flex justify-center transition-transform duration-200 ease-out hover:scale-110">
                    <slot name="sort-category"></slot>
                  </div>
                </div>
              </th>

              <th scope="col" class="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 tracking-wider">
                <div class="inline-flex items-center justify-center gap-1">
                  <div class="w-[18px] invisible"></div>
                  Status
                  <div class="w-[18px] flex justify-center transition-transform duration-200 ease-out hover:scale-110">
                    <slot name="sort-status"></slot>
                  </div>
                </div>
              </th>
              <th scope="col" class="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 tracking-wider">
                <div class="inline-flex items-center justify-center gap-1">
                  <div class="w-[18px] invisible"></div>
                  Published Date
                  <div class="w-[18px] flex justify-center transition-transform duration-200 ease-out hover:scale-110">
                    <slot name="sort-date"></slot>
                  </div>
                </div>
              </th>
              <th scope="col" class="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 tracking-wider">Views</th>
              <th scope="col" class="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-transparent md:bg-white divide-y divide-gray-100">
            <tr v-if="items.length === 0">
              <td colspan="6" class="text-center py-16">
                <div class="flex flex-col items-center justify-center">
                  <div class="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14.5 2 14.5 8 20 8"></polyline>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                  </div>
                  <span class="text-gray-500 font-bold">No announcements found</span>
                  <span class="text-gray-400 text-xs mt-1">Try adjusting your filters to find what you're looking for.</span>
                </div>
              </td>
            </tr>
            <template v-for="item in items" :key="item.id">
              <tr class="md:table-row flex flex-col md:flex-row bg-gray-50 md:bg-white rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 shadow md:shadow-none hover:bg-gray-50/50 transition-colors duration-150 relative">
                <td class="px-4 py-3 md:py-4 md:px-6 border-b md:border-none md:align-middle">
                  <div class="flex items-center gap-4">
                    <div class="flex-grow">
                       <div class="flex items-start gap-2 mb-2">
                        <span class="md:hidden font-semibold text-[#0E4B90]  text-xs shrink-0">Title:</span>
                        <div class="text-sm font-bold md:text-[#0E4B90] flex-grow break-words whitespace-normal transition-colors">
                          {{ item.title ? item.title.replace(/^Draft\s*-\s*/i, '') : '' }}
                        </div>
                        <span v-if="item.pinned" class="text-red-500 flex-shrink-0" title="Pinned">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                          </svg>
                        </span>
                      </div>
                      <div class="mt-1 md:mt-0 flex flex-col gap-0.5 max-w-sm sm:max-w-md">
                        <div v-if="item.subtitle" class="text-[10px] text-gray-700 font-bold leading-relaxed min-w-0 break-words line-clamp-1">
                          {{ item.subtitle.replace(/^Draft\s*-\s*/i, '') }}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap align-middle md:text-center md:align-middle">
                  <span class="md:hidden font-semibold text-[#0E4B90] mr-2 text-xs">Category:</span>
                  <span class="px-3 py-1 inline-flex items-center gap-1.5 text-xs font-bold rounded-full" :class="getCategoryBadgeClass(item.category)">
                    <span v-html="getCategoryIcon(item.category)"></span>
                    {{ formatCategory(item.category) }}
                  </span>
                </td>

                <td class="px-4 py-3 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap align-middle md:text-center md:align-middle">
                  <span class="md:hidden font-semibold text-[#0E4B90] mr-2 text-xs">Status:</span>
                  <span class="px-3 py-1 inline-flex text-xs font-bold rounded-full" :class="getStatusBadgeClass(item.status)">
                    {{ formatStatus(item.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap align-middle md:text-center md:align-middle">
                  <span class="md:hidden font-semibold text-[#0E4B90] mr-2 text-xs">Published:</span>
                  <span class="text-xs text-gray-600 font-medium">
                    {{ formatDate(item.publishAt) }}
                  </span>
                </td>
                <td class="px-4 py-3 md:py-4 md:px-6 border-b md:border-none whitespace-nowrap align-middle md:align-middle">
                  <div class="md:hidden flex items-center justify-start gap-2 w-full">
                    <span class="font-semibold text-[#0E4B90] text-xs">Action:</span>
                    <div class="flex items-center gap-1">
                      <button @click="$emit('pin', item)" 
                        :class="[
                          'p-1.5 border border-gray-100 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center',
                          item.pinned ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-400 bg-white hover:bg-red-50 hover:text-red-600'
                        ]"
                        :title="item.pinned ? 'Unpin' : 'Pin'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M14.102 2.664c.628-.416 1.692-.713 2.495.09l4.647 4.648c.806.804.508 1.868.091 2.495a2.95 2.95 0 0 1-.863.85c-.334.213-.756.374-1.211.35a9 9 0 0 1-.658-.071l-.068-.01a9 9 0 0 0-.707-.073c-.504-.025-.698.06-.76.12l-2.49 2.491c-.08.08-.18.258-.256.6c-.073.33-.105.736-.113 1.186c-.007.432.008.874.024 1.3l.001.047c.015.423.03.855.009 1.194c-.065 1.031-.868 1.79-1.658 2.141c-.79.35-1.917.437-2.7-.347l-2.25-2.25L3.53 21.53a.75.75 0 1 1-1.06-1.06l4.104-4.105l-2.25-2.25c-.783-.784-.697-1.91-.346-2.7c.35-.79 1.11-1.593 2.14-1.658c.34-.021.772-.006 1.195.009l.047.001c.426.015.868.031 1.3.024c.45-.008.856-.04 1.186-.113c.342-.076.52-.177.6-.257l2.49-2.49c.061-.061.146-.256.12-.76a9 9 0 0 0-.073-.707l-.009-.068a9 9 0 0 1-.071-.658c-.025-.455.136-.877.348-1.211c.216-.34.515-.64.851-.863"/></svg>
                      </button>
                      <button @click="$emit('edit', item)" class="p-1.5 border border-gray-100 text-slate-500 hover:text-orange-400 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer bg-white shadow-sm flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button @click="$emit('view', item)" class="p-1.5 border border-gray-100 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer bg-white shadow-sm flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button @click="$emit('delete', item)" class="p-1.5 border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors cursor-pointer bg-white shadow-sm flex items-center justify-center">
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  <div class="hidden md:block md:text-center text-sm text-gray-500 font-medium">
                    {{ item.viewCount || item.views || 0 }}
                  </div>
                </td>
                <td class="px-4 py-3 md:py-4 md:px-6 whitespace-nowrap align-middle bg-[#F8FAFC] md:bg-transparent">
                  <div class="md:hidden flex items-center gap-4 text-gray-400 text-[10px] font-bold">
                    <div class="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                      </svg>
                      <span>{{ formatDate(item.publishAt) }}</span>
                    </div>
                    <div class="flex items-center gap-1 min-w-0">
                      <div class="h-3.5 w-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[7px] font-bold flex-shrink-0">P</div>
                      <span class="truncate max-w-[100px]">{{ item.author || 'Staff Portal' }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{{ item.viewCount || item.views || 0 }} views</span>
                    </div>
                  </div>

                  <div class="hidden md:flex items-center justify-center gap-1.5">
                     <button @click="$emit('pin', item)" 
                        :class="[
                          'relative group/btn p-1.5 border border-gray-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center shadow-sm',
                          item.pinned ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-400 bg-white hover:bg-red-50 hover:text-red-600'
                        ]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M14.102 2.664c.628-.416 1.692-.713 2.495.09l4.647 4.648c.806.804.508 1.868.091 2.495a2.95 2.95 0 0 1-.863.85c-.334.213-.756.374-1.211.35a9 9 0 0 1-.658-.071l-.068-.01a9 9 0 0 0-.707-.073c-.504-.025-.698.06-.76.12l-2.49 2.491c-.08.08-.18.258-.256.6c-.073.33-.105.736-.113 1.186c-.007.432.008.874.024 1.3l.001.047c.015.423.03.855.009 1.194c-.065 1.031-.868 1.79-1.658 2.141c-.79.35-1.917.437-2.7-.347l-2.25-2.25L3.53 21.53a.75.75 0 1 1-1.06-1.06l4.104-4.105l-2.25-2.25c-.783-.784-.697-1.91-.346-2.7c.35-.79 1.11-1.593 2.14-1.658c.34-.021.772-.006 1.195.009l.047.001c.426.015.868.031 1.3.024c.45-.008.856-.04 1.186-.113c.342-.076.52-.177.6-.257l2.49-2.49c.061-.061.146-.256.12-.76a9 9 0 0 0-.073-.707l-.009-.068a9 9 0 0 1-.071-.658c-.025-.455.136-.877.348-1.211c.216-.34.515-.64.851-.863"/></svg>
                        <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0">
                          <div class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                            {{ item.pinned ? 'Unpin Announcement' : 'Pin Announcement' }}
                            <div class="absolute left-1/2 top-full -translate-x-1/2">
                              <div class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                            </div>
                          </div>
                        </div>
                     </button>
                     <button @click="$emit('edit', item)" class="relative group/btn p-1.5 border border-gray-100 text-slate-500 hover:text-orange-400 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer bg-white flex items-center justify-center shadow-sm">
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
                     <button @click="$emit('view', item)" class="relative group/btn p-1.5 border border-gray-100 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer bg-white flex items-center justify-center shadow-sm">
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
    
    <div class="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 sm:justify-end gap-3" v-if="total > 0">
        <div class="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 inline-flex items-center gap-1 w-full sm:w-auto justify-center">
            <button 
              @click="$emit('prev')" 
              :disabled="page === 1"
              class="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
            >Previous</button>

            <template v-for="(p, index) in pages" :key="index">
              <button
                v-if="p !== '...'"
                @click="$emit('go', p)"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer',
                  p === page 
                    ? 'bg-[#0E2856] text-white shadow-md transform scale-105' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                ]"
              >
                {{ p }}
              </button>
              <span 
                v-else
                class="px-3 py-2 text-sm font-semibold text-gray-400 select-none"
              >
                ...
              </span>
            </template>

            <button 
              @click="$emit('next')" 
              :disabled="!canNext"
              class="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
            >Next</button>
        </div>
    </div>
  </div>
</template>

<style scoped>
@media (min-width: 768px) {
  .shrink-table-wrapper table th {
    font-size: 11px !important;
    padding: 10px 8px !important;
    white-space: normal !important;
    word-break: break-word;
  }
  .shrink-table-wrapper table td {
    font-size: 11px !important;
    padding: 10px 8px !important;
    white-space: normal !important;
    word-break: break-word;
  }
  .shrink-table-wrapper table td span.text-xs,
  .shrink-table-wrapper table td span.text-sm,
  .shrink-table-wrapper table md\:text-sm {
    font-size: 11px !important;
  }
}


.shrink-table-wrapper table td .pointer-events-none > div.bg-gray-400 {
  white-space: nowrap !important;
  word-break: normal !important;
  min-width: max-content !important;
  width: max-content !important;
  padding: 4px 8px !important;
  font-size: 10px !important;
}
</style>
