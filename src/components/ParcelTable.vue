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
  showMemberTrashName: { type: Boolean, default: false },
  hideTrash: { type: Boolean, default: false },
  showMember: { type: Boolean, default: false },
  showParcel: { type: Boolean, default: false },
})


// defineProps({
//   items: Array,
//   pages: Array,
//   page: Number,
//   total: Number,
//   showPhoto: {
//     type: Boolean,
//     default: false
//   },
//   showActionStatus: {
//     type: Boolean,
//     default: false
//   },
//   showMemberName: {
//     type: Boolean,
//     default: false
//   },
//   showMobile: {
//     type: Boolean,
//     default: false
//   },
//   showName: {
//     type: Boolean,
//     default: true
//   },
//   showAction: {
//     type: Boolean,
//     default: true
//   },
//   showDelete: {
//     type: Boolean,
//     default: true
//   },
//   showRestore: {
//     type: Boolean,
//     default: true
//   },
//   clickableStatus: {
//     type: Boolean,
//     default: true
//   },
//   showTracking: {
//     type: Boolean,
//     default: true
//   },
//   showRoom: {
//     type: Boolean,
//     default: true
//   },
//   showStatus: {
//     type: Boolean,
//     default: true
//   },
//   showUpdateAt: { type: Boolean, default: true },
//   showDeletedAt: { type: Boolean, default: false }
// })

function formatDateTime(datetimeStr) {
  if (!datetimeStr) return ''
  return datetimeStr.replace('T', ' ')
}
const getInitial = (name) => {
  if (!name) return ''
  return name.trim()[0].toUpperCase()
}

const authStore = useAuthManager()

// const userName = computed(() => authStore.user?.fullName || 'Courier')

// const userInitial = computed(() =>
//   userName.value ? userName.value[0].toUpperCase() : 'C'
// )

// // กรณีใช้ p.photo
// // const hasAvatar = computed(() => !!p.photo)
// // const avatar = computed(() => p.photo)

