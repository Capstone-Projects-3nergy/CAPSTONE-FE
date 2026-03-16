<script setup>
import { useAuthManager } from '@/stores/AuthManager'
import { computed, ref } from 'vue'
const emit = defineEmits([
  'prev',
  'next',
  'go',
  'status-click',
  'view-detail',
  'delete',
  'restore',
  'deleteMember',
  'restoreMember'
])

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  pages: {
    type: Array,
    default: () => []
  },
  page: {
    type: Number,
    default: 1
  },
  total: {
    type: Number,
    default: 0
  },
  canNext: {
    type: Boolean,
    default: true
  },

  showPhoto: { type: Boolean, default: false },
  showActionStatus: { type: Boolean, default: false },
  showMemberName: { type: Boolean, default: false },
  showStaffName: { type: Boolean, default: false },
  showMobile: { type: Boolean, default: false },
  showName: { type: Boolean, default: true },
  showAction: { type: Boolean, default: true },
  showDelete: { type: Boolean, default: false },
  showDeleteMember: { type: Boolean, default: false },
  showRestore: { type: Boolean, default: true },
  showRestoreMember: { type: Boolean, default: false },
  clickableStatus: { type: Boolean, default: true },
  showTracking: { type: Boolean, default: true },
  showRoom: { type: Boolean, default: true },
  showStatus: { type: Boolean, default: true },
  showUpdateAt: { type: Boolean, default: true },
  showDeletedAt: { type: Boolean, default: false },
  showDeleteResident: { type: Boolean, default: false },
  showDeleteAnnouncement: { type: Boolean, default: false },
  showMemberTrashName: { type: Boolean, default: false },
  hideTrash: { type: Boolean, default: false },
  showMember: { type: Boolean, default: false },
  showParcel: { type: Boolean, default: false },
  showEmail: { type: Boolean, default: true },
  showTitle: { type: Boolean, default: false },
  showCategory: { type: Boolean, default: false },
  showDatePosted: { type: Boolean, default: false },
  showRestoreAnnouncement: { type: Boolean, default: false },
})

function formatDateTime(datetimeStr) {
  if (!datetimeStr) return ''
  return datetimeStr.replace('T', ' ')
}
const formatStatus = (status) => {
  if (!status) return ''
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}
const getInitial = (name) => {
  if (!name) return ''
  return name.trim()[0].toUpperCase()
}

const authStore = useAuthManager()

