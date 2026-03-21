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

defineEmits(['prev', 'next', 'go', 'view'])

const getCategoryBadgeClass = (category) => {
  switch (category) {
    case 'Urgent': return 'bg-red-50 text-red-500'
    case 'Maintenance': return 'bg-orange-50 text-orange-500'
    case 'Events': return 'bg-purple-50 text-purple-500'
    case 'General': return 'bg-blue-50 text-blue-500'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Urgent': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`
    case 'Maintenance': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`
    case 'Events': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`
    case 'General': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
    default: return ''
  }
}

const formatDate = (dateString) => {
  if (!dateString || dateString === 'Just now') return 'Just now'
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
  <div class="min-h-[400px]">
    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div v-if="items.length === 0" class="col-span-1 md:col-span-2 lg:col-span-3 py-20 px-4 text-center bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
        <div class="w-20 h-20 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-5 text-[#0E4B90]/20 border border-[#0E4B90]/5 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-[#1D355E] mb-2">No New Updates</h3>
        <p class="text-gray-400 text-sm max-w-sm leading-relaxed">Everything is up to date! There are no new announcements from the property management office at this time.</p>
      </div>
      
      <div
        v-for="item in items"
        :key="item.id"
        @click="$emit('view', item)"
        class="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden cursor-pointer flex flex-col"
      >
        <div class="h-48 bg-gray-100 relative overflow-hidden group/img">
          <!-- Background Image -->
          <img 
            v-if="item.coverImageUrl || item.coverImage"
            :src="item.coverImageUrl || item.coverImage"
            alt="Announcement Cover"
            class="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
          />
          <!-- Placeholder for Image -->
          <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
            <svg class="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          <!-- Hover Overlay -->
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <div class="bg-white/20 border border-white/40 px-4 py-2 rounded-xl backdrop-blur-md transform scale-90 group-hover:scale-100 transition-all duration-500 shadow-2xl flex items-center gap-2">
              <span class="text-white text-xs font-bold tracking-wider">Read Full Details</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </div>
          </div>
        </div>
        
        <div class="p-6 flex-grow flex flex-col">
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-2 flex-wrap">
              <span v-if="item.pinned" class="px-2.5 py-1 inline-flex items-center gap-1.5 text-[10px] font-bold rounded-lg bg-red-100 text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                Pinned
              </span>
              <span class="px-2.5 py-1 inline-flex items-center gap-1.5 text-[10px] font-bold rounded-lg" :class="getCategoryBadgeClass(item.category)">
                <span v-html="getCategoryIcon(item.category)"></span>
                {{ item.category }}
              </span>
            </div>
          </div>

          <h4 class="text-lg font-bold text-[#0E4B90] mb-2 transition-colors leading-tight break-words whitespace-normal">
            {{ item.title }}
          </h4>
          <div class="flex-grow mb-6">
            <p v-if="item.subtitle" class="text-gray-900 text-xs font-bold mb-1 line-clamp-2">
              {{ item.subtitle }}
            </p>
            <!-- <p v-if="item.content" class="text-gray-500 text-[11px] line-clamp-2">
              {{ item.content }}
            </p> -->
          </div>

          <div class="h-px bg-gray-100 w-full mb-4"></div>

          <div class="flex items-center justify-between gap-2 mt-auto">
            <div class="flex flex-col gap-1.5 min-w-0">
              <div class="flex items-center text-gray-500 text-[11px] font-bold gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                </svg>
                <span class="truncate">{{ formatDate(item.publishAt || item.createdAt || item.datePosted || item.date) }}</span>
              </div>
              <div class="flex items-center text-gray-500 text-[11px] font-bold gap-1.5 min-w-0">
                <div class="h-4 w-4 bg-blue-500 text-white rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold">P</div>
                <div class="flex items-center gap-1.5 truncate">
                  <span class="truncate">{{ item.author || 'Staff Portal' }}</span>
                  <span class="text-gray-300 flex-shrink-0">·</span>
                  <div class="flex items-center gap-1 text-gray-400 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{{ item.viewCount || item.views || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#1D355E] group-hover:text-white transition-all duration-300">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View (Resident styled) -->
    <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead class="bg-gray-50/50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider">Announcement</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider">Category</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider">Date</th>
              <th scope="col" class="px-6 py-4 text-center text-xs font-bold text-gray-500 tracking-wider">Views</th>
              <th scope="col" class="px-6 py-4 text-right text-xs font-bold text-gray-500 tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="item in items" :key="'list-' + item.id" class="hover:bg-gray-50/50 transition-colors cursor-pointer group" @click="$emit('view', item)">
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <div class="text-sm font-bold text-[#0E4B90] transition-colors">{{ item.title }}</div>
                  <div class="flex flex-col gap-0.5 mt-1 max-w-md">
                    <div v-if="item.subtitle" class="text-[10px] text-gray-700 font-bold line-clamp-1">{{ item.subtitle }}</div>
                    <div v-if="item.content" class="text-[10px] text-gray-500 line-clamp-1">{{ item.content }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 inline-flex items-center gap-1.5 text-[10px] font-bold rounded-full" :class="getCategoryBadgeClass(item.category)">
                  <span v-html="getCategoryIcon(item.category)"></span>
                  {{ item.category }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-bold">
                {{ formatDate(item.publishAt || item.createdAt || item.datePosted || item.date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-500 font-bold">
                {{ item.viewCount || item.views || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <button class="text-[#0E4B90] hover:text-blue-700 font-bold text-xs">View Details</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination (Reusable style) -->
    <div class="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 sm:justify-end gap-3" v-if="total > 0">
      <div class="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 inline-flex items-center gap-1">
        <button 
          @click="$emit('prev')" 
          :disabled="page === 1"
          class="px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <button
          v-for="p in pages"
          :key="p"
          @click="$emit('go', p)"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer',
            p === page 
              ? 'bg-[#0E2856] text-white shadow-md' 
              : 'text-gray-500 hover:text-[#0E2856] hover:bg-gray-50'
          ]"
        >
          {{ p }}
        </button>

        <button 
          @click="$emit('next')" 
          :disabled="!canNext"
          class="px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
