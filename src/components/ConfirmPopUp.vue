<script setup>
import { computed } from 'vue'
import ButtonWeb from './ButtonWeb.vue'

const props = defineProps({
  title: { type: String, default: 'Confirm' },
  message: { type: String, default: 'Are you sure?' },
  subMessage: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel: { type: String, default: 'Cancel' },
  styleType: { type: String, default: 'red' }, 
})

const emit = defineEmits(['confirm', 'cancel'])

const styleConfig = computed(() => {
  const configs = {
    red: {
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      btnColor: 'red',
    },
    blue: {
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      btnColor: 'blue',
    },
    green: {
      iconBg: 'bg-green-50',
      iconColor: 'text-green-500',
      btnColor: 'green',
    },
    orange: {
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      btnColor: 'orange',
    },
    yellow: {
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      btnColor: 'yellow',
    }
  }
  return configs[props.styleType] || configs.red
})
</script>

<template>
  <Transition name="modal-fade" appear>
    <div class="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[999] p-4" @click="emit('cancel')">
      <div 
        class="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden transform transition-all border border-white/20"
        @click.stop
      >
        <div class="px-8 py-10 text-center relative">
          <div :class="[styleConfig.iconBg, 'absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-50']"></div>
          <div :class="[styleConfig.iconBg, styleConfig.iconColor, 'mx-auto flex items-center justify-center h-20 w-20 rounded-3xl mb-6 relative overflow-hidden group shadow-inner']">
             <svg v-if="styleType === 'red'" xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
             <svg v-else-if="styleType === 'blue'" xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <svg v-else-if="styleType === 'green'" xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
          
          <h2 class="text-2xl font-black text-gray-900 mb-3 tracking-tight">{{ title }}</h2>
          <p class="text-gray-500 text-[15px] font-bold leading-relaxed px-4">
            {{ message }}
          </p>
          <p v-if="subMessage" class="text-[11px] text-gray-400 mt-4 italic font-bold tracking-tight uppercase">{{ subMessage }}</p>
        </div>

        <div class="px-8 py-8 bg-gray-50/50 flex flex-col-reverse sm:flex-row justify-center items-center gap-4 border-t border-gray-100/50">
          <button
            class="w-full sm:w-auto min-w-[120px] px-6 py-3.5 rounded-2xl text-gray-400 font-black hover:text-gray-600 transition-all duration-300 cursor-pointer"
            @click="emit('cancel')"
          >
            {{ cancelLabel }}
          </button>
          <ButtonWeb
            :label="confirmLabel"
            :color="styleConfig.btnColor"
            class="w-full sm:flex-1 px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl font-black transition-all duration-300 transform hover:-translate-y-1 active:scale-95 text-base"
            @click="emit('confirm')"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .bg-white,
.modal-fade-leave-active .bg-white {
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from .bg-white,
.modal-fade-leave-to .bg-white {
  transform: scale(0.9) translateY(30px);
}
</style>
