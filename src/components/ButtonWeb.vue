<script setup>
import { ref, reactive, computed } from 'vue'
const props = defineProps({
  label: String, // ข้อความบนปุ่ม
  color: {
    // สีหลักของปุ่ม
    type: String,
    default: 'green'
  }
})
const emit = defineEmits(['click'])

// Map สีพื้นหลังและ hover
const bgClass = computed(() => {
  if (props.color === 'green')
    return 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
  if (props.color === 'red')
    return 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'
  if (props.color === 'blue')
    return 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400'
  if (props.color === 'yellow')
    return 'bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400'
  return 'bg-gray-500 hover:bg-gray-600'
})
</script>

<template>
  <button
    @click="$emit('click')"
    :class="`${bgClass} text-white px-5 py-2 rounded`"
  >
    {{ label }}
  </button>
</template>
