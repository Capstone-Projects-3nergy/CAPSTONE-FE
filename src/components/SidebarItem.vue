<script setup>
const props = defineProps({
  title: { type: String, required: true }
})
const emit = defineEmits(['click'])
</script>

<template>
  <a
    href="#"
    class="flex items-center gap-3 p-4 hover:bg-blue-400 rounded"
    @click.prevent="emit('click')"
  >
    <!-- slot สำหรับ icon -->
    <slot name="icon">
      <!-- default placeholder ถ้าไม่ได้ส่ง icon -->
      <div class="w-6 h-6 bg-white/30 rounded flex-shrink-0"></div>
    </slot>

    <!-- title -->
    <span class="whitespace-nowrap overflow-hidden text-ellipsis flex-1">
      {{ title }}
    </span>
  </a>
</template>
