<script setup>
import UserInfo from '@/components/UserInfo.vue'
import { computed } from 'vue'
import { useAuthManager } from '@/stores/AuthManager'
import { useRouter } from 'vue-router'
import { useNotificationManager } from '@/stores/NotificationManager'

const authStore = useAuthManager()
const router = useRouter()
const notificationStore = useNotificationManager()

const emit = defineEmits(['toggle-sidebar'])

const role = computed(() => authStore.user?.role)

const toggleSidebar = () => {
  emit('toggle-sidebar')
}

const openNotification = () => {
  router.replace({ name: 'notification' })
}
const showNotification = computed(
  () => role.value === 'STAFF' || role.value === 'RESIDENT'
)
</script>

<template>
  <header class="flex items-center w-full h-16 bg-white">
    <div
      class="flex-1 bg-white flex justify-end items-center px-4 shadow h-full"
    >
      <svg
        v-if="showNotification"
        @click="toggleSidebar"
        class="md:hidden mr-4 cursor-pointer"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M3 7H21M3 12H21M3 17H21"
          stroke="black"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>

      <div class="flex-1 flex justify-end items-center gap-5">
        <div class="relative group">
          <div class="relative">
            <div class="transition-transform duration-200 ease-out hover:scale-110">
            <svg
              v-if="showNotification && authStore.user.role === 'RESIDENT'"
              @click="openNotification"
              class="cursor-pointer"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clip-path="url(#clip0_84_935)">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M6.12715 0.5C6.58315 0.5 7.03215 0.568 7.46115 0.697C7.14875 1.2667 6.98973 1.90779 6.99968 2.55745C7.00962 3.2071 7.18819 3.84302 7.51788 4.40289C7.84757 4.96276 8.31707 5.42737 8.88037 5.75117C9.44366 6.07497 10.0814 6.24687 10.7311 6.25V8.477C10.7311 8.56835 10.7492 8.65881 10.7841 8.7432C10.8191 8.82758 10.8704 8.90424 10.9351 8.96879C10.9997 9.03334 11.0764 9.08452 11.1609 9.11938C11.2453 9.15425 11.3358 9.17213 11.4271 9.172C11.6261 9.172 11.8168 9.25102 11.9575 9.39167C12.0981 9.53232 12.1771 9.72309 12.1771 9.922C12.1771 10.1209 12.0981 10.3117 11.9575 10.4523C11.8168 10.593 11.6261 10.672 11.4271 10.672H0.827148C0.628236 10.672 0.437471 10.593 0.296818 10.4523C0.156166 10.3117 0.0771484 10.1209 0.0771484 9.922C0.0771484 9.72309 0.156166 9.53232 0.296818 9.39167C0.437471 9.25102 0.628236 9.172 0.827148 9.172C0.918501 9.17213 1.00898 9.15425 1.09342 9.11938C1.17786 9.08452 1.25459 9.03334 1.31923 8.96879C1.38388 8.90424 1.43516 8.82758 1.47015 8.7432C1.50514 8.65881 1.52315 8.56835 1.52315 8.477V5.104C1.52315 3.88294 2.00821 2.7119 2.87163 1.84848C3.73505 0.985063 4.90609 0.5 6.12715 0.5ZM5.12715 12C4.92824 12 4.73747 12.079 4.59682 12.2197C4.45617 12.3603 4.37715 12.5511 4.37715 12.75C4.37715 12.9489 4.45617 13.1397 4.59682 13.2803C4.73747 13.421 4.92824 13.5 5.12715 13.5H7.12715C7.32606 13.5 7.51683 13.421 7.65748 13.2803C7.79813 13.1397 7.87715 12.9489 7.87715 12.75C7.87715 12.5511 7.79813 12.3603 7.65748 12.2197C7.51683 12.079 7.32606 12 7.12715 12H5.12715Z"
                  fill="black"
                />
                <path
                  d="M10.75 5C11.413 5 12.0489 4.73661 12.5178 4.26777C12.9866 3.79893 13.25 3.16304 13.25 2.5C13.25 1.83696 12.9866 1.20107 12.5178 0.732233C12.0489 0.263392 11.413 0 10.75 0C10.087 0 9.45107 0.263392 8.98223 0.732233C8.51339 1.20107 8.25 1.83696 8.25 2.5C8.25 3.16304 8.51339 3.79893 8.98223 4.26777C9.45107 4.73661 10.087 5 10.75 5Z"
                  fill="#FFCC00"
                />
              </g>
              <defs>
                <clipPath id="clip0_84_935">
                  <rect width="14" height="14" fill="white" />
                </clipPath>
              </defs>
            </svg>
            </div>
            <div
              v-if="
                notificationStore.unreadCount > 0 && role === 'RESIDENT'
              "
              class="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-white"
            >
              {{
                notificationStore.unreadCount > 99
                  ? '99+'
                  : notificationStore.unreadCount
              }}
            </div>
          </div>

          <div
            class="pointer-events-none absolute top-full left-1/2 z-20 mt-3 -translate-x-1/2 opacity-0 -translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
          >
            <div
              class="relative rounded-lg bg-gray-400 min-w-[150px] px-4 py-2 text-xs font-medium text-white text-center shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
            >
              Notifications

              <div class="absolute left-1/2 bottom-full -translate-x-1/2">
                <div
                  class="mx-auto h-0 w-0 border-l-[7px] border-r-[7px] border-b-[7px] border-l-transparent border-r-transparent border-b-gray-400"
                ></div>
              </div>
            </div>
          </div>
        </div>
        <UserInfo />
      </div>
    </div>
  </header>
</template>
