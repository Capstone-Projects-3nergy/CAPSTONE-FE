<script setup>
import { computed } from 'vue'
import ButtonWeb from './ButtonWeb.vue'
import SelectWeb from './SelectWeb.vue'
const props = defineProps({
  modelDate: String,
  modelSearch: String,
  modelSort: String,
  showAddButton: {
    type: Boolean,
    default: true
  },
  showAddMemberButton: {
    type: Boolean,
    default: false
  },
  showAddStaffButton: {
    type: Boolean,
    default: false
  },
  hideNameSort: {
    type: Boolean,
    default: false
  },
  hideTrash: {
    type: Boolean,
    default: true
  },
  showDate: {
    type: Boolean,
    default: true
  },
  nameSortLabel: {
    type: String,
    default: 'Name'
  },
  showCategorySort: {
    type: Boolean,
    default: false
  },
  showStatusSort: {
    type: Boolean,
    default: false
  }
})

const sortOptions = computed(() => {
  const options = [
    { label: 'Newest', value: 'Newest' },
    { label: 'Oldest', value: 'Oldest' }
  ]
  if (!props.hideNameSort) {
    options.push({ label: `${props.nameSortLabel} (A→Z)`, value: 'Name (A→Z)' })
    options.push({ label: `${props.nameSortLabel} (Z→A)`, value: 'Name (Z→A)' })
  }
  if (props.showStatusSort) {
    options.push({ label: 'Status (A→Z)', value: 'Status (A→Z)' })
    options.push({ label: 'Status (Z→A)', value: 'Status (Z→A)' })
  }
  if (props.showCategorySort) {
    options.push({ label: 'Category (A→Z)', value: 'Category (A→Z)' })
    options.push({ label: 'Category (Z→A)', value: 'Category (Z→A)' })
  }
  return options
})