// const avatar = computed(() => authStore.user?.photo || null)
// const hasAvatar = computed(() => !!avatar.value)
</script>
<template>
  <div class="sm:bg-white sm:rounded-lg sm:shadow w-full overflow-hidden">
    <table class="min-w-full text-left border-collapse">
      <thead
        class="hidden md:table-header-group bg-white border-t border-b border-[#185DC0] my-4"
      >
        <tr>
          <th
            v-if="showPhoto"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            Photo
          </th>
          <th
            v-if="showTracking"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            Tracking
          </th>

          <th
            v-if="showName"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            Name
          </th>
          <th
            v-if="showMemberName"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            Resident name
          </th>
          <th
            v-if="showMemberTrashName"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            Resident name
          </th>
          <th
            v-if="showStaffName"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            Staff name
          </th>
          <th
            v-if="showMobile"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            Mobile
          </th>
          <th
            v-if="showRoom"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            <div class="flex items-center gap-2">
              Room
              <div class="transition-transform duration-200 ease-out hover:scale-110">
                <slot name="sort-room"></slot>
              </div>
            </div>
          </th>

          <th class="px-4 py-3 text-sm font-semibold text-[#185DC0]">Email</th>

          <th
            v-if="showStatus"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
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
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            <div class="flex items-center gap-2">
              Updated At
              <div class="transition-transform duration-200 ease-out hover:scale-110">
                <slot name="sort-date"></slot>
              </div>
            </div>
          </th>
          <!-- <th
            v-if="showDeletedAt"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            <div class="flex items-center gap-2">
              Deleted At
              <div class="transition-transform duration-200 ease-out hover:scale-110">
                <slot name="sort-date"></slot>
              </div>
            </div>
          </th> -->
          <th
            v-if="showActionStatus"
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
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
            class="px-4 py-3 text-sm font-semibold text-[#185DC0]"
          >
            <div class="flex items-center gap-2">
              Deleted At
              <div class="transition-transform duration-200 ease-out hover:scale-110">
                <slot name="sort-date"></slot>
              </div>
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
          class="md:table-row flex flex-col md:flex-row bg-gray-50 md:bg-white rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 shadow md:shadow-none"
        >
          <td
            v-if="showPhoto"
            class="px-4 py-2 md:py-3 border-b md:border-none"
          >
            <div class="flex items-center gap-2">
              <span class="md:hidden font-semibold text-[#185DC0]">Photo:</span>

              <div
                class="w-10 h-10 inline-flex flex-shrink-0 rounded-full overflow-hidden border border-gray-200 shadow-sm items-center justify-center"
              >
                <img
                  v-if="p.photo"
                  :src="p.photo"
                  class="w-full h-full object-cover"
                />

                <div
                  v-else
                  class="w-full h-full bg-[#185DC0] flex items-center justify-center text-white text-sm font-semibold"
                >
                  {{ getInitial(p.fullName) || getInitial(p.firstName) }}
                </div>
              </div>
            </div>
          </td>
          <td
            v-if="showTracking"
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-[#185DC0]"
              >Tracking:
            </span>
            {{ p.trackingNumber }}
          </td>

          <td
            v-if="showName"
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-[#185DC0]">Name:</span>
            {{ p.recipientName }}
          </td>

          <td
            v-if="showMemberTrashName"
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-[#185DC0]">
              Resident name:
            </span>
            {{ p.firstName }} {{ p.lastName }}
          </td>
          <td
            v-if="showMemberName"
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-[#185DC0]">
              Resident name:
            </span>
            {{ p.fullName }}
          </td>
          <td
            v-if="showStaffName"
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-[#185DC0]">
              Staff name:
            </span>
            {{ p.fullName }}
          </td>
          <td
            v-if="showMobile"
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-[#185DC0]">Mobile:</span>
            {{ p.mobile }}
          </td>

          <td
            v-if="showRoom"
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-[#185DC0]">Room: </span>
            {{ p.roomNumber }}
          </td>

          <td
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-[#185DC0]">Email: </span>
            {{ p.email }}
          </td>

          <td
            v-if="showStatus"
            class="px-4 py-2 md:py-3 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-[#185DC0] mr-2">Status:</span>

            <div class="relative group inline-block">
              <span
                class="px-3 py-1 rounded-full text-xs font-semibold text-white"
                :class="[
                  {
                    'bg-yellow-400': p.status === 'Waiting for Staff',
                    'bg-yellow-400': p.status === 'Pending',
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
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-[#185DC0]"
              >Updated At:</span
            >
            {{ formatDateTime(p.updateAt) }}
          </td>
            <td
            v-if="showActionStatus"
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-[#185DC0] mr-2">Status:</span>

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
          </td>
          <td
            v-if="showDeletedAt"
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
          >
            <span class="md:hidden font-semibold text-[#185DC0]"
              >Deleted At:</span
            >
            {{ formatDateTime(p.deletedAt) }}
          </td>
          <!-- <td
            v-if="showActionStatus"
            class="px-4 py-2 md:py-3 text-sm text-gray-700 border-b md:border-none"
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
            class="px-4 py-2 md:py-3 text-sm text-gray-700 flex items-center gap-1 md:table-cell md:gap-1 md:align-middle"
          >
            <span class="md:hidden font-semibold text-[#185DC0]">Action:</span>
            <div class="flex items-center gap-1">
            <button
              @click="$emit('view-detail', p.id)"
              class="relative group text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              <div class="transition-transform duration-200 ease-out group-hover:scale-110">
                <slot name="icon-view"></slot>
              </div>

              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
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
              @click="$emit('view-detail', p.id)"
              class="relative group text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              <div class="transition-transform duration-200 ease-out group-hover:scale-110">
                <slot name="icon-view-member"></slot>
              </div>

              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
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
              v-if="showDelete && p.status !== 'Picked Up'"
              @click="$emit('delete', p)"
              class="relative group cursor-pointer"
            >
              <div class="transition-transform duration-200 ease-out group-hover:scale-110">
                <slot name="icon-delete"></slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
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
              v-if="showDeleteResident"
              @click="$emit('delete', p)"
              class="relative group cursor-pointer"
            >
              <div class="transition-transform duration-200 ease-out group-hover:scale-110">
                <slot name="icon-delete"></slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
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
              v-if="showDelete && p.status !== 'Picked Up'"
              @click="$emit('delete', p)"
              class="relative group cursor-pointer"
            >
              <div class="transition-transform duration-200 ease-out group-hover:scale-110">
                <slot name="icon-delete-permanent"></slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
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
              v-if="showDeleteResident"
              @click="$emit('delete', p)"
              class="relative group cursor-pointer"
            >
              <div class="transition-transform duration-200 ease-out group-hover:scale-110">
                <slot name="icon-delete-permanent"></slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
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
              v-if="showRestore"
              @click="$emit('restore', p)"
              class="relative group cursor-pointer"
            >
              <div class="transition-transform duration-200 ease-out group-hover:scale-110">
                <slot name="restore-trash"> </slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
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
              v-if="showDeleteMember && p.role === 'RESIDENT'"
              @click="$emit('deleteMember', p)"
              class="relative group cursor-pointer"
            >
              <div class="transition-transform duration-200 ease-out group-hover:scale-110">
                <slot name="icon-delete"></slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
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
              v-if="showDeleteMember && p.role === 'RESIDENT'"
              @click="$emit('deleteMember', p)"
              class="relative group cursor-pointer"
            >
              <div class="transition-transform duration-200 ease-out group-hover:scale-110">
                <slot name="icon-delete-permanent"></slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
              >
                <div
                  class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  Delete Member
                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
            <button
              v-if="showRestoreMember"
              @click="$emit('restoreMember', p)"
              class="relative group cursor-pointer"
            >
              <div class="transition-transform duration-200 ease-out group-hover:scale-110">
                <slot name="restore-trash"> </slot>
              </div>
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
              >
                <div
                  class="relative rounded-lg bg-gray-400 min-w-[130px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  Restore Members

                  <div class="absolute left-1/2 top-full -translate-x-1/2">
                    <div
                      class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-400"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
            </div>
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
      :disabled="!canNext"
      class="cursor-pointer px-3 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
    >
      Next &gt;
    </button>
  </div>
</template>
