<script setup>
import { computed, ref } from 'vue'
import ButtonWeb from './ButtonWeb.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: false,
    default: ''
  },
  content: {
    type: String,
    required: true
  },
  tag: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: false,
    default: 'Staff Portal'
  },
  views: {
    type: Number,
    required: false,
    default: 0
  },
  status: {
    type: String,
    required: false,
  },
  pinned: {
    type: Boolean,
    required: false,
    default: false
  },
  coverImage: {
    type: String,
    required: false,
    default: null
  }
})

const emit = defineEmits(['close'])
const isLightboxOpen = ref(false)

const closeModal = () => {
  emit('close')
}

const toggleLightbox = () => {
  if (props.coverImage) {
    isLightboxOpen.value = !isLightboxOpen.value
  }
}

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
  const s = status?.toUpperCase()
  if (s === 'PUBLISHED') return 'bg-green-100 text-green-800'
  if (s === 'DRAFT') return 'bg-orange-100 text-orange-800'
  return 'bg-gray-100 text-gray-800'
}

const formatStatus = (status) => {
  if (!status) return ''
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
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
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6" @click.self="closeModal">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden transform transition-all flex flex-col max-h-[95vh] relative">
  
      <div class="absolute top-4 right-4 z-[110]">
        <button @click="closeModal" class="p-2 bg-gray-100/80 hover:bg-gray-200 text-gray-700 rounded-full transition-all cursor-pointer shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>


      <div class="p-5 sm:p-8 overflow-y-auto custom-scrollbar flex-grow">
        
         <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="h-12 w-12 flex-shrink-0 bg-blue-100 text-[#185DC0] rounded-full flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">
                {{ author.substring(0, 2).toUpperCase() }}
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-gray-900 leading-tight text-lg">{{ author }}</span>
                <span class="text-xs text-gray-500 font-medium">Posted on {{ formatDate(date) }}</span>
              </div>
            </div>
            <div class="hidden sm:flex items-center text-gray-400 text-sm font-medium gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {{ views }} views
            </div>
         </div>

        <div class="flex flex-wrap items-center gap-2.5 mb-6">
          <span class="px-3 py-1 inline-flex items-center gap-1.5 text-[11px] font-bold rounded-xl" :class="getCategoryBadgeClass(tag)">
            <span v-html="getCategoryIcon(tag)"></span>
            {{ tag }}
          </span>
          <div v-if="pinned" class="p-1 px-2 bg-red-50 text-red-500 rounded-lg flex items-center gap-1 text-[11px] font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            Pinned
          </div>
          <span v-if="status" class="px-3 py-1 inline-flex items-center text-[11px] font-bold rounded-xl" :class="getStatusBadgeClass(status)">
            {{ formatStatus(status) }}
          </span>
        </div>
        
        <h2 class="text-2xl sm:text-4xl font-extrabold text-[#0E4B90] mb-3 leading-tight tracking-tight">{{ title?.replace(/^Draft\s*-\s*/i, '') }}</h2>
        <p v-if="subtitle" class="text-lg font-bold text-gray-700 mb-6 leading-relaxed">{{ subtitle?.replace(/^Draft\s*-\s*/i, '') }}</p>
        
        <div class="prose prose-blue max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap mb-8 text-lg">
          <p>{{ content?.replace(/^Draft\s*-\s*/i, '') || content }}</p>
          <slot></slot>
        </div>

        <div v-if="coverImage" class="mb-8 group relative cursor-zoom-in rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm transition-all hover:shadow-md" @click="toggleLightbox">
            <img 
              :src="coverImage"
              alt="Announcement Image"
              class="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
               <div class="bg-black/50 text-white rounded-full p-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
               </div>
            </div>
        </div>

        <div class="h-px bg-gray-100 w-full"></div>
      </div>
      

      <div class="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
        <ButtonWeb 
          label="Close" 
          color="gray" 
          size="md" 
          class="hover:opacity-90 hover:bg-white rounded-2xl shadow-sm transition-all font-bold px-12 text-gray-600 border border-gray-200"
          @click="closeModal" 
        />
      </div>
    </div>


    <Transition name="fade">
      <div v-if="isLightboxOpen" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 sm:p-10" @click="toggleLightbox">
          <button class="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2 cursor-pointer z-[210]">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <img 
            :src="coverImage" 
            class="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in duration-300"
            alt="Full Image"
            @click.stop
          />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-in {
  animation-duration: 300ms;
  animation-fill-mode: both;
}
@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.zoom-in {
  animation-name: zoomIn;
}
</style>

