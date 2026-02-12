<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: Boolean,
  notification: Object
})

const emit = defineEmits(['close'])

const badgeClass = (type) => {
  const ACCOUNT_TYPES = ['message']
  const PARCEL_TYPES = ['new', 'comment', 'connect']
  if (ACCOUNT_TYPES.includes(type)) return 'bg-green-500'
  if (PARCEL_TYPES.includes(type)) return 'bg-blue-500'
  return 'bg-gray-400'
}

const badgeIcon = (type) => {
  if (type === 'message') {
    return `
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 8H4C3.46957 8 2.96086 8.21071 2.58579 8.58579C2.21071 8.96086 2 9.46957 2 10V14C2 14.5304 2.21071 15.0391 2.58579 15.4142C2.96086 15.7893 3.46957 16 4 16H5V20C5 20.2652 5.10536 20.5196 5.29289 20.7071C5.48043 20.8946 5.73478 21 6 21H8C8.26522 21 8.51957 20.8946 8.70711 20.7071C8.89464 20.5196 9 20.2652 9 20V16H12L17 20V4L12 8ZM21.5 12C21.5 13.71 20.54 15.26 19 16V8C20.53 8.75 21.5 10.3 21.5 12Z"
         fill="white"
        />
      </svg>
    `
  }

  // parcel / notification
  return `
    <svg
      width="25"
      height="25"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.9676 2.61776C13.0264 2.23614 11.9735 2.23614 11.0322 2.61776L8.75096 3.54276L18.7426 7.42818L22.2572 6.07089C22.1127 5.95203 21.9512 5.85547 21.778 5.78443L13.9676 2.61776ZM22.9166 7.49068L13.2812 11.2136V22.5917C13.5145 22.5445 13.7433 22.4754 13.9676 22.3844L21.778 19.2178C22.1145 19.0815 22.4026 18.8479 22.6054 18.5469C22.8082 18.2459 22.9166 17.8912 22.9166 17.5282V7.49068ZM11.7187 22.5917V11.2136L2.08325 7.49068V17.5292C2.08346 17.892 2.19191 18.2465 2.39474 18.5473C2.59756 18.8481 2.88553 19.0816 3.22179 19.2178L11.0322 22.3844C11.2565 22.4747 11.4853 22.5431 11.7187 22.5917ZM2.74263 6.07089L12.4999 9.84068L16.5801 8.2636L6.6395 4.39901L3.22179 5.78443C3.04402 5.85665 2.88429 5.95214 2.74263 6.07089Z"
        fill="white"
      />
    </svg>
  `
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
    <div class="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity" @click="$emit('close')"></div>
    
    <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl transform transition-all p-6 sm:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <!-- Decor -->
      <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50/80 to-transparent rounded-bl-full -z-0 pointer-events-none"></div>

      <button @click="$emit('close')" class="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10">
        <svg class="w-5 h-5 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div v-if="notification" class="relative z-10">
        <div class="flex items-center gap-4 mb-6">
           <div class="relative">
              <div 
                class="absolute inset-0 bg-current opacity-10 rounded-2xl blur-sm"
                :class="notification.type === 'message' ? 'text-green-500' : 'text-blue-500'"
              ></div>
              <span
                class="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white shadow-sm relative z-10"
                :class="badgeClass(notification.type)"
                v-html="badgeIcon(notification.type)"
              />
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                {{ notification.type }}
              </p>
              <h3 class="text-xl font-bold text-gray-900 leading-tight">
                {{ notification.label }}
              </h3>
            </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center gap-2 text-sm text-gray-500">
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <span>{{ notification.time }}</span>
             <span 
               v-if="notification.status" 
               class="ml-auto text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md transition-colors"
               :class="notification.status === 'READ' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600'"
             >
               {{ notification.status }}
             </span>
          </div>
          
          <div class="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-gray-700 leading-relaxed text-sm">
             {{ notification.title }}
             
             <div v-if="notification.parcelId" class="mt-4 pt-4 border-t border-gray-200">
                <button class="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1">
                  View Parcel Details 
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </button>
             </div>

             <br v-if="notification.type === 'new'" /><br v-if="notification.type === 'new'" />
             <span v-if="notification.type === 'new'" class="italic text-gray-400 text-xs">
               Please check with the office for your parcel.
             </span>
          </div>

          <div class="flex justify-between items-center pt-2">
             <div class="flex items-center gap-2" v-if="notification.user">
                <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                  {{ notification.user.charAt(0) }}
                </div>
                <span class="text-sm font-medium text-gray-900">{{ notification.user }}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
