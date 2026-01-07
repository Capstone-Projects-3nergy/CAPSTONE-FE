<script setup>
defineProps({
  modelDate: String,
  modelSearch: String,
  modelSort: String,
  showAddButton: {
    type: Boolean,
    default: true
  },
  hideNameSort: {
    type: Boolean,
    default: false
  },
  hideTrash: {
    type: Boolean,
    default: true
  }
})

defineEmits(['update:date', 'update:search', 'update:sort', 'add', 'trash'])
</script>
<template>
  <div
    class="bg-white h-auto mb-3 shadow-md rounded-xl p-4 border border-gray-200"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2 flex-wrap">
        <h3 class="text-lg font-semibold text-[#185dc0]">Date:</h3>
        <input
          type="date"
          :value="modelDate"
          @input="$emit('update:date', $event.target.value)"
          class="border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <div class="relative flex-1 min-w-[120px]">
          <svg
            class="absolute left-2 top-1/2 -translate-y-1/2"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <path
              d="M12.5 11H11.71L11.43 10.73C12.444 9.55407 13.0012 8.05271 13 6.5C13 5.21442 12.6188 3.95772 11.9046 2.8888C11.1903 1.81988 10.1752 0.986756 8.98744 0.494786C7.79973 0.00281635 6.49279 -0.125905 5.23192 0.124899C3.97104 0.375703 2.81285 0.994767 1.90381 1.90381C0.994767 2.81285 0.375703 3.97104 0.124899 5.23192C-0.125905 6.49279 0.00281635 7.79973 0.494786 8.98744C0.986756 10.1752 1.81988 11.1903 2.8888 11.9046C3.95772 12.6188 5.21442 13 6.5 13C8.11 13 9.59 12.41 10.73 11.43L11 11.71V12.5L16 17.49L17.49 16L12.5 11ZM6.5 11C4.01 11 2 8.99 2 6.5C2 4.01 4.01 2 6.5 2C8.99 2 11 4.01 11 6.5C11 8.99 8.99 11 6.5 11Z"
              fill="#9A9FA7"
            />
          </svg>

          <input
            type="text"
            :value="modelSearch"
            @input="$emit('update:search', $event.target.value)"
            placeholder="Search ..."
            class="pl-9 pr-4 py-2 w-full bg-gray-100 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <select
          class="bg-gray-100 text-gray-600 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer flex-shrink-0"
          :value="modelSort"
          @change="$emit('update:sort', $event.target.value)"
        >
          <option value="" disabled>Sort by:</option>
          <option>Newest</option>
          <option>Oldest</option>

          <option v-if="!hideNameSort">Name (A→Z)</option>
          <option v-if="!hideNameSort">Name (Z→A)</option>
        </select>

        <button
          v-if="showAddButton"
          @click="$emit('add')"
          class="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer flex-shrink-0"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M11 13H6C5.71667 13 5.47934 12.904 5.288 12.712C5.09667 12.52 5.00067 12.2827 5 12C4.99934 11.7173 5.09534 11.48 5.288 11.288C5.48067 11.096 5.718 11 6 11H11V6C11 5.71667 11.096 5.47934 11.288 5.288C11.48 5.09667 11.7173 5.00067 12 5C12.2827 4.99934 12.5203 5.09534 12.713 5.288C12.9057 5.48067 13.0013 5.718 13 6V11H18C18.2833 11 18.521 11.096 18.713 11.288C18.905 11.48 19.0007 11.7173 19 12C18.9993 12.2827 18.9033 12.5203 18.712 12.713C18.5207 12.9057 18.2833 13.0013 18 13H13V18C13 18.2833 12.904 18.521 12.712 18.713C12.52 18.905 12.2827 19.0007 12 19C11.7173 18.9993 11.48 18.9033 11.288 18.712C11.096 18.5207 11 18.2833 11 18V13Z"
              fill="white"
            />
          </svg>
          <span>Add parcel</span>
        </button>
        <!-- <button
          v-if="hideTrash"
          @click="$emit('trash')"
          class="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer flex-shrink-0"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 18 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.375 21C2.75625 21 2.22675 20.7717 1.7865 20.3152C1.34625 19.8586 
        1.12575 19.3091 1.125 18.6667V3.5H0V1.16667H5.625V0H12.375V1.16667H18V3.5H16.875
        V18.6667C16.875 19.3083 16.6549 19.8578 16.2146 20.3152C15.7744 20.7725 15.2445
        21.0008 14.625 21H3.375ZM14.625 3.5H3.375V18.6667H14.625V3.5ZM5.625 16.3333H7.875
        V5.83333H5.625V16.3333ZM10.125 16.3333H12.375V5.83333H10.125V16.3333Z"
              fill="white"
            />
          </svg>
          <span>Trash</span>
        </button> -->
      </div>
    </div>
  </div>
</template>
