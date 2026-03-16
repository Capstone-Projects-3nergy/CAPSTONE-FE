<script setup>
import { computed } from 'vue'
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
    default: 'PUBLISHED'
  },
  pinned: {
    type: Boolean,
    required: false,
    default: false
  }
})

const emit = defineEmits(['close'])

const closeModal = () => {
  emit('close')
}

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
    case 'PUBLISHED':
    case 'Published': return 'bg-green-100 text-green-800'
    case 'DRAFT':
    case 'Draft': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Urgent': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>`
    case 'Maintenance': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>`
    case 'Events': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" /></svg>`
    case 'General': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>`
    default: return ''
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6" @click.self="closeModal">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
      <!-- Header Image Placeholder, adjust if you have actual image data later -->
      <div class="h-48 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200 relative shrink-0">
        <div class="absolute top-4 right-4 z-10">
          <button @click="closeModal" class="p-2 bg-white/50 hover:bg-white text-gray-700 rounded-full backdrop-blur-md transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="absolute inset-0 flex items-center justify-center text-gray-300">
           <svg class="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>
        </div>
      </div>
      
      <!-- Content Area -->
      <div class="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
        <div class="flex flex-wrap items-center gap-3 mb-6">
          <span class="px-3 py-1 inline-flex items-center gap-1.5 text-[11px] font-bold rounded-xl" :class="getCategoryBadgeClass(tag)">
            <span v-html="getCategoryIcon(tag)"></span>
            {{ tag }}
          </span>
          <span class="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-lg" :class="getStatusBadgeClass(status)">
            {{ status }}
          </span>
          <div v-if="pinned" class="p-1 px-2 bg-red-50 text-red-500 rounded-lg flex items-center gap-1 text-[11px] font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            PINNED
          </div>
          <div class="flex items-center text-gray-500 text-sm font-medium gap-1.5 ml-auto">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {{ views }}
          </div>
        </div>
        
        <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">{{ title }}</h2>
        <p v-if="subtitle" class="text-lg font-medium text-gray-700 mb-6">{{ subtitle }}</p>
        
        <div class="prose prose-blue max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap mb-8">
          <p>{{ content }}</p>
          <slot></slot>
        </div>

        <div class="h-px bg-gray-100 w-full mb-6"></div>

        <!-- Author & Date Box -->
        <div class="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div class="h-12 w-12 flex-shrink-0 bg-blue-100 text-[#185DC0] rounded-full flex items-center justify-center font-bold text-lg">
            {{ author.substring(0, 2).toUpperCase() }}
          </div>
          <div class="flex flex-col">
            <span class="font-bold text-gray-900">{{ author }}</span>
            <div class="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
              Posted on {{ date.split(' - ')[0] }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
        <ButtonWeb 
          label="Close" 
          color="gray" 
          size="md" 
          class="hover:opacity-90 hover:bg-gray-100 rounded-2xl shadow-sm transition-all font-bold px-8 text-gray-600"
          @click="closeModal" 
        />
      </div>
    </div>
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
</style>

