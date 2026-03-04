<script setup>
const props = defineProps({
  operate: String
})

defineEmits(['closePopUp'])
</script>

<template>
  <Transition name="fade-scale" appear>
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md transition-all duration-300"
    >
      <div
        class="bg-white/95 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-10 flex flex-col items-center gap-6 min-w-[280px] border border-white/20"
      >
        <!-- Modern Dual-Ring Spinner -->
        <div class="relative w-16 h-16">
          <div
            class="absolute inset-0 rounded-full border-[3px] border-blue-100/50"
          ></div>
          <div
            class="absolute inset-0 rounded-full border-[3px] border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin-slow"
          ></div>
          <div
            class="absolute inset-2 rounded-full border-[3px] border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin-fast"
          ></div>
          <!-- Pulse Effect -->
          <div class="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse-slow"></div>
        </div>

        <div class="flex flex-col items-center text-center space-y-2">
          <h3 class="text-xl font-bold bg-gradient-to-br from-slate-800 to-slate-500 bg-clip-text text-transparent italic">
            {{ props.operate || 'Processing...' }}
          </h3>
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></span>
          </div>
          <p class="text-xs font-medium text-slate-400 uppercase tracking-widest pt-2">
            Please wait a moment
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.animate-spin-slow {
  animation: spin 1.5s linear infinite;
}
.animate-spin-fast {
  animation: spin 0.8s linear infinite reverse;
}
.animate-pulse-slow {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Modal Transition */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}
</style>
