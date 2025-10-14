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
  if (props.color === 'green') return 'bg-green-600 hover:bg-green-700'
  if (props.color === 'red') return 'bg-red-500 hover:bg-red-600'
  if (props.color === 'blue') return 'bg-blue-500 hover:bg-blue-600'
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
