<script setup>
import { ref, reactive, computed } from 'vue'
const props = defineProps({
  label: String,
  color: {
    type: String,
    default: 'green'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['click'])

const bgClass = computed(() => {
  if (props.color === 'green')
    return 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
  if (props.color === 'red')
    return 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
  if (props.color === 'blue')
    return 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
  if (props.color === 'yellow')
    return 'bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
  if (props.color === 'orange')
    return 'bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
  if (props.color === 'black')
    return 'bg-black hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
  if (props.color === 'gray')
    return 'bg-[#DADEE5] hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed'
})
const textClass = computed(() => {
  return props.color === 'gray' ? 'text-[#898989]' : 'text-white'
})
</script>

<template>
  <button
    @click="$emit('click')"
    :disabled="disabled || loading"
    :class="`${bgClass} ${textClass} px-5 py-2 rounded cursor-pointer flex items-center justify-center gap-2`"
  >
    <div
      v-if="loading"
      class="w-5 h-5 rounded-full border-2 border-gray-200 border-t-white animate-spin"
    ></div>
    {{ loading ? 'Loading...' : label }}
  </button>
</template>
