<script setup>
import { computed } from 'vue'

const props = defineProps({
  announcementData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const announcement = computed(() => props.announcementData || {})

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
    case 'Published': return 'bg-green-100 text-green-800'
    case 'Draft': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const closeModal = () => {
  emit('close')
}
</script>

<template>
  <Transition name="modal-fade" appear>
    <div
      class="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[60] p-4 md:p-6"
      @click="closeModal"
    >
      <div
        class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 class="text-xl font-bold text-gray-800 px-2 border-l-4 border-[#185DC0]">
            Announcement Details
          </h2>
          <button @click="closeModal" class="p-2 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-6 overflow-y-auto flex-1 custom-scrollbar">
          <!-- Featured Image Placeholder -->
          <div class="w-full h-48 sm:h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl mb-6 relative overflow-hidden flex items-center justify-center border border-gray-100">
            <div class="absolute inset-0 bg-[#0E4B90]/5"></div>
            <svg class="w-16 h-16 text-[#185DC0]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 00-2-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          <div class="flex items-start justify-between gap-4 mb-4">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              {{ announcement.title }}
            </h1>
            <span v-if="announcement.pinned" class="flex-shrink-0 p-2 bg-pink-50 text-pink-500 rounded-lg" title="Pinned">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            </span>
          </div>

          <!-- Metadata row -->
          <div class="flex flex-wrap items-center gap-3 mb-6">
            <span class="px-3 py-1 inline-flex text-xs font-bold rounded-xl" :class="getCategoryBadgeClass(announcement.category)">
              {{ announcement.category }}
            </span>
            <span class="px-3 py-1 inline-flex text-xs font-bold rounded-xl" :class="getStatusBadgeClass(announcement.status)">
              {{ announcement.status }}
            </span>
            <div class="flex items-center text-gray-500 text-sm font-medium gap-1.5 ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {{ announcement.views || 0 }} Views
            </div>
          </div>

          <!-- Content section -->
          <div class="prose max-w-none text-gray-700 leading-relaxed mb-8">
            <p class="whitespace-pre-line text-[15px]">{{ announcement.subtitle }}</p>
          </div>
          
          <div class="h-px bg-gray-100 w-full mb-6"></div>

          <!-- Author Info -->
          <div class="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-blue-100 transition-colors">
            <div class="h-12 w-12 flex-shrink-0 bg-blue-100 text-[#185DC0] rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
              SP
            </div>
            <div class="flex flex-col">
              <span class="font-bold text-gray-900">{{ announcement.author || 'Staff Portal' }}</span>
              <div class="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                </svg>
                Posted on {{ announcement.datePosted }}
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end">
          <button
            @click="closeModal"
            class="px-6 py-2.5 bg-[#1D355E] hover:bg-[#185DC0] text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-blue-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active > div,
.modal-fade-leave-active > div {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from > div,
.modal-fade-leave-to > div {
  transform: scale(0.95) translateY(10px);
}

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
