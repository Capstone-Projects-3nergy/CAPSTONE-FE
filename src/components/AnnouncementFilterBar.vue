<script setup>
defineProps({
  modelSearch: String,
  modelCategory: String,
  categories: {
    type: Array,
    default: () => ['News', 'Events', 'Maintenance']
  }
})

defineEmits(['update:search', 'update:category'])
</script>

<template>
  <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
    <!-- Search -->
    <div class="relative w-full sm:w-96">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
        </svg>
      </div>
      <input
        type="text"
        :value="modelSearch"
        @input="$emit('update:search', $event.target.value)"
        placeholder="Search announcements..."
        class="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition duration-150 ease-in-out sm:text-sm"
      />
    </div>

    <!-- Category Filter -->
    <div class="flex gap-2 w-full sm:w-auto">
      <select
        :value="modelCategory"
        @change="$emit('update:category', $event.target.value)"
        class="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-200 focus:outline-none focus:ring-blue-100 focus:border-blue-400 sm:text-sm rounded-xl bg-gray-50 text-gray-600 cursor-pointer"
      >
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>
  </div>
</template>
