<script setup>
import { ref, reactive, computed } from 'vue'
const props = defineProps({
  label: String,
  color: {
    type: String,
    default: 'green'
  },
  size: {
    type: String,
    default: 'md'
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
  if (props.color === 'navy')
    return 'bg-[#1D355E] hover:bg-[#152847] text-white shadow-md disabled:bg-gray-200'
  if (props.color === 'light-gray')
    return 'bg-[#E8EDF2] hover:bg-[#D1D9E6] text-gray-700 shadow-sm disabled:opacity-50'
  if (props.color === 'white-outline')
    return 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 shadow-sm'
  if (props.color === 'green')
    return 'bg-green-600 hover:bg-green-700 disabled:bg-gray-200'
  if (props.color === 'red')
    return 'bg-red-600 hover:bg-red-700 disabled:bg-gray-200'
  if (props.color === 'blue')
    return 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200'
  if (props.color === 'yellow')
    return 'bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-200'
  if (props.color === 'orange')
    return 'bg-orange-600 hover:bg-orange-700 disabled:bg-gray-200'
  if (props.color === 'black')
    return 'bg-black hover:bg-gray-700 disabled:bg-gray-200'
  if (props.color === 'gray')
    return 'bg-[#DADEE5] hover:bg-gray-100 disabled:bg-gray-200'
  return 'bg-blue-600 hover:bg-blue-700'
})
const textClass = computed(() => {
  if (props.color === 'gray') return 'text-[#898989]'
  if (props.color === 'light-gray' || props.color === 'white-outline') return ''
  return 'text-white'
})

const sizeClass = computed(() => {
  if (props.size === 'xs') return 'px-2 py-1 text-[10px] rounded-lg shadow-none'
  if (props.size === 'sm') return 'px-3 py-1.5 text-xs rounded-lg'
  return 'px-5 py-2.5 rounded-xl'
})
</script>

<template>
  <button
    @click="$emit('click')"
    :disabled="disabled || loading"
    :class="[
      bgClass,
      textClass,
      sizeClass,
      'cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 font-medium disabled:cursor-not-allowed'
    ]"
  >
    <slot name="icon"></slot>
    <div
      v-if="loading"
      class="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin"
    ></div>
    <span>{{ label }}</span>
  </button>
</template>
