<script setup>
defineProps({
  items: Array,
  pages: Array,
  page: Number,
  total: Number,
  showAction: {
    type: Boolean,
    default: true
  }
})

function formatDateTime(datetimeStr) {
  if (!datetimeStr) return ''
  return datetimeStr.replace('T', ' ')
}
</script>
<template>
  <div class="sm:bg-white sm:rounded-lg sm:shadow w-full overflow-hidden">
    <table class="min-w-full text-left border-collapse">
      <thead
        class="hidden md:table-header-group bg-white border-t border-b border-[#185DC0] my-4"
      >
        <tr>
          <th class="px-4 py-3 text-sm font-semibold text-[#185DC0]">
            Tracking
          </th>

          <th class="px-4 py-3 text-sm font-semibold text-[#185DC0]">Name</th>

          <th class="px-4 py-3 text-sm font-semibold text-[#185DC0]">
            <div class="flex items-center gap-2">
              Room
              <slot name="sort-room"></slot>
            </div>
          </th>

          <th class="px-4 py-3 text-sm font-semibold text-[#185DC0]">Email</th>

          <th class="px-4 py-3 text-sm font-semibold text-[#185DC0]">
            <div class="flex items-center gap-2">
              Status
              <slot name="sort-status"></slot>
            </div>
          </th>

          <th class="px-4 py-3 text-sm font-semibold text-[#185DC0]">
            <div class="flex items-center gap-2">
              Update
              <slot name="sort-date"></slot>
            </div>
          </th>

          <th
            v-if="showAction"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            Action
          </th>
        </tr>
      </thead>

      <tbody class="divide-y">
        <tr v-if="items.length === 0">
          <td colspan="7" class="text-center py-6 text-gray-500 text-sm">
            No data available
          </td>
        </tr>
        <tr
          v-for="p in items"
          :key="p.id"
          class="md:table-row flex flex-col md:flex-row bg-gray-50 md:bg-white rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 shadow md:shadow-none"
        >
          <td
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-blue-700"
              >Tracking:
            </span>
            {{ p.trackingNumber }}
          </td>

          <td
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-blue-700">Name: </span>
            {{ p.recipientName }}
          </td>

          <td
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-blue-700">Room: </span>
            {{ p.roomNumber }}
          </td>

          <td
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-blue-700">Email: </span>
            {{ p.email }}
          </td>

          <td class="px-4 py-2 md:py-3 border-b md:border-none">
            <span class="md:hidden font-semibold text-blue-700">Status:</span>

            <span
              class="px-3 py-1 rounded-full text-xs font-semibold text-white cursor-pointer"
              :class="{
                'bg-yellow-400': p.status === 'Waiting for Staff',
                'bg-green-400': p.status === 'Picked Up',
                'bg-blue-400': p.status === 'Received'
              }"
              @click="$emit('status-click', p)"
            >
              {{ p.status }}
            </span>
          </td>

          <td
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-blue-700">Update:</span>
            {{ formatDateTime(p.updateAt) }}
          </td>

          <td
            v-if="showAction"
            class="px-4 py-2 md:py-3 text-sm text-gray-700 flex md:table-cell space-x-2 md:space-x-2"
          >
            <span class="md:hidden font-semibold text-blue-700">Action:</span>

            <button
              @click="$emit('view-detail', p.id)"
              class="text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              <slot name="icon-view"></slot>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="flex justify-end space-x-2 mt-4 text-gray-700">
    <button
      @click="$emit('prev')"
      :disabled="page === 1"
      class="cursor-pointer px-3 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
    >
      &lt; Previous
    </button>

    <button
      v-for="pg in pages"
      :key="pg"
      @click="$emit('go', pg)"
      class="cursor-pointer px-3 py-1 rounded"
      :class="page === pg ? 'bg-blue-700 text-white' : 'hover:bg-gray-200'"
    >
      {{ pg }}
    </button>

    <button
      @click="$emit('next')"
      :disabled="page === total"
      class="cursor-pointer px-3 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
    >
      Next &gt;
    </button>
  </div>
</template>
