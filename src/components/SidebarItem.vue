<script setup>
defineProps({
  title: String,
  collapsed: Boolean
})
</script>

<template>
  <div
    @click="$emit('click')"
    class="flex items-center gap-3 p-4 cursor-pointer rounded-none transition-all duration-300 ease-in-out hover:scale-[1.02]"
    :class="{
      'hover:bg-white/20 hover:shadow-lg': title !== 'Tractify'
    }"
  >
    <slot name="icon"></slot>
    <span
      v-if="!collapsed"
      class="whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left"
      :class="
        title === 'Tractify'
          ? 'text-[24px] font-black text-white tracking-wide'
          : 'text-[15px] font-bold text-gray-300'
      "
      >{{ title }}</span
    >
  </div>
</template>
