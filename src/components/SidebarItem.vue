<script setup>
defineProps({
  title: String,
  collapsed: Boolean
})
</script>

<template>
  <div
    @click="$emit('click')"
    class="flex items-center cursor-pointer rounded-none transition-all duration-300 ease-in-out hover:scale-[1.02]"
    :class="[
      title !== 'Tractify' ? 'hover:bg-white/20 hover:shadow-lg p-4 gap-3' : 'py-4 pr-4 pl-2 gap-5',
      collapsed && title === 'Tractify' ? '!px-0 !justify-center' : ''
    ]"
  >
    <div 
      class="flex-shrink-0 flex items-center transition-all duration-300"
      :class="collapsed && title === 'Tractify' ? 'scale-110' : ''"
    >
      <slot name="icon"></slot>
    </div>
    <span
      v-if="!collapsed"
      class="whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left"
      :class="
        title === 'Tractify'
          ? 'text-[24px] font-black text-white tracking-wide'
          : 'text-[14px] font-bold text-gray-300'
      "
      >{{ title }}</span
    >
  </div>
</template>
