<script setup>
const props = defineProps({
  titles: String,
  message: String,
  styleType: {
    type: String,
    validator(value) {
      return ['green', 'red', 'yellow', 'blue'].includes(value)
    }
  },
  operate: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['closePopUp'])
</script>

<template>
  <div class="w-full flex relative mb-6">
    <div
      class="relative itbkk-message px-6 py-4 rounded-lg shadow-lg"
      :class="
        styleType === 'green'
          ? 'bg-green-100 border border-green-400 text-green-700'
          : styleType === 'red'
          ? 'bg-red-100 border border-red-400 text-red-700'
          : styleType === 'yellow'
          ? 'bg-yellow-100 border border-yellow-400 text-yellow-700'
          : styleType === 'blue'
          ? 'bg-blue-100 border border-blue-400 text-blue-700'
          : 'bg-gray-100 border border-gray-400 text-gray-700'
      "
      role="alert"
    >
      <strong class="font-bold">{{ message }}</strong>
      <p>
        <span class="itbkk-message block sm:inline">{{ titles }}</span>
      </p>

      <span
        class="absolute top-2 right-2 cursor-pointer transition-transform duration-150 hover:scale-110"
        @click="emit('closePopUp', props.operate)"
      >
        <svg
          class="fill-current w-4 h-4"
          :class="
            styleType === 'green'
              ? 'text-green-500'
              : styleType === 'red'
              ? 'text-red-500'
              : styleType === 'yellow'
              ? 'text-yellow-500'
              : styleType === 'black'
              ? 'text-gray-400'
              : 'text-gray-500'
          "
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path
            d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 
             3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152
             a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031
             a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15
             a1.2 1.2 0 0 1 0 1.698z"
          />
        </svg>
      </span>
    </div>
  </div>
</template>

<style scoped></style>