defineEmits(['update:date', 'update:search', 'update:sort', 'add', 'trash', 'addMember'])
</script>
<template>
  <div
    class="bg-white h-auto mb-3 shadow-md rounded-xl p-4 border border-gray-200"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div v-if="props.showDate" class="relative flex items-center group">
        <!-- Premium Icon Overlay -->
        <div class="absolute left-3 pointer-events-none z-10 transition-transform duration-200 group-hover:scale-105">
          <div class="p-1.5 bg-white rounded-lg text-[#0E4B90] shadow-sm flex items-center justify-center border border-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
        </div>
        
        <!-- Styled Date Input -->
        <input
          type="date"
          :value="props.modelDate"
          @input="$emit('update:date', $event.target.value)"
          class="bg-[#F8FAFC] text-[#1D355E] border border-gray-200/80 rounded-xl pl-13 pr-4 py-2.5 font-bold text-sm shadow-inner outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all hover:bg-gray-100/50 w-full sm:w-auto [::-webkit-calendar-picker-indicator]:opacity-0"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2 w-full md:w-auto ml-auto">
        <!-- Search Input -->
        <div class="relative flex-1 min-w-[120px] w-full">
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
            :value="props.modelSearch"
            @input="$emit('update:search', $event.target.value)"
            placeholder="Search ..."
            class="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0E4B90]/20 focus:border-[#0E4B90] transition duration-200 shadow-sm text-sm"
          />
        </div>

        <!-- Group: Sort Select + Add Button (Keep together on mobile) -->
        <div class="flex items-center gap-2 flex-1 sm:flex-initial">
          <SelectWeb
            :modelValue="props.modelSort"
            @update:modelValue="$emit('update:sort', $event)"
            :options="sortOptions"
            placeholder="Sort by:"
            customClass="bg-white text-gray-600 text-sm border border-gray-200 rounded-xl px-2 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0E4B90]/20 focus:border-[#0E4B90] transition duration-200 shadow-sm cursor-pointer flex-1 sm:flex-none min-w-[200px]"
          />

          <ButtonWeb 
            v-if="props.showAddButton"
            @click="$emit('add')"
            label="Add parcel"
            color="blue"
            class="whitespace-nowrap flex-1 sm:flex-none !px-3 sm:!px-5 !text-[13px] sm:!text-sm"
          >
            <template #icon>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="sm:w-6 sm:h-6">
                <path
                  d="M11 13H6C5.71667 13 5.47934 12.904 5.288 12.712C5.09667 12.52 5.00067 12.2827 5 12C4.99934 11.7173 5.09534 11.48 5.288 11.288C5.48067 11.096 5.718 11 6 11H11V6C11 5.71667 11.096 5.47934 11.288 5.288C11.48 5.09667 11.7173 5.00067 12 5C12.2827 4.99934 12.5203 5.09534 12.713 5.288C12.9057 5.48067 13.0013 5.718 13 6V11H18C18.2833 11 18.521 11.096 18.713 11.288C18.905 11.48 19.0007 11.7173 19 12C18.9993 12.2827 18.9033 12.5203 18.712 12.713C18.5207 12.9057 18.2833 13.0013 18 13H13V18C13 18.2833 12.904 18.521 12.712 18.713C12.52 18.905 12.2827 19.0007 12 19C11.7173 18.9993 11.48 18.9033 11.288 18.712C11.096 18.5207 11 18.2833 11 18V13Z"
                  fill="currentColor"
                />
              </svg>
            </template>
          </ButtonWeb>

          <ButtonWeb 
            v-if="props.showAddMemberButton"
            @click="$emit('addMember')"
            label="Add New"
            color="blue"
            class="whitespace-nowrap flex-1 sm:flex-none !px-3 sm:!px-5 !text-[13px] sm:!text-sm"
          >
            <template #icon>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="sm:w-6 sm:h-6">
                <path
                  d="M11 13H6C5.71667 13 5.47934 12.904 5.288 12.712C5.09667 12.52 5.00067 12.2827 5 12C4.99934 11.7173 5.09534 11.48 5.288 11.288C5.48067 11.096 5.718 11 6 11H11V6C11 5.71667 11.096 5.47934 11.288 5.288C11.48 5.09667 11.7173 5.00067 12 5C12.2827 4.99934 12.5203 5.09534 12.713 5.288C12.9057 5.48067 13.0013 5.718 13 6V11H18C18.2833 11 18.521 11.096 18.713 11.288C18.905 11.48 19.0007 11.7173 19 12C18.9993 12.2827 18.9033 12.5203 18.712 12.713C18.5207 12.9057 18.2833 13.0013 18 13H13V18C13 18.2833 12.904 18.521 12.712 18.713C12.52 18.905 12.2827 19.0007 12 19C11.7173 18.9993 11.48 18.9033 11.288 18.712C11.096 18.5207 11 18.2833 11 18V13Z"
                  fill="currentColor"
                />
              </svg>
            </template>
          </ButtonWeb>

          <ButtonWeb 
            v-if="props.showAddStaffButton"
            @click="$emit('addMember')"
            label="Add New Staff"
            color="blue"
            class="whitespace-nowrap flex-1 sm:flex-none !px-3 sm:!px-5 !text-[13px] sm:!text-sm"
          >
            <template #icon>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="sm:w-6 sm:h-6">
                <path
                  d="M11 13H6C5.71667 13 5.47934 12.904 5.288 12.712C5.09667 12.52 5.00067 12.2827 5 12C4.99934 11.7173 5.09534 11.48 5.288 11.288C5.48067 11.096 5.718 11 6 11H11V6C11 5.71667 11.096 5.47934 11.288 5.288C11.48 5.09667 11.7173 5.00067 12 5C12.2827 4.99934 12.5203 5.09534 12.713 5.288C12.9057 5.48067 13.0013 5.718 13 6V11H18C18.2833 11 18.521 11.096 18.713 11.288C18.905 11.48 19.0007 11.7173 19 12C18.9993 12.2827 18.9033 12.5203 18.712 12.713C18.5207 12.9057 18.2833 13.0013 18 13H13V18C13 18.2833 12.904 18.521 12.712 18.713C12.52 18.905 12.2827 19.0007 12 19C11.7173 18.9993 11.48 18.9033 11.288 18.712C11.096 18.5207 11 18.2833 11 18V13Z"
                  fill="currentColor"
                />
              </svg>
            </template>
          </ButtonWeb>
        </div>
      </div>

    </div>
  </div>
</template>
