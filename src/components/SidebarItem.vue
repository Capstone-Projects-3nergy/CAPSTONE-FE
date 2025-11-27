<script setup>
defineProps({
  title: String,
  collapsed: Boolean
})
</script>

<template>
  <div
    @click="$emit('click')"
    class="flex items-center gap-3 p-4 hover:bg-blue-700 cursor-pointer rounded transition-all duration-200"
  >
    <slot name="icon"></slot>
    <span
      v-if="!collapsed"
      class="whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left"
      >{{ title }}</span
    >
  </div>
</template>
