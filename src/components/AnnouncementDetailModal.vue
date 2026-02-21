<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
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
  }
})

const emit = defineEmits(['close'])

const closeModal = () => {
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6" @click.self="closeModal">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden transform transition-all flex flex-col max-h-full">
      <!-- Header Image Placeholder, adjust if you have actual image data later -->
      <div class="h-48 sm:h-64 bg-gray-100 relative shrink-0">
        <div class="absolute top-4 right-4 z-10">
          <button @click="closeModal" class="p-2 bg-white/50 hover:bg-white text-gray-700 rounded-full backdrop-blur-md transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="absolute inset-0 flex items-center justify-center text-gray-300">
           <svg class="w-16 h-16 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>
        </div>
      </div>
      
      <!-- Content Area -->
      <div class="p-6 sm:p-8 overflow-y-auto">
        <div class="flex items-center gap-3 mb-4 flex-wrap">
          <span class="text-xs font-semibold text-[#0E4B90] bg-blue-50 px-3 py-1 rounded-md">{{ tag }}</span>
          <span class="text-sm font-medium text-gray-500">{{ date }}</span>
        </div>
        
        <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6 leading-tight">{{ title }}</h2>
        
        <div class="prose prose-blue max-w-none text-gray-600 leading-relaxed">
          <p>{{ content }}</p>
          <slot></slot>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="p-6 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
        <button @click="closeModal" class="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors focus:ring-2 focus:ring-[#0E4B90]/20 focus:outline-none cursor-pointer">
          Close
        </button>
      </div>
    </div>
  </div>
</template>