</script>
<template>
  <div class="md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 w-full overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
      <thead
        class="hidden md:table-header-group bg-gray-50/50"
      >
        <tr>
          <th
            v-if="showPhoto"
            class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            Photo
          </th>
          <th
            v-if="showTracking"
            class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            Tracking
          </th>

          <th
            v-if="showName"
            class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            Name
          </th>
          <th
            v-if="showMemberName"
            class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            Resident name
          </th>
          <th
            v-if="showMemberTrashName"
            class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            Resident name
          </th>
          <th
            v-if="showStaffName"
            class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            Staff name
          </th>
          <th
            v-if="showMobile"
            class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            Mobile
          </th>
          <th
            v-if="showRoom"
            class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            <div class="flex items-center gap-2">
              Room
              <div class="transition-transform duration-200 ease-out hover:scale-110">
                <slot name="sort-room"></slot>
              </div>
            </div>
          </th>

          <th v-if="showEmail" class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap">Email</th>

          <th
            v-if="showTitle"
            class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            Title
          </th>

          <th
            v-if="showCategory"
            class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            <div class="flex items-center gap-2">
              Category
              <div class="transition-transform duration-200 ease-out hover:scale-110">
                <slot name="sort-category"></slot>
              </div>
            </div>
          </th>

          <th
            v-if="showDatePosted"
            class="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            Date Posted
          </th>

          <th
            v-if="showStatus"
            class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            <div class="flex items-center gap-2">
              Status
              <div class="transition-transform duration-200 ease-out hover:scale-110">
                <slot name="sort-status"></slot>
              </div>
            </div>
          </th>

          <th
            v-if="showUpdateAt"
            class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            <div class="flex items-center gap-2">
              Updated At
              <div class="transition-transform duration-200 ease-out hover:scale-110">
                <slot name="sort-date"></slot>
              </div>
            </div>
          </th>
          <th
            v-if="showActionStatus"
            class="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            <div class="flex items-center gap-2">
              Status
              <div class="transition-transform duration-200 ease-out hover:scale-110">
                <slot name="sort-status"></slot>
              </div>
            </div>
          </th>
           <th
            v-if="showDeletedAt"
            class="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            <div class="flex items-center justify-center gap-2">
              Deleted At
              <div class="transition-transform duration-200 ease-out hover:scale-110">
                <slot name="sort-date"></slot>
              </div>
            </div>
          </th>
          <th
            v-if="showAction"
            class="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-500 tracking-wider align-middle whitespace-nowrap"
          >
            Action
          </th>
        </tr>
      </thead>

      <tbody class="bg-transparent md:bg-white divide-y divide-gray-100">
        <tr v-if="items.length === 0">
          <td colspan="15" class="text-center py-12 text-gray-500 text-sm">
            <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            No data available
          </td>
        </tr>
        <tr
          v-for="p in items"
          :key="p.id"
          class="md:table-row flex flex-col md:flex-row bg-gray-50 md:bg-white rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 shadow md:shadow-none hover:bg-gray-50/50 transition-colors duration-150 relative"
        >
          <td
            v-if="showPhoto"
            class="px-4 py-3 md:py-4 md:px-6 border-b md:border-none md:align-middle"
          >
            <div class="flex items-center gap-2">
              <span class="md:hidden font-semibold text-[#0E4B90]">Photo:</span>

              <div
                class="w-10 h-10 inline-flex flex-shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-[#1D355E] to-[#0E4B90] ring-2 ring-white shadow-sm items-center justify-center relative group/avatar"
              >
                <img
                  v-if="p.photo"
                  :src="p.photo"
                  class="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-110"
                />

                <div
                  v-else
                  class="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                >
                  {{ getInitial(p.fullName) || getInitial(p.firstName) }}
                </div>
              </div>
            </div>
          </td>
          <td
            v-if="showTracking"
            class="px-4 py-3 md:py-4 md:px-6 text-xs text-gray-700 border-b md:border-none md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90]"
              >Tracking:
            </span>
            {{ p.trackingNumber }}
          </td>

          <td
            v-if="showName"
            class="px-4 py-3 md:py-4 md:px-6 text-xs text-gray-700 border-b md:border-none md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90]">Name:</span>
            {{ p.recipientName }}
          </td>

          <td
            v-if="showMemberTrashName"
            class="px-4 py-3 md:py-4 md:px-6 text-xs text-gray-700 border-b md:border-none md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90]">
              Resident name:
            </span>
            {{ p.firstName }} {{ p.lastName }}
          </td>
          <td
            v-if="showMemberName"
            class="px-4 py-3 md:py-4 md:px-6 text-xs text-gray-700 border-b md:border-none md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90]">
              Resident name:
            </span>
            {{ p.fullName }}
          </td>
          <td
            v-if="showStaffName"
            class="px-4 py-3 md:py-4 md:px-6 text-xs text-gray-700 border-b md:border-none md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90]">
              Staff name:
            </span>
            {{ p.fullName }}
          </td>
          <td
            v-if="showMobile"
            class="px-4 py-3 md:py-4 md:px-6 text-xs text-gray-700 border-b md:border-none md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90]">Mobile:</span>
            {{ p.mobile }}
          </td>

          <td
            v-if="showRoom"
            class="px-4 py-3 md:py-4 md:px-6 text-xs text-gray-700 border-b md:border-none md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90]">Room: </span>
            {{ p.roomNumber }}
          </td>

          <td
            v-if="showEmail"
            class="px-4 py-3 md:py-4 md:px-6 text-xs text-gray-700 border-b md:border-none md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90]">Email: </span>
            {{ p.email }}
          </td>

          <td
            v-if="showTitle"
            class="px-4 py-3 md:py-4 md:px-6 text-xs text-gray-700 border-b md:border-none md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90]">Title: </span>
            <span class="font-medium">{{ p.title }}</span>
          </td>

          <td
            v-if="showCategory"
            class="px-4 py-3 md:py-4 md:px-6 text-xs text-gray-700 border-b md:border-none md:table-cell md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90] mr-2">Category: </span>
            <span
              class="px-3 py-1 rounded-full text-[10px] font-semibold"
              :class="{
                'bg-blue-50 text-blue-600': p.category === 'Updates',
                'bg-emerald-50 text-emerald-600': p.category === 'Events',
                'bg-purple-50 text-purple-600': p.category === 'Maintenance',
                'bg-gray-100 text-gray-600': !['Updates', 'Events', 'Maintenance'].includes(p.category)
              }"
            >
              {{ p.category || 'General' }}
            </span>
          </td>

          <td
            v-if="showDatePosted"
            class="px-4 py-3 md:py-4 md:px-6 text-xs text-gray-700 border-b md:border-none md:table-cell md:text-center md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90]">Date Posted: </span>
            {{ formatDateTime(p.datePosted) }}
          </td>

          <td
            v-if="showStatus"
            class="px-4 py-3 md:py-4 md:px-6 border-b md:border-none md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90] mr-2">Status:</span>

            <div class="relative group inline-block">
              <span
                class="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                :class="[
                  {
                    'bg-yellow-50 text-yellow-600': p.status === 'Waiting for Staff' || p.status === 'Pending',
                    'bg-green-50 text-green-600': p.status === 'Picked Up',
                    'bg-blue-50 text-blue-600': p.status === 'Received',
                    'bg-red-50 text-red-600': p.status === 'TRASH'
                  },
                  clickableStatus ? 'cursor-pointer ' : 'cursor-default '
                ]"
                @click="clickableStatus && $emit('status-click', p)"
              >
                {{ p.status }}
              </span>

              <!-- Tooltip -->
              <div
                v-if="
                  authStore.user?.role === 'STAFF' &&
                  clickableStatus
                "
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
              >
                <div
                  class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  Change Status
                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </td>

          <td
            v-if="showUpdateAt"
            class="px-4 py-3 md:py-4 md:px-6 text-xs text-gray-700 border-b md:border-none md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90]"
              >Updated At:</span
            >
            {{ formatDateTime(p.updateAt) }}
          </td>
            <td
            v-if="showActionStatus"
            class="px-4 py-3 md:py-4 md:px-6 text-xs text-gray-700 border-b md:border-none md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90] mr-2">Status:</span>

            <span
              class="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
              :class="[
                {
                  'bg-green-50 text-green-600': p.status === 'ACTIVE',
                  'bg-gray-100/80 text-gray-600': p.status === 'INACTIVE',
                  'bg-red-50 text-red-600': p.status === 'DELETED',
                  'bg-yellow-50 text-yellow-600': p.status === 'PENDING'
                },
                clickableStatus ? 'cursor-pointer ' : 'cursor-default '
              ]"
            >
              {{ formatStatus(p.status) }}
            </span>
          </td>
          <td
            v-if="showDeletedAt"
            class="px-4 py-3 md:py-4 md:px-6 text-xs text-gray-700 border-b md:border-none md:table-cell md:text-center md:align-middle whitespace-nowrap"
          >
            <span class="md:hidden font-semibold text-[#0E4B90]"
              >Deleted At:</span
            >
            {{ formatDateTime(p.deletedAt) }}
          </td>
          <!-- <td
            v-if="showActionStatus"
            class="px-4 py-2 md:py-4 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-[#185DC0]">Status:</span>

            <span
              class="px-3 py-1 rounded-full text-xs font-semibold text-white"
              :class="[
                {
                  'bg-green-400': p.status === 'ACTIVE',
                  'bg-gray-400': p.status === 'INACTIVE',
                  'bg-red-400': p.status === 'DELETED',
                  'bg-yellow-400': p.status === 'PENDING'
                },
                clickableStatus ? 'cursor-pointer ' : 'cursor-default '
              ]"
            >
              {{ p.status }}
            </span>
          </td> -->
          <td
            v-if="showAction"
            class="px-4 py-2 md:py-4 md:px-6 text-xs text-gray-700 flex items-center md:table-cell md:align-middle text-right whitespace-nowrap"
          >
            <div class="flex items-center justify-start w-full md:justify-end gap-3 sm:gap-4">
              <span class="md:hidden font-semibold text-[#0E4B90]">Action:</span>
              <div class="flex items-center justify-end gap-1.5 flex-shrink-0">
            <button
              v-if="!!$slots['icon-view']"
              @click="$emit('view-detail', p.id)"
              class="relative group/btn p-1.5 border border-gray-100  text-gray-400 hover:bg-blue-50 hover:text-blue-500 rounded-lg transition-colors cursor-pointer bg-transparent md:bg-white flex items-center justify-center shadow-sm"
            >
              <div class="flex items-center justify-center w-[18px] h-[18px] transition-transform duration-200 ease-out group-hover/btn:scale-110 [&>svg]:w-[18px] [&>svg]:h-[18px]">
                <slot name="icon-view"></slot>
              </div>

              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0"
              >
                <div
                  class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  View Parcel Detail

                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
            <button
              v-if="!!$slots['icon-view-member']"
              @click="$emit('view-detail', p.id)"
              class="relative group/btn p-1.5 border border-gray-100  text-gray-400 hover:bg-blue-50 hover:text-blue-500 rounded-lg transition-colors cursor-pointer bg-transparent md:bg-white flex items-center justify-center shadow-sm"
            >
              <div class="flex items-center justify-center w-[18px] h-[18px] transition-transform duration-200 ease-out group-hover/btn:scale-110 [&>svg]:w-[18px] [&>svg]:h-[18px]">
                <slot name="icon-view-member"></slot>
              </div>

              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0"
              >
                <div
                  class="relative rounded-lg bg-gray-400 min-w-[150px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  View Resident Detail

                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
            <button
              v-if="showDelete && p.status !== 'Picked Up' && !!$slots['icon-delete']"
              @click="$emit('delete', p)"
              class="relative group/btn p-1.5 border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors cursor-pointer bg-transparent md:bg-white flex items-center justify-center shadow-sm"
            >
              <div class="flex items-center justify-center w-[18px] h-[18px] transition-transform duration-200 ease-out group-hover/btn:scale-110 [&>svg]:w-[18px] [&>svg]:h-[18px]">
                <slot name="icon-delete"></slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0"
              >
                <div
                  class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  Move To Trash

                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
            <button
              v-if="showDeleteResident && !!$slots['icon-delete']"
              @click="$emit('delete', p)"
              class="relative group/btn p-1.5 border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors cursor-pointer bg-transparent md:bg-white flex items-center justify-center shadow-sm"
            >
              <div class="flex items-center justify-center w-[18px] h-[18px] transition-transform duration-200 ease-out group-hover/btn:scale-110 [&>svg]:w-[18px] [&>svg]:h-[18px]">
                <slot name="icon-delete"></slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0"
              >
                <div
                  class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  Move To Trash

                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </button>

            <button
              v-if="showDelete && p.status !== 'Picked Up' && !!$slots['icon-delete-permanent']"
              @click="$emit('delete', p)"
              class="relative group/btn p-1.5 border border-gray-100 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer bg-transparent md:bg-white flex items-center justify-center shadow-sm"
            >
              <div class="flex items-center justify-center w-[18px] h-[18px] transition-transform duration-200 ease-out group-hover/btn:scale-110 [&>svg]:w-[18px] [&>svg]:h-[18px]">
                <slot name="icon-delete-permanent"></slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0"
              >
                <div
                  class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  Delete Parcel
                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
            <button
              v-if="showDeleteResident && !!$slots['icon-delete-permanent']"
              @click="$emit('delete', p)"
              class="relative group/btn p-1.5 border border-gray-100 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer bg-transparent md:bg-white flex items-center justify-center shadow-sm"
            >
              <div class="flex items-center justify-center w-[18px] h-[18px] transition-transform duration-200 ease-out group-hover/btn:scale-110 [&>svg]:w-[18px] [&>svg]:h-[18px]">
                <slot name="icon-delete-permanent"></slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0"
              >
                <div
                  class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  Delete Resident
                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
            <button
              v-if="showDeleteAnnouncement && !!$slots['icon-delete-permanent']"
              @click="$emit('delete', p)"
              class="relative group/btn p-1.5 border border-gray-100 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer bg-transparent md:bg-white flex items-center justify-center shadow-sm"
            >
              <div class="flex items-center justify-center w-[18px] h-[18px] transition-transform duration-200 ease-out group-hover/btn:scale-110 [&>svg]:w-[18px] [&>svg]:h-[18px]">
                <slot name="icon-delete-permanent"></slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0"
              >
                <div
                  class="relative rounded-lg bg-gray-400 min-w-[150px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  Delete Announcement
                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
            <button
              v-if="showRestore && !!$slots['restore-trash']"
              @click="$emit('restore', p)"
              class="relative group/btn p-1.5 border border-gray-100 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors cursor-pointer bg-transparent md:bg-white flex items-center justify-center shadow-sm"
            >
              <div class="flex items-center justify-center w-[18px] h-[18px] transition-transform duration-200 ease-out group-hover/btn:scale-110 [&>svg]:w-[18px] [&>svg]:h-[18px]">
                <slot name="restore-trash"> </slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0"
              >
                <div
                  class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  Restore Parcel

                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
            <button
              v-if="showRestoreAnnouncement && !!$slots['restore-trash']"
              @click="$emit('restore', p)"
              class="relative group/btn p-1.5 border border-gray-100 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors cursor-pointer bg-transparent md:bg-white flex items-center justify-center shadow-sm"
            >
              <div class="flex items-center justify-center w-[18px] h-[18px] transition-transform duration-200 ease-out group-hover/btn:scale-110 [&>svg]:w-[18px] [&>svg]:h-[18px]">
                <slot name="restore-trash"> </slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0"
              >
                <div
                   class="relative rounded-lg bg-gray-400 min-w-[150px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  Restore Announcement

                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
            <button
              v-if="showDeleteMember && p.role === 'RESIDENT' && !!$slots['icon-delete']"
              @click="$emit('deleteMember', p)"
              class="relative group/btn p-1.5 border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors cursor-pointer bg-transparent md:bg-white flex items-center justify-center shadow-sm"
            >
              <div class="flex items-center justify-center w-[18px] h-[18px] transition-transform duration-200 ease-out group-hover/btn:scale-110 [&>svg]:w-[18px] [&>svg]:h-[18px]">
                <slot name="icon-delete"></slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0"
              >
                <div
                  class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  Move To Trash

                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </button>

            <button
              v-if="showDeleteMember && p.role === 'RESIDENT' && !!$slots['icon-delete-permanent']"
              @click="$emit('deleteMember', p)"
              class="relative group/btn p-1.5 border border-gray-100 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer bg-transparent md:bg-white flex items-center justify-center shadow-sm"
            >
              <div class="flex items-center justify-center w-[18px] h-[18px] transition-transform duration-200 ease-out group-hover/btn:scale-110 [&>svg]:w-[18px] [&>svg]:h-[18px]">
                <slot name="icon-delete-permanent"></slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0"
              >
                <div
                  class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  Delete Resident
                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
            <button
              v-if="showRestoreMember && !!$slots['restore-trash']"
              @click="$emit('restoreMember', p)"
              class="relative group/btn p-1.5 border border-gray-100 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors cursor-pointer bg-transparent md:bg-white flex items-center justify-center shadow-sm"
            >
              <div class="flex items-center justify-center w-[18px] h-[18px] transition-transform duration-200 ease-out group-hover/btn:scale-110 [&>svg]:w-[18px] [&>svg]:h-[18px]">
                <slot name="restore-trash"> </slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover/btn:opacity-100 group-hover/btn:translate-y-0"
              >
                <div
                  class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  Restore Resident

                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
            </div>
          </div>
        </td>
        </tr>
      </tbody>
    </table>
    </div>

    <!-- Pagination -->
    <div class="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 sm:justify-end gap-3" v-if="total > 0">
        <div class="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 inline-flex items-center gap-1 w-full sm:w-auto justify-center">
            <button 
              @click="$emit('prev')" 
              :disabled="page === 1"
              class="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
            >Previous</button>
            
            <button
              v-for="pg in pages"
              :key="pg"
              @click="$emit('go', pg)"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer',
                page === pg 
                  ? 'bg-[#0E2856] text-white shadow-md transform scale-105' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              ]"
            >
              {{ pg }}
            </button>

            <button 
              @click="$emit('next')" 
              :disabled="!canNext"
              class="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
            >Next</button>
        </div>
    </div>
  </div>
</template>
