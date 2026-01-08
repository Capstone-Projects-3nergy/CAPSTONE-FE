<script setup>
const emit = defineEmits([
  'prev',
  'next',
  'go',
  'status-click',
  'view-detail',
  'delete',
  'restore'
])

defineProps({
  items: Array,
  pages: Array,
  page: Number,
  total: Number,
  showAction: {
    type: Boolean,
    default: true
  },
  showDelete: {
    type: Boolean,
    default: true
  },
  showRestore: {
    type: Boolean,
    default: true
  },
  clickableStatus: {
    type: Boolean,
    default: true
  },
  showTracking: {
    type: Boolean,
    default: true
  },
  showStatus: {
    type: Boolean,
    default: true
  },
  showUpdateAt: { type: Boolean, default: true },
  showDeletedAt: { type: Boolean, default: false }
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
          <th
            v-if="showTracking"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
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

          <th
            v-if="showStatus"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            <div class="flex items-center gap-2">
              Status
              <slot name="sort-status"></slot>
            </div>
          </th>

          <th
            v-if="showUpdateAt"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            <div class="flex items-center gap-2">
              Updated At
              <slot name="sort-date"></slot>
            </div>
          </th>
          <th
            v-if="showDeletedAt"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            <div class="flex items-center gap-2">
              Deleted At
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
            v-if="showTracking"
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

          <td
            v-if="showStatus"
            class="px-4 py-2 md:py-3 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-blue-700">Status:</span>

            <span
              class="px-3 py-1 rounded-full text-xs font-semibold text-white"
              :class="[
                {
                  'bg-yellow-400': p.status === 'Waiting for Staff',
                  'bg-green-400': p.status === 'Picked Up',
                  'bg-blue-400': p.status === 'Received',
                  'bg-red-400': p.status === 'TRASH'
                },
                clickableStatus ? 'cursor-pointer ' : 'cursor-default '
              ]"
              @click="clickableStatus && $emit('status-click', p)"
            >
              {{ p.status }}
            </span>
          </td>

          <td
            v-if="showUpdateAt"
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-blue-700"
              >Updated At:</span
            >
            {{ formatDateTime(p.updateAt) }}
          </td>
          <td
            v-if="showDeletedAt"
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-blue-700"
              >Deleted At:</span
            >
            {{ formatDateTime(p.deletedAt) }}
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
            <button
              v-if="showDelete && p.status !== 'Picked Up'"
              @click="$emit('delete', p)"
              class="hover:opacity-80 cursor-pointer"
            >
              <slot name="icon-delete"></slot>
            </button>
            <button
              v-if="showRestore"
              @click="$emit('restore', p)"
              class="hover:opacity-80 cursor-pointer"
            >
              <slot name="restore-trash"> </slot>
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
