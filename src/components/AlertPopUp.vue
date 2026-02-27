<script setup>
import { computed } from 'vue'

const props = defineProps({
  titles: String,
  message: String,
  styleType: {
    type: String,
    validator(value) {
      return ['green', 'red', 'yellow', 'blue'].includes(value)
    }
  },
  operate: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['closePopUp'])

const config = computed(() => {
  const configs = {
    green: {
      base: 'bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-200/50',
      icon: 'text-emerald-500',
      close: 'hover:bg-emerald-100 text-emerald-400',
      progress: 'bg-emerald-500'
    },
    red: {
      base: 'bg-rose-50/95 border-rose-200 text-rose-900 shadow-rose-200/50',
      icon: 'text-rose-500',
      close: 'hover:bg-rose-100 text-rose-400',
      progress: 'bg-rose-500'
    },
    yellow: {
      base: 'bg-amber-50/95 border-amber-200 text-amber-900 shadow-amber-200/50',
      icon: 'text-amber-500',
      close: 'hover:bg-amber-100 text-amber-400',
      progress: 'bg-amber-500'
    },
    blue: {
      base: 'bg-blue-50/95 border-blue-200 text-blue-900 shadow-blue-200/50',
      icon: 'text-blue-500',
      close: 'hover:bg-blue-100 text-blue-400',
      progress: 'bg-blue-500'
    }
  }
  return configs[props.styleType] || configs.blue
})
</script>

<template>
  <Transition name="alert-fade" appear>
    <div class="w-full flex relative mb-6">
      <div
        class="relative itbkk-message w-full overflow-hidden backdrop-blur-md border px-5 py-4 rounded-2xl shadow-xl transition-all duration-500 hover:shadow-2xl flex items-start gap-4"
        :class="config.base"
        role="alert"
      >
        <!-- Decorative line at the top -->
        <div class="absolute top-0 left-0 h-1 w-full opacity-60" :class="config.progress"></div>

        <!-- Status Icon -->
        <div class="flex-shrink-0 mt-0.5">
          <svg v-if="styleType === 'green'" class="w-6 h-6" :class="config.icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else-if="styleType === 'red'" class="w-6 h-6" :class="config.icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else-if="styleType === 'yellow'" class="w-6 h-6" :class="config.icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg v-else class="w-6 h-6" :class="config.icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <strong class="block font-black text-[15px] tracking-tight mb-0.5 leading-tight">{{ message }}</strong>
          <p class="itbkk-message text-sm font-medium opacity-80 leading-relaxed">
            {{ titles }}
          </p>
        </div>

        <!-- Close Button -->
        <button
          class="flex-shrink-0 p-1.5 rounded-full transition-all duration-200 hover:rotate-90 cursor-pointer"
          :class="config.close"
          @click="emit('closePopUp', props.operate)"
          aria-label="Close alert"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.alert-fade-enter-from,
.alert-fade-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

.itbkk-message {
  word-break: break-all;
}
</style>
