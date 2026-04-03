<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  options: {
    type: Array,
    required: true
  },
  placeholder: {
    type: String,
    default: 'Select option'
  },
  label: String,
  error: Boolean,
  disabled: Boolean,
  direction: {
    type: String,
    default: 'down'
  },
  customClass: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const dropdownRef = ref(null)

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue)
})

const toggleDropdown = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

const selectOption = (option) => {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relative w-full" ref="dropdownRef">
    <div
      @click="toggleDropdown"
      :class="[
        'w-full text-gray-800 transition-all duration-300 flex items-center justify-between cursor-pointer',
        !customClass ? 'bg-gray-50/50 border border-gray-200 rounded-2xl px-4 h-[58px] hover:border-gray-300' : customClass,
        $slots.icon && !customClass.includes('pl-') ? 'pl-10' : '',
        isOpen ? 'bg-white border-[#0E4B90] ring-4 ring-blue-100 shadow-sm' : '',
        error ? 'border-red-400 ring-4 ring-red-50 text-red-600' : '',
        disabled ? 'bg-gray-100/80 border-gray-200 cursor-not-allowed opacity-75' : ''
      ]"
    >
      <div v-if="$slots.icon" class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center">
        <slot name="icon" />
      </div>
      <span :class="[{ 'text-gray-400': (!selectedOption || disabled) && !error, 'text-red-600': error && !selectedOption }, 'truncate']" class="flex-1 text-left">
        {{ selectedOption ? selectedOption.label : placeholder }}
      </span>
      <div class="flex-shrink-0 ml-2">
        <svg
          v-if="disabled"
          class="w-4 h-4 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <svg
          v-else
          class="w-5 h-5 transition-transform duration-300"
          :class="[
            isOpen ? 'rotate-180 text-[#0E4B90]' : (error ? 'text-red-600' : 'text-gray-400')
          ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- Dropdown Menu -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0 -translate-y-2"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 -translate-y-2"
    >
      <ul
        v-if="isOpen"
        class="absolute z-[100] w-full bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-auto py-2 scrollbar-thin scrollbar-thumb-gray-200"
        :class="direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'"
      >
        <li
          v-for="option in options"
          :key="option.value"
          @click="selectOption(option)"
          class="px-5 py-3 cursor-pointer hover:bg-blue-50 transition-all text-sm flex items-center justify-between group"
          :class="{ 'bg-blue-50/50 text-[#0E4B90] font-bold border-l-4 border-[#0E4B90]': modelValue === option.value }"
        >
          <span class="truncate">{{ option.label }}</span>
          <svg
            v-if="modelValue === option.value"
            class="w-4 h-4 text-[#0E4B90]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </li>
        <li v-if="options.length === 0" class="px-5 py-3 text-sm text-gray-400 italic font-medium">
          No options available
        </li>
      </ul>
    </transition>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 3px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
</style>
