<script setup>
defineProps({
  title: String,
  collapsed: Boolean
})
</script>

<template>
  <div
    @click="$emit('click')"
    class="flex items-center gap-3 p-4 cursor-pointer rounded transition-all duration-200"
    :class="{
      'hover:bg-[#81AFEA]': title !== 'Tractify'
    }"
  >
    <slot name="icon"></slot>
    <span
      v-if="!collapsed"
      class="whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left text-[13px]"
      >{{ title }}</span
    >
  </div>
</template>
