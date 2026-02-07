<script setup>
const props = defineProps({
  operate: String
})

const emit = defineEmits(['closePopUp'])
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm transition-opacity"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[240px] transform transition-all scale-100"
    >
      <div class="relative">
        <div
          class="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"
        ></div>
        <!-- Optional: Center dot or icon -->
        <!-- <div class="absolute inset-0 flex items-center justify-center">
             <span class="w-2 h-2 bg-blue-600 rounded-full"></span>
        </div> -->
      </div>
      <div class="flex flex-col items-center">
        <h3 class="text-lg font-semibold text-gray-800">
          {{ props.operate || 'Loading...' }}
        </h3>
        <p class="text-sm text-gray-500">Please wait a moment</p>
      </div>
    </div>
  </div>
</template>
